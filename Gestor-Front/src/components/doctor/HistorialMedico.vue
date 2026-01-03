<template>
  <div class="historial-medico">
    <div class="card shadow-sm">
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">Historial Médico del Paciente</h5>
      </div>

      <div class="card-body">
        <!-- INFORMACIÓN DEL PACIENTE -->
        <div v-if="paciente" class="alert alert-light border mb-4">
          <div class="row align-items-center">
            <div class="col-md-6">
              <h6 class="mb-3">Información del Paciente</h6>
              <p class="mb-2"><strong>Nombre:</strong> {{ paciente.Nombre }} {{ paciente.Apellido_paterno }}</p>
              <p class="mb-2"><strong>Edad:</strong> {{ calcularEdad(paciente.Fecha_nacimiento) }} años</p>
              <p class="mb-0"><strong>Email:</strong> {{ paciente.Correo || 'N/A' }}</p>
            </div>
            <div class="col-md-6">
              <p class="mb-2"><strong>Teléfono:</strong> {{ paciente.Telefono || 'N/A' }}</p>
              <p class="mb-2"><strong>Citas Totales:</strong> <span class="badge bg-primary">{{ citasTotal }}</span></p>
              <p class="mb-0"><strong>Última Cita:</strong> <span class="text-muted">{{ ultimaCita || 'N/A' }}</span></p>
            </div>
          </div>
        </div>

        <!-- TABS DE HISTORIAL -->
        <ul class="nav nav-tabs mb-3" role="tablist">
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link" 
              :class="{ active: tabActivo === 'citas' }"
              @click="tabActivo = 'citas'">
              📋 Citas Anteriores
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: tabActivo === 'recetas' }"
              @click="tabActivo = 'recetas'">
              💊 Recetas Emitidas
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button 
              class="nav-link"
              :class="{ active: tabActivo === 'diagnosticos' }"
              @click="tabActivo = 'diagnosticos'">
              🏥 Diagnósticos
            </button>
          </li>
        </ul>

        <!-- CONTENIDO DE TABS -->
        <div v-if="isLoading" class="text-center py-4">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>

        <div v-else>
          <!-- TAB: CITAS ANTERIORES -->
          <div v-if="tabActivo === 'citas'">
            <div v-if="citas.length > 0" class="table-responsive">
              <table class="table table-hover table-sm">
                <thead class="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Doctor</th>
                    <th>Especialidad</th>
                    <th>Estatus</th>
                    <th>Observaciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cita in citas" :key="cita.Id_Cita">
                    <td><strong>{{ formatDate(cita.Fecha_cita) }}</strong></td>
                    <td>{{ cita.Doctor }}</td>
                    <td>{{ cita.Especialidad }}</td>
                    <td>
                      <span class="badge" :class="getEstatusBadge(cita.Estatus)">
                        {{ cita.Estatus }}
                      </span>
                    </td>
                    <td>
                      <small class="text-muted">
                        {{ cita.Motivo || '-' }}
                      </small>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="alert alert-info">
              No hay citas registradas en el historial
            </div>
          </div>

          <!-- TAB: RECETAS EMITIDAS -->
          <div v-if="tabActivo === 'recetas'">
            <div v-if="recetas.length > 0" class="row">
              <div v-for="receta in recetas" :key="receta.Id_Receta" class="col-md-6 mb-3">
                <div class="card border-success">
                  <div class="card-header bg-light border-bottom border-success">
                    <h6 class="mb-0">Receta #{{ receta.Id_Receta }}</h6>
                    <small class="text-muted">{{ formatDate(receta.Fecha_emision) }}</small>
                  </div>
                  <div class="card-body">
                    <p v-if="receta.Diagnostico" class="mb-2">
                      <strong>Diagnóstico:</strong><br>
                      {{ receta.Diagnostico }}
                    </p>
                    <p v-if="receta.Medicamentos" class="mb-2">
                      <strong>Medicamentos:</strong><br>
                      <small>{{ receta.Medicamentos }}</small>
                    </p>
                    <p v-if="receta.Indicaciones">
                      <strong>Indicaciones:</strong><br>
                      <small>{{ receta.Indicaciones }}</small>
                    </p>
                  </div>
                  <div class="card-footer bg-light">
                    <small class="text-muted">Doctor: {{ receta.Doctor_nombre || 'N/A' }}</small>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="alert alert-info">
              No hay recetas emitidas para este paciente
            </div>
          </div>

          <!-- TAB: DIAGNÓSTICOS -->
          <div v-if="tabActivo === 'diagnosticos'">
            <div v-if="diagnosticos.length > 0">
              <div v-for="(diag, idx) in diagnosticos" :key="idx" class="mb-3 p-3 border rounded">
                <div class="row">
                  <div class="col-md-3">
                    <strong>Fecha:</strong><br>
                    {{ formatDate(diag.Fecha) }}
                  </div>
                  <div class="col-md-3">
                    <strong>Doctor:</strong><br>
                    {{ diag.Doctor }}
                  </div>
                  <div class="col-md-3">
                    <strong>Especialidad:</strong><br>
                    {{ diag.Especialidad }}
                  </div>
                  <div class="col-md-3">
                    <strong>Estado:</strong><br>
                    <span class="badge bg-primary">{{ diag.Estado || 'Registrado' }}</span>
                  </div>
                </div>
                <hr>
                <p class="mb-0">
                  <strong>Diagnóstico:</strong><br>
                  {{ diag.Diagnostico || 'Sin descripción' }}
                </p>
              </div>
            </div>
            <div v-else class="alert alert-info">
              No hay diagnósticos registrados
            </div>
          </div>
        </div>

        <!-- BOTÓN CERRAR -->
        <div class="mt-4">
          <button class="btn btn-outline-secondary" @click="$emit('cerrar')">
            Cerrar historial
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HistorialMedico',
  props: {
    pacienteId: {
      type: Number,
      required: true
    },
    pacienteData: {
      type: Object,
      default: null
    }
  },
  emits: ['cerrar'],
  data() {
    return {
      tabActivo: 'citas',
      paciente: this.pacienteData,
      citas: [],
      recetas: [],
      diagnosticos: [],
      isLoading: true,
      citasTotal: 0,
      ultimaCita: ''
    };
  },
  mounted() {
    this.cargarHistorial();
  },
  methods: {
    async cargarHistorial() {
      this.isLoading = true;
      try {
        const response = await fetch(
          `http://localhost:3000/api/doctores/paciente/${this.pacienteId}/historial`,
          {
            headers: {
              'x-user-id': localStorage.getItem('userId'),
              'x-user-role': localStorage.getItem('userRole')
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Error ${response.status}`);
        }

        const data = await response.json();

        this.citas = Array.isArray(data.citas) ? data.citas : [];
        this.recetas = Array.isArray(data.recetas) ? data.recetas : [];
        this.diagnosticos = Array.isArray(data.diagnosticos) ? data.diagnosticos : [];
        this.citasTotal = this.citas.length;

        if (this.citas.length > 0) {
          const fechas = this.citas
            .map(c => new Date(c.Fecha_cita))
            .sort((a, b) => b - a);
          if (fechas[0]) {
            this.ultimaCita = this.formatDate(fechas[0]);
          }
        }

      } catch (error) {
        console.error('Error cargando historial:', error);
        this.citas = [];
        this.recetas = [];
        this.diagnosticos = [];
      } finally {
        this.isLoading = false;
      }
    },
    formatDate(fecha) {
      if (!fecha) return '';
      if (typeof fecha === 'string' && fecha.includes('T')) return fecha.slice(0, 10);
      const d = new Date(fecha);
      if (Number.isNaN(d.getTime())) return '';
      return d.toISOString().slice(0, 10);
    },
    calcularEdad(fechaNacimiento) {
      if (!fechaNacimiento) return 'N/A';
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      const m = hoy.getMonth() - nacimiento.getMonth();
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      return edad;
    },
    getEstatusBadge(estatus) {
      const e = (estatus || '').toLowerCase();
      if (e.includes('atendida')) return 'bg-success';
      if (e.includes('pagada')) return 'bg-warning text-dark';
      if (e.includes('cancelada')) return 'bg-danger';
      if (e.includes('pendiente')) return 'bg-info';
      return 'bg-secondary';
    }
  }
};
</script>

<style scoped>
.historial-medico {
  max-width: 1000px;
  margin: 0 auto;
}

.card {
  border: none;
  border-radius: 8px;
}

.card-header {
  border-radius: 8px 8px 0 0;
  padding: 1.25rem;
}

.nav-tabs {
  border-bottom: 2px solid #e9ecef;
}

.nav-tabs .nav-link {
  color: #666;
  border: none;
  border-bottom: 3px solid transparent;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
}

.nav-tabs .nav-link:hover {
  border-bottom-color: #0d6efd;
  color: #0d6efd;
}

.nav-tabs .nav-link.active {
  color: #0d6efd;
  border-bottom-color: #0d6efd;
}

.table-hover tbody tr:hover {
  background-color: #f5f5f5;
}

.badge {
  font-size: 0.85rem;
  padding: 0.5rem 0.75rem;
}

.spinner-border {
  color: #0d6efd;
}

.card-body strong {
  color: #333;
}

.text-muted {
  color: #6c757d !important;
}

.border-success {
  border-color: #28a745 !important;
}
</style>
