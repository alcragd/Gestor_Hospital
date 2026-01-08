<template>
  <div class="gestion-especialidades">
    <h2>Gestión de Especialidades</h2>

    <div class="controles-top">
      <button @click="abrirNuevo" class="btn-agregar">+ Nueva Especialidad</button>
      <input
        v-model="busqueda"
        placeholder="Buscar por nombre, grado o consultorio..."
        type="text"
        class="search-input">
    </div>

    <!-- MODAL NUEVO/EDITAR ESPECIALIDAD -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editandoId ? 'Editar Especialidad' : 'Nueva Especialidad' }}</h4>
          <button class="btn-close" @click="cerrarFormulario">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="form.Nombre" type="text" class="form-control" placeholder="Ej: Cardiología">
          </div>

          <div class="form-group">
            <label>Grado *</label>
            <input v-model="form.Grado" type="text" class="form-control" placeholder="Ej: Especialidad, Subespecialidad">
          </div>

          <div class="form-group">
            <label>Precio (MXN) *</label>
            <input v-model.number="form.Precio" type="number" min="0" step="0.01" class="form-control">
          </div>

          <div class="form-group">
            <label>Consultorio *</label>
            <select v-model.number="form.ID_Consultorio" class="form-control">
              <option :value="null" disabled>Seleccione un consultorio</option>
              <option
                v-for="cons in consultoriosDisponibles"
                :key="cons.Id_Consultorio"
                :value="cons.Id_Consultorio">
                {{ `${cons.Numero} — Piso ${cons.Piso}${cons.Especialidad && cons.Id_Especialidad !== editandoId ? ' (ocupado)' : ''}` }}
              </option>
            </select>
            <small class="text-muted">Solo se listan consultorios libres o el actualmente asignado.</small>
          </div>

          <div v-if="error" class="alert-error">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarFormulario" class="btn-cancelar">Cancelar</button>
          <button @click="guardarEspecialidad" :disabled="guardando" class="btn-guardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE ESPECIALIDADES -->
    <div v-if="especialidadesFiltradas.length > 0" class="tabla-container">
      <p class="info-total">Total: <strong>{{ especialidadesFiltradas.length }} especialidades</strong></p>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Grado</th>
            <th>Precio</th>
            <th>Consultorio</th>
            <th>Doctores</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="esp in especialidadesFiltradas" :key="esp.Id_Especialidad">
            <td><strong>{{ esp.Nombre }}</strong></td>
            <td>{{ esp.Grado }}</td>
            <td>${{ Number(esp.Precio || 0).toFixed(2) }}</td>
            <td>
              <span v-if="esp.ConsultorioNumero">{{ esp.ConsultorioNumero }} (Piso {{ esp.ConsultorioPiso }})</span>
              <span v-else class="badge badge-error">Sin consultorio</span>
            </td>
            <td>{{ esp.DoctoresAsignados || 0 }}</td>
            <td class="acciones">
              <button @click="editarEspecialidad(esp)" class="btn-edit" title="Editar">✎</button>
              <button
                @click="eliminarEspecialidad(esp)"
                class="btn-delete"
                :disabled="(esp.DoctoresAsignados || 0) > 0"
                :title="(esp.DoctoresAsignados || 0) > 0 ? 'No se puede borrar: tiene doctores' : 'Eliminar'">
                🗑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">No hay especialidades registradas</div>

    <div v-if="mensaje" class="alert" :class="isError ? 'alert-error' : 'alert-success'">
      {{ mensaje }}
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionEspecialidades',
  data() {
    return {
      especialidades: [],
      consultorios: [],
      busqueda: '',
      mostrarFormulario: false,
      editandoId: null,
      form: {
        Nombre: '',
        Grado: '',
        Precio: 0,
        ID_Consultorio: null
      },
      guardando: false,
      error: '',
      mensaje: '',
      isError: false
    };
  },
  computed: {
    especialidadesFiltradas() {
      if (!this.busqueda.trim()) return this.especialidades;
      const q = this.busqueda.toLowerCase();
      return this.especialidades.filter(e =>
        (e.Nombre || '').toLowerCase().includes(q) ||
        (e.Grado || '').toLowerCase().includes(q) ||
        String(e.ConsultorioNumero || '').toLowerCase().includes(q)
      );
    },
    consultoriosDisponibles() {
      return this.consultorios.filter(c => !c.Id_Especialidad || c.Id_Especialidad === this.editandoId);
    }
  },
  mounted() {
    this.recargarTodo();
  },
  methods: {
    async recargarTodo() {
      try {
        await Promise.all([this.cargarConsultorios(), this.cargarEspecialidades()]);
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    async cargarConsultorios() {
      try {
        const res = await RecepcionService.listarConsultorios();
        this.consultorios = res.consultorios || [];
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    async cargarEspecialidades() {
      try {
        const res = await RecepcionService.listarEspecialidades();
        this.especialidades = res.especialidades || [];
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    abrirNuevo() {
      this.editandoId = null;
      this.form = { Nombre: '', Grado: '', Precio: 0, ID_Consultorio: null };
      this.mostrarFormulario = true;
    },
    editarEspecialidad(esp) {
      this.editandoId = esp.Id_Especialidad;
      this.form = {
        Nombre: esp.Nombre,
        Grado: esp.Grado,
        Precio: esp.Precio,
        ID_Consultorio: esp.ID_Consultorio
      };
      this.mostrarFormulario = true;
    },
    async guardarEspecialidad() {
      this.error = '';
      if (!this.form.Nombre || !this.form.Grado || this.form.Precio === null || this.form.Precio === undefined || !this.form.ID_Consultorio) {
        this.error = 'Complete los campos obligatorios';
        return;
      }

      this.guardando = true;
      try {
        if (this.editandoId) {
          await RecepcionService.actualizarEspecialidad(this.editandoId, this.form);
          this.mostrarMensaje('Especialidad actualizada correctamente');
        } else {
          await RecepcionService.crearEspecialidad(this.form);
          this.mostrarMensaje('Especialidad creada correctamente');
        }
        this.cerrarFormulario();
        await this.recargarTodo();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.guardando = false;
      }
    },
    async eliminarEspecialidad(esp) {
      if ((esp.DoctoresAsignados || 0) > 0) {
        this.mostrarMensaje('No se puede eliminar: hay doctores asignados', true);
        return;
      }
      if (!confirm('¿Eliminar esta especialidad?')) return;

      try {
        await RecepcionService.eliminarEspecialidad(esp.Id_Especialidad);
        this.mostrarMensaje('Especialidad eliminada');
        await this.recargarTodo();
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.editandoId = null;
      this.form = { Nombre: '', Grado: '', Precio: 0, ID_Consultorio: null };
      this.error = '';
    },
    mostrarMensaje(texto, error = false) {
      this.mensaje = texto;
      this.isError = error;
      setTimeout(() => {
        this.mensaje = '';
      }, 3000);
    }
  }
};
</script>

<style scoped>
.gestion-especialidades {
  padding: 20px;
  min-width: 980px;
}

@media (max-width: 980px) {
  .gestion-especialidades {
    min-width: auto;
  }
}

.controles-top {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn-agregar {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
}

.btn-agregar:hover {
  background-color: #218838;
}

.search-input {
  flex: 1;
  min-width: 240px;
  padding: 10px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.tabla-container {
  overflow-x: auto;
  background: #fff;
  border: 1px solid #e1e1e1;
  border-radius: 6px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  padding: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

table th, table td {
  padding: 10px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

table th {
  background: #f8f9fa;
  font-weight: 700;
}

.info-total {
  font-size: 0.95rem;
  color: #555;
  margin-bottom: 10px;
}

.acciones {
  display: flex;
  gap: 8px;
}

.btn-edit, .btn-delete {
  border: none;
  padding: 6px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit {
  background: #0d6efd;
  color: white;
}

.btn-delete {
  background: #dc3545;
  color: white;
}

.btn-delete:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #777;
}

.alert {
  margin-top: 15px;
  padding: 10px 12px;
  border-radius: 4px;
}

.alert-success {
  background: #d1e7dd;
  color: #0f5132;
}

.alert-error {
  background: #f8d7da;
  color: #842029;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: #fff;
  border-radius: 8px;
  width: 460px;
  max-width: 95vw;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.modal-header, .modal-footer {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer {
  border-top: 1px solid #eee;
  border-bottom: none;
}

.modal-body {
  padding: 14px 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-control {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
}

.btn-cancelar, .btn-guardar {
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-cancelar {
  background: #e9ecef;
}

.btn-guardar {
  background: #0d6efd;
  color: white;
}

.text-muted {
  color: #6c757d;
  font-size: 0.85rem;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  background: #f1f1f1;
}

.badge-error {
  background: #f8d7da;
  color: #842029;
}
</style>
