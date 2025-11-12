<template>
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
          <div>Usuario: {{ cita.Usuario }}</div>
          <div>Paciente ID: {{ cita.Id_Paciente || 'N/D' }}</div>
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
      // Estado inicial del formulario (debe coincidir con las propiedades del JSON de la API)
      cita: {
        Id_Doctor: null,
        Id_Paciente: null,
        Fecha_Cita: '',
        Hora_Inicio: '', // <-- vacío para que la sección no aparezca inicialmente
        Hora_Fin: '',
        Usuario: 'Web_Recepcion', // Usuario por defecto para el registro en Bitacora
      },

      // Datos para la selección secuencial
        especialidades: [],
        doctores: [],
        slotsOcupados: [],
        slotsDisponibles: [], // <-- Aquí guardaremos los horarios calculados
        
        // Parámetros de selección
        selected: {
            especialidadId: null,
            doctorId: null,
            fecha: new Date().toISOString().slice(0, 10), // Fecha actual por defecto
        },

      isLoading: false,
      mensaje: '',
      isSuccess: false,
    };
  },

  computed: {
        // Devuelve la fecha mínima permitida (hoy + 2 días)
        minDate() {
            const today = new Date();
            today.setDate(today.getDate() + 2); 
            return today.toISOString().slice(0, 10);
        },
        // Devuelve la fecha máxima permitida (hoy + 3 meses)
        maxDate() {
            const today = new Date();
            today.setMonth(today.getMonth() + 3);
            return today.toISOString().slice(0, 10);
        },

        // Nueva: indica si hay un horario válido seleccionado
        hasSlotSelected() {
            // considerar válido sólo si hay doctor, fecha y horas en formato HH:MM[:SS]
            const horaRegex = /^\d{2}:\d{2}(:\d{2})?$/;
            return !!this.cita.Id_Doctor &&
                   !!this.cita.Fecha_Cita &&
                   horaRegex.test(this.cita.Hora_Inicio) &&
                   horaRegex.test(this.cita.Hora_Fin);
        }
    },

  // <-- agregado: llamar al cargarEspecialidades cuando se monta el componente
  mounted() {
    this.cargarEspecialidades();
  },

  methods: {
    // 1. Cargar la lista inicial de especialidades
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
    
    // 2. Cuando cambia la especialidad, cargar doctores
    async especialidadSeleccionada() {
        this.doctores = []; // Limpiar lista
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
    
    // 3. Cuando cambia el doctor o la fecha, calcular disponibilidad
    async actualizarDisponibilidad() {
    this.cita.Hora_Inicio = '';
    this.cita.Hora_Fin = '';
    this.slotsDisponibles = [];
    if (!this.selected.doctorId || !this.selected.fecha) return;

    try {
        // 1. Obtener slots ocupados
        this.slotsOcupados = await CitaService.getSlotsOcupados(
            this.selected.doctorId,
            this.selected.fecha
        );
        
        // 2. OBTENER RANGOS DE TRABAJO TOTALES DEL BACK
        const rangosTrabajo = await CitaService.getHorarioTrabajo(
            this.selected.doctorId, 
            this.selected.fecha
        );
        
        // Si el doctor no trabaja ese día, el array estará vacío
        if (rangosTrabajo.length === 0) {
            this.slotsDisponibles = [];
            this.mensaje = 'El doctor no trabaja en la fecha seleccionada.';
            return;
        }

        // 3. Generar y Filtrar los slots disponibles
        this.slotsDisponibles = this.calcularSlotsDisponibles(rangosTrabajo);
        this.mensaje = ''; // Limpiar mensaje de no disponibilidad si funciona

    } catch (e) {
        this.mensaje = `Error al cargar la disponibilidad: ${e.message}`;
    }
},
    

    calcularSlotsDisponibles(rangosTrabajo) {
    const slots = [];
    const duracionCitaMinutos = 30; // Duración estándar de 30 min
    for (const rango of rangosTrabajo) {
        // Usamos una fecha ficticia ('2000/01/01') para crear objetos Date válidos con la hora
        let horaActual = new Date(`2000/01/01 ${rango.Hora_Inicio}`);
        const horaFinRango = new Date(`2000/01/01 ${rango.Hora_Fin}`);

        while (horaActual < horaFinRango) {
            // Calcular el fin del slot (1 hora después)
            const finSlot = new Date(horaActual.getTime() + duracionCitaMinutos * 60000);
            
            // Si el slot excede el fin del rango de trabajo, rompemos el ciclo
            if (finSlot > horaFinRango) {
                break; 
            }
            
            // Formatear las horas a HH:MM:SS para comparación (toISOString es más seguro, pero toTimeString funciona si solo quieres la hora)
            // Usamos una función auxiliar para asegurar el formato HH:MM:SS
            const formatTime = (date) => date.toTimeString().split(' ')[0];
            const horaInicioStr = formatTime(horaActual);
            
            // Verificar si este slot ya está ocupado
            const estaOcupado = this.slotsOcupados.some(ocupado => {
                // Compara el inicio del slot con la Hora_Inicio de las citas ocupadas
                return ocupado.Hora_Inicio === horaInicioStr;
            });

            if (!estaOcupado) {
                // Si no está ocupado, añadimos el slot disponible
                slots.push({ inicio: horaInicioStr, fin: formatTime(finSlot) });
            }

            // Mover a la siguiente hora
            horaActual = finSlot;
        }
    }
    return slots;
},

    async submitCita() {
      // 1. Limpiar mensajes y activar loading
      this.mensaje = '';
      this.isLoading = true;
      this.isSuccess = false;

      // 2. Función auxiliar para asegurar formato HH:MM:SS
      const formatearHora = (hora) => {
        if (!hora) return '';
        // Si es string en formato HH:MM o HH:MM:SS, devolverlo como está
        if (typeof hora === 'string' && /^\d{2}:\d{2}/.test(hora)) {
          return hora.length === 5 ? `${hora}:00` : hora.substring(0, 8);
        }
        // Si es objeto Date, extraer la hora
        if (hora instanceof Date) {
          return hora.toLocaleTimeString('es-ES', { hour12: false }).substring(0, 8);
        }
        return hora;
      };

      // 3. Crear el objeto de datos para enviar (asegurando el formato correcto)
      const dataToSend = {
          ...this.cita,
          Hora_Inicio: formatearHora(this.cita.Hora_Inicio),
          Hora_Fin: formatearHora(this.cita.Hora_Fin),
      };

      console.log('Datos a enviar:', dataToSend);

      try {
        // 4. Llamar al servicio de backend
        const response = await CitaService.crearCita(dataToSend);
        
        // 5. Manejar éxito
        this.mensaje = response.message || 'Cita creada exitosamente.';
        this.isSuccess = true;
        this.resetForm();
        
      } catch (error) {
        // 6. Manejar error
        this.mensaje = `Fallo al agendar: ${error.message}`;
        this.isSuccess = false;
        
      } finally {
        // 7. Desactivar loading
        this.isLoading = false;
      }
    },

    seleccionarSlot(slot) {
        this.cita.Id_Doctor = this.selected.doctorId;
        this.cita.Id_Paciente = 3; // ID de prueba o del usuario logueado
        this.cita.Fecha_Cita = this.selected.fecha;
        this.cita.Hora_Inicio = slot.inicio.substring(0, 8); 
        this.cita.Hora_Fin = slot.fin.substring(0, 8);       
        this.mensaje = `Slot ${slot.inicio} seleccionado. Presione Confirmar Cita.`;
    },
    
    resetForm() {
        // Reiniciar solo los campos críticos
        this.cita.Fecha_Cita = '';
        this.cita.Id_Doctor = null;
        this.cita.Hora_Inicio = '';
        this.cita.Hora_Fin = '';
        // Mantener el Id_Paciente para agilizar la prueba
    }
  }
};
</script>

<style scoped>
/* Wrapper centra el card y le da espacio lateral */
.form-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.25rem;
}

/* Card más amplio y responsivo: mínimo para evitar "aplastamiento" y máximo para no estirar demasiado */
.form-card {
  width: 100%;
  max-width: 1024px;
  min-width: 980px;
  margin: 0 auto;
  box-sizing: border-box;
}

/* Mejor separación vertical para evitar "aplaste" en pantallas pequeñas */
.form-card .card-body { padding: 1.5rem; }

/* Áreas para horarios: aseguran altura mínima y scroll si hay muchos slots */
.slot-area {
  display: flex;
  flex-wrap: wrap;     /* permitir que los botones envuelvan */
  gap: 0.5rem;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
}

/* Mostrar un área mínima cuando no hay slots para que el diseño respire */
.min-slot-area {
  min-height: 120px;
}

/* Botones de slot: permitir encogerse en pantallas pequeñas para evitar overflow horizontal */
.btn-slot {
  min-width: 84px;     /* reducir min-width para no forzar ancho excesivo */
  flex: 0 1 auto;      /* permitir que el botón crezca/encoga */
  white-space: nowrap;
}

/* Tarjeta de selección más compacta en mobile */
.selected-card {
  background: #f8f9fa;
}

/* Ajustes responsivos extra */
@media (max-width: 768px) {
  .btn-slot { min-width: 72px; font-size: 0.92rem; }
  .form-card { margin: 0.5rem; padding: 0.1rem; }
}

/* pequeño ajuste para evitar que inputs/selects se compriman demasiado */
.form-card .form-control,
.form-card .form-select {
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}
</style>