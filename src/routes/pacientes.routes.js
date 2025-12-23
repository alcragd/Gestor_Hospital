const express = require('express');
const db = require('../config/db.config');

const router = express.Router();

// Helpers de autenticación (se usan encabezados x-user-id y x-user-role)
function getUserContext(req) {
    const userId = parseInt(req.headers['x-user-id'], 10);
    const role = parseInt(req.headers['x-user-role'], 10); // 4 = Paciente
    return { userId, role };
}

// GET /api/pacientes/me -> Perfil del paciente autenticado
router.get('/me', async (req, res) => {
    const { userId, role } = getUserContext(req);

    if (!userId || role !== 4) {
        return res.status(403).json({ message: 'Acceso restringido al perfil de paciente' });
    }

    let pool;
    try {
        pool = await db.connect();

        const result = await pool.request()
            .input('userId', db.sql.Int, userId)
            .query(`
                SELECT 
                    P.ID_Paciente,
                    P.Nombre,
                    P.Paterno,
                    P.Materno,
                    P.Correo,
                    P.Telefono_cel,
                    P.Telefono_emergencia,
                    P.DNI,
                    P.Fecha_nac,
                    P.Sexo,
                    P.Edad
                FROM Pacientes P
                WHERE P.Id_User = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        const row = result.recordset[0];
        const paciente = {
            ID_Paciente: row.ID_Paciente,
            Nombre: row.Nombre,
            Paterno: row.Paterno,
            Materno: row.Materno,
            Email: row.Correo,
            Telefono: row.Telefono_cel,
            Telefono_emergencia: row.Telefono_emergencia,
            DNI: row.DNI,
            Fecha_Nac: row.Fecha_nac,
            Sexo: row.Sexo,
            Edad: row.Edad,
            CURP: null,
            NSS: null
        };

        res.json({ success: true, paciente });
    } catch (error) {
        console.error('❌ Error GET /api/pacientes/me:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// GET /api/pacientes/:id -> Perfil por id (solo si pertenece al usuario actual)
router.get('/:id', async (req, res) => {
    const { userId, role } = getUserContext(req);
    const pacienteIdParam = parseInt(req.params.id, 10);

    if (!userId || role !== 4) {
        return res.status(403).json({ message: 'Acceso restringido al perfil de paciente' });
    }

    let pool;
    try {
        pool = await db.connect();

        // Confirmar que el paciente pertenece al usuario autenticado
        const result = await pool.request()
            .input('id', db.sql.Int, pacienteIdParam)
            .input('userId', db.sql.Int, userId)
            .query(`
                SELECT 
                    P.ID_Paciente,
                    P.Nombre,
                    P.Paterno,
                    P.Materno,
                    P.Correo,
                    P.Telefono_cel,
                    P.Telefono_emergencia,
                    P.DNI,
                    P.Fecha_nac,
                    P.Sexo,
                    P.Edad
                FROM Pacientes P
                WHERE P.ID_Paciente = @id AND P.Id_User = @userId
            `);

        if (result.recordset.length === 0) {
            return res.status(403).json({ message: 'No autorizado o paciente no encontrado' });
        }

        const row = result.recordset[0];
        const paciente = {
            ID_Paciente: row.ID_Paciente,
            Nombre: row.Nombre,
            Paterno: row.Paterno,
            Materno: row.Materno,
            Email: row.Correo,
            Telefono: row.Telefono_cel,
            Telefono_emergencia: row.Telefono_emergencia,
            DNI: row.DNI,
            Fecha_Nac: row.Fecha_nac,
            Sexo: row.Sexo,
            Edad: row.Edad,
            CURP: null,
            NSS: null
        };

        res.json({ success: true, paciente });
    } catch (error) {
        console.error('❌ Error GET /api/pacientes/:id:', error);
        res.status(500).json({ message: 'Error interno' });
    }
});

// PUT /api/pacientes/me -> Actualizar datos NO críticos del paciente autenticado
router.put('/me', async (req, res) => {
    const { userId, role } = getUserContext(req);
    const { Telefono, Email, Telefono_emergencia } = req.body;

    if (!userId || role !== 4) {
        return res.status(403).json({ message: 'Acceso restringido al perfil de paciente' });
    }

    if (!Telefono && !Email && !Telefono_emergencia) {
        return res.status(400).json({ message: 'Debe proporcionar al menos un campo para actualizar (Telefono, Email, Telefono_emergencia)' });
    }

    let pool;
    try {
        pool = await db.connect();

        const pacienteRes = await pool.request()
            .input('userId', db.sql.Int, userId)
            .query('SELECT ID_Paciente FROM Pacientes WHERE Id_User = @userId');

        if (pacienteRes.recordset.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        const pacienteId = pacienteRes.recordset[0].ID_Paciente;

        if (Email || Telefono) {
            const dup = await pool.request()
                .input('id', db.sql.Int, pacienteId)
                .input('mail', db.sql.VarChar, Email)
                .input('tel', db.sql.VarChar, Telefono)
                .query(`
                    SELECT 1 
                    FROM Pacientes
                    WHERE (Correo = @mail OR Telefono_cel = @tel)
                        AND ID_Paciente != @id
                `);

            if (dup.recordset.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Correo o teléfono ya están registrados por otro paciente.'
                });
            }
        }

        const updates = [];
        const request = pool.request().input('id', db.sql.Int, pacienteId);

        if (Telefono) {
            updates.push('Telefono_cel = @tel');
            request.input('tel', db.sql.VarChar(20), Telefono);
        }
        if (Email) {
            updates.push('Correo = @mail');
            request.input('mail', db.sql.VarChar(100), Email);
        }
        if (Telefono_emergencia) {
            updates.push('Telefono_emergencia = @emg');
            request.input('emg', db.sql.VarChar(20), Telefono_emergencia);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No hay campos válidos para actualizar' });
        }

        await request.query(`
            UPDATE Pacientes
            SET ${updates.join(', ')}
            WHERE ID_Paciente = @id
        `);

        await pool.request()
            .input('reg', db.sql.Int, pacienteId)
            .input('usr', db.sql.VarChar(50), `user:${userId}`)
            .input('det', db.sql.VarChar(500), 'Actualización de datos de paciente (no críticos)')
            .query(`
                INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Pacientes')
            `);

        res.json({ success: true, message: 'Perfil actualizado correctamente', campos_actualizados: updates });
    } catch (error) {
        console.error('❌ Error PUT /api/pacientes/me:', error);
        res.status(500).json({ message: 'Error al actualizar perfil', details: error.message });
    }
});

// Ruta heredada (mantenimiento). Se deja pero se recomienda usar /me.
router.put('/update/:id', async (req, res) => {
    try {
        const pool = await db.connect();

        // Verificar duplicados (excepto este paciente)
        const check = await pool.request()
            .input('id', req.params.id)
            .input('mail', req.body.correo)
            .input('tel', req.body.telefono)
            .query(`
                SELECT * FROM Pacientes
                WHERE (Correo = @mail OR Telefono_cel = @tel)
                    AND ID_Paciente != @id
            `);

        if (check.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Correo o teléfono ya están registrados por otro paciente.'
            });
        }

        // Actualizar solo Pacientes
        await pool.request()
            .input('id', req.params.id)
            .input('nom', req.body.nombre)
            .input('pat', req.body.paterno)
            .input('mat', req.body.materno)
            .input('mail', req.body.correo)
            .input('tel', req.body.telefono)
            .input('emg', req.body.emergencia)
            .query(`
                UPDATE Pacientes
                SET
                    Nombre = @nom,
                    Paterno = @pat,
                    Materno = @mat,
                    Correo = @mail,
                    Telefono_cel = @tel,
                    Telefono_emergencia = @emg
                WHERE ID_Paciente = @id
            `);

        res.json({ success: true });
    } catch (err) {
        console.error('❌ ERROR UPDATE PACIENTE (legacy):', err);
        res.status(500).json({ success: false, message: 'Error actualizando' });
    }
});

module.exports = router;
router.put("/update/:id", async (req, res) => {
    try {
        const pool = await db.connect();

        // Verificar duplicados (excepto este paciente)
        const check = await pool.request()
            .input("id", req.params.id)
            .input("mail", req.body.correo)
            .input("tel", req.body.telefono)
            .query(`
                SELECT * FROM Pacientes
                WHERE (Correo = @mail OR Telefono_cel = @tel)
                AND ID_Paciente != @id
            `);

        if (check.recordset.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Correo o teléfono ya están registrados por otro paciente." 
            });
        }

        // Actualizar solo Pacientes
        await pool.request()
            .input("id", req.params.id)
            .input("nom", req.body.nombre)
            .input("pat", req.body.paterno)
            .input("mat", req.body.materno)
            .input("mail", req.body.correo)
            .input("tel", req.body.telefono)
            .input("emg", req.body.emergencia)
            .query(`
                UPDATE Pacientes
                SET
                    Nombre = @nom,
                    Paterno = @pat,
                    Materno = @mat,
                    Correo = @mail,
                    Telefono_cel = @tel,
                    Telefono_emergencia = @emg
                WHERE ID_Paciente = @id
            `);

        res.json({ success: true });

    } catch (err) {
        console.error("❌ ERROR UPDATE PACIENTE:", err);
        res.status(500).json({ success: false, message: "Error actualizando" });
    }
});