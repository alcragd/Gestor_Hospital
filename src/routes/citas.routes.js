const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');
const db = require('../config/db.config');

// Helpers de autenticación
function getUserContext(req) {
  const userId = parseInt(req.headers['x-user-id'], 10);
  const role = parseInt(req.headers['x-user-role'], 10);
  return { userId, role };
}

// POST /api/citas/agendar -> Paciente agenda su cita con recibo
router.post('/agendar', citaController.agendarCitaPaciente);

// POST /api/citas -> Crear una nueva cita (legacy)
router.post('/', citaController.crearCita);

// GET /api/citas/paciente/:id -> Obtener todas las citas de un paciente (legacy)
router.get('/paciente/:id', citaController.getCitasPorPaciente);

// GET /api/citas/mis-citas -> Historial completo del paciente autenticado con filtros
router.get('/mis-citas', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 4) {
    return res.status(403).json({ message: 'Acceso restringido a citas de paciente' });
  }

  // Filtros opcionales: fecha_inicio, fecha_fin, estatus (puede ser array)
  const { fecha_inicio, fecha_fin, estatus } = req.query;

  let pool;
  try {
    pool = await db.connect();

    // Obtener ID_Paciente del usuario autenticado
    const pacienteRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query('SELECT ID_Paciente FROM Pacientes WHERE Id_User = @userId');

    if (pacienteRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    const pacienteId = pacienteRes.recordset[0].ID_Paciente;

    // Construir query con filtros
    let query = `
      SELECT 
        C.Id_Cita,
        C.Fecha_Solicitud,
        C.Fecha_cita,
        C.Hora_Inicio,
        C.Hora_Fin,
        E.Nombre AS Especialidad,
        E.Precio AS Costo,
        CONCAT(EM.Nombre, ' ', EM.Paterno, ' ', EM.Materno) AS Doctor,
        ES.Nombre AS Estatus,
        ES.Id_Estatus,
        CONS.Numero AS Consultorio,
        CONS.Piso AS Ubicacion_Consultorio
      FROM Citas C
      INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
      INNER JOIN Empleados EM ON D.Id_Empleado = EM.Id_Empleado
      INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
      INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
      LEFT JOIN Consultorio CONS ON E.ID_Consultorio = CONS.Id_Consultorio
      WHERE C.ID_Paciente = @pacienteId
    `;

    const request = pool.request().input('pacienteId', db.sql.Int, pacienteId);

    // Filtro por rango de fechas
    if (fecha_inicio) {
      query += ' AND C.Fecha_cita >= @fecha_inicio';
      request.input('fecha_inicio', db.sql.Date, fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND C.Fecha_cita <= @fecha_fin';
      request.input('fecha_fin', db.sql.Date, fecha_fin);
    }

    // Filtro por estatus (puede ser array o string)
    if (estatus) {
      const estatusArray = Array.isArray(estatus) ? estatus : [estatus];
      const estatusIds = estatusArray.map(e => parseInt(e, 10)).filter(e => !isNaN(e));
      
      if (estatusIds.length > 0) {
        query += ` AND C.ID_Estatus IN (${estatusIds.join(',')})`;
      }
    }

    query += ' ORDER BY C.Fecha_cita DESC, C.Hora_Inicio DESC';

    const result = await request.query(query);

    res.json({
      success: true,
      total: result.recordset.length,
      citas: result.recordset
    });

  } catch (error) {
    console.error('❌ Error GET /api/citas/mis-citas:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  } finally {
    // Usamos el pool global; no cerrar aquí para evitar ECONNCLOSED
  }
});

// GET /api/citas/mis-citas-doctor -> Historial de citas asignadas al doctor con filtros
router.get('/mis-citas-doctor', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  // Filtros opcionales: fecha_inicio, fecha_fin, estatus (puede ser array)
  const { fecha_inicio, fecha_fin, estatus } = req.query;

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Doctor del empleado autenticado
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT D.Id_Doctor, E.Nombre AS NombreEmpleado, E.Paterno, E.Materno
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctorId = doctorRes.recordset[0].Id_Doctor;

    // Construir query con filtros
    let query = `
      SELECT 
        C.Id_Cita,
        C.Fecha_Solicitud,
        C.Fecha_cita,
        C.Hora_Inicio,
        C.Hora_Fin,
        CONCAT(P.Nombre, ' ', P.Paterno, ' ', P.Materno) AS Paciente,
        P.ID_Paciente,
        E.Nombre AS Especialidad,
        E.Precio AS Costo,
        ES.Nombre AS Estatus,
        ES.Id_Estatus,
        CONS.Numero AS Consultorio,
        CONS.Piso AS Ubicacion_Consultorio
      FROM Citas C
      INNER JOIN Pacientes P ON C.ID_Paciente = P.ID_Paciente
      INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
      INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
      INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
      LEFT JOIN Consultorio CONS ON E.ID_Consultorio = CONS.Id_Consultorio
      WHERE C.Id_Doc = @doctorId
    `;

    const request = pool.request().input('doctorId', db.sql.Int, doctorId);

    // Filtro por rango de fechas
    if (fecha_inicio) {
      query += ' AND C.Fecha_cita >= @fecha_inicio';
      request.input('fecha_inicio', db.sql.Date, fecha_inicio);
    }
    if (fecha_fin) {
      query += ' AND C.Fecha_cita <= @fecha_fin';
      request.input('fecha_fin', db.sql.Date, fecha_fin);
    }

    // Filtro por estatus (puede ser array o string)
    if (estatus) {
      const estatusArray = Array.isArray(estatus) ? estatus : [estatus];
      const estatusIds = estatusArray.map(e => parseInt(e, 10)).filter(e => !isNaN(e));
      
      if (estatusIds.length > 0) {
        query += ` AND C.ID_Estatus IN (${estatusIds.join(',')})`;
      }
    }

    query += ' ORDER BY C.Fecha_cita ASC, C.Hora_Inicio ASC';

    const result = await request.query(query);

    res.json({
      success: true,
      total: result.recordset.length,
      citas: result.recordset
    });

  } catch (error) {
    console.error('❌ Error GET /api/citas/mis-citas-doctor:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  } finally {
    // Usamos el pool global; no cerrar aquí para evitar ECONNCLOSED
  }
});

router.get('/especialidades', citaController.getEspecialidades);
router.get('/doctores/:id_especialidad', citaController.getDoctoresPorEspecialidad);
router.post('/disponibilidad', citaController.getSlotsOcupados); 
router.post('/horario-trabajo', citaController.getHorarioTrabajo);

module.exports = router;