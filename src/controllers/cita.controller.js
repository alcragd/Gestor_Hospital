const citaService = require('../services/cita.service');
const db = require('../config/db.config');

// POST /api/citas/agendar -> Paciente agenda su propia cita con generación de recibo
exports.agendarCitaPaciente = async (req, res) => {
    const userId = parseInt(req.headers['x-user-id'], 10);
    const role = parseInt(req.headers['x-user-role'], 10);
    const { Id_Doctor, Fecha_Cita, Hora_Inicio, Hora_Fin } = req.body;

    // Validar autenticación y rol
    if (!userId || role !== 4) {
        return res.status(403).json({ message: 'Acceso restringido a pacientes' });
    }

    // Validar datos requeridos
    if (!Id_Doctor || !Fecha_Cita || !Hora_Inicio || !Hora_Fin) {
        return res.status(400).json({ 
            message: 'Se requiere: Id_Doctor, Fecha_Cita, Hora_Inicio, Hora_Fin' 
        });
    }

    let pool;
    try {
        pool = await db.connect();

        // Obtener ID_Paciente del usuario autenticado
        const pacienteRes = await pool.request()
            .input('userId', db.sql.Int, userId)
            .query('SELECT ID_Paciente, Nombre, Paterno, Materno FROM Pacientes WHERE Id_User = @userId');

        if (pacienteRes.recordset.length === 0) {
            return res.status(404).json({ message: 'Paciente no encontrado' });
        }

        const paciente = pacienteRes.recordset[0];
        const pacienteId = paciente.ID_Paciente;
        const nombreCompleto = `${paciente.Nombre} ${paciente.Paterno} ${paciente.Materno}`;

        // Normalizar horas a HH:MM:SS
        const toHms = (h) => {
            if (!h) return h;
            if (/^\d{2}:\d{2}:\d{2}$/.test(h)) return h;
            if (/^\d{2}:\d{2}$/.test(h)) return `${h}:00`;
            // intentar parsear Date string
            const d = new Date(h);
            if (!Number.isNaN(d.getTime())) {
                const pad = (n)=> String(n).padStart(2,'0');
                return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            }
            return h;
        };

        const horaInicioHMS = toHms(Hora_Inicio);
        const horaFinHMS = toHms(Hora_Fin);

        // Validar que el paciente no tenga cita pendiente con el mismo doctor
        const citaExistenteRes = await pool.request()
            .input('pacienteId', db.sql.Int, pacienteId)
            .input('idDoctor', db.sql.Int, Id_Doctor)
            .query(`
                SELECT TOP 1 C.Id_Cita, C.Fecha_cita, C.Hora_Inicio, C.Hora_Fin
                FROM Citas C
                WHERE C.ID_Paciente = @pacienteId
                  AND C.Id_Doc = @idDoctor
                  AND C.ID_Estatus IN (1, 2)
                ORDER BY C.Fecha_cita DESC
            `);

        if (citaExistenteRes.recordset.length > 0) {
            const citaExistente = citaExistenteRes.recordset[0];
            
            // Función para formatear hora desde diferentes tipos
            const formatearHora = (hora) => {
                if (!hora) return '';
                if (typeof hora === 'string') {
                    return hora.substring(0, 8);
                }
                if (typeof hora === 'object' && hora.toString) {
                    const str = hora.toString();
                    const match = str.match(/(\d{2}):(\d{2})/);
                    return match ? `${match[1]}:${match[2]}:00` : '';
                }
                return '';
            };
            
            return res.status(409).json({
                message: 'El paciente ya tiene una cita pendiente con este doctor',
                errorCode: 'CITA_DUPLICADA',
                detalles: {
                    citaExistente: {
                        id: citaExistente.Id_Cita,
                        fecha: citaExistente.Fecha_cita,
                        horaInicio: formatearHora(citaExistente.Hora_Inicio),
                        horaFin: formatearHora(citaExistente.Hora_Fin)
                    }
                }
            });
        }

        // Prevalidar contra horario laboral para evitar rechazo del SP por desfase de formato/zonas
        const horasTrabajo = await citaService.obtenerHorasTrabajoTotal(Id_Doctor, Fecha_Cita);
        const toMin = (t) => {
            const [hh,mm] = String(t||'').split(':');
            const H = parseInt(hh,10); const M = parseInt(mm,10);
            if (!Number.isFinite(H) || !Number.isFinite(M)) return null;
            return H*60+M;
        };
        const ini = toMin(horaInicioHMS);
        const fin = toMin(horaFinHMS);
        const dentro = horasTrabajo.some(r => {
            const ri = toMin(r.Hora_Inicio);
            const rf = toMin(r.Hora_Fin);
            return ri!==null && rf!==null && ini!==null && fin!==null && ri <= ini && fin < rf && ini < fin;
        });
        if (!dentro) {
            return res.status(400).json({
                message: 'La cita está fuera del horario laboral del doctor (validación previa)',
                detalles: { Fecha_Cita, Hora_Inicio: horaInicioHMS, Hora_Fin: horaFinHMS, horasTrabajo }
            });
        }

        // Crear la cita usando el servicio existente
        const datosCita = {
            Id_Doctor,
            Id_Paciente: pacienteId,
            Fecha_Cita,
            Hora_Inicio: horaInicioHMS,
            Hora_Fin: horaFinHMS,
            Usuario: `Paciente_${userId}`
        };

        const resultadoCita = await citaService.crearCita(datosCita);

        // Obtener el ID de la cita recién creada y toda su información
        const citaCreada = await pool.request()
            .input('pacienteId', db.sql.Int, pacienteId)
            .input('fecha', db.sql.VarChar(10), Fecha_Cita)
            .input('horaInicio', db.sql.VarChar(8), horaInicioHMS)
            .query(`
                SELECT TOP 1
                    C.Id_Cita AS Folio,
                    C.Fecha_Solicitud,
                    C.Fecha_cita,
                    C.Hora_Inicio,
                    C.Hora_Fin,
                    E.Nombre AS Especialidad,
                    E.Precio AS Costo,
                    CONCAT(EM.Nombre, ' ', EM.Paterno, ' ', EM.Materno) AS Doctor,
                    CONS.Numero AS Consultorio,
                    CONS.Piso AS Ubicacion_Consultorio
                FROM Citas C
                INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
                INNER JOIN Empleados EM ON D.Id_Empleado = EM.Id_Empleado
                INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
                LEFT JOIN Consultorio CONS ON E.ID_Consultorio = CONS.Id_Consultorio
                WHERE C.ID_Paciente = @pacienteId 
                  AND C.Fecha_cita = @fecha 
                  AND C.Hora_Inicio = @horaInicio
                ORDER BY C.Fecha_Solicitud DESC
            `);

        if (citaCreada.recordset.length === 0) {
            return res.status(500).json({ message: 'Error al recuperar datos de la cita creada' });
        }

        const cita = citaCreada.recordset[0];

        // Generar el recibo completo
        const recibo = {
            folio: cita.Folio,
            paciente: nombreCompleto,
            fecha_cita: cita.Fecha_cita,
            hora_inicio: cita.Hora_Inicio,
            hora_fin: cita.Hora_Fin,
            consultorio: cita.Consultorio,
            ubicacion: cita.Ubicacion_Consultorio,
            especialidad: cita.Especialidad,
            doctor: cita.Doctor,
            costo: cita.Costo,
            linea_pago: `FOLIO-${cita.Folio}-PAC-${pacienteId}`,
            leyendas: {
                plazo_pago: '⏰ Tienes 8 horas para realizar el pago, de lo contrario la cita será cancelada automáticamente.',
                politica_cancelacion: '📋 Política de cancelación:\n' +
                    '  • Cancelación con más de 48 horas de anticipación: Reembolso del 100%\n' +
                    '  • Cancelación entre 24 y 48 horas: Reembolso del 50%\n' +
                    '  • Cancelación con menos de 24 horas: Sin reembolso'
            },
            fecha_emision: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            message: 'Cita agendada exitosamente',
            recibo
        });

    } catch (error) {
        console.error('❌ Error POST /api/citas/agendar:', error);
        return res.status(400).json({ 
            message: 'Error al agendar la cita', 
            details: error.message 
        });
    } finally {
        // Usamos el pool global; no cerrar aquí para evitar ECONNCLOSED
    }
};

// Maneja la creación de una nueva cita (POST /api/citas)
exports.crearCita = async (req, res) => {
    const datosCita = {
        Id_Doctor: req.body.Id_Doctor,
        Id_Paciente: req.body.Id_Paciente,
        Fecha_Cita: req.body.Fecha_Cita,
        Hora_Inicio: req.body.Hora_Inicio,
        Hora_Fin: req.body.Hora_Fin,
        Usuario: req.body.Usuario || 'SistemaWeb' 
    };

    try {
        const resultado = await citaService.crearCita(datosCita);
        
        res.status(201).json({ 
            message: resultado.message,
            cita: datosCita
        });
    } catch (error) {
        
        res.status(400).json({ 
            message: 'Error al procesar la cita.', 
            details: error.message 
        });
    }
};

exports.getCitasPorPaciente = async (req, res) => {
    const pacienteId = parseInt(req.params.id, 10); 
    
    if (isNaN(pacienteId)) {
        return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    try {
        const citas = await citaService.obtenerCitasPaciente(pacienteId);
        res.status(200).json(citas);
    } catch (error) {
        res.status(500).json({ 
            message: 'No se pudo obtener el historial de citas.', 
            details: error.message 
        });
    }
};

// GET /api/citas/especialidades
exports.getEspecialidades = async (req, res) => {
    try {
        const especialidades = await citaService.obtenerEspecialidades();
        res.status(200).json(especialidades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/citas/especialidades-todas (sin filtro de doctores)
exports.getEspecialidadesAll = async (req, res) => {
    try {
        const especialidades = await citaService.obtenerEspecialidadesAll();
        res.status(200).json(especialidades);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/citas/doctores/:id_especialidad
exports.getDoctoresPorEspecialidad = async (req, res) => {
    const id = parseInt(req.params.id_especialidad, 10);
    try {
        const doctores = await citaService.obtenerDoctoresPorEspecialidad(id);
        res.status(200).json(doctores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/citas/disponibilidad
exports.getSlotsOcupados = async (req, res) => {
    const { Id_Doctor, Fecha_cita } = req.body;
    try {
        if (!Id_Doctor || !Fecha_cita) {
            return res.status(400).json({ message: 'Se requiere ID de Doctor y Fecha de Cita.' });
        }
        const slotsOcupados = await citaService.obtenerSlotsOcupados(Id_Doctor, Fecha_cita);
        res.status(200).json(slotsOcupados);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getHorarioTrabajo = async (req, res) => {
    const { Id_Doctor, Fecha } = req.body;
    try {
        if (!Id_Doctor || !Fecha) {
            return res.status(400).json({ message: 'Se requiere ID de Doctor y Fecha.' });
        }
        const horario = await citaService.obtenerHorasTrabajoTotal(Id_Doctor, Fecha);
        res.status(200).json(horario);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/citas/:id/atender -> Doctor marca cita como atendida
exports.atenderCita = async (req, res) => {
    const idCita = parseInt(req.params.id, 10);
    const userId = parseInt(req.headers['x-user-id'], 10);
    const role = parseInt(req.headers['x-user-role'], 10);

    if (isNaN(idCita)) {
        return res.status(400).json({ message: 'ID de cita inválido' });
    }
    if (!userId || role !== 1) {
        return res.status(403).json({ message: 'Acceso restringido a doctores' });
    }

    let pool;
    try {
        pool = await db.connect();
        // Obtener Id_Doctor desde el usuario
        const doctorRes = await pool.request()
            .input('userId', db.sql.Int, userId)
            .query(`
                SELECT D.Id_Doctor
                FROM Doctores D
                INNER JOIN Empleados E ON D.Id_Empleado = E.Id_Empleado
                WHERE E.Id_User = @userId
            `);
        if (doctorRes.recordset.length === 0) {
            return res.status(404).json({ message: 'Doctor no encontrado' });
        }
        const doctorId = doctorRes.recordset[0].Id_Doctor;

        // Validar propiedad de la cita y estatus pagado (2)
        const citaRes = await pool.request()
            .input('idCita', db.sql.Int, idCita)
            .query(`
                SELECT Id_Cita, Id_Doc, ID_Estatus, Fecha_cita, Hora_Inicio
                FROM Citas
                WHERE Id_Cita = @idCita
            `);
        if (citaRes.recordset.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        const cita = citaRes.recordset[0];
        if (cita.Id_Doc !== doctorId) {
            return res.status(403).json({ message: 'La cita no pertenece al doctor autenticado' });
        }
        if (cita.ID_Estatus !== 2) {
            return res.status(409).json({ message: 'Solo se pueden marcar como atendidas las citas pagadas' });
        }

        // Validar que ya es la hora de la cita
        if (!cita.Fecha_cita || !cita.Hora_Inicio) {
            return res.status(400).json({
                message: 'No se puede validar el horario de la cita (faltan Fecha_cita/Hora_Inicio)'
            });
        }
        // Normalizar hora de inicio que puede venir como string o Date
        const extraerHoraMin = (valor) => {
            if (!valor) return null;
            if (typeof valor === 'string') {
                const partes = valor.split(':');
                const h = parseInt(partes[0] || '0', 10);
                const m = parseInt(partes[1] || '0', 10);
                if (Number.isFinite(h) && Number.isFinite(m)) return { h, m };
                return null;
            }
            if (Object.prototype.toString.call(valor) === '[object Date]' && !Number.isNaN(valor.getTime?.())) {
                return { h: valor.getHours(), m: valor.getMinutes() };
            }
            return null;
        };

        const ahora = new Date();
        const fechaCita = new Date(cita.Fecha_cita);
        const hm = extraerHoraMin(cita.Hora_Inicio);
        if (!hm) {
            return res.status(400).json({ message: 'Formato de Hora_Inicio no válido para la cita' });
        }
        fechaCita.setHours(hm.h, hm.m, 0, 0);

        if (ahora < fechaCita) {
            const tiempoRestante = Math.ceil((fechaCita - ahora) / (1000 * 60));
            return res.status(400).json({ 
                message: `La cita aún no ha comenzado. Faltan ${tiempoRestante} minutos.`,
                tiempoRestante
            });
        }

        // Marcar como atendida (estatus 6)
        await pool.request()
            .input('idCita', db.sql.Int, idCita)
            .query('UPDATE Citas SET ID_Estatus = 6 WHERE Id_Cita = @idCita');

        // Bitácora
        await pool.request()
            .input('reg', db.sql.Int, idCita)
            .input('usr', db.sql.VarChar, `Doctor_${userId}`)
            .input('det', db.sql.VarChar, 'Cita marcada como atendida (Pagada -> Atendida)')
            .query(`
                INSERT INTO Bitacora (Id_Reg_Afectado, Fecha_Hora, Usuario, Detalles, Accion, Tabla_Afectada)
                VALUES (@reg, GETDATE(), @usr, @det, 'UPDATE', 'Citas')
            `);

        return res.json({ success: true, message: 'Cita marcada como atendida' });
    } catch (error) {
        console.error('❌ Error POST /api/citas/:id/atender:', error);
        return res.status(500).json({ message: 'Error al marcar cita como atendida', details: error.message });
    }
};

