<template>
  <div class="panel-recepcionista">
    <header class="header">
      <h1>🏥 Panel de Recepcionista</h1>
      <div class="user-info">
        <span>{{ usuarioNombre }}</span>
        <button @click="logout" class="btn-logout">Cerrar Sesión</button>
      </div>
    </header>

    <nav class="navbar">
      <button 
        v-for="item in menuItems"
        :key="item.id"
        :class="{ active: currentView === item.id }"
        @click="currentView = item.id"
        class="nav-item">
        {{ item.icon }} {{ item.label }}
      </button>
    </nav>

    <div class="content">
      <GestionPacientes v-if="currentView === 'pacientes'" />
      <GestionDoctores v-if="currentView === 'doctores'" />
      <VentaServicios v-if="currentView === 'servicios'" />
      <Farmacia v-if="currentView === 'farmacia'" />
    </div>

    <footer class="footer">
      <p>&copy; 2025 Gestor Hospital - Sistema de Recepción</p>
    </footer>
  </div>
</template>

<script>
import GestionPacientes from './GestionPacientes.vue';
import GestionDoctores from './GestionDoctores.vue';
import VentaServicios from './VentaServicios.vue';
import Farmacia from './Farmacia.vue';

export default {
  name: 'PanelRecepcionista',
  components: {
    GestionPacientes,
    GestionDoctores,
    VentaServicios,
    Farmacia
  },
  data() {
    return {
      currentView: 'pacientes',
      usuarioNombre: 'Recepcionista',
      menuItems: [
        { id: 'pacientes', label: 'Pacientes', icon: '👤' },
        { id: 'doctores', label: 'Doctores', icon: '👨‍⚕️' },
        { id: 'servicios', label: 'Servicios', icon: '🏥' },
        { id: 'farmacia', label: 'Farmacia', icon: '💊' }
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
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.panel-recepcionista {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.header h1 {
  font-size: 28px;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info span {
  font-size: 14px;
}

.btn-logout {
  padding: 8px 16px;
  background: rgba(255,255,255,0.2);
  color: white;
  border: 1px solid white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-logout:hover {
  background: rgba(255,255,255,0.3);
}

.navbar {
  background: white;
  padding: 0;
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e0e0e0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.nav-item {
  flex: 1;
  padding: 16px 20px;
  background: white;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s;
  border-bottom: 3px solid transparent;
}

.nav-item:hover {
  background: #f9f9f9;
  color: #333;
}

.nav-item.active {
  color: #667eea;
  border-bottom-color: #667eea;
  background: #f0f4ff;
}

.content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.footer {
  background: white;
  color: #999;
  text-align: center;
  padding: 20px;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    gap: 15px;
  }

  .header h1 {
    font-size: 22px;
  }

  .navbar {
    flex-wrap: wrap;
  }

  .nav-item {
    flex: 0 1 calc(50% - 5px);
  }
}

.loading-indicator {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 18px;
}

.error-message {
  text-align: center;
  padding: 40px;
  color: #721c24;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  font-size: 16px;
}
</style>
