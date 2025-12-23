/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║  FIX: Procedimiento CrearCita - Corregir obtención de ID después de trigger  ║
╚═══════════════════════════════════════════════════════════════════════════════╝
*/

USE GestorHospitalDB;
GO

PRINT '══════════════════════════════════════════════════════════════════';
PRINT '🔧 CORRIGIENDO PROCEDIMIENTO CrearCita';
PRINT '══════════════════════════════════════════════════════════════════';
GO

IF OBJECT_ID('dbo.CrearCita', 'P') IS NOT NULL
    DROP PROCEDURE dbo.CrearCita;
GO

CREATE PROCEDURE CrearCita
    @Id_Doctor INT,
    @Id_Paciente INT,
    @Fecha_Cita VARCHAR(10),
    @Hora_Inicio VARCHAR(8),
    @Hora_Fin VARCHAR(8),
    @Usuario VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET DATEFIRST 1;  -- Asegurar que Lunes = 1
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Convertir parámetros a tipos SQL adecuados
        DECLARE @FechaDate DATE = CAST(@Fecha_Cita AS DATE);
        DECLARE @HoraInicioTime TIME = CAST(@Hora_Inicio AS TIME);
        DECLARE @HoraFinTime TIME = CAST(@Hora_Fin AS TIME);
        
        -- Insertar la cita (el trigger INSTEAD OF INSERT manejará las validaciones)
        -- Como es INSTEAD OF, debemos obtener el ID de manera diferente
        INSERT INTO Citas (Id_Doc, ID_Paciente, ID_Estatus, Fecha_Solicitud, Fecha_cita, Hora_Inicio, Hora_Fin)
        VALUES (@Id_Doctor, @Id_Paciente, 1, GETDATE(), @FechaDate, @HoraInicioTime, @HoraFinTime);
        
        -- Obtener el ID de la cita recién creada buscando por los criterios únicos
        DECLARE @CitaId INT;
        SELECT TOP 1 @CitaId = Id_Cita
        FROM Citas
        WHERE Id_Doc = @Id_Doctor
          AND ID_Paciente = @Id_Paciente
          AND Fecha_cita = @FechaDate
          AND Hora_Inicio = @HoraInicioTime
          AND ID_Estatus = 1
        ORDER BY Fecha_Solicitud DESC;
        
        -- Verificar que se obtuvo el ID
        IF @CitaId IS NULL
        BEGIN
            RAISERROR('No se pudo obtener el ID de la cita creada', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Registrar en bitácora
        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
        VALUES (@CitaId, GETDATE(), @Usuario, 
                CONCAT('Nueva cita agendada - Doctor: ', @Id_Doctor, ', Paciente: ', @Id_Paciente, ', Fecha: ', @Fecha_Cita),
                'INSERT', 'Citas');
        
        COMMIT TRANSACTION;
        
        SELECT 'Cita creada exitosamente' AS Mensaje, @CitaId AS Id_Cita;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END
GO

PRINT '✅ CrearCita corregido';
GO

PRINT '';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '✅ CORRECCIÓN COMPLETADA';
PRINT '══════════════════════════════════════════════════════════════════';
GO
