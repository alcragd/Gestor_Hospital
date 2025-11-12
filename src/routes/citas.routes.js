const express = require('express');
const router = express.Router();
const citaController = require('../controllers/cita.controller');

// POST /api/citas -> Crear una nueva cita
router.post('/', citaController.crearCita);

// GET /api/citas/paciente/:id -> Obtener todas las citas de un paciente
router.get('/paciente/:id', citaController.getCitasPorPaciente);

router.get('/especialidades', citaController.getEspecialidades);
router.get('/doctores/:id_especialidad', citaController.getDoctoresPorEspecialidad);
router.post('/disponibilidad', citaController.getSlotsOcupados); 
router.post('/horario-trabajo', citaController.getHorarioTrabajo);

module.exports = router;