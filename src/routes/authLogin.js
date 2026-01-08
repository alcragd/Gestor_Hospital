// authLogin.js - ARCHIVO COMPLETO
const express = require("express");
const router = express.Router();
const db = require("../config/db.config");

// ===========================================
// 📝 REGISTRO COMPLETO DE PACIENTE
// ===========================================
router.post("/createFull", async (req, res) => {
    const { 
        username, password, 
        nombre, paterno, materno,
        dni, fecha_nac, sexo, edad,
        correo, telefono_cel, telefono_emergencia
    } = req.body;

    let pool;
    try {
        pool = await db.connect();

        // 1️⃣ VALIDAR SI YA EXISTE USUARIO
        const checkUser = await pool.request()
            .input("user", username)
            .input("mail", correo)
            .query(`
                SELECT * FROM Usuarios
                WHERE Username = @user OR Correo = @mail
            `);

        if (checkUser.recordset.length > 0) {
            return res.json({
                success: false,
                code: "USER_EXISTS",
                message: "El usuario o correo ya están registrados."
            });
        }

        // 1.5️⃣ VALIDAR SI YA EXISTE DNI/CORREO/TELEFONO EN PACIENTES
        const checkPaciente = await pool.request()
            .input("dni", dni)
            .input("mail", correo)
            .input("tel", telefono_cel)
            .query(`
                SELECT * FROM Pacientes 
                WHERE DNI = @dni OR Correo = @mail OR Telefono_cel = @tel
            `);

        if (checkPaciente.recordset.length > 0) {
            return res.json({
                success: false,
                code: "DATA_EXISTS",
                message: "El DNI, correo o teléfono ya están registrados."
            });
        }

        // 2️⃣ CREAR USUARIO
        const resultUser = await pool.request()
            .input("user", username)
            .input("pass", password)
            .input("mail", correo)
            .query(`
                INSERT INTO Usuarios (Username, Password, Correo, ID_Tipo_User)
                VALUES (@user, @pass, @mail, 4);
                SELECT SCOPE_IDENTITY() AS id;
            `);

        const userId = resultUser.recordset[0].id;
        console.log("✅ Usuario creado con ID:", userId);

        // 3️⃣ CREAR PACIENTE
        const resultPaciente = await pool.request()
            .input("userId", userId)
            .input("dni", dni)
            .input("nom", nombre)
            .input("pat", paterno)
            .input("mat", materno || "")
            .input("fn", fecha_nac)
            .input("mail", correo)
            .input("cel", telefono_cel)
            .input("emg", telefono_emergencia || telefono_cel)
            .input("sex", sexo)
            .input("edad", edad)
            .query(`
                INSERT INTO Pacientes (
                    Id_User, DNI, Nombre, Paterno, Materno,
                    Fecha_nac, Correo, Telefono_cel, Telefono_emergencia, Sexo, Edad
                )
                VALUES (
                    @userId, @dni, @nom, @pat, @mat,
                    @fn, @mail, @cel, @emg, @sex, @edad
                );
                SELECT SCOPE_IDENTITY() AS pacienteId;
            `);

        const pacienteId = resultPaciente.recordset[0].pacienteId;
        console.log("✅ Paciente creado con ID:", pacienteId);

        res.json({
            success: true,
            id: userId,
            pacienteId: pacienteId,
            rol: 4,
            nombre: nombre,
            paterno: paterno,
            materno: materno || "",
            correo: correo,
            telefono: telefono_cel,
            emergencia: telefono_emergencia || telefono_cel
        });

    } catch (err) {
        console.error("❌ Error en createFull:", err);
        res.status(500).json({
            success: false,
            message: "Error al crear usuario",
            details: err.message
        });
    } finally {
        if (pool) pool.close();
    }
});

// ===========================================
// 🔐 LOGIN GENERAL PARA TODOS LOS USUARIOS
// ===========================================
router.post("/loginGeneral", async (req, res) => {
    const { username, password } = req.body;

    let pool;
    try {
        pool = await db.connect();

        // 1. Validar usuario y contraseña
        const userRes = await pool.request()
            .input("user", username)
            .input("pass", password)
            .query(`
                SELECT 
                    Id_User, 
                    Username, 
                    ID_Tipo_User,
                    Correo
                FROM Usuarios 
                WHERE Username = @user AND Password = @pass
            `);

        if (userRes.recordset.length === 0) {
            return res.json({ 
                success: false, 
                message: "Credenciales incorrectas" 
            });
        }

        const user = userRes.recordset[0];
        console.log("✅ Usuario encontrado:", user);

        // 2. Obtener datos según el tipo de usuario
        let userData = {};

        if (user.ID_Tipo_User === 4) { // PACIENTE
            const pacienteRes = await pool.request()
                .input("userId", user.Id_User)
                .query(`
                    SELECT 
                        ID_Paciente,
                        Nombre,
                        Paterno,
                        Materno,
                        DNI,
                        Fecha_nac,
                        Sexo,
                        Edad,
                        Telefono_cel,
                        Telefono_emergencia
                    FROM Pacientes 
                    WHERE Id_User = @userId
                `);

            if (pacienteRes.recordset.length > 0) {
                const paciente = pacienteRes.recordset[0];
                userData = {
                    id: user.Id_User,
                    userId: paciente.ID_Paciente,
                    tipo: user.ID_Tipo_User,
                    nombre: paciente.Nombre,
                    paterno: paciente.Paterno,
                    materno: paciente.Materno || "",
                    correo: user.Correo,
                    telefono: paciente.Telefono_cel,
                    emergencia: paciente.Telefono_emergencia,
                    dni: paciente.DNI,
                    fecha_nac: paciente.Fecha_nac,
                    sexo: paciente.Sexo,
                    edad: paciente.Edad
                };
                console.log("✅ Datos paciente:", userData);
            }

        } else if (user.ID_Tipo_User === 1) { // DOCTOR
            const doctorRes = await pool.request()
                .input("userId", user.Id_User)
                .query(`
                    SELECT 
                        d.Id_Doctor,
                        d.Rfc,
                        e.Nombre,
                        e.Paterno,
                        e.Materno,
                        e.CURP,
                        e.Telefono_cel,
                        e.Fecha_nac,
                        e.Sexo,
                        e.Sueldo,
                        esp.Nombre AS Especialidad,
                        e.Activo
                    FROM Doctores d
                    JOIN Empleados e ON e.Id_Empleado = d.Id_Empleado
                    JOIN Especialidades esp ON esp.Id_Especialidad = d.Id_Especialidad
                    WHERE e.Id_User = @userId AND e.Activo = 1
                `);

            if (doctorRes.recordset.length > 0) {
                const doctor = doctorRes.recordset[0];
                userData = {
                    id: user.Id_User,
                    userId: doctor.Id_Doctor,
                    tipo: user.ID_Tipo_User,
                    nombre: doctor.Nombre,
                    paterno: doctor.Paterno,
                    materno: doctor.Materno || "",
                    correo: user.Correo,
                    telefono: doctor.Telefono_cel,
                    especialidad: doctor.Especialidad,
                    activo: doctor.Activo,
                    curp: doctor.CURP,
                    rfc: doctor.Rfc,
                    fecha_nac: doctor.Fecha_nac,
                    sexo: doctor.Sexo,
                    sueldo: doctor.Sueldo
                };
            }

        } else if (user.ID_Tipo_User === 2) { // FARMACEUTICO
            const farmRes = await pool.request()
                .input("userId", user.Id_User)
                .query(`
                    SELECT 
                        f.Id_Farmaceutico,
                        e.Nombre,
                        e.Paterno,
                        e.Materno,
                        e.Telefono_cel,
                        e.CURP,
                        e.Fecha_nac,
                        e.Sexo,
                        e.Sueldo
                    FROM Farmaceutico f
                    JOIN Empleados e ON e.Id_Empleado = f.Id_Empleado
                    WHERE e.Id_User = @userId
                `);

            if (farmRes.recordset.length > 0) {
                const farm = farmRes.recordset[0];
                userData = {
                    id: user.Id_User,
                    userId: farm.Id_Farmaceutico,
                    tipo: user.ID_Tipo_User,
                    nombre: farm.Nombre,
                    paterno: farm.Paterno,
                    materno: farm.Materno || "",
                    correo: user.Correo,
                    telefono: farm.Telefono_cel,
                    curp: farm.CURP,
                    fecha_nac: farm.Fecha_nac,
                    sexo: farm.Sexo,
                    sueldo: farm.Sueldo
                };
            }

        } else if (user.ID_Tipo_User === 3) { // RECEPCIONISTA
            // Primero verificamos si es empleado
            const empRes = await pool.request()
                .input("userId", user.Id_User)
                .query(`
                    SELECT 
                        e.Id_Empleado,
                        e.Nombre,
                        e.Paterno,
                        e.Materno,
                        e.CURP,
                        e.Telefono_cel,
                        e.Fecha_nac,
                        e.Sexo,
                        e.Sueldo,
                        e.Activo
                    FROM Empleados e
                    WHERE e.Id_User = @userId AND e.Activo = 1
                `);

            if (empRes.recordset.length > 0) {
                const emp = empRes.recordset[0];
                userData = {
                    id: user.Id_User,
                    userId: emp.Id_Empleado,
                    tipo: user.ID_Tipo_User,
                    nombre: emp.Nombre,
                    paterno: emp.Paterno,
                    materno: emp.Materno || "",
                    correo: user.Correo,
                    telefono: emp.Telefono_cel,
                    activo: emp.Activo,
                    curp: emp.CURP,
                    fecha_nac: emp.Fecha_nac,
                    sexo: emp.Sexo,
                    sueldo: emp.Sueldo
                };
            }
        }

        // Si no se encontraron datos específicos
        if (Object.keys(userData).length === 0) {
            return res.json({ 
                success: false, 
                message: "Perfil de usuario no encontrado en el sistema o inactivo" 
            });
        }

        res.json({
            success: true,
            ...userData
        });

    } catch (err) {
        console.error("Error en loginGeneral:", err);
        res.status(500).json({ 
            success: false, 
            message: "Error interno del servidor" 
        });
    } finally {
        if (pool) pool.close();
    }
});

// ===========================================
// 📤 EXPORTAR ROUTER
// ===========================================
module.exports = router;