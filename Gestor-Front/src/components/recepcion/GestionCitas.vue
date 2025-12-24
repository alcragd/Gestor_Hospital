<template>
  <div class="gestion-citas">
    <h2>Gestión de Citas</h2>

    <div class="filtros-container">
      <div class="filtro-grupo">
        <label>Buscar Doctor/Paciente:</label>
        <input
          v-model="filtros.busqueda"
          type="text"
          placeholder="Nombre o ID"
          @input="aplicarFiltros"
        />
      </div>

      <div class="filtro-grupo">
        <label>Estatus:</label>
        <select v-model="filtros.estatus" @change="aplicarFiltros">
          <option value="">Todos</option>
          <option value="1">Agendada - Pendiente de Pago</option>
          <option value="2">Pagada - Pendiente por Atender</option>
          <option value="3">Cancelada - Falta de Pago</option>
          <option value="4">Cancelada - Paciente</option>
          <option value="5">Cancelada - Doctor</option>
          <option value="6">Atendida</option>
          <option value="7">No Acudió</option>
        </select>
      </div>

      <div class="filtro-grupo">
        <label>Fecha Desde:</label>
        <input
          v-model="filtros.fechaInicio"
          type="date"
          @change="aplicarFiltros"
        />
      </div>

      <div class="filtro-grupo">
        <label>Fecha Hasta:</label>
        <input
          v-model="filtros.fechaFin"
          type="date"
          @change="aplicarFiltros"
        />
      </div>

      <button @click="limpiarFiltros" class="btn-limpiar">Limpiar Filtros</button>
    </div>

    <div v-if="mensajeError" class="alert error">{{ mensajeError }}</div>
    <div v-if="mensajeExito" class="alert success">{{ mensajeExito }}</div>

    <div v-if="cargando" class="loading">Cargando citas...</div>

    <div v-else-if="citas.length > 0" class="tabla-container">
      <p class="info-total">Total de citas: <strong>{{ citas.length }}</strong></p>
      <table>
        <thead>
          <tr>
            <th>Folio</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Paciente</th>
            <th>Doctor</th>
            <th>Estatus</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cita in citas" :key="cita.Id_Cita" :class="getEstatusClass(cita.ID_Estatus)">
            <td>{{ cita.Id_Cita }}</td>
            <td>{{ formateaFecha(cita.Fecha_cita) }}</td>
            <td>{{ cita.Hora_Inicio }} - {{ cita.Hora_Fin }}</td>
            <td>{{ cita.Nombre_Paciente || 'N/D' }}</td>
            <td>{{ cita.Nombre_Doctor || 'N/D' }}</td>
            <td>
              <span :class="'badge badge-' + cita.ID_Estatus">
                {{ cita.Estatus || cita.ID_Estatus }}
              </span>
            </td>
            <td>
              <button 
                v-if="puedeSerCancelada(cita.ID_Estatus)"
                class="btn-cancel" 
                @click="abrirCancelacion(cita)" 
                :disabled="cita.cancelando">
                {{ cita.cancelando ? 'Cancelando...' : 'Cancelar' }}
              </button>
              <span v-else class="text-muted">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="no-data">Sin citas para mostrar</div>

    <div v-if="modalCita" class="modal">
      <div class="modal-content">
        <h3>Cancelar cita {{ modalCita.Id_Cita }}</h3>
        <p><strong>Fecha:</strong> {{ formateaFecha(modalCita.Fecha_cita) }} {{ modalCita.Hora_Inicio }} - {{ modalCita.Hora_Fin }}</p>
        <p><strong>Doctor:</strong> {{ modalCita.Nombre_Doctor || 'N/D' }}</p>
         <label>Quién solicita la cancelación</label>
         <select v-model="canceladoPor">
           <option value="Paciente">Paciente</option>
           <option value="Doctor">Doctor</option>
         </select>
        <label>Motivo de cancelación</label>
        <textarea v-model="motivo" rows="3" placeholder="Describe el motivo"></textarea>
        <div class="modal-actions">
          <button class="btn-cancel" @click="confirmarCancelacion" :disabled="enviando">{{ enviando ? 'Enviando...' : 'Confirmar' }}</button>
          <button class="btn-secondary" @click="cerrarModal" :disabled="enviando">Cerrar</button>
        </div>
      </div>
    </div>

    <div v-if="resultadoCancelacion" class="resultado">
      <h4>Resultado de cancelación</h4>
      <p><strong>Estatus:</strong> {{ resultadoCancelacion.estatus }}</p>
      <p><strong>Porcentaje devolución:</strong> {{ resultadoCancelacion.porcentajeReembolso ?? 'N/D' }}%</p>
      <p><strong>Monto devuelto:</strong> {{ resultadoCancelacion.montoReembolso ?? 'N/D' }}</p>
      <p><strong>Política aplicada:</strong> {{ resultadoCancelacion.politica }}</p>
      <p><strong>Mensaje:</strong> {{ resultadoCancelacion.mensaje }}</p>
    </div>
  </div>
</template>

<script>
import RecepcionService from '../../services/RecepcionService';

export default {
  name: 'GestionCitas',
  data() {
    return {
      filtros: {
        busqueda: '',
        estatus: '',
        fechaInicio: '',
        fechaFin: ''
      },
      citas: [],
      cargando: false,
      mensajeError: '',
      mensajeExito: '',
      modalCita: null,
      motivo: '',
      enviando: false,
      canceladoPor: 'Paciente',
      resultadoCancelacion: null
    };
  },
  mounted() {
    this.cargarTodasLasCitas();
  },
  methods: {
    formateaFecha(f) {
      if (!f) return '';
      return new Date(f).toLocaleDateString();
    },
    async cargarTodasLasCitas() {
      this.mensajeError = '';
      this.mensajeExito = '';
      this.cargando = true;
      try {
        const res = await RecepcionService.listarCitas();
        this.citas = res.citas || [];
      } catch (error) {
        this.mensajeError = error.message;
      } finally {
        this.cargando = false;
      }
    },
    async aplicarFiltros() {
      this.mensajeError = '';
      this.mensajeExito = '';
      this.cargando = true;
      
      try {
        const filtrosApi = {};
        
        if (this.filtros.estatus) filtrosApi.estatus = this.filtros.estatus;
        if (this.filtros.busqueda) {
          // Buscar tanto en doctor como en paciente
          filtrosApi.doctor = this.filtros.busqueda;
          filtrosApi.paciente = this.filtros.busqueda;
        }
        if (this.filtros.fechaInicio) filtrosApi.fechaInicio = this.filtros.fechaInicio;
        if (this.filtros.fechaFin) filtrosApi.fechaFin = this.filtros.fechaFin;
        
        const res = await RecepcionService.listarCitas(filtrosApi);
        this.citas = res.citas || [];
      } catch (error) {
        this.mensajeError = error.message;
      } finally {
        this.cargando = false;
      }
    },
    limpiarFiltros() {
      this.filtros = {
        busqueda: '',
        estatus: '',
        fechaInicio: '',
        fechaFin: ''
      };
      this.cargarTodasLasCitas();
    },
    puedeSerCancelada(estatusId) {
      // Solo se pueden cancelar citas agendadas (1) o pagadas (2)
      return estatusId === 1 || estatusId === 2;
    },
    getEstatusClass(estatusId) {
      const clases = {
        1: 'estatus-reservada',
        2: 'estatus-confirmada',
        3: 'estatus-liberada',
        4: 'estatus-cancelada',
        5: 'estatus-cancelada',
        6: 'estatus-completada',
        7: 'estatus-no-presentado'
      };
      return clases[estatusId] || '';
    },
    abrirCancelacion(cita) {
      this.modalCita = cita;
      this.motivo = '';
       this.canceladoPor = 'Paciente';
    },
    cerrarModal() {
      this.modalCita = null;
      this.motivo = '';
    },
    async confirmarCancelacion() {
      if (!this.modalCita) return;
      if (!this.motivo.trim()) {
        this.mensajeError = 'El motivo es obligatorio';
        return;
      }
      const idCita = this.getIdCita(this.modalCita);
      if (!idCita) {
        this.mensajeError = `ID de cita inválido (no se encontró identificador numérico en el registro). Refresca la lista e intenta de nuevo.`;
        return;
      }
      this.enviando = true;
      this.mensajeError = '';
      try {
        const res = await RecepcionService.cancelarCita(idCita, this.motivo.trim(), this.canceladoPor);
        this.mensajeExito = res.message || 'Cancelación aplicada';
        this.resultadoCancelacion = res.detalles || res.resultado || null;
        await this.cargarTodasLasCitas();
      } catch (error) {
        this.mensajeError = error.message;
      } finally {
        this.enviando = false;
        this.cerrarModal();
      }
    }
    ,
    getIdCita(cita) {
      if (!cita || typeof cita !== 'object') return null;
      const keys = ['Id_Cita', 'Id_cita', 'IdCita', 'Id', 'id', 'Folio'];
      for (const k of keys) {
        if (k in cita) {
          const n = parseInt(cita[k], 10);
          if (!Number.isNaN(n) && n > 0) return n;
        }
      }
      // Fallback: busca el primer valor numérico positivo en el objeto
      for (const val of Object.values(cita)) {
        const n = parseInt(val, 10);
        if (!Number.isNaN(n) && n > 0) return n;
      }
      return null;
    }
  }
};
</script>

<style scoped>
.gestion-citas {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.filtros-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.filtro-grupo {
  display: flex;
  flex-direction: column;
}

.filtro-grupo label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #495057;
}

.filtro-grupo input,
.filtro-grupo select {
  padding: 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

.btn-limpiar {
  padding: 8px 16px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
  margin-top: auto;
}

.btn-limpiar:hover {
  background: #5a6268;
}

.info-total {
  margin-bottom: 10px;
  font-size: 14px;
  color: #495057;
}

.text-muted {
  color: #6c757d;
}

.badge {
  padding: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
}

.badge-1 { background: #fff3cd; color: #856404; }
.badge-2 { background: #d1ecf1; color: #0c5460; }
.badge-3 { background: #f8d7da; color: #721c24; }
.badge-4 { background: #f8d7da; color: #721c24; }
.badge-5 { background: #f8d7da; color: #721c24; }
.badge-6 { background: #d4edda; color: #155724; }
.badge-7 { background: #e2e3e5; color: #383d41; }

.estatus-reservada { background: #fff3cd; }
.estatus-confirmada { background: #d1ecf1; }
.estatus-liberada { background: #fff5f5; }
.estatus-cancelada { background: #fff5f5; }
.estatus-completada { background: #d4edda; }
.estatus-no-presentado { background: #e2e3e5; }

.loading {
  padding: 12px;
  color: #666;
  text-align: center;
}

.loading {
  padding: 12px;
  color: #666;
}

.tabla-container {
  overflow-x: auto;
  margin-top: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

table th, table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
  text-align: left;
}

.btn-cancel {
  background: #dc3545;
  color: #fff;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-secondary {
  background: #6c757d;
  color: #fff;
  border: none;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
}

.no-data {
  padding: 12px;
  color: #666;
}

.alert {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 10px;
  font-size: 13px;
}

.alert.error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.alert.success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.modal-content {
  background: #fff;
  padding: 20px;
  border-radius: 6px;
  width: 420px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.modal-content textarea {
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.modal-content select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 10px;
}

.resultado {
  margin-top: 15px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
}
</style>

