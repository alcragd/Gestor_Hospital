/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║  SCRIPT: Validaciones y Constraints - Reglas de Negocio                      ║
║  FASE 1: Sistema de Gestión de Hospital                                      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
*/

USE GestorHospitalDB;
GO

PRINT '══════════════════════════════════════════════════════════════════';
PRINT '🔧 CREANDO VALIDACIONES Y CONSTRAINTS';
PRINT '══════════════════════════════════════════════════════════════════';
GO

-- ════════════════════════════════════════════════════════════════════
-- CONSTRAINT 1: No permitir fechas pasadas
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('CK_Citas_Fecha_Futura', 'C') IS NOT NULL
    ALTER TABLE Citas DROP CONSTRAINT CK_Citas_Fecha_Futura;
GO

ALTER TABLE Citas
ADD CONSTRAINT CK_Citas_Fecha_Futura
CHECK (Fecha_cita >= CAST(GETDATE() AS DATE));
GO

PRINT '✅ Constraint: No fechas pasadas';
GO

-- ════════════════════════════════════════════════════════════════════
-- TRIGGER 1: Validar reglas de negocio al crear cita
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('TRG_Validar_Cita_Insert', 'TR') IS NOT NULL
    DROP TRIGGER TRG_Validar_Cita_Insert;
GO

CREATE TRIGGER TRG_Validar_Cita_Insert
ON Citas
INSTEAD OF INSERT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Id_Doctor INT;
    DECLARE @Id_Paciente INT;
    DECLARE @Fecha_Cita DATE;
    DECLARE @Hora_Inicio TIME;
    DECLARE @Hora_Fin TIME;
    DECLARE @Dias_Anticipacion INT;
    DECLARE @Meses_Anticipacion INT;
    
    -- Obtener datos de la cita a insertar
    SELECT 
        @Id_Doctor = Id_Doc,
        @Id_Paciente = ID_Paciente,
        @Fecha_Cita = Fecha_cita,
        @Hora_Inicio = Hora_Inicio,
        @Hora_Fin = Hora_Fin
    FROM inserted;
    
    -- ════════════════════════════════════════════════════════════
    -- REGLA 1: Mínimo 48 horas de anticipación
    -- ════════════════════════════════════════════════════════════
    SET @Dias_Anticipacion = DATEDIFF(DAY, CAST(GETDATE() AS DATE), @Fecha_Cita);
    
    IF @Dias_Anticipacion < 2
    BEGIN
        RAISERROR('La cita debe agendarse con mínimo 48 horas de anticipación', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- ════════════════════════════════════════════════════════════
    -- REGLA 2: Máximo 3 meses de anticipación
    -- ════════════════════════════════════════════════════════════
    SET @Meses_Anticipacion = DATEDIFF(MONTH, CAST(GETDATE() AS DATE), @Fecha_Cita);
    
    IF @Meses_Anticipacion > 3
    BEGIN
        RAISERROR('La cita no puede agendarse con más de 3 meses de anticipación', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- ════════════════════════════════════════════════════════════
    -- REGLA 3: No solapamiento de citas del doctor
    -- ════════════════════════════════════════════════════════════
    IF EXISTS (
        SELECT 1 
        FROM Citas 
        WHERE Id_Doc = @Id_Doctor
        AND Fecha_cita = @Fecha_Cita
        AND ID_Estatus IN (1, 2)  -- Pendiente de pago o Pagada
        AND (
            (@Hora_Inicio >= Hora_Inicio AND @Hora_Inicio < Hora_Fin)
            OR (@Hora_Fin > Hora_Inicio AND @Hora_Fin <= Hora_Fin)
            OR (@Hora_Inicio <= Hora_Inicio AND @Hora_Fin >= Hora_Fin)
        )
    )
    BEGIN
        RAISERROR('El doctor ya tiene una cita en ese horario', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- ════════════════════════════════════════════════════════════
    -- REGLA 4: No dos citas pendientes mismo paciente-doctor
    -- ════════════════════════════════════════════════════════════
    IF EXISTS (
        SELECT 1 
        FROM Citas 
        WHERE Id_Doc = @Id_Doctor
        AND ID_Paciente = @Id_Paciente
        AND ID_Estatus IN (1, 2)  -- Pendiente de pago o Pagada
        AND Fecha_cita >= CAST(GETDATE() AS DATE)
    )
    BEGIN
        RAISERROR('El paciente ya tiene una cita pendiente con este doctor', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- ════════════════════════════════════════════════════════════
    -- REGLA 5: Verificar horario laboral del doctor
    -- ════════════════════════════════════════════════════════════
    DECLARE @Dia_Semana VARCHAR(20);
    
    -- Note: DATEFIRST is set to 1 (Monday), so:
    -- 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
    SET @Dia_Semana = CASE DATEPART(WEEKDAY, @Fecha_Cita)
        WHEN 1 THEN 'Lunes'
        WHEN 2 THEN 'Martes'
        WHEN 3 THEN 'Miércoles'
        WHEN 4 THEN 'Jueves'
        WHEN 5 THEN 'Viernes'
        WHEN 6 THEN 'Sábado'
        WHEN 7 THEN 'Domingo'
    END;
    
    IF NOT EXISTS (
        SELECT 1
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        INNER JOIN Empleado_Horario EH ON E.Id_Empleado = EH.Id_Empleado
        INNER JOIN Horario H ON EH.Id_Horario = H.Id_Horario
        WHERE D.Id_Doctor = @Id_Doctor
        AND H.Dia_Semana = @Dia_Semana
        AND @Hora_Inicio >= H.Hora_Inicio
        AND @Hora_Fin <= H.Hora_Fin
    )
    BEGIN
        RAISERROR('La cita está fuera del horario laboral del doctor', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- ════════════════════════════════════════════════════════════
    -- Si todas las validaciones pasan, insertar la cita
    -- ════════════════════════════════════════════════════════════
    INSERT INTO Citas (Id_Doc, ID_Paciente, ID_Estatus, Fecha_Solicitud, Fecha_cita, Hora_Inicio, Hora_Fin)
    SELECT Id_Doc, ID_Paciente, ID_Estatus, Fecha_Solicitud, Fecha_cita, Hora_Inicio, Hora_Fin
    FROM inserted;
    
END
GO

PRINT '✅ Trigger: TRG_Validar_Cita_Insert';
GO

-- ════════════════════════════════════════════════════════════════════
-- TRIGGER 2: Validar transiciones de estatus
-- ════════════════════════════════════════════════════════════════════
IF OBJECT_ID('TRG_Validar_Transicion_Estatus', 'TR') IS NOT NULL
    DROP TRIGGER TRG_Validar_Transicion_Estatus;
GO

CREATE TRIGGER TRG_Validar_Transicion_Estatus
ON Citas
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Solo validar si cambió el estatus
    IF UPDATE(ID_Estatus)
    BEGIN
        DECLARE @Estatus_Anterior INT;
        DECLARE @Estatus_Nuevo INT;
        
        SELECT @Estatus_Anterior = ID_Estatus FROM deleted;
        SELECT @Estatus_Nuevo = ID_Estatus FROM inserted;
        
        -- Definir transiciones válidas
        -- 1 (Agendada) -> 2 (Pagada) o 3 (Cancelada Falta Pago)
        -- 2 (Pagada) -> 4 (Cancelada Paciente), 5 (Cancelada Doctor), 6 (Atendida), 7 (No acudió)
        -- Estados finales (3,4,5,6,7) NO pueden cambiar
        
        DECLARE @Transicion_Valida BIT = 0;
        
        IF @Estatus_Anterior = 1 AND @Estatus_Nuevo IN (2, 3)
            SET @Transicion_Valida = 1;
        ELSE IF @Estatus_Anterior = 2 AND @Estatus_Nuevo IN (4, 5, 6, 7)
            SET @Transicion_Valida = 1;
        
        IF @Transicion_Valida = 0
        BEGIN
            RAISERROR('Transición de estatus no permitida', 16, 1);
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
END
GO

PRINT '✅ Trigger: TRG_Validar_Transicion_Estatus';
GO

PRINT '';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '✅ VALIDACIONES Y CONSTRAINTS CREADOS EXITOSAMENTE';
PRINT '══════════════════════════════════════════════════════════════════';
GO
