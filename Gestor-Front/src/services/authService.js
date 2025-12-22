// services/AuthService.js
const db = require('../config/db.config'); // tu archivo de conexión

class AuthService {

    async login(username, password) {
        let pool;
        try {
            pool = await db.connect();

            const result = await pool.request()
                .input('username', username)
                .input('password', password)
                .query(`
                    SELECT Id_User, Username, ID_Tipo_User
                    FROM Usuarios
                    WHERE Username = @username AND Password = @password
                `);

            if (result.recordset.length === 0) {
                return null; // usuario o pass incorrectos
            }

            return result.recordset[0]; // devuelve tipo de usuario
        } catch (err) {
            console.error("Error en login:", err);
            throw err;
        } finally {
            if (pool) pool.close();
        }
    }
}

module.exports = new AuthService();
