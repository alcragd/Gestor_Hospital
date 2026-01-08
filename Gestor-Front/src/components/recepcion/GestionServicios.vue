<template>
  <div class="gestion-servicios">
    <h2>Gestión de Servicios</h2>

    <div class="controles-top">
      <button @click="mostrarFormulario = true" class="btn-agregar">+ Nuevo Servicio</button>
      <input 
        v-model="busqueda" 
        placeholder="Buscar servicio..." 
        type="text"
        class="search-input">
    </div>

    <!-- MODAL NUEVO/EDITAR SERVICIO -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editandoId ? 'Editar Servicio' : 'Nuevo Servicio' }}</h4>
          <button class="btn-close" @click="cerrarFormulario">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="form.Nombre" type="text" class="form-control" placeholder="Nombre del servicio">
          </div>

          <div class="form-group">
            <label>Descripción *</label>
            <textarea v-model="form.Descripcion" class="form-control" placeholder="Descripción del servicio" rows="3"></textarea>
          </div>

          <div class="form-group">
            <label>Precio (MXN) *</label>
            <input v-model.number="form.Precio" type="number" step="0.01" class="form-control">
          </div>

          <div v-if="error" class="alert-error">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarFormulario" class="btn-cancelar">Cancelar</button>
          <button @click="guardarServicio" :disabled="guardando" class="btn-guardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE SERVICIOS -->
    <div v-if="serviciosFiltrados.length > 0" class="tabla-container">
      <p class="info-total">Total: <strong>{{ serviciosFiltrados.length }} servicios</strong></p>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="srv in serviciosFiltrados" :key="srv.Id_Servicio">
            <td><strong>{{ srv.Nombre }}</strong></td>
            <td>{{ srv.Descripcion }}</td>
            <td>${{ srv.Precio.toFixed(2) }}</td>
            <td class="acciones">
              <button @click="editarServicio(srv)" class="btn-edit" title="Editar">✎</button>
              <button @click="eliminarServicio(srv.Id_Servicio)" class="btn-delete" title="Eliminar">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">No hay servicios registrados</div>

    <div v-if="mensaje" class="alert" :class="isError ? 'alert-error' : 'alert-success'">
      {{ mensaje }}
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionServicios',
  data() {
    return {
      servicios: [],
      busqueda: '',
      mostrarFormulario: false,
      editandoId: null,
      form: {
        Nombre: '',
        Descripcion: '',
        Precio: 0
      },
      guardando: false,
      error: '',
      mensaje: '',
      isError: false,
      cargando: false
    };
  },
  computed: {
    serviciosFiltrados() {
      if (!this.busqueda.trim()) return this.servicios;
      const q = this.busqueda.toLowerCase();
      return this.servicios.filter(s => 
        s.Nombre.toLowerCase().includes(q) ||
        s.Descripcion.toLowerCase().includes(q)
      );
    }
  },
  mounted() {
    this.cargarServicios();
  },
  methods: {
    async cargarServicios() {
      this.cargando = true;
      try {
        const res = await RecepcionService.listarServicios();
        this.servicios = res.servicios || [];
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      } finally {
        this.cargando = false;
      }
    },
    editarServicio(servicio) {
      this.editandoId = servicio.Id_Servicio;
      this.form = { ...servicio };
      this.mostrarFormulario = true;
    },
    async guardarServicio() {
      this.error = '';
      if (!this.form.Nombre || !this.form.Descripcion || this.form.Precio === undefined) {
        this.error = 'Complete los campos obligatorios';
        return;
      }

      this.guardando = true;
      try {
        if (this.editandoId) {
          await RecepcionService.actualizarServicio(this.editandoId, this.form);
          this.mostrarMensaje('Servicio actualizado correctamente');
        } else {
          await RecepcionService.crearServicio(this.form);
          this.mostrarMensaje('Servicio creado correctamente');
        }
        this.cerrarFormulario();
        await this.cargarServicios();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.guardando = false;
      }
    },
    async eliminarServicio(id) {
      if (!confirm('¿Eliminar este servicio?')) return;

      try {
        await RecepcionService.eliminarServicio(id);
        this.mostrarMensaje('Servicio eliminado');
        await this.cargarServicios();
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.editandoId = null;
      this.form = { Nombre: '', Descripcion: '', Precio: 0 };
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
.gestion-servicios {
  padding: 20px;
  min-width: 980px;
}

@media (max-width: 980px) {
  .gestion-servicios {
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
  padding: 10px 15px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  min-width: 300px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h4 {
  margin: 0;
  font-size: 1.2rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
}

.btn-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 60vh;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 0.9rem;
}

.form-control {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
  box-sizing: border-box;
  font-family: inherit;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.alert-error {
  color: #721c24;
  background-color: #f8d7da;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-cancelar,
.btn-guardar {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-cancelar {
  background-color: #6c757d;
  color: white;
}

.btn-cancelar:hover {
  background-color: #5a6268;
}

.btn-guardar {
  background-color: #007bff;
  color: white;
}

.btn-guardar:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-guardar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tabla-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
  margin-top: 15px;
}

table thead {
  background-color: #f8f9fa;
}

table th,
table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

table th {
  font-weight: 600;
  color: #333;
}

table tbody tr:hover {
  background-color: #f5f5f5;
}

table tbody tr.no-disponible {
  opacity: 0.6;
}

.badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: white;
  font-weight: 600;
}

.badge-success {
  background-color: #28a745;
}

.badge-danger {
  background-color: #dc3545;
}

.acciones {
  text-align: center;
}

.btn-edit,
.btn-delete {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  margin: 0 5px;
}

.btn-edit:hover {
  color: #007bff;
}

.btn-delete:hover {
  color: #dc3545;
}

.info-total {
  margin-bottom: 15px;
  font-size: 1rem;
  color: #333;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

.alert {
  padding: 12px 16px;
  border-radius: 4px;
  margin-top: 15px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
}
</style>
