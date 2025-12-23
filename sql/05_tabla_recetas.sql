-- Script para crear tabla de Recetas Médicas
-- FASE 2: Doctor puede crear recetas médicas

USE GestorHospitalDB;
GO

-- Crear tabla Recetas si no existe
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Recetas')
BEGIN
    CREATE TABLE Recetas (
        Id_Receta INT IDENTITY(1,1) PRIMARY KEY,
        Id_Cita INT NOT NULL,
        Id_Doctor INT NOT NULL,
        ID_Paciente INT NOT NULL,
        Fecha_Emision DATETIME NOT NULL DEFAULT GETDATE(),
        Diagnostico NVARCHAR(500) NOT NULL,
        Indicaciones NVARCHAR(1000) NOT NULL,
        Medicamentos NVARCHAR(2000) NOT NULL,
        Observaciones NVARCHAR(500),
        Vigencia_Dias INT DEFAULT 30,
        Fecha_Vencimiento AS DATEADD(DAY, Vigencia_Dias, Fecha_Emision),
        Usuario_Registro NVARCHAR(50) NOT NULL,
        
        CONSTRAINT FK_Recetas_Cita FOREIGN KEY (Id_Cita) REFERENCES Citas(Id_Cita),
        CONSTRAINT FK_Recetas_Doctor FOREIGN KEY (Id_Doctor) REFERENCES Doctores(Id_Doctor),
        CONSTRAINT FK_Recetas_Paciente FOREIGN KEY (ID_Paciente) REFERENCES Pacientes(ID_Paciente)
    );
    
    PRINT '✅ Tabla Recetas creada exitosamente';
END
ELSE
BEGIN
    PRINT '⚠️ Tabla Recetas ya existe';
END
GO

-- Crear índices para optimizar queries
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Recetas_Cita')
BEGIN
    CREATE INDEX IX_Recetas_Cita ON Recetas(Id_Cita);
    PRINT '✅ Índice IX_Recetas_Cita creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Recetas_Doctor')
BEGIN
    CREATE INDEX IX_Recetas_Doctor ON Recetas(Id_Doctor);
    PRINT '✅ Índice IX_Recetas_Doctor creado';
END

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Recetas_Paciente')
BEGIN
    CREATE INDEX IX_Recetas_Paciente ON Recetas(ID_Paciente);
    PRINT '✅ Índice IX_Recetas_Paciente creado';
END
GO

PRINT '✅ Script de Recetas completado';
