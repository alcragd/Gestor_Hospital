const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

/**
 * Middleware de autorización
 * Solo recepcionistas y administradores pueden consultar bitácoras
 */
function requiereAccesoBitacoras(req, res, next) {
    const userId = parseInt(req.headers['x-user-id'], 10);
    const userRole = parseInt(req.headers['x-user-role'], 10);
    
    // Rol 3 = Recepcionista, podríamos agregar rol de administrador
    if (!userId || ![3].includes(userRole)) {
        return res.status(403).json({
            message: 'Acceso restringido. Solo recepcionistas pueden consultar bitácoras',
            requiredRole: 'Recepcionista (rol 3)'
        });
    }
    
    next();
}

// Aplicar middleware a todas las rutas
router.use(requiereAccesoBitacoras);

// ═══════════════════════════════════════════════════════════════
// GET /api/bitacoras/citas
// Obtener historial de cambios de estatus de citas con filtros
// ═══════════════════════════════════════════════════════════════

router.get('/citas', async (req, res) => {
    try {
        const { 
            desde, 
            hasta, 
            estatus, 
            usuario,
            paciente,
            doctor 
        } = req.query;
        
        let pool = await db.connect();
        let query = `
            SELECT 
                B.Id_Bitacora,
                B.Id_Cita,
                C.Fecha_cita,
                C.Hora_Inicio,
                C.Hora_Fin,
                
                -- Paciente
                P.Id_Paciente,
                P.Nombre + ' ' + P.Paterno + ISNULL(' ' + P.Materno, '') AS Paciente,
                
                -- Doctor
                D.Id_Doctor,
                EMPDOC.Nombre + ' ' + EMPDOC.Paterno AS Doctor,
                ESP.Nombre AS Especialidad,
                
                -- Cambio de estatus
                B.Estatus_Anterior,
                EA.Nombre AS Nombre_Estatus_Anterior,
                B.Estatus_Nuevo,
                EN.Nombre AS Nombre_Estatus_Nuevo,
                
                -- Usuario que hizo el cambio
                B.Usuario_Modifico,
                B.Nombre_Usuario,
                B.Rol_Usuario,
                
                -- Detalles
                B.Fecha_Cambio,
                B.Monto_Devuelto,
                B.Motivo,
                B.Tipo_Cancelacion
                
            FROM Bitacora_Estatus_Citas B
            INNER JOIN Citas C ON B.Id_Cita = C.Id_Cita
            INNER JOIN Pacientes P ON C.Id_Paciente = P.Id_Paciente
            INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
            INNER JOIN Empleados EMPDOC ON D.Id_Empleado = EMPDOC.Id_Empleado
            INNER JOIN Especialidades ESP ON D.Id_Especialidad = ESP.Id_Especialidad
            LEFT JOIN Estatus_Cita EA ON B.Estatus_Anterior = EA.Id_Estatus
            INNER JOIN Estatus_Cita EN ON B.Estatus_Nuevo = EN.Id_Estatus
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        // Filtro por fechas
        if (desde) {
            query += ` AND B.Fecha_Cambio >= @desde`;
            request.input('desde', db.sql.DateTime2, desde);
        }
        if (hasta) {
            query += ` AND B.Fecha_Cambio <= @hasta`;
            request.input('hasta', db.sql.DateTime2, hasta);
        }
        
        // Filtro por estatus nuevo
        if (estatus) {
            query += ` AND B.Estatus_Nuevo = @estatus`;
            request.input('estatus', db.sql.Int, parseInt(estatus));
        }
        
        // Filtro por usuario que hizo el cambio
        if (usuario) {
            query += ` AND B.Usuario_Modifico = @usuario`;
            request.input('usuario', db.sql.Int, parseInt(usuario));
        }
        
        // Filtro por paciente
        if (paciente) {
            query += ` AND P.Id_Paciente = @paciente`;
            request.input('paciente', db.sql.Int, parseInt(paciente));
        }
        
        // Filtro por doctor
        if (doctor) {
            query += ` AND D.Id_Doctor = @doctor`;
            request.input('doctor', db.sql.Int, parseInt(doctor));
        }
        
        query += ` ORDER BY B.Fecha_Cambio DESC`;
        
        const result = await request.query(query);
        
        res.json({
            success: true,
            total: result.recordset.length,
            registros: result.recordset
        });
        
    } catch (error) {
        console.error('❌ Error GET /api/bitacoras/citas:', error);
        res.status(500).json({
            message: 'Error al obtener bitácora de citas',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/bitacoras/citas/:id
// Obtener historial completo de cambios de UNA cita específica
// ═══════════════════════════════════════════════════════════════

router.get('/citas/:id', async (req, res) => {
    try {
        const idCita = parseInt(req.params.id, 10);
        
        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }
        
        let pool = await db.connect();
        const result = await pool.request()
            .input('idCita', db.sql.Int, idCita)
            .execute('SP_Consultar_Bitacora_Cita');
        
        res.json({
            success: true,
            id_cita: idCita,
            total_cambios: result.recordset.length,
            cambios: result.recordset
        });
        
    } catch (error) {
        console.error(`❌ Error GET /api/bitacoras/citas/${req.params.id}:`, error);
        res.status(500).json({
            message: 'Error al obtener historial de cita',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/bitacoras/historial/:idPaciente
// Obtener historial de accesos médicos de un paciente
// ═══════════════════════════════════════════════════════════════

router.get('/historial/:idPaciente', async (req, res) => {
    try {
        const idPaciente = parseInt(req.params.idPaciente, 10);
        const { desde, hasta } = req.query;
        
        if (isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        let pool = await db.connect();
        const request = pool.request()
            .input('idPaciente', db.sql.Int, idPaciente);

        if (desde) {
            request.input('fechaDesde', db.sql.DateTime2, new Date(desde));
        }
        if (hasta) {
            request.input('fechaHasta', db.sql.DateTime2, new Date(hasta));
        }

        const query = `
            SELECT 
                B.Id_Bitacora,
                B.Id_Cita,
                C.Fecha_cita,
                C.Hora_Inicio,
                CONCAT(EMD.Nombre, ' ', EMD.Paterno, ' ', ISNULL(EMD.Materno, '')) AS Doctor_Atencion,
                ESP.Nombre AS Especialidad,
                B.Usuario_Acceso,
                B.Nombre_Usuario,
                B.Rol_Usuario,
                B.Tipo_Accion,
                B.Fecha_Accion,
                B.Id_Receta,
                B.Detalles,
                B.IP_Origen
            FROM Bitacora_Historial_Medico B
            LEFT JOIN Citas C ON B.Id_Cita = C.Id_Cita
            LEFT JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
            LEFT JOIN Empleados EMD ON D.Id_Empleado = EMD.Id_Empleado
            LEFT JOIN Especialidades ESP ON D.Id_Especialidad = ESP.Id_Especialidad
            WHERE B.Id_Paciente = @idPaciente
            ${desde ? 'AND B.Fecha_Accion >= @fechaDesde' : ''}
            ${hasta ? 'AND B.Fecha_Accion <= @fechaHasta' : ''}
            ORDER BY B.Fecha_Accion DESC`;

        const result = await request.query(query);

        res.json({
            success: true,
            id_paciente: idPaciente,
            total_accesos: result.recordset.length,
            accesos: result.recordset
        });

    } catch (error) {
        console.error(`❌ Error GET /api/bitacoras/historial/${req.params.idPaciente}:`, error);
        res.status(500).json({
            message: 'Error al obtener historial de accesos',
            details: error.message
        });
    }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/bitacoras/estadisticas
// Obtener estadísticas generales de cambios de estatus
// ═══════════════════════════════════════════════════════════════

router.get('/estadisticas', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        
        let pool = await db.connect();
        const request = pool.request();
        
        if (desde) {
            request.input('desde', db.sql.DateTime2, desde);
        }
        if (hasta) {
            request.input('hasta', db.sql.DateTime2, hasta);
        }
        
        const query = `
            -- Total de cambios por estatus
            SELECT 
                'cambios_por_estatus' AS tipo_estadistica,
                EN.Nombre AS estatus,
                COUNT(*) AS total
            FROM Bitacora_Estatus_Citas B
            INNER JOIN Estatus_Cita EN ON B.Estatus_Nuevo = EN.Id_Estatus
            WHERE 1=1
                ${desde ? 'AND B.Fecha_Cambio >= @desde' : ''}
                ${hasta ? 'AND B.Fecha_Cambio <= @hasta' : ''}
            GROUP BY EN.Nombre
            
            UNION ALL
            
            -- Total de cancelaciones por tipo
            SELECT 
                'cancelaciones_por_tipo' AS tipo_estadistica,
                ISNULL(Tipo_Cancelacion, 'No especificado') AS estatus,
                COUNT(*) AS total
            FROM Bitacora_Estatus_Citas
            WHERE 1=1
                ${desde ? 'AND Fecha_Cambio >= @desde' : ''}
                ${hasta ? 'AND Fecha_Cambio <= @hasta' : ''}
                AND Tipo_Cancelacion IS NOT NULL
            GROUP BY Tipo_Cancelacion
            
            UNION ALL
            
            -- Monto total devuelto
            SELECT 
                'monto_total_devuelto' AS tipo_estadistica,
                'Total' AS estatus,
                SUM(ISNULL(Monto_Devuelto, 0)) AS total
            FROM Bitacora_Estatus_Citas
            WHERE 1=1
                ${desde ? 'AND Fecha_Cambio >= @desde' : ''}
                ${hasta ? 'AND Fecha_Cambio <= @hasta' : ''}
                AND Monto_Devuelto IS NOT NULL
        `;
        
        const result = await request.query(query);
        
        // Organizar resultados por tipo
        const estadisticas = {
            cambios_por_estatus: [],
            cancelaciones_por_tipo: [],
            monto_total_devuelto: 0
        };
        
        result.recordset.forEach(row => {
            if (row.tipo_estadistica === 'cambios_por_estatus') {
                estadisticas.cambios_por_estatus.push({
                    estatus: row.estatus,
                    total: row.total
                });
            } else if (row.tipo_estadistica === 'cancelaciones_por_tipo') {
                estadisticas.cancelaciones_por_tipo.push({
                    tipo: row.estatus,
                    total: row.total
                });
            } else if (row.tipo_estadistica === 'monto_total_devuelto') {
                estadisticas.monto_total_devuelto = row.total;
            }
        });
        
        res.json({
            success: true,
            estadisticas
        });
        
    } catch (error) {
        console.error('❌ Error GET /api/bitacoras/estadisticas:', error);
        res.status(500).json({
            message: 'Error al obtener estadísticas',
            details: error.message
        });
    }
});

module.exports = router;
