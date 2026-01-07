<template>
  <div class="generar-receta">
    <div class="card shadow-sm">
      <div class="card-header bg-info text-white">
        <h5 class="mb-0">Generar Receta Médica</h5>
      </div>

      <div class="card-body">
        <!-- DATOS DE LA CITA -->
        <div v-if="citaSeleccionada" class="alert alert-light border">
          <h6 class="mb-3">Información de la Cita</h6>
          <div class="row">
            <div class="col-md-3">
              <small class="text-muted">Paciente</small>
              <p class="mb-2"><strong>{{ citaSeleccionada.Paciente }}</strong></p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Fecha</small>
              <p class="mb-2"><strong>{{ formatDate(citaSeleccionada.Fecha_cita) }}</strong></p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Especialidad</small>
              <p class="mb-2"><strong>{{ especialidad }}</strong></p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Estatus</small>
              <p class="mb-0">
                <span class="badge bg-success">{{ citaSeleccionada.Estatus }}</span>
              </p>
            </div>
          </div>
        </div>

        <!-- SELECTOR DE CITA SI NO HAY SELECCIONADA -->
        <div v-if="!citaSeleccionada" class="mb-4">
          <label class="form-label"><strong>Selecciona una cita atendida:</strong></label>
          <select class="form-select" v-model="citaSeleccionadaId" @change="cargarCita">
            <option value="">-- Selecciona una cita --</option>
            <option v-for="cita in citasAtendidas" :key="cita.Id_Cita" :value="cita.Id_Cita">
              {{ formatDate(cita.Fecha_cita) }} - {{ cita.Paciente }} ({{ cita.Especialidad }})
            </option>
          </select>
        </div>

        <div v-if="citaSeleccionada">
          <!-- FORMULARIO DE RECETA -->
          <form @submit.prevent="guardarReceta">
            <!-- DIAGNÓSTICO -->
            <div class="mb-3">
              <label class="form-label"><strong>Diagnóstico</strong></label>
              <textarea 
                v-model="formulario.diagnostico"
                class="form-control"
                rows="2"
                placeholder="Ej: Infección urinaria, presión arterial elevada..."
                required>
              </textarea>
            </div>

            <!-- MEDICAMENTOS -->
            <div class="mb-3">
              <label class="form-label"><strong>Medicamentos</strong></label>
              <div class="card bg-light p-3">
                <div v-for="(med, idx) in formulario.medicamentos" :key="idx" class="mb-3 p-3 bg-white border rounded">
                  <div class="row g-2">
                    <div class="col-md-4">
                      <label class="form-label small">Medicamento</label>
                      <input 
                        v-model="med.nombre"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="Ej: Amoxicilina"
                        required>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Dosis</label>
                      <input 
                        v-model="med.dosis"
                        type="text"
                        class="form-control form-control-sm"
                        placeholder="Ej: 500mg"
                        required>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Frecuencia</label>
                      <select v-model="med.frecuencia" class="form-select form-select-sm" required>
                        <option>Cada 6 horas</option>
                        <option>Cada 8 horas</option>
                        <option>Cada 12 horas</option>
                        <option>Una vez al día</option>
                        <option>Según sea necesario</option>
                      </select>
                    </div>
                    <div class="col-md-2">
                      <label class="form-label small">Duración (días)</label>
                      <input 
                        v-model.number="med.duracion"
                        type="number"
                        class="form-control form-control-sm"
                        min="1"
                        max="30"
                        required>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                      <button 
                        type="button"
                        class="btn btn-sm btn-danger w-100"
                        @click="removerMedicamento(idx)">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="agregarMedicamento">
                  + Agregar medicamento
                </button>
              </div>
            </div>

            <!-- INDICACIONES -->
            <div class="mb-3">
              <label class="form-label"><strong>Indicaciones y Recomendaciones</strong></label>
              <textarea 
                v-model="formulario.indicaciones"
                class="form-control"
                rows="3"
                placeholder="Ej: Tomar con alimentos, evitar alcohol, reposo...">
              </textarea>
            </div>

            <!-- MENSAJES -->
            <div v-if="mensaje" class="alert" :class="isError ? 'alert-danger' : 'alert-success'">
              {{ mensaje }}
            </div>

            <!-- BOTONES -->
            <div class="d-flex gap-2">
              <button 
                type="submit"
                class="btn btn-primary"
                :disabled="formulario.medicamentos.length === 0 || isLoading">
                <span v-if="!isLoading">✓ Generar Receta</span>
                <span v-else><span class="spinner-border spinner-border-sm me-2"></span>Procesando...</span>
              </button>
              <button 
                type="button"
                class="btn btn-secondary"
                @click="limpiar">
                Limpiar
              </button>
              <button 
                type="button"
                class="btn btn-outline-secondary"
                @click="$emit('cerrar')">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GenerarReceta',
  props: {
    cita: {
      type: Object,
      default: null
    },
    citasDisponibles: {
      type: Array,
      default: () => []
    },
    especialidad: {
      type: String,
      default: ''
    }
  },
  emits: ['cerrar', 'receta-creada'],
  data() {
    return {
      citaSeleccionadaId: this.cita?.Id_Cita || '',
      citaSeleccionada: this.cita || null,
      citasAtendidas: [],
      formulario: {
        diagnostico: '',
        medicamentos: [{ nombre: '', dosis: '', frecuencia: 'Cada 8 horas', duracion: 7 }],
        indicaciones: ''
      },
      mensaje: '',
      isError: false,
      isLoading: false
    };
  },
  mounted() {
    this.cargarCitasAtendidas();
    if (this.cita) {
      this.citaSeleccionada = this.cita;
    }
  },
  methods: {
    cargarCitasAtendidas() {
      // Filtrar citas con estatus "Atendida"
      this.citasAtendidas = this.citasDisponibles.filter(c => 
        (c.Estatus || '').toLowerCase().includes('atendida')
      );
    },
    cargarCita() {
      const cita = this.citasAtendidas.find(c => c.Id_Cita === parseInt(this.citaSeleccionadaId));
      if (cita) {
        this.citaSeleccionada = cita;
        this.$emit('cita-seleccionada', cita);
      }
    },
    agregarMedicamento() {
      this.formulario.medicamentos.push({
        nombre: '',
        dosis: '',
        frecuencia: 'Cada 8 horas',
        duracion: 7
      });
    },
    removerMedicamento(idx) {
      this.formulario.medicamentos.splice(idx, 1);
    },
    formatDate(fecha) {
      if (!fecha) return '';
      if (typeof fecha === 'string' && fecha.includes('T')) return fecha.slice(0, 10);
      const d = new Date(fecha);
      return d.toISOString().slice(0, 10);
    },
    async guardarReceta() {
      this.mensaje = '';
      this.isError = false;

      if (!this.citaSeleccionada) {
        this.mensaje = 'Selecciona una cita';
        this.isError = true;
        return;
      }

      if (this.formulario.medicamentos.length === 0) {
        this.mensaje = 'Agrega al menos un medicamento';
        this.isError = true;
        return;
      }

      this.isLoading = true;

      try {
        const response = await fetch('http://localhost:3000/api/doctores/receta', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          },
          body: JSON.stringify({
            Id_Cita: this.citaSeleccionada.Id_Cita,
            Diagnostico: this.formulario.diagnostico,
            Medicamentos: this.formulario.medicamentos,
            Indicaciones: this.formulario.indicaciones
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Error ${response.status}`);
        }

        this.mensaje = `✓ Receta generada exitosamente`;
        this.isError = false;
        
        setTimeout(() => {
          this.$emit('receta-creada', data);
          this.limpiar();
        }, 2000);

      } catch (error) {
        this.mensaje = `Error: ${error.message}`;
        this.isError = true;
      } finally {
        this.isLoading = false;
      }
    },
    limpiar() {
      this.formulario = {
        diagnostico: '',
        medicamentos: [{ nombre: '', dosis: '', frecuencia: 'Cada 8 horas', duracion: 7 }],
        indicaciones: ''
      };
      this.mensaje = '';
    }
  }
};
</script>

<style scoped>
.generar-receta {
  max-width: 900px;
  margin: 0 auto;
}

.form-label {
  font-weight: 600;
  color: #333;
}

.card {
  border: none;
  border-radius: 8px;
}

.card-header {
  border-radius: 8px 8px 0 0;
  padding: 1.25rem;
}

.bg-light {
  background-color: #f8f9fa !important;
}

textarea {
  font-size: 0.95rem;
  resize: vertical;
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
  border-width: 0.2em;
}
</style>
