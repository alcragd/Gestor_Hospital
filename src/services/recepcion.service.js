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
                    E.Activo,
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

            if (!filtros.incluirInactivos) {
                query += ` AND E.Activo = 1`;
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
                        E.Activo,
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

    // ==================== HORARIO DOCTOR ====================

    async obtenerHorarioDoctorPorDia(idDoctor, diaSemana) {
        try {
            const pool = await db.connect();
            const result = await pool.request()
                .input('Id_Doctor', db.sql.Int, idDoctor)
                .input('DiaSemana', db.sql.VarChar, diaSemana)
                .query(`
                    SELECT 
                        CONVERT(VARCHAR(8), H.Hora_Inicio, 108) AS Hora_Inicio,
                        CONVERT(VARCHAR(8), H.Hora_Fin, 108) AS Hora_Fin
                    FROM Doctores D
                    JOIN Empleados E ON E.Id_Empleado = D.Id_Empleado
                    JOIN Empleado_Horario EH ON EH.Id_Empleado = E.Id_Empleado
                    JOIN Horario H ON H.Id_Horario = EH.Id_Horario
                    WHERE D.Id_Doctor = @Id_Doctor AND H.Dia_Semana = @DiaSemana
                    ORDER BY H.Hora_Inicio
                `);
            return result.recordset;
        } catch (error) {
            console.error('❌ Error al obtener horario doctor:', error);
            throw new Error('Error al obtener horario');
        }
    }

    async actualizarHorarioDoctor(idDoctor, diaSemana, bloques, usuarioRegistro = 'Recepcionista') {
        const pool = await db.connect();
        const transaction = new db.sql.Transaction(pool);
        try {
            await transaction.begin();
            const req = new db.sql.Request(transaction);

            // Obtener Id_Empleado
            const info = await req
                .input('Id_Doctor', db.sql.Int, idDoctor)
                .query('SELECT Id_Empleado FROM Doctores WHERE Id_Doctor = @Id_Doctor');
            if (info.recordset.length === 0) throw new Error('Doctor no encontrado');
            const idEmpleado = info.recordset[0].Id_Empleado;

            // Validación: asegurar que los nuevos bloques no afectan citas ya agendadas
            // Traer citas futuras activas del doctor y filtrar por el día de semana indicado
            const futuras = await req
                .input('Id_Doctor', db.sql.Int, idDoctor)
                .query(`
                    SELECT 
                        C.Id_Cita,
                        C.Fecha_cita,
                        CONVERT(VARCHAR(8), C.Hora_Inicio, 108) AS Hora_Inicio,
                        CONVERT(VARCHAR(8), C.Hora_Fin, 108)   AS Hora_Fin
                    FROM Citas C
                    WHERE C.Id_Doc = @Id_Doctor
                      AND C.Fecha_cita >= CAST(GETDATE() AS DATE)
                      AND C.ID_Estatus IN (
                        SELECT Id_Estatus FROM Estatus_Cita 
                        WHERE Nombre IN ('Agendada - Pendiente de Pago', 'Pagada - Pendiente por Atender')
                      )
                `);

            const dias = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
            const pad = (s) => (s.length===5 ? s+':00' : s);
            const dentroDeBloque = (ini, fin, blocks) => {
                const i = pad(ini); const f = pad(fin);
                return blocks.some(b => {
                    const bi = pad(b.inicio); const bf = pad(b.fin);
                    return (i >= bi && f <= bf);
                });
            };

            const conflictos = [];
            for (const c of futuras.recordset) {
                const jsDate = new Date(c.Fecha_cita);
                const dia = dias[jsDate.getDay()];
                if (dia !== diaSemana) continue;
                if (!dentroDeBloque(c.Hora_Inicio, c.Hora_Fin, bloques)) {
                    conflictos.push({
                        Id_Cita: c.Id_Cita,
                        Fecha_cita: jsDate.toISOString().slice(0,10),
                        Hora_Inicio: c.Hora_Inicio,
                        Hora_Fin: c.Hora_Fin
                    });
                }
            }

            if (conflictos.length > 0) {
                const detalle = conflictos.slice(0,5)
                    .map(x => `#${x.Id_Cita} ${x.Fecha_cita} ${x.Hora_Inicio}-${x.Hora_Fin}`)
                    .join(', ');
                throw new Error(`Horario incompatible con citas existentes (${diaSemana}). Conflictos: ${detalle}${conflictos.length>5?` (+${conflictos.length-5} más)`:''}`);
            }

            // Obtener horarios actuales del día
            const actuales = await req
                .input('Id_Empleado', db.sql.Int, idEmpleado)
                .input('Dia', db.sql.VarChar, diaSemana)
                .query(`
                    SELECT H.Id_Horario
                    FROM Empleado_Horario EH
                    JOIN Horario H ON H.Id_Horario = EH.Id_Horario
                    WHERE EH.Id_Empleado = @Id_Empleado AND H.Dia_Semana = @Dia
                `);

            // Eliminar mapeos y horarios del día
            for (const row of actuales.recordset) {
                await req
                    .input('Id_Horario', db.sql.Int, row.Id_Horario)
                    .query('DELETE FROM Empleado_Horario WHERE Id_Empleado = @Id_Empleado AND Id_Horario = @Id_Horario');
                await req
                    .input('Id_Horario', db.sql.Int, row.Id_Horario)
                    .query('DELETE FROM Horario WHERE Id_Horario = @Id_Horario');
            }

            // Insertar nuevos bloques y mapear
            for (const b of bloques) {
                const ins = await req
                    .input('Dia', db.sql.VarChar, diaSemana)
                    .input('Inicio', db.sql.VarChar, b.inicio)
                    .input('Fin', db.sql.VarChar, b.fin)
                    .query(`
                        INSERT INTO Horario (Dia_Semana, Hora_Inicio, Hora_Fin)
                        VALUES (@Dia, @Inicio, @Fin);
                        SELECT SCOPE_IDENTITY() AS Id_Horario;
                    `);
                const idHor = ins.recordset[0].Id_Horario;
                await req
                    .input('Id_Horario', db.sql.Int, idHor)
                    .query('INSERT INTO Empleado_Horario (Id_Empleado, Id_Horario) VALUES (@Id_Empleado, @Id_Horario)');
            }

            await transaction.commit();

            // Bitácora
            await pool.request()
                .input('reg', db.sql.Int, idDoctor)
                .input('usr', db.sql.VarChar, usuarioRegistro)
                .input('det', db.sql.VarChar, `Horario actualizado para ${diaSemana} - Bloques: ${bloques.length}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Horario')
                `);

            return true;
        } catch (error) {
            await transaction.rollback();
            console.error('❌ Error al actualizar horario doctor:', error);
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
                    E.Activo,
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

            if (!filtros.incluirInactivos) {
                query += ` AND E.Activo = 1`;
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

    // ==================== CANCELACIÓN DE CITAS ====================

    async listarCitas(filtros = {}) {
        try {
            const pool = await db.connect();
            const request = pool.request();
            
            let query = `
                SELECT 
                    c.Id_Cita,
                    c.ID_Paciente,
                    c.Id_Doc,
                    c.Fecha_cita,
                    c.Hora_Inicio,
                    c.Hora_Fin,
                    c.ID_Estatus,
                    e.Nombre AS Estatus,
                    CONCAT(emp.Nombre, ' ', emp.Paterno, ' ', ISNULL(emp.Materno, '')) AS Nombre_Doctor,
                    d.Id_Doctor,
                    CONCAT(p.Nombre, ' ', p.Paterno, ' ', ISNULL(p.Materno, '')) AS Nombre_Paciente
                FROM Citas c
                INNER JOIN Estatus_Cita e ON c.ID_Estatus = e.ID_Estatus
                LEFT JOIN Doctores d ON c.Id_Doc = d.Id_Doctor
                LEFT JOIN Empleados emp ON d.Id_Empleado = emp.Id_Empleado
                LEFT JOIN Pacientes p ON c.ID_Paciente = p.ID_Paciente
                WHERE 1=1
            `;
            
            if (filtros.estatus) {
                query += ` AND c.ID_Estatus = @estatus`;
                request.input('estatus', db.sql.Int, parseInt(filtros.estatus));
            }
            
            if (filtros.doctor) {
                query += ` AND (emp.Nombre LIKE @doctor OR emp.Paterno LIKE @doctor OR d.Id_Doctor = @doctorId)`;
                request.input('doctor', db.sql.VarChar, `%${filtros.doctor}%`);
                request.input('doctorId', db.sql.Int, isNaN(filtros.doctor) ? 0 : parseInt(filtros.doctor));
            }
            
            if (filtros.paciente) {
                query += ` AND (p.Nombre LIKE @paciente OR p.Paterno LIKE @paciente OR c.ID_Paciente = @pacienteId)`;
                request.input('paciente', db.sql.VarChar, `%${filtros.paciente}%`);
                request.input('pacienteId', db.sql.Int, isNaN(filtros.paciente) ? 0 : parseInt(filtros.paciente));
            }
            
            if (filtros.fechaInicio) {
                query += ` AND c.Fecha_cita >= @fechaInicio`;
                request.input('fechaInicio', db.sql.Date, filtros.fechaInicio);
            }
            
            if (filtros.fechaFin) {
                query += ` AND c.Fecha_cita <= @fechaFin`;
                request.input('fechaFin', db.sql.Date, filtros.fechaFin);
            }
            
            query += ` ORDER BY c.Fecha_cita DESC, c.Hora_Inicio DESC`;
            
            const result = await request.query(query);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al listar citas:', error);
            throw new Error('Error al obtener lista de citas');
        }
    }

    async cancelarCitaRecepcionista(idCita, motivo, usuarioRegistro, canceladoPor = 'Paciente') {
        let pool;
        try {
            pool = await db.connect();
            
            // Ejecutar SP de cancelación
            const result = await pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .input('Motivo', db.sql.VarChar, motivo)
                .input('Cancelado_Por', db.sql.VarChar, canceladoPor)
                .input('Usuario', db.sql.VarChar, usuarioRegistro)
                .execute('SP_CancelarCita');
            
            // El SP devuelve Mensaje, Monto_Reembolso, Porcentaje_Reembolso
            const spPayload = (result && result.recordset && result.recordset[0]) || {
                Mensaje: 'Cancelación aplicada (stub SP_CancelarCita)',
                Monto_Reembolso: 0,
                Porcentaje_Reembolso: 0
            };
            spPayload.Id_Cita = idCita;
            spPayload.Estatus = 'Cancelada';
            spPayload.EstatusId = canceladoPor === 'Doctor' ? 5 : 4;
            
            // Registrar en bitácora
            await pool.request()
                .input('reg', db.sql.Int, idCita)
                .input('usr', db.sql.VarChar, usuarioRegistro)
                .input('det', db.sql.VarChar, `Cita cancelada por recepcionista - Motivo: ${motivo}`)
                .query(`
                    INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                    VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Citas')
                `);
            
            return spPayload;
            
        } catch (error) {
            console.error('❌ Error al cancelar cita:', error);
            throw error;
        }
    }

        async darDeBajaDoctor(idDoctor, usuarioRegistro = 'Recepcionista') {
            const pool = await db.connect();
            const transaction = new db.sql.Transaction(pool);

            try {
                await transaction.begin();
                const req = new db.sql.Request(transaction);

                const info = await req
                    .input('idDoctor', db.sql.Int, idDoctor)
                    .query(`
                        SELECT D.Id_Doctor, D.Id_Empleado, E.Activo
                        FROM Doctores D
                        INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
                        WHERE D.Id_Doctor = @idDoctor
                    `);

                if (info.recordset.length === 0) {
                    throw new Error('Doctor no encontrado');
                }

                const { Id_Empleado: idEmpleado, Activo } = info.recordset[0];
                if (Activo === false || Activo === 0) {
                    return { yaInactivo: true, canceladas: 0 };
                }

                await req
                    .input('idEmpleado', db.sql.Int, idEmpleado)
                    .query(`UPDATE Empleados SET Activo = 0 WHERE Id_Empleado = @idEmpleado`);

                // Obtener IDs de citas que serán canceladas
                const citasReq = new db.sql.Request(transaction);
                const citasACancelar = await citasReq
                    .input('idDoctor', db.sql.Int, idDoctor)
                    .query(`SELECT Id_Cita FROM Citas WHERE Id_Doc = @idDoctor AND ID_Estatus IN (1, 2)`);

                const cancelReq = new db.sql.Request(transaction);
                const cancelRes = await cancelReq
                    .input('idDoctor', db.sql.Int, idDoctor)
                    .query(`
                        UPDATE Citas
                        SET ID_Estatus = 5
                        WHERE Id_Doc = @idDoctor AND ID_Estatus IN (1, 2);
                        SELECT @@ROWCOUNT AS canceladas;
                    `);

                await transaction.commit();

                // Registrar en bitácora la baja del doctor
                await pool.request()
                    .input('reg', db.sql.Int, idDoctor)
                    .input('usr', db.sql.VarChar, usuarioRegistro)
                    .input('det', db.sql.VarChar, `Doctor dado de baja. Citas canceladas: ${cancelRes.recordset[0].canceladas}`)
                    .query(`
                        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                        VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Doctores')
                    `);

                // Registrar en bitácora cada cita cancelada individualmente
                for (const cita of citasACancelar.recordset) {
                    await pool.request()
                        .input('reg', db.sql.Int, cita.Id_Cita)
                        .input('usr', db.sql.VarChar, usuarioRegistro)
                        .input('det', db.sql.VarChar, `Cita cancelada por baja del doctor (ID: ${idDoctor})`)
                        .query(`
                            INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                            VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Citas')
                        `);
                }

                return { yaInactivo: false, canceladas: cancelRes.recordset[0].canceladas };

            } catch (error) {
                await transaction.rollback();
                console.error('❌ Error al dar de baja doctor:', error);
                throw error;
            }
        }

        async darDeBajaRecepcionista(idEmpleado, usuarioRegistro = 'Recepcionista') {
            const pool = await db.connect();
            const transaction = new db.sql.Transaction(pool);

            try {
                await transaction.begin();
                const req = new db.sql.Request(transaction);

                const info = await req
                    .input('idEmpleado', db.sql.Int, idEmpleado)
                    .query(`
                        SELECT E.Id_Empleado, E.Activo
                        FROM Empleados E
                        INNER JOIN Usuarios U ON E.Id_User = U.Id_User
                        WHERE E.Id_Empleado = @idEmpleado AND U.ID_Tipo_User = 3
                    `);

                if (info.recordset.length === 0) {
                    throw new Error('Recepcionista no encontrado');
                }

                const { Activo } = info.recordset[0];
                if (Activo === false || Activo === 0) {
                    return { yaInactivo: true };
                }

                await req.query(`UPDATE Empleados SET Activo = 0 WHERE Id_Empleado = @idEmpleado`);

                await transaction.commit();

                await pool.request()
                    .input('reg', db.sql.Int, idEmpleado)
                    .input('usr', db.sql.VarChar, usuarioRegistro)
                    .input('det', db.sql.VarChar, `Recepcionista dado de baja`)
                    .query(`
                        INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                        VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Empleados')
                    `);

                return { yaInactivo: false };

            } catch (error) {
                await transaction.rollback();
                console.error('❌ Error al dar de baja recepcionista:', error);
                throw error;
            }
        }

    // ═══════════════════════════════════════════════════════════════
    // HISTORIAL DE VENTAS
    // ═══════════════════════════════════════════════════════════════

    async obtenerHistorialVentas(filtros = {}) {
        let pool;
        try {
            pool = await db.connect();
            
            let query = `
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY V.Fecha_Hora DESC) AS Id_Venta,
                    'medicamento' AS Tipo,
                    V.Fecha_Hora AS Fecha,
                    M.Nombre AS Producto_Servicio,
                    V.Nombre_Cliente AS Cliente,
                    DM.Cantidad AS Cantidad,
                    M.Precio AS Precio_Unitario
                FROM Detalles_med DM
                INNER JOIN Venta V ON DM.Id_Venta = V.Id_Venta
                INNER JOIN Medicamento M ON DM.Id_Medicamento = M.Id_Medicamento
                WHERE 1=1
            `;
            
            const request = pool.request();
            
            if (filtros.fechaInicio) {
                query += ` AND CAST(V.Fecha_Hora AS DATE) >= @fechaInicio`;
                request.input('fechaInicio', db.sql.Date, filtros.fechaInicio);
            }
            
            if (filtros.fechaFin) {
                query += ` AND CAST(V.Fecha_Hora AS DATE) <= @fechaFin`;
                request.input('fechaFin', db.sql.Date, filtros.fechaFin);
            }
            
            if (filtros.tipo && filtros.tipo !== 'medicamento') {
                query = `SELECT * FROM (SELECT 1 AS dummy WHERE 1=0) AS empty`;
            }
            
            let queryServicios = `
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY V.Fecha_Hora DESC) AS Id_Venta,
                    'servicio' AS Tipo,
                    V.Fecha_Hora AS Fecha,
                    S.Nombre AS Producto_Servicio,
                    V.Nombre_Cliente AS Cliente,
                    DS.Cantidad AS Cantidad,
                    S.Precio AS Precio_Unitario
                FROM Detalle_Servicio DS
                INNER JOIN Venta V ON DS.Id_Venta = V.Id_Venta
                INNER JOIN Servicios S ON DS.Id_Servicio = S.Id_Servicio
                WHERE 1=1
            `;
            
            if (filtros.fechaInicio) {
                queryServicios += ` AND CAST(V.Fecha_Hora AS DATE) >= @fechaInicio`;
            }
            
            if (filtros.fechaFin) {
                queryServicios += ` AND CAST(V.Fecha_Hora AS DATE) <= @fechaFin`;
            }
            
            if (filtros.tipo && filtros.tipo !== 'servicio') {
                queryServicios = `SELECT * FROM (SELECT 1 AS dummy WHERE 1=0) AS empty`;
            }
            
            const queryFinal = `
                ${query}
                UNION ALL
                ${queryServicios}
                ORDER BY Fecha DESC
            `;
            
            const result = await request.query(queryFinal);
            return result.recordset;
            
        } catch (error) {
            console.error('❌ Error al obtener historial de ventas:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GESTIÓN DE MEDICAMENTOS
    // ═══════════════════════════════════════════════════════════════

    async crearMedicamento(data) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('nombre', db.sql.VarChar, data.Nombre)
                .input('presentacion', db.sql.VarChar, data.Presentacion)
                .input('dosis', db.sql.VarChar, data.Dosis)
                .input('precio', db.sql.Decimal(10, 2), data.Precio)
                .input('stock', db.sql.Int, data.Stock)
                .input('stockMin', db.sql.Int, data.Stock_Minimo)
                .query(`
                    INSERT INTO Medicamento (Nombre, Presentacion, Dosis, Precio, Stock, Stock_Minimo)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @presentacion, @dosis, @precio, @stock, @stockMin)
                `);
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al crear medicamento:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    async actualizarMedicamento(idMedicamento, data) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que existe
            const check = await pool.request()
                .input('id', db.sql.Int, idMedicamento)
                .query(`SELECT Id_Medicamento FROM Medicamento WHERE Id_Medicamento = @id`);
            
            if (check.recordset.length === 0) {
                throw new Error('Medicamento no encontrado');
            }
            
            const updates = [];
            const request = pool.request().input('id', db.sql.Int, idMedicamento);
            
            if (data.Nombre !== undefined) {
                updates.push('Nombre = @nombre');
                request.input('nombre', db.sql.VarChar, data.Nombre);
            }
            if (data.Presentacion !== undefined) {
                updates.push('Presentacion = @presentacion');
                request.input('presentacion', db.sql.VarChar, data.Presentacion);
            }
            if (data.Dosis !== undefined) {
                updates.push('Dosis = @dosis');
                request.input('dosis', db.sql.VarChar, data.Dosis);
            }
            if (data.Precio !== undefined) {
                updates.push('Precio = @precio');
                request.input('precio', db.sql.Decimal(10, 2), data.Precio);
            }
            if (data.Stock !== undefined) {
                updates.push('Stock = @stock');
                request.input('stock', db.sql.Int, data.Stock);
            }
            if (data.Stock_Minimo !== undefined) {
                updates.push('Stock_Minimo = @stockMin');
                request.input('stockMin', db.sql.Int, data.Stock_Minimo);
            }
            
            if (updates.length === 0) {
                return check.recordset[0];
            }
            
            const result = await request.query(`
                UPDATE Medicamento
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE Id_Medicamento = @id
            `);
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al actualizar medicamento:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    async eliminarMedicamento(idMedicamento) {
        let pool;
        try {
            pool = await db.connect();
            
            const check = await pool.request()
                .input('id', db.sql.Int, idMedicamento)
                .query(`SELECT Id_Medicamento FROM Medicamento WHERE Id_Medicamento = @id`);
            
            if (check.recordset.length === 0) {
                throw new Error('Medicamento no encontrado');
            }
            
            await pool.request()
                .input('id', db.sql.Int, idMedicamento)
                .query(`DELETE FROM Medicamento WHERE Id_Medicamento = @id`);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error al eliminar medicamento:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // GESTIÓN DE SERVICIOS
    // ═══════════════════════════════════════════════════════════════

    async crearServicio(data) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('nombre', db.sql.VarChar, data.Nombre)
                .input('descripcion', db.sql.VarChar, data.Descripcion)
                .input('precio', db.sql.Decimal(10, 2), data.Precio)
                .query(`
                    INSERT INTO Servicios (Nombre, Descripcion, Precio)
                    OUTPUT INSERTED.*
                    VALUES (@nombre, @descripcion, @precio)
                `);
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al crear servicio:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    async actualizarServicio(idServicio, data) {
        let pool;
        try {
            pool = await db.connect();
            
            // Verificar que existe
            const check = await pool.request()
                .input('id', db.sql.Int, idServicio)
                .query(`SELECT Id_Servicio FROM Servicios WHERE Id_Servicio = @id`);
            
            if (check.recordset.length === 0) {
                throw new Error('Servicio no encontrado');
            }
            
            const updates = [];
            const request = pool.request().input('id', db.sql.Int, idServicio);
            
            if (data.Nombre !== undefined) {
                updates.push('Nombre = @nombre');
                request.input('nombre', db.sql.VarChar, data.Nombre);
            }
            if (data.Descripcion !== undefined) {
                updates.push('Descripcion = @descripcion');
                request.input('descripcion', db.sql.VarChar, data.Descripcion);
            }
            if (data.Precio !== undefined) {
                updates.push('Precio = @precio');
                request.input('precio', db.sql.Decimal(10, 2), data.Precio);
            }
            
            if (updates.length === 0) {
                return check.recordset[0];
            }
            
            const result = await request.query(`
                UPDATE Servicios
                SET ${updates.join(', ')}
                OUTPUT INSERTED.*
                WHERE Id_Servicio = @id
            `);
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('❌ Error al actualizar servicio:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }

    async eliminarServicio(idServicio) {
        let pool;
        try {
            pool = await db.connect();
            
            const check = await pool.request()
                .input('id', db.sql.Int, idServicio)
                .query(`SELECT Id_Servicio FROM Servicios WHERE Id_Servicio = @id`);
            
            if (check.recordset.length === 0) {
                throw new Error('Servicio no encontrado');
            }
            
            await pool.request()
                .input('id', db.sql.Int, idServicio)
                .query(`DELETE FROM Servicios WHERE Id_Servicio = @id`);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Error al eliminar servicio:', error);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }
}

module.exports = new RecepcionService();
