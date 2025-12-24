<template>
  <div class="gestion-doctores">
    <h2>Gestión de Doctores</h2>
    
    <div class="tabs">
      <button 
        :class="{ active: tab === 'listar' }"
        @click="tab = 'listar'">
        Listar Doctores
      </button>
      <button 
        :class="{ active: tab === 'crear' }"
        @click="tab = 'crear'">
        Crear Doctor
      </button>
    </div>

    <!-- LISTAR DOCTORES -->
    <div v-if="tab === 'listar'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="busqueda" 
          placeholder="Buscar por nombre o cédula..."
          @input="buscarDoctores"
          type="text">
        <select v-model="filtroEspecialidad" @change="buscarDoctores">
          <option value="">Todas las especialidades</option>
          <option value="1">Cardiología</option>
          <option value="2">Pediatría</option>
          <option value="3">Dermatología</option>
          <option value="4">Neurología</option>
          <option value="5">Oftalmología</option>
        </select>
      </div>

      <div v-if="loading" class="loading">Cargando...</div>
      <div v-else-if="doctores.length > 0" class="tabla-container">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Especialidad</th>
              <th>Cédula</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="doctor in doctores" :key="doctor.Id_Doctor">
              <td>{{ doctor.Nombre }} {{ doctor.Paterno }}</td>
              <td>{{ doctor.Especialidad }}</td>
              <td>{{ doctor.Cedula.trim() }}</td>
              <td>{{ doctor.Telefono_cel }}</td>
              <td>
                <button class="btn-view" @click="verDetalles(doctor)">Ver</button>
                <button class="btn-edit" @click="editarDoctor(doctor)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">No hay doctores encontrados</div>

      <!-- Modal de detalles -->
      <div v-if="doctorSeleccionado" class="modal">
        <div class="modal-content">
          <span class="close" @click="doctorSeleccionado = null">&times;</span>
          <h3>Detalles del Doctor</h3>
          <div class="form-group">
            <label>Nombre Completo:</label>
            <p>{{ doctorSeleccionado.Nombre }} {{ doctorSeleccionado.Paterno }} {{ doctorSeleccionado.Materno }}</p>
          </div>
          <div class="form-group">
            <label>Especialidad:</label>
            <p>{{ doctorSeleccionado.Especialidad }}</p>
          </div>
          <div class="form-group">
            <label>Cédula:</label>
            <p>{{ doctorSeleccionado.Cedula.trim() }}</p>
          </div>
          <div class="form-group">
            <label>RFC:</label>
            <p>{{ doctorSeleccionado.Rfc.trim() }}</p>
          </div>
          <div class="form-group">
            <label>Correo:</label>
            <p>{{ doctorSeleccionado.Correo }}</p>
          </div>
          <div class="form-group">
            <label>Teléfono Celular:</label>
            <p>{{ doctorSeleccionado.Telefono_cel }}</p>
          </div>
          <div class="form-group">
            <label>Consultorio:</label>
            <p>{{ doctorSeleccionado.NumConsultorio }}</p>
          </div>
          <div class="form-group">
            <label>Precio Consulta:</label>
            <p>${{ doctorSeleccionado.PrecioConsulta }}</p>
          </div>
        </div>
      </div>

      <!-- Modal de edición -->
      <div v-if="doctorEditando" class="modal">
        <div class="modal-content modal-large">
          <span class="close" @click="cerrarEdicion">&times;</span>
          <h3>Editar Doctor</h3>
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

            <div class="form-row">
              <div class="form-group">
                <label>Especialidad</label>
                <select v-model="formEditar.Id_Especialidad">
                  <option value="">Seleccionar...</option>
                  <option value="1">Cardiología</option>
                  <option value="2">Pediatría</option>
                  <option value="3">Dermatología</option>
                  <option value="4">Neurología</option>
                  <option value="5">Oftalmología</option>
                </select>
              </div>
            </div>

            <div v-if="mensajeErrorEdit" class="error">{{ mensajeErrorEdit }}</div>
            <div v-if="mensajeExitoEdit" class="success">{{ mensajeExitoEdit }}</div>

            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="cerrarEdicion">Cancelar</button>
              <button type="submit" class="btn-primary" :disabled="guardando">
                {{ guardando ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- CREAR DOCTOR -->
    <div v-if="tab === 'crear'" class="tab-content">
      <form @submit.prevent="crearNuevoDoctor">
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
            <label>CURP *</label>
            <input v-model="formNuevo.CURP" type="text" required>
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
            <label>Cédula *</label>
            <input v-model="formNuevo.Cedula" type="text" required>
          </div>
          <div class="form-group">
            <label>RFC *</label>
            <input v-model="formNuevo.Rfc" type="text" required>
          </div>
          <div class="form-group">
            <label>Sexo *</label>
            <select v-model="formNuevo.Sexo" required>
              <option value="">Seleccionar...</option>
              <option value="H">Hombre</option>
              <option value="M">Mujer</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Correo *</label>
            <input v-model="formNuevo.Correo" type="email" required>
          </div>
          <div class="form-group">
            <label>Teléfono Celular *</label>
            <input v-model="formNuevo.Telefono_cel" type="text" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Teléfono Emergencia</label>
            <input v-model="formNuevo.Telefono_emergencia" type="text">
          </div>
          <div class="form-group">
            <label>Sueldo *</label>
            <input v-model="formNuevo.Sueldo" type="number" step="0.01" required>
          </div>
          <div class="form-group">
            <label>Especialidad *</label>
            <select v-model="formNuevo.Id_Especialidad" required>
              <option value="">Seleccionar...</option>
              <option value="1">Cardiología</option>
              <option value="2">Pediatría</option>
              <option value="3">Dermatología</option>
              <option value="4">Neurología</option>
              <option value="5">Oftalmología</option>
            </select>
          </div>
        </div>

        <div class="form-group checkbox">
          <label>
            <input v-model="formNuevo.crearUsuario" type="checkbox">
            Crear usuario para el doctor
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

        <button type="submit" :disabled="cargando">{{ cargando ? 'Creando...' : 'Crear Doctor' }}</button>
      </form>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionDoctores',
  data() {
    return {
      tab: 'listar',
      doctores: [],
      doctorSeleccionado: null,
      doctorEditando: null,
      busqueda: '',
      filtroEspecialidad: '',
      loading: false,
      cargando: false,
      guardando: false,
      mensajeError: '',
      mensajeExito: '',
      mensajeErrorEdit: '',
      mensajeExitoEdit: '',
      formNuevo: {
        Nombre: '',
        Paterno: '',
        Materno: '',
        CURP: '',
        Fecha_nac: '',
        Edad: '',
        Cedula: '',
        Rfc: '',
        Sexo: '',
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        Sueldo: '',
        Id_Especialidad: '',
        crearUsuario: false,
        Username: '',
        Password: ''
      },
      formEditar: {
        Correo: '',
        Telefono_cel: '',
        Telefono_emergencia: '',
        Sueldo: '',
        Id_Especialidad: ''
      }
    };
  },
  mounted() {
    this.cargarDoctores();
  },
  methods: {
    async cargarDoctores() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarDoctores();
        this.doctores = res.doctores || [];
      } catch (error) {
        this.mensajeError = 'Error al cargar doctores: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    async buscarDoctores() {
      this.loading = true;
      try {
        const res = await RecepcionService.listarDoctores(this.filtroEspecialidad, this.busqueda);
        this.doctores = res.doctores || [];
      } catch (error) {
        this.mensajeError = 'Error en búsqueda: ' + error.message;
      } finally {
        this.loading = false;
      }
    },
    verDetalles(doctor) {
      this.doctorSeleccionado = doctor;
    },
    editarDoctor(doctor) {
      this.doctorEditando = doctor;
      this.formEditar = {
        Correo: doctor.Correo || '',
        Telefono_cel: doctor.Telefono_cel || '',
        Telefono_emergencia: doctor.Telefono_emergencia || '',
        Sueldo: doctor.Sueldo || '',
        Id_Especialidad: doctor.Id_Especialidad || ''
      };
      this.mensajeErrorEdit = '';
      this.mensajeExitoEdit = '';
    },
    cerrarEdicion() {
      this.doctorEditando = null;
      this.mensajeErrorEdit = '';
      this.mensajeExitoEdit = '';
    },
    async guardarEdicion() {
      this.guardando = true;
      this.mensajeErrorEdit = '';
      this.mensajeExitoEdit = '';
      
      try {
        const dataActualizar = {};
        
        if (this.formEditar.Correo) dataActualizar.Correo = this.formEditar.Correo;
        if (this.formEditar.Telefono_cel) dataActualizar.Telefono_cel = this.formEditar.Telefono_cel;
        if (this.formEditar.Telefono_emergencia) dataActualizar.Telefono_emergencia = this.formEditar.Telefono_emergencia;
        if (this.formEditar.Sueldo) dataActualizar.Sueldo = parseFloat(this.formEditar.Sueldo);
        if (this.formEditar.Id_Especialidad) dataActualizar.Id_Especialidad = parseInt(this.formEditar.Id_Especialidad);

        if (Object.keys(dataActualizar).length === 0) {
          this.mensajeErrorEdit = 'No hay cambios para guardar';
          this.guardando = false;
          return;
        }

        await RecepcionService.actualizarDoctor(this.doctorEditando.Id_Doctor, dataActualizar);
        this.mensajeExitoEdit = 'Doctor actualizado exitosamente';
        
        setTimeout(async () => {
          this.cerrarEdicion();
          await this.cargarDoctores();
        }, 1500);
        
      } catch (error) {
        this.mensajeErrorEdit = error.message;
      } finally {
        this.guardando = false;
      }
    },
    async crearNuevoDoctor() {
      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';
      try {
        const data = {
          Nombre: this.formNuevo.Nombre,
          Paterno: this.formNuevo.Paterno,
          Materno: this.formNuevo.Materno || null,
          CURP: this.formNuevo.CURP,
          Fecha_nac: this.formNuevo.Fecha_nac,
          Edad: parseInt(this.formNuevo.Edad),
          Cedula: this.formNuevo.Cedula,
          Rfc: this.formNuevo.Rfc,
          Sexo: this.formNuevo.Sexo,
          Correo: this.formNuevo.Correo,
          Telefono_cel: this.formNuevo.Telefono_cel,
          Telefono_emergencia: this.formNuevo.Telefono_emergencia || null,
          Sueldo: parseFloat(this.formNuevo.Sueldo),
          Id_Especialidad: parseInt(this.formNuevo.Id_Especialidad),
          ...(this.formNuevo.crearUsuario && {
            Username: this.formNuevo.Username,
            Password: this.formNuevo.Password
          })
        };

        const res = await RecepcionService.crearDoctor(data);
        this.mensajeExito = 'Doctor creado exitosamente (ID: ' + res.doctor.Id_Doctor + ')';
        this.formNuevo = {
          Nombre: '',
          Paterno: '',
          Materno: '',
          CURP: '',
          Fecha_nac: '',
          Edad: '',
          Cedula: '',
          Rfc: '',
          Sexo: '',
          Correo: '',
          Telefono_cel: '',
          Telefono_emergencia: '',
          Sueldo: '',
          Id_Especialidad: '',
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
    }
  }
};
</script>

<style scoped>
.gestion-doctores {
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

.search-bar input,
.search-bar select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar input {
  flex: 1;
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

.modal-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.modal-content .form-group p {
  margin: 5px 0;
  color: #666;
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

.btn-primary:hover {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #5a6268;
}
</style>
