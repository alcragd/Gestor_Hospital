<template>
  <!-- SIDEBAR DESLIZABLE -->
  <div class="sidebar" :class="{ open: sidebarOpen }">
    <div class="sidebar-header">
      <h4 class="text-center mb-3">Mi Perfil</h4>
    </div>

    <hr>

    <div class="sidebar-section">
      <h6>Información</h6>
      <p><strong>Usuario:</strong> {{ usuarioNombre }}</p>
      <p><strong>Rol:</strong> Recepcionista</p>
      <p><strong>ID:</strong> {{ userId }}</p>
    </div>

    <hr>

    <div class="sidebar-section">
      <h6>Accesos Rápidos</h6>
      <div class="d-grid gap-2">
        <button 
          v-for="item in menuItems"
          :key="item.id"
          :class="['btn', currentView === item.id ? 'btn-primary' : 'btn-outline-primary']"
          @click="currentView = item.id; sidebarOpen = false">
          {{ item.label }}
        </button>
      </div>
    </div>

    <hr>

    <div class="sidebar-section">
      <button class="btn btn-danger w-100" @click="logout">
        Cerrar Sesión
      </button>
    </div>
  </div>

  <!-- BOTÓN PARA ABRIR SIDEBAR -->
  <button class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
    ☰
  </button>

  <div class="form-wrapper">
    <div class="card shadow-sm panel-card">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">Panel de Recepcionista - {{ usuarioNombre }}</h5>
      </div>

      <div class="card-body">
        <GestionPacientes v-if="currentView === 'pacientes'" />
        <GestionDoctores v-if="currentView === 'doctores'" />
        <GestionCitas v-if="currentView === 'citas'" />
        <VentasUnificadas v-if="currentView === 'ventas'" />
        <GestionRecepcionistas v-if="currentView === 'recepcionistas'" />
      </div>
    </div>
  </div>
</template>

<script>
import GestionPacientes from './GestionPacientes.vue';
import GestionDoctores from './GestionDoctores.vue';
import GestionCitas from './GestionCitas.vue';
import VentasUnificadas from './VentasUnificadas.vue';
import GestionRecepcionistas from './GestionRecepcionistas.vue';

export default {
  name: 'PanelRecepcionista',
  components: {
    GestionPacientes,
    GestionDoctores,
    GestionCitas,
    VentasUnificadas,
    GestionRecepcionistas
  },
  data() {
    return {
      currentView: 'pacientes',
      usuarioNombre: 'Recepcionista',
      userId: localStorage.getItem('userId') || 'N/A',
      sidebarOpen: false,
      menuItems: [
        { id: 'pacientes', label: 'Pacientes' },
        { id: 'doctores', label: 'Doctores' },
        { id: 'citas', label: 'Citas' },
        { id: 'ventas', label: 'Ventas' },
        { id: 'recepcionistas', label: 'Recepcionistas' }
      ]
    };
  },
  mounted() {
    this.cargarDatosUsuario();
    console.log('PanelRecepcionista montado - currentView:', this.currentView);
  },
  methods: {
    cargarDatosUsuario() {
      const username = localStorage.getItem('username');
      if (username) {
        this.usuarioNombre = username;
      }
      console.log('Usuario cargado:', this.usuarioNombre);
    },
    logout() {
      if (confirm('¿Estás seguro que deseas cerrar sesión?')) {
        localStorage.removeItem('userId');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        localStorage.removeItem('token');
        // Redirigir a login
        if (this.$router) {
          this.$router.push('/login');
        } else {
          window.location.href = '/login.html';
        }
      }
    }
  }
};
</script>

<style scoped>
/* SIDEBAR DESLIZABLE */
.sidebar {
  position: fixed;
  left: -300px;
  top: 0;
  width: 280px;
  height: 100%;
  background: #ffffff;
  border-right: 1px solid #ddd;
  box-shadow: 2px 0px 10px rgba(0,0,0,0.1);
  padding: 20px;
  transition: 0.30s ease;
  z-index: 2000;
  overflow-y: auto;
}

.sidebar.open {
  left: 0;
}

.sidebar-toggle {
  position: fixed;
  left: 10px;
  top: 10px;
  z-index: 2100;
  background: #0d6efd;
  color: #fff;
  border: none;
  font-size: 20px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
  transition: all 0.3s;
}

.sidebar-toggle:hover {
  background: #0b5ed7;
  transform: scale(1.05);
}

.sidebar-header h4 {
  color: #0d6efd;
  font-weight: 600;
  font-size: 1.25rem;
}

.sidebar-section {
  margin-bottom: 20px;
}

.sidebar-section h6 {
  margin-bottom: 12px;
  font-weight: bold;
  color: #0d6efd;
  font-size: 0.95rem;
}

.sidebar-section p {
  margin: 8px 0;
  font-size: 0.9rem;
  color: #495057;
}

.sidebar-section .btn {
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

/* WRAPPER CENTRADO COMO FORMULARIO CITA */
.form-wrapper {
  display: flex;
  justify-content: center;
  padding: 1.25rem;
  min-height: 100vh;
  background: #f5f5f5;
}

/* PANEL CARD */
.panel-card {
  width: 100%;
  max-width: 1400px;
  min-width: 1100px;
  margin: 0 auto;
  box-sizing: border-box;
  align-self: flex-start;
}

.panel-card .card-body {
  padding: 2rem;
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .panel-card {
    margin: 0.5rem;
    padding: 0.1rem;
    min-width: auto;
  }
  
  .panel-card .card-body {
    padding: 1rem;
  }
}
</style>
