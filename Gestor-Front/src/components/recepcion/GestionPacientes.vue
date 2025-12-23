<template>
  <div class="gestion-pacientes">
    <h2>Gestión de Pacientes</h2>
    
    <div class="tabs">
      <button 
        :class="{ active: tab === 'listar' }"
        @click="tab = 'listar'">
        Listar Pacientes
      </button>
      <button 
        :class="{ active: tab === 'crear' }"
        @click="tab = 'crear'">
        Crear Paciente
      </button>
      <button 
        :class="{ active: tab === 'editar' }"
        @click="tab = 'editar'">
        Editar Paciente
      </button>
    </div>

    <!-- LISTAR PACIENTES -->
    <div v-if="tab === 'listar'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="busqueda" 
          placeholder="Buscar por nombre, paterno o DNI..."
          @input="buscarPacientes"
          type="text">
        <button @click="buscarPacientes">Buscar</button>
      </div>

      <div v-if="loading" class="loading">Cargando...</div>
      <div v-else-if="pacientes.length > 0" class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Paterno</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Edad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="paciente in pacientes" :key="paciente.ID_Paciente">
              <td>{{ paciente.ID_Paciente }}</td>
              <td>{{ paciente.Nombre }}</td>
              <td>{{ paciente.Paterno }}</td>
              <td>{{ paciente.DNI.trim() }}</td>
              <td>{{ paciente.Telefono_cel }}</td>
              <td>{{ paciente.Edad }}</td>
              <td>
                <button class="btn-view" @click="verDetalles(paciente)">Ver</button>
                <button class="btn-edit" @click="editarPaciente(paciente)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">No hay pacientes encontrados</div>

      <!-- Modal de detalles -->
      <div v-if="pacienteSeleccionado" class="modal">
        <div class="modal-content">
          <span class="close" @click="pacienteSeleccionado = null">&times;</span>
          <h3>Detalles del Paciente</h3>
          <div class="form-group">
            <label>Nombre:</label>
            <p>{{ pacienteSeleccionado.Nombre }} {{ pacienteSeleccionado.Paterno }} {{ pacienteSeleccionado.Materno }}</p>
          </div>
          <div class="form-group">
            <label>DNI:</label>
            <p>{{ pacienteSeleccionado.DNI.trim() }}</p>
          </div>
          <div class="form-group">
            <label>Fecha Nacimiento:</label>
            <p>{{ new Date(pacienteSeleccionado.Fecha_nac).toLocaleDateString() }}</p>
          </div>
          <div class="form-group">
            <label>Correo:</label>
            <p>{{ pacienteSeleccionado.Correo }}</p>
          </div>
          <div class="form-group">
            <label>Teléfono Celular:</label>
            <p>{{ pacienteSeleccionado.Telefono_cel }}</p>
          </div>
          <div class="form-group">
            <label>Teléfono Emergencia:</label>
            <p>{{ pacienteSeleccionado.Telefono_emergencia }}</p>
          </div>
          <div class="form-group">
            <label>Edad:</label>
            <p>{{ pacienteSeleccionado.Edad }}</p>
          </div>
          <div class="form-group">
            <label>Sexo:</label>
            <p>{{ pacienteSeleccionado.Sexo === 'H' ? 'Hombre' : 'Mujer' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- CREAR PACIENTE -->
    <div v-if="tab === 'crear'" class="tab-content">
      <form @submit.prevent="crearNuevoPaciente">
        <div class="form-row">
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="formNuevo.Nombre" type="text" required>
          </div>
          <div class="form-group">
            <label>Paterno *</label>
            <input v-model="formNuevo.Paterno" type="text" required>
          </div>
          <div class="form-group">
            <label>Materno</label>
            <input v-model="formNuevo.Materno" type="text">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>DNI *</label>
            <input v-model="formNuevo.DNI" type="text" required>
          </div>
          <div class="form-group">
            <label>Fecha Nacimiento *</label>
            <input v-model="formNuevo.Fecha_nac" type="date" required>
          </div>
          <div class="form-group">
            <label>Edad *</label>
            <input v-model="formNuevo.Edad" type="number" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Sexo *</label>
            <select v-model="formNuevo.Sexo" required>
              <option value="">Seleccionar...</option>
              <option value="H">Hombre</option>
              <option value="M">Mujer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Correo *</label>
            <input v-model="formNuevo.Correo" type="email" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Teléfono Celular *</label>
            <input v-model="formNuevo.Telefono_cel" type="text" required>
          </div>
          <div class="form-group">
            <label>Teléfono Emergencia</label>
            <input v-model="formNuevo.Telefono_emergencia" type="text">
          </div>
        </div>

        <div class="form-group checkbox">
          <label>
            <input v-model="formNuevo.crearUsuario" type="checkbox">
            Crear usuario para el paciente
          </label>
        </div>

        <div v-if="formNuevo.crearUsuario" class="form-row">
          <div class="form-group">
            <label>Username *</label>
            <input v-model="formNuevo.Username" type="text" required>
          </div>
          <div class="form-group">
            <label>Password *</label>
            <input v-model="formNuevo.Password" type="password" required>
          </div>
        </div>

        <div v-if="mensajeError" class="error">{{ mensajeError }}</div>
        <div v-if="mensajeExito" class="success">{{ mensajeExito }}</div>

        <button type="submit" :disabled="cargando">{{ cargando ? 'Creando...' : 'Crear Paciente' }}</button>
      </form>
    </div>

    <!-- EDITAR PACIENTE -->
    <div v-if="tab === 'editar'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="busquedaEditar" 
          placeholder="Buscar paciente a editar..."
          @input="buscarPacientesEditar"
          type="text">
      </div>

      <div v-if="pacientesEditar.length > 0" class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="paciente in pacientesEditar" :key="paciente.ID_Paciente">
              <td>{{ paciente.ID_Paciente }}</td>
              <td>{{ paciente.Nombre }} {{ paciente.Paterno }}</td>
              <td>{{ paciente.DNI.trim() }}</td>
              <td>{{ paciente.Telefono_cel }}</td>
              <td>
                <button class="btn-edit" @click="seleccionarPacienteEditar(paciente)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="pacienteParaEditar" class="form-editar">
        <h3>Editar datos de {{ pacienteParaEditar.Nombre }}</h3>
        <form @submit.prevent="guardarCambios">
          <div class="form-group">
            <label>Correo</label>
            <input v-model="pacienteParaEditar.Correo" type="email">
          </div>
          <div class="form-group">
            <label>Teléfono Celular</label>
            <input v-model="pacienteParaEditar.Telefono_cel" type="text">
          </div>
          <div class="form-group">
            <label>Teléfono Emergencia</label>
            <input v-model="pacienteParaEditar.Telefono_emergencia" type="text">
          </div>

          <div v-if="mensajeError" class="error">{{ mensajeError }}</div>
          <div v-if="mensajeExito" class="success">{{ mensajeExito }}</div>

          <button type="submit" :disabled="cargando">{{ cargando ? 'Guardando...' : 'Guardar Cambios' }}</button>
          <button type="button" @click="pacienteParaEditar = null">Cancelar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionPacientes',
  data() {
    return {
      tab: 'listar',
      pacientes: [],
      pacientesEditar: [],
      pacienteSeleccionado: null,
      pacienteParaEditar: null,
      busqueda: '',
      busquedaEditar: '',
      loading: false,
      cargando: false,
      mensajeError: '',
      mensajeExito: '',
      formNuevo: {
        Nombre: '',
        Paterno: '',
        Materno: '',
        DNI: '',
        Fecha_nac: '',
        Edad: '',
        Sexo: '',
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        crearUsuario: false,
        Username: '',
        Password: ''
      }
    };
  },
  mounted() {
    this.cargarPacientes();
  },
  methods: {
    async cargarPacientes() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarPacientes();
        this.pacientes = res.pacientes || [];
      } catch (error) {
        this.mensajeError = 'Error al cargar pacientes: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    async buscarPacientes() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarPacientes(this.busqueda);
        this.pacientes = res.pacientes || [];
      } catch (error) {
        this.mensajeError = 'Error en búsqueda: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    async buscarPacientesEditar() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarPacientes(this.busquedaEditar);
        this.pacientesEditar = res.pacientes || [];
      } catch (error) {
        this.mensajeError = 'Error en búsqueda: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    verDetalles(paciente) {
      this.pacienteSeleccionado = paciente;
    },
    editarPaciente(paciente) {
      this.tab = 'editar';
      this.busquedaEditar = paciente.DNI.trim();
      this.buscarPacientesEditar();
      setTimeout(() => {
        this.seleccionarPacienteEditar(paciente);
      }, 500);
    },
    seleccionarPacienteEditar(paciente) {
      this.pacienteParaEditar = JSON.parse(JSON.stringify(paciente));
    },
    async crearNuevoPaciente() {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      try {
        const data = {
          Nombre: this.formNuevo.Nombre,
          Paterno: this.formNuevo.Paterno,
          Materno: this.formNuevo.Materno || null,
          DNI: this.formNuevo.DNI,
          Fecha_nac: this.formNuevo.Fecha_nac,
          Edad: parseInt(this.formNuevo.Edad),
          Sexo: this.formNuevo.Sexo,
          Correo: this.formNuevo.Correo,
          Telefono_cel: this.formNuevo.Telefono_cel,
          Telefono_emergencia: this.formNuevo.Telefono_emergencia || null,
          crearUsuario: this.formNuevo.crearUsuario,
          ...(this.formNuevo.crearUsuario && {
            Username: this.formNuevo.Username,
            Password: this.formNuevo.Password
          })
        };

        const res = await RecepcionService.crearPaciente(data);
        this.mensajeExito = 'Paciente creado exitosamente (ID: ' + res.paciente.ID_Paciente + ')';
        this.formNuevo = {
          Nombre: '',
          Paterno: '',
          Materno: '',
          DNI: '',
          Fecha_nac: '',
          Edad: '',
          Sexo: '',
          Correo: '',
          Telefono_cel: '',
          Telefono_emergencia: '',
          crearUsuario: false,
          Username: '',
          Password: ''
        };
        setTimeout(() => this.tab = 'listar', 2000);
      } catch (error) {
        this.mensajeError = error.message;
      } finally {
        this.cargando = false;
      }
    },
    async guardarCambios() {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      try {
        const data = {
          Correo: this.pacienteParaEditar.Correo,
          Telefono_cel: this.pacienteParaEditar.Telefono_cel,
          Telefono_emergencia: this.pacienteParaEditar.Telefono_emergencia
        };

        await RecepcionService.actualizarPaciente(this.pacienteParaEditar.ID_Paciente, data);
        this.mensajeExito = 'Paciente actualizado exitosamente';
        this.pacienteParaEditar = null;
        this.buscarPacientesEditar();
      } catch (error) {
        this.mensajeError = error.message;
      } finally {
        this.cargando = false;
      }
    }
  }
};
</script>

<style scoped>
.gestion-pacientes {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e0e0e0;
}

.tabs button {
  padding: 12px 20px;
  background: #f5f5f5;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s;
}

.tabs button.active {
  background: #007bff;
  color: white;
}

.tabs button:hover {
  background: #0056b3;
  color: white;
}

.tab-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-bar input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar button {
  padding: 10px 20px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.tabla-container {
  overflow-x: auto;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

table thead {
  background: #f8f9fa;
}

table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: #333;
  border-bottom: 2px solid #ddd;
}

table td {
  padding: 12px;
  border-bottom: 1px solid #eee;
}

table tbody tr:hover {
  background: #f9f9f9;
}

.btn-view, .btn-edit {
  padding: 6px 12px;
  margin-right: 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-view {
  background: #17a2b8;
  color: white;
}

.btn-edit {
  background: #ffc107;
  color: black;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox label {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-group.checkbox input {
  width: auto;
}

button[type="submit"] {
  background: #28a745;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

button[type="submit"]:hover {
  background: #218838;
}

button[type="submit"]:disabled {
  background: #ccc;
  cursor: not-allowed;
}

button[type="button"] {
  background: #6c757d;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px;
}

.error, .success {
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

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
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

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.modal-content .form-group p {
  margin: 5px 0;
  color: #666;
}

.form-editar {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 4px;
  margin-top: 20px;
}

.form-editar h3 {
  margin-top: 0;
}
</style>
