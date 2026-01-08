const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./src/config/db.config');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// RUTAS
const citasRoutes = require('./src/routes/citas.routes');
const authRoutes  = require('./src/routes/authLogin');  // ← ESTA ES LA RUTA CORRECTA
const pagosRoutes = require('./src/routes/pagos.routes');
const cancelacionesRoutes = require('./src/routes/cancelaciones.routes');
const pacientesRoutes = require('./src/routes/pacientes.routes');
const doctoresRoutes = require('./src/routes/doctores.routes');
const recepcionRoutes = require('./src/routes/recepcion.routes'); // FASE 3
const bitacorasRoutes = require('./src/routes/bitacoras.routes'); // FASE 5

app.use('/api/citas', citasRoutes);
app.use('/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/cancelaciones', cancelacionesRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/doctores', doctoresRoutes);
app.use('/api/recepcion', recepcionRoutes); // FASE 3
app.use('/api/bitacoras', bitacorasRoutes); // FASE 5

app.get('/', (req, res) => {
  res.send('API del Gestor Hospital funcionando...');
});

// ============================================
// PROCESOS AUTOMÁTICOS
// ============================================
let pool;
const INTERVALO_CANCELACION = 60 * 60 * 1000; // 1 hora
const INTERVALO_NO_ASISTENCIAS = 60 * 60 * 1000; // 1 hora

async function inicializarProcesosAutomaticos() {
  try {
    pool = await db.connect();
    console.log('✓ Pool de BD conectado para procesos automáticos');
    
    // Ejecutar inmediatamente al iniciar
    await ejecutarCancelacionAutomatica();
    await ejecutarMarcarNoAsistencias();
    
    // Luego ejecutar periódicamente
    setInterval(async () => {
      await ejecutarCancelacionAutomatica();
    }, INTERVALO_CANCELACION);
    
    setInterval(async () => {
      await ejecutarMarcarNoAsistencias();
    }, INTERVALO_NO_ASISTENCIAS);
    
  } catch (error) {
    console.error('✗ Error al inicializar procesos automáticos:', error.message);
  }
}

async function ejecutarCancelacionAutomatica() {
  const ahora = new Date().toISOString();
  console.log(`\n[${ahora}] Ejecutando auto-cancelación de citas expiradas...`);
  
  try {
    const resultado = await pool.request().execute('SP_CancelarCitasExpiradas');
    const datos = resultado.recordset[0];
    const canceladas = datos?.Citas_Canceladas || 0;
    
    if (canceladas > 0) {
      console.log(`✓ ${canceladas} cita(s) cancelada(s) por exceder 8 horas sin pago`);
    } else {
      console.log('  No hay citas para cancelar');
    }
  } catch (error) {
    console.error('✗ Error en auto-cancelación:', error.message);
  }
}

async function ejecutarMarcarNoAsistencias() {
  const ahora = new Date().toISOString();
  console.log(`\n[${ahora}] Marcando citas como No Acudió...`);
  
  try {
    const resultado = await pool.request().execute('SP_MarcarNoAsistencias');
    const datos = resultado.recordset[0];
    const marcadas = datos?.Citas_Marcadas || 0;
    
    if (marcadas > 0) {
      console.log(`✓ ${marcadas} cita(s) marcada(s) como No Acudió (24h después de la hora programada)`);
    } else {
      console.log('  No hay citas para marcar como No Acudió');
    }
  } catch (error) {
    console.error('✗ Error al marcar no-asistencias:', error.message);
  }
}

app.listen(PORT, () => {
  console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
  console.log('Inicializando procesos automáticos (cancelación + no-asistencias)...');
  inicializarProcesosAutomaticos();
});
