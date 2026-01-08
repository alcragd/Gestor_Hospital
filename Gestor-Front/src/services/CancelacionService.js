const API_URL = 'http://localhost:3000/api/cancelaciones';

class CancelacionService {
  // Paciente cancela su propia cita
  async cancelarCitaPaciente(idCita, motivo) {
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('idUser');
    const response = await fetch(`${API_URL}/mis-citas/${idCita}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': userRole,
        'x-user-id': userId
      },
      body: JSON.stringify({ Motivo: motivo })
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.details || e.message || 'Error al cancelar la cita');
    }
    return response.json();
  }

  async calcularReembolso(idCita) {
    const res = await fetch(`${API_URL}/calcular-reembolso/${idCita}`);
    if (!res.ok) throw new Error('Error al calcular reembolso');
    return res.json();
  }

  async reembolsosPaciente(idPaciente) {
    const res = await fetch(`${API_URL}/reembolsos/${idPaciente}`);
    if (!res.ok) throw new Error('Error al obtener reembolsos');
    return res.json();
  }
}

export default new CancelacionService();
