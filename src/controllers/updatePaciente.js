router.put("/updatePaciente", async (req, res) => {
    const { userId, nombre, correo, telefono, emergencia } = req.body;

    try {
        const pool = await db.connect();

        // Verificar si otro paciente ya usa el correo o teléfono
        const check = await pool.request()
            .input("id", userId)
            .input("mail", correo)
            .input("tel", telefono)
            .query(`
                SELECT * FROM Pacientes
                WHERE (Correo = @mail OR Telefono_cel = @tel)
                AND ID_Paciente != @id
            `);

        if (check.recordset.length > 0) {
            return res.json({
                success: false,
                message: "Correo o teléfono ya están registrados por otro paciente."
            });
        }

        // ACTUALIZAR SOLO PACIENTES
        await pool.request()
            .input("id", userId)
            .input("nom", nombre)
            .input("mail", correo)
            .input("tel", telefono)
            .input("emg", emergencia)
            .query(`
                UPDATE Pacientes
                SET 
                    Nombre = @nom,
                    Correo = @mail,
                    Telefono_cel = @tel,
                    Telefono_emergencia = @emg
                WHERE ID_Paciente = @id
            `);

        res.json({ success: true });

    } catch (error) {
        console.error("Error en updatePaciente:", error);
        res.status(500).json({ success: false, message: "Error interno" });
    }
});