// services/PacienteService.js
const API_BASE = 'http://localhost:3000/api/pacientes';

// Este servicio asume que ya conoces el Id_User y el rol (4 = Paciente)
// Se envían en encabezados para que el backend valide la propiedad del recurso.

function buildHeaders(userId, role) {
    return {
        'Content-Type': 'application/json',
        'x-user-id': userId?.toString() || '',
        'x-user-role': role?.toString() || ''
    };
}

export default {
    // Obtener el perfil del paciente autenticado
    async getPaciente({ userId, role }) {
        const res = await fetch(`${API_BASE}/me`, { headers: buildHeaders(userId, role) });
        if (!res.ok) throw new Error('Error al cargar paciente');
        return res.json();
    },

    // Actualizar datos no críticos del paciente autenticado
    async updatePaciente({ userId, role }, data) {
        const res = await fetch(`${API_BASE}/me`, {
            method: 'PUT',
            headers: buildHeaders(userId, role),
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ message: 'Error desconocido' }));
            throw new Error(err.message || 'Error actualizando paciente');
        }
        return res.json();
    }
};
