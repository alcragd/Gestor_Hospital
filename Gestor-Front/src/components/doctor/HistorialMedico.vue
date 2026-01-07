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
                    <p v-if="receta.Medicamentos && receta.Medicamentos.length > 0" class="mb-2">
                      <strong>Medicamentos:</strong>
                      <ul class="list-unstyled mb-0">
                        <li v-for="(med, mIdx) in receta.Medicamentos" :key="mIdx" class="ms-3">
                          <small>
                            <strong>{{ med.nombre }}</strong> - {{ med.dosis }} 
                            ({{ med.frecuencia }}, {{ med.duracion }} días)
                          </small>
                        </li>
                      </ul>
                    </p>
                    <p v-if="receta.Indicaciones" class="mb-0">
                      <strong>Indicaciones:</strong><br>
                      <small>{{ receta.Indicaciones }}</small>
                    </p>
                  </div>
                  <div class="card-footer bg-light">
                    <small class="text-muted">Doctor: {{ receta.Doctor || 'N/A' }}</small>
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
      paciente: this.pacienteData || {
        Nombre: '',
        Apellido_paterno: '',
        Fecha_nacimiento: '',
        Correo: '',
        Telefono: ''
      },
      citas: [],
      recetas: [],
      diagnosticos: [],
      isLoading: true,
      citasTotal: 0,
      ultimaCita: ''
    };
  },
  mounted() {
    console.log('📂 HistorialMedico mounted');
    console.log('Props recibidos - pacienteId:', this.pacienteId);
    console.log('Props recibidos - pacienteData:', this.pacienteData);
    
    // Obtener pacienteId directamente de pacienteData si no viene en prop
    const idPaciente = this.pacienteId || (this.pacienteData?.Id_Paciente);
    console.log('🔑 ID Paciente a usar:', idPaciente);
    
    // Si recibimos pacienteData con los datos completos, mapearlos
    if (this.pacienteData) {
      console.log('🔄 Mapeando datos del paciente desde props...');
      this.paciente = {
        Nombre: this.pacienteData.Nombre || '',
        Apellido_paterno: this.pacienteData.Paterno || this.pacienteData.Apellido_paterno || '',
        Apellido_materno: this.pacienteData.Materno || this.pacienteData.Apellido_materno || '',
        Fecha_nacimiento: this.pacienteData.Fecha_nac || this.pacienteData.Fecha_nacimiento || '',
        Correo: this.pacienteData.Correo || this.pacienteData.Email || '',
        Telefono: this.pacienteData.Telefono || '',
        Sexo: this.pacienteData.Sexo || '',
        DNI: this.pacienteData.DNI || ''
      };
      console.log('✅ Paciente mapeado:', this.paciente);
    } else {
      console.warn('⚠️ No se recibió pacienteData completa');
    }
    
    this.cargarHistorial(idPaciente);
  },
  methods: {
    async cargarHistorial(idPaciente) {
      this.isLoading = true;
      console.log('📚 Cargando historial para paciente ID:', idPaciente);
      
      if (!idPaciente) {
        console.error('🚨 ERROR: No hay ID de paciente para cargar historial');
        this.isLoading = false;
        return;
      }
      
      try {
        // Obtener historial del paciente
        const url = `http://localhost:3000/api/doctores/paciente/${idPaciente}/historial`;
        console.log('🔗 URL:', url);
        
        const historialResponse = await fetch(
          url,
          {
            headers: {
              'x-user-id': localStorage.getItem('userId'),
              'x-user-role': localStorage.getItem('userRole')
            }
          }
        );

        console.log('📡 Response status:', historialResponse.status);

        if (!historialResponse.ok) {
          const errorText = await historialResponse.text();
          console.error('❌ Error en historial:', errorText);
          throw new Error(`Error ${historialResponse.status}`);
        }

        const data = await historialResponse.json();
        console.log('✅ Datos historial recibidos:', data);

        // El endpoint retorna 'citas' y 'recetas' por separado
        this.citas = Array.isArray(data.citas) ? data.citas : [];
        this.recetas = Array.isArray(data.recetas) ? data.recetas : [];
        this.citasTotal = this.citas.length;

        console.log('📊 Citas recibidas:', this.citas.length);
        console.log('💊 Recetas recibidas:', this.recetas.length);

        // Parsear medicamentos y construir diagnósticos a partir de recetas
        this.recetas = this.recetas.map(receta => {
          let medicamentosArray = receta.Medicamentos;
          // Si medicamentos es string JSON, parsearlo
          if (typeof medicamentosArray === 'string') {
            try {
              medicamentosArray = JSON.parse(medicamentosArray);
            } catch (e) {
              console.warn('⚠️ No se pudo parsear medicamentos:', receta.Medicamentos);
              medicamentosArray = [];
            }
          }
          return {
            ...receta,
            Medicamentos: medicamentosArray
          };
        });

        // Construir array de diagnósticos a partir de recetas
        this.diagnosticos = this.recetas.map((receta, idx) => ({
          Id_Diagnostico: idx,
          Fecha: receta.Fecha_Emision,
          Doctor: receta.Doctor,
          Diagnostico: receta.Diagnostico,
          Indicaciones: receta.Indicaciones,
          Estado: 'Registrado'
        }));

        console.log('📋 Diagnósticos construidos:', this.diagnosticos.length);
        console.log('💊 Recetas parseadas:', this.recetas);

        // Extraer datos del paciente del primer registro de citas
        if (this.citas.length > 0) {
          const primerCita = this.citas[0];
          console.log('📦 Primer cita con datos paciente:', primerCita);
          
          this.paciente = {
            Nombre: primerCita.Paciente_Nombre || this.paciente.Nombre || '',
            Apellido_paterno: primerCita.Paciente_Paterno || this.paciente.Apellido_paterno || '',
            Apellido_materno: primerCita.Paciente_Materno || this.paciente.Apellido_materno || '',
            Fecha_nacimiento: primerCita.Paciente_Fecha_Nacimiento || this.paciente.Fecha_nacimiento || '',
            Correo: primerCita.Paciente_Correo || this.paciente.Correo || '',
            Telefono: primerCita.Paciente_Telefono || this.paciente.Telefono || '',
            Edad: primerCita.Paciente_Edad || this.calcularEdad(primerCita.Paciente_Fecha_Nacimiento),
            Sexo: this.paciente.Sexo || '',
            DNI: this.paciente.DNI || ''
          };
          console.log('✅ Paciente actualizado desde historial:', this.paciente);
        }

        console.log('📊 Citas totales:', this.citasTotal);
        console.log('💊 Recetas totales:', this.recetas.length);
        console.log('📋 Diagnósticos totales:', this.diagnosticos.length);

        if (this.citas.length > 0) {
          const fechas = this.citas
            .map(c => new Date(c.Fecha_cita))
            .sort((a, b) => b - a);
          if (fechas[0]) {
            this.ultimaCita = this.formatDate(fechas[0]);
          }
        }

        console.log('✅ Historial completo cargado:');
        console.log('   📋 Citas:', this.citas.length);
        console.log('   💊 Recetas:', this.recetas.length);
        console.log('   🏥 Diagnósticos:', this.diagnosticos.length);
        console.log('   👤 Paciente:', this.paciente.Nombre);

      } catch (error) {
        console.error('🚨 Error cargando historial:', error);
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
