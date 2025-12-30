<template>
  <div class="farmacia">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h4 class="mb-0">Gestión de Farmacia</h4>
    </div>

    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" :class="{ active: tab === 'venta' }" @click="tab = 'venta'" href="#">Venta de Medicamentos</a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{ active: tab === 'inventario' }" @click="tab = 'inventario'" href="#">Inventario</a>
      </li>
    </ul>

    <!-- VENTA DE MEDICAMENTOS -->
    <div v-if="tab === 'venta'" class="tab-content">
      <div class="row g-3">
        <div class="col-lg-7">
          <div class="card mb-3">
            <div class="card-header bg-light">
              <h5 class="mb-0">Medicamentos Disponibles</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <input 
                  v-model="busquedaMed" 
                  placeholder="Buscar medicamento..."
                  @input="buscarMedicamentos"
                  type="text"
                  class="form-control">
              </div>

              <div v-if="medicamentos.length > 0" class="medicamentos-grid">
                <div 
                  v-for="med in medicamentos" 
                  :key="med.Id_Medicamento"
                  class="medicamento-card"
                  :class="{ 'sin-stock': med.Stock <= 0 }"
                  @click="agregarMedicamento(med)">
                  <h6 class="mb-1">{{ med.Nombre }}</h6>
                  <p class="text-muted small mb-1">{{ med.Presentacion }}</p>
                  <p class="mb-1" :class="{ 'text-warning': med.Stock < 10, 'text-danger': med.Stock <= 0 }">
                    <strong>Stock: {{ med.Stock }}</strong>
                  </p>
                  <p class="text-primary mb-2"><strong>${{ med.Precio.toFixed(2) }}</strong></p>
                  <button class="btn btn-sm btn-primary w-100" :disabled="med.Stock <= 0">
                    {{ med.Stock > 0 ? '+ Agregar' : 'Sin Stock' }}
                  </button>
                </div>
              </div>
              <div v-else class="text-center text-muted py-4">Cargando medicamentos...</div>
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h5 class="mb-0">Carrito de Venta</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Nombre del Cliente *</label>
                <input v-model="ventaData.Nombre_Cliente" type="text" class="form-control" placeholder="Nombre del cliente o genérico">
              </div>

              <div v-if="ventaData.medicamentos.length > 0" class="table-responsive mb-3">
                <table class="table table-sm">
                  <thead class="table-light">
                    <tr>
                      <th>Medicamento</th>
                      <th>Cant.</th>
                      <th>Precio</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, idx) in ventaData.medicamentos" :key="idx">
                      <td>{{ item.Nombre }}</td>
                      <td>
                        <input 
                          v-model.number="item.Cantidad" 
                          type="number" 
                          min="1"
                          @change="recalcularTotal"
                          class="form-control form-control-sm" style="width: 60px;">
                      </td>
                      <td>${{ item.Precio.toFixed(2) }}</td>
                      <td><strong>${{ (item.Precio * item.Cantidad).toFixed(2) }}</strong></td>
                      <td>
                        <button class="btn btn-sm btn-danger" @click="removerMedicamento(idx)">×</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-center text-muted py-3">No hay medicamentos seleccionados</div>

              <div class="d-flex justify-content-between align-items-center mb-3 p-2 bg-light rounded">
                <span class="fw-bold">Total:</span>
                <span class="fs-5 text-primary fw-bold">${{ totalVenta.toFixed(2) }}</span>
              </div>

              <div v-if="mensajeError" class="alert alert-danger">{{ mensajeError }}</div>
              <div v-if="mensajeExito" class="alert alert-success">{{ mensajeExito }}</div>

              <div class="d-grid gap-2">
                <button 
                  @click="registrarVentaMed" 
                  :disabled="cargando || ventaData.medicamentos.length === 0 || !ventaData.Nombre_Cliente"
                  class="btn btn-success">
                  {{ cargando ? 'Registrando...' : 'Registrar Venta' }}
                </button>
                <button 
                  @click="limpiarCarrito"
                  class="btn btn-outline-secondary">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- INVENTARIO -->
    <div v-if="tab === 'inventario'" class="tab-content">
      <div class="card">
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-8">
              <input 
                v-model="busquedaInv" 
                placeholder="Buscar medicamento..."
                @input="buscarInventario"
                type="text"
                class="form-control">
            </div>
            <div class="col-md-4">
              <div class="form-check">
                <input v-model="mostrarSinStock" type="checkbox" class="form-check-input" id="sinStockCheck" @change="buscarInventario">
                <label class="form-check-label" for="sinStockCheck">Solo sin stock</label>
              </div>
            </div>
          </div>

          <div v-if="medicamentosInv.length > 0" class="table-responsive">
            <table class="table table-hover">
              <thead class="table-light">
                <tr>
                  <th>Medicamento</th>
                  <th>Presentación</th>
                  <th>Precio</th>
                  <th>Stock Actual</th>
                  <th>Nuevo Stock</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="med in medicamentosInv" :key="med.Id_Medicamento">
                  <td>{{ med.Nombre }}</td>
                  <td>{{ med.Presentacion }}</td>
                  <td>${{ med.Precio.toFixed(2) }}</td>
                  <td>
                    <span class="badge" :class="{ 'bg-danger': med.Stock <= 0, 'bg-warning text-dark': med.Stock > 0 && med.Stock < 10, 'bg-success': med.Stock >= 10 }">
                      {{ med.Stock }}
                    </span>
                  </td>
                  <td>
                    <input 
                      v-model.number="med.nuevoStock" 
                      type="number" 
                      class="form-control form-control-sm" style="width: 100px;"
                      min="0">
                  </td>
                  <td>
                    <button 
                      @click="guardarStock(med)"
                      :disabled="med.nuevoStock === undefined || med.nuevoStock === med.Stock || cargandoStock"
                      class="btn btn-sm btn-primary">
                      {{ cargandoStock ? 'Guardando...' : 'Guardar' }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="text-center text-muted py-4">No hay medicamentos</div>

          <div v-if="mensajeError" class="alert alert-danger mt-3">{{ mensajeError }}</div>
          <div v-if="mensajeExito" class="alert alert-success mt-3">{{ mensajeExito }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'Farmacia',
  data() {
    return {
      tab: 'venta',
      medicamentos: [],
      medicamentosInv: [],
      ventaData: {
        Nombre_Cliente: '',
        medicamentos: []
      },
      busquedaMed: '',
      busquedaInv: '',
      mostrarSinStock: false,
      cargando: false,
      cargandoStock: false,
      mensajeError: '',
      mensajeExito: '',
      totalVenta: 0
    };
  },
  mounted() {
    this.cargarMedicamentos();
    this.cargarInventario();
  },
  methods: {
    async cargarMedicamentos() {
      try {
        const res = await RecepcionService.listarMedicamentos();
        this.medicamentos = res.medicamentos || [];
      } catch (error) {
        this.mensajeError = 'Error al cargar medicamentos: ' + error.message;
      }
    },
    async cargarInventario() {
      try {
        const res = await RecepcionService.listarMedicamentos();
        this.medicamentosInv = (res.medicamentos || []).map(m => ({
          ...m,
          nuevoStock: m.Stock
        }));
      } catch (error) {
        this.mensajeError = 'Error al cargar inventario: ' + error.message;
      }
    },
    async buscarMedicamentos() {
      try {
        const res = await RecepcionService.listarMedicamentos(this.busquedaMed);
        this.medicamentos = res.medicamentos || [];
      } catch (error) {
        this.mensajeError = 'Error en búsqueda: ' + error.message;
      }
    },
    async buscarInventario() {
      try {
        const res = await RecepcionService.listarMedicamentos(
          this.busquedaInv, 
          this.mostrarSinStock
        );
        this.medicamentosInv = (res.medicamentos || []).map(m => ({
          ...m,
          nuevoStock: m.Stock
        }));
      } catch (error) {
        this.mensajeError = 'Error en búsqueda: ' + error.message;
      }
    },
    agregarMedicamento(med) {
      if (med.Stock <= 0) return;

      const existe = this.ventaData.medicamentos.find(m => m.Id_Medicamento === med.Id_Medicamento);
      
      if (existe) {
        existe.Cantidad += 1;
      } else {
        this.ventaData.medicamentos.push({
          Id_Medicamento: med.Id_Medicamento,
          Nombre: med.Nombre,
          Precio: med.Precio,
          Cantidad: 1
        });
      }
      this.recalcularTotal();
    },
    removerMedicamento(idx) {
      this.ventaData.medicamentos.splice(idx, 1);
      this.recalcularTotal();
    },
    recalcularTotal() {
      this.totalVenta = this.ventaData.medicamentos.reduce((sum, item) => {
        return sum + (item.Precio * item.Cantidad);
      }, 0);
    },
    limpiarCarrito() {
      this.ventaData = {
        Nombre_Cliente: '',
        medicamentos: []
      };
      this.totalVenta = 0;
      this.mensajeError = '';
      this.mensajeExito = '';
    },
    async registrarVentaMed() {
      if (!this.ventaData.Nombre_Cliente) {
        this.mensajeError = 'Por favor ingresa el nombre del cliente';
        return;
      }

      if (this.ventaData.medicamentos.length === 0) {
        this.mensajeError = 'Por favor selecciona al menos un medicamento';
        return;
      }

      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';

      try {
        const res = await RecepcionService.venderMedicamento({
          Nombre_Cliente: this.ventaData.Nombre_Cliente,
          medicamentos: this.ventaData.medicamentos.map(m => ({
            Id_Medicamento: m.Id_Medicamento,
            Cantidad: m.Cantidad
          }))
        });

        this.mensajeExito = `Venta registrada (ID: ${res.venta.Id_Venta}) - Total: $${res.venta.Total.toFixed(2)}`;
        this.limpiarCarrito();
        this.cargarMedicamentos();
        
        setTimeout(() => {
          this.mensajeExito = '';
        }, 5000);
      } catch (error) {
        this.mensajeError = 'Error: ' + error.message;
      } finally {
        this.cargando = false;
      }
    },
    async guardarStock(medicamento) {
      if (medicamento.nuevoStock === medicamento.Stock) {
        return;
      }

      this.cargandoStock = true;
      this.mensajeError = '';
      this.mensajeExito = '';

      try {
        await RecepcionService.actualizarStock(
          medicamento.Id_Medicamento,
          medicamento.nuevoStock
        );

        medicamento.Stock = medicamento.nuevoStock;
        this.mensajeExito = `Stock actualizado para ${medicamento.Nombre}`;
        
        setTimeout(() => {
          this.mensajeExito = '';
        }, 3000);
      } catch (error) {
        this.mensajeError = 'Error: ' + error.message;
        medicamento.nuevoStock = medicamento.Stock;
      } finally {
        this.cargandoStock = false;
      }
    }
  }
};
</script>

<style scoped>
.farmacia {
  max-width: 100%;
}

.nav-link {
  cursor: pointer;
}

.tab-content {
  margin-top: 0;
}

.medicamentos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
  padding: 4px;
}

.medicamento-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.medicamento-card:hover:not(.sin-stock) {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.medicamento-card.sin-stock {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f8f9fa;
}

@media (max-width: 900px) {
  .medicamentos-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
}
</style>
