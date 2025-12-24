const API_URL = 'http://localhost:3000/api/recepcion';

class RecepcionService {
    
    constructor() {
        this.userRole = localStorage.getItem('userRole');
        this.userId = localStorage.getItem('userId');
    }

    getHeaders() {
        return {
            'Content-Type': 'application/json',
            'x-user-role': this.userRole,
            'x-user-id': this.userId
        };
    }

    // ==================== PACIENTES ====================

    async listarPacientes(busqueda = '') {
        try {
            const url = busqueda 
                ? `${API_URL}/pacientes?busqueda=${encodeURIComponent(busqueda)}`
                : `${API_URL}/pacientes`;

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar pacientes');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarPacientes:', error);
            throw error;
        }
    }

    async obtenerPaciente(idPaciente) {
        try {
            const response = await fetch(`${API_URL}/pacientes/${idPaciente}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Paciente no encontrado');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.obtenerPaciente:', error);
            throw error;
        }
    }

    async crearPaciente(dataPaciente) {
        try {
            const response = await fetch(`${API_URL}/pacientes`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dataPaciente)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear paciente');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.crearPaciente:', error);
            throw error;
        }
    }

    async actualizarPaciente(idPaciente, dataPaciente) {
        try {
            const response = await fetch(`${API_URL}/pacientes/${idPaciente}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(dataPaciente)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar paciente');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.actualizarPaciente:', error);
            throw error;
        }
    }

    // ==================== DOCTORES ====================

    async listarDoctores(especialidad = '', busqueda = '', incluirInactivos = false) {
        try {
            let url = `${API_URL}/doctores`;
            const params = [];
            
            if (especialidad) params.push(`especialidad=${especialidad}`);
            if (busqueda) params.push(`busqueda=${encodeURIComponent(busqueda)}`);
            if (incluirInactivos) params.push('incluirInactivos=true');
            
            if (params.length > 0) url += '?' + params.join('&');

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar doctores');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarDoctores:', error);
            throw error;
        }
    }

    async obtenerDoctor(idDoctor) {
        try {
            const response = await fetch(`${API_URL}/doctores/${idDoctor}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Doctor no encontrado');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.obtenerDoctor:', error);
            throw error;
        }
    }

    async crearDoctor(dataDoctor) {
        try {
            const response = await fetch(`${API_URL}/doctores`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dataDoctor)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear doctor');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.crearDoctor:', error);
            throw error;
        }
    }

    async actualizarDoctor(idDoctor, dataDoctor) {
        try {
            const response = await fetch(`${API_URL}/doctores/${idDoctor}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(dataDoctor)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar doctor');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.actualizarDoctor:', error);
            throw error;
        }
    }

    async darDeBajaDoctor(idDoctor) {
        try {
            const response = await fetch(`${API_URL}/doctores/${idDoctor}/baja`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al dar de baja doctor');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.darDeBajaDoctor:', error);
            throw error;
        }
    }

    // ==================== SERVICIOS ====================

    async listarServicios() {
        try {
            const response = await fetch(`${API_URL}/servicios`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar servicios');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarServicios:', error);
            throw error;
        }
    }

    async venderServicio(dataVenta) {
        try {
            const response = await fetch(`${API_URL}/servicios/venta`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dataVenta)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar venta');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.venderServicio:', error);
            throw error;
        }
    }

    // ==================== MEDICAMENTOS ====================

    async listarMedicamentos(busqueda = '', sinStock = false) {
        try {
            let url = `${API_URL}/medicamentos`;
            const params = [];
            
            if (busqueda) params.push(`busqueda=${encodeURIComponent(busqueda)}`);
            if (sinStock) params.push('sinStock=true');
            
            if (params.length > 0) url += '?' + params.join('&');

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar medicamentos');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarMedicamentos:', error);
            throw error;
        }
    }

    async venderMedicamento(dataVenta) {
        try {
            const response = await fetch(`${API_URL}/medicamentos/venta`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(dataVenta)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al registrar venta');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.venderMedicamento:', error);
            throw error;
        }
    }

    async actualizarStock(idMedicamento, nuevoStock) {
        try {
            const response = await fetch(`${API_URL}/medicamentos/${idMedicamento}/stock`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ Stock: nuevoStock })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar stock');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.actualizarStock:', error);
            throw error;
        }
    }

    // ==================== CITAS ====================

    async listarCitas(filtros = {}) {
        try {
            let url = `${API_URL}/citas`;
            const params = [];
            
            if (filtros.estatus) params.push(`estatus=${filtros.estatus}`);
            if (filtros.doctor) params.push(`doctor=${encodeURIComponent(filtros.doctor)}`);
            if (filtros.paciente) params.push(`paciente=${encodeURIComponent(filtros.paciente)}`);
            if (filtros.fechaInicio) params.push(`fechaInicio=${filtros.fechaInicio}`);
            if (filtros.fechaFin) params.push(`fechaFin=${filtros.fechaFin}`);
            
            if (params.length > 0) url += '?' + params.join('&');

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar citas');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarCitas:', error);
            throw error;
        }
    }

    async cancelarCita(idCita, motivo, canceladoPor = 'Paciente') {
        try {
            const response = await fetch(`${API_URL}/citas/${idCita}/cancelar`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ Motivo: motivo, Cancelado_Por: canceladoPor })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al cancelar cita');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.cancelarCita:', error);
            throw error;
        }
    }

    async listarCitasPaciente(idPacienteOUser) {
        try {
            const response = await fetch(`http://localhost:3000/api/citas/paciente/${idPacienteOUser}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            if (!response.ok) throw new Error('Error al obtener citas del paciente');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarCitasPaciente:', error);
            throw error;
        }
    }

    async crearRecepcionista(datos) {
        try {
            const response = await fetch(`${API_URL}/recepcionistas`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(datos)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al crear recepcionista');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.crearRecepcionista:', error);
            throw error;
        }
    }

    async listarRecepcionistas(busqueda = '', incluirInactivos = false) {
        try {
            let url = `${API_URL}/recepcionistas`;
            const params = [];
            if (busqueda) params.push(`busqueda=${encodeURIComponent(busqueda)}`);
            if (incluirInactivos) params.push('incluirInactivos=true');
            if (params.length > 0) url += '?' + params.join('&');

            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) throw new Error('Error al listar recepcionistas');
            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.listarRecepcionistas:', error);
            throw error;
        }
    }

    async darDeBajaRecepcionista(idEmpleado) {
        try {
            const response = await fetch(`${API_URL}/recepcionistas/${idEmpleado}/baja`, {
                method: 'POST',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al dar de baja recepcionista');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.darDeBajaRecepcionista:', error);
            throw error;
        }
    }

    async actualizarRecepcionista(idEmpleado, data) {
        try {
            const response = await fetch(`${API_URL}/recepcionistas/${idEmpleado}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar recepcionista');
            }

            return await response.json();
        } catch (error) {
            console.error('Error en RecepcionService.actualizarRecepcionista:', error);
            throw error;
        }
    }
}

export default new RecepcionService();
