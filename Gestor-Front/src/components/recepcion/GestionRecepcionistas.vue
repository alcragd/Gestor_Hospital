<template>
  <div class="gestion-recepcionistas">
    <h2>Gestión de Recepcionistas</h2>
    
    <div class="tabs">
      <button 
        :class="{ active: tab === 'crear' }"
        @click="tab = 'crear'">
        Dar de Alta Recepcionista
      </button>
      <button 
        :class="{ active: tab === 'listar' }"
        @click="tab = 'listar'; cargarRecepcionistas();">
        Listar Recepcionistas
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
              <input v-model="formulario.Fecha_nac" type="date" required @change="calcularEdad">
            </div>
            <div class="form-group">
              <label>Edad</label>
              <input v-model.number="formulario.Edad" type="number" readonly>
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
            Las contraseñas no coinciden
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

    

    <div v-else-if="tab === 'listar'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="busqueda" 
          placeholder="Buscar por nombre o CURP..."
          @input="cargarRecepcionistas"
          type="text">
        <label class="toggle">
          <input type="checkbox" v-model="incluirInactivos" @change="cargarRecepcionistas">
          Incluir inactivos
        </label>
      </div>

      <div v-if="loading" class="loading">Cargando...</div>
      <div v-else-if="recepcionistas.length > 0" class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Estatus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in recepcionistas" :key="rec.Id_Empleado" :class="{ 'fila-inactiva': rec.Activo === false || rec.Activo === 0 }">
              <td>{{ rec.Nombre }} {{ rec.Paterno }}</td>
              <td>{{ rec.Correo }}</td>
              <td>{{ rec.Telefono_cel }}</td>
              <td>
                <span v-if="rec.Activo === false || rec.Activo === 0" class="badge inactivo">Inactivo</span>
                <span v-else class="badge activo">Activo</span>
              </td>
              <td>
                <button class="btn-view" @click="verDetalles(rec)">Ver</button>
                <button class="btn-edit" @click="editarRecepcionista(rec)" :disabled="rec.Activo === false || rec.Activo === 0">Editar</button>
                <button class="btn-danger" @click="darDeBajaRow(rec)" :disabled="rec.Activo === false || rec.Activo === 0">Dar de baja</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">No hay recepcionistas encontrados</div>

      <!-- Modal de detalles -->
      <div v-if="recSeleccionado" class="modal">
        <div class="modal-content">
          <span class="close" @click="recSeleccionado = null">&times;</span>
          <h3>Detalles de Recepcionista</h3>
          <div class="form-group">
            <label>Nombre Completo:</label>
            <p>{{ recSeleccionado.Nombre }} {{ recSeleccionado.Paterno }} {{ recSeleccionado.Materno }}</p>
          </div>
          <div class="form-group">
            <label>Correo:</label>
            <p>{{ recSeleccionado.Correo }}</p>
          </div>
          <div class="form-group">
            <label>Teléfono Celular:</label>
            <p>{{ recSeleccionado.Telefono_cel }}</p>
          </div>
          <div class="form-group">
            <label>CURP:</label>
            <p>{{ recSeleccionado.CURP }}</p>
          </div>
          <div class="form-group">
            <label>Sueldo:</label>
            <p>{{ recSeleccionado.Sueldo }}</p>
          </div>
          <div class="form-group">
            <label>Estatus:</label>
            <p>{{ (recSeleccionado.Activo === false || recSeleccionado.Activo === 0) ? 'Inactivo' : 'Activo' }}</p>
          </div>
        </div>
      </div>

      <!-- Modal de edición -->
      <div v-if="recEditando" class="modal">
        <div class="modal-content modal-large">
          <span class="close" @click="cerrarEdicion">&times;</span>
          <h3>Editar Recepcionista</h3>
          <form @submit.prevent="guardarEdicion">
            <div class="form-row">
              <div class="form-group">
                <label>Correo</label>
                <input v-model="formEditar.Correo" type="email">
              </div>
              <div class="form-group">
                <label>Teléfono Celular</label>
                <input v-model="formEditar.Telefono_cel" type="text">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Teléfono Emergencia</label>
                <input v-model="formEditar.Telefono_emergencia" type="text">
              </div>
              <div class="form-group">
                <label>Sueldo</label>
                <input v-model="formEditar.Sueldo" type="number" step="0.01">
              </div>
            </div>

            <div v-if="mensaje.error" class="error">{{ mensaje.error }}</div>
            <div v-if="mensaje.exito" class="success">{{ mensaje.exito }}</div>

            <div class="modal-actions">
              <button type="submit" class="btn-primary" :disabled="procesando">{{ procesando ? 'Guardando...' : 'Guardar cambios' }}</button>
              <button type="button" class="btn-secondary" @click="cerrarEdicion">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
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
      loading: false,
      incluirInactivos: false,
      busqueda: '',
      recepcionistas: [],
      recSeleccionado: null,
      recEditando: null,
      formEditar: {
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        Sueldo: ''
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
    calcularEdad() {
      if (!this.formulario.Fecha_nac) return;
      const birthDate = new Date(this.formulario.Fecha_nac);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      this.formulario.Edad = age;
    },
    verDetalles(rec) {
      this.recSeleccionado = rec;
    },
    editarRecepcionista(rec) {
      this.recEditando = rec;
      this.formEditar = {
        Correo: rec.Correo || '',
        Telefono_cel: rec.Telefono_cel || '',
        Telefono_emergencia: rec.Telefono_emergencia || '',
        Sueldo: rec.Sueldo || ''
      };
      this.mensaje.error = '';
      this.mensaje.exito = '';
    },
    async guardarEdicion() {
      if (!this.recEditando) return;
      this.procesando = true;
      this.mensaje = { error: '', exito: '' };
      try {
        const res = await RecepcionService.actualizarRecepcionista(this.recEditando.Id_Empleado, this.formEditar);
        this.mensaje.exito = res.message || 'Recepcionista actualizada';
        this.recEditando = null;
        await this.cargarRecepcionistas();
      } catch (error) {
        this.mensaje.error = '❌ Error al actualizar: ' + (error.message || 'No se pudo actualizar');
      } finally {
        this.procesando = false;
      }
    },
    cerrarEdicion() {
      this.recEditando = null;
    },
    async darDeBajaRow(rec) {
      const confirmar = window.confirm('Dar de baja a esta recepcionista?');
      if (!confirmar) return;
      this.procesando = true;
      this.mensaje = { error: '', exito: '' };
      try {
        const res = await RecepcionService.darDeBajaRecepcionista(rec.Id_Empleado);
        this.mensaje.exito = res.message || 'Recepcionista dada de baja';
        await this.cargarRecepcionistas();
      } catch (error) {
        this.mensaje.error = '❌ Error al dar de baja: ' + (error.message || 'No se pudo dar de baja');
      } finally {
        this.procesando = false;
      }
    },
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
    async cargarRecepcionistas() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarRecepcionistas(this.busqueda, this.incluirInactivos);
        this.recepcionistas = res.recepcionistas || [];
      } catch (error) {
        this.mensaje.error = '❌ Error al listar: ' + (error.message || 'No se pudo obtener recepcionistas');
      } finally {
        this.loading = false;
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

.btn-view, .btn-edit, .btn-danger {
  margin-right: 6px;
}
.btn-view {
  background: #6c757d;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-edit {
  background: #007bff;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-edit:disabled {
  background: #d6d6d6;
}
.btn-danger {
  background: #dc3545;
  color: #fff;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}
.btn-danger:disabled {
  background: #d6d6d6;
  cursor: not-allowed;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-content.modal-large {
  max-width: 800px;
}
.close {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  font-weight: bold;
  cursor: pointer;
  color: #999;
}
.close:hover {
  color: #000;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}
.btn-primary {
  background: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}
.btn-primary:hover { background: #0056b3; }
.btn-secondary { background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
.btn-secondary:hover { background: #5a6268; }

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

.search-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #555;
}

.tabla-container table {
  width: 100%;
  border-collapse: collapse;
}

.tabla-container th,
.tabla-container td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.badge.activo {
  background: #e6f4ea;
  color: #1e7e34;
}

.badge.inactivo {
  background: #fdecea;
  color: #c0392b;
}

.fila-inactiva {
  opacity: 0.75;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}
</style>
