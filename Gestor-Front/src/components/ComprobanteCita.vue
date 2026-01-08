<template>
  <div class="comprobante-overlay" @click.self="cerrar">
    <div class="comprobante-container">
      <button class="btn-close-comprobante" @click="cerrar">×</button>
      
      <div class="comprobante-header">
        <h3 class="text-center mb-0">COMPROBANTE DE CITA</h3>
        <p class="text-center text-muted mb-0">Hospital General</p>
      </div>

      <div class="comprobante-body">
        <div class="folio-section">
          <div class="folio-label">FOLIO</div>
          <div class="folio-numero">{{ cita.folio }}</div>
        </div>

        <div class="datos-section">
          <div class="dato-item">
            <span class="dato-label">Paciente:</span>
            <span class="dato-valor">{{ cita.paciente }}</span>
          </div>

          <div class="dato-item">
            <span class="dato-label">Fecha:</span>
            <span class="dato-valor">{{ formatearFecha(cita.fecha) }}</span>
          </div>

          <div class="dato-item">
            <span class="dato-label">Horario:</span>
            <span class="dato-valor">{{ cita.horaInicio }} - {{ cita.horaFin }}</span>
          </div>

          <div class="dato-item">
            <span class="dato-label">Consultorio:</span>
            <span class="dato-valor">{{ cita.consultorio || 'Por asignar' }}</span>
          </div>

          <div class="dato-item">
            <span class="dato-label">Especialidad:</span>
            <span class="dato-valor">{{ cita.especialidad }}</span>
          </div>

          <div class="dato-item">
            <span class="dato-label">Doctor:</span>
            <span class="dato-valor">Dr. {{ cita.doctor }}</span>
          </div>

          <div class="dato-item costo-item">
            <span class="dato-label">Costo de Consulta:</span>
            <span class="dato-valor costo-valor">${{ formatearCosto(cita.costo) }}</span>
          </div>
        </div>

        <div class="linea-pago-section">
          <div class="linea-pago-header">LÍNEA DE PAGO</div>
          <div class="linea-pago-codigo">
            {{ cita.lineaPago || generarLineaPago() }}
          </div>
          <div class="linea-pago-instrucciones">
            Utilice esta línea de pago en cualquier sucursal bancaria o tienda de conveniencia
          </div>
        </div>

        <div class="leyendas-section">
          <div class="leyenda-tiempo">
            <div class="leyenda-icono">⏰</div>
            <div class="leyenda-texto">
              <strong>TIEMPO LÍMITE DE PAGO: 8 HORAS</strong>
              <p class="mb-0">Realice su pago dentro de las próximas 8 horas para confirmar su cita. 
              Después de este tiempo, la cita será cancelada automáticamente.</p>
            </div>
          </div>

          <div class="leyenda-cancelacion">
            <div class="leyenda-icono">ℹ️</div>
            <div class="leyenda-texto">
              <strong>POLÍTICA DE CANCELACIÓN</strong>
              <ul class="mb-0">
                <li>Cancelación con más de 24 horas de anticipación: Reembolso del 100%</li>
                <li>Cancelación entre 12 y 24 horas antes: Reembolso del 50%</li>
                <li>Cancelación con menos de 12 horas: Sin reembolso</li>
                <li>En caso de no asistir: Sin reembolso</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="comprobante-footer">
        <button class="btn btn-primary btn-lg w-100 mb-2" @click="imprimir">
          Imprimir Comprobante
        </button>
        <button class="btn btn-outline-secondary w-100" @click="cerrar">
          Cerrar
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ComprobanteCita',
  props: {
    cita: {
      type: Object,
      required: true
    }
  },
  methods: {
    cerrar() {
      this.$emit('cerrar');
    },
    
    formatearFecha(fecha) {
      if (!fecha) return '';
      try {
        // Si es una fecha en formato YYYY-MM-DD
        if (typeof fecha === 'string' && fecha.length === 10 && fecha.includes('-')) {
          const [year, month, day] = fecha.split('-');
          const fechaObj = new Date(year, month - 1, day);
          const opciones = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
          return fechaObj.toLocaleDateString('es-MX', opciones);
        }
        // Si es un timestamp ISO
        const opciones = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        const fechaObj = new Date(fecha);
        if (Number.isNaN(fechaObj.getTime())) return fecha;
        return fechaObj.toLocaleDateString('es-MX', opciones);
      } catch (e) {
        return fecha || '';
      }
    },
    
    formatearCosto(costo) {
      if (!costo) return '0.00';
      return parseFloat(costo).toFixed(2);
    },
    
    generarLineaPago() {
      // Generar línea de pago basada en el folio
      const folio = this.cita.folio || '0000';
      const fecha = new Date();
      const timestamp = fecha.getTime().toString().slice(-8);
      return `LP${folio.toString().padStart(6, '0')}${timestamp}`;
    },
    
    imprimir() {
      // Crear un iframe temporal para imprimir solo el comprobante
      const printWindow = window.open('', '', 'height=600,width=800');
      const comprobanteHTML = document.querySelector('.comprobante-container').innerHTML;
      
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Comprobante de Cita - ${this.cita.folio}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white;
              padding: 2rem;
            }
            
            .comprobante-header {
              background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
              color: white;
              padding: 2rem 1.5rem;
              border-radius: 12px 12px 0 0;
              text-align: center;
              margin-bottom: 0;
            }

            .comprobante-header h3 {
              font-size: 1.75rem;
              margin: 0 0 0.5rem 0;
              font-weight: 600;
            }

            .comprobante-header p {
              font-size: 0.95rem;
              margin: 0;
            }
            
            .comprobante-body {
              border: 1px solid #dee2e6;
              padding: 2rem 1.5rem;
            }
            
            .folio-section {
              margin-bottom: 2rem;
              padding: 1rem;
              border: 2px dashed #0d6efd;
              border-radius: 8px;
              text-align: center;
            }

            .folio-label {
              font-size: 0.875rem;
              color: #6c757d;
              font-weight: 500;
              margin-bottom: 0.5rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .folio-numero {
              font-size: 2rem;
              font-weight: bold;
              color: #0d6efd;
              font-family: 'Courier New', monospace;
            }
            
            .datos-section {
              margin-bottom: 2rem;
            }

            .dato-item {
              display: flex;
              justify-content: space-between;
              padding: 0.75rem 0;
              border-bottom: 1px solid #f0f0f0;
              align-items: center;
            }

            .dato-label {
              font-weight: 600;
              color: #212529;
              font-size: 0.9rem;
            }

            .dato-valor {
              color: #495057;
              text-align: right;
              font-size: 0.9rem;
            }

            .costo-item {
              margin-top: 1rem;
              padding-top: 1rem;
              border-top: 2px solid #dee2e6;
              border-bottom: none;
              font-weight: bold;
            }

            .costo-valor {
              color: #28a745;
              font-size: 1.1rem;
              font-family: 'Courier New', monospace;
            }
            
            .linea-pago-section {
              background: #fffacd;
              border: 2px solid #ffc107;
              border-radius: 8px;
              padding: 1.5rem;
              margin-bottom: 2rem;
            }

            .linea-pago-header {
              font-size: 0.875rem;
              color: #856404;
              font-weight: 600;
              margin-bottom: 0.75rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }

            .linea-pago-codigo {
              font-family: 'Courier New', monospace;
              font-size: 1.1rem;
              font-weight: bold;
              color: #212529;
              word-break: break-all;
              margin-bottom: 0.75rem;
              background: white;
              padding: 0.75rem;
              border-radius: 4px;
              border: 1px solid #ffc107;
            }

            .linea-pago-instrucciones {
              font-size: 0.85rem;
              color: #856404;
              line-height: 1.5;
            }
            
            .leyendas-section {
              display: flex;
              flex-direction: column;
              gap: 1rem;
            }

            .leyenda-tiempo,
            .leyenda-cancelacion {
              display: flex;
              gap: 1rem;
              padding: 1rem;
              border-radius: 8px;
            }

            .leyenda-tiempo {
              background: #fff3cd;
              border-left: 4px solid #ffc107;
            }

            .leyenda-cancelacion {
              background: #d1ecf1;
              border-left: 4px solid #0dcaf0;
            }

            .leyenda-icono {
              font-size: 1.5rem;
              flex-shrink: 0;
            }

            .leyenda-texto {
              flex: 1;
              font-size: 0.875rem;
            }

            .leyenda-texto strong {
              display: block;
              margin-bottom: 0.5rem;
              font-size: 0.875rem;
              color: #212529;
            }

            .leyenda-texto p {
              margin: 0;
              color: #495057;
              line-height: 1.4;
            }

            .leyenda-texto ul {
              padding-left: 1.25rem;
              margin-top: 0.5rem;
              margin-bottom: 0;
            }

            .leyenda-texto li {
              margin-bottom: 0.25rem;
              color: #495057;
            }
            
            .comprobante-footer {
              border-top: 1px solid #dee2e6;
              background: #f8f9fa;
              border-radius: 0 0 12px 12px;
              display: none;
            }
            
            @media print {
              body {
                padding: 0;
                background: white;
              }
              
              * {
                box-shadow: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${comprobanteHTML}
        </body>
        </html>
      `;
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Esperar a que el contenido se cargue y luego imprimir
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  }
};
</script>

<style scoped>
.comprobante-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
  overflow-y: auto;
}

.comprobante-container {
  background: white;
  border-radius: 12px;
  max-width: 700px;
  width: 100%;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  position: relative;
}

.btn-close-comprobante {
  position: absolute;
  top: 15px;
  right: 15px;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
  z-index: 10;
}

.btn-close-comprobante:hover {
  background: #e9ecef;
  color: #000;
  transform: scale(1.1);
}

.comprobante-header {
  background: linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%);
  color: white;
  padding: 2rem 1.5rem;
  border-radius: 12px 12px 0 0;
}

.comprobante-header h3 {
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.comprobante-body {
  padding: 2rem 1.5rem;
}

.folio-section {
  text-align: center;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.folio-label {
  font-size: 0.875rem;
  color: #6c757d;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 0.5rem;
}

.folio-numero {
  font-size: 2rem;
  font-weight: 700;
  color: #0d6efd;
  font-family: 'Courier New', monospace;
}

.datos-section {
  margin-bottom: 2rem;
}

.dato-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}

.dato-item:last-child {
  border-bottom: none;
}

.dato-label {
  font-weight: 600;
  color: #495057;
}

.dato-valor {
  color: #212529;
  text-align: right;
}

.costo-item {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 6px;
  margin-top: 1rem;
  border: none;
}

.costo-valor {
  font-size: 1.5rem;
  font-weight: 700;
  color: #198754;
}

.linea-pago-section {
  background: #fff3cd;
  border: 2px solid #ffc107;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
}

.linea-pago-header {
  font-weight: 700;
  color: #856404;
  font-size: 0.875rem;
  letter-spacing: 1px;
  margin-bottom: 1rem;
}

.linea-pago-codigo {
  font-family: 'Courier New', monospace;
  font-size: 1.5rem;
  font-weight: 700;
  color: #212529;
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  letter-spacing: 2px;
}

.linea-pago-instrucciones {
  font-size: 0.875rem;
  color: #856404;
}

.leyendas-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.leyenda-tiempo,
.leyenda-cancelacion {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
}

.leyenda-tiempo {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.leyenda-cancelacion {
  background: #d1ecf1;
  border-left: 4px solid #0dcaf0;
}

.leyenda-icono {
  font-size: 2rem;
  flex-shrink: 0;
}

.leyenda-texto {
  flex: 1;
}

.leyenda-texto strong {
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #212529;
}

.leyenda-texto p,
.leyenda-texto ul {
  font-size: 0.875rem;
  color: #495057;
  line-height: 1.5;
}

.leyenda-texto ul {
  padding-left: 1.25rem;
  margin-top: 0.5rem;
}

.leyenda-texto li {
  margin-bottom: 0.25rem;
}

.comprobante-footer {
  padding: 1.5rem;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  border-radius: 0 0 12px 12px;
}

@media print {
  .comprobante-overlay {
    background: white;
    position: static;
  }
  
  .btn-close-comprobante,
  .comprobante-footer {
    display: none !important;
  }
  
  .comprobante-container {
    max-width: 100%;
    box-shadow: none;
  }
}

@media (max-width: 576px) {
  .comprobante-header h3 {
    font-size: 1.5rem;
  }
  
  .folio-numero {
    font-size: 1.5rem;
  }
  
  .dato-item {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .dato-valor {
    text-align: left;
  }
  
  .leyenda-tiempo,
  .leyenda-cancelacion {
    flex-direction: column;
    text-align: center;
  }
}
</style>
