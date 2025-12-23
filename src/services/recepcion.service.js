const db = require('../config/db.config');

/**
 * Servicio para operaciones de Recepción/Administración
 * FASE 3 - Gestión de usuarios, servicios, farmacia
 */
class RecepcionService {
    
    // ═══════════════════════════════════════════════════════════════
    // GESTIÓN DE PACIENTES
    // ═══════════════════════════════════════════════════════════════
    
    async listarPacientes(filtros = {}) {
        let pool;
        try {
            pool = await db.connect();
            
            let query = `
                SELECT 
                    P.ID_Paciente,
                    P.Nombre,
                    P.Paterno,
                    P.Materno,
                    P.Fecha_nac,
                    P.Correo,
                    P.Telefono_cel,
                    P.Telefono_emergencia,
                    P.DNI,
                    P.Sexo,
                    P.Edad,
                    U.Id_User,
                    U.Username
                FROM Pacientes P
                LEFT JOIN Usuarios U ON P.Id_User = U.Id_User
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            if (filtros.busqueda) {
                query += ` AND (P.Nombre LIKE @busqueda OR P.Paterno LIKE @busqueda OR P.DNI LIKE @busqueda)`;
                request.input('busqueda', db.sql.VarChar, `%${filtros.busqueda}%`);
            }
            
            query += ` ORDER BY P.Paterno, P.Nombre`;
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar pacientes:', error);
            throw new Error('Error al obtener lista de pacientes');
        }
    }
    
    async obtenerPacientePorId(idPaciente) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('id', db.sql.Int, idPaciente)
                .query(`
                    SELECT 
                        P.*,
                        U.Username,
                        U.Id_User
                    FROM Pacientes P
                    LEFT JOIN Usuarios U ON P.Id_User = U.Id_User
                    WHERE P.ID_Paciente = @id
                `);
            
            if (result.recordset.length === 0) {
                throw new Error('Paciente no encontrado');
            }
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al obtener paciente:', error);
            throw error;
        }
    }
    
    async crearPaciente(datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Validar DNI único
            const existeDNI = await pool.request()
                .input('dni', db.sql.VarChar, datos.DNI)
                .query('SELECT 1 FROM Pacientes WHERE DNI = @dni');
            
            if (existeDNI.recordset.length > 0) {
                throw new Error('Ya existe un paciente con ese DNI');
            }
            
            // Si viene con usuario, validar username único
            if (datos.Username) {
                const existeUser = await pool.request()
                    .input('username', db.sql.VarChar, datos.Username)
                    .query('SELECT 1 FROM Usuarios WHERE Username = @username');
                
                if (existeUser.recordset.length > 0) {
                    throw new Error('El nombre de usuario ya está en uso');
                }
            }
            
            let userId = null;
            
            // Crear usuario si se proporcionó
            if (datos.Username && datos.Password) {
                const userResult = await pool.request()
                    .input('username', db.sql.VarChar, datos.Username)
                    .input('password', db.sql.VarChar, datos.Password)
                    .input('correo', db.sql.VarChar, datos.Correo)
                    .input('tipo', db.sql.Int, 4) // 4 = Paciente
                    .query(`
                        INSERT INTO Usuarios (Username, Password, Correo, ID_Tipo_User)
                        VALUES (@username, @password, @correo, @tipo);
                        SELECT SCOPE_IDENTITY() AS Id_User;
                    `);
                
                userId = userResult.recordset[0].Id_User;
            }
            
            // Insertar paciente
            const result = await pool.request()
                .input('nombre', db.sql.VarChar, datos.Nombre)
                .input('paterno', db.sql.VarChar, datos.Paterno)
                .input('materno', db.sql.VarChar, datos.Materno || null)
                .input('fechaNac', db.sql.Date, datos.Fecha_nac)
                .input('correo', db.sql.VarChar, datos.Correo)
                .input('telCel', db.sql.VarChar, datos.Telefono_cel)
                .input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia || null)
                .input('dni', db.sql.VarChar, datos.DNI)
                .input('sexo', db.sql.Char(1), datos.Sexo)
                .input('edad', db.sql.Int, datos.Edad)
                .input('userId', db.sql.Int, userId)
                .query(`
                    INSERT INTO Pacientes (Nombre, Paterno, Materno, Fecha_nac, Correo, Telefono_cel, Telefono_emergencia, DNI, Sexo, Edad, Id_User)
                    VALUES (@nombre, @paterno, @materno, @fechaNac, @correo, @telCel, @telEmerg, @dni, @sexo, @edad, @userId);
                    SELECT SCOPE_IDENTITY() AS ID_Paciente;
                `);
            
            const pacienteId = result.recordset[0].ID_Paciente;
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, pacienteId)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Paciente creado: ${datos.Nombre} ${datos.Paterno}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'INSERT', 'Pacientes')
                `);
            
            return { ID_Paciente: pacienteId, Id_User: userId };
            
        } catch (error) {
            console.error('❌ Error al crear paciente:', error);
            throw error;
        }
    }
    
    async actualizarPaciente(idPaciente, datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que el paciente existe
            const existe = await pool.request()
                .input('id', db.sql.Int, idPaciente)
                .query('SELECT 1 FROM Pacientes WHERE ID_Paciente = @id');
            
            if (existe.recordset.length === 0) {
                throw new Error('Paciente no encontrado');
            }
            
            // Construir UPDATE dinámico
            const updates = [];
            const request = pool.request().input('id', db.sql.Int, idPaciente);
            
            if (datos.Telefono_cel) {
                updates.push('Telefono_cel = @telCel');
                request.input('telCel', db.sql.VarChar, datos.Telefono_cel);
            }
            if (datos.Correo) {
                updates.push('Correo = @correo');
                request.input('correo', db.sql.VarChar, datos.Correo);
            }
            if (datos.Telefono_emergencia) {
                updates.push('Telefono_emergencia = @telEmerg');
                request.input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia);
            }
            
            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            await request.query(`
                UPDATE Pacientes
                SET ${updates.join(', ')}
                WHERE ID_Paciente = @id
            `);
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idPaciente)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Paciente actualizado - Campos: ${updates.join(', ')}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Pacientes')
                `);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar paciente:', error);
            throw error;
        }
    }

    // ==================== DOCTORES ====================
    
    async listarDoctores(filtros = {}) {
        try {
            const pool = await db.connect();
            const request = pool.request();
            
            let query = `
                SELECT 
                    D.Id_Doctor,
                    E.Nombre,
                    E.Paterno,
                    E.Materno,
                    E.Correo,
                    E.Telefono_cel,
                    E.Edad,
                    E.Sexo,
                    D.Cedula,
                    D.Rfc,
                    ESP.Nombre AS Especialidad,
                    ESP.Precio AS PrecioConsulta,
                    C.Numero AS NumConsultorio,
                    U.Username
                FROM Doctores D
                INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
                INNER JOIN Especialidades ESP ON D.Id_Especialidad = ESP.Id_Especialidad
                INNER JOIN Consultorio C ON ESP.ID_Consultorio = C.ID_Consultorio
                LEFT JOIN Usuarios U ON E.Id_User = U.Id_User
                WHERE 1=1
            `;
            
            if (filtros.especialidad) {
                query += ` AND D.Id_Especialidad = @especialidad`;
                request.input('especialidad', db.sql.Int, filtros.especialidad);
            }
            
            if (filtros.busqueda) {
                query += ` AND (E.Nombre LIKE @busqueda OR E.Paterno LIKE @busqueda OR D.Cedula LIKE @busqueda)`;
                request.input('busqueda', db.sql.VarChar, `%${filtros.busqueda}%`);
            }
            
            query += ` ORDER BY E.Paterno, E.Nombre`;
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar doctores:', error);
            throw new Error('Error al obtener lista de doctores');
        }
    }

    async obtenerDoctorPorId(idDoctor) {
        try {
            const pool = await db.connect();
            
            const result = await pool.request()
                .input('id', db.sql.Int, idDoctor)
                .query(`
                    SELECT 
                        D.*,
                        E.Nombre,
                        E.Paterno,
                        E.Materno,
                        E.CURP,
                        E.Fecha_nac,
                        E.Correo,
                        E.Telefono_cel,
                        E.Telefono_emergencia,
                        E.Edad,
                        E.Sueldo,
                        E.Sexo,
                        E.Id_User,
                        U.Username,
                        ESP.Nombre AS Especialidad
                    FROM Doctores D
                    INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
                    INNER JOIN Especialidades ESP ON D.Id_Especialidad = ESP.Id_Especialidad
                    LEFT JOIN Usuarios U ON E.Id_User = U.Id_User
                    WHERE D.Id_Doctor = @id
                `);
            
            if (result.recordset.length === 0) {
                throw new Error('Doctor no encontrado');
            }
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al obtener doctor:', error);
            throw error;
        }
    }

    async crearDoctor(datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Validar CURP único
            const existeCURP = await pool.request()
                .input('curp', db.sql.VarChar, datos.CURP)
                .query('SELECT 1 FROM Empleados WHERE CURP = @curp');
            
            if (existeCURP.recordset.length > 0) {
                throw new Error('Ya existe un empleado con ese CURP');
            }

            // Validar Cédula única
            const existeCedula = await pool.request()
                .input('cedula', db.sql.VarChar, datos.Cedula)
                .query('SELECT 1 FROM Doctores WHERE Cedula = @cedula');
            
            if (existeCedula.recordset.length > 0) {
                throw new Error('Ya existe un doctor con esa Cédula');
            }
            
            // Si viene con usuario, validar username único
            if (datos.Username) {
                const existeUser = await pool.request()
                    .input('username', db.sql.VarChar, datos.Username)
                    .query('SELECT 1 FROM Usuarios WHERE Username = @username');
                
                if (existeUser.recordset.length > 0) {
                    throw new Error('El nombre de usuario ya está en uso');
                }
            }
            
            let userId = null;
            
            // Crear usuario si se proporcionó
            if (datos.Username && datos.Password) {
                const userResult = await pool.request()
                    .input('username', db.sql.VarChar, datos.Username)
                    .input('password', db.sql.VarChar, datos.Password)
                    .input('correo', db.sql.VarChar, datos.Correo)
                    .input('tipo', db.sql.Int, 1) // 1 = Doctor
                    .query(`
                        INSERT INTO Usuarios (Username, Password, Correo, ID_Tipo_User)
                        VALUES (@username, @password, @correo, @tipo);
                        SELECT SCOPE_IDENTITY() AS Id_User;
                    `);
                
                userId = userResult.recordset[0].Id_User;
            }
            
            // Insertar empleado
            const empResult = await pool.request()
                .input('nombre', db.sql.VarChar, datos.Nombre)
                .input('paterno', db.sql.VarChar, datos.Paterno)
                .input('materno', db.sql.VarChar, datos.Materno || null)
                .input('curp', db.sql.VarChar, datos.CURP)
                .input('fechaNac', db.sql.Date, datos.Fecha_nac)
                .input('correo', db.sql.VarChar, datos.Correo)
                .input('telCel', db.sql.VarChar, datos.Telefono_cel)
                .input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia || null)
                .input('edad', db.sql.Int, datos.Edad)
                .input('sueldo', db.sql.Decimal(10, 2), datos.Sueldo)
                .input('sexo', db.sql.Char(1), datos.Sexo)
                .input('userId', db.sql.Int, userId)
                .query(`
                    INSERT INTO Empleados (Nombre, Paterno, Materno, CURP, Fecha_nac, Correo, Telefono_cel, Telefono_emergencia, Edad, Sueldo, Sexo, Id_User)
                    VALUES (@nombre, @paterno, @materno, @curp, @fechaNac, @correo, @telCel, @telEmerg, @edad, @sueldo, @sexo, @userId);
                    SELECT SCOPE_IDENTITY() AS Id_Empleado;
                `);
            
            const empleadoId = empResult.recordset[0].Id_Empleado;
            
            // Insertar doctor
            const docResult = await pool.request()
                .input('idEmpleado', db.sql.Int, empleadoId)
                .input('idEspecialidad', db.sql.Int, datos.Id_Especialidad)
                .input('rfc', db.sql.VarChar, datos.Rfc)
                .input('cedula', db.sql.VarChar, datos.Cedula)
                .query(`
                    INSERT INTO Doctores (Id_Empleado, Id_Especialidad, Rfc, Cedula)
                    VALUES (@idEmpleado, @idEspecialidad, @rfc, @cedula);
                    SELECT SCOPE_IDENTITY() AS Id_Doctor;
                `);
            
            const doctorId = docResult.recordset[0].Id_Doctor;
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, doctorId)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Doctor creado: ${datos.Nombre} ${datos.Paterno} - Cédula: ${datos.Cedula}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'INSERT', 'Doctores')
                `);
            
            return { Id_Doctor: doctorId, Id_Empleado: empleadoId, Id_User: userId };
            
        } catch (error) {
            console.error('❌ Error al crear doctor:', error);
            throw error;
        }
    }

    async actualizarDoctor(idDoctor, datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que el doctor existe y obtener Id_Empleado
            const docInfo = await pool.request()
                .input('id', db.sql.Int, idDoctor)
                .query('SELECT Id_Empleado FROM Doctores WHERE Id_Doctor = @id');
            
            if (docInfo.recordset.length === 0) {
                throw new Error('Doctor no encontrado');
            }
            
            const idEmpleado = docInfo.recordset[0].Id_Empleado;
            
            // Actualizar datos en Empleados
            const empUpdates = [];
            const empRequest = pool.request().input('id', db.sql.Int, idEmpleado);
            
            if (datos.Telefono_cel) {
                empUpdates.push('Telefono_cel = @telCel');
                empRequest.input('telCel', db.sql.VarChar, datos.Telefono_cel);
            }
            if (datos.Correo) {
                empUpdates.push('Correo = @correo');
                empRequest.input('correo', db.sql.VarChar, datos.Correo);
            }
            if (datos.Telefono_emergencia) {
                empUpdates.push('Telefono_emergencia = @telEmerg');
                empRequest.input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia);
            }
            if (datos.Sueldo) {
                empUpdates.push('Sueldo = @sueldo');
                empRequest.input('sueldo', db.sql.Decimal(10, 2), datos.Sueldo);
            }
            
            if (empUpdates.length > 0) {
                await empRequest.query(`
                    UPDATE Empleados
                    SET ${empUpdates.join(', ')}
                    WHERE Id_Empleado = @id
                `);
            }
            
            // Actualizar especialidad si se proporciona
            if (datos.Id_Especialidad) {
                await pool.request()
                    .input('id', db.sql.Int, idDoctor)
                    .input('esp', db.sql.Int, datos.Id_Especialidad)
                    .query('UPDATE Doctores SET Id_Especialidad = @esp WHERE Id_Doctor = @id');
            }
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idDoctor)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Doctor actualizado - ID: ${idDoctor}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Doctores')
                `);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar doctor:', error);
            throw error;
        }
    }

    // ==================== RECEPCIONISTAS ====================

    async listarRecepcionistas(filtros = {}) {
        try {
            const pool = await db.connect();
            const request = pool.request();
            
            let query = `
                SELECT 
                    E.Id_Empleado,
                    E.Nombre,
                    E.Paterno,
                    E.Materno,
                    E.Correo,
                    E.Telefono_cel,
                    E.Edad,
                    E.Sexo,
                    E.CURP,
                    E.Sueldo,
                    U.Username,
                    U.Id_User
                FROM Empleados E
                INNER JOIN Usuarios U ON E.Id_User = U.Id_User
                WHERE U.ID_Tipo_User = 3
            `;
            
            if (filtros.busqueda) {
                query += ` AND (E.Nombre LIKE @busqueda OR E.Paterno LIKE @busqueda OR E.CURP LIKE @busqueda)`;
                request.input('busqueda', db.sql.VarChar, `%${filtros.busqueda}%`);
            }
            
            query += ` ORDER BY E.Paterno, E.Nombre`;
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar recepcionistas:', error);
            throw new Error('Error al obtener lista de recepcionistas');
        }
    }

    async obtenerRecepcionistaPorId(idEmpleado) {
        try {
            const pool = await db.connect();
            
            const result = await pool.request()
                .input('id', db.sql.Int, idEmpleado)
                .query(`
                    SELECT 
                        E.*,
                        U.Username,
                        U.Id_User
                    FROM Empleados E
                    INNER JOIN Usuarios U ON E.Id_User = U.Id_User
                    WHERE E.Id_Empleado = @id AND U.ID_Tipo_User = 3
                `);
            
            if (result.recordset.length === 0) {
                throw new Error('Recepcionista no encontrado');
            }
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al obtener recepcionista:', error);
            throw error;
        }
    }

    async crearRecepcionista(datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Validar CURP único
            const existeCURP = await pool.request()
                .input('curp', db.sql.VarChar, datos.CURP)
                .query('SELECT 1 FROM Empleados WHERE CURP = @curp');
            
            if (existeCURP.recordset.length > 0) {
                throw new Error('Ya existe un empleado con ese CURP');
            }
            
            // Validar username único (obligatorio para recepcionista)
            if (!datos.Username || !datos.Password) {
                throw new Error('Username y Password son obligatorios para recepcionistas');
            }

            const existeUser = await pool.request()
                .input('username', db.sql.VarChar, datos.Username)
                .query('SELECT 1 FROM Usuarios WHERE Username = @username');
            
            if (existeUser.recordset.length > 0) {
                throw new Error('El nombre de usuario ya está en uso');
            }
            
            // Crear usuario (obligatorio para recepcionista)
            const userResult = await pool.request()
                .input('username', db.sql.VarChar, datos.Username)
                .input('password', db.sql.VarChar, datos.Password)
                .input('correo', db.sql.VarChar, datos.Correo)
                .input('tipo', db.sql.Int, 3) // 3 = Recepcionista
                .query(`
                    INSERT INTO Usuarios (Username, Password, Correo, ID_Tipo_User)
                    VALUES (@username, @password, @correo, @tipo);
                    SELECT SCOPE_IDENTITY() AS Id_User;
                `);
            
            const userId = userResult.recordset[0].Id_User;
            
            // Insertar empleado
            const empResult = await pool.request()
                .input('nombre', db.sql.VarChar, datos.Nombre)
                .input('paterno', db.sql.VarChar, datos.Paterno)
                .input('materno', db.sql.VarChar, datos.Materno || null)
                .input('curp', db.sql.VarChar, datos.CURP)
                .input('fechaNac', db.sql.Date, datos.Fecha_nac)
                .input('correo', db.sql.VarChar, datos.Correo)
                .input('telCel', db.sql.VarChar, datos.Telefono_cel)
                .input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia || null)
                .input('edad', db.sql.Int, datos.Edad)
                .input('sueldo', db.sql.Decimal(10, 2), datos.Sueldo)
                .input('sexo', db.sql.Char(1), datos.Sexo)
                .input('userId', db.sql.Int, userId)
                .query(`
                    INSERT INTO Empleados (Nombre, Paterno, Materno, CURP, Fecha_nac, Correo, Telefono_cel, Telefono_emergencia, Edad, Sueldo, Sexo, Id_User)
                    VALUES (@nombre, @paterno, @materno, @curp, @fechaNac, @correo, @telCel, @telEmerg, @edad, @sueldo, @sexo, @userId);
                    SELECT SCOPE_IDENTITY() AS Id_Empleado;
                `);
            
            const empleadoId = empResult.recordset[0].Id_Empleado;
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, empleadoId)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Recepcionista creado: ${datos.Nombre} ${datos.Paterno}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'INSERT', 'Empleados')
                `);
            
            return { Id_Empleado: empleadoId, Id_User: userId };
            
        } catch (error) {
            console.error('❌ Error al crear recepcionista:', error);
            throw error;
        }
    }

    async actualizarRecepcionista(idEmpleado, datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que el empleado existe y es recepcionista
            const existe = await pool.request()
                .input('id', db.sql.Int, idEmpleado)
                .query(`
                    SELECT 1 FROM Empleados E
                    INNER JOIN Usuarios U ON E.Id_User = U.Id_User
                    WHERE E.Id_Empleado = @id AND U.ID_Tipo_User = 3
                `);
            
            if (existe.recordset.length === 0) {
                throw new Error('Recepcionista no encontrado');
            }
            
            // Construir UPDATE dinámico
            const updates = [];
            const request = pool.request().input('id', db.sql.Int, idEmpleado);
            
            if (datos.Telefono_cel) {
                updates.push('Telefono_cel = @telCel');
                request.input('telCel', db.sql.VarChar, datos.Telefono_cel);
            }
            if (datos.Correo) {
                updates.push('Correo = @correo');
                request.input('correo', db.sql.VarChar, datos.Correo);
            }
            if (datos.Telefono_emergencia) {
                updates.push('Telefono_emergencia = @telEmerg');
                request.input('telEmerg', db.sql.VarChar, datos.Telefono_emergencia);
            }
            if (datos.Sueldo) {
                updates.push('Sueldo = @sueldo');
                request.input('sueldo', db.sql.Decimal(10, 2), datos.Sueldo);
            }
            
            if (updates.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            await request.query(`
                UPDATE Empleados
                SET ${updates.join(', ')}
                WHERE Id_Empleado = @id
            `);
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idEmpleado)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Recepcionista actualizado - Campos: ${updates.join(', ')}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Empleados')
                `);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar recepcionista:', error);
            throw error;
        }
    }

    // ==================== SERVICIOS EXTRA ====================

    async listarServicios() {
        try {
            const pool = await db.connect();
            
            const result = await pool.request().query(`
                SELECT 
                    Id_Servicio,
                    Nombre,
                    Descripcion,
                    Precio
                FROM Servicios
                ORDER BY Nombre
            `);
            
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar servicios:', error);
            throw new Error('Error al obtener lista de servicios');
        }
    }

    async venderServicio(datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Usar farmacéutico por defecto si no se proporciona (ID 1)
            const idFarmaceutico = datos.Id_Farmaceutico || 1;
            
            // Crear venta
            const ventaResult = await pool.request()
                .input('idFarm', db.sql.Int, idFarmaceutico)
                .input('cliente', db.sql.VarChar, datos.Nombre_Cliente)
                .input('estatus', db.sql.Int, 1) // 1 = Pagado
                .query(`
                    INSERT INTO Venta (Id_Farmaceutico, Fecha_Hora, Nombre_Cliente, Estatus)
                    VALUES (@idFarm, GETDATE(), @cliente, @estatus);
                    SELECT SCOPE_IDENTITY() AS Id_Venta;
                `);
            
            const idVenta = ventaResult.recordset[0].Id_Venta;
            
            // Insertar detalles de servicios
            let totalVenta = 0;
            for (const servicio of datos.servicios) {
                // Obtener precio del servicio
                const precioResult = await pool.request()
                    .input('id', db.sql.Int, servicio.Id_Servicio)
                    .query('SELECT Precio FROM Servicios WHERE Id_Servicio = @id');
                
                if (precioResult.recordset.length === 0) {
                    throw new Error(`Servicio ${servicio.Id_Servicio} no encontrado`);
                }
                
                const precio = precioResult.recordset[0].Precio;
                const cantidad = servicio.Cantidad || 1;
                const total = precio * cantidad;
                totalVenta += total;
                
                await pool.request()
                    .input('idVenta', db.sql.Int, idVenta)
                    .input('idServicio', db.sql.Int, servicio.Id_Servicio)
                    .input('cant', db.sql.Int, cantidad)
                    .query(`
                        INSERT INTO Detalle_Servicio (Id_Venta, Id_Servicio, Cantidad)
                        VALUES (@idVenta, @idServicio, @cant)
                    `);
            }
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idVenta)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Venta de servicios - Cliente: ${datos.Nombre_Cliente} - Total: $${totalVenta.toFixed(2)}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'INSERT', 'Venta')
                `);
            
            return { Id_Venta: idVenta, Total: totalVenta };
            
        } catch (error) {
            console.error('❌ Error al vender servicio:', error);
            throw error;
        }
    }

    // ==================== FARMACIA ====================

    async listarMedicamentos(filtros = {}) {
        try {
            const pool = await db.connect();
            const request = pool.request();
            
            let query = `
                SELECT 
                    Id_Medicamento,
                    Nombre,
                    Descripcion,
                    Presentacion,
                    Stock,
                    Precio
                FROM Medicamento
                WHERE 1=1
            `;
            
            if (filtros.busqueda) {
                query += ` AND (Nombre LIKE @busqueda OR Descripcion LIKE @busqueda)`;
                request.input('busqueda', db.sql.VarChar, `%${filtros.busqueda}%`);
            }
            
            if (filtros.sinStock === 'true') {
                query += ` AND Stock <= 0`;
            }
            
            query += ` ORDER BY Nombre`;
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar medicamentos:', error);
            throw new Error('Error al obtener inventario de medicamentos');
        }
    }

    async venderMedicamento(datos) {
        let pool;
        try {
            pool = await db.connect();
            
            // Usar farmacéutico por defecto si no se proporciona (ID 1)
            const idFarmaceutico = datos.Id_Farmaceutico || 1;
            
            // Validar stock disponible para cada medicamento
            for (const med of datos.medicamentos) {
                const stockResult = await pool.request()
                    .input('id', db.sql.Int, med.Id_Medicamento)
                    .query('SELECT Stock, Nombre FROM Medicamento WHERE Id_Medicamento = @id');
                
                if (stockResult.recordset.length === 0) {
                    throw new Error(`Medicamento ${med.Id_Medicamento} no encontrado`);
                }
                
                const stockActual = stockResult.recordset[0].Stock;
                const nombre = stockResult.recordset[0].Nombre;
                const cantidad = med.Cantidad || 1;
                
                if (stockActual < cantidad) {
                    throw new Error(`Stock insuficiente para ${nombre}. Disponible: ${stockActual}, Solicitado: ${cantidad}`);
                }
            }
            
            // Crear venta
            const ventaResult = await pool.request()
                .input('idFarm', db.sql.Int, idFarmaceutico)
                .input('cliente', db.sql.VarChar, datos.Nombre_Cliente)
                .input('estatus', db.sql.Int, 1) // 1 = Pagado
                .query(`
                    INSERT INTO Venta (Id_Farmaceutico, Fecha_Hora, Nombre_Cliente, Estatus)
                    VALUES (@idFarm, GETDATE(), @cliente, @estatus);
                    SELECT SCOPE_IDENTITY() AS Id_Venta;
                `);
            
            const idVenta = ventaResult.recordset[0].Id_Venta;
            
            // Insertar detalles y actualizar stock
            let totalVenta = 0;
            for (const med of datos.medicamentos) {
                // Obtener precio
                const precioResult = await pool.request()
                    .input('id', db.sql.Int, med.Id_Medicamento)
                    .query('SELECT Precio, Nombre FROM Medicamento WHERE Id_Medicamento = @id');
                
                const precio = precioResult.recordset[0].Precio;
                const nombre = precioResult.recordset[0].Nombre;
                const cantidad = med.Cantidad || 1;
                const total = precio * cantidad;
                totalVenta += total;
                
                // Insertar detalle
                await pool.request()
                    .input('idVenta', db.sql.Int, idVenta)
                    .input('idMed', db.sql.Int, med.Id_Medicamento)
                    .input('cant', db.sql.Int, cantidad)
                    .query(`
                        INSERT INTO Detalles_med (Id_Venta, Id_Medicamento, Cantidad)
                        VALUES (@idVenta, @idMed, @cant)
                    `);
                
                // Actualizar stock
                await pool.request()
                    .input('id', db.sql.Int, med.Id_Medicamento)
                    .input('cant', db.sql.Int, cantidad)
                    .query('UPDATE Medicamento SET Stock = Stock - @cant WHERE Id_Medicamento = @id');
            }
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idVenta)
                .input('usr', db.sql.VarChar, datos.UsuarioRegistro || 'Sistema')
                .input('det', db.sql.VarChar, `Venta de medicamentos - Cliente: ${datos.Nombre_Cliente} - Total: $${totalVenta.toFixed(2)}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'INSERT', 'Venta')
                `);
            
            return { Id_Venta: idVenta, Total: totalVenta };
            
        } catch (error) {
            console.error('❌ Error al vender medicamento:', error);
            throw error;
        }
    }

    async actualizarStockMedicamento(idMedicamento, nuevoStock) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que el medicamento existe
            const existe = await pool.request()
                .input('id', db.sql.Int, idMedicamento)
                .query('SELECT Nombre FROM Medicamento WHERE Id_Medicamento = @id');
            
            if (existe.recordset.length === 0) {
                throw new Error('Medicamento no encontrado');
            }
            
            const nombre = existe.recordset[0].Nombre;
            
            // Actualizar stock
            await pool.request()
                .input('id', db.sql.Int, idMedicamento)
                .input('stock', db.sql.Int, nuevoStock)
                .query('UPDATE Medicamento SET Stock = @stock WHERE Id_Medicamento = @id');
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idMedicamento)
                .input('det', db.sql.VarChar, `Stock actualizado para ${nombre} - Nuevo stock: ${nuevoStock}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), 'Sistema', @det, 'UPDATE', 'Medicamento')
                `);
            
            return true;
            
        } catch (error) {
            console.error('❌ Error al actualizar stock:', error);
            throw error;
        }
    }

    // ==================== CANCELAR CITAS ====================

    async cancelarCitaRecepcionista(idCita, motivo, usuarioRegistro) {
        let pool;
        try {
            pool = await db.connect();
            
            // Ejecutar SP de cancelación
            const result = await pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .input('Motivo', db.sql.VarChar, motivo)
                .input('Cancelado_Por', db.sql.VarChar, 'Recepcionista')
                .input('Usuario', db.sql.VarChar, usuarioRegistro)
                .execute('SP_CancelarCita');
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idCita)
                .input('usr', db.sql.VarChar, usuarioRegistro)
                .input('det', db.sql.VarChar, `Cita cancelada por recepcionista - Motivo: ${motivo}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Citas')
                `);
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al cancelar cita:', error);
            throw error;
        }
    }
}

module.exports = new RecepcionService();
