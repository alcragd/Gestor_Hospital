const db = require('../config/db.config');

class CitaService {
    
    // --- LÓGICA DE CREACIÓN DE CITA ---
    async crearCita(datosCita) {
        const { Id_Doctor, Id_Paciente, Fecha_Cita, Hora_Inicio, Hora_Fin, Usuario } = datosCita;
        let pool;
        let tx;
        try {
            pool = await db.connect();

            const fechaRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
            const horaRegex = /^\d{2}:\d{2}(:\d{2})?$/; // HH:MM o HH:MM:SS
            if (!fechaRegex.test(Fecha_Cita)) throw new Error('Formato de fecha inválido. Debe ser YYYY-MM-DD');
            if (!horaRegex.test(Hora_Inicio) || !horaRegex.test(Hora_Fin)) throw new Error('Formato de hora inválido. Debe ser HH:MM o HH:MM:SS');

            // Ejecutar SET LANGUAGE y SP en la MISMA conexión usando una transacción
            tx = new db.sql.Transaction(pool);
            await tx.begin();
            const request = new db.sql.Request(tx);
            await request.query('SET LANGUAGE Spanish');

            // Limpiar inputs del request anterior y volver a setearlos
            const execReq = new db.sql.Request(tx);
            execReq
                .input('Id_Doctor', db.sql.Int, Id_Doctor)
                .input('Id_Paciente', db.sql.Int, Id_Paciente)
                .input('Fecha_Cita', db.sql.VarChar(10), Fecha_Cita)
                .input('Hora_Inicio', db.sql.VarChar(8), Hora_Inicio)
                .input('Hora_Fin', db.sql.VarChar(8), Hora_Fin)
                .input('Usuario', db.sql.VarChar(50), Usuario);

            const result = await execReq.execute('CrearCita');
            await tx.commit();

            // El procedimiento devuelve un mensaje
            const mensaje = (result.recordset && result.recordset[0] && result.recordset[0].Mensaje)
                ? result.recordset[0].Mensaje
                : 'Cita creada exitosamente';

            return { success: true, message: mensaje, data: result };
        } catch (error) {
            console.error('Error al crear cita:', error.message);
            
            throw new Error('Error al crear la cita: ' + error.message);
        } finally {
            // No cerrar el pool - es global y se reutiliza
            // if (pool) pool.close();
            if (tx && tx._aborted !== true && tx._state === 'started') {
                try { await tx.rollback(); } catch {}
            }
        }
    }



    
    // --- LÓGICA PARA OBTENER CITAS DEL PACIENTE ---
    async obtenerCitasPaciente(pacienteId) {
    let pool;
    try {
        pool = await db.connect();
        
        console.log('🔍 Consultando citas para paciente ID:', pacienteId);
        
        const request = pool.request()
            .input('pacienteId', db.sql.Int, pacienteId);  // ⭐ AGREGAR PARÁMETRO
        
        const result = await request.query(
            `SELECT * FROM VW_Citas_Completas_Paciente 
            WHERE ID_Paciente = @pacienteId  -- ⭐ USAR PARÁMETRO, NO 3
            ORDER BY Fecha_cita DESC, Hora_Inicio DESC`
        );
        
        console.log(`✅ Se encontraron ${result.recordset.length} citas para paciente ${pacienteId}`);
        
        return result.recordset;
    } catch (error) {
        console.error('❌ Error al obtener citas:', error);
        throw new Error('Error de base de datos al obtener citas.');
    } finally {
        if (pool) pool.close();
    }
}

    async obtenerEspecialidades() {
        let pool;
        try {
            pool = await db.connect();
            // Obtener especialidades únicas (agrupar por nombre para evitar duplicados)
            // que tengan al menos un doctor disponible
            const result = await pool.request().query(`
                SELECT MIN(ES.Id_Especialidad) AS Id_Especialidad, ES.Nombre 
                FROM Especialidades ES
                INNER JOIN Doctores D ON ES.Id_Especialidad = D.Id_Especialidad
                GROUP BY ES.Nombre
                ORDER BY ES.Nombre
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error en obtenerEspecialidades:', error.message);
            throw new Error('Error al obtener especialidades.');
        } finally {
            if (pool) pool.close();
        }
    }

    async obtenerEspecialidadesAll() {
        let pool;
        try {
            pool = await db.connect();
            // Obtener TODAS las especialidades disponibles (sin filtro de doctores)
            // agrupadas por nombre para evitar duplicados
            const result = await pool.request().query(`
                SELECT MIN(ES.Id_Especialidad) AS Id_Especialidad, ES.Nombre 
                FROM Especialidades ES
                GROUP BY ES.Nombre
                ORDER BY ES.Nombre
            `);
            return result.recordset;
        } catch (error) {
            console.error('Error en obtenerEspecialidadesAll:', error.message);
            throw new Error('Error al obtener especialidades.');
        } finally {
            if (pool) pool.close();
        }
    }

    // Nuevo método 2: Obtener doctores por especialidad
    async obtenerDoctoresPorEspecialidad(id_especialidad) {
        let pool;
        try {
            pool = await db.connect();
            const result = await pool.request()
                .input('Id_Especialidad', db.sql.Int, id_especialidad)
                .query(`
                    SELECT 
                        D.Id_Doctor, 
                        E.Nombre + ' ' + E.Paterno AS NombreCompleto 
                    FROM Doctores D
                    JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
                    WHERE D.Id_Especialidad = @Id_Especialidad
                    ORDER BY E.Paterno
                `);
            return result.recordset;
        } catch (error) {
            throw new Error('Error al obtener doctores por especialidad.');
        } finally {
            if (pool) pool.close();
        }
    }

    // Nuevo método 3: Obtener slots ocupados para un doctor en una fecha (la lógica de disponibilidad se hará en Vue)
    async obtenerSlotsOcupados(id_doctor, fecha) {
        let pool;
        try {
            pool = await db.connect();
            const result = await pool.request()
                .input('Id_Doctor', db.sql.Int, id_doctor)
                .input('Fecha_cita', db.sql.Date, fecha)
                .query(`
                    SELECT 
                        CONVERT(VARCHAR(8), C.Hora_Inicio, 108) AS Hora_Inicio,
                        CONVERT(VARCHAR(8), C.Hora_Fin, 108) AS Hora_Fin
                    FROM Citas C
                    WHERE 
                        C.Id_Doc = @Id_Doctor 
                        AND C.Fecha_cita = @Fecha_cita
                        AND C.ID_Estatus IN (SELECT Id_Estatus FROM Estatus_Cita WHERE Nombre IN ('Agendada - Pendiente de Pago', 'Pagada - Pendiente por Atender'))
                `);
            console.log('Horas ocupadas:', result.recordset);

            return result.recordset; // Devuelve [{ Hora_Inicio: '10:00:00', Hora_Fin: '11:00:00' }, ...]
        } catch (error) {
            throw new Error('Error al obtener horarios ocupados.');
        } finally {
            if (pool) pool.close();
        }
    }
    
    async obtenerHorasTrabajoTotal(id_doctor, fecha) {
        let pool;
        try {
            pool = await db.connect();
            console.log('ID Doctor:', id_doctor, 'Fecha:', fecha);
            
            // Parsear la fecha en formato YYYY-MM-DD sin problemas de timezone UTC
            // getDay() retorna 0=Domingo, 1=Lunes, ..., 6=Sábado
            const [year, month, day] = fecha.split('-').map(Number);
            const fechaObj = new Date(year, month - 1, day); // month es 0-indexed en JavaScript
            if (isNaN(fechaObj.getTime())) {
                throw new Error(`Fecha inválida: ${fecha}`);
            }
            
            const dayIndex = fechaObj.getDay();
            const diasEspañol = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const diaSemanaEspañol = diasEspañol[dayIndex];
            
            console.log('Fecha parseada:', `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
            console.log('Día de la semana (índice dayIndex):', dayIndex);
            console.log('Día de la semana obtenido:', diaSemanaEspañol);

            const result = await pool.request()
                .input('Id_Doctor', db.sql.Int, id_doctor)
                .input('DiaSemana', db.sql.VarChar, diaSemanaEspañol)
                .query(`
                    SELECT     
                        CONVERT(VARCHAR(8), H.Hora_Inicio, 108) AS Hora_Inicio,
                        CONVERT(VARCHAR(8), H.Hora_Fin, 108) AS Hora_Fin,
                        H.Dia_Semana AS Dia_Registrado
                    FROM Doctores D
                    JOIN Empleados E ON E.Id_Empleado = D.Id_Empleado
                    JOIN Empleado_Horario EH ON EH.Id_Empleado = E.Id_Empleado
                    JOIN Horario H ON H.Id_Horario = EH.Id_Horario
                    WHERE 
                        D.Id_Doctor = @Id_Doctor
                        AND H.Dia_Semana = @DiaSemana
                    ORDER BY H.Hora_Inicio
                `);

            console.log('Horas de trabajo:', result.recordset);
            console.log('Número de registros encontrados:', result.recordset.length);
            
            return result.recordset;
        } catch (error) {
            console.error('Error en obtenerHorasTrabajoTotal:', error.message);
            throw new Error('Error al obtener el horario de trabajo del doctor.');
        } finally {
            if (pool) pool.close();
        }
    }
}

module.exports = new CitaService();