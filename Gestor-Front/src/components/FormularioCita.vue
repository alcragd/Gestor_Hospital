<template>
  <!-- PANEL DESLIZABLE ALAN   -->
<div class="sidebar" :class="{ open: sidebarOpen }">
  <div class="sidebar-header">
    <h4 class="text-center">_Mi Perfil</h4>
<button class="btn btn-sm btn-danger" @click="logout">Cerrar Sesión</button>
  </div>

  <hr>

  <div class="sidebar-section">
    <h6>Datos Personales</h6>
    <p><strong>Nombre:</strong> {{ user.nombre || 'No disponible' }}</p>
    <p><strong>Correo:</strong> {{ user.correo || 'No disponible' }}</p>
    <p><strong>Teléfono:</strong> {{ user.telefono || 'No disponible' }}</p>
  </div>

  <hr>

  <div class="sidebar-section">
    <h6>Mis Citas</h6>

    <p v-if="citas.length === 0" class="text-muted small">No tienes citas agendadas.</p>

    <ul v-else class="list-unstyled">
      <li v-for="c in citas" :key="c.Folio_Cita" class="mb-3 pb-2 border-bottom">
        <!-- Fecha -->
        <div>
          <strong v-if="c.Fecha_Cita">{{ c.Fecha_Cita }}</strong>
          <span v-else class="text-muted">Sin fecha</span>
        </div>
        
        <!-- Hora -->
        <div v-if="c.Hora_Inicio" class="text-muted small">
          {{ c.Hora_Inicio }}<span v-if="c.Hora_Fin"> - {{ c.Hora_Fin }}</span>
        </div>
        
        <!-- Doctor -->
        <div class="text-muted small">
          Dr. {{ c.Nombre_Doctor || 'No asignado' }}
        </div>
        
        <!-- Especialidad -->
        <div class="text-primary small fw-semibold">
          {{ c.Especialidad || 'Sin especialidad' }}
        </div>
      </li>
    </ul>
  </div>

</div>

<!-- BOTÓN PARA ABRIR EL PANEL -->
<button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
  ☰
</button>

  <div class="form-wrapper">
    <div class="card shadow-sm form-card">
      <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Agendar Cita</h5>
        <small class="text-light">Seleccione paso a paso</small>
      </div>

      <div class="card-body">
        <!-- Mensaje -->
        <div v-if="mensaje" class="mb-3">
          <div :class="['alert', isSuccess ? 'alert-success' : 'alert-danger']" role="alert">
            {{ mensaje }}
          </div>
        </div>

        <div class="row gx-4 gy-3">
          <!-- Selecciones (izquierda) -->
          <div class="col-12 col-md-6">
            <div class="mb-3">
              <label for="especialidad" class="form-label fw-semibold">1. Especialidad</label>
              <select id="especialidad" class="form-select" v-model="selected.especialidadId" @change="especialidadSeleccionada" required>
                <option :value="null" disabled>Seleccione una especialidad</option>
                <option v-for="esp in especialidades" :key="esp.Id_Especialidad" :value="esp.Id_Especialidad">
                  {{ esp.Nombre }}
                </option>
              </select>
              <div class="form-text">Elija la especialidad para filtrar doctores.</div>
            </div>

            <div class="mb-3">
              <label for="doctor" class="form-label fw-semibold">2. Doctor</label>
              <select id="doctor" class="form-select" v-model="selected.doctorId" @change="actualizarDisponibilidad" :disabled="doctores.length === 0" required>
                <option :value="null" disabled>Seleccione un doctor</option>
                <option v-for="doc in doctores" :key="doc.Id_Doctor" :value="doc.Id_Doctor">
                  {{ doc.NombreCompleto }}
                </option>
              </select>
              <div class="form-text">
                <span v-if="doctores.length === 0" class="text-muted">No hay doctores disponibles para esta especialidad.</span>
              </div>
            </div>

            <div class="mb-3">
              <label for="fechaCita" class="form-label fw-semibold">3. Fecha</label>
              <input id="fechaCita" type="date" class="form-control" v-model="selected.fecha" @change="actualizarDisponibilidad" required>
              <div class="form-text">Seleccione la fecha deseada.</div>
            </div>
          </div>

          <!-- Disponibilidad y confirmación (derecha) -->
          <div class="col-12 col-md-6">
            <label class="form-label fw-semibold d-block mb-2">4. Horarios Disponibles</label>

            <div v-if="slotsDisponibles.length === 0" class="mb-3">
              <div class="border rounded p-3 text-center text-muted min-slot-area">
                <div v-if="!selected.doctorId || !selected.fecha">Seleccione doctor y fecha para ver horarios.</div>
                <div v-else>No hay horarios disponibles para la fecha seleccionada.</div>
              </div>
            </div>

            <div v-else class="mb-3">
              <div class="d-flex flex-wrap gap-2 slot-area">
                <button
                  v-for="(slot, index) in slotsDisponibles"
                  :key="index"
                  type="button"
                  class="btn btn-outline-primary btn-slot"
                  :class="{ 'active btn-primary text-white': cita.Hora_Inicio === slot.inicio }"
                  @click="seleccionarSlot(slot)" 
                >
                  {{ slot.inicio.substring(0,5) }} - {{ slot.fin.substring(0,5) }}
                </button>
              </div>
              <div class="form-text mt-2">Haga clic en un horario para seleccionarlo.</div>
            </div>

            <hr>

            <div v-if="hasSlotSelected" class="mt-2">
              <h6 class="mb-2 text-success">Cita Seleccionada</h6>
              <div class="card p-2 mb-3 selected-card">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <strong>Fecha:</strong> {{ cita.Fecha_Cita || selected.fecha }}
                  </div>
                  <div>
                    <strong>Hora:</strong> {{ cita.Hora_Inicio.substring(0,5) }} - {{ cita.Hora_Fin.substring(0,5) }}
                  </div>
                </div>
                <div class="mt-2 text-muted small">
                  Doctor ID: <span class="fw-semibold">{{ cita.Id_Doctor }}</span>
                </div>
              </div>

              <button
                class="btn btn-success w-100"
                @click.prevent="submitCita"
                :disabled="isLoading"
              >
                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {{ isLoading ? 'Confirmando...' : 'Confirmar Cita' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer text-muted small">
        <div class="d-flex justify-content-between">
          <div>Usuario: {{ currentUserName || cita.Usuario }}</div>
          <div>Paciente ID: {{ currentPatientId || cita.Id_Paciente || 'N/D' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import CitaService from '../services/CitaService';

export default {
  name: 'FormularioCita',
  data() {
    return {
      // Estado inicial del formulario
      cita: {
        Id_Doctor: null,
        Id_Paciente: null,
        Fecha_Cita: '',
        Hora_Inicio: '',
        Hora_Fin: '',
        Usuario: 'Web_Recepcion',
      },

      // Datos para la selección secuencial
      especialidades: [],
      doctores: [],
      slotsOcupados: [],
      slotsDisponibles: [],
      
      // Parámetros de selección
      selected: {
        especialidadId: null,
        doctorId: null,
        fecha: new Date().toISOString().slice(0, 10),
      },

      isLoading: false,
      mensaje: '',
      isSuccess: false,
      sidebarOpen: false,

      currentUserName: '',
      currentPatientId: '',

      user: {
        nombre: "",
        correo: "",
        telefono: ""
      },

      citas: []
    };
  },

  computed: {
    minDate() {
      const today = new Date();
      today.setDate(today.getDate() + 2); 
      return today.toISOString().slice(0, 10);
    },
    
    maxDate() {
      const today = new Date();
      today.setMonth(today.getMonth() + 3);
      return today.toISOString().slice(0, 10);
    },

    hasSlotSelected() {
      const horaRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      return !!this.cita.Id_Doctor &&
            !!this.cita.Fecha_Cita &&
            horaRegex.test(this.cita.Hora_Inicio) &&
            horaRegex.test(this.cita.Hora_Fin);
    }
  },

  mounted() {
    console.log("=== MOUNTED - FormularioCita ===");
    console.log("LocalStorage:", { ...localStorage });
    
    this.cargarEspecialidades();
    this.cargarUsuario();
    this.cargarCitas();
  },

  methods: {
    async cargarEspecialidades() {
      try {
        const data = await CitaService.getEspecialidades();
        console.log("Especialidades recibidas:", data);
        
        this.especialidades = Array.isArray(data)
          ? data
          : (data && (data.data || data.result)) || [];
      } catch (e) {
        this.mensaje = 'Error al cargar las especialidades.';
      }
    },
    
    async especialidadSeleccionada() {
      this.doctores = [];
      this.selected.doctorId = null;
      this.slotsDisponibles = [];
      this.cita.Hora_Inicio = '';
      this.cita.Hora_Fin = '';
      this.cita.Id_Doctor = null;
      
      if (this.selected.especialidadId) {
        try {
          this.doctores = await CitaService.getDoctores(this.selected.especialidadId);
        } catch (e) {
          this.mensaje = 'Error al cargar doctores.';
        }
      }
    },
    
    async actualizarDisponibilidad() {
      this.cita.Hora_Inicio = '';
      this.cita.Hora_Fin = '';
      this.slotsDisponibles = [];
      
      if (!this.selected.doctorId || !this.selected.fecha) return;

      try {
        this.slotsOcupados = await CitaService.getSlotsOcupados(
          this.selected.doctorId,
          this.selected.fecha
        );
        
        const rangosTrabajo = await CitaService.getHorarioTrabajo(
          this.selected.doctorId, 
          this.selected.fecha
        );
        
        if (rangosTrabajo.length === 0) {
          this.slotsDisponibles = [];
          this.mensaje = 'El doctor no trabaja en la fecha seleccionada.';
          return;
        }

        this.slotsDisponibles = this.calcularSlotsDisponibles(rangosTrabajo);
        this.mensaje = '';

      } catch (e) {
        this.mensaje = `Error al cargar la disponibilidad: ${e.message}`;
      }
    },
    
    calcularSlotsDisponibles(rangosTrabajo) {
      const slots = [];
      const duracionCitaMinutos = 30;
      
      for (const rango of rangosTrabajo) {
        let horaActual = new Date(`2000/01/01 ${rango.Hora_Inicio}`);
        const horaFinRango = new Date(`2000/01/01 ${rango.Hora_Fin}`);

        while (horaActual < horaFinRango) {
          const finSlot = new Date(horaActual.getTime() + duracionCitaMinutos * 60000);
          
          if (finSlot > horaFinRango) break;
          
          const formatTime = (date) => date.toTimeString().split(' ')[0];
          const horaInicioStr = formatTime(horaActual);
          
          const estaOcupado = this.slotsOcupados.some(ocupado => {
            return ocupado.Hora_Inicio === horaInicioStr;
          });

          if (!estaOcupado) {
            slots.push({ inicio: horaInicioStr, fin: formatTime(finSlot) });
          }

          horaActual = finSlot;
        }
      }
      return slots;
    },
    toMinutes(timeStr) {
      if (!timeStr || typeof timeStr !== 'string') return null;
      const parts = timeStr.split(':');
      if (parts.length < 2) return null;
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (Number.isNaN(h) || Number.isNaN(m)) return null;
      return h * 60 + m;
    },
    isCitaActiva(cita) {
      const est = cita.Id_Estatus || cita.Estatus;
      const activos = [1, 2, 'Agendada - Pendiente de Pago', 'Pagada - Pendiente por Atender', 'Programada', 'Pagada'];
      return activos.includes(est);
    },
    findOverlapWithOwnCitas(fecha, inicio, fin) {
      if (!fecha || !inicio || !fin) return null;
      const newStart = this.toMinutes(inicio);
      const newEnd = this.toMinutes(fin);
      if (newStart === null || newEnd === null) return null;

      for (const c of this.citas) {
        if (!c.Fecha_Cita || c.Fecha_Cita !== fecha) continue;
        if (!this.isCitaActiva(c)) continue;

        const start = this.toMinutes(c.Hora_Inicio || c.Hora_inicio);
        const end = this.toMinutes(c.Hora_Fin || c.Hora_fin);
        if (start === null || end === null) continue;

        const overlaps = newStart < end && newEnd > start;
        if (overlaps) {
          return {
            fecha: c.Fecha_Cita,
            inicio: (c.Hora_Inicio || '').substring(0,5),
            fin: (c.Hora_Fin || '').substring(0,5),
            doctor: c.Nombre_Doctor || c.Doctor || c.Id_Doctor
          };
        }
      }

      return null;
    },
    // Agrega este método en la sección de methods:
seleccionarSlot(slot) {
    console.log("seleccionarSlot ejecutado");
    console.log("  Slot:", slot);
    console.log("  selected.doctorId:", this.selected.doctorId);
    
    const userId = localStorage.getItem("userId");
    console.log("  userId desde localStorage:", userId);
    
    if (!userId) {
        console.error("No hay userId para agendar cita");
        this.mensaje = "Error: No estás autenticado";
        return;
    }
    
    // Convertir a número
    const pacienteId = parseInt(userId, 10);
    console.log("  pacienteId (convertido a número):", pacienteId);
    
    if (isNaN(pacienteId)) {
        console.error("userId no es un número válido:", userId);
        this.mensaje = "Error: ID de paciente inválido";
        return;
    }
    
    // Asignar datos a la cita
    this.cita.Id_Doctor = this.selected.doctorId;
    this.cita.Id_Paciente = pacienteId;
    this.cita.Fecha_Cita = this.selected.fecha;
    this.cita.Hora_Inicio = slot.inicio;
    this.cita.Hora_Fin = slot.fin;
    
    console.log("Cita configurada:");
    console.log("  - Doctor ID:", this.cita.Id_Doctor);
    console.log("  - Paciente ID:", this.cita.Id_Paciente);
    console.log("  - Fecha:", this.cita.Fecha_Cita);
    console.log("  - Hora Inicio:", this.cita.Hora_Inicio);
    console.log("  - Hora Fin:", this.cita.Hora_Fin);
    
    this.mensaje = `Horario ${slot.inicio.substring(0,5)} seleccionado. Presiona "Confirmar Cita".`;
},

    async submitCita() {
      this.mensaje = '';
      this.isLoading = true;
      this.isSuccess = false;

      const formatearHora = (hora) => {
        if (!hora) return '';
        if (typeof hora === 'string' && /^\d{2}:\d{2}/.test(hora)) {
          return hora.length === 5 ? `${hora}:00` : hora.substring(0, 8);
        }
        if (hora instanceof Date) {
          return hora.toLocaleTimeString('es-ES', { hour12: false }).substring(0, 8);
        }
        return hora;
      };

      const dataToSend = {
        Id_Doctor: this.cita.Id_Doctor,
        // Mantener fecha en formato YYYY-MM-DD sin alteraciones
        Fecha_Cita: this.cita.Fecha_Cita,
        Hora_Inicio: formatearHora(this.cita.Hora_Inicio),
        Hora_Fin: formatearHora(this.cita.Hora_Fin)
      };

      console.log('Datos a enviar (autenticado):', dataToSend);

      try {
        const conflicto = this.findOverlapWithOwnCitas(dataToSend.Fecha_Cita, dataToSend.Hora_Inicio, dataToSend.Hora_Fin);
        if (conflicto) {
          const confirma = window.confirm(`Ya tienes una cita el ${conflicto.fecha} de ${conflicto.inicio}-${conflicto.fin} con ${conflicto.doctor || 'otro doctor'}.\n¿Deseas agendar de todos modos?`);
          if (!confirma) {
            this.mensaje = 'No se agendó la cita porque hay cruce de horario con otra cita.';
            this.isLoading = false;
            return;
          }
        }

        const res = await CitaService.agendarCitaAutenticado(dataToSend);
        this.mensaje = res.message || 'Cita agendada exitosamente.';
        this.isSuccess = true;
        this.resetForm();
        await this.cargarCitas();
        this.$emit('cita-creada');
        if (res.recibo) {
          alert(`Recibo generado. Folio: ${res.recibo.folio}\nDoctor: ${res.recibo.doctor}\nEspecialidad: ${res.recibo.especialidad}\nCosto: $${res.recibo.costo}`);
        }

      } catch (error) {
        this.mensaje = `Fallo al agendar: ${error.message}`;
        this.isSuccess = false;
      } finally {
        this.isLoading = false;
      }
    },

    logout() {

    window.location.href = "/login.html";
  },
seleccionarSlot(slot) {
  const pacienteId = localStorage.getItem("userId");
  
  this.cita.Id_Doctor = this.selected.doctorId;
  this.cita.Id_Paciente = parseInt(pacienteId, 10); // Convertir a número
  this.cita.Fecha_Cita = this.selected.fecha;
  this.cita.Hora_Inicio = slot.inicio.substring(0, 8); 
  this.cita.Hora_Fin = slot.fin.substring(0, 8);       
  this.mensaje = `Slot ${slot.inicio} seleccionado. Presione Confirmar Cita.`;
},
    
    resetForm() {
      this.cita.Fecha_Cita = '';
      this.cita.Id_Doctor = null;
      this.cita.Hora_Inicio = '';
      this.cita.Hora_Fin = '';
      if (this.currentPatientId) {
        this.cita.Id_Paciente = parseInt(this.currentPatientId, 10);
      }
    },

// En FormularioCita.vue - MÉTODO cargarUsuario CORREGIDO
cargarUsuario() {
    console.log("EJECUTANDO cargarUsuario()");
    
    // OBTENER userId (este es el ID_Paciente desde login)
    const userId = localStorage.getItem("userId");
    const nombre = localStorage.getItem("nombre");
    const paterno = localStorage.getItem("paterno");
    const correo = localStorage.getItem("correo");
    const telefono = localStorage.getItem("telefono");

    console.log("Datos obtenidos de localStorage:");
    console.log("  - userId:", userId, "(tipo:", typeof userId, ")");
    console.log("  - nombre:", nombre);
    console.log("  - paterno:", paterno);
    
    // VERIFICACIÓN SIMPLIFICADA - SOLO userId
    if (!userId) {
        console.error("CRÍTICO: No se encontró 'userId' en localStorage");
        console.error("  localStorage contiene:");
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            console.error(`    ${key}: ${localStorage.getItem(key)}`);
        }
        
        // Mostrar mensaje en la UI
        this.mensaje = "Error: No estás autenticado. Serás redirigido al login...";
        this.isSuccess = false;
        
        // Redirigir después de 5 segundos (para debugging)
                    window.location.href = "/login.html";

        setTimeout(() => {
            console.log("Redirigiendo a login.html...");
            window.location.href = "/login.html";
        }, 5000);
        
        return;
    }
    
    console.log("Usuario autenticado correctamente");
    console.log("userId encontrado:", userId);

    this.currentPatientId = userId;
    this.currentUserName = localStorage.getItem('username') || 'Usuario';
    this.cita.Usuario = this.currentUserName;
    this.cita.Id_Paciente = parseInt(userId, 10);

    // Cargar datos del usuario para mostrar en sidebar
    this.user = { 
        nombre: `${nombre} ${paterno}`.trim() || "Usuario", 
        correo: correo || "Sin correo", 
        telefono: telefono || "Sin teléfono" 
    };
    
    console.log("Datos del sidebar cargados:", this.user);
},

    async cargarCitas() {
      try {
        const userId = localStorage.getItem("userId");
        
        // Validación
        if (!userId) {
          console.warn("No hay userId en localStorage");
          this.citas = [];
          return;
        }
        
        console.log("Cargando citas para paciente ID:", userId);
        
        const citasRaw = await CitaService.getCitasPaciente(userId);
        
        console.log("RAW CITAS:", citasRaw);
        if (citasRaw.length > 0) {
      console.log("PRIMERA CITA:", citasRaw[0]);
      console.log("ID_Paciente de primera cita:", citasRaw[0].ID_Paciente);
      console.log("userId del localStorage:", userId);
      console.log("🔍 ¿Coinciden?", citasRaw[0].ID_Paciente == userId);
    }

        const formatFecha = (fechaStr) => {
          if (!fechaStr) return '';
          
          try {
            const fecha = new Date(fechaStr);
            if (isNaN(fecha.getTime())) {
              console.warn('Fecha inválida:', fechaStr);
              return '';
            }
            return fecha.toISOString().split('T')[0];
          } catch (error) {
            console.warn('Error parseando fecha:', fechaStr, error);
            return '';
          }
        };

        const formatHora = (horaStr) => {
          if (!horaStr) return '';
          
          try {
            if (typeof horaStr === 'string' && horaStr.includes('T')) {
              const fecha = new Date(horaStr);
              if (isNaN(fecha.getTime())) {
                console.warn('Hora ISO inválida:', horaStr);
                return '';
              }
              
              const horas = fecha.getUTCHours().toString().padStart(2, '0');
              const minutos = fecha.getUTCMinutes().toString().padStart(2, '0');
              return `${horas}:${minutos}`;
            }
            
            if (/^\d{2}:\d{2}/.test(horaStr)) {
              return horaStr.substring(0, 5);
            }
            
            console.warn('Formato de hora no reconocido:', horaStr);
            return '';
          } catch (error) {
            console.warn('Error parseando hora:', horaStr, error);
            return '';
          }
        };

        // Filtrar solo citas del usuario actual
    const activos = [1, 2, 'Agendada - Pendiente de Pago', 'Pagada - Pendiente por Atender', 'Programada', 'Pagada'];

    this.citas = citasRaw
      .filter(c => {
        const coincide = c.ID_Paciente == userId;
        if (!coincide) {
          console.warn(`Cita ${c.Folio_Cita} filtrada: ID_Paciente=${c.ID_Paciente} vs userId=${userId}`);
          return false;
        }

        const est = c.Id_Estatus || c.Estatus;
        const keep = activos.includes(est);
        if (!keep) {
          console.info(`Ocultando cita ${c.Folio_Cita || c.Id_Cita} por estatus ${est}`);
        }
        return keep;
      })
      .map(c => ({
        ...c,
        Fecha_Cita: formatFecha(c.Fecha_cita),
        Hora_Inicio: formatHora(c.Hora_Inicio),
        Hora_Fin: formatHora(c.Hora_Fin),
      }));

    console.log(`Total de citas después del filtro: ${this.citas.length}`);
    if (this.citas.length > 0) {
      console.log("Primera cita procesada:", this.citas[0]);
    }

  } catch (error) {
    console.error("Error cargando citas:", error);
    this.citas = [];
  }
  }
}

};
</script>

<style scoped>
.form-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.25rem;
}

.sidebar {
  position: fixed;
  left: -280px;
  top: 0;
  width: 260px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #ddd;
  box-shadow: 2px 0px 10px rgba(0,0,0,0.1);
  padding: 15px;
  transition: 0.30s ease;
  z-index: 2000;
  overflow-y: auto;
}

.sidebar.open {
  left: 0;
}

.sidebar-toggle {
  position: fixed;
  left: 10px;
  top: 10px;
  z-index: 2100;
  background: #0d6efd;
  color: #fff;
  border: none;
  font-size: 20px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.sidebar-section {
  margin-bottom: 15px;
}

.sidebar-section h6 {
  margin-bottom: 10px;
  font-weight: bold;
  color: #0d6efd;
}

.sidebar-section ul {
  padding-left: 0;
  max-height: 400px;
  overflow-y: auto;
}

.sidebar-section li {
  padding: 8px;
  transition: background-color 0.2s;
}

.sidebar-section li:hover {
  background-color: #f8f9fa;
  border-radius: 4px;
}

.sidebar-section .border-bottom {
  border-bottom: 1px solid #e9ecef !important;
}

.sidebar-section .border-bottom:last-child {
  border-bottom: none !important;
}

.form-card {
  width: 100%;
  max-width: 1024px;
  min-width: 980px;
  margin: 0 auto;
  box-sizing: border-box;
}

.form-card .card-body { 
  padding: 1.5rem; 
}

.slot-area {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}

.min-slot-area {
  min-height: 120px;
}

.btn-slot {
  min-width: 84px;
  flex: 0 1 auto;
  white-space: nowrap;
}

.selected-card {
  background: #f8f9fa;
}

@media (max-width: 768px) {
  .btn-slot { 
    min-width: 72px; 
    font-size: 0.92rem; 
  }
  .form-card { 
    margin: 0.5rem; 
    padding: 0.1rem; 
    min-width: auto;
  }
}

.form-card .form-control,
.form-card .form-select {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
</style>