const db = require('../config/db.config');

class CancelacionService {
    
    /**
     * Cancelar una cita con cálculo de reembolso
     * @param {number} idCita - ID de la cita
     * @param {string} motivo - Motivo de la cancelación
     * @param {string} canceladoPor - Quien cancela: 'Paciente', 'Doctor', 'Sistema'
     * @param {string} usuario - Usuario que registra la cancelación
     * @returns {Promise<Object>} Resultado de la cancelación
     */
    async cancelarCita(idCita, motivo, canceladoPor, usuario) {
        let pool;
        try {
            pool = await db.connect();
            
            const request = pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .input('Motivo', db.sql.VarChar(200), motivo)
                .input('Cancelado_Por', db.sql.VarChar(20), canceladoPor)
                .input('Usuario', db.sql.VarChar(50), usuario);
            
            const result = await request.execute('SP_CancelarCita');
            
            return {
                success: true,
                mensaje: result.recordset[0].Mensaje,
                montoReembolso: result.recordset[0].Monto_Reembolso,
                porcentajeReembolso: result.recordset[0].Porcentaje_Reembolso
            };
            
        } catch (error) {
            console.error('Error al cancelar cita:', error.message);
            throw new Error(error.message);
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Calcular el reembolso que correspondería si se cancela ahora
     * @param {number} idCita - ID de la cita
     * @returns {Promise<Object>} Información del reembolso
     */
    async calcularReembolso(idCita) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('Id_Cita', db.sql.Int, idCita)
                .query(`
                    SELECT 
                        C.Id_Cita,
                        C.Fecha_cita,
                        C.Hora_Inicio,
                        E.Nombre AS Estatus,
                        P.Monto AS Monto_Pagado,
                        DATEDIFF(HOUR, GETDATE(), C.Fecha_cita) AS Horas_Anticipacion,
                        CASE 
                            WHEN DATEDIFF(HOUR, GETDATE(), C.Fecha_cita) >= 48 THEN 100
                            WHEN DATEDIFF(HOUR, GETDATE(), C.Fecha_cita) >= 24 THEN 50
                            ELSE 0
                        END AS Porcentaje_Reembolso,
                        CASE 
                            WHEN DATEDIFF(HOUR, GETDATE(), C.Fecha_cita) >= 48 THEN P.Monto
                            WHEN DATEDIFF(HOUR, GETDATE(), C.Fecha_cita) >= 24 THEN P.Monto * 0.5
                            ELSE 0
                        END AS Monto_Reembolso,
                        CASE
                            WHEN C.ID_Estatus IN (3, 4, 5, 6, 7) THEN 0
                            ELSE 1
                        END AS Puede_Cancelar
                    FROM Citas C
                    INNER JOIN Estatus_Cita E ON C.ID_Estatus = E.Id_Estatus
                    LEFT JOIN Pago P ON C.Id_Cita = P.Id_Cita
                    WHERE C.Id_Cita = @Id_Cita
                `);
            
            if (!result.recordset[0]) {
                throw new Error('Cita no encontrada');
            }
            
            return result.recordset[0];
            
        } catch (error) {
            console.error('Error al calcular reembolso:', error.message);
            throw error;
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Obtener citas canceladas de un paciente con información de reembolso
     * @param {number} idPaciente - ID del paciente
     * @returns {Promise<Array>} Lista de citas canceladas
     */
    async obtenerCitasCanceladas(idPaciente) {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request()
                .input('Id_Paciente', db.sql.Int, idPaciente)
                .query(`
                    SELECT 
                        C.Id_Cita,
                        C.Fecha_cita,
                        C.Hora_Inicio,
                        E.Nombre AS Estatus,
                        ES.Nombre AS Especialidad,
                        CONCAT(EM.Nombre, ' ', EM.Paterno) AS NombreDoctor,
                        B.Detalles AS Motivo,
                        B.Fecha_Hora AS Fecha_Cancelacion
                    FROM Citas C
                    INNER JOIN Estatus_Cita E ON C.ID_Estatus = E.Id_Estatus
                    INNER JOIN Doctores D ON C.Id_Doc = D.Id_Doctor
                    INNER JOIN Especialidades ES ON D.Id_Especialidad = ES.Id_Especialidad
                    INNER JOIN Empleados EM ON D.Id_Empleado = EM.Id_Empleado
                    LEFT JOIN Bitacora B ON B.Id_Reg_Afectado = C.Id_Cita 
                        AND B.Tabla_Afectada = 'Citas'
                        AND B.Detalles LIKE '%cancelada%'
                    WHERE C.ID_Paciente = @Id_Paciente
                    AND C.ID_Estatus IN (3, 4, 5)  -- Estados de cancelación
                    ORDER BY B.Fecha_Hora DESC
                `);
            
            return result.recordset;
            
        } catch (error) {
            console.error('Error al obtener citas canceladas:', error.message);
            throw new Error('Error al obtener citas canceladas');
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Ejecutar proceso de cancelación automática de citas expiradas
     * @returns {Promise<Object>} Resultado del proceso
     */
    async cancelarCitasExpiradas() {
        let pool;
        try {
            pool = await db.connect();
            
            const result = await pool.request().execute('SP_CancelarCitasExpiradas');
            
            return {
                success: true,
                mensaje: result.recordset[0].Mensaje,
                citasCanceladas: result.recordset[0].Citas_Canceladas
            };
            
        } catch (error) {
            console.error('Error al cancelar citas expiradas:', error.message);
            throw new Error('Error en proceso de cancelación automática');
        } finally {
            if (pool) await pool.close();
        }
    }
    
    /**
     * Obtener información de reembolsos realizados
     * @param {number} idPaciente - ID del paciente (opcional)
     * @returns {Promise<Array>} Lista de reembolsos
     */
    async obtenerReembolsos(idPaciente = null) {
        let pool;
        try {
            pool = await db.connect();
            
            const request = pool.request();
            let query = `
                SELECT 
                    B.Id_Reg_Afectado AS Id_Pago,
                    C.Id_Cita,
                    C.ID_Paciente,
                    CONCAT(PA.Nombre, ' ', PA.Paterno) AS NombrePaciente,
                    B.Fecha_Hora AS Fecha_Reembolso,
                    B.Detalles AS Detalle_Reembolso,
                    B.Usuario
                FROM Bitacora B
                INNER JOIN Pago P ON B.Id_Reg_Afectado = P.Id_Pago
                INNER JOIN Citas C ON P.Id_Cita = C.Id_Cita
                INNER JOIN Pacientes PA ON C.ID_Paciente = PA.ID_Paciente
                WHERE B.Tabla_Afectada = 'Pago'
                AND B.Accion = 'REEMBOLSO'
            `;
            
            if (idPaciente) {
                query += ` AND C.ID_Paciente = @Id_Paciente`;
                request.input('Id_Paciente', db.sql.Int, idPaciente);
            }
            
            query += ` ORDER BY B.Fecha_Hora DESC`;
            
            const result = await request.query(query);
            
            return result.recordset;
            
        } catch (error) {
            console.error('Error al obtener reembolsos:', error.message);
            throw new Error('Error al obtener historial de reembolsos');
        } finally {
            if (pool) await pool.close();
        }
    }
}

module.exports = new CancelacionService();
