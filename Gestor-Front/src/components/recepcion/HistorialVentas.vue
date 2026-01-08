<template>
  <div class="historial-ventas">
    <h2>Historial de Ventas</h2>

    <div class="filtros-container">
      <div class="filtro-grupo">
        <label>Desde:</label>
        <input v-model="filtros.fechaInicio" type="date">
      </div>

      <div class="filtro-grupo">
        <label>Hasta:</label>
        <input v-model="filtros.fechaFin" type="date">
      </div>

      <div class="filtro-grupo">
        <label>Tipo:</label>
        <select v-model="filtros.tipo">
          <option value="">Todos</option>
          <option value="medicamento">Medicamentos</option>
          <option value="servicio">Servicios</option>
        </select>
      </div>

      <button @click="cargarVentas" class="btn-aplicar">Filtrar</button>
      <button @click="exportarCSV" class="btn-exportar" v-if="ventas.length > 0">📥 Exportar CSV</button>
    </div>

    <div v-if="cargando" class="alert info">Cargando ventas...</div>
    <div v-if="error" class="alert error">{{ error }}</div>

    <div v-if="!cargando && ventas.length > 0" class="tabla-container">
      <p class="info-total">
        Total ventas: <strong>{{ ventas.length }}</strong> | 
        Monto total: <strong>${{ montoTotal.toFixed(2) }}</strong>
      </p>
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Producto/Servicio</th>
            <th>Cliente</th>
            <th>Cantidad</th>
            <th>Precio Unit.</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="venta in ventas" :key="venta.Id_Venta" :class="'tipo-' + venta.Tipo">
            <td>{{ formatearFecha(venta.Fecha) }}</td>
            <td>
              <span class="badge" :class="venta.Tipo === 'medicamento' ? 'bg-warning' : 'bg-info'">
                {{ venta.Tipo === 'medicamento' ? 'Medicamento' : 'Servicio' }}
              </span>
            </td>
            <td>{{ venta.Producto_Servicio }}</td>
            <td>{{ venta.Cliente }}</td>
            <td class="text-center">{{ venta.Cantidad }}</td>
            <td>${{ venta.Precio_Unitario.toFixed(2) }}</td>
            <td><strong>${{ (venta.Precio_Unitario * venta.Cantidad).toFixed(2) }}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="!cargando" class="no-data">
      No hay ventas registradas para los filtros seleccionados
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'HistorialVentas',
  data() {
    return {
      ventas: [],
      cargando: false,
      error: '',
      filtros: {
        fechaInicio: '',
        fechaFin: '',
        tipo: ''
      }
    };
  },
  computed: {
    montoTotal() {
      return this.ventas.reduce((sum, v) => sum + (v.Precio_Unitario * v.Cantidad), 0);
    }
  },
  mounted() {
    this.cargarVentas();
  },
  methods: {
    async cargarVentas() {
      this.cargando = true;
      this.error = '';
      try {
        const res = await RecepcionService.obtenerHistorialVentas(this.filtros);
        this.ventas = res.ventas || [];
      } catch (err) {
        this.error = err.message || 'Error al cargar ventas';
      } finally {
        this.cargando = false;
      }
    },
    formatearFecha(fecha) {
      if (!fecha) return '';
      return new Date(fecha).toLocaleDateString();
    },
    exportarCSV() {
      if (this.ventas.length === 0) return;

      const headers = ['Fecha', 'Tipo', 'Producto/Servicio', 'Cliente', 'Cantidad', 'Precio Unit.', 'Subtotal'];
      const rows = this.ventas.map(v => [
        this.formatearFecha(v.Fecha),
        v.Tipo === 'medicamento' ? 'Medicamento' : 'Servicio',
        v.Producto_Servicio,
        v.Cliente,
        v.Cantidad,
        v.Precio_Unitario.toFixed(2),
        (v.Precio_Unitario * v.Cantidad).toFixed(2)
      ]);

      let csv = headers.join(',') + '\n';
      rows.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial-ventas-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }
};
</script>

<style scoped>
.historial-ventas {
  padding: 20px;
  min-width: 980px;
}

@media (max-width: 980px) {
  .historial-ventas {
    min-width: auto;
  }
}

.filtros-container {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
}

.filtro-grupo label {
  font-weight: 600;
  margin-bottom: 5px;
  font-size: 0.9rem;
}

.filtro-grupo input,
.filtro-grupo select {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.btn-aplicar,
.btn-exportar {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-aplicar {
  background-color: #007bff;
  color: white;
}

.btn-aplicar:hover {
  background-color: #0056b3;
}

.btn-exportar {
  background-color: #28a745;
  color: white;
}

.btn-exportar:hover {
  background-color: #218838;
}

.tabla-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  background-color: white;
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

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  color: white;
}

.bg-warning {
  background-color: #ffc107 !important;
  color: black !important;
}

.bg-info {
  background-color: #17a2b8 !important;
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
  margin-bottom: 15px;
}

.alert.info {
  background-color: #d1ecf1;
  color: #0c5460;
}

.alert.error {
  background-color: #f8d7da;
  color: #721c24;
}
</style>
