<template>
  <div class="gestion-recepcionistas">
    <h2>Gestión de Recepcionistas</h2>
    
    <div class="tabs">
      <button 
        :class="{ active: tab === 'crear' }"
        @click="tab = 'crear'">
        Dar de Alta Recepcionista
      </button>
    </div>

    <!-- CREAR RECEPCIONISTA -->
    <div v-if="tab === 'crear'" class="tab-content">
      <form @submit.prevent="crearRecepcionista" class="form-container">
        <h3>Registrar Nueva Recepcionista</h3>

        <div v-if="mensaje.error" class="error">{{ mensaje.error }}</div>
        <div v-if="mensaje.exito" class="success">{{ mensaje.exito }}</div>

        <!-- DATOS PERSONALES -->
        <fieldset>
          <legend>Datos Personales</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label>Nombre *</label>
              <input v-model="formulario.Nombre" type="text" required>
            </div>
            <div class="form-group">
              <label>Apellido Paterno *</label>
              <input v-model="formulario.Paterno" type="text" required>
            </div>
            <div class="form-group">
              <label>Apellido Materno</label>
              <input v-model="formulario.Materno" type="text">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>CURP *</label>
              <input v-model="formulario.CURP" type="text" placeholder="Ej: ABC123..." required>
            </div>
            <div class="form-group">
              <label>Fecha de Nacimiento *</label>
              <input v-model="formulario.Fecha_nac" type="date" required>
            </div>
            <div class="form-group">
              <label>Edad *</label>
              <input v-model.number="formulario.Edad" type="number" min="18" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Sexo *</label>
              <select v-model="formulario.Sexo" required>
                <option value="">Seleccionar...</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div class="form-group">
              <label>Correo *</label>
              <input v-model="formulario.Correo" type="email" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Teléfono Celular *</label>
              <input v-model="formulario.Telefono_cel" type="tel" required>
            </div>
            <div class="form-group">
              <label>Teléfono de Emergencia</label>
              <input v-model="formulario.Telefono_emergencia" type="tel">
            </div>
          </div>
        </fieldset>

        <!-- DATOS LABORALES -->
        <fieldset>
          <legend>Datos Laborales</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label>Sueldo Mensual *</label>
              <input v-model.number="formulario.Sueldo" type="number" min="0" step="0.01" required>
            </div>
            <div class="form-group">
              <label>Puesto *</label>
              <input v-model="formulario.Puesto" type="text" placeholder="Recepcionista" required>
            </div>
          </div>
        </fieldset>

        <!-- CREDENCIALES -->
        <fieldset>
          <legend>Credenciales de Acceso</legend>
          
          <div class="form-row">
            <div class="form-group">
              <label>Nombre de Usuario *</label>
              <input v-model="formulario.Username" type="text" placeholder="Nombre único" required>
            </div>
            <div class="form-group">
              <label>Contraseña *</label>
              <input v-model="formulario.Password" type="password" placeholder="Contraseña segura" required>
            </div>
            <div class="form-group">
              <label>Confirmar Contraseña *</label>
              <input v-model="formulario.PasswordConfirm" type="password" placeholder="Confirmar contraseña" required>
            </div>
          </div>

          <div v-if="formulario.Password !== formulario.PasswordConfirm" class="warning">
            ⚠️ Las contraseñas no coinciden
          </div>
        </fieldset>

        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="procesando || formulario.Password !== formulario.PasswordConfirm"
            class="btn-submit">
            {{ procesando ? 'Registrando...' : 'Dar de Alta' }}
          </button>
          <button 
            type="button" 
            @click="limpiarFormulario"
            class="btn-cancel">
            Limpiar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionRecepcionistas',
  data() {
    return {
      tab: 'crear',
      procesando: false,
      mensaje: {
        error: '',
        exito: ''
      },
      formulario: {
        Nombre: '',
        Paterno: '',
        Materno: '',
        CURP: '',
        Fecha_nac: '',
        Edad: '',
        Sexo: '',
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        Sueldo: '',
        Puesto: 'Recepcionista',
        Username: '',
        Password: '',
        PasswordConfirm: ''
      }
    };
  },
  methods: {
    async crearRecepcionista() {
      // Validar contraseñas
      if (this.formulario.Password !== this.formulario.PasswordConfirm) {
        this.mensaje.error = 'Las contraseñas no coinciden';
        return;
      }

      if (this.formulario.Password.length < 6) {
        this.mensaje.error = 'La contraseña debe tener al menos 6 caracteres';
        return;
      }

      this.procesando = true;
      this.mensaje = { error: '', exito: '' };

      try {
        const datos = {
          Nombre: this.formulario.Nombre,
          Paterno: this.formulario.Paterno,
          Materno: this.formulario.Materno || null,
          CURP: this.formulario.CURP,
          Fecha_nac: this.formulario.Fecha_nac,
          Edad: this.formulario.Edad,
          Sexo: this.formulario.Sexo,
          Correo: this.formulario.Correo,
          Telefono_cel: this.formulario.Telefono_cel,
          Telefono_emergencia: this.formulario.Telefono_emergencia || null,
          Sueldo: this.formulario.Sueldo,
          Puesto: this.formulario.Puesto,
          Username: this.formulario.Username,
          Password: this.formulario.Password
        };

        const resultado = await RecepcionService.crearRecepcionista(datos);

        this.mensaje.exito = `✅ Recepcionista "${this.formulario.Nombre} ${this.formulario.Paterno}" registrada exitosamente`;
        this.limpiarFormulario();
      } catch (error) {
        this.mensaje.error = '❌ Error: ' + (error.message || 'No se pudo registrar la recepcionista');
        console.error('Error al crear recepcionista:', error);
      } finally {
        this.procesando = false;
      }
    },
    limpiarFormulario() {
      this.formulario = {
        Nombre: '',
        Paterno: '',
        Materno: '',
        CURP: '',
        Fecha_nac: '',
        Edad: '',
        Sexo: '',
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        Sueldo: '',
        Puesto: 'Recepcionista',
        Username: '',
        Password: '',
        PasswordConfirm: ''
      };
      this.mensaje = { error: '', exito: '' };
    }
  }
};
</script>

<style scoped>
.gestion-recepcionistas {
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 25px;
  font-size: 28px;
  font-weight: 600;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 2px solid #e0e0e0;
}

.tabs button {
  background: none;
  border: none;
  padding: 12px 20px;
  font-size: 15px;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tabs button:hover {
  color: #007bff;
}

.tabs button.active {
  color: #007bff;
  border-bottom-color: #007bff;
}

.tab-content {
  animation: fadeIn 0.3s;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.form-container {
  background: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  max-width: 900px;
}

.form-container h3 {
  color: #333;
  margin-bottom: 20px;
  font-size: 20px;
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 20px;
  margin-bottom: 20px;
}

legend {
  padding: 0 10px;
  color: #555;
  font-weight: 600;
  font-size: 14px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-group input,
.form-group select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-start;
  margin-top: 30px;
}

.btn-submit,
.btn-cancel {
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-submit {
  background: #28a745;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #218838;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-cancel {
  background: #6c757d;
  color: white;
}

.btn-cancel:hover {
  background: #5a6268;
}

.error,
.success,
.warning {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 14px;
}

.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.warning {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
