const cancelacionService = require('../services/cancelacion.service');

class CancelacionController {
    
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
