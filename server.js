const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const citasRoutes = require('./src/routes/citas.routes');

const app = express();
const PORT = 3000;

app.use(cors());

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar las rutas del módulo de citas
app.use('/api/citas', citasRoutes);

// Mensaje de Bienvenida (Opcional)
app.get('/', (req, res) => {
  res.send('API del Gestor Hospitalario funcionando...');
});

app.listen(PORT, () => {
    console.log(`Servidor Node.js corriendo en http://localhost:${PORT}`);
});