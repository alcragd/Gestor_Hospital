<!-- DEBUG: Test de Componentes Recepcionista -->
<template>
  <div style="padding: 20px; font-family: Arial;">
    <h1>🔍 Debug Panel Recepcionista</h1>
    
    <div style="background: #f0f0f0; padding: 10px; margin: 10px 0; border-radius: 4px;">
      <h3>Información del Sistema:</h3>
      <p><strong>userRole (App):</strong> <span style="color: blue;">{{ debugInfo.userRole }}</span></p>
      <p><strong>currentView:</strong> <span style="color: blue;">{{ debugInfo.currentView }}</span></p>
      <p><strong>localStorage.userRole:</strong> <span style="color: blue;">{{ debugInfo.localStorageRole }}</span></p>
      <p><strong>localStorage.userId:</strong> <span style="color: blue;">{{ debugInfo.localStorageId }}</span></p>
      <p><strong>localStorage.username:</strong> <span style="color: blue;">{{ debugInfo.localStorageUsername }}</span></p>
    </div>

    <div style="background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 4px;">
      <h3>Componentes Disponibles:</h3>
      <ul>
        <li>✅ GestionPacientes</li>
        <li>✅ GestionDoctores</li>
        <li>✅ VentaServicios</li>
        <li>✅ Farmacia</li>
      </ul>
    </div>

    <div style="background: #d4edda; padding: 10px; margin: 10px 0; border-radius: 4px;">
      <h3>Pruebas Rápidas:</h3>
      <button @click="cambiarView('pacientes')" style="padding: 8px 12px; margin: 5px; cursor: pointer;">
        Ir a Pacientes
      </button>
      <button @click="cambiarView('doctores')" style="padding: 8px 12px; margin: 5px; cursor: pointer;">
        Ir a Doctores
      </button>
      <button @click="cambiarView('servicios')" style="padding: 8px 12px; margin: 5px; cursor: pointer;">
        Ir a Servicios
      </button>
      <button @click="cambiarView('farmacia')" style="padding: 8px 12px; margin: 5px; cursor: pointer;">
        Ir a Farmacia
      </button>
    </div>

    <div style="background: #f8d7da; padding: 10px; margin: 10px 0; border-radius: 4px;">
      <h3>Console Output:</h3>
      <pre style="background: #fff; padding: 10px; overflow-x: auto;">{{ consoleOutput }}</pre>
    </div>

    <button @click="volver" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
      Volver al Panel Principal
    </button>
  </div>
</template>

<script>
export default {
  name: 'DebugPanel',
  data() {
    return {
      debugInfo: {
        userRole: null,
        currentView: null,
        localStorageRole: null,
        localStorageId: null,
        localStorageUsername: null
      },
      consoleOutput: ''
    }
  },
  mounted() {
    this.actualizarDebug();
    console.log('Debug Panel montado');
  },
  methods: {
    actualizarDebug() {
      this.debugInfo.userRole = this.$parent?.userRole || 'N/A';
      this.debugInfo.currentView = this.$parent?.currentView || 'N/A';
      this.debugInfo.localStorageRole = localStorage.getItem('userRole');
      this.debugInfo.localStorageId = localStorage.getItem('userId');
      this.debugInfo.localStorageUsername = localStorage.getItem('username');
      
      this.consoleOutput = `
App userRole: ${this.debugInfo.userRole}
localStorage.userRole: ${this.debugInfo.localStorageRole}
localStorage.userId: ${this.debugInfo.localStorageId}
localStorage.username: ${this.debugInfo.localStorageUsername}
currentView: ${this.debugInfo.currentView}

Console iniciado a las: ${new Date().toLocaleString()}
      `.trim();
    },
    cambiarView(view) {
      console.log('Cambiando vista a:', view);
      this.consoleOutput += `\n✅ Cambio a vista: ${view} (${new Date().toLocaleTimeString()})`;
    },
    volver() {
      this.$emit('volver-panel');
    }
  }
}
</script>

<style scoped>
button:hover {
  opacity: 0.8;
  transform: scale(1.05);
}
</style>
