const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// GET /api/citas/paciente/:id
router.get('/paciente/:id', async (req, res) => {
const id = req.params.id;

try {
    const pool = await db.connect();
    
    // Si el id es Id_User, traducir a ID_Paciente
// Línea 14 - SOLO 2 PARÁMETROS
const pacienteRes = await pool.request()
    .input('id', id)  // ✅ CORRECTO: Solo nombre y valor
    .query(`SELECT ID_Paciente FROM Pacientes WHERE ID_Paciente = @id OR Id_User = @id`);

    if (pacienteRes.recordset.length === 0) {
        return res.json([]);
    }

    const pacienteId = pacienteRes.recordset[0].ID_Paciente;

    const citasRes = await pool.request()
        .input('paciente', db.sql.Int, pacienteId)
        .query(`
            SELECT c.Id_Cita, c.Id_Doc, c.ID_Paciente, c.ID_Estatus, 
                    c.Fecha_Solicitud, c.Fecha_cita,
                    c.Hora_Inicio, c.Hora_Fin,
                    d.Id_Doctor, e.Nombre AS Especialidad,
                    emp.Nombre + ' ' + emp.Paterno AS Nombre_Doctor
            FROM Citas c
            LEFT JOIN Doctores d ON d.Id_Doctor = c.Id_Doc
            LEFT JOIN Especialidades e ON e.Id_Especialidad = d.Id_Especialidad
            LEFT JOIN Empleados emp ON emp.Id_Empleado = d.Id_Empleado
            WHERE c.ID_Paciente = @paciente
            ORDER BY c.Fecha_cita DESC, c.Hora_Inicio DESC
        `);

    res.json(citasRes.recordset || []);
    
} catch (err) {
    console.error('Error GET /api/citas/paciente/:id', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
}
});

module.exports = router;