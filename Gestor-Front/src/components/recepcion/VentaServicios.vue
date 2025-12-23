<template>
  <div class="venta-servicios">
    <h2>Venta de Servicios Extra</h2>

    <div class="container">
      <div class="servicios-disponibles">
        <h3>Servicios Disponibles</h3>
        <div v-if="servicios.length > 0" class="servicios-grid">
          <div 
            v-for="servicio in servicios" 
            :key="servicio.Id_Servicio"
            class="servicio-card"
            @click="agregarServicio(servicio)">
            <h4>{{ servicio.Nombre }}</h4>
            <p class="descripcion">{{ servicio.Descripcion }}</p>
            <p class="precio">${{ servicio.Precio.toFixed(2) }}</p>
            <button class="btn-agregar">+ Agregar</button>
          </div>
        </div>
        <div v-else class="loading">Cargando servicios...</div>
      </div>

      <div class="carrito-venta">
        <h3>Carrito de Venta</h3>
        
        <div class="form-group">
          <label>Nombre del Cliente *</label>
          <input v-model="ventaData.Nombre_Cliente" type="text" placeholder="Nombre del cliente o genérico">
        </div>

        <div v-if="ventaData.servicios.length > 0" class="tabla-container">
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Total</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in ventaData.servicios" :key="idx">
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
                  <button class="btn-remove" @click="removerServicio(idx)">Quitar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="no-items">No hay servicios seleccionados</div>

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
            @click="registrarVenta" 
            :disabled="cargando || ventaData.servicios.length === 0 || !ventaData.Nombre_Cliente"
            class="btn-registrar">
            {{ cargando ? 'Registrando...' : 'Registrar Venta' }}
          </button>
          <button 
            @click="limpiarCarrito"
            class="btn-limpiar">
            Limpiar Carrito
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'VentaServicios',
  data() {
    return {
      servicios: [],
      ventaData: {
        Nombre_Cliente: '',
        servicios: []
      },
      cargando: false,
      mensajeError: '',
      mensajeExito: '',
      totalVenta: 0
    };
  },
  mounted() {
    this.cargarServicios();
  },
  methods: {
    async cargarServicios() {
      try {
        const res = await RecepcionService.listarServicios();
        this.servicios = res.servicios || [];
      } catch (error) {
        this.mensajeError = 'Error al cargar servicios: ' + error.message;
      }
    },
    agregarServicio(servicio) {
      const existe = this.ventaData.servicios.find(s => s.Id_Servicio === servicio.Id_Servicio);
      
      if (existe) {
        existe.Cantidad += 1;
      } else {
        this.ventaData.servicios.push({
          Id_Servicio: servicio.Id_Servicio,
          Nombre: servicio.Nombre,
          Precio: servicio.Precio,
          Cantidad: 1
        });
      }
      this.recalcularTotal();
    },
    removerServicio(idx) {
      this.ventaData.servicios.splice(idx, 1);
      this.recalcularTotal();
    },
    recalcularTotal() {
      this.totalVenta = this.ventaData.servicios.reduce((sum, item) => {
        return sum + (item.Precio * item.Cantidad);
      }, 0);
    },
    limpiarCarrito() {
      this.ventaData = {
        Nombre_Cliente: '',
        servicios: []
      };
      this.totalVenta = 0;
      this.mensajeError = '';
      this.mensajeExito = '';
    },
    async registrarVenta() {
      if (!this.ventaData.Nombre_Cliente) {
        this.mensajeError = 'Por favor ingresa el nombre del cliente';
        return;
      }

      if (this.ventaData.servicios.length === 0) {
        this.mensajeError = 'Por favor selecciona al menos un servicio';
        return;
      }

      this.cargando = true;
      this.mensajeError = '';
      this.mensajeExito = '';

      try {
        const res = await RecepcionService.venderServicio({
          Nombre_Cliente: this.ventaData.Nombre_Cliente,
          servicios: this.ventaData.servicios.map(s => ({
            Id_Servicio: s.Id_Servicio,
            Cantidad: s.Cantidad
          }))
        });

        this.mensajeExito = `Venta registrada exitosamente (ID: ${res.venta.Id_Venta}) - Total: $${res.venta.Total.toFixed(2)}`;
        this.limpiarCarrito();
        
        setTimeout(() => {
          this.mensajeExito = '';
        }, 5000);
      } catch (error) {
        this.mensajeError = 'Error al registrar venta: ' + error.message;
      } finally {
        this.cargando = false;
      }
    }
  }
};
</script>

<style scoped>
.venta-servicios {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

h2 {
  color: #333;
  margin-bottom: 20px;
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

.servicios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.servicio-card {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.servicio-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

.servicio-card h4 {
  margin: 0 0 10px 0;
  color: #333;
  font-size: 16px;
}

.servicio-card .descripcion {
  margin: 5px 0;
  color: #666;
  font-size: 13px;
  min-height: 30px;
}

.servicio-card .precio {
  font-size: 18px;
  font-weight: bold;
  color: #28a745;
  margin: 10px 0;
}

.btn-agregar {
  width: 100%;
  padding: 8px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-agregar:hover {
  background: #0056b3;
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

.cantidad-input {
  width: 50px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
}

.btn-remove {
  padding: 4px 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.btn-remove:hover {
  background: #c82333;
}

.no-items {
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
