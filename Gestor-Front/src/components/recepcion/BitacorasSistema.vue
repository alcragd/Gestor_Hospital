<template>
  <div class="bitacoras">
    <h4 class="mb-4">Bitácoras del Sistema</h4>

    <!-- Tabs para diferentes tipos de bitácoras -->
    <ul class="nav nav-tabs mb-3">
      <li class="nav-item">
        <a class="nav-link" :class="{active: tab==='cambios-estatus'}" @click="tab='cambios-estatus'" href="#">
          Cambios de Estatus
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{active: tab==='historial-medico'}" @click="tab='historial-medico'" href="#">
          Accesos Médicos
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" :class="{active: tab==='estadisticas'}" @click="tab='estadisticas'" href="#">
          Estadísticas
        </a>
      </li>
    </ul>

    <!-- ============================================ -->
    <!-- TAB: Cambios de Estatus de Citas -->
    <!-- ============================================ -->
    <div v-if="tab === 'cambios-estatus'" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">Historial de Cambios de Estatus</h5>
      </div>
      <div class="card-body">
        <!-- Filtros -->
        <div class="row g-2 mb-3">
          <div class="col-md-3">
            <label class="form-label small">Fecha Desde</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosCambios.desde">
          </div>
          <div class="col-md-3">
            <label class="form-label small">Fecha Hasta</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosCambios.hasta">
          </div>
          <div class="col-md-3">
            <label class="form-label small">Estatus Nuevo</label>
            <select class="form-select form-select-sm" v-model="filtrosCambios.estatus">
              <option value="">Todos</option>
              <option value="1">Programada</option>
              <option value="2">Pagada</option>
              <option value="3">Cancelada - Falta Pago</option>
              <option value="4">Cancelada - Paciente</option>
              <option value="5">Cancelada - Doctor</option>
              <option value="6">Atendida</option>
            </select>
          </div>
          <div class="col-md-3 d-flex align-items-end">
            <button class="btn btn-sm btn-primary w-100" @click="cargarCambiosEstatus">
              Buscar
            </button>
          </div>
        </div>

        <!-- Mensajes -->
        <div v-if="mensajeCambios" class="alert" :class="errorCambios ? 'alert-danger' : 'alert-info'">
          {{ mensajeCambios }}
        </div>

        <!-- Tabla de resultados -->
        <div v-if="cambiosEstatus.length > 0" class="table-responsive">
          <table class="table table-hover table-sm">
            <thead class="table-light">
              <tr>
                <th>ID Cita</th>
                <th>Fecha Cita</th>
                <th>Paciente</th>
                <th>Doctor</th>
                <th>Cambio</th>
                <th>Usuario</th>
                <th>Fecha/Hora Cambio</th>
                <th>Reembolso</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cambio in cambiosEstatus" :key="cambio.Id_Bitacora">
                <td><strong>{{ cambio.Id_Cita }}</strong></td>
                <td>{{ formatFecha(cambio.Fecha_cita) }}</td>
                <td>{{ cambio.Paciente }}</td>
                <td>{{ cambio.Doctor }}<br><small class="text-muted">{{ cambio.Especialidad }}</small></td>
                <td>
                  <div class="d-flex align-items-center gap-2">
                    <span v-if="cambio.Nombre_Estatus_Anterior" class="badge bg-secondary">
                      {{ cambio.Nombre_Estatus_Anterior }}
                    </span>
                    <span>→</span>
                    <span class="badge" :class="getBadgeClass(cambio.Estatus_Nuevo)">
                      {{ cambio.Nombre_Estatus_Nuevo }}
                    </span>
                  </div>
                </td>
                <td>
                  <div>{{ cambio.Nombre_Usuario || 'Sistema' }}</div>
                  <small class="text-muted">{{ cambio.Rol_Usuario }}</small>
                </td>
                <td>{{ formatFechaHora(cambio.Fecha_Cambio) }}</td>
                <td>
                  <span v-if="cambio.Monto_Devuelto" class="text-success fw-bold">
                    ${{ cambio.Monto_Devuelto.toFixed(2) }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <small v-if="cambio.Motivo">{{ cambio.Motivo }}</small>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-muted small">
            Total de registros: {{ cambiosEstatus.length }}
          </div>
        </div>
        <div v-else-if="!cargandoCambios" class="text-center text-muted py-4">
          No hay cambios de estatus registrados para los filtros seleccionados.
        </div>
        <div v-if="cargandoCambios" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Accesos a Historial Médico -->
    <!-- ============================================ -->
    <div v-if="tab === 'historial-medico'" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">Registro de Accesos a Historiales Médicos</h5>
      </div>
      <div class="card-body">
        <!-- Filtros -->
        <div class="row g-2 mb-3">
          <div class="col-md-4">
            <label class="form-label small">ID Paciente</label>
            <input type="number" class="form-control form-control-sm" v-model.number="filtrosHistorial.idPaciente" placeholder="Ingrese ID del paciente">
          </div>
          <div class="col-md-3">
            <label class="form-label small">Fecha Desde</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosHistorial.desde">
          </div>
          <div class="col-md-3">
            <label class="form-label small">Fecha Hasta</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosHistorial.hasta">
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button class="btn btn-sm btn-primary w-100" @click="cargarAccesosHistorial" :disabled="!filtrosHistorial.idPaciente">
              Buscar
            </button>
          </div>
        </div>

        <!-- Mensajes -->
        <div v-if="mensajeHistorial" class="alert" :class="errorHistorial ? 'alert-danger' : 'alert-info'">
          {{ mensajeHistorial }}
        </div>

        <!-- Tabla de resultados -->
        <div v-if="accesosHistorial.length > 0" class="table-responsive">
          <table class="table table-hover table-sm">
            <thead class="table-light">
              <tr>
                <th>ID Cita</th>
                <th>Fecha Cita</th>
                <th>Doctor Atención</th>
                <th>Especialidad</th>
                <th>Usuario Acceso</th>
                <th>Tipo Acción</th>
                <th>Fecha/Hora Acceso</th>
                <th>Receta</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="acceso in accesosHistorial" :key="acceso.Id_Bitacora">
                <td><strong>{{ acceso.Id_Cita }}</strong></td>
                <td>{{ formatFecha(acceso.Fecha_cita) }}</td>
                <td>{{ acceso.Doctor_Atencion }}</td>
                <td>{{ acceso.Especialidad }}</td>
                <td>
                  <div>{{ acceso.Nombre_Usuario }}</div>
                  <small class="text-muted">{{ acceso.Rol_Usuario }}</small>
                </td>
                <td>
                  <span class="badge" :class="getTipoAccionBadge(acceso.Tipo_Accion)">
                    {{ acceso.Tipo_Accion }}
                  </span>
                </td>
                <td>{{ formatFechaHora(acceso.Fecha_Accion) }}</td>
                <td>
                  <span v-if="acceso.Id_Receta" class="badge bg-info">
                    Receta #{{ acceso.Id_Receta }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td>
                  <small v-if="acceso.Detalles">{{ acceso.Detalles }}</small>
                  <span v-else class="text-muted">-</span>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="text-muted small">
            Total de accesos: {{ accesosHistorial.length }}
          </div>
        </div>
        <div v-else-if="!cargandoHistorial" class="text-center text-muted py-4">
          Ingrese un ID de paciente para consultar el historial de accesos.
        </div>
        <div v-if="cargandoHistorial" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================ -->
    <!-- TAB: Estadísticas -->
    <!-- ============================================ -->
    <div v-if="tab === 'estadisticas'" class="card">
      <div class="card-header bg-light">
        <h5 class="mb-0">Estadísticas de Bitácoras</h5>
      </div>
      <div class="card-body">
        <!-- Filtros de fecha -->
        <div class="row g-2 mb-4">
          <div class="col-md-4">
            <label class="form-label small">Fecha Desde</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosEstadisticas.desde">
          </div>
          <div class="col-md-4">
            <label class="form-label small">Fecha Hasta</label>
            <input type="date" class="form-control form-control-sm" v-model="filtrosEstadisticas.hasta">
          </div>
          <div class="col-md-4 d-flex align-items-end">
            <button class="btn btn-sm btn-primary w-100" @click="cargarEstadisticas">
              Actualizar
            </button>
          </div>
        </div>

        <div v-if="estadisticas">
          <div class="row g-3">
            <!-- Cambios por estatus -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-primary text-white">
                  <h6 class="mb-0">Cambios por Estatus</h6>
                </div>
                <div class="card-body">
                  <div v-if="estadisticas.cambios_por_estatus.length > 0">
                    <div v-for="(item, idx) in estadisticas.cambios_por_estatus" :key="idx" class="d-flex justify-content-between align-items-center mb-2">
                      <span>{{ item.estatus }}</span>
                      <span class="badge bg-primary">{{ item.total }}</span>
                    </div>
                  </div>
                  <div v-else class="text-muted">No hay datos</div>
                </div>
              </div>
            </div>

            <!-- Cancelaciones por tipo -->
            <div class="col-md-6">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-warning text-dark">
                  <h6 class="mb-0">Cancelaciones por Tipo</h6>
                </div>
                <div class="card-body">
                  <div v-if="estadisticas.cancelaciones_por_tipo.length > 0">
                    <div v-for="(item, idx) in estadisticas.cancelaciones_por_tipo" :key="idx" class="d-flex justify-content-between align-items-center mb-2">
                      <span>{{ item.tipo }}</span>
                      <span class="badge bg-warning text-dark">{{ item.total }}</span>
                    </div>
                  </div>
                  <div v-else class="text-muted">No hay datos</div>
                </div>
              </div>
            </div>

            <!-- Monto total devuelto -->
            <div class="col-12">
              <div class="card border-0 shadow-sm">
                <div class="card-header bg-success text-white">
                  <h6 class="mb-0">Reembolsos</h6>
                </div>
                <div class="card-body text-center">
                  <h3 class="text-success mb-0">${{ (estadisticas.monto_total_devuelto || 0).toFixed(2) }}</h3>
                  <small class="text-muted">Monto total devuelto en el período</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="cargandoEstadisticas" class="text-center py-4">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'BitacorasSistema',
  data() {
    return {
      tab: 'cambios-estatus',
      
      // Cambios de estatus
      cambiosEstatus: [],
      filtrosCambios: {
        desde: '',
        hasta: '',
        estatus: ''
      },
      cargandoCambios: false,
      mensajeCambios: '',
      errorCambios: false,
      
      // Historial médico
      accesosHistorial: [],
      filtrosHistorial: {
        idPaciente: null,
        desde: '',
        hasta: ''
      },
      cargandoHistorial: false,
      mensajeHistorial: '',
      errorHistorial: false,
      
      // Estadísticas
      estadisticas: null,
      filtrosEstadisticas: {
        desde: '',
        hasta: ''
      },
      cargandoEstadisticas: false
    };
  },
  mounted() {
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    this.filtrosCambios.hasta = hoy.toISOString().split('T')[0];
    this.filtrosCambios.desde = hace30Dias.toISOString().split('T')[0];
    
    this.filtrosEstadisticas.hasta = hoy.toISOString().split('T')[0];
    this.filtrosEstadisticas.desde = hace30Dias.toISOString().split('T')[0];
    
    // Cargar datos iniciales
    this.cargarCambiosEstatus();
  },
  methods: {
    async cargarCambiosEstatus() {
      this.cargandoCambios = true;
      this.mensajeCambios = '';
      this.errorCambios = false;
      
      try {
        const params = new URLSearchParams();
        if (this.filtrosCambios.desde) params.append('desde', this.filtrosCambios.desde);
        if (this.filtrosCambios.hasta) params.append('hasta', this.filtrosCambios.hasta);
        if (this.filtrosCambios.estatus) params.append('estatus', this.filtrosCambios.estatus);
        
        const response = await axios.get(`http://localhost:3000/api/bitacoras/citas?${params}`, {
          headers: {
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          }
        });
        
        this.cambiosEstatus = response.data.registros || [];
        
        if (this.cambiosEstatus.length === 0) {
          this.mensajeCambios = 'No se encontraron registros para los filtros seleccionados.';
        }
        
      } catch (error) {
        console.error('Error al cargar cambios de estatus:', error);
        this.mensajeCambios = error.response?.data?.message || 'Error al cargar datos';
        this.errorCambios = true;
      } finally {
        this.cargandoCambios = false;
      }
    },
    
    async cargarAccesosHistorial() {
      if (!this.filtrosHistorial.idPaciente) {
        this.mensajeHistorial = 'Debe ingresar un ID de paciente';
        this.errorHistorial = true;
        return;
      }
      
      this.cargandoHistorial = true;
      this.mensajeHistorial = '';
      this.errorHistorial = false;
      
      try {
        const params = new URLSearchParams();
        if (this.filtrosHistorial.desde) params.append('desde', this.filtrosHistorial.desde);
        if (this.filtrosHistorial.hasta) params.append('hasta', this.filtrosHistorial.hasta);
        
        const response = await axios.get(
          `http://localhost:3000/api/bitacoras/historial/${this.filtrosHistorial.idPaciente}?${params}`,
          {
            headers: {
              'x-user-id': localStorage.getItem('userId'),
              'x-user-role': localStorage.getItem('userRole')
            }
          }
        );
        
        this.accesosHistorial = response.data.accesos || [];
        
        if (this.accesosHistorial.length === 0) {
          this.mensajeHistorial = 'No se encontraron accesos médicos para este paciente.';
        }
        
      } catch (error) {
        console.error('Error al cargar accesos historial:', error);
        this.mensajeHistorial = error.response?.data?.message || 'Error al cargar datos';
        this.errorHistorial = true;
      } finally {
        this.cargandoHistorial = false;
      }
    },
    
    async cargarEstadisticas() {
      this.cargandoEstadisticas = true;
      
      try {
        const params = new URLSearchParams();
        if (this.filtrosEstadisticas.desde) params.append('desde', this.filtrosEstadisticas.desde);
        if (this.filtrosEstadisticas.hasta) params.append('hasta', this.filtrosEstadisticas.hasta);
        
        const response = await axios.get(`http://localhost:3000/api/bitacoras/estadisticas?${params}`, {
          headers: {
            'x-user-id': localStorage.getItem('userId'),
            'x-user-role': localStorage.getItem('userRole')
          }
        });
        
        this.estadisticas = response.data.estadisticas;
        
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        this.cargandoEstadisticas = false;
      }
    },
    
    formatFecha(fecha) {
      if (!fecha) return '-';
      const d = new Date(fecha);
      return d.toLocaleDateString('es-MX');
    },
    
    formatFechaHora(fechaHora) {
      if (!fechaHora) return '-';
      const d = new Date(fechaHora);
      return `${d.toLocaleDateString('es-MX')} ${d.toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}`;
    },
    
    getBadgeClass(estatus) {
      const statusMap = {
        1: 'bg-info',
        2: 'bg-warning text-dark',
        3: 'bg-danger',
        4: 'bg-danger',
        5: 'bg-danger',
        6: 'bg-success'
      };
      return statusMap[estatus] || 'bg-secondary';
    },
    
    getTipoAccionBadge(tipo) {
      if (tipo === 'CONSULTA_HISTORIAL') return 'bg-info';
      if (tipo === 'CREACION_RECETA') return 'bg-success';
      if (tipo === 'ATENCION_CITA') return 'bg-primary';
      return 'bg-secondary';
    }
  }
};
</script>

<style scoped>
.bitacoras {
  max-width: 100%;
}

.nav-link {
  cursor: pointer;
}

.table th {
  font-size: 0.85rem;
  font-weight: 600;
}

.table td {
  font-size: 0.9rem;
  vertical-align: middle;
}

.badge {
  font-size: 0.8rem;
}
</style>
