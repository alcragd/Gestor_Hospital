<template>
  <div class="panel-paciente">
    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Panel de Paciente</h5>
            <small>{{ nombreCompleto }}</small>
          </div>
          <button class="btn btn-sm btn-outline-light" @click="logout">Cerrar sesión</button>
        </div>
      </div>

      <div class="card-body">
        <ul class="nav nav-tabs mb-3">
          <li class="nav-item">
            <a class="nav-link" :class="{active: tab==='agendar'}" @click="tab='agendar'" href="#">Agendar Cita</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{active: tab==='mis'}" @click="tab='mis'" href="#">Mis Citas</a>
          </li>
        </ul>

        <div v-if="tab==='agendar'" class="tab-content">
          <FormularioCita @cita-creada="onCitaCreada" />
        </div>

        <div v-else class="tab-content">
          <div class="filtros mb-3">
            <div class="row g-2 align-items-end">
              <div class="col-auto">
                <label class="form-label small mb-1">Desde</label>
                <input type="date" class="form-control form-control-sm" v-model="filtros.fecha_inicio">
              </div>
              <div class="col-auto">
                <label class="form-label small mb-1">Hasta</label>
                <input type="date" class="form-control form-control-sm" v-model="filtros.fecha_fin">
              </div>
              <div class="col-auto">
                <button class="btn btn-sm btn-primary" @click="cargarMisCitas">Actualizar</button>
              </div>
            </div>
          </div>

          <div v-if="mensaje" class="alert" :class="isError? 'alert-danger':'alert-info'">{{ mensaje }}</div>

          <div v-if="citas.length===0" class="text-center text-muted py-4">
            <p class="mb-0">No hay citas registradas para este período.</p>
          </div>
          <div v-else class="table-responsive">
            <table class="table table-hover table-sm">
              <thead class="table-light">
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Doctor</th>
                  <th>Especialidad</th>
                  <th>Estatus</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="c in citas" :key="c.Id_Cita || c.folio">
                  <td><strong>{{ c.Id_Cita || c.folio }}</strong></td>
                  <td>{{ c.Fecha_cita_fmt || c.Fecha_cita || c.fecha_cita }}</td>
                  <td><span class="badge bg-secondary">{{ c.Hora_Inicio_fmt }} - {{ c.Hora_Fin_fmt }}</span></td>
                  <td>{{ c.Doctor }}</td>
                  <td>{{ c.Especialidad }}</td>
                  <td>
                    <span class="badge" :class="getEstatusBadge(c.Estatus || c.Id_Estatus)">{{ c.Estatus || c.Id_Estatus }}</span>
                  </td>
                  <td>
                    <button class="btn btn-sm btn-outline-danger me-1" @click="confirmarCancelar(c)" :disabled="!puedeCancelar(c)">Cancelar</button>
                    <button class="btn btn-sm btn-success" @click="confirmarPagar(c)" :disabled="!puedePagar(c)">Pagar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import FormularioCita from '../FormularioCita.vue';
import CitaService from '../../services/CitaService';
import PagoService from '../../services/PagoService';
import CancelacionService from '../../services/CancelacionService';

export default {
  name: 'PanelPaciente',
  components: { FormularioCita },
  data(){
    return {
      tab: 'agendar',
      nombreCompleto: `${localStorage.getItem('nombre')||''} ${localStorage.getItem('paterno')||''}`.trim(),
      citas: [],
      filtros: { fecha_inicio: '', fecha_fin: '' },
      mensaje: '',
      isError: false
    }
  },
  mounted(){
    const role = parseInt(localStorage.getItem('userRole'),10);
    if (role !== 4) {
      window.location.href = '/login.html';
      return;
    }
    this.cargarMisCitas();
  },
  methods:{
    async cargarMisCitas(){
      this.mensaje=''; this.isError=false;
      try{
        const res = await CitaService.misCitasPaciente(this.filtros);
        const raw = Array.isArray(res?.citas) ? res.citas : [];
        this.citas = raw.map(c => ({
          ...c,
          Fecha_cita_fmt: this.formatDate(c.Fecha_cita || c.fecha_cita),
          Hora_Inicio_fmt: this.formatTime(c.Hora_Inicio),
          Hora_Fin_fmt: this.formatTime(c.Hora_Fin)
        }));
        if (this.citas.length===0) this.mensaje='Sin citas para los filtros aplicados.';
      }catch(e){
        this.mensaje = e.message; this.isError=true;
      }
    },
    formatDate(val){
      if (!val) return '';
      if (typeof val === 'string' && val.includes('T')) return val.slice(0,10);
      if (typeof val === 'string' && val.length >= 10) return val.slice(0,10);
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0,10);
    },
    formatTime(val){
      if (!val) return '';
      if (typeof val === 'string' && val.includes('T')) {
        const [, time] = val.split('T');
        return time ? time.slice(0,5) : '';
      }
      if (typeof val === 'string' && val.length >= 5) return val.slice(0,5);
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(11,16);
    },
    getEstatusBadge(estatus){
      const e = String(estatus||'').toLowerCase();
      if (e.includes('pagada') || e === '2') return 'bg-warning text-dark';
      if (e.includes('atendida') || e === '6') return 'bg-success';
      if (e.includes('cancelada') || ['3','4','5'].includes(e)) return 'bg-danger';
      if (e.includes('pendiente') || e === '1') return 'bg-info';
      return 'bg-secondary';
    },
    puedeCancelar(c){
      const est = c.Id_Estatus || c.Estatus || '';
      // Permitir estatus 1 o 2 (Programada/Pagada)
      return [1,2,'Programada','Pagada'].includes(est);
    },
    puedePagar(c){
      const est = c.Id_Estatus || c.Estatus || '';
      return [1,'Programada'].includes(est);
    },
    async confirmarCancelar(c){
      if(!confirm('¿Cancelar esta cita? Se aplicarán políticas de reembolso.')) return;
      try{
        await CancelacionService.cancelarCitaPaciente(c.Id_Cita || c.Folio, 'Cancelación solicitada por paciente');
        alert('Cita cancelada.');
        this.cargarMisCitas();
      }catch(e){
        alert('Error: '+e.message);
      }
    },
    async confirmarPagar(c){
      if(!confirm('¿Confirmas el pago de esta cita?')) return;
      try{
        const idCita = c.Id_Cita || c.Folio;
        // Verifica el plazo contra la hora del servidor de BD
        const plazo = await PagoService.verificarPlazo(idCita);
        if (plazo.estadoPlazo === 'EXPIRADO') {
          alert(`No es posible pagar: la ventana de 8 horas expiró.\n`+
                `Solicitud: ${plazo.fechaSolicitud} | Límite: ${plazo.fechaLimitePago}`);
          return;
        }
        const res = await PagoService.registrarPago({ Id_Cita: idCita, Metodo_Pago: 'Tarjeta', Usuario: 'PacienteWeb' });
        alert(`Pago registrado. Ticket: ${res.recibo || res.message || 'OK'}`);
        this.cargarMisCitas();
      }catch(e){
        alert('Error: '+e.message);
      }
    },
    onCitaCreada(){
      this.tab='mis';
      this.cargarMisCitas();
    },
    logout(){
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
}
</script>

<style scoped>
.panel-paciente{ 
  padding: 1.5rem; 
  min-height: 100vh;
  background: #f5f5f5;
}
.card {
  border-radius: 8px;
  border: none;
}
.card-header {
  border-radius: 8px 8px 0 0 !important;
  padding: 1rem 1.25rem;
}
.nav-link {
  cursor: pointer;
}
.table-responsive {
  border-radius: 4px;
}
.badge {
  font-size: 0.85rem;
  padding: 0.35em 0.65em;
}
.tab-content {
  margin-top: 0;
}
</style>
