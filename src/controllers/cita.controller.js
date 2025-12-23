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

        // Crear la cita usando el servicio existente
        const datosCita = {
            Id_Doctor,
            Id_Paciente: pacienteId,
            Fecha_Cita,
            Hora_Inicio,
            Hora_Fin,
            Usuario: `Paciente_${userId}`
        };

        const resultadoCita = await citaService.crearCita(datosCita);

        // Obtener el ID de la cita recién creada y toda su información
        const citaCreada = await pool.request()
            .input('pacienteId', db.sql.Int, pacienteId)
            .input('fecha', db.sql.VarChar(10), Fecha_Cita)
            .input('horaInicio', db.sql.VarChar(8), Hora_Inicio)
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

