const AuthService = require('../services/AuthService');

class AuthController {

    async login(req, res) {
        const { username, password } = req.body;

        try {
            const user = await AuthService.login(username, password);

            if (!user) {
                return res.status(401).json({ message: "Credenciales incorrectas" });
            }

            return res.json({
                success: true,
                id: user.Id_User,
                rol: user.ID_Tipo_User
            });

        } catch (error) {
            res.status(500).json({ message: "Error interno" });
        }
    }
}

module.exports = new AuthController();
