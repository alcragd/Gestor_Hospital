<script>
import FormularioCita from './components/FormularioCita.vue'
import PanelRecepcionista from './components/recepcion/PanelRecepcionista.vue'
import Farmacia from './components/recepcion/Farmacia.vue'
import PanelPaciente from './components/paciente/PanelPaciente.vue'
import PanelDoctor from './components/doctor/PanelDoctor.vue'

export default {
  name: 'App',
  components: {
    FormularioCita,
    PanelRecepcionista,
    Farmacia,
    PanelPaciente,
    PanelDoctor
  },
  data() {
    const role = localStorage.getItem('userRole');
    let roleNum = null;
    if (role) {
      const n = parseInt(role, 10);
      if (!isNaN(n)) {
        roleNum = n;
      }
    }
    return {
      userRole: roleNum
    }
  },
  mounted() {
    // Obtener el rol del usuario desde localStorage
    this.cargarRol();
    
    // Listener para cambios en storage (login desde otra pestaña)
    window.addEventListener('storage', this.cargarRol);
  },
  beforeUnmount() {
    window.removeEventListener('storage', this.cargarRol);
  },
  methods: {
    cargarRol() {
      const role = localStorage.getItem('userRole');
      // Convertir a número, manejo seguro
      let roleNum = null;
      if (role) {
        roleNum = parseInt(role, 10);
        if (isNaN(roleNum)) {
          roleNum = null;
        }
      }
      this.userRole = roleNum;
      console.log('🔍 App.vue - cargarRol():');
      console.log('  role desde localStorage:', role, '(tipo:', typeof role + ')');
      console.log('  roleNum después de parseInt:', this.userRole, '(tipo:', typeof this.userRole + ')');
      console.log('  ¿Es recepcionista (3)?', this.userRole === 3);
    }
  }
}
</script>

<template>
  <div id="app">
    <!-- Recepcionista -->
    <PanelRecepcionista v-if="userRole === 3" />
    <!-- Farmacéutico -->
    <Farmacia v-else-if="userRole === 2" />
    <!-- Doctor -->
    <PanelDoctor v-else-if="userRole === 1" />
    <!-- Paciente -->
    <PanelPaciente v-else-if="userRole === 4" />
    <!-- Invitado / fallback: agendar básica -->
    <div v-else class="bg-light min-vh-100 py-5">
      <FormularioCita />
    </div>
  </div>
</template>

<style scoped>
/* Estilos opcionales */
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>