const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pago.controller');

// POST /api/pagos/registrar - Registrar un pago
router.post('/registrar', pagoController.registrarPago);

// GET /api/pagos/cita/:id - Obtener pago de una cita
router.get('/cita/:id', pagoController.obtenerPagoPorCita);

// GET /api/pagos/plazo/:id - Verificar plazo de pago (8 horas)
router.get('/plazo/:id', pagoController.verificarPlazoPago);

// GET /api/pagos/paciente/:id - Historial de pagos del paciente
router.get('/paciente/:id', pagoController.obtenerPagosPorPaciente);

module.exports = router;
