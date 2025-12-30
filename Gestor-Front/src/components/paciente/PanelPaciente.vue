<template>
  <div class="panel-paciente">
    <div class="header">
      <h5>Panel de Paciente</h5>
      <div class="usuario">
        <span>{{ nombreCompleto }}</span>
        <button class="btn btn-sm btn-outline-danger" @click="logout">Cerrar sesión</button>
      </div>
    </div>

    <div class="tabs">
      <button :class="{active: tab==='agendar'}" @click="tab='agendar'">Agendar Cita</button>
      <button :class="{active: tab==='mis'}" @click="tab='mis'">Mis Citas</button>
    </div>

    <div v-if="tab==='agendar'" class="tab-pane">
      <FormularioCita @cita-creada="onCitaCreada" />
    </div>

    <div v-else class="tab-pane">
      <div class="filtros">
        <label>Desde <input type="date" v-model="filtros.fecha_inicio"></label>
        <label>Hasta <input type="date" v-model="filtros.fecha_fin"></label>
        <button class="btn btn-sm btn-primary" @click="cargarMisCitas">Actualizar</button>
      </div>

      <div v-if="mensaje" class="alert" :class="isError? 'alert-danger':'alert-info'">{{ mensaje }}</div>

      <div v-if="citas.length===0" class="empty">No hay citas.</div>
      <table v-else class="table table-sm">
        <thead>
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
            <td>{{ c.Id_Cita || c.folio }}</td>
            <td>{{ c.Fecha_cita_fmt || c.Fecha_cita || c.fecha_cita }}</td>
            <td>{{ c.Hora_Inicio_fmt }} - {{ c.Hora_Fin_fmt }}</td>
            <td>{{ c.Doctor }}</td>
            <td>{{ c.Especialidad }}</td>
            <td>{{ c.Estatus || c.Id_Estatus }}</td>
            <td>
              <button class="btn btn-sm btn-outline-danger" @click="confirmarCancelar(c)" :disabled="!puedeCancelar(c)">Cancelar</button>
              <button class="btn btn-sm btn-success ms-1" @click="confirmarPagar(c)" :disabled="!puedePagar(c)">Pagar</button>
            </td>
          </tr>
        </tbody>
      </table>
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
.panel-paciente{ padding:16px; }
.header{ display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.usuario{ display:flex; gap:8px; align-items:center; }
.tabs{ display:flex; gap:8px; margin-bottom:12px; }
.tabs button{ border:none; padding:8px 12px; background:#f0f0f0; cursor:pointer; }
.tabs button.active{ background:#0d6efd; color:#fff; }
.tab-pane{ background:#fff; padding:12px; border-radius:6px; }
.filtros{ display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.empty{ padding:12px; color:#666; }
</style>
