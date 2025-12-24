const recepcionService = require('../services/recepcion.service');

/**
 * Controlador para operaciones de Recepción/Administración
 * FASE 3 - Requiere rol de Recepcionista (rol 3)
 */

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE PACIENTES
// ═══════════════════════════════════════════════════════════════

exports.listarPacientes = async (req, res) => {
    try {
        const { busqueda } = req.query;
        const pacientes = await recepcionService.listarPacientes({ busqueda });
        
        res.json({
            success: true,
            total: pacientes.length,
            pacientes
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/pacientes:', error);
        res.status(500).json({
            message: 'Error al obtener lista de pacientes',
            details: error.message
        });
    }
};

exports.obtenerPaciente = async (req, res) => {
    try {
        const idPaciente = parseInt(req.params.id, 10);
        
        if (isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        const paciente = await recepcionService.obtenerPacientePorId(idPaciente);
        
        res.json({
            success: true,
            paciente
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/pacientes/:id:', error);
        
        if (error.message === 'Paciente no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al obtener paciente',
            details: error.message
        });
    }
};

exports.crearPaciente = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        // Validaciones básicas
        if (!datos.Nombre || !datos.Paterno || !datos.Fecha_nac || !datos.DNI || !datos.Correo || !datos.Telefono_cel || !datos.Sexo || datos.Edad === undefined) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                required: ['Nombre', 'Paterno', 'Fecha_nac', 'DNI', 'Correo', 'Telefono_cel', 'Sexo', 'Edad']
            });
        }
        
        const resultado = await recepcionService.crearPaciente(datos);
        
        res.status(201).json({
            success: true,
            message: 'Paciente creado exitosamente',
            paciente: resultado
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/pacientes:', error);
        
        if (error.message.includes('ya existe') || error.message.includes('ya está en uso')) {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al crear paciente',
            details: error.message
        });
    }
};

exports.actualizarPaciente = async (req, res) => {
    try {
        const idPaciente = parseInt(req.params.id, 10);
        const userId = req.headers['x-user-id'];
        
        if (isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        await recepcionService.actualizarPaciente(idPaciente, datos);
        
        res.json({
            success: true,
            message: 'Paciente actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error PUT /api/recepcion/pacientes/:id:', error);
        
        if (error.message === 'Paciente no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message === 'No hay campos para actualizar') {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al actualizar paciente',
            details: error.message
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE DOCTORES
// ═══════════════════════════════════════════════════════════════

exports.listarDoctores = async (req, res) => {
    try {
        const { especialidad, busqueda, incluirInactivos } = req.query;
        const doctores = await recepcionService.listarDoctores({
            especialidad,
            busqueda,
            incluirInactivos: incluirInactivos === 'true'
        });
        
        res.json({
            success: true,
            total: doctores.length,
            doctores
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/doctores:', error);
        res.status(500).json({
            message: 'Error al obtener lista de doctores',
            details: error.message
        });
    }
};

exports.obtenerDoctor = async (req, res) => {
    try {
        const idDoctor = parseInt(req.params.id, 10);
        
        if (isNaN(idDoctor)) {
            return res.status(400).json({ message: 'ID de doctor inválido' });
        }
        
        const doctor = await recepcionService.obtenerDoctorPorId(idDoctor);
        
        res.json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/doctores/:id:', error);
        
        if (error.message === 'Doctor no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al obtener doctor',
            details: error.message
        });
    }
};

exports.crearDoctor = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        // Validaciones básicas
        const camposObligatorios = ['Nombre', 'Paterno', 'CURP', 'Fecha_nac', 'Correo', 'Telefono_cel', 'Sexo', 'Edad', 'Sueldo', 'Id_Especialidad', 'Cedula', 'Rfc'];
        const faltantes = camposObligatorios.filter(campo => datos[campo] === undefined || datos[campo] === null || datos[campo] === '');
        
        if (faltantes.length > 0) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                faltantes
            });
        }
        
        const resultado = await recepcionService.crearDoctor(datos);
        
        res.status(201).json({
            success: true,
            message: 'Doctor creado exitosamente',
            doctor: resultado
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/doctores:', error);
        
        if (error.message.includes('ya existe') || error.message.includes('ya está en uso')) {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al crear doctor',
            details: error.message
        });
    }
};

exports.actualizarDoctor = async (req, res) => {
    try {
        const idDoctor = parseInt(req.params.id, 10);
        const userId = req.headers['x-user-id'];
        
        if (isNaN(idDoctor)) {
            return res.status(400).json({ message: 'ID de doctor inválido' });
        }
        
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        await recepcionService.actualizarDoctor(idDoctor, datos);
        
        res.json({
            success: true,
            message: 'Doctor actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error PUT /api/recepcion/doctores/:id:', error);
        
        if (error.message === 'Doctor no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message === 'No hay campos para actualizar') {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al actualizar doctor',
            details: error.message
        });
    }
};

exports.darDeBajaDoctor = async (req, res) => {
    try {
        const idDoctor = parseInt(req.params.id, 10);
        if (isNaN(idDoctor)) {
            return res.status(400).json({ message: 'ID de doctor inválido' });
        }

        const resultado = await recepcionService.darDeBajaDoctor(idDoctor, `Recepcionista_${req.headers['x-user-id'] || 'N/A'}`);

        res.status(200).json({
            success: true,
            message: resultado.yaInactivo ? 'El doctor ya estaba inactivo' : 'Doctor dado de baja',
            canceladas: resultado.canceladas || 0
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/doctores/:id/baja:', error);
        res.status(500).json({
            message: 'Error al dar de baja doctor',
            details: error.message
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE RECEPCIONISTAS
// ═══════════════════════════════════════════════════════════════

exports.listarRecepcionistas = async (req, res) => {
    try {
        const { busqueda, incluirInactivos } = req.query;
        const recepcionistas = await recepcionService.listarRecepcionistas({ busqueda, incluirInactivos: incluirInactivos === 'true' });
        
        res.json({
            success: true,
            total: recepcionistas.length,
            recepcionistas
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/recepcionistas:', error);
        res.status(500).json({
            message: 'Error al obtener lista de recepcionistas',
            details: error.message
        });
    }
};

exports.obtenerRecepcionista = async (req, res) => {
    try {
        const idEmpleado = parseInt(req.params.id, 10);
        
        if (isNaN(idEmpleado)) {
            return res.status(400).json({ message: 'ID de empleado inválido' });
        }
        
        const recepcionista = await recepcionService.obtenerRecepcionistaPorId(idEmpleado);
        
        res.json({
            success: true,
            recepcionista
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/recepcionistas/:id:', error);
        
        if (error.message === 'Recepcionista no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al obtener recepcionista',
            details: error.message
        });
    }
};

exports.crearRecepcionista = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        // Validaciones básicas
        const camposObligatorios = ['Nombre', 'Paterno', 'CURP', 'Fecha_nac', 'Correo', 'Telefono_cel', 'Sexo', 'Edad', 'Sueldo', 'Username', 'Password'];
        const faltantes = camposObligatorios.filter(campo => datos[campo] === undefined || datos[campo] === null || datos[campo] === '');
        
        if (faltantes.length > 0) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                faltantes
            });
        }
        
        const resultado = await recepcionService.crearRecepcionista(datos);
        
        res.status(201).json({
            success: true,
            message: 'Recepcionista creado exitosamente',
            recepcionista: resultado
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/recepcionistas:', error);
        
        if (error.message.includes('ya existe') || error.message.includes('ya está en uso') || error.message.includes('obligatorios')) {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al crear recepcionista',
            details: error.message
        });
    }
};

exports.actualizarRecepcionista = async (req, res) => {
    try {
        const idEmpleado = parseInt(req.params.id, 10);
        const userId = req.headers['x-user-id'];
        
        if (isNaN(idEmpleado)) {
            return res.status(400).json({ message: 'ID de empleado inválido' });
        }
        
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        await recepcionService.actualizarRecepcionista(idEmpleado, datos);
        
        res.json({
            success: true,
            message: 'Recepcionista actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error PUT /api/recepcion/recepcionistas/:id:', error);
        
        if (error.message === 'Recepcionista no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        if (error.message === 'No hay campos para actualizar') {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al actualizar recepcionista',
            details: error.message
        });
    }
};

exports.darDeBajaRecepcionista = async (req, res) => {
    try {
        const idEmpleado = parseInt(req.params.id, 10);
        if (isNaN(idEmpleado)) {
            return res.status(400).json({ message: 'ID de empleado inválido' });
        }

        const resultado = await recepcionService.darDeBajaRecepcionista(idEmpleado, `Recepcionista_${req.headers['x-user-id'] || 'N/A'}`);

        res.status(200).json({
            success: true,
            message: resultado.yaInactivo ? 'La recepcionista ya estaba inactiva' : 'Recepcionista dada de baja'
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/recepcionistas/:id/baja:', error);
        res.status(500).json({
            message: 'Error al dar de baja recepcionista',
            details: error.message
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// SERVICIOS EXTRA
// ═══════════════════════════════════════════════════════════════

exports.listarServicios = async (req, res) => {
    try {
        const servicios = await recepcionService.listarServicios();
        
        res.json({
            success: true,
            servicios
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/servicios:', error);
        res.status(500).json({
            message: 'Error al obtener servicios',
            details: error.message
        });
    }
};

exports.venderServicio = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        // Validación
        if (!datos.Nombre_Cliente || !datos.servicios || datos.servicios.length === 0) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                required: ['Nombre_Cliente', 'servicios (array)']
            });
        }
        
        const resultado = await recepcionService.venderServicio(datos);
        
        res.status(201).json({
            success: true,
            message: 'Venta de servicio registrada exitosamente',
            venta: resultado
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/servicios/venta:', error);
        res.status(500).json({
            message: 'Error al registrar venta de servicio',
            details: error.message
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// FARMACIA
// ═══════════════════════════════════════════════════════════════

exports.listarMedicamentos = async (req, res) => {
    try {
        const { busqueda, sinStock } = req.query;
        const medicamentos = await recepcionService.listarMedicamentos({ busqueda, sinStock });
        
        res.json({
            success: true,
            total: medicamentos.length,
            medicamentos
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/medicamentos:', error);
        res.status(500).json({
            message: 'Error al obtener inventario de medicamentos',
            details: error.message
        });
    }
};

exports.venderMedicamento = async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        const datos = {
            ...req.body,
            UsuarioRegistro: `Recepcionista_${userId}`
        };
        
        // Validación
        if (!datos.Nombre_Cliente || !datos.medicamentos || datos.medicamentos.length === 0) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios',
                required: ['Nombre_Cliente', 'medicamentos (array)']
            });
        }
        
        const resultado = await recepcionService.venderMedicamento(datos);
        
        res.status(201).json({
            success: true,
            message: 'Venta de medicamento registrada exitosamente',
            venta: resultado
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/medicamentos/venta:', error);
        
        if (error.message.includes('Stock insuficiente')) {
            return res.status(409).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al registrar venta de medicamento',
            details: error.message
        });
    }
};

exports.actualizarStock = async (req, res) => {
    try {
        const idMedicamento = parseInt(req.params.id, 10);
        const { Stock } = req.body;
        
        if (isNaN(idMedicamento) || Stock === undefined || Stock < 0) {
            return res.status(400).json({ message: 'Datos inválidos' });
        }
        
        await recepcionService.actualizarStockMedicamento(idMedicamento, Stock);
        
        res.json({
            success: true,
            message: 'Stock actualizado exitosamente'
        });
    } catch (error) {
        console.error('❌ Error PUT /api/recepcion/medicamentos/:id/stock:', error);
        
        if (error.message === 'Medicamento no encontrado') {
            return res.status(404).json({ message: error.message });
        }
        
        res.status(500).json({
            message: 'Error al actualizar stock',
            details: error.message
        });
    }
};

// ═══════════════════════════════════════════════════════════════
// CANCELACIONES
// ═══════════════════════════════════════════════════════════════

const db = require('../config/db.config');

// ═══════════════════════════════════════════════════════════════
// GESTIÓN DE CITAS
// ═══════════════════════════════════════════════════════════════

exports.listarCitas = async (req, res) => {
    try {
        const { estatus, doctor, paciente, fechaInicio, fechaFin } = req.query;
        
        const filtros = {};
        if (estatus) filtros.estatus = estatus;
        if (doctor) filtros.doctor = doctor;
        if (paciente) filtros.paciente = paciente;
        if (fechaInicio) filtros.fechaInicio = fechaInicio;
        if (fechaFin) filtros.fechaFin = fechaFin;
        
        const citas = await recepcionService.listarCitas(filtros);
        
        res.json({
            success: true,
            total: citas.length,
            citas
        });
    } catch (error) {
        console.error('❌ Error GET /api/recepcion/citas:', error);
        res.status(500).json({
            message: 'Error al obtener lista de citas',
            details: error.message
        });
    }
};

exports.cancelarCita = async (req, res) => {
    let estatusId;
    let estatusNombre;
    try {
        const idCita = parseInt(req.params.id, 10);
        const userId = req.headers['x-user-id'];
        const { Motivo, Cancelado_Por } = req.body;
        
        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }
        
        if (!Motivo) {
            return res.status(400).json({ message: 'El motivo de cancelación es obligatorio' });
        }

        // Normalizar quién solicita la cancelación (Paciente o Doctor); default Paciente
        const canceladoPor = (Cancelado_Por || 'Paciente').trim();
        if (!['Paciente', 'Doctor'].includes(canceladoPor)) {
            return res.status(400).json({ message: 'Cancelado_Por debe ser "Paciente" o "Doctor"' });
        }
        
        // Validación defensiva: no cancelar citas atendidas
        const pool = await db.connect();
        const citaRes = await pool.request()
            .input('idCita', db.sql.Int, idCita)
            .query(`
                SELECT C.Id_Cita, C.ID_Estatus, ES.Nombre AS Estatus
                FROM Citas C
                INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
                WHERE C.Id_Cita = @idCita
            `);
        
        if (citaRes.recordset.length === 0) {
            return res.status(404).json({ message: 'Cita no encontrada' });
        }
        
        estatusNombre = citaRes.recordset[0].Estatus;
        estatusId = citaRes.recordset[0].ID_Estatus;
        if (estatusNombre && estatusNombre.toLowerCase().includes('atendida')) {
            return res.status(400).json({ message: 'No se pueden cancelar citas atendidas' });
        }
        // Solo permitimos transición desde estatus agendada/pagada (1 o 2); si no, devolvemos conflicto
        if (![1, 2].includes(estatusId)) {
            return res.status(409).json({
                message: 'Transición de estatus no permitida',
                estatusActual: { id: estatusId, nombre: estatusNombre }
            });
        }

        // Regla adicional: si está en 1 (Agendada-Pendiente de Pago), el SP solo permite canceladoPor = 'Paciente'
        if (estatusId === 1 && canceladoPor !== 'Paciente') {
            return res.status(409).json({
                message: 'Transición de estatus no permitida para este rol. Use Cancelado_Por="Paciente" cuando la cita está en Agendada-Pendiente de Pago.',
                estatusActual: { id: estatusId, nombre: estatusNombre }
            });
        }

        // Si es 1 y canceladoPor es Paciente y aún falla, devolvemos un mensaje más claro sin llamar al SP
        if (estatusId === 1 && canceladoPor === 'Paciente') {
            try {
                const resultado = await recepcionService.cancelarCitaRecepcionista(
                    idCita,
                    Motivo,
                    `Recepcionista_${userId}`,
                    canceladoPor
                );
                const porcentaje = resultado.Porcentaje_Reembolso;
                const politica = porcentaje === 100 ? 'Cancelación ≥48h: 100%' : porcentaje === 50 ? 'Cancelación 24-48h: 50%' : 'Cancelación <24h: 0%';
                return res.json({
                    success: true,
                    message: 'Cita cancelada exitosamente',
                    detalles: {
                        idCita: resultado.Id_Cita || idCita,
                        estatus: resultado.Estatus || 'Cancelada',
                        estatusId: resultado.EstatusId || resultado.ID_Estatus || null,
                        porcentajeReembolso: resultado.Porcentaje_Reembolso ?? null,
                        montoReembolso: resultado.Monto_Reembolso ?? null,
                        politica,
                        mensaje: resultado.Mensaje || 'Cancelación aplicada'
                    }
                });
            } catch (error) {
                const detalle = error.originalError?.info?.message || error.message;
                const isConflict = detalle && (detalle.toLowerCase().includes('transición') || detalle.toLowerCase().includes('estatus'));
                return res.status(isConflict ? 409 : 500).json({
                    message: detalle || 'Error al cancelar cita',
                    details: error.message,
                    estatusContexto: { id: estatusId, nombre: estatusNombre }
                });
            }
        }

        // Regla adicional: si está en 2 (Pagada-Pendiente por Atender), SP admite canceladoPor Paciente o Doctor; si falla, devolveremos el error del SP
        
        const resultado = await recepcionService.cancelarCitaRecepcionista(
            idCita,
            Motivo,
            `Recepcionista_${userId}`,
            canceladoPor
        );
        
        const porcentaje = resultado.Porcentaje_Reembolso;
        const politica = porcentaje === 100 ? 'Cancelación ≥48h: 100%' : porcentaje === 50 ? 'Cancelación 24-48h: 50%' : 'Cancelación <24h: 0%';

        res.json({
            success: true,
            message: 'Cita cancelada exitosamente',
            detalles: {
                idCita: resultado.Id_Cita || idCita,
                estatus: resultado.Estatus || 'Cancelada',
                estatusId: resultado.EstatusId || resultado.ID_Estatus || null,
                porcentajeReembolso: resultado.Porcentaje_Reembolso ?? null,
                montoReembolso: resultado.Monto_Reembolso ?? null,
                politica,
                mensaje: resultado.Mensaje || 'Cancelación aplicada'
            }
        });
    } catch (error) {
        console.error('❌ Error POST /api/recepcion/citas/:id/cancelar:', error);
        const detalle = error.originalError?.info?.message || error.message;
        const isConflict = detalle && (detalle.toLowerCase().includes('transición') || detalle.toLowerCase().includes('estatus'));
        return res.status(isConflict ? 409 : 500).json({
            message: detalle || 'Error al cancelar cita',
            details: error.message,
            estatusContexto: {
                id: estatusId || null,
                nombre: estatusNombre || null
            }
        });
    }
};

module.exports = exports;
