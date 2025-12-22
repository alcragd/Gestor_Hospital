const citaService = require('../services/cita.service');

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

