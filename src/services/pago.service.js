const db = require('../config/db.config');

class PagoService {
    
    /**
     * Registrar un pago para una cita
     * @param {number} idCita - ID de la cita
     * @param {string} metodoPago - Método de pago (Efectivo, Tarjeta, etc.)
     * @param {string} usuario - Usuario que registra el pago
     * @returns {Promise<Object>} Resultado del pago
     */
    async registrarPago(idCita, metodoPago, usuario) {
        let pool;
        try {
            pool = await db.connect();
            
            const request = pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .input('Metodo_Pago', db.sql.VarChar(50), metodoPago)
                .input('Usuario', db.sql.VarChar(50), usuario);
            
            const result = await request.execute('SP_RegistrarPago');
            
            return {
                success: true,
                mensaje: result.recordset[0].Mensaje,
                monto: result.recordset[0].Monto,
                idPago: result.recordset[0].Id_Pago
            };
            
        } catch (error) {
            console.error('Error al registrar pago:', error.message);
            throw new Error(error.message);
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Obtener información de pago de una cita
     * @param {number} idCita - ID de la cita
     * @returns {Promise<Object>} Información del pago
     */
    async obtenerPagoPorCita(idCita) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .query(`
                    SELECT 
                        P.Id_Pago,
                        P.Id_Cita,
                        P.Monto,
                        P.Metodo_Pago,
                        P.Fecha,
                        P.Hora,
                        C.Fecha_cita,
                        E.Nombre AS Estatus_Cita
                    FROM Pago P
                    INNER JOIN Citas C ON P.Id_Cita = C.Id_Cita
                    INNER JOIN Estatus_Cita E ON C.ID_Estatus = E.Id_Estatus
                    WHERE P.Id_Cita = @Id_Cita
                `);
            
            return result.recordset[0] || null;
            
        } catch (error) {
            console.error('Error al obtener pago:', error.message);
            throw new Error('Error al obtener información del pago');
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Verificar si una cita está dentro del plazo de 8 horas para pago
     * @param {number} idCita - ID de la cita
     * @returns {Promise<Object>} Estado del plazo
     */
    async verificarPlazoPago(idCita) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .query(`
                    SELECT 
                        C.Id_Cita,
                        C.Fecha_Solicitud,
                        DATEADD(HOUR, 8, CAST(C.Fecha_Solicitud AS DATETIME)) AS Fecha_Limite_Pago,
                        DATEDIFF(MINUTE, CAST(C.Fecha_Solicitud AS DATETIME), GETDATE()) AS Minutos_Transcurridos,
                        CASE 
                            WHEN DATEDIFF(HOUR, CAST(C.Fecha_Solicitud AS DATETIME), GETDATE()) > 8 THEN 'EXPIRADO'
                            ELSE 'VIGENTE'
                        END AS Estado_Plazo,
                        E.Precio AS Monto_a_Pagar,
                        ES.Nombre AS Estatus_Actual
                    FROM Citas C
                    INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
                    INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
                    INNER JOIN Estatus_Cita ES ON C.ID_Estatus = ES.Id_Estatus
                    WHERE C.Id_Cita = @Id_Cita
                `);
            
            if (!result.recordset[0]) {
                throw new Error('Cita no encontrada');
            }
            
            const datos = result.recordset[0];
            const minutosRestantes = 480 - datos.Minutos_Transcurridos; // 480 minutos = 8 horas
            
            return {
                idCita: datos.Id_Cita,
                fechaSolicitud: datos.Fecha_Solicitud,
                fechaLimitePago: datos.Fecha_Limite_Pago,
                minutosTranscurridos: datos.Minutos_Transcurridos,
                minutosRestantes: Math.max(0, minutosRestantes),
                estadoPlazo: datos.Estado_Plazo,
                montoAPagar: datos.Monto_a_Pagar,
                estatusActual: datos.Estatus_Actual,
                puedeagar: datos.Estado_Plazo === 'VIGENTE' && datos.Estatus_Actual === 'Agendada - Pendiente de Pago'
            };
            
        } catch (error) {
            console.error('Error al verificar plazo:', error.message);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Obtener historial de pagos de un paciente
     * @param {number} idPaciente - ID del paciente
     * @returns {Promise<Array>} Lista de pagos
     */
    async obtenerPagosPorPaciente(idPaciente) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('Id_Paciente', db.sql.Int, idPaciente)
                .query(`
                    SELECT 
                        P.Id_Pago,
                        P.Id_Cita,
                        P.Monto,
                        P.Metodo_Pago,
                        P.Fecha AS Fecha_Pago,
                        P.Hora AS Hora_Pago,
                        C.Fecha_cita,
                        C.Hora_Inicio,
                        E.Nombre AS Especialidad,
                        CONCAT(EM.Nombre, ' ', EM.Paterno) AS NombreDoctor
                    FROM Pago P
                    INNER JOIN Citas C ON P.Id_Cita = C.Id_Cita
                    INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
                    INNER JOIN Especialidades E ON D.Id_Especialidad = E.Id_Especialidad
                    INNER JOIN Empleados EM ON D.Id_Empleado = EM.Id_Empleado
                    WHERE C.ID_Paciente = @Id_Paciente
                    ORDER BY P.Fecha DESC, P.Hora DESC
                `);
            
            return result.recordset;
            
        } catch (error) {
            console.error('Error al obtener pagos del paciente:', error.message);
            throw new Error('Error al obtener historial de pagos');
        } finally {
            if (pool) await pool.close();
        }
    }
}

module.exports = new PagoService();
