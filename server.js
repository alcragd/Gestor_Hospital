const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

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

app.use('/api/citas', citasRoutes);
app.use('/auth', authRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/cancelaciones', cancelacionesRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/doctores', doctoresRoutes);
app.use('/api/recepcion', recepcionRoutes); // FASE 3

app.get('/', (req, res) => {
  res.send('API del Gestor Hospital funcionando...');
});

app.listen(PORT, () => {
  console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});
