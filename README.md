# 🏥 Sistema Gestor Hospital

Sistema integral de gestión hospitalaria desarrollado con Node.js, Express y Vue.js 3. Incluye módulos para gestión de pacientes, doctores, citas médicas, servicios y farmacia.

## 🚀 Tecnologías

**Backend:**
- Node.js + Express
- MySQL (base de datos)
- JWT para autenticación

**Frontend:**
- Vue.js 3 (Composition API)
- Vite
- Bootstrap 5

## 📋 Características

### Módulos Implementados

- **🔐 Autenticación** - Login multi-rol (Paciente, Doctor, Farmacéutico, Recepcionista)
- **👤 Gestión de Pacientes** - CRUD completo con creación de usuarios
- **👨‍⚕️ Gestión de Doctores** - CRUD con especialidades y horarios
- **📅 Sistema de Citas** - Agendamiento con validaciones automáticas
- **🏥 Venta de Servicios** - Catálogo de servicios médicos con carrito
- **💊 Farmacia** - Inventario y venta de medicamentos
- **📊 Panel de Recepcionista** - Hub centralizado para operaciones

### Validaciones Automáticas de Citas

✅ Mínimo 48 horas de anticipación  
✅ Máximo 3 meses adelantados  
✅ Sin solapamiento de horarios  
✅ Respeto a horarios laborales del doctor  
✅ No citas duplicadas  

## 🛠️ Instalación

### Prerrequisitos

- Node.js v14 o superior
- MySQL 8.0
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <url-repositorio>
cd GestorHospital
```

### 2. Configurar Base de Datos

Ejecutar el script SQL para crear la base de datos:

```bash
mysql -u root -p < sql/schema.sql
```

### 3. Configurar Backend

```bash
# Instalar dependencias
npm install

# Configurar conexión a BD (src/config/db.config.js)
# Ajustar credenciales según tu entorno
```

### 4. Configurar Frontend

```bash
cd Gestor-Front
npm install
```

## ▶️ Ejecutar el Proyecto

### Terminal 1 - Backend (Puerto 3000)

```bash
node server.js
```

Debería ver: `Server running on port 3000`

### Terminal 2 - Frontend (Puerto 5173)

```bash
cd Gestor-Front
npm run dev
```

Debería ver: `Local: http://localhost:5173`

### Acceso

Abrir navegador en `http://localhost:5173`

## 👥 Usuarios de Prueba

| Tipo | Usuario | Rol ID |
|------|---------|--------|
| Recepcionista | rec_laura | 3 |
| Doctor | (Por crear) | 1 |
| Farmacéutico | (Por crear) | 2 |
| Paciente | (Por crear) | 4 |

## 📡 API Endpoints

### Autenticación

```http
POST /api/auth/login
```

### Pacientes

```http
GET    /api/recepcion/pacientes          # Listar todos
GET    /api/recepcion/pacientes/:id      # Obtener uno
POST   /api/recepcion/pacientes          # Crear
PUT    /api/recepcion/pacientes/:id      # Actualizar
```

### Doctores

```http
GET    /api/recepcion/doctores           # Listar todos
GET    /api/recepcion/doctores/:id       # Obtener uno
POST   /api/recepcion/doctores           # Crear
PUT    /api/recepcion/doctores/:id       # Actualizar
```

### Citas

```http
POST   /api/citas                        # Crear cita
GET    /api/citas/paciente/:id           # Citas de paciente
PUT    /api/citas/:id                    # Actualizar
DELETE /api/citas/:id                    # Cancelar
```

### Servicios

```http
GET    /api/recepcion/servicios          # Listar servicios
POST   /api/recepcion/venta-servicio     # Registrar venta
```

### Farmacia

```http
GET    /api/recepcion/medicamentos       # Inventario
POST   /api/recepcion/venta-medicina     # Registrar venta
PUT    /api/recepcion/medicamentos/:id   # Actualizar stock
```

## 📂 Estructura del Proyecto

```
GestorHospital/
├── server.js                           # Entry point backend
├── package.json                        # Dependencias backend
├── src/
│   ├── config/
│   │   └── db.config.js               # Configuración MySQL
│   ├── controllers/
│   │   ├── AuthController.js          # Autenticación
│   │   ├── cita.controller.js         # Lógica de citas
│   │   └── recepcion.controller.js    # CRUD recepción
│   ├── routes/
│   │   ├── authLogin.js               # Ruta login
│   │   ├── citas.routes.js            # Rutas citas
│   │   └── recepcion.routes.js        # Rutas recepción
│   └── services/
│       ├── cita.service.js            # Lógica negocio citas
│       └── recepcion.service.js       # Lógica negocio CRUD
├── Gestor-Front/
│   ├── package.json                   # Dependencias frontend
│   ├── vite.config.js                 # Config Vite
│   ├── index.html                     # Entry point
│   ├── public/
│   │   ├── login.html                 # Página login
│   │   ├── login.js                   # Lógica login
│   │   ├── paciente.html             # Panel paciente
│   │   ├── doctor.html               # Panel doctor
│   │   ├── farmacia.html             # Panel farmacia
│   │   └── recepcion.html            # Panel recepcionista
│   └── src/
│       ├── main.js                    # Bootstrap Vue
│       ├── App.vue                    # Componente raíz
│       ├── components/
│       │   ├── FormularioCita.vue    # Agendar citas
│       │   └── recepcion/
│       │       ├── PanelRecepcionista.vue
│       │       ├── GestionPacientes.vue
│       │       ├── GestionDoctores.vue
│       │       ├── VentaServicios.vue
│       │       └── Farmacia.vue
│       └── services/
│           ├── authService.js         # Cliente API auth
│           ├── CitaService.js         # Cliente API citas
│           └── RecepcionService.js    # Cliente API recepción
└── sql/
    └── schema.sql                     # Script base de datos
```

## 🔒 Seguridad

- Autenticación basada en sesiones con localStorage
- Validación de roles en rutas protegidas
- Sanitización de inputs en backend
- Prepared statements para prevenir SQL injection

## 🐛 Solución de Problemas

### Backend no inicia

- Verificar que MySQL esté corriendo
- Revisar credenciales en `src/config/db.config.js`
- Comprobar que el puerto 3000 esté disponible

### Frontend muestra página en blanco

- Verificar que el backend esté corriendo en puerto 3000
- Limpiar cache del navegador (Ctrl + Shift + R)
- Revisar consola del navegador (F12) para errores

### Error de CORS

- Asegurar que el backend incluya headers CORS correctos
- Verificar que las URLs de API coincidan (localhost:3000)

## 📝 Notas de Desarrollo

- El proyecto usa Vue 3 sin Vue Router (navegación por páginas HTML)
- Los componentes utilizan Composition API y Options API
- Bootstrap se importa globalmente en `main.js`
- Las validaciones de citas se ejecutan en el backend

## 👨‍💻 Autor

Desarrollado como proyecto de Bases de Datos - ESCOM

## 📄 Licencia

Este proyecto es de uso académico.
