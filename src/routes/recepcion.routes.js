const express = require('express');
const router = express.Router();
const recepcionController = require('../controllers/recepcion.controller');

/**
 * Middleware de autorización para Recepcionista
 * Solo permite acceso a usuarios con rol 3 (Recepcionista)
 */
function requiereRecepcionista(req, res, next) {
    const userId = parseInt(req.headers['x-user-id'], 10);
    const userRole = parseInt(req.headers['x-user-role'], 10);
    
    if (!userId || userRole !== 3) {
        return res.status(403).json({
            message: 'Acceso restringido a recepcionistas',
            requiredRole: 'Recepcionista (rol 3)'
        });
    }
    
    next();
}

// Aplicar middleware a todas las rutas
router.use(requiereRecepcionista);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE PACIENTES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/recepcion/pacientes
 * Lista todos los pacientes (con búsqueda opcional)
 * Query params: ?busqueda=texto
 */
router.get('/pacientes', recepcionController.listarPacientes);

/**
 * GET /api/recepcion/pacientes/:id
 * Obtiene los datos de un paciente específico
 */
router.get('/pacientes/:id', recepcionController.obtenerPaciente);

/**
 * POST /api/recepcion/pacientes
 * Crea un nuevo paciente
 * Body: { Nombre, Paterno, Materno?, Fecha_nac, Correo, Telefono_cel, Telefono_emergencia?, DNI, Sexo, Edad, Username?, Password? }
 */
router.post('/pacientes', recepcionController.crearPaciente);

/**
 * PUT /api/recepcion/pacientes/:id
 * Actualiza datos de contacto de un paciente
 * Body: { Telefono_cel?, Correo?, Telefono_emergencia? }
 */
router.put('/pacientes/:id', recepcionController.actualizarPaciente);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE DOCTORES
// ═══════════════════════════════════════════════════════════════

router.get('/doctores', recepcionController.listarDoctores);
router.get('/doctores/:id', recepcionController.obtenerDoctor);
router.post('/doctores', recepcionController.crearDoctor);
router.put('/doctores/:id', recepcionController.actualizarDoctor);
router.post('/doctores/:id/baja', recepcionController.darDeBajaDoctor);

// ═══════════════════════════════════════════════════════════════
// HORARIO DE DOCTOR (VISUALIZACIÓN + ACTUALIZACIÓN)
// ═══════════════════════════════════════════════════════════════

// Ver horario por día (dia en Español: Lunes..Domingo)
router.get('/doctores/:id/horario/:dia', recepcionController.obtenerHorarioDoctorDia);

// Actualizar bloques de horario para un día
router.put('/doctores/:id/horario', recepcionController.actualizarHorarioDoctorDia);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE RECEPCIONISTAS
// ═══════════════════════════════════════════════════════════════

router.get('/recepcionistas', recepcionController.listarRecepcionistas);
router.get('/recepcionistas/:id', recepcionController.obtenerRecepcionista);
router.post('/recepcionistas', recepcionController.crearRecepcionista);
router.put('/recepcionistas/:id', recepcionController.actualizarRecepcionista);
router.post('/recepcionistas/:id/baja', recepcionController.darDeBajaRecepcionista);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE CONSULTORIOS
// ═══════════════════════════════════════════════════════════════

router.get('/consultorios', recepcionController.listarConsultorios);
router.post('/consultorios', recepcionController.crearConsultorio);
router.put('/consultorios/:id', recepcionController.actualizarConsultorio);
router.delete('/consultorios/:id', recepcionController.eliminarConsultorio);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE ESPECIALIDADES
// ═══════════════════════════════════════════════════════════════

router.get('/especialidades', recepcionController.listarEspecialidades);
router.post('/especialidades', recepcionController.crearEspecialidad);
router.put('/especialidades/:id', recepcionController.actualizarEspecialidad);
router.delete('/especialidades/:id', recepcionController.eliminarEspecialidad);

// ═══════════════════════════════════════════════════════════════
// RUTAS - SERVICIOS EXTRA
// ═══════════════════════════════════════════════════════════════

router.get('/servicios', recepcionController.listarServicios);
router.post('/servicios', recepcionController.crearServicio);
router.put('/servicios/:id', recepcionController.actualizarServicio);
router.delete('/servicios/:id', recepcionController.eliminarServicio);
router.post('/servicios/venta', recepcionController.venderServicio);

// ═══════════════════════════════════════════════════════════════
// RUTAS - FARMACIA
// ═══════════════════════════════════════════════════════════════

router.get('/medicamentos', recepcionController.listarMedicamentos);
router.post('/medicamentos', recepcionController.crearMedicamento);
router.put('/medicamentos/:id', recepcionController.actualizarMedicamento);
router.delete('/medicamentos/:id', recepcionController.eliminarMedicamento);
router.post('/medicamentos/venta', recepcionController.venderMedicamento);
router.put('/medicamentos/:id/stock', recepcionController.actualizarStock);

// ═══════════════════════════════════════════════════════════════
// RUTAS - HISTORIAL DE VENTAS
// ═══════════════════════════════════════════════════════════════

router.get('/ventas/historial', recepcionController.obtenerHistorialVentas);

// ═══════════════════════════════════════════════════════════════
// RUTAS - GESTIÓN DE CITAS
// ═══════════════════════════════════════════════════════════════

router.get('/citas', recepcionController.listarCitas);
router.post('/citas/:id/cancelar', recepcionController.cancelarCita);

module.exports = router;
