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
          <li class="nav-item">
            <a class="nav-link" :class="{active: tab==='tickets'}" @click="tab='tickets'; cargarTickets();" href="#">Tickets</a>
          </li>
        </ul>

        <div v-if="tab==='agendar'" class="tab-content">
          <FormularioCita @cita-creada="onCitaCreada" />
        </div>

        <div v-else-if="tab==='mis'" class="tab-content">
          <div class="form-wrapper">
            <div class="card shadow-sm form-card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Mis Citas</h6>
                <small class="text-muted">Filtra por fecha</small>
              </div>
              <div class="card-body">
                <div class="filtros mb-3">
                  <div class="row g-3 align-items-end">
                    <div class="col-auto">
                      <label class="form-label small mb-1">Desde</label>
                      <input type="date" class="form-control form-control-sm" v-model="filtros.fecha_inicio">
                    </div>
                    <div class="col-auto">
                      <label class="form-label small mb-1">Hasta</label>
                      <input type="date" class="form-control form-control-sm" v-model="filtros.fecha_fin">
                    </div>
                    <div class="col-auto">
                      <label class="form-label small mb-1">Estatus</label>
                      <select class="form-select form-select-sm" v-model="estatusFiltro" @change="aplicarFiltros">
                        <option v-for="opt in estatusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                      </select>
                    </div>
                    <div class="col-auto">
                      <button class="btn btn-sm btn-primary" @click="cargarMisCitas">Actualizar</button>
                    </div>
                    <div class="col-auto" v-if="estatusFiltro">
                      <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">Limpiar filtros</button>
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
                          <button class="btn btn-sm btn-outline-danger" @click="confirmarCancelar(c)" :disabled="!puedeCancelar(c)">Cancelar</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tab-content">
          <div class="form-wrapper">
            <div class="card shadow-sm form-card">
              <div class="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 class="mb-0">Tickets de Cita</h6>
                <small class="text-muted">Resumen de tickets</small>
              </div>
              <div class="card-body">
                <div v-if="mensajeTickets" class="alert" :class="errorTickets? 'alert-danger':'alert-info'">{{ mensajeTickets }}</div>

                <div v-if="tickets.length===0" class="text-center text-muted py-4">
                  <p class="mb-1">No hay tickets disponibles.</p>
                  <small>Los tickets aparecen cuando agendas o pagas una cita.</small>
                </div>

                <div v-else class="row g-3">
                  <div v-for="t in tickets" :key="t.Id_Cita" class="col-12 col-lg-6">
                    <div class="card h-100 shadow-sm ticket-card" :class="getTicketAccentClass(t.Id_Estatus)">
                      <div class="card-header bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <div class="d-flex align-items-center gap-2">
                            <span class="ticket-folio">Cita #{{ t.Id_Cita }}</span>
                            <span class="badge" :class="getEstatusBadge(t.Id_Estatus)">{{ t.Estatus_Label }}</span>
                          </div>
                          <div class="small text-muted mt-1">{{ t.Especialidad }} • {{ t.Doctor }}</div>
                        </div>
                      </div>
                      <div class="card-body">
                        <dl class="row mb-0">
                          <dt class="col-5 text-muted">Fecha</dt>
                          <dd class="col-7">{{ t.Fecha_cita_fmt }}</dd>
                          <dt class="col-5 text-muted">Hora</dt>
                          <dd class="col-7">{{ t.Hora_Inicio_fmt }} - {{ t.Hora_Fin_fmt }}</dd>
                          <template v-if="t.pago">
                            <dt class="col-5 text-muted">Pago</dt>
                            <dd class="col-7 fw-semibold">${{ t.pago.Monto?.toFixed(2) || t.pago.monto?.toFixed(2) || t.pago.Monto || t.pago.monto }}</dd>
                            <dt class="col-5 text-muted">Método</dt>
                            <dd class="col-7">{{ t.pago.Metodo_Pago || t.pago.metodo_pago || '—' }}</dd>
                          </template>
                          <template v-else-if="!t.cancelada">
                            <dt class="col-5 text-muted">Importe</dt>
                            <dd class="col-7 fw-semibold text-danger">${{ (t.Costo || t.costo || t.Precio || t.precio || 0).toFixed(2) }}</dd>
                          </template>
                        </dl>
                        <div class="alert alert-success py-2 mt-3 mb-0" v-if="t.reembolso">
                          <div class="fw-semibold">Reembolso: ${{ t.reembolso.monto }}</div>
                          <div class="small text-muted">{{ t.reembolso.detalle }}</div>
                        </div>
                        <div class="alert alert-warning py-2 mt-3 mb-0" v-if="t.cancelada && !t.reembolso">
                          <div class="fw-semibold">Cita cancelada</div>
                          <div class="small text-muted">Se informará el reembolso cuando esté disponible.</div>
                        </div>
                      </div>
                      <div class="card-footer bg-transparent d-flex gap-2">
                        <button class="btn btn-sm btn-success" v-if="puedePagar(t)" @click="confirmarPagar(t)">Pagar</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
      citasSinFiltrar: [],
      filtros: { fecha_inicio: '', fecha_fin: '' },
      estatusFiltro: '',
      estatusOptions: [
        { value: '', label: 'Todos los estatus' },
        { value: '1', label: 'Agendada - Pendiente Pago' },
        { value: '2', label: 'Pagada - Pendiente Atender' },
        { value: '3', label: 'Cancelada Falta Pago' },
        { value: '4', label: 'Cancelada Paciente' },
        { value: '5', label: 'Cancelada Doctor' },
        { value: '6', label: 'Atendida' },
        { value: '7', label: 'No Acudió' }
      ],
      mensaje: '',
      isError: false,

      tickets: [],
      mensajeTickets: '',
      errorTickets: false
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
        this.citasSinFiltrar = raw;
        this.aplicarFiltros();
        if (this.citas.length===0) this.mensaje='Sin citas para los filtros aplicados.';
      }catch(e){
        this.mensaje = e.message; this.isError=true;
      }
    },
    aplicarFiltros(){
      let filtered = [...this.citasSinFiltrar];
      
      // Filtrar por estatus si está seleccionado
      if (this.estatusFiltro) {
        filtered = filtered.filter(c => {
          const estatusCita = String(c.Id_Estatus || '').trim();
          return estatusCita === this.estatusFiltro;
        });
      }
      
      // Aplicar formato
      this.citas = filtered.map(c => ({
        ...c,
        Fecha_cita_fmt: this.formatDate(c.Fecha_cita || c.fecha_cita),
        Hora_Inicio_fmt: this.formatTime(c.Hora_Inicio),
        Hora_Fin_fmt: this.formatTime(c.Hora_Fin)
      }));
    },
    limpiarFiltros(){
      this.estatusFiltro = '';
      this.aplicarFiltros();
    },

    async cargarTickets(){
      this.mensajeTickets=''; this.errorTickets=false; this.tickets = [];
      try{
        const pacienteId = localStorage.getItem('userId');
        const [citasRes, pagosRes, reembolsosRes] = await Promise.all([
          CitaService.misCitasPaciente(this.filtros),
          PagoService.pagosPorPaciente(pacienteId),
          CancelacionService.reembolsosPaciente(pacienteId).catch(() => [])
        ]);

        const pagos = Array.isArray(pagosRes) ? pagosRes : (pagosRes?.pagos || []);
        const reembolsos = Array.isArray(reembolsosRes) ? reembolsosRes : reembolsosRes?.reembolsos || [];
        const pagosMap = new Map(pagos.map(p => [p.Id_Cita || p.id_cita, p]));
        const reembMap = new Map(
          reembolsos.map(r => [r.Id_Cita || r.id_cita, {
            detalle: r.Detalle_Reembolso || r.detalle_reembolso || r.Detalles || 'Reembolso registrado',
            monto: r.Monto_Reembolso || r.monto || r.Monto || '—',
            fecha: r.Fecha_Reembolso || r.fecha_reembolso
          }])
        );

        const raw = Array.isArray(citasRes?.citas) ? citasRes.citas : [];
        this.tickets = raw.map(c => {
          const pago = pagosMap.get(c.Id_Cita) || null;
          const reemb = reembMap.get(c.Id_Cita) || null;
          const cancelada = [3,4,5,'Cancelada','Cancelada - Paciente','Cancelada - Doctor','Cancelada - Falta Pago'].includes(c.Id_Estatus || c.Estatus);
          return {
            ...c,
            Fecha_cita_fmt: this.formatDate(c.Fecha_cita || c.fecha_cita),
            Hora_Inicio_fmt: this.formatTime(c.Hora_Inicio),
            Hora_Fin_fmt: this.formatTime(c.Hora_Fin),
            Estatus_Label: c.Estatus || c.Id_Estatus,
            pago,
            reembolso: reemb,
            cancelada
          };
        });

        if (this.tickets.length===0) this.mensajeTickets='No hay tickets aún.';
      }catch(e){
        console.error(e);
        this.mensajeTickets = e.message || 'Error al cargar tickets';
        this.errorTickets = true;
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

    getTicketAccentClass(estatus){
      const e = String(estatus||'').toLowerCase();
      if (e.includes('pagada') || e === '2') return 'ticket-accent-warning';
      if (e.includes('atendida') || e === '6') return 'ticket-accent-success';
      if (e.includes('cancelada') || ['3','4','5'].includes(e)) return 'ticket-accent-danger';
      return 'ticket-accent-info';
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

/* Centered container like Agendar Cita */
.form-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.25rem 0.75rem;
}
.form-card {
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  min-width: 980px;
  box-sizing: border-box;
}
.form-card .card-body {
  padding: 1.25rem;
}

/* Tickets UI */
.ticket-card {
  border-left: 4px solid #dee2e6;
}
.ticket-folio {
  font-weight: 600;
}
.ticket-accent-success { border-left-color: #198754; }
.ticket-accent-warning { border-left-color: #ffc107; }
.ticket-accent-danger  { border-left-color: #dc3545; }
.ticket-accent-info    { border-left-color: #0dcaf0; }

@media (max-width: 768px) {
  .form-card {
    min-width: auto;
    margin: 0.5rem;
  }
}
</style>
