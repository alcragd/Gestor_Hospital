const express = require('express');
const router = express.Router();
const cancelacionController = require('../controllers/cancelacion.controller');

// POST /api/cancelaciones/mis-citas/:id_cita - Paciente cancela su cita (seguro)
router.post('/mis-citas/:id_cita', cancelacionController.cancelarCitaPaciente);

// POST /api/cancelaciones/cancelar - Cancelar una cita
router.post('/cancelar', cancelacionController.cancelarCita);

// GET /api/cancelaciones/calcular-reembolso/:id - Calcular reembolso
router.get('/calcular-reembolso/:id', cancelacionController.calcularReembolso);

// GET /api/cancelaciones/paciente/:id - Citas canceladas del paciente
router.get('/paciente/:id', cancelacionController.obtenerCitasCanceladas);

// POST /api/cancelaciones/procesar-expiradas - Procesar citas expiradas (job)
router.post('/procesar-expiradas', cancelacionController.procesarCitasExpiradas);

// GET /api/cancelaciones/reembolsos - Historial de reembolsos (todos)
router.get('/reembolsos', cancelacionController.obtenerReembolsos);

// GET /api/cancelaciones/reembolsos/:idPaciente - Reembolsos de un paciente
router.get('/reembolsos/:idPaciente', cancelacionController.obtenerReembolsos);

module.exports = router;
