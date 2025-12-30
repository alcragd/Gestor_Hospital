const API_URL = 'http://localhost:3000/api/citas'; 

class CitaService {
    
    // Función para crear una nueva cita
    async crearCita(citaData) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(citaData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.message || 'Error desconocido al crear la cita'); 
            }

            return await response.json();

        } catch (error) {
            console.error('Error en CitaService.crearCita:', error);
            throw error;
        }
    }

    // Agendar cita autenticado (usa cabeceras x-user-*) y endpoint /agendar
    async agendarCitaAutenticado({ Id_Doctor, Fecha_Cita, Hora_Inicio, Hora_Fin }) {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('idUser'); // Id_User de Usuarios
        try {
            const response = await fetch(`${API_URL}/agendar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': userRole,
                    'x-user-id': userId
                },
                body: JSON.stringify({ Id_Doctor, Fecha_Cita, Hora_Inicio, Hora_Fin })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.message || 'Error al agendar la cita');
            }
            return await response.json();
        } catch (error) {
            console.error('Error en CitaService.agendarCitaAutenticado:', error);
            throw error;
        }
    }


    async getEspecialidades() {
        const response = await fetch(`${API_URL}/especialidades`);
        if (!response.ok) throw new Error('Error al cargar especialidades--.');
        return response.json();
    }
    
    async getDoctores(id_especialidad) {
        const response = await fetch(`${API_URL}/doctores/${id_especialidad}`);
        if (!response.ok) throw new Error('Error al cargar doctores.');
        return response.json();
    }

    async getSlotsOcupados(Id_Doctor, Fecha_cita) {
        const response = await fetch(`${API_URL}/disponibilidad`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Id_Doctor, Fecha_cita })
        });
        if (!response.ok) throw new Error('Error al cargar disponibilidad.');
        return response.json();
    }

    async getHorarioTrabajo(Id_Doctor, Fecha) {
        const response = await fetch(`${API_URL}/horario-trabajo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Id_Doctor, Fecha }) 
        });
        if (!response.ok) throw new Error('Error al cargar el horario de trabajo.');
        return response.json();
    }

        async getCitasPaciente(idPaciente) {
        try {
            const response = await fetch(`${API_URL}/paciente/${idPaciente}`);
            if (!response.ok) throw new Error('Error al obtener citas del paciente');
            return response.json();
        } catch (error) {
            console.error('Error en CitaService.getCitasPaciente:', error);
            throw error;
        }
    }

    // Historial del paciente autenticado
    async misCitasPaciente(params = {}) {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('idUser');
        const q = new URLSearchParams(params).toString();
        const url = q ? `${API_URL}/mis-citas?${q}` : `${API_URL}/mis-citas`;
        const response = await fetch(url, {
            headers: {
                'x-user-role': userRole,
                'x-user-id': userId
            }
        });
        if (!response.ok) throw new Error('Error al obtener mis citas');
        return response.json();
    }

    // Historial del doctor autenticado
    async misCitasDoctor(params = {}) {
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('idUser');
        const q = new URLSearchParams(params).toString();
        const url = q ? `${API_URL}/mis-citas-doctor?${q}` : `${API_URL}/mis-citas-doctor`;
        const response = await fetch(url, {
            headers: {
                'x-user-role': userRole,
                'x-user-id': userId
            }
        });
        if (!response.ok) throw new Error('Error al obtener citas del doctor');
        return response.json();
    }

    // Doctor marca cita como atendida
    async atenderCita(idCita){
        const userRole = localStorage.getItem('userRole');
        const userId = localStorage.getItem('idUser');
        const response = await fetch(`${API_URL}/${idCita}/atender`, {
            method: 'POST',
            headers: {
                'x-user-role': userRole,
                'x-user-id': userId
            }
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Error al marcar cita atendida');
        }
        return response.json();
    }

}

export default new CitaService();