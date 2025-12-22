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

}

export default new CitaService();