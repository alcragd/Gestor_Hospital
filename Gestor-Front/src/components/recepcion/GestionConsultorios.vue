<template>
  <div class="gestion-consultorios">
    <h2>Gestión de Consultorios</h2>

    <div class="controles-top">
      <button @click="mostrarFormulario = true" class="btn-agregar">+ Nuevo Consultorio</button>
      <input
        v-model="busqueda"
        placeholder="Buscar por número, piso o especialidad..."
        type="text"
        class="search-input">
    </div>

    <!-- MODAL NUEVO/EDITAR CONSULTORIO -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editandoId ? 'Editar Consultorio' : 'Nuevo Consultorio' }}</h4>
          <button class="btn-close" @click="cerrarFormulario">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Número *</label>
            <input v-model.number="form.Numero" type="number" min="1" class="form-control" placeholder="Ej: 101">
          </div>

          <div class="form-group">
            <label>Piso *</label>
            <input v-model="form.Piso" type="text" class="form-control" placeholder="Ej: 1, PB, 2A">
          </div>

          <div v-if="error" class="alert-error">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarFormulario" class="btn-cancelar">Cancelar</button>
          <button @click="guardarConsultorio" :disabled="guardando" class="btn-guardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE CONSULTORIOS -->
    <div v-if="consultoriosFiltrados.length > 0" class="tabla-container">
      <p class="info-total">Total: <strong>{{ consultoriosFiltrados.length }} consultorios</strong></p>
      <table>
        <thead>
          <tr>
            <th>Número</th>
            <th>Piso</th>
            <th>Especialidad asignada</th>
            <th>Doctores</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cons in consultoriosFiltrados" :key="cons.Id_Consultorio">
            <td><strong>{{ cons.Numero }}</strong></td>
            <td>{{ cons.Piso }}</td>
            <td>
              <span v-if="cons.Especialidad">{{ cons.Especialidad }}</span>
              <span v-else class="badge badge-free">Libre</span>
            </td>
            <td>{{ cons.DoctoresAsignados || 0 }}</td>
            <td class="acciones">
              <button @click="editarConsultorio(cons)" class="btn-edit" title="Editar">✎</button>
              <button
                @click="eliminarConsultorio(cons)"
                class="btn-delete"
                :disabled="cons.Id_Especialidad"
                :title="cons.Id_Especialidad ? 'No se puede borrar: consultorio asignado' : 'Eliminar'">
                🗑
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">No hay consultorios registrados</div>

    <div v-if="mensaje" class="alert" :class="isError ? 'alert-error' : 'alert-success'">
      {{ mensaje }}
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionConsultorios',
  data() {
    return {
      consultorios: [],
      busqueda: '',
      mostrarFormulario: false,
      editandoId: null,
      form: {
        Numero: '',
        Piso: ''
      },
      guardando: false,
      error: '',
      mensaje: '',
      isError: false
    };
  },
  computed: {
    consultoriosFiltrados() {
      if (!this.busqueda.trim()) return this.consultorios;
      const q = this.busqueda.toLowerCase();
      return this.consultorios.filter(c =>
        String(c.Numero).toLowerCase().includes(q) ||
        (c.Piso || '').toLowerCase().includes(q) ||
        (c.Especialidad || '').toLowerCase().includes(q)
      );
    }
  },
  mounted() {
    this.cargarConsultorios();
  },
  methods: {
    async cargarConsultorios() {
      try {
        const res = await RecepcionService.listarConsultorios();
        this.consultorios = res.consultorios || [];
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    editarConsultorio(cons) {
      this.editandoId = cons.Id_Consultorio;
      this.form = {
        Numero: cons.Numero,
        Piso: cons.Piso
      };
      this.mostrarFormulario = true;
    },
    async guardarConsultorio() {
      this.error = '';
      if (!this.form.Numero || !this.form.Piso) {
        this.error = 'Complete los campos obligatorios';
        return;
      }

      this.guardando = true;
      try {
        if (this.editandoId) {
          await RecepcionService.actualizarConsultorio(this.editandoId, this.form);
          this.mostrarMensaje('Consultorio actualizado correctamente');
        } else {
          await RecepcionService.crearConsultorio(this.form);
          this.mostrarMensaje('Consultorio creado correctamente');
        }
        this.cerrarFormulario();
        await this.cargarConsultorios();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.guardando = false;
      }
    },
    async eliminarConsultorio(cons) {
      if (cons.Id_Especialidad) {
        this.mostrarMensaje('No se puede eliminar un consultorio asignado a una especialidad', true);
        return;
      }
      if (!confirm('¿Eliminar este consultorio?')) return;

      try {
        await RecepcionService.eliminarConsultorio(cons.Id_Consultorio);
        this.mostrarMensaje('Consultorio eliminado');
        await this.cargarConsultorios();
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.editandoId = null;
      this.form = { Numero: '', Piso: '' };
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
.gestion-consultorios {
  padding: 20px;
  min-width: 980px;
}

@media (max-width: 980px) {
  .gestion-consultorios {
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
  width: 420px;
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

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  background: #f1f1f1;
}

.badge-free {
  background: #d1e7dd;
  color: #0f5132;
}
</style>
