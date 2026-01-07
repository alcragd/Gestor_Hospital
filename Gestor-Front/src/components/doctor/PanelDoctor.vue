<template>
  <div class="panel-doctor">
    <!-- Modal Generar Receta -->
    <div v-if="mostrarReceta" class="modal-backdrop">
      <div class="modal-content-custom">
        <button class="btn-close-modal" @click="mostrarReceta = false">✕</button>
        <GenerarReceta 
          :cita="citaSeleccionada"
          :citasDisponibles="citas"
          :especialidad="especialidad"
          @cerrar="mostrarReceta = false"
          @receta-creada="onRecetaCreada"
        />
      </div>
    </div>

    <!-- Modal Historial Médico -->
    <div v-if="mostrarHistorial" class="modal-backdrop">
      <div class="modal-content-custom">
        <button class="btn-close-modal" @click="mostrarHistorial = false">✕</button>
        <HistorialMedico 
          :pacienteId="pacienteSeleccionado?.Id_Paciente"
          :pacienteData="pacienteSeleccionado"
          @cerrar="mostrarHistorial = false"
        />
      </div>
    </div>

    <div class="card shadow-sm">
      <div class="card-header bg-primary text-white">
        <div class="d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Panel de Doctor</h5>
            <small>{{ nombreCompleto }} — {{ especialidad }}</small>
          </div>
          <button class="btn btn-sm btn-outline-light" @click="logout">Cerrar sesión</button>
        </div>
      </div>

      <div class="card-body">
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
          <p class="mb-0">No hay citas asignadas para este período.</p>
        </div>
        <div v-else class="table-responsive">
          <table class="table table-hover table-sm">
            <thead class="table-light">
              <tr>
                <th>Folio</th>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Paciente</th>
                <th>Consultorio</th>
                <th>Estatus</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in citas" :key="c.Id_Cita">
                <td><strong>{{ c.Id_Cita }}</strong></td>
                <td>{{ c.Fecha_cita_fmt || c.Fecha_cita }}</td>
                <td><span class="badge bg-secondary">{{ c.Hora_Inicio_fmt }} - {{ c.Hora_Fin_fmt }}</span></td>
                <td>{{ c.Paciente }}</td>
                <td>
                  <span v-if="c.Consultorio">
                    {{ c.Consultorio }}<br>
                    <small class="text-muted">{{ c.Ubicacion_Consultorio }}</small>
                  </span>
                  <span v-else class="text-muted">—</span>
                </td>
                <td>
                  <span class="badge" :class="getEstatusBadge(c.Estatus)">{{ c.Estatus }}</span>
                </td>
                <td>
                  <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-success" 
                            v-if="puedeMarcarAtendida(c)" 
                            @click="marcarAtendida(c)"
                            title="Marcar esta cita como atendida (después de la hora programada)">
                      ✓ Atendida
                    </button>
                    <button class="btn btn-sm btn-info"
                            v-if="puedeMarcarAtendida(c)"
                            @click="abrirReceta(c)"
                            title="Generar receta para este paciente (después de la hora programada)">
                      💊 Receta
                    </button>
                    <button class="btn btn-sm btn-outline-info"
                            @click="abrirHistorial(c)"
                            title="Ver historial médico del paciente">
                      📋 Historial
                    </button>
                  </div>
                  <span v-if="!puedeMarcarAtendida(c)" class="text-muted small">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CitaService from '../../services/CitaService';
import GenerarReceta from './GenerarReceta.vue';
import HistorialMedico from './HistorialMedico.vue';

export default {
  name: 'PanelDoctor',
  components: {
    GenerarReceta,
    HistorialMedico
  },
  data(){
    return {
      nombreCompleto: `${localStorage.getItem('nombre')||''} ${localStorage.getItem('paterno')||''}`.trim(),
      especialidad: localStorage.getItem('especialidad') || '',
      filtros: { fecha_inicio: '', fecha_fin: '' },
      citas: [],
      mensaje: '',
      isError: false,
      mostrarReceta: false,
      mostrarHistorial: false,
      citaSeleccionada: null,
      pacienteSeleccionado: null
    }
  },
  mounted(){
    const role = parseInt(localStorage.getItem('userRole'),10);
    if (role !== 1) { window.location.href = '/login.html'; return; }
    this.cargarMisCitas();
  },
  methods:{
    async cargarMisCitas(){
      this.mensaje=''; this.isError=false;
      try{
        const res = await CitaService.misCitasDoctor(this.filtros);
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
      const e = (estatus||'').toLowerCase();
      if (e.includes('pagada')) return 'bg-warning text-dark';
      if (e.includes('atendida')) return 'bg-success';
      if (e.includes('cancelada')) return 'bg-danger';
      if (e.includes('pendiente')) return 'bg-info';
      return 'bg-secondary';
    },
    puedeMarcarAtendida(c){
      const e = (c.Estatus||'').toLowerCase();
      return e.includes('pagada') && e.includes('pendiente');
    },
    async marcarAtendida(c){
      this.mensaje=''; this.isError=false;
      try{
        await CitaService.atenderCita(c.Id_Cita);
        this.mensaje = `Cita ${c.Id_Cita} marcada como atendida.`;
        await this.cargarMisCitas();
      }catch(e){
        this.mensaje = e.message; this.isError=true;
      }
    },
    abrirReceta(cita){
      this.citaSeleccionada = cita;
      this.mostrarReceta = true;
    },
    abrirHistorial(cita){
      console.log('📋 Abriendo historial para cita:', cita);
      console.log('Campos disponibles en cita:', Object.keys(cita));
      
      const idPaciente = cita.ID_Paciente || cita.Id_Paciente;
      
      // Establecer datos básicos primero
      this.pacienteSeleccionado = {
        Id_Paciente: idPaciente,
        Nombre: cita.Paciente
      };
      console.log('🎯 pacienteSeleccionado establecido:', this.pacienteSeleccionado);
      this.mostrarHistorial = true;
      // Los datos completos se obtendrán si es necesario, pero el historial funciona con datos básicos
    },
    onRecetaCreada(data){
      this.mensaje = `✓ Receta creada exitosamente`;
      this.mostrarReceta = false;
      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    },
    logout(){
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
}
</script>

<style scoped>
.panel-doctor{ 
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
.table-responsive {
  border-radius: 4px;
}
.badge {
  font-size: 0.85rem;
  padding: 0.35em 0.65em;
}

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content-custom {
  background: white;
  border-radius: 8px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

.btn-close-modal {
  position: sticky;
  top: 0;
  right: 0;
  z-index: 10;
  float: right;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  margin: 0.5rem;
  cursor: pointer;
  font-size: 1.2rem;
  font-weight: bold;
  color: #666;
  transition: all 0.2s;
}

.btn-close-modal:hover {
  background: #e9ecef;
  color: #000;
}

.btn-group {
  display: flex;
  gap: 0.25rem;
}

.btn-group .btn {
  flex: 1;
  min-width: 60px;
  font-size: 0.8rem;
  padding: 0.35rem 0.5rem;
  white-space: nowrap;
}
</style>
