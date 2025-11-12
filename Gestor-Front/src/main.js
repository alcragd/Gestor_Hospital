// src/main.js

import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// >>> AÑADE ESTAS LÍNEAS para importar los estilos de Bootstrap
import 'bootstrap/dist/css/bootstrap.css'
// Si quieres el soporte JS de Bootstrap (dropdowns, modales, etc.):
import 'bootstrap/dist/js/bootstrap.bundle.min.js' 
// <<< FIN DE IMPORTACIÓN DE BOOTSTRAP

createApp(App).mount('#app')
