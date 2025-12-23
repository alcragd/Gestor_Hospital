-- Script para crear datos de prueba: Citas en estados válidos
-- Cita Programada y Cita Atendida (sin transición no permitida)

USE GestorHospitalDB;
GO

-- Verificar si ya existen citas de prueba para este paciente
IF NOT EXISTS (SELECT 1 FROM Citas WHERE ID_Paciente = 1 AND Id_Doc = 1 AND Fecha_cita > CAST(GETDATE() AS DATE))
BEGIN
    -- Insertar cita Programada (ID_Estatus=1) para usuario 23 (Paciente 1)
    INSERT INTO Citas (
        Id_Doc,
        ID_Paciente,
        ID_Estatus,
        Fecha_Solicitud,
        Fecha_cita,
        Hora_Inicio,
        Hora_Fin
    )
    VALUES (
        1,                                          -- Doctor 1 (Roberto Bravo)
        1,                                          -- Paciente 1 (Juan García)
        1,                                          -- Estatus: Programada
        GETDATE(),                                  -- Fecha solicitud
        DATEADD(DAY, 5, CONVERT(DATE, GETDATE())), -- 5 días adelante
        '10:00:00',
        '11:00:00'
    );
    
    PRINT '✅ Cita Programada creada para pruebas';
END
ELSE
BEGIN
    PRINT '⚠️ Cita Programada ya existe';
END

-- Verificar si existe cita atendida pasada
IF NOT EXISTS (SELECT 1 FROM Citas WHERE ID_Paciente = 1 AND Id_Doc = 1 AND Fecha_cita < CAST(GETDATE() AS DATE) AND ID_Estatus = 4)
BEGIN
    -- Insertar cita Atendida (ID_Estatus=4) en el pasado (hace 30 días)
    INSERT INTO Citas (
        Id_Doc,
        ID_Paciente,
        ID_Estatus,
        Fecha_Solicitud,
        Fecha_cita,
        Hora_Inicio,
        Hora_Fin
    )
    VALUES (
        1,                                            -- Doctor 1
        1,                                            -- Paciente 1
        4,                                            -- Estatus: Atendida
        DATEADD(DAY, -35, GETDATE()),                -- Solicitud hace 35 días
        DATEADD(DAY, -30, CONVERT(DATE, GETDATE())), -- Cita hace 30 días
        '14:00:00',
        '15:00:00'
    );
    
    PRINT '✅ Cita Atendida creada para pruebas';
END
ELSE
BEGIN
    PRINT '⚠️ Cita Atendida ya existe';
END

-- Mostrar citas creadas
PRINT '';
PRINT '📋 Citas de prueba para Paciente 1 / Doctor 1:';
SELECT 
    C.Id_Cita,
    C.Fecha_cita,
    C.Hora_Inicio,
    ES.Nombre AS Estatus,
    ES.Id_Estatus
FROM Citas C
INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
WHERE C.ID_Paciente = 1 AND C.Id_Doc = 1
ORDER BY C.Fecha_cita DESC;
