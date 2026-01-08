const db = require('../config/db.config');
const sql = require('mssql');

/**
 * Marca una cita como "No acudió" (ID_Estatus = 7)
 * Validaciones:
 * - Debe haber pasado al menos 1 hora desde Hora_Fin
 * - La cita debe estar en estatus "Pagada" (ID_Estatus = 2)
 * - La cita debe pertenecer al doctor autenticado
 */
async function marcarNoAsistencia(req, res) {
  const { id_cita } = req.params;
  const id_doctor = req.user?.Id_Doctor;

  if (!id_doctor) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado como doctor'
    });
  }

  try {
    const pool = await db.connect();

    // Verificar que la cita existe, pertenece al doctor y está en el estatus correcto
    const checkResult = await pool.request()
      .input('id_cita', sql.Int, id_cita)
      .input('id_doctor', sql.Int, id_doctor)
      .query(`
        SELECT 
          c.Id_Cita,
          c.ID_Estatus,
          c.Fecha_Cita,
          c.Hora_Fin,
          DATEDIFF(HOUR, DATEADD(MINUTE, DATEPART(HOUR, c.Hora_Fin) * 60 + DATEPART(MINUTE, c.Hora_Fin), c.Fecha_Cita), GETDATE()) AS Horas_Transcurridas,
          e.Nombre AS Estatus_Actual
        FROM Citas c
        INNER JOIN Estatus e ON c.ID_Estatus = e.ID_Estatus
        WHERE c.Id_Cita = @id_cita
          AND c.Id_Doctor = @id_doctor
      `);

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada o no pertenece al doctor autenticado'
      });
    }

    const cita = checkResult.recordset[0];

    // Validar que la cita esté pagada (estatus 2)
    if (cita.ID_Estatus !== 2) {
      return res.status(400).json({
        success: false,
        message: `No se puede marcar como "No acudió". Estatus actual: ${cita.Estatus_Actual}`,
        estatusActual: cita.Estatus_Actual
      });
    }

    // Validar que haya pasado al menos 1 hora desde Hora_Fin
    if (cita.Horas_Transcurridas < 1) {
      return res.status(400).json({
        success: false,
        message: 'No se puede marcar como "No acudió" hasta que haya pasado 1 hora desde la hora de finalización',
        horasTranscurridas: cita.Horas_Transcurridas,
        minimoRequerido: 1
      });
    }

    // Actualizar el estatus a "No acudió" (7)
    const updateResult = await pool.request()
      .input('id_cita', sql.Int, id_cita)
      .input('id_usuario', sql.Int, req.user?.Id_Usuario || null)
      .query(`
        DECLARE @CitasMarcadas TABLE (Id_Cita INT);
        
        UPDATE Citas
        SET ID_Estatus = 7
        OUTPUT inserted.Id_Cita INTO @CitasMarcadas
        WHERE Id_Cita = @id_cita
          AND ID_Estatus = 2;
        
        -- Registrar en bitácora
        INSERT INTO Bitacora (Accion, Usuario, ID_Tabla_Afectada, ID_Registro_Afectado, Descripcion)
        SELECT 
          'Cambio estatus',
          CONCAT('Doctor: ', d.Nombre, ' ', d.Paterno),
          (SELECT Id_Tabla FROM Tablas WHERE Nombre_Tabla = 'Citas'),
          cm.Id_Cita,
          'Cita marcada manualmente como No Acudió por el doctor'
        FROM @CitasMarcadas cm
        INNER JOIN Citas c ON c.Id_Cita = cm.Id_Cita
        INNER JOIN Doctores d ON d.Id_Doctor = c.Id_Doctor;
        
        SELECT COUNT(*) AS Marcadas FROM @CitasMarcadas;
      `);

    const marcadas = updateResult.recordset[0]?.Marcadas || 0;

    if (marcadas > 0) {
      return res.status(200).json({
        success: true,
        message: 'Cita marcada como "No acudió" exitosamente'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'No se pudo actualizar la cita'
      });
    }

  } catch (error) {
    console.error('Error al marcar no-asistencia:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}

module.exports = {
  marcarNoAsistencia
};
