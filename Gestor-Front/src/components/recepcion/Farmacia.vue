<template>
  <div class="farmacia">
    <h2>Gestión de Farmacia</h2>

    <div class="tabs">
      <button 
        :class="{ active: tab === 'venta' }"
        @click="tab = 'venta'">
        Venta de Medicamentos
      </button>
      <button 
        :class="{ active: tab === 'inventario' }"
        @click="tab = 'inventario'">
        Inventario
      </button>
    </div>

    <!-- VENTA DE MEDICAMENTOS -->
    <div v-if="tab === 'venta'" class="tab-content">
      <div class="container">
        <div class="medicamentos-disponibles">
          <h3>Medicamentos Disponibles</h3>
          <div class="search-bar">
            <input 
              v-model="busquedaMed" 
              placeholder="Buscar medicamento..."
              @input="buscarMedicamentos"
              type="text">
          </div>

          <div v-if="medicamentos.length > 0" class="medicamentos-grid">
            <div 
              v-for="med in medicamentos" 
              :key="med.Id_Medicamento"
              class="medicamento-card"
              :class="{ 'sin-stock': med.Stock <= 0 }"
              @click="agregarMedicamento(med)">
              <h4>{{ med.Nombre }}</h4>
              <p class="presentacion">{{ med.Presentacion }}</p>
              <p class="stock" :class="{ 'bajo-stock': med.Stock < 10 }">
                Stock: {{ med.Stock }}
              </p>
              <p class="precio">${{ med.Precio.toFixed(2) }}</p>
              <button class="btn-agregar" :disabled="med.Stock <= 0">
                {{ med.Stock > 0 ? '+ Agregar' : 'Sin Stock' }}
              </button>
            </div>
          </div>
          <div v-else class="loading">Cargando medicamentos...</div>
        </div>

        <div class="carrito-venta">
          <h3>Carrito de Venta</h3>
          
          <div class="form-group">
            <label>Nombre del Cliente *</label>
            <input v-model="ventaData.Nombre_Cliente" type="text" placeholder="Nombre del cliente o genérico">
          </div>

          <div v-if="ventaData.medicamentos.length > 0" class="tabla-container">
            <table>
              <thead>
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
                      class="cantidad-input">
                  </td>
                  <td>${{ item.Precio.toFixed(2) }}</td>
                  <td>${{ (item.Precio * item.Cantidad).toFixed(2) }}</td>
                  <td>
                    <button class="btn-remove" @click="removerMedicamento(idx)">✕</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="no-items">No hay medicamentos seleccionados</div>

          <div class="resumen">
            <div class="total-row">
              <span>Total:</span>
              <span class="total-amount">${{ totalVenta.toFixed(2) }}</span>
            </div>
          </div>

          <div v-if="mensajeError" class="error">{{ mensajeError }}</div>
          <div v-if="mensajeExito" class="success">{{ mensajeExito }}</div>

          <div class="botones">
            <button 
              @click="registrarVentaMed" 
              :disabled="cargando || ventaData.medicamentos.length === 0 || !ventaData.Nombre_Cliente"
              class="btn-registrar">
              {{ cargando ? 'Registrando...' : 'Registrar Venta' }}
            </button>
            <button 
              @click="limpiarCarrito"
              class="btn-limpiar">
              Limpiar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- INVENTARIO -->
    <div v-if="tab === 'inventario'" class="tab-content">
      <div class="search-bar">
        <input 
          v-model="busquedaInv" 
          placeholder="Buscar medicamento..."
          @input="buscarInventario"
          type="text">
        <label>
          <input v-model="mostrarSinStock" type="checkbox">
          Solo sin stock
        </label>
      </div>

      <div v-if="medicamentosInv.length > 0" class="tabla-container">
        <table>
          <thead>
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
                <span :class="{ 'sin-stock': med.Stock <= 0, 'bajo-stock': med.Stock > 0 && med.Stock < 10 }">
                  {{ med.Stock }}
                </span>
              </td>
              <td>
                <input 
                  v-model.number="med.nuevoStock" 
                  type="number" 
                  class="stock-input"
                  min="0">
              </td>
              <td>
                <button 
                  @click="guardarStock(med)"
                  :disabled="med.nuevoStock === undefined || med.nuevoStock === med.Stock || cargandoStock"
                  class="btn-guardar">
                  {{ cargandoStock ? 'Guardando...' : 'Guardar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="no-data">No hay medicamentos</div>

      <div v-if="mensajeError" class="error">{{ mensajeError }}</div>
      <div v-if="mensajeExito" class="success">{{ mensajeExito }}</div>
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
  max-width: 1400px;
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
}

.tabs button.active {
  background: #28a745;
  color: white;
}

.tab-content {
  background: white;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.container {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

h3 {
  color: #333;
  margin-bottom: 15px;
}

.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  align-items: center;
}

.search-bar input[type="text"] {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.search-bar label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  white-space: nowrap;
}

.medicamentos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 15px;
}

.medicamento-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.medicamento-card:hover:not(.sin-stock) {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.medicamento-card.sin-stock {
  opacity: 0.6;
  cursor: not-allowed;
}

.medicamento-card h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
}

.medicamento-card .presentacion {
  margin: 3px 0;
  color: #666;
  font-size: 12px;
}

.medicamento-card .stock {
  margin: 5px 0;
  font-size: 13px;
  font-weight: 500;
}

.medicamento-card .stock.bajo-stock {
  color: #ff9800;
}

.medicamento-card .stock.sin-stock {
  color: #dc3545;
}

.medicamento-card .precio {
  font-size: 16px;
  font-weight: bold;
  color: #28a745;
  margin: 8px 0;
}

.btn-agregar {
  width: 100%;
  padding: 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-agregar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-agregar:hover:not(:disabled) {
  background: #218838;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.carrito-venta {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  font-size: 14px;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.tabla-container {
  overflow-x: auto;
  margin: 15px 0;
}

table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

table thead {
  background: #f8f9fa;
}

table th {
  padding: 8px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.cantidad-input, .stock-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
}

.btn-remove {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-remove:hover {
  background: #c82333;
}

.btn-guardar {
  padding: 4px 8px;
  background: #17a2b8;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.btn-guardar:hover:not(:disabled) {
  background: #138496;
}

.btn-guardar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.no-items, .no-data {
  text-align: center;
  padding: 20px;
  color: #999;
  font-size: 14px;
}

.resumen {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  margin: 15px 0;
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  font-weight: bold;
  color: #333;
}

.total-amount {
  color: #28a745;
}

.error, .success {
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 13px;
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

.botones {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-registrar, .btn-limpiar {
  padding: 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-registrar {
  background: #28a745;
  color: white;
}

.btn-registrar:hover:not(:disabled) {
  background: #218838;
}

.btn-registrar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-limpiar {
  background: #6c757d;
  color: white;
}

.btn-limpiar:hover {
  background: #5a6268;
}

@media (max-width: 900px) {
  .container {
    grid-template-columns: 1fr;
  }

  .carrito-venta {
    position: static;
  }
}
</style>
