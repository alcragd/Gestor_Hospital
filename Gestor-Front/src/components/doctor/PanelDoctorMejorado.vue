<template>
  <div class="panel-doctor">
    <!-- Modales -->
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
            <small>{{ datosDoctor.nombreCompleto }} — {{ datosDoctor.especialidad }}</small>
          </div>
          <button class="btn btn-sm btn-outline-light" @click="logout">Cerrar sesión</button>
        </div>
      </div>

      <!-- Navegación de tabs -->
      <div class="card-header bg-light border-bottom-0">
        <ul class="nav nav-tabs card-header-tabs">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'citas' }" @click="tab = 'citas'" href="#">
              📅 Mis Citas
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'recetas' }" @click="tab = 'recetas'" href="#">
              💊 Mis Recetas
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" :class="{ active: tab === 'datos' }" @click="tab = 'datos'" href="#">
              👤 Mis Datos
            </a>
          </li>
        </ul>
      </div>

      <div class="card-body">
        <!-- TAB: CITAS -->
        <div v-if="tab === 'citas'">
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

          <div v-if="mensaje" class="alert" :class="isError ? 'alert-danger' : 'alert-info'">{{ mensaje }}</div>

          <div v-if="citas.length === 0" class="text-center text-muted py-4">
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
                  <td>{{ c.Fecha_cita_fmt }}</td>
                  <td><span class="badge bg-secondary">{{ c.Hora_Inicio_fmt }} - {{ c.Hora_Fin_fmt }}</span></td>
                  <td>{{ c.Paciente }}</td>
                  <td>
                    <span v-if="c.Consultorio">
                      {{ c.Consultorio }}<br>
                      <small class="text-muted">{{ c.Ubicacion_Consultorio }}</small>
                    </span>
                    <span v-else class="text-muted">—</span>
                  </td>
                  <td><span class="badge" :class="getEstatusBadge(c.Estatus)">{{ c.Estatus }}</span></td>
                  <td>
                    <div class="btn-group" role="group">
                      <button class="btn btn-sm btn-success" 
                              v-if="puedeMarcarAtendida(c)" 
                              @click="marcarAtendida(c)"
                              title="Marcar como atendida">
                        ✓
                      </button>
                      <button class="btn btn-sm btn-warning" 
                              v-if="puedeMarcarNoAsistio(c)" 
                              @click="marcarNoAsistio(c)"
                              title="Marcar como No Acudió">
                        ⊗
                      </button>
                      <button class="btn btn-sm btn-info"
                              v-if="puedeMarcarAtendida(c)"
                              @click="abrirReceta(c)"
                              :disabled="!puedeCrearReceta(c)"
                              :title="puedeCrearReceta(c) ? 'Generar receta' : 'Solo el día de la cita'">
                        💊
                      </button>
                      <button class="btn btn-sm btn-outline-info"
                              @click="abrirHistorial(c)"
                              title="Ver historial médico">
                        📋
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- TAB: RECETAS -->
        <div v-if="tab === 'recetas'">
          <div class="mb-3">
            <button class="btn btn-sm btn-primary" @click="cargarMisRecetas">
              🔄 Actualizar Recetas
            </button>
          </div>

          <div v-if="cargandoRecetas" class="text-center py-4">
            <div class="spinner-border text-primary"></div>
          </div>

          <div v-else-if="recetas.length === 0" class="text-center text-muted py-4">
            <p>No hay recetas registradas</p>
          </div>

          <div v-else class="row g-3">
            <div v-for="receta in recetas" :key="receta.Id_Receta" class="col-md-6">
              <div class="card border">
                <div class="card-header bg-light d-flex justify-content-between align-items-center">
                  <strong>Folio: {{ receta.Id_Receta }}</strong>
                  <span class="badge bg-primary">{{ formatDate(receta.Fecha_Emision) }}</span>
                </div>
                <div class="card-body">
                  <p class="mb-2"><strong>Paciente:</strong> {{ receta.Paciente }}</p>
                  <p class="mb-2"><strong>Edad:</strong> {{ receta.Edad }} años</p>
                  <p class="mb-2"><strong>Diagnóstico:</strong> {{ receta.Diagnostico || '-' }}</p>
                  <hr>
                  <div class="mb-2">
                    <strong>Medicamentos:</strong>
                    <ul class="small mb-0">
                      <li v-for="(med, i) in parseMedicamentos(receta.Medicamentos)" :key="i">
                        {{ med }}
                      </li>
                    </ul>
                  </div>
                  <div class="mb-2">
                    <strong>Tratamientos:</strong>
                    <ul class="small mb-0">
                      <li v-for="(trat, i) in parseTratamientos(receta.Tratamientos)" :key="i">
                        {{ trat }}
                      </li>
                    </ul>
                  </div>
                  <div v-if="receta.Observaciones" class="mt-2">
                    <strong>Observaciones:</strong>
                    <p class="small mb-0">{{ receta.Observaciones }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB: DATOS DEL DOCTOR -->
        <div v-if="tab === 'datos'">
          <div class="row">
            <div class="col-md-6">
              <div class="card border mb-3">
                <div class="card-header bg-light">
                  <strong>Información Personal</strong>
                </div>
                <div class="card-body">
                  <p><strong>Nombre Completo:</strong> {{ datosDoctor.nombreCompleto }}</p>
                  <p><strong>Especialidad:</strong> {{ datosDoctor.especialidad }}</p>
                  <p><strong>Cédula Profesional:</strong> {{ datosDoctor.cedula }}</p>
                  <p><strong>RFC:</strong> {{ datosDoctor.rfc }}</p>
                  <p><strong>CURP:</strong> {{ datosDoctor.curp }}</p>
                  <p><strong>Correo:</strong> {{ datosDoctor.correo }}</p>
                  <p><strong>Teléfono:</strong> {{ datosDoctor.telefono }}</p>
                  <small class="text-muted">
                    ⚠️ Datos sensibles (Cédula, RFC, CURP, Nombre, Especialidad) solo pueden ser editados por recepción.
                  </small>
                </div>
              </div>
            </div>

            <div class="col-md-6">
              <div class="card border mb-3">
                <div class="card-header bg-light">
                  <strong>Horario de Trabajo</strong>
                </div>
                <div class="card-body">
                  <div v-if="horario.length > 0">
                    <table class="table table-sm">
                      <thead>
                        <tr>
                          <th>Día</th>
                          <th>Entrada</th>
                          <th>Salida</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="h in horario" :key="h.Dia">
                          <td>{{ h.Dia }}</td>
                          <td>{{ formatTime(h.Hora_Inicio) }}</td>
                          <td>{{ formatTime(h.Hora_Fin) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p v-else class="text-muted">No hay horarios registrados</p>
                </div>
              </div>

              <div class="card border">
                <div class="card-header bg-light">
                  <strong>Datos Editables</strong>
                </div>
                <div class="card-body">
                  <form @submit.prevent="actualizarDatos">
                    <div class="mb-3">
                      <label class="form-label">Correo</label>
                      <input type="email" class="form-control" v-model="form.correo">
                    </div>
                    <div class="mb-3">
                      <label class="form-label">Teléfono</label>
                      <input type="text" class="form-control" v-model="form.telefono">
                    </div>
                    <button type="submit" class="btn btn-primary" :disabled="guardando">
                      {{ guardando ? 'Guardando...' : 'Actualizar' }}
                    </button>
                  </form>
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
import CitaService from '../../services/CitaService';
import GenerarReceta from './GenerarReceta.vue';
import HistorialMedico from './HistorialMedico.vue';
import axios from 'axios';

export default {
  name: 'PanelDoctor',
  components: { GenerarReceta, HistorialMedico },
  data() {
    return {
      tab: 'citas',
      datosDoctor: {
        nombreCompleto: '',
        especialidad: '',
        cedula: '',
        rfc: '',
        curp: '',
        correo: '',
        telefono: ''
      },
      filtros: { fecha_inicio: '', fecha_fin: '' },
      citas: [],
      recetas: [],
      horario: [],
      form: {
        correo: '',
        telefono: ''
      },
      mensaje: '',
      isError: false,
      mostrarReceta: false,
      mostrarHistorial: false,
      citaSeleccionada: null,
      pacienteSeleccionado: null,
      cargandoRecetas: false,
      guardando: false
    };
  },
  mounted() {
    const role = parseInt(localStorage.getItem('userRole'), 10);
    if (role !== 1) { 
      window.location.href = '/login.html'; 
      return; 
    }
    this.cargarDatosDoctor();
    this.cargarMisCitas();
  },
  computed: {
    especialidad() {
      return this.datosDoctor.especialidad;
    }
  },
  methods: {
    async cargarDatosDoctor() {
      try {
        const response = await axios.get('http://localhost:3000/api/doctores/me', {
          headers: {
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          }
        });
        
        const data = response.data.doctor;
        this.datosDoctor = {
          nombreCompleto: `${data.Nombre} ${data.Paterno} ${data.Materno || ''}`.trim(),
          especialidad: data.Especialidad,
          cedula: data.Cedula,
          rfc: data.Rfc,
          curp: data.CURP,
          correo: data.Correo,
          telefono: data.Telefono_cel
        };
        
        this.form.correo = data.Correo;
        this.form.telefono = data.Telefono_cel;
        
        this.horario = response.data.horario || [];
      } catch (error) {
        console.error('Error al cargar datos del doctor:', error);
      }
    },
    
    async cargarMisCitas() {
      this.mensaje = '';
      this.isError = false;
      try {
        const res = await CitaService.misCitasDoctor(this.filtros);
        const raw = Array.isArray(res?.citas) ? res.citas : [];
        this.citas = raw.map(c => ({
          ...c,
          Fecha_cita_fmt: this.formatDate(c.Fecha_cita || c.fecha_cita),
          Hora_Inicio_fmt: this.formatTime(c.Hora_Inicio),
          Hora_Fin_fmt: this.formatTime(c.Hora_Fin)
        }));
        if (this.citas.length === 0) this.mensaje = 'Sin citas para los filtros aplicados.';
      } catch (e) {
        this.mensaje = e.message;
        this.isError = true;
      }
    },
    
    async cargarMisRecetas() {
      this.cargandoRecetas = true;
      try {
        const response = await axios.get('http://localhost:3000/api/doctores/recetas', {
          headers: {
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          }
        });
        this.recetas = response.data.recetas || [];
      } catch (error) {
        console.error('Error al cargar recetas:', error);
        this.mensaje = 'Error al cargar recetas';
        this.isError = true;
      } finally {
        this.cargandoRecetas = false;
      }
    },
    
    async actualizarDatos() {
      this.guardando = true;
      this.mensaje = '';
      this.isError = false;
      
      try {
        await axios.put('http://localhost:3000/api/doctores/me', this.form, {
          headers: {
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          }
        });
        
        this.mensaje = '✓ Datos actualizados correctamente';
        await this.cargarDatosDoctor();
        
        setTimeout(() => {
          this.mensaje = '';
        }, 3000);
      } catch (error) {
        this.mensaje = error.response?.data?.message || 'Error al actualizar datos';
        this.isError = true;
      } finally {
        this.guardando = false;
      }
    },
    
    formatDate(val) {
      if (!val) return '';
      if (typeof val === 'string' && val.includes('T')) return val.slice(0, 10);
      if (typeof val === 'string' && val.length >= 10) return val.slice(0, 10);
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    },
    
    formatTime(val) {
      if (!val) return '';
      if (typeof val === 'string' && val.includes('T')) {
        const [, time] = val.split('T');
        return time ? time.slice(0, 5) : '';
      }
      if (typeof val === 'string' && val.length >= 5) return val.slice(0, 5);
      const d = new Date(val);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(11, 16);
    },
    
    getEstatusBadge(estatus) {
      const e = (estatus || '').toLowerCase();
      if (e.includes('pagada')) return 'bg-warning text-dark';
      if (e.includes('atendida')) return 'bg-success';
      if (e.includes('cancelada')) return 'bg-danger';
      if (e.includes('pendiente')) return 'bg-info';
      return 'bg-secondary';
    },
    
    puedeMarcarAtendida(c) {
      const e = (c.Estatus || '').toLowerCase();
      return e.includes('pagada') && e.includes('pendiente');
    },
    
    puedeMarcarNoAsistio(c) {
      const e = (c.Estatus || '').toLowerCase();
      if (!e.includes('pagada') || !e.includes('pendiente')) return false;
      
      try {
        const ahora = new Date();
        const fechaCita = new Date(c.Fecha_cita);
        const horaFin = c.Hora_Fin_fmt || c.Hora_Fin || '';
        
        if (!horaFin) return false;
        
        const [horas, minutos] = horaFin.split(':').map(Number);
        const fechaHoraFin = new Date(fechaCita);
        fechaHoraFin.setHours(horas, minutos, 0, 0);
        
        const diferenciaHoras = (ahora - fechaHoraFin) / (1000 * 60 * 60);
        
        return diferenciaHoras >= 1;
      } catch (error) {
        return false;
      }
    },
    
    puedeCrearReceta(c) {
      if (!c.Fecha_cita) return false;
      
      try {
        const ahora = new Date();
        const fechaCita = new Date(c.Fecha_cita);
        
        const hoyFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
        const citaFecha = new Date(fechaCita.getFullYear(), fechaCita.getMonth(), fechaCita.getDate());
        
        return hoyFecha >= citaFecha;
      } catch (error) {
        return false;
      }
    },
    
    async marcarAtendida(c) {
      this.mensaje = '';
      this.isError = false;
      try {
        await CitaService.atenderCita(c.Id_Cita);
        this.mensaje = `Cita ${c.Id_Cita} marcada como atendida.`;
        await this.cargarMisCitas();
      } catch (e) {
        this.mensaje = e.message;
        this.isError = true;
      }
    },
    
    async marcarNoAsistio(c) {
      const confirmar = confirm(
        `¿Confirmar que el paciente ${c.Paciente} NO ACUDIÓ a la cita del ${c.Fecha_cita_fmt}?\n\n` +
        `Esta acción no se puede deshacer.`
      );
      
      if (!confirmar) return;
      
      this.mensaje = '';
      this.isError = false;
      try {
        await CitaService.marcarNoAsistio(c.Id_Cita);
        this.mensaje = `Cita ${c.Id_Cita} marcada como "No Acudió".`;
        await this.cargarMisCitas();
      } catch (e) {
        this.mensaje = e.message || 'Error al marcar no-asistencia';
        this.isError = true;
      }
    },
    
    abrirReceta(cita) {
      this.citaSeleccionada = cita;
      this.mostrarReceta = true;
    },
    
    abrirHistorial(cita) {
      this.pacienteSeleccionado = {
        Id_Paciente: cita.ID_Paciente || cita.Id_Paciente,
        Nombre: cita.Paciente
      };
      this.mostrarHistorial = true;
    },
    
    onRecetaCreada() {
      this.mensaje = '✓ Receta creada exitosamente';
      this.mostrarReceta = false;
      this.cargarMisRecetas();
      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    },
    
    parseMedicamentos(medicamentos) {
      if (!medicamentos) return [];
      return medicamentos.split('\n').filter(m => m.trim());
    },
    
    parseTratamientos(tratamientos) {
      if (!tratamientos) return [];
      return tratamientos.split('\n').filter(t => t.trim());
    },
    
    logout() {
      localStorage.clear();
      window.location.href = '/login.html';
    }
  }
};
</script>

<style scoped>
.panel-doctor {
  padding: 1.5rem;
  min-height: 100vh;
  background: #f5f5f5;
  min-width: 980px;
}

@media (max-width: 980px) {
  .panel-doctor {
    min-width: auto;
  }
}

.card {
  border-radius: 8px;
  border: none;
}

.card-header {
  border-radius: 8px 8px 0 0 !important;
  padding: 1rem 1.25rem;
}

.nav-tabs {
  border-bottom: none;
}

.nav-link {
  cursor: pointer;
  color: #495057;
}

.nav-link.active {
  background-color: #fff !important;
  border-color: #dee2e6 #dee2e6 #fff !important;
  color: #0d6efd !important;
  font-weight: 500;
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
  min-width: 50px;
  font-size: 0.8rem;
  padding: 0.35rem 0.5rem;
}
</style>
