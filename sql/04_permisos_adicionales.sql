/*
╔═══════════════════════════════════════════════════════════════════════════════╗
║  SCRIPT MAESTRO: Instalación completa FASE 1                                 ║
║  Sistema de Gestión de Hospital                                              ║
║                                                                               ║
║  IMPORTANTE: Ejecutar este script como usuario con permisos de DBA          ║
║              después de otorgar permisos básicos a javauser                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

ORDEN DE EJECUCIÓN:
1. 01_agregar_campo_monto.sql
2. 02_procedimientos_almacenados.sql
3. 03_validaciones_constraints.sql
4. 04_permisos_adicionales.sql (este archivo)

*/

USE GestorHospitalDB;
GO

PRINT '╔═══════════════════════════════════════════════════════════════╗';
PRINT '║  SISTEMA DE GESTIÓN HOSPITAL - FASE 1                        ║';
PRINT '║  Instalación de Permisos Adicionales                         ║';
PRINT '╚═══════════════════════════════════════════════════════════════╝';
PRINT '';
GO

-- ════════════════════════════════════════════════════════════════════
-- PASO 1: Otorgar permisos sobre tabla Pago (con campo Monto)
-- ════════════════════════════════════════════════════════════════════
PRINT '💰 Otorgando permisos sobre tabla Pago...';
GRANT SELECT, INSERT, UPDATE ON dbo.Pago TO javauser;
PRINT '✅ Permisos sobre Pago otorgados';
GO

-- ════════════════════════════════════════════════════════════════════
-- PASO 2: Otorgar permisos sobre tabla Bitacora
-- ════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '📝 Otorgando permisos sobre tabla Bitacora...';
GRANT SELECT, INSERT ON dbo.Bitacora TO javauser;
PRINT '✅ Permisos sobre Bitacora otorgados (solo SELECT e INSERT)';
GO

-- ════════════════════════════════════════════════════════════════════
-- PASO 3: Otorgar permisos sobre tabla Citas (INSERT y UPDATE)
-- ════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '📅 Otorgando permisos sobre tabla Citas...';
GRANT INSERT, UPDATE ON dbo.Citas TO javauser;
PRINT '✅ Permisos sobre Citas actualizados (INSERT y UPDATE)';
GO

-- ════════════════════════════════════════════════════════════════════
-- PASO 4: Otorgar permisos de ejecución sobre nuevos SPs
-- ════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '⚙️  Otorgando permisos de ejecución sobre procedimientos...';
GRANT EXECUTE ON dbo.SP_RegistrarPago TO javauser;
GRANT EXECUTE ON dbo.SP_CancelarCita TO javauser;
GRANT EXECUTE ON dbo.SP_CancelarCitasExpiradas TO javauser;
PRINT '✅ Permisos de ejecución otorgados';
GO

-- ════════════════════════════════════════════════════════════════════
-- PASO 5: Verificar permisos
-- ════════════════════════════════════════════════════════════════════
PRINT '';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '📋 VERIFICACIÓN DE PERMISOS OTORGADOS:';
PRINT '══════════════════════════════════════════════════════════════════';

SELECT 
    USER_NAME(grantee_principal_id) AS Usuario,
    OBJECT_NAME(major_id) AS Objeto,
    permission_name AS Permiso,
    state_desc AS Estado
FROM sys.database_permissions
WHERE grantee_principal_id = USER_ID('javauser')
AND OBJECT_NAME(major_id) IN ('Pago', 'Bitacora', 'Citas', 'SP_RegistrarPago', 'SP_CancelarCita', 'SP_CancelarCitasExpiradas')
ORDER BY Objeto, Permiso;
GO

PRINT '';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '✅ FASE 1 - INSTALACIÓN COMPLETADA EXITOSAMENTE';
PRINT '══════════════════════════════════════════════════════════════════';
PRINT '';
PRINT '📌 PRÓXIMOS PASOS:';
PRINT '  1. Implementar endpoints en el backend (Node.js)';
PRINT '  2. Configurar tarea programada para SP_CancelarCitasExpiradas';
PRINT '  3. Probar el flujo completo de:';
PRINT '     - Creación de cita';
PRINT '     - Registro de pago';
PRINT '     - Cancelación con reembolso';
PRINT '     - Expiración automática';
PRINT '';
GO
