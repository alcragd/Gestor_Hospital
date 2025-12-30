    <template>
    <div>
        <!-- BOTÓN ABRIR -->
        <button class="sidebar-toggle" @click="toggle">
        MENU
        </button>

        <!-- PANEL -->
        <div class="sidebar" :class="{ open: isOpen }">
        <div class="sidebar-header">
            <h4>Mi Perfil</h4>
            <button class="btn btn-danger btn-sm" @click="logout">Cerrar Sesión</button>
        </div>

        <hr>

        <div class="sidebar-section">
            <h6>Datos Personales</h6>
            <p><strong>Nombre:</strong> {{ user.nombre || "N/D" }}</p>
            <p><strong>Correo:</strong> {{ user.correo || "N/D" }}</p>
            <p><strong>Teléfono:</strong> {{ user.telefono || "N/D" }}</p>
        </div>

        <slot></slot> <!-- Aquí puedes agregar cosas extras si quieres -->

        </div>
    </div>
    </template>

    <script>
    export default {
    name: "SideBarUsuario",

    data() {
        return {
        isOpen: false,
        user: {
            nombre: "",
            correo: "",
            telefono: ""
        }
        };
    },

    mounted() {
        // Cargar datos del usuario desde localStorage
        this.user.nombre = localStorage.getItem("nombre");
        this.user.correo = localStorage.getItem("correo");
        this.user.telefono = localStorage.getItem("telefono");
    },

    methods: {
        toggle() {
        this.isOpen = !this.isOpen;
        },

        logout() {
        localStorage.clear();
        window.location.href = "/login.html";
        }
    }
    };
    </script>

    <style scoped>
    .sidebar {
    position: fixed;
    left: -280px;
    top: 0;
    width: 260px;
    height: 100%;
    background: #ffffff;
    border-right: 1px solid #ddd;
    box-shadow: 2px 0px 10px rgba(0,0,0,0.1);
    padding: 15px;
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
    }

    .sidebar-section h6 {
    font-weight: bold;
    color: #0d6efd;
    }
    </style>
