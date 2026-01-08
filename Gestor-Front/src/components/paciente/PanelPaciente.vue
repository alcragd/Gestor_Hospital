<template>
  <!-- Comprobante de Cita -->
  <ComprobanteCita 
    v-if="mostrarComprobante" 
    :cita="comprobanteData" 
    @cerrar="cerrarComprobante"
  />

  <!-- Modal de Información de Cita -->
  <div v-if="mostrarInfoCita" class="modal-overlay-info" @click.self="cerrarInfoCita">
    <div class="modal-info">
      <button class="btn-close-info" @click="cerrarInfoCita">×</button>
      <div class="modal-header-info">
        <div>
          <h5 class="mb-1">Cita #{{ citaSeleccionada.Id_Cita }}</h5>
          <small class="text-muted">{{ citaSeleccionada.Especialidad }} • Dr. {{ citaSeleccionada.Doctor }}</small>
        </div>
        <span class="badge" :class="getEstatusBadge(citaSeleccionada.Estatus || citaSeleccionada.Id_Estatus)">
          {{ citaSeleccionada.Estatus || citaSeleccionada.Id_Estatus }}
        </span>
      </div>
      <div class="modal-body-info">
        <div class="info-card">
          <h6 class="info-card-title">Datos de la Cita</h6>
          <dl class="info-list">
            <dt>Fecha</dt>
            <dd>{{ citaSeleccionada.Fecha_cita_fmt || formatDate(citaSeleccionada.Fecha_cita) }}</dd>
            <dt>Horario</dt>
            <dd>{{ citaSeleccionada.Hora_Inicio_fmt || formatTime(citaSeleccionada.Hora_Inicio) }} - {{ citaSeleccionada.Hora_Fin_fmt || formatTime(citaSeleccionada.Hora_Fin) }}</dd>
            <dt>Consultorio</dt>
            <dd>{{ citaSeleccionada.Consultorio || 'Por asignar' }}</dd>
          </dl>
        </div>

        <div class="info-card">
          <h6 class="info-card-title">Información de Pago</h6>
          <dl class="info-list">
            <dt>Costo de Consulta</dt>
            <dd class="fw-bold">${{ formatearCosto(citaSeleccionada.Costo || citaSeleccionada.Precio || 0) }}</dd>
            <dt>Estado</dt>
            <dd>
              <span v-if="estaPagada(citaSeleccionada)" class="badge bg-success">Pagada</span>
              <span v-else class="badge bg-warning text-dark">Por Pagar</span>
            </dd>
            <template v-if="citaSeleccionada.pago">
              <dt>Método de Pago</dt>
              <dd>{{ citaSeleccionada.pago.Metodo_Pago || citaSeleccionada.pago.metodo_pago || '—' }}</dd>
              <dt>Fecha de Pago</dt>
              <dd>{{ citaSeleccionada.pago.Fecha_Pago || citaSeleccionada.pago.fecha_pago || '—' }}</dd>
            </template>
          </dl>
        </div>

        <div class="info-card">
          <h6 class="info-card-title">Política de Cancelación</h6>
          <div class="politica-list">
            <div class="politica-row">
              <span>Más de 24 horas de anticipación</span>
              <span class="badge bg-success">Reembolso 100%</span>
            </div>
            <div class="politica-row">
              <span>Entre 12 y 24 horas antes</span>
              <span class="badge bg-info">Reembolso 50%</span>
            </div>
            <div class="politica-row">
              <span>Menos de 12 horas</span>
              <span class="badge bg-danger">Sin reembolso</span>
            </div>
            <div class="politica-row">
              <span>No presentarse</span>
              <span class="badge bg-danger">Sin reembolso</span>
            </div>
          </div>
        </div>

        <div v-if="citaSeleccionada.reembolso" class="info-card alert alert-success">
          <h6 class="info-card-title">Reembolso Aplicado</h6>
          <dl class="info-list">
            <dt>Monto del Reembolso</dt>
            <dd class="fw-bold text-success">${{ formatearCosto(citaSeleccionada.reembolso.monto) }}</dd>
            <dt>Razón</dt>
            <dd>{{ citaSeleccionada.reembolso.detalle }}</dd>
          </dl>
        </div>
      </div>
      <div class="modal-footer-info">
        <button class="btn btn-outline-secondary" @click="cerrarInfoCita">Cerrar</button>
      </div>
    </div>
  </div>

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
            <a class="nav-link" :class="{active: tab==='datos'}" @click="tab='datos'" href="#">Mis Datos</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{active: tab==='agendar'}" @click="tab='agendar'" href="#">Agendar Cita</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{active: tab==='mis'}" @click="tab='mis'" href="#">Mis Citas</a>
          </li>
        </ul>

        <div v-if="tab==='datos'" class="tab-content">
          <DatosPersonales :datos="datosPaciente" tipo="paciente" />
        </div>

        <div v-if="tab==='agendar'" class="tab-content">
          <FormularioCita @cita-creada="onCitaCreada" />
        </div>

        <div v-else class="tab-content">
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
                          <div class="btn-group btn-group-sm" role="group">
                            <button class="btn btn-outline-info" @click="verInfoCita(c)" title="Ver información">
                              Info
                            </button>
                            <button class="btn btn-outline-primary" @click="verComprobante(c)" title="Ver comprobante">
                              Comprobante
                            </button>
                            <button class="btn btn-success" v-if="puedePagar(c)" @click="confirmarPagar(c)">
                              Pagar
                            </button>
                            <button class="btn btn-outline-danger" @click="confirmarCancelar(c)" :disabled="!puedeCancelar(c)">
                              Cancelar
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
import ComprobanteCita from '../ComprobanteCita.vue';
import DatosPersonales from '../DatosPersonales.vue';
import CitaService from '../../services/CitaService';
import PagoService from '../../services/PagoService';
import CancelacionService from '../../services/CancelacionService';


export default {
  name: 'PanelPaciente',
  components: { FormularioCita, ComprobanteCita, DatosPersonales },
  data(){
    return {
      tab: 'agendar',
      nombreCompleto: `${localStorage.getItem('nombre')||''} ${localStorage.getItem('paterno')||''}`.trim(),
      datosPaciente: {},
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
      errorTickets: false,
      
      // Comprobante
      mostrarComprobante: false,
      comprobanteData: null,
      
      // Info Cita
      mostrarInfoCita: false,
      citaSeleccionada: null
    }
  },
  mounted(){
    const role = parseInt(localStorage.getItem('userRole'),10);
    if (role !== 4) {
      window.location.href = '/login.html';
      return;
    }
    this.cargarDatosPaciente();
    this.cargarMisCitas();
  },
  methods:{
    async cargarDatosPaciente(){
      try {
        const res = await CitaService.misCitasPaciente();
        if (res?.citas && res.citas.length > 0) {
          const primeraCita = res.citas[0];
          this.datosPaciente = {
            Nombre: localStorage.getItem('nombre') || '',
            Paterno: localStorage.getItem('paterno') || '',
            Materno: localStorage.getItem('materno') || '',
            DNI: localStorage.getItem('dni') || '',
            Correo: localStorage.getItem('correo') || primeraCita.Correo_Paciente || '',
            Telefono_cel: localStorage.getItem('telefono') || primeraCita.Telefono_Paciente || '',
            Edad: localStorage.getItem('edad') || '',
            Sexo: localStorage.getItem('sexo') || '',
            Fecha_nac: localStorage.getItem('fecha_nac') || ''
          };
        } else {
          this.datosPaciente = {
            Nombre: localStorage.getItem('nombre') || '',
            Paterno: localStorage.getItem('paterno') || '',
            Materno: localStorage.getItem('materno') || '',
            DNI: localStorage.getItem('dni') || '',
            Correo: localStorage.getItem('correo') || '',
            Telefono_cel: localStorage.getItem('telefono') || '',
            Edad: localStorage.getItem('edad') || '',
            Sexo: localStorage.getItem('sexo') || '',
            Fecha_nac: localStorage.getItem('fecha_nac') || ''
          };
        }
      } catch (err) {
        console.error('Error cargando datos del paciente:', err);
      }
    },
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
    
    verComprobante(cita) {
      this.comprobanteData = {
        folio: cita.Id_Cita || cita.folio,
        paciente: this.nombreCompleto,
        fecha: cita.Fecha_cita_fmt || this.formatDate(cita.Fecha_cita || cita.fecha_cita),
        horaInicio: cita.Hora_Inicio_fmt || this.formatTime(cita.Hora_Inicio) || '',
        horaFin: cita.Hora_Fin_fmt || this.formatTime(cita.Hora_Fin) || '',
        consultorio: cita.Consultorio || cita.NumConsultorio || 'Por asignar',
        especialidad: cita.Especialidad || '',
        doctor: cita.Doctor || '',
        costo: cita.Costo || cita.Precio || 0,
        lineaPago: null // Se generará automáticamente
      };
      
      this.mostrarComprobante = true;
    },
    
    cerrarComprobante() {
      this.mostrarComprobante = false;
      this.comprobanteData = null;
    },
    
    verInfoCita(cita) {
      this.citaSeleccionada = {
        ...cita,
        pago: null,
        reembolso: null
      };
      
      // Cargar información de pagos y reembolsos
      Promise.all([
        PagoService.pagosPorPaciente(localStorage.getItem('userId')).catch(() => []),
        CancelacionService.reembolsosPaciente(localStorage.getItem('userId')).catch(() => [])
      ]).then(([pagosRes, reembolsosRes]) => {
        const pagos = Array.isArray(pagosRes) ? pagosRes : (pagosRes?.pagos || []);
        const reembolsos = Array.isArray(reembolsosRes) ? reembolsosRes : (reembolsosRes?.reembolsos || []);
        
        // Buscar pago para esta cita
        const pago = pagos.find(p => p.Id_Cita === cita.Id_Cita || p.id_cita === cita.Id_Cita);
        if (pago) {
          this.citaSeleccionada.pago = pago;
        }
        
        // Buscar reembolso para esta cita
        const reemb = reembolsos.find(r => r.Id_Cita === cita.Id_Cita || r.id_cita === cita.Id_Cita);
        if (reemb) {
          const monto = reemb.Monto_Reembolso || reemb.monto || reemb.Monto || 0;
          const detalle = reemb.Detalle_Reembolso || reemb.detalle_reembolso || '';
          
          // Parsear el detalle para extraer información
          let motivo = 'Reembolso registrado';
          let montoCalculado = monto;
          
          if (detalle && typeof detalle === 'string') {
            // Intenta extraer el monto del formato: "Reembolso: $700.00 (100%) - Motivo: doctor"
            const montoMatch = detalle.match(/\$[\d,]+\.?\d*/);
            if (montoMatch) {
              montoCalculado = parseFloat(montoMatch[0].replace(/[\$,]/g, '')) || monto;
            }
            
            // Extrae el motivo después de "Motivo:"
            const motivoMatch = detalle.match(/Motivo:\s*(.+?)$/i);
            if (motivoMatch) {
              motivo = motivoMatch[1].trim();
            } else {
              motivo = detalle;
            }
          }
          
          this.citaSeleccionada.reembolso = {
            monto: montoCalculado,
            detalle: motivo
          };
        }
      });
      
      this.mostrarInfoCita = true;
    },
    
    cerrarInfoCita() {
      this.mostrarInfoCita = false;
      this.citaSeleccionada = null;
    },
    
    estaPagada(cita) {
      const estatus = cita.Estatus || String(cita.Id_Estatus || '');
      return estatus === '2' || estatus.includes('Pagada') || estatus.includes('Atendida');
    },
    
    formatearCosto(costo) {
      if (!costo) return '0.00';
      return parseFloat(costo).toFixed(2);
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
}

/* Modal Info Styles */
.modal-overlay-info {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 1rem;
}

.modal-info {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
  position: relative;
}

.btn-close-info {
  position: absolute;
  top: 15px;
  right: 15px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6c757d;
  z-index: 10;
}

.btn-close-info:hover {
  color: #000;
}

.modal-header-info {
  background: #0d6efd;
  color: white;
  padding: 1.5rem;
  border-radius: 8px 8px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.modal-header-info h5 {
  margin: 0;
  font-weight: 600;
  font-size: 1.25rem;
}

.modal-header-info .badge {
  margin-top: 0.25rem;
}

.modal-body-info {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1.25rem;
  background: #f8f9fa;
}

.info-card.alert {
  background: #d1e7dd;
  border-color: #badbcc;
}

.info-card-title {
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: #212529;
  border-bottom: 2px solid #dee2e6;
  padding-bottom: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-list {
  margin: 0;
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 0.75rem 1rem;
}

.info-list dt {
  font-weight: 600;
  color: #6c757d;
  font-size: 0.9rem;
}

.info-list dd {
  margin: 0;
  color: #212529;
  font-size: 0.9rem;
}

.politica-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.politica-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 4px;
  border-left: 3px solid #dee2e6;
}

.modal-footer-info {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.text-success {
  color: #28a745 !important;
}

.form-card {
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
