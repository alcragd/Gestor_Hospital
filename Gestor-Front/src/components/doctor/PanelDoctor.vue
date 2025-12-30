<template>
  <div class="panel-doctor">
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
                  <button class="btn btn-sm btn-success" 
                          v-if="puedeMarcarAtendida(c)" 
                          @click="marcarAtendida(c)"
                  >Marcar atendida</button>
                  <span v-else class="text-muted small">—</span>
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

export default {
  name: 'PanelDoctor',
  data(){
    return {
      nombreCompleto: `${localStorage.getItem('nombre')||''} ${localStorage.getItem('paterno')||''}`.trim(),
      especialidad: localStorage.getItem('especialidad') || '',
      filtros: { fecha_inicio: '', fecha_fin: '' },
      citas: [],
      mensaje: '',
      isError: false
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
</style>
