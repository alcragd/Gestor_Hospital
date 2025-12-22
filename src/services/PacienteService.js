// services/PacienteService.js
const API_BASE = 'http://localhost:3000/api/pacientes';

export default {
async getPaciente(id) {
const res = await fetch(`${API_BASE}/${id}`);
if (!res.ok) throw new Error('Error al cargar paciente');
return res.json();
},

async updatePaciente(id, data) {
const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
});
if (!res.ok) {
    const err = await res.json().catch(()=>({message:'Error desconocido'}));
    throw new Error(err.message || 'Error actualizando paciente');
}
return res.json();
}
};
