/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║  SCRIPT: Procedimientos Almacenados - Sistema de Pagos y Cancelaciones       ║
║  FASE 1: Sistema de Gestión de Hospital                                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
*/

USE GestorHospitalDB;
GO

PRINT '══════════════════════════════════════════════════════════════════';
PRINT '🔧 CREANDO PROCEDIMIENTOS ALMACENADOS';
PRINT '══════════════════════════════════════════════════════════════════';
GO

-- ════════════════════════════════════════════════════════════════════
-- SP 1: Registrar Pago de Cita
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.SP_RegistrarPago', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_RegistrarPago;
GO

CREATE PROCEDURE SP_RegistrarPago
    @Id_Cita INT,
    @Metodo_Pago VARCHAR(50),
    @Usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Monto DECIMAL(10,2);
    DECLARE @Estatus_Actual INT;
    DECLARE @Fecha_Solicitud DATE;
    DECLARE @Horas_Transcurridas INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la cita existe
        IF NOT EXISTS (SELECT 1 FROM Citas WHERE Id_Cita = @Id_Cita)
        BEGIN
            RAISERROR('La cita no existe', 16, 1);
            RETURN;
        END
        
        -- Obtener estatus actual y fecha de solicitud
        SELECT 
            @Estatus_Actual = ID_Estatus,
            @Fecha_Solicitud = Fecha_Solicitud
        FROM Citas 
        WHERE Id_Cita = @Id_Cita;
        
        -- Validar que la cita está en estatus "Agendada - Pendiente de Pago"
        IF @Estatus_Actual <> 1
        BEGIN
            RAISERROR('La cita no está pendiente de pago', 16, 1);
            RETURN;
        END
        
        -- Verificar límite de 8 horas
        SET @Horas_Transcurridas = DATEDIFF(HOUR, CAST(@Fecha_Solicitud AS DATETIME), GETDATE());
        
        IF @Horas_Transcurridas > 8
        BEGIN
            -- Cancelar automáticamente la cita por falta de pago
            UPDATE Citas 
            SET ID_Estatus = 3  -- Cancelada - Falta de Pago
            WHERE Id_Cita = @Id_Cita;
            
            -- Registrar en bitácora
            INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
            VALUES (@Id_Cita, GETDATE(), @Usuario, 'Cita cancelada automáticamente por exceder 8 horas sin pago', 'UPDATE', 'Citas');
            
            RAISERROR('El plazo de 8 horas ha expirado. La cita fue cancelada automáticamente.', 16, 1);
            RETURN;
        END
        
        -- Obtener el monto de la especialidad
        SELECT @Monto = E.Precio
        FROM Citas C
        INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
        INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
        WHERE C.Id_Cita = @Id_Cita;
        
        -- Registrar el pago
        INSERT INTO Pago (Id_Cita, Hora, Metodo_Pago, Fecha, Monto)
        VALUES (@Id_Cita, CONVERT(TIME, GETDATE()), @Metodo_Pago, CAST(GETDATE() AS DATE), @Monto);
        
        -- Actualizar estatus de la cita a "Pagada - Pendiente por Atender"
        UPDATE Citas 
        SET ID_Estatus = 2
        WHERE Id_Cita = @Id_Cita;
        
        -- Registrar en bitácora
        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
        VALUES (@Id_Cita, GETDATE(), @Usuario, 
                'Pago registrado: $' + CAST(@Monto AS VARCHAR(10)) + ' - Método: ' + @Metodo_Pago, 
                'INSERT', 'Pago');
        
        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
        VALUES (@Id_Cita, GETDATE(), @Usuario, 
                'Estatus cambiado a: Pagada - Pendiente por Atender', 
                'UPDATE', 'Citas');
        
        COMMIT TRANSACTION;
        
        SELECT 
            'Pago registrado exitosamente' AS Mensaje,
            @Monto AS Monto,
            SCOPE_IDENTITY() AS Id_Pago;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT '✅ SP_RegistrarPago creado';
GO

-- ════════════════════════════════════════════════════════════════════
-- SP 2: Cancelar Cita con Reembolso
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.SP_CancelarCita', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CancelarCita;
GO

CREATE PROCEDURE SP_CancelarCita
    @Id_Cita INT,
    @Motivo VARCHAR(200),
    @Cancelado_Por VARCHAR(20),  -- 'Paciente', 'Doctor', 'Sistema'
    @Usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Estatus_Actual INT;
    DECLARE @Fecha_Cita DATE;
    DECLARE @Horas_Anticipacion INT;
    DECLARE @Porcentaje_Reembolso DECIMAL(5,2);
    DECLARE @Monto_Pago DECIMAL(10,2);
    DECLARE @Monto_Reembolso DECIMAL(10,2);
    DECLARE @Nuevo_Estatus INT;
    DECLARE @Id_Pago INT;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Verificar que la cita existe
        IF NOT EXISTS (SELECT 1 FROM Citas WHERE Id_Cita = @Id_Cita)
        BEGIN
            RAISERROR('La cita no existe', 16, 1);
            RETURN;
        END
        
        -- Obtener información de la cita
        SELECT 
            @Estatus_Actual = ID_Estatus,
            @Fecha_Cita = Fecha_cita
        FROM Citas 
        WHERE Id_Cita = @Id_Cita;
        
        -- Validar que la cita puede cancelarse
        IF @Estatus_Actual IN (3, 4, 5, 6, 7)  -- Ya cancelada o finalizada
        BEGIN
            RAISERROR('La cita no puede ser cancelada en su estatus actual', 16, 1);
            RETURN;
        END
        
        -- Determinar nuevo estatus según quién cancela
        SET @Nuevo_Estatus = CASE @Cancelado_Por
            WHEN 'Paciente' THEN 4  -- Cancelada - Paciente
            WHEN 'Doctor' THEN 5    -- Cancelada - Doctor
            ELSE 3                  -- Cancelada - Falta de Pago
        END;
        
        -- Calcular reembolso si la cita está pagada
        IF @Estatus_Actual = 2  -- Pagada - Pendiente por Atender
        BEGIN
            -- Obtener el pago
            SELECT TOP 1 @Id_Pago = Id_Pago, @Monto_Pago = Monto
            FROM Pago
            WHERE Id_Cita = @Id_Cita
            ORDER BY Id_Pago DESC;
            
            -- Si existe un pago, calcular reembolso
            IF @Id_Pago IS NOT NULL
            BEGIN
                -- Calcular horas de anticipación
                SET @Horas_Anticipacion = DATEDIFF(HOUR, GETDATE(), @Fecha_Cita);
                
                -- Determinar porcentaje de reembolso
                SET @Porcentaje_Reembolso = CASE
                    WHEN @Horas_Anticipacion >= 48 THEN 1.00  -- 100%
                    WHEN @Horas_Anticipacion >= 24 THEN 0.50  -- 50%
                    ELSE 0.00                                  -- 0%
                END;
                
                SET @Monto_Reembolso = @Monto_Pago * @Porcentaje_Reembolso;
                
                -- Registrar el reembolso (se guardará en bitácora)
                INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                VALUES (@Id_Pago, GETDATE(), @Usuario, 
                        'Reembolso: $' + CAST(@Monto_Reembolso AS VARCHAR(10)) + 
                        ' (' + CAST(CAST(@Porcentaje_Reembolso * 100 AS INT) AS VARCHAR(3)) + '%) - ' +
                        'Motivo: ' + @Motivo, 
                        'REEMBOLSO', 'Pago');
            END
            ELSE
            BEGIN
                SET @Monto_Reembolso = 0;
                SET @Porcentaje_Reembolso = 0;
            END
        END
        ELSE
        BEGIN
            SET @Monto_Reembolso = 0;
            SET @Porcentaje_Reembolso = 0;
        END
        
        -- Actualizar estatus de la cita
        UPDATE Citas 
        SET ID_Estatus = @Nuevo_Estatus
        WHERE Id_Cita = @Id_Cita;
        
        -- Registrar en bitácora
        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
        VALUES (@Id_Cita, GETDATE(), @Usuario, 
                'Cita cancelada por: ' + @Cancelado_Por + ' - Motivo: ' + @Motivo, 
                'UPDATE', 'Citas');
        
        COMMIT TRANSACTION;
        
        SELECT 
            'Cita cancelada exitosamente' AS Mensaje,
            @Monto_Reembolso AS Monto_Reembolso,
            CAST(@Porcentaje_Reembolso * 100 AS INT) AS Porcentaje_Reembolso;
            
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
            
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT '✅ SP_CancelarCita creado';
GO

-- ════════════════════════════════════════════════════════════════════
-- SP 3: Verificar y Cancelar Citas Expiradas (Job automático)
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('dbo.SP_CancelarCitasExpiradas', 'P') IS NOT NULL
    DROP PROCEDURE dbo.SP_CancelarCitasExpiradas;
GO

CREATE PROCEDURE SP_CancelarCitasExpiradas
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Citas_Canceladas INT = 0;
    
    BEGIN TRY
        -- Cancelar citas que excedieron 8 horas sin pago
        UPDATE Citas
        SET ID_Estatus = 3  -- Cancelada - Falta de Pago
        WHERE ID_Estatus = 1  -- Agendada - Pendiente de Pago
        AND DATEDIFF(HOUR, CAST(Fecha_Solicitud AS DATETIME), GETDATE()) > 8;
        
        SET @Citas_Canceladas = @@ROWCOUNT;
        
        -- Registrar en bitácora cada cita cancelada
        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
        SELECT 
            Id_Cita,
            GETDATE(),
            'Sistema',
            'Cita cancelada automáticamente por exceder 8 horas sin pago',
            'UPDATE',
            'Citas'
        FROM Citas
        WHERE ID_Estatus = 3
        AND DATEDIFF(HOUR, CAST(Fecha_Solicitud AS DATETIME), GETDATE()) > 8
        AND Id_Cita NOT IN (
            SELECT Id_Reg_Afectado 
            FROM Bitacora 
            WHERE Tabla_Afectada = 'Citas' 
            AND Detalles LIKE '%cancelada automáticamente%'
            AND CAST(Fecha_Hora AS DATE) = CAST(GETDATE() AS DATE)
        );
        
        SELECT 
            'Proceso completado' AS Mensaje,
            @Citas_Canceladas AS Citas_Canceladas;
            
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT '✅ SP_CancelarCitasExpiradas creado';
GO

PRINT '';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '✅ TODOS LOS PROCEDIMIENTOS CREADOS EXITOSAMENTE';
PRINT '══════════════════════════════════════════════════════════════════';
GO
