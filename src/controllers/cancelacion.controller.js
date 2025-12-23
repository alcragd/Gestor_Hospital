const cancelacionService = require('../services/cancelacion.service');
const db = require('../config/db.config');

class CancelacionController {
    
    /**
     * POST /api/cancelaciones/mis-citas/:id_cita
     * Paciente cancela su propia cita (con validaciones de propiedad y estado)
     */
    async cancelarCitaPaciente(req, res) {
        const userId = parseInt(req.headers['x-user-id'], 10);
        const role = parseInt(req.headers['x-user-role'], 10);
        const idCita = parseInt(req.params.id_cita, 10);
        const { Motivo } = req.body;

        // Validar autenticación y rol
        if (!userId || role !== 4) {
            return res.status(403).json({ message: 'Acceso restringido a pacientes' });
        }

        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }

        if (!Motivo || Motivo.trim() === '') {
            return res.status(400).json({ message: 'Se requiere el motivo de cancelación' });
        }

        let pool;
        try {
            pool = await db.connect();

            // Obtener ID_Paciente del usuario autenticado
            const pacienteRes = await pool.request()
                .input('userId', db.sql.Int, userId)
                .query('SELECT ID_Paciente FROM Pacientes WHERE Id_User = @userId');

            if (pacienteRes.recordset.length === 0) {
                return res.status(404).json({ message: 'Paciente no encontrado' });
            }

            const pacienteId = pacienteRes.recordset[0].ID_Paciente;

            // Validar que la cita pertenece al paciente
            const citaRes = await pool.request()
                .input('idCita', db.sql.Int, idCita)
                .input('pacienteId', db.sql.Int, pacienteId)
                .query(`
                    SELECT 
                        C.Id_Cita,
                        C.Fecha_cita,
                        C.ID_Estatus,
                        ES.Nombre AS Estatus
                    FROM Citas C
                    INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
                    WHERE C.Id_Cita = @idCita AND C.ID_Paciente = @pacienteId
                `);

            if (citaRes.recordset.length === 0) {
                return res.status(404).json({ message: 'Cita no encontrada o no pertenece al paciente' });
            }

            const cita = citaRes.recordset[0];

            // Validar que la cita es futura
            const fechaCita = new Date(cita.Fecha_cita);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaCita < hoy) {
                return res.status(400).json({ message: 'No se pueden cancelar citas pasadas' });
            }

            // Validar que la cita no está atendida (estatus 1=Programada, 2=Pagada, 3=Cancelada, 4=Atendida)
            // Solo permitir cancelar citas con estatus 1 o 2
            if (![1, 2].includes(cita.ID_Estatus)) {
                return res.status(400).json({ 
                    message: `No se puede cancelar esta cita. Estatus actual: ${cita.Estatus}` 
                });
            }

            // Proceder con la cancelación usando el servicio existente
            const resultado = await cancelacionService.cancelarCita(
                idCita,
                Motivo,
                'Paciente',
                `Paciente_${userId}`
            );

            await pool.close();
            return res.status(200).json(resultado);

        } catch (error) {
            console.error('❌ Error POST /api/cancelaciones/mis-citas:', error);
            return res.status(500).json({ 
                message: 'Error al cancelar la cita', 
                details: error.message 
            });
        } finally {
            if (pool) await pool.close();
        }
    }

    /**
     * POST /api/cancelaciones/cancelar
     * Cancelar una cita con cálculo de reembolso
     */
    async cancelarCita(req, res) {
        const { Id_Cita, Motivo, Cancelado_Por, Usuario } = req.body;
        
        try {
            // Validar datos requeridos
            if (!Id_Cita || !Motivo || !Cancelado_Por) {
                return res.status(400).json({ 
                    message: 'Se requiere ID de cita, motivo y quién cancela' 
                });
            }
            
            // Validar valor de Cancelado_Por
            if (!['Paciente', 'Doctor', 'Sistema'].includes(Cancelado_Por)) {
                return res.status(400).json({ 
                    message: 'Cancelado_Por debe ser: Paciente, Doctor o Sistema' 
                });
            }
            
            const resultado = await cancelacionService.cancelarCita(
                Id_Cita, 
                Motivo, 
                Cancelado_Por,
                Usuario || 'SistemaWeb'
            );
            
            res.status(200).json(resultado);
            
        } catch (error) {
            res.status(400).json({ 
                message: 'Error al cancelar la cita', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/cancelaciones/calcular-reembolso/:id
     * Calcular el reembolso que correspondería si se cancela ahora
     */
    async calcularReembolso(req, res) {
        const idCita = parseInt(req.params.id, 10);
        
        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }
        
        try {
            const reembolso = await cancelacionService.calcularReembolso(idCita);
            res.status(200).json(reembolso);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al calcular reembolso', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/cancelaciones/paciente/:id
     * Obtener citas canceladas de un paciente
     */
    async obtenerCitasCanceladas(req, res) {
        const idPaciente = parseInt(req.params.id, 10);
        
        if (isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        try {
            const citas = await cancelacionService.obtenerCitasCanceladas(idPaciente);
            res.status(200).json(citas);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al obtener citas canceladas', 
                details: error.message 
            });
        }
    }
    
    /**
     * POST /api/cancelaciones/procesar-expiradas
     * Ejecutar proceso de cancelación automática (para job/cron)
     */
    async procesarCitasExpiradas(req, res) {
        try {
            const resultado = await cancelacionService.cancelarCitasExpiradas();
            res.status(200).json(resultado);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error en proceso de cancelación automática', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/cancelaciones/reembolsos
     * GET /api/cancelaciones/reembolsos/:idPaciente
     * Obtener historial de reembolsos
     */
    async obtenerReembolsos(req, res) {
        const idPaciente = req.params.idPaciente ? parseInt(req.params.idPaciente, 10) : null;
        
        if (idPaciente && isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        try {
            const reembolsos = await cancelacionService.obtenerReembolsos(idPaciente);
            res.status(200).json(reembolsos);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al obtener historial de reembolsos', 
                details: error.message 
            });
        }
    }
}

module.exports = new CancelacionController();
