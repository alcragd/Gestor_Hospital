const API_URL = 'http://localhost:3000/api/pagos';

class PagoService {
  async registrarPago({ Id_Cita, Metodo_Pago, Usuario }) {
    const response = await fetch(`${API_URL}/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Id_Cita, Metodo_Pago, Usuario })
    });
    if (!response.ok) {
      const e = await response.json();
      throw new Error(e.details || e.message || 'Error al registrar pago');
    }
    return response.json();
  }

  async pagoPorCita(idCita) {
    const res = await fetch(`${API_URL}/cita/${idCita}`);
    if (!res.ok) throw new Error('Error al obtener pago de cita');
    return res.json();
  }

  async verificarPlazo(idCita) {
    const res = await fetch(`${API_URL}/plazo/${idCita}`);
    if (!res.ok) throw new Error('Error al verificar plazo de pago');
    return res.json();
  }

  async pagosPorPaciente(idPaciente) {
    const res = await fetch(`${API_URL}/paciente/${idPaciente}`);
    if (!res.ok) throw new Error('Error al obtener pagos del paciente');
    return res.json();
  }
}

export default new PagoService();
