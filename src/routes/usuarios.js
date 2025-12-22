// routes/usuarios.js
const express = require('express');
const router = express.Router();
const db = require('../config/db.config');

// PUT /api/usuarios/:id -> actualizar campos de Usuarios (username, correo, telefono, password opcional)
router.put('/:id', async (req, res) => {
const id = req.params.id;
const { username, correo, telefono, password } = req.body;

try {
const pool = await db.connect();

// Validar duplicados (username, correo, telefono) EXCLUYENDO este id
const dup = await pool.request()
    .input('username', username)
    .input('correo', correo)
    .input('telefono', telefono)
    .input('id', id)
    .query(`
    SELECT Id_User, Username, Correo, Telefono
    FROM Usuarios
    WHERE (Username = @username OR Correo = @correo OR Telefono = @telefono)
        AND Id_User != @id
    `);

if (dup.recordset.length > 0) {
    return res.status(400).json({ success: false, code: 'DUPLICATE', message: 'Username/correo/telefono ya en uso' });
}

// Actualizar
const request = pool.request()
    .input('id', id)
    .input('username', username)
    .input('correo', correo)
    .input('telefono', telefono);

let query;
if (password) {
    request.input('password', password);
    query = `
    UPDATE Usuarios 
    SET Username = @username, Correo = @correo, Telefono = @telefono, Password = @password
    WHERE Id_User = @id
    `;
} else {
    query = `
    UPDATE Usuarios 
    SET Username = @username, Correo = @correo, Telefono = @telefono
    WHERE Id_User = @id
    `;
}

await request.query(query);
res.json({ success: true, message: 'Usuario actualizado' });

} catch (err) {
console.error('Error PUT /api/usuarios/:id', err);
res.status(500).json({ success: false, message: '__Error del servidor' });
}
});

module.exports = router;
