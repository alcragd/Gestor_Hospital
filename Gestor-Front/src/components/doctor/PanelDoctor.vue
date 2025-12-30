<template>
  <div class="panel-doctor">
    <div class="header">
      <h5>Panel de Doctor</h5>
      <div class="usuario">
        <span>{{ nombreCompleto }} — {{ especialidad }}</span>
        <button class="btn btn-sm btn-outline-danger" @click="logout">Cerrar sesión</button>
      </div>
    </div>

    <div class="filtros">
      <label>Desde <input type="date" v-model="filtros.fecha_inicio"></label>
      <label>Hasta <input type="date" v-model="filtros.fecha_fin"></label>
      <button class="btn btn-sm btn-primary" @click="cargarMisCitas">Actualizar</button>
    </div>

    <div v-if="mensaje" class="alert" :class="isError? 'alert-danger':'alert-info'">{{ mensaje }}</div>

    <div v-if="citas.length===0" class="empty">No hay citas asignadas.</div>
    <table v-else class="table table-sm">
      <thead>
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
          <td>{{ c.Id_Cita }}</td>
          <td>{{ c.Fecha_cita }}</td>
          <td>{{ (c.Hora_Inicio||'').slice(0,5) }} - {{ (c.Hora_Fin||'').slice(0,5) }}</td>
          <td>{{ c.Paciente }}</td>
          <td>{{ c.Consultorio }} ({{ c.Ubicacion_Consultorio }})</td>
          <td>{{ c.Estatus }}</td>
          <td>
            <button class="btn btn-sm btn-success" 
                    v-if="puedeMarcarAtendida(c)" 
                    @click="marcarAtendida(c)"
            >Marcar atendida</button>
          </td>
        </tr>
      </tbody>
    </table>

    <div class="nota">
      Nota: Generar receta y marcar atención no tienen endpoints expuestos; se muestran datos informativos.
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
        this.citas = Array.isArray(res?.citas) ? res.citas : [];
        if (this.citas.length===0) this.mensaje='Sin citas para los filtros aplicados.';
      }catch(e){
        this.mensaje = e.message; this.isError=true;
      }
    },
    puedeMarcarAtendida(c){
      const e = (c.Estatus||'').toLowerCase();
      return e.includes('pagada');
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
.panel-doctor{ padding:16px; }
.header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.usuario{ display:flex; gap:8px; align-items:center; }
.filtros{ display:flex; gap:8px; align-items:center; margin:8px 0; }
.empty{ padding:12px; color:#666; }
.nota{ margin-top:12px; font-size:12px; color:#666; }
</style>
