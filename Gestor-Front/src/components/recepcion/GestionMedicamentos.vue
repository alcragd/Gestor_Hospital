<template>
  <div class="gestion-medicamentos">
    <h2>Gestión de Medicamentos</h2>

    <div class="controles-top">
      <button @click="mostrarFormulario = true" class="btn-agregar">+ Nuevo Medicamento</button>
      <input 
        v-model="busqueda" 
        placeholder="Buscar medicamento..." 
        type="text"
        class="search-input">
    </div>

    <!-- MODAL NUEVO/EDITAR MEDICAMENTO -->
    <div v-if="mostrarFormulario" class="modal-overlay" @click.self="cerrarFormulario">
      <div class="modal-content">
        <div class="modal-header">
          <h4>{{ editandoId ? 'Editar Medicamento' : 'Nuevo Medicamento' }}</h4>
          <button class="btn-close" @click="cerrarFormulario">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Nombre *</label>
            <input v-model="form.Nombre" type="text" class="form-control" placeholder="Nombre del medicamento">
          </div>

          <div class="form-group">
            <label>Presentación *</label>
            <input v-model="form.Presentacion" type="text" class="form-control" placeholder="Ej: Tabletas, Cápsula, Jarabe">
          </div>

          <div class="form-group">
            <label>Dosis *</label>
            <input v-model="form.Dosis" type="text" class="form-control" placeholder="Ej: 500mg, 250ml">
          </div>

          <div class="form-group">
            <label>Precio (MXN) *</label>
            <input v-model.number="form.Precio" type="number" step="0.01" class="form-control">
          </div>

          <div class="form-group">
            <label>Stock Inicial *</label>
            <input v-model.number="form.Stock" type="number" min="0" class="form-control">
          </div>

          <div class="form-group">
            <label>Stock Mínimo *</label>
            <input v-model.number="form.Stock_Minimo" type="number" min="0" class="form-control">
          </div>

          <div v-if="error" class="alert-error">{{ error }}</div>
        </div>
        <div class="modal-footer">
          <button @click="cerrarFormulario" class="btn-cancelar">Cancelar</button>
          <button @click="guardarMedicamento" :disabled="guardando" class="btn-guardar">
            {{ guardando ? 'Guardando...' : 'Guardar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- TABLA DE MEDICAMENTOS -->
    <div v-if="medicamentosFiltrados.length > 0" class="tabla-container">
      <p class="info-total">Total: <strong>{{ medicamentosFiltrados.length }} medicamentos</strong></p>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Presentación</th>
            <th>Dosis</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Stock Mín.</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="med in medicamentosFiltrados" :key="med.Id_Medicamento" :class="getEstadoClass(med)">
            <td><strong>{{ med.Nombre }}</strong></td>
            <td>{{ med.Presentacion }}</td>
            <td>{{ med.Dosis }}</td>
            <td>${{ med.Precio.toFixed(2) }}</td>
            <td class="stock-cell">
              <input 
                v-model.number="med.Stock" 
                type="number" 
                min="0"
                @change="actualizarStock(med)"
                class="stock-input">
            </td>
            <td>{{ med.Stock_Minimo }}</td>
            <td>
              <span class="badge" :class="getEstadoBadge(med)">
                {{ getEstadoLabel(med) }}
              </span>
            </td>
            <td class="acciones">
              <button @click="editarMedicamento(med)" class="btn-edit" title="Editar">✎</button>
              <button @click="eliminarMedicamento(med.Id_Medicamento)" class="btn-delete" title="Eliminar">🗑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="no-data">No hay medicamentos registrados</div>

    <div v-if="mensaje" class="alert" :class="isError ? 'alert-error' : 'alert-success'">
      {{ mensaje }}
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionMedicamentos',
  data() {
    return {
      medicamentos: [],
      busqueda: '',
      mostrarFormulario: false,
      editandoId: null,
      form: {
        Nombre: '',
        Presentacion: '',
        Dosis: '',
        Precio: 0,
        Stock: 0,
        Stock_Minimo: 0
      },
      guardando: false,
      error: '',
      mensaje: '',
      isError: false,
      cargando: false
    };
  },
  computed: {
    medicamentosFiltrados() {
      if (!this.busqueda.trim()) return this.medicamentos;
      const q = this.busqueda.toLowerCase();
      return this.medicamentos.filter(m => 
        m.Nombre.toLowerCase().includes(q) ||
        m.Presentacion.toLowerCase().includes(q) ||
        m.Dosis.toLowerCase().includes(q)
      );
    }
  },
  mounted() {
    this.cargarMedicamentos();
  },
  methods: {
    async cargarMedicamentos() {
      this.cargando = true;
      try {
        const res = await RecepcionService.listarMedicamentos();
        this.medicamentos = res.medicamentos || [];
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      } finally {
        this.cargando = false;
      }
    },
    editarMedicamento(medicamento) {
      this.editandoId = medicamento.Id_Medicamento;
      this.form = { ...medicamento };
      this.mostrarFormulario = true;
    },
    async guardarMedicamento() {
      this.error = '';
      if (!this.form.Nombre || !this.form.Presentacion || !this.form.Precio) {
        this.error = 'Complete los campos obligatorios';
        return;
      }

      this.guardando = true;
      try {
        if (this.editandoId) {
          await RecepcionService.actualizarMedicamento(this.editandoId, this.form);
          this.mostrarMensaje('Medicamento actualizado correctamente');
        } else {
          await RecepcionService.crearMedicamento(this.form);
          this.mostrarMensaje('Medicamento creado correctamente');
        }
        this.cerrarFormulario();
        await this.cargarMedicamentos();
      } catch (err) {
        this.error = err.message;
      } finally {
        this.guardando = false;
      }
    },
    async actualizarStock(medicamento) {
      try {
        await RecepcionService.actualizarStock(medicamento.Id_Medicamento, medicamento.Stock);
        this.mostrarMensaje('Stock actualizado');
      } catch (err) {
        this.mostrarMensaje(err.message, true);
        await this.cargarMedicamentos();
      }
    },
    async eliminarMedicamento(id) {
      if (!confirm('¿Eliminar este medicamento?')) return;

      try {
        await RecepcionService.eliminarMedicamento(id);
        this.mostrarMensaje('Medicamento eliminado');
        await this.cargarMedicamentos();
      } catch (err) {
        this.mostrarMensaje(err.message, true);
      }
    },
    cerrarFormulario() {
      this.mostrarFormulario = false;
      this.editandoId = null;
      this.form = { Nombre: '', Presentacion: '', Dosis: '', Precio: 0, Stock: 0, Stock_Minimo: 0 };
      this.error = '';
    },
    getEstadoClass(med) {
      if (med.Stock <= 0) return 'sin-stock';
      if (med.Stock <= med.Stock_Minimo) return 'stock-bajo';
      return '';
    },
    getEstadoBadge(med) {
      if (med.Stock <= 0) return 'badge-danger';
      if (med.Stock <= med.Stock_Minimo) return 'badge-warning';
      return 'badge-success';
    },
    getEstadoLabel(med) {
      if (med.Stock <= 0) return 'Sin Stock';
      if (med.Stock <= med.Stock_Minimo) return 'Stock Bajo';
      return 'Disponible';
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
.gestion-medicamentos {
  padding: 20px;
  min-width: 980px;
}

@media (max-width: 980px) {
  .gestion-medicamentos {
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

table tbody tr.sin-stock {
  background-color: #fff5f5;
}

table tbody tr.stock-bajo {
  background-color: #fffbf0;
}

.stock-cell {
  padding: 0;
}

.stock-input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
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

.badge-warning {
  background-color: #ffc107;
  color: #333;
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
