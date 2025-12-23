const pagoService = require('../services/pago.service');

class PagoController {
    
    /**
     * POST /api/pagos/registrar
     * Registrar un pago para una cita
     */
    async registrarPago(req, res) {
        const { Id_Cita, Metodo_Pago, Usuario } = req.body;
        
        try {
            // Validar datos requeridos
            if (!Id_Cita || !Metodo_Pago) {
                return res.status(400).json({ 
                    message: 'Se requiere ID de cita y método de pago' 
                });
            }
            
            const resultado = await pagoService.registrarPago(
                Id_Cita, 
                Metodo_Pago, 
                Usuario || 'SistemaWeb'
            );
            
            res.status(201).json(resultado);
            
        } catch (error) {
            res.status(400).json({ 
                message: 'Error al registrar el pago', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/pagos/cita/:id
     * Obtener información del pago de una cita
     */
    async obtenerPagoPorCita(req, res) {
        const idCita = parseInt(req.params.id, 10);
        
        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }
        
        try {
            const pago = await pagoService.obtenerPagoPorCita(idCita);
            
            if (!pago) {
                return res.status(404).json({ message: 'No se encontró pago para esta cita' });
            }
            
            res.status(200).json(pago);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al obtener información del pago', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/pagos/plazo/:id
     * Verificar el plazo de pago de una cita (8 horas)
     */
    async verificarPlazoPago(req, res) {
        const idCita = parseInt(req.params.id, 10);
        
        if (isNaN(idCita)) {
            return res.status(400).json({ message: 'ID de cita inválido' });
        }
        
        try {
            const plazo = await pagoService.verificarPlazoPago(idCita);
            res.status(200).json(plazo);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al verificar plazo de pago', 
                details: error.message 
            });
        }
    }
    
    /**
     * GET /api/pagos/paciente/:id
     * Obtener historial de pagos de un paciente
     */
    async obtenerPagosPorPaciente(req, res) {
        const idPaciente = parseInt(req.params.id, 10);
        
        if (isNaN(idPaciente)) {
            return res.status(400).json({ message: 'ID de paciente inválido' });
        }
        
        try {
            const pagos = await pagoService.obtenerPagosPorPaciente(idPaciente);
            res.status(200).json(pagos);
            
        } catch (error) {
            res.status(500).json({ 
                message: 'Error al obtener historial de pagos', 
                details: error.message 
            });
        }
    }
}

module.exports = new PagoController();
