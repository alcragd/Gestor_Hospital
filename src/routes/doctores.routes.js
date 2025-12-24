const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// Helpers de autenticación
function getUserContext(req) {
  const userId = parseInt(req.headers['x-user-id'], 10);
  const role = parseInt(req.headers['x-user-role'], 10);
  return { userId, role };
}

// Bloqueo explícito para recepcionistas: no pueden acceder a recetas ni historiales
router.use((req, res, next) => {
  const { role } = getUserContext(req);
  if (role === 3) {
    return res.status(403).json({ message: 'Acceso restringido. Perfil recepcionista no autorizado en módulo médico.' });
  }
  next();
});

// GET /api/doctores/me -> Obtener perfil del doctor autenticado
router.get('/me', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener datos completos del doctor
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT 
          E.Id_Empleado,
          E.Nombre,
          E.Paterno,
          E.Materno,
          E.Fecha_Nac,
          E.CURP,
           E.Telefono_cel,
           E.Correo,
          D.Id_Doctor,
           D.Cedula,
          ESP.Id_Especialidad,
          ESP.Nombre AS Especialidad
        FROM Empleados E
        INNER JOIN Doctores D ON E.Id_Empleado = D.Id_Empleado
        INNER JOIN Especialidades ESP ON D.Id_Especialidad = ESP.Id_Especialidad
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    res.json({
      success: true,
      doctor: doctorRes.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error GET /api/doctores/me:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

// PUT /api/doctores/me -> Actualizar perfil del doctor (solo campos permitidos)
router.put('/me', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  // ❌ CAMPOS PROHIBIDOS (no pueden modificarse)
  const camposProhibidos = ['Num_Emp', 'Cedula', 'CURP', 'Nombre', 'Paterno', 'Materno', 'Id_Especialidad', 'Especialidad'];
  
  // Validar que no se intenten modificar campos prohibidos
  const camposEnviados = Object.keys(req.body);
  const intentoProhibido = camposEnviados.find(campo => camposProhibidos.includes(campo));
  
  if (intentoProhibido) {
    return res.status(403).json({ 
      message: `Campo prohibido: ${intentoProhibido}. Los doctores no pueden modificar: Número de empleado, Cédula profesional, CURP, Nombre, Especialidad.` 
    });
  }

  // ✅ CAMPOS PERMITIDOS
  const { Telefono_cel, Correo } = req.body;

  if (!Telefono_cel && !Correo) {
    return res.status(400).json({ 
      message: 'Debe proporcionar al menos un campo para actualizar (Telefono_cel, Correo)' 
    });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Empleado del usuario autenticado
    const empleadoRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT E.Id_Empleado
        FROM Empleados E
        INNER JOIN Doctores D ON E.Id_Empleado = D.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (empleadoRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const empleadoId = empleadoRes.recordset[0].Id_Empleado;

    // Construir UPDATE dinámico solo con campos permitidos
    let setClauses = [];
    const request = pool.request().input('empleadoId', db.sql.Int, empleadoId);

    if (Telefono_cel) {
      setClauses.push('Telefono_cel = @telefono');
      request.input('telefono', db.sql.VarChar(15), Telefono_cel);
    }
    if (Correo) {
      setClauses.push('Correo = @correo');
      request.input('correo', db.sql.VarChar(100), Correo);
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
    }

    const updateQuery = `
      UPDATE Empleados
      SET ${setClauses.join(', ')}
      WHERE Id_Empleado = @empleadoId
    `;

    await request.query(updateQuery);

    // Registrar en bitácora
    await pool.request()
      .input('usuario', db.sql.VarChar(50), `Doctor_${userId}`)
      .input('accion', db.sql.VarChar(100), 'UPDATE perfil doctor')
      .input('tabla', db.sql.VarChar(50), 'Empleados')
      .input('registro', db.sql.Int, empleadoId)
      .input('detalle', db.sql.VarChar(200), `Campos actualizados: ${setClauses.join(', ')}`)
      .query(`
        INSERT INTO Bitacora (Fecha_Hora, Usuario, Accion, Tabla_Afectada, Id_Reg_Afectado, Detalles)
        VALUES (GETDATE(), @usuario, @accion, @tabla, @registro, @detalle)
      `);

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      campos_actualizados: camposEnviados
    });

  } catch (error) {
    console.error('❌ Error PUT /api/doctores/me:', error);
    res.status(500).json({ message: 'Error al actualizar perfil', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

// GET /api/doctores/paciente/:id_paciente -> Ver datos del paciente (solo si tiene cita asignada)
router.get('/paciente/:id_paciente', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  const idPaciente = parseInt(req.params.id_paciente, 10);
  if (isNaN(idPaciente)) {
    return res.status(400).json({ message: 'ID de paciente inválido' });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Doctor del empleado autenticado
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT D.Id_Doctor
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctorId = doctorRes.recordset[0].Id_Doctor;

    // Validar que el doctor tiene al menos una cita con este paciente
    const validacionRes = await pool.request()
      .input('doctorId', db.sql.Int, doctorId)
      .input('pacienteId', db.sql.Int, idPaciente)
      .query(`
        SELECT COUNT(*) AS TotalCitas
        FROM Citas
        WHERE Id_Doc = @doctorId AND ID_Paciente = @pacienteId
      `);

    if (validacionRes.recordset[0].TotalCitas === 0) {
      return res.status(403).json({ 
        message: 'No tiene autorización para ver este paciente. No hay citas asignadas.' 
      });
    }

    // Obtener datos completos del paciente
    const pacienteRes = await pool.request()
      .input('pacienteId', db.sql.Int, idPaciente)
      .query(`
        SELECT 
          ID_Paciente,
          Nombre,
          Paterno,
          Materno,
          Fecha_nac AS Fecha_Nac,
          Sexo,
          Telefono_cel AS Telefono,
          Correo AS Email,
          DNI
        FROM Pacientes
        WHERE ID_Paciente = @pacienteId
      `);

    if (pacienteRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json({
      success: true,
      paciente: pacienteRes.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error GET /api/doctores/paciente:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

// GET /api/doctores/paciente/:id_paciente/historial -> Ver historial de citas del paciente
router.get('/paciente/:id_paciente/historial', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  const idPaciente = parseInt(req.params.id_paciente, 10);
  if (isNaN(idPaciente)) {
    return res.status(400).json({ message: 'ID de paciente inválido' });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Doctor del empleado autenticado
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT D.Id_Doctor
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctorId = doctorRes.recordset[0].Id_Doctor;

    // Validar que el doctor tiene al menos una cita con este paciente
    const validacionRes = await pool.request()
      .input('doctorId', db.sql.Int, doctorId)
      .input('pacienteId', db.sql.Int, idPaciente)
      .query(`
        SELECT COUNT(*) AS TotalCitas
        FROM Citas
        WHERE Id_Doc = @doctorId AND ID_Paciente = @pacienteId
      `);

    if (validacionRes.recordset[0].TotalCitas === 0) {
      return res.status(403).json({ 
        message: 'No tiene autorización para ver el historial de este paciente' 
      });
    }

    // Obtener historial completo de citas del paciente (no solo del doctor actual)
    const historialRes = await pool.request()
      .input('pacienteId', db.sql.Int, idPaciente)
      .query(`
        SELECT 
          C.Id_Cita,
          C.Fecha_Solicitud,
          C.Fecha_cita,
          C.Hora_Inicio,
          C.Hora_Fin,
          E.Nombre AS Especialidad,
          CONCAT(EM.Nombre, ' ', EM.Paterno, ' ', EM.Materno) AS Doctor,
          ES.Nombre AS Estatus,
          ES.Id_Estatus
        FROM Citas C
        INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
        INNER JOIN Empleados EM ON D.Id_Empleado = EM.Id_Empleado
        INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
        INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
        WHERE C.ID_Paciente = @pacienteId
        ORDER BY C.Fecha_cita DESC, C.Hora_Inicio DESC
      `);

    res.json({
      success: true,
      total: historialRes.recordset.length,
      historial: historialRes.recordset
    });

  } catch (error) {
    console.error('❌ Error GET /api/doctores/paciente/historial:', error);
    res.status(500).json({ message: 'Error interno', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

// POST /api/doctores/receta -> Crear receta médica para un paciente
router.post('/receta', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  const { Id_Cita, Diagnostico, Indicaciones, Medicamentos, Observaciones, Vigencia_Dias } = req.body;

  // Validar datos requeridos
  if (!Id_Cita || !Diagnostico || !Indicaciones || !Medicamentos) {
    return res.status(400).json({ 
      message: 'Se requiere: Id_Cita, Diagnostico, Indicaciones, Medicamentos' 
    });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Doctor del empleado autenticado
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT D.Id_Doctor
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctorId = doctorRes.recordset[0].Id_Doctor;

    // Validar que la cita existe y está asignada al doctor
    const citaRes = await pool.request()
      .input('idCita', db.sql.Int, Id_Cita)
      .input('doctorId', db.sql.Int, doctorId)
      .query(`
        SELECT 
          C.Id_Cita,
          C.ID_Paciente,
          C.ID_Estatus,
          ES.Nombre AS Estatus
        FROM Citas C
        INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
        WHERE C.Id_Cita = @idCita AND C.Id_Doc = @doctorId
      `);

    if (citaRes.recordset.length === 0) {
      return res.status(403).json({ 
        message: 'Cita no encontrada o no asignada a este doctor' 
      });
    }

    const cita = citaRes.recordset[0];

    // Validar que la cita esté en estatus "Atendida" (4) o "Pagada" (2)
    if (![2, 4].includes(cita.ID_Estatus)) {
      return res.status(400).json({ 
        message: `No se puede crear receta para esta cita. Estatus actual: ${cita.Estatus}` 
      });
    }

    // Crear la receta
    const insertRes = await pool.request()
      .input('idCita', db.sql.Int, Id_Cita)
      .input('idDoctor', db.sql.Int, doctorId)
      .input('idPaciente', db.sql.Int, cita.ID_Paciente)
      .input('diagnostico', db.sql.NVarChar(500), Diagnostico)
      .input('indicaciones', db.sql.NVarChar(1000), Indicaciones)
      .input('medicamentos', db.sql.NVarChar(2000), Medicamentos)
      .input('observaciones', db.sql.NVarChar(500), Observaciones || null)
      .input('vigenciaDias', db.sql.Int, Vigencia_Dias || 30)
      .input('usuario', db.sql.NVarChar(50), `Doctor_${userId}`)
      .query(`
        INSERT INTO Recetas (
          Id_Cita, Id_Doctor, ID_Paciente, Fecha, Vigencia, Fecha_Emision, Diagnostico, Indicaciones, 
          Medicamentos, Observaciones, Vigencia_Dias, Usuario_Registro
        )
        OUTPUT INSERTED.Id_Receta, INSERTED.Fecha_Emision, INSERTED.Fecha_Vencimiento
        VALUES (
          @idCita, @idDoctor, @idPaciente, GETDATE(), @vigenciaDias, GETDATE(), @diagnostico, @indicaciones,
          @medicamentos, @observaciones, @vigenciaDias, @usuario
        )
      `);

    const recetaCreada = insertRes.recordset[0];

    res.status(201).json({
      success: true,
      message: 'Receta médica creada exitosamente',
      receta: {
        Id_Receta: recetaCreada.Id_Receta,
        Fecha_Emision: recetaCreada.Fecha_Emision,
        Fecha_Vencimiento: recetaCreada.Fecha_Vencimiento,
        Diagnostico,
        Indicaciones,
        Medicamentos,
        Observaciones,
        Vigencia_Dias: Vigencia_Dias || 30
      }
    });

  } catch (error) {
    console.error('❌ Error POST /api/doctores/receta:', error);
    res.status(500).json({ message: 'Error al crear receta', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

// GET /api/doctores/receta/:id_receta -> Obtener receta específica
router.get('/receta/:id_receta', async (req, res) => {
  const { userId, role } = getUserContext(req);
  
  if (!userId || role !== 1) {
    return res.status(403).json({ message: 'Acceso restringido a doctores' });
  }

  const idReceta = parseInt(req.params.id_receta, 10);
  if (isNaN(idReceta)) {
    return res.status(400).json({ message: 'ID de receta inválido' });
  }

  let pool;
  try {
    pool = await db.connect();

    // Obtener Id_Doctor del empleado autenticado
    const doctorRes = await pool.request()
      .input('userId', db.sql.Int, userId)
      .query(`
        SELECT D.Id_Doctor
        FROM Doctores D
        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
        WHERE E.Id_User = @userId
      `);

    if (doctorRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Doctor no encontrado' });
    }

    const doctorId = doctorRes.recordset[0].Id_Doctor;

    // Obtener receta solo si fue creada por el doctor autenticado
    const recetaRes = await pool.request()
      .input('idReceta', db.sql.Int, idReceta)
      .input('doctorId', db.sql.Int, doctorId)
      .query(`
        SELECT 
          R.*,
          CONCAT(P.Nombre, ' ', P.Paterno, ' ', P.Materno) AS Paciente,
          C.Fecha_cita,
          C.Hora_Inicio
        FROM Recetas R
        INNER JOIN Pacientes P ON R.ID_Paciente = P.ID_Paciente
        INNER JOIN Citas C ON R.Id_Cita = C.Id_Cita
        WHERE R.Id_Receta = @idReceta AND R.Id_Doctor = @doctorId
      `);

    if (recetaRes.recordset.length === 0) {
      return res.status(404).json({ message: 'Receta no encontrada' });
    }

    res.json({
      success: true,
      receta: recetaRes.recordset[0]
    });

  } catch (error) {
    console.error('❌ Error GET /api/doctores/receta:', error);
    res.status(500).json({ message: 'Error al obtener receta', details: error.message });
  } finally {
    if (pool) await pool.close();
  }
});

module.exports = router;
