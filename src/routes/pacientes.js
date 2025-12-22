router.put("/update/:id", async (req, res) => {
const { id } = req.params;
const {
nombre, paterno, materno,correo, telefono, emergencia
} = req.body;

try {
const pool = await db.connect();

await pool.request()
    .input("id", id)
    .input("nom", nombre)
    .input("pat", paterno)
    .input("mat", materno)
    .input("mail", correo)
    .input("tel", telefono)
    .input("emg", emergencia)
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
console.error(err);
res.status(500).json({ success: false, message: "Error actualizando" });
}
});
