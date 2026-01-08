<template>
  <div class="datos-personales-card">
    <div class="card shadow-sm">
      <div class="card-header bg-info text-white">
        <h6 class="mb-0">👤 Datos Personales</h6>
      </div>
      <div class="card-body">
        <div class="datos-grid">
          <!-- Nombre -->
          <div class="dato-item">
            <span class="dato-label">Nombre Completo:</span>
            <span class="dato-valor">{{ nombreCompleto }}</span>
          </div>

          <!-- Identificación -->
          <div class="dato-item" v-if="tipo === 'paciente'">
            <span class="dato-label">DNI:</span>
            <span class="dato-valor">{{ datos.DNI }}</span>
          </div>

          <div class="dato-item" v-if="tipo === 'doctor'">
            <span class="dato-label">Cédula:</span>
            <span class="dato-valor">{{ datos.Cedula || '—' }}</span>
          </div>

          <div class="dato-item" v-if="tipo === 'doctor'">
            <span class="dato-label">RFC:</span>
            <span class="dato-valor">{{ datos.Rfc || '—' }}</span>
          </div>

          <div class="dato-item" v-if="tipo === 'recepcionista'">
            <span class="dato-label">CURP:</span>
            <span class="dato-valor">{{ datos.CURP || '—' }}</span>
          </div>

          <!-- Fecha de Nacimiento -->
          <div class="dato-item" v-if="datos.Fecha_nac">
            <span class="dato-label">Fecha de Nacimiento:</span>
            <span class="dato-valor">{{ formatDate(datos.Fecha_nac) }}</span>
          </div>

          <!-- Edad -->
          <div class="dato-item" v-if="datos.Edad">
            <span class="dato-label">Edad:</span>
            <span class="dato-valor">{{ datos.Edad }} años</span>
          </div>

          <!-- Sexo -->
          <div class="dato-item" v-if="datos.Sexo">
            <span class="dato-label">Sexo:</span>
            <span class="dato-valor">{{ datos.Sexo === 'H' ? 'Hombre' : 'Mujer' }}</span>
          </div>

          <!-- Correo -->
          <div class="dato-item">
            <span class="dato-label">Correo:</span>
            <span class="dato-valor">{{ datos.Correo }}</span>
          </div>

          <!-- Teléfono -->
          <div class="dato-item">
            <span class="dato-label">Teléfono:</span>
            <span class="dato-valor">{{ datos.Telefono_cel }}</span>
          </div>

          <!-- Teléfono de Emergencia -->
          <div class="dato-item" v-if="datos.Telefono_emergencia">
            <span class="dato-label">Teléfono Emergencia:</span>
            <span class="dato-valor">{{ datos.Telefono_emergencia }}</span>
          </div>

          <!-- Especialidad (Doctor) -->
          <div class="dato-item" v-if="tipo === 'doctor' && datos.Especialidad">
            <span class="dato-label">Especialidad:</span>
            <span class="dato-valor">{{ datos.Especialidad }}</span>
          </div>

          <!-- Sueldo (Doctor/Recepcionista) -->
          <div class="dato-item" v-if="(tipo === 'doctor' || tipo === 'recepcionista') && datos.Sueldo">
            <span class="dato-label">Sueldo:</span>
            <span class="dato-valor">${{ Number(datos.Sueldo).toFixed(2) }}</span>
          </div>

          <!-- Username -->
          <div class="dato-item" v-if="datos.Username">
            <span class="dato-label">Usuario:</span>
            <span class="dato-valor">{{ datos.Username }}</span>
          </div>

          <!-- Estado Activo -->
          <div class="dato-item" v-if="datos.Activo !== undefined">
            <span class="dato-label">Estado:</span>
            <span class="dato-valor">
              <span v-if="datos.Activo === 1" class="badge bg-success">Activo</span>
              <span v-else class="badge bg-danger">Inactivo</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DatosPersonales',
  props: {
    datos: {
      type: Object,
      required: true
    },
    tipo: {
      type: String,
      enum: ['paciente', 'doctor', 'recepcionista'],
      required: true
    }
  },
  computed: {
    nombreCompleto() {
      const nombre = this.datos.Nombre || '';
      const paterno = this.datos.Paterno || '';
      const materno = this.datos.Materno || '';
      return `${nombre} ${paterno} ${materno}`.trim();
    }
  },
  methods: {
    formatDate(date) {
      if (!date) return '—';
      const d = new Date(date);
      return d.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }
};
</script>

<style scoped>
.datos-personales-card {
  margin-bottom: 20px;
}

.card {
  border: 1px solid #e1e1e1;
  border-radius: 8px;
}

.card-header {
  padding: 12px 16px;
  border-bottom: 1px solid #dee2e6;
}

.card-body {
  padding: 16px;
}

.datos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.dato-item {
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  border-left: 4px solid #0d6efd;
}

.dato-label {
  font-weight: 700;
  font-size: 0.85rem;
  color: #555;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dato-valor {
  font-size: 0.95rem;
  color: #222;
  word-break: break-word;
}

.badge {
  display: inline-block;
  width: fit-content;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.bg-success {
  background-color: #d1e7dd;
  color: #0f5132;
}

.bg-danger {
  background-color: #f8d7da;
  color: #842029;
}

@media (max-width: 768px) {
  .datos-grid {
    grid-template-columns: 1fr;
  }
}
</style>
