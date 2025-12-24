<template>
  <div class="ventas-unificadas">
    <h2>Ventas (Medicamentos + Servicios)</h2>

    <div class="contenedor-principal">
      <!-- PANEL DE PRODUCTOS Y SERVICIOS -->
      <div class="catalogo">
        <div class="seccion-catalogo">
          <h3>Medicamentos</h3>
          <div class="search-bar">
            <input 
              v-model="busquedaMed" 
              placeholder="Buscar medicamento o servicio..."
              @input="filtrarMedicamentos"
              type="text">
          </div>
          <div v-if="medicamentosFiltrados.length > 0" class="grid-items">
            <div 
              v-for="med in medicamentosFiltrados" 
              :key="'med-' + med.Id_Medicamento"
              class="item-card"
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
          <div v-else class="no-data">No hay medicamentos disponibles</div>
        </div>

        <div class="seccion-catalogo">
          <h3>Servicios</h3>
          <div v-if="servicios.length > 0" class="grid-items">
            <div 
              v-for="servicio in servicios" 
              :key="'serv-' + servicio.Id_Servicio"
              class="item-card"
              @click="agregarServicio(servicio)">
              <h4>{{ servicio.Nombre }}</h4>
              <p class="descripcion">{{ servicio.Descripcion }}</p>
              <p class="precio">${{ servicio.Precio.toFixed(2) }}</p>
              <button class="btn-agregar">+ Agregar</button>
            </div>
          </div>
          <div v-else class="no-data">No hay servicios disponibles</div>
        </div>
      </div>

      <!-- CARRITO DE VENTA -->
      <div class="carrito-venta">
        <h3>Carrito de Venta</h3>
        
        <div class="form-group">
          <label>Nombre del Cliente *</label>
          <input v-model="ventaData.Nombre_Cliente" type="text" placeholder="Nombre del cliente">
        </div>

        <div v-if="ventaData.items.length > 0" class="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in ventaData.items" :key="idx">
                <td>
                  <span class="tipo-badge" :class="'tipo-' + item.tipo">
                    {{ item.tipo === 'medicamento' ? 'Med' : 'Serv' }}
                  </span>
                </td>
                <td>{{ item.Nombre }}</td>
                <td>
                  <input 
                    v-model.number="item.cantidad" 
                    type="number" 
                    min="1"
                    @change="recalcularTotal">
                </td>
                <td>${{ item.Precio.toFixed(2) }}</td>
                <td><strong>${{ (item.Precio * item.cantidad).toFixed(2) }}</strong></td>
                <td>
                  <button class="btn-eliminar" @click="removerItem(idx)">Eliminar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="carrito-vacio">El carrito está vacío</div>

        <div class="resumen">
          <div class="linea-resumen">
            <span>Subtotal:</span>
            <strong>${{ subtotal.toFixed(2) }}</strong>
          </div>
          <div class="linea-resumen">
            <span>IVA (16%):</span>
            <strong>${{ iva.toFixed(2) }}</strong>
          </div>
          <div class="linea-resumen total">
            <span>Total:</span>
            <strong>${{ total.toFixed(2) }}</strong>
          </div>
        </div>

        <div v-if="mensajeError" class="alert error">{{ mensajeError }}</div>
        <div v-if="mensajeExito" class="alert success">{{ mensajeExito }}</div>

        <button 
          @click="procesarVenta" 
          :disabled="ventaData.items.length === 0 || !ventaData.Nombre_Cliente || procesando"
          class="btn-venta">
          {{ procesando ? 'Procesando...' : 'Procesar Venta' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'VentasUnificadas',
  data() {
    return {
      medicamentos: [],
      medicamentosFiltrados: [],
      servicios: [],
      busquedaMed: '',
      ventaData: {
        Nombre_Cliente: '',
        items: []
      },
      mensajeError: '',
      mensajeExito: '',
      procesando: false
    };
  },
  computed: {
    subtotal() {
      return this.ventaData.items.reduce((sum, item) => sum + (item.Precio * item.cantidad), 0);
    },
    iva() {
      return this.subtotal * 0.16;
    },
    total() {
      return this.subtotal + this.iva;
    }
  },
  mounted() {
    this.cargarMedicamentos();
    this.cargarServicios();
  },
  methods: {
    async cargarMedicamentos() {
      try {
        const res = await RecepcionService.listarMedicamentos();
        this.medicamentos = res.medicamentos || [];
        this.medicamentosFiltrados = this.medicamentos;
      } catch (error) {
        this.mensajeError = 'Error al cargar medicamentos: ' + error.message;
      }
    },
    async cargarServicios() {
      try {
        const res = await RecepcionService.listarServicios();
        this.servicios = res.servicios || [];
      } catch (error) {
        this.mensajeError = 'Error al cargar servicios: ' + error.message;
      }
    },
    filtrarMedicamentos() {
      if (!this.busquedaMed.trim()) {
        this.medicamentosFiltrados = this.medicamentos;
      } else {
        const busqueda = this.busquedaMed.toLowerCase();
        this.medicamentosFiltrados = this.medicamentos.filter(med =>
          med.Nombre.toLowerCase().includes(busqueda) ||
          med.Presentacion.toLowerCase().includes(busqueda)
        );
      }
    },
    agregarMedicamento(medicamento) {
      if (medicamento.Stock <= 0) return;
      
      const existe = this.ventaData.items.find(
        item => item.tipo === 'medicamento' && item.Id_Medicamento === medicamento.Id_Medicamento
      );
      
      if (existe) {
        existe.cantidad++;
      } else {
        this.ventaData.items.push({
          tipo: 'medicamento',
          Id_Medicamento: medicamento.Id_Medicamento,
          Nombre: medicamento.Nombre,
          Precio: medicamento.Precio,
          cantidad: 1
        });
      }
      this.recalcularTotal();
    },
    agregarServicio(servicio) {
      const existe = this.ventaData.items.find(
        item => item.tipo === 'servicio' && item.Id_Servicio === servicio.Id_Servicio
      );
      
      if (existe) {
        existe.cantidad++;
      } else {
        this.ventaData.items.push({
          tipo: 'servicio',
          Id_Servicio: servicio.Id_Servicio,
          Nombre: servicio.Nombre,
          Precio: servicio.Precio,
          cantidad: 1
        });
      }
      this.recalcularTotal();
    },
    removerItem(index) {
      this.ventaData.items.splice(index, 1);
      this.recalcularTotal();
    },
    recalcularTotal() {
      // Fuerza re-render de los computed properties
      this.$forceUpdate();
    },
    async procesarVenta() {
      if (this.ventaData.items.length === 0) {
        this.mensajeError = 'El carrito está vacío';
        return;
      }
      if (!this.ventaData.Nombre_Cliente.trim()) {
        this.mensajeError = 'Debe proporcionar un nombre de cliente';
        return;
      }

      this.procesando = true;
      this.mensajeError = '';
      this.mensajeExito = '';

      try {
        // Separar medicamentos y servicios
        const medicamentos = this.ventaData.items.filter(item => item.tipo === 'medicamento');
        const servicios = this.ventaData.items.filter(item => item.tipo === 'servicio');

        // Procesar medicamentos
        if (medicamentos.length > 0) {
          const dataMedicamentos = {
            Nombre_Cliente: this.ventaData.Nombre_Cliente,
            medicamentos: medicamentos.map(med => ({
              Id_Medicamento: med.Id_Medicamento,
              Cantidad: med.cantidad
            }))
          };
          await RecepcionService.venderMedicamento(dataMedicamentos);
        }

        // Procesar servicios
        if (servicios.length > 0) {
          const dataServicios = {
            Nombre_Cliente: this.ventaData.Nombre_Cliente,
            servicios: servicios.map(serv => ({
              Id_Servicio: serv.Id_Servicio,
              Cantidad: serv.cantidad
            }))
          };
          await RecepcionService.venderServicio(dataServicios);
        }

        this.mensajeExito = `Venta procesada exitosamente. Total: $${this.total.toFixed(2)}`;
        
        // Limpiar carrito
        this.ventaData = {
          Nombre_Cliente: '',
          items: []
        };

        setTimeout(() => {
          this.mensajeExito = '';
        }, 3000);

      } catch (error) {
        this.mensajeError = 'Error al procesar venta: ' + error.message;
      } finally {
        this.procesando = false;
      }
    }
  }
};
</script>

<style scoped>
.ventas-unificadas {
  padding: 20px;
}

.contenedor-principal {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 20px;
}

.catalogo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.seccion-catalogo {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.seccion-catalogo h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.search-bar {
  margin-bottom: 15px;
}

.search-bar input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.grid-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.item-card {
  background: #f9f9f9;
  border: 1px solid #eee;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.item-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0,123,255,0.2);
}

.item-card.sin-stock {
  opacity: 0.6;
  cursor: not-allowed;
}

.item-card h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.presentacion,
.descripcion {
  font-size: 12px;
  color: #666;
  margin: 5px 0;
}

.stock {
  font-size: 12px;
  color: #28a745;
}

.stock.bajo-stock {
  color: #ff9800;
  font-weight: 600;
}

.precio {
  font-size: 14px;
  font-weight: 600;
  color: #007bff;
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

.btn-agregar:hover:not(:disabled) {
  background: #218838;
}

.btn-agregar:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.carrito-venta {
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  height: fit-content;
  position: sticky;
  top: 20px;
}

.carrito-venta h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 600;
  font-size: 12px;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.tabla-container {
  overflow-x: auto;
  margin-bottom: 15px;
  max-height: 300px;
  overflow-y: auto;
}

table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

table th {
  background: #f5f5f5;
  padding: 8px;
  text-align: left;
  border-bottom: 2px solid #ddd;
}

table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.tipo-badge {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
}

.tipo-medicamento {
  background: #e3f2fd;
  color: #1976d2;
}

.tipo-servicio {
  background: #f3e5f5;
  color: #7b1fa2;
}

table input {
  width: 50px;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 3px;
}

.btn-eliminar {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.btn-eliminar:hover {
  background: #c82333;
}

.carrito-vacio {
  padding: 20px;
  text-align: center;
  color: #999;
  background: #f9f9f9;
  border-radius: 4px;
}

.no-data {
  padding: 15px;
  text-align: center;
  color: #999;
  background: #f9f9f9;
  border-radius: 4px;
}

.resumen {
  background: #f9f9f9;
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.linea-resumen {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 13px;
}

.linea-resumen.total {
  border-top: 2px solid #ddd;
  padding-top: 8px;
  font-size: 14px;
  font-weight: 600;
}

.alert {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 12px;
}

.alert.error {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.alert.success {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.btn-venta {
  width: 100%;
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.btn-venta:hover:not(:disabled) {
  background: #0056b3;
}

.btn-venta:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 1024px) {
  .contenedor-principal {
    grid-template-columns: 1fr;
  }
  
  .carrito-venta {
    position: static;
  }
}
</style>
