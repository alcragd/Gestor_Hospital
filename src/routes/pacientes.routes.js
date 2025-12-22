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