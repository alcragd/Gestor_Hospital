# 🏥 Sistema Gestor Hospital

**Estado:** ✅ **PROYECTO COMPLETO - LISTO PARA EVALUACIÓN**  
**Fecha de Finalización:** Enero 2026  
**Cobertura de Requisitos:** 23/23 (100%)  

Sistema integral de gestión hospitalaria desarrollado con Node.js, Express y Vue.js 3. Incluye módulos completos para gestión de pacientes, doctores, citas médicas, servicios, farmacia y auditoría.

## 📚 DOCUMENTACIÓN PRINCIPAL

> **⭐ LEER PRIMERO:** [DOCUMENTACION_FINAL.md](DOCUMENTACION_FINAL.md) - Guía completa del proyecto

- **[DOCUMENTACION_FINAL.md](DOCUMENTACION_FINAL.md)** - Documentación técnica completa con guía de demostración
- **[COBERTURA_UI_REQUISITOS.md](COBERTURA_UI_REQUISITOS.md)** - Mapeo completo de 23 requisitos vs componentes UI
- **[VEREDICTO_FINAL_AUDITORIA.md](VEREDICTO_FINAL_AUDITORIA.md)** - Validación de bitácoras y triggers

## 🚀 Tecnologías

**Backend:**
- Node.js + Express
- SQL Server 2022 Express (GestorHospitalDB)
- JWT para autenticación
- Arquitectura de servicios (Controllers + Services + Routes)

**Frontend:**
- Vue.js 3 (Composition API)
- Vite
- Bootstrap 5
- 21 Componentes Vue implementados

## 📋 Características Completadas

### ✅ 23/23 Requisitos Implementados

**RECEPCIÓN (8/8):**
- 🔐 Autenticación multi-rol
- 👤 Gestión de Pacientes (CRUD completo)
- 📅 Sistema de Citas con validaciones automáticas
- 💳 Registro de Pagos (Efectivo/Tarjeta/Transferencia)
- ❌ Cancelación de citas con reembolsos automáticos
- 🏥 Venta de Servicios médicos
- 👨‍⚕️ Consulta de información de doctores
- 📝 Actualización de datos de pacientes

**MÉDICO (5/5):**
- 🩺 Atender citas confirmadas
- 💊 Generar recetas con múltiples medicamentos
- 📋 Registrar diagnósticos en historial
- 📖 Consultar historial médico completo (3 tabs)
- 📅 Consultar citas del día

**PACIENTE (5/5):**
- 📅 Consultar citas agendadas
- 💊 Consultar recetas generadas
- 📥 Descargar recetas en PDF
- 📖 Consultar historial de consultas
- 💳 Ver detalle de pagos

**FARMACIA (3/3):**
- 💊 Venta con receta (validación automática)
- 💊 Venta sin receta (solo venta libre)
- 📦 Actualizar stock de medicamentos

**ADMINISTRACIÓN (2/2):**
- 📊 Consultar bitácoras de auditoría (inmutables)
- 📈 Generar reportes del sistema

### Validaciones Automáticas

✅ Fecha futura obligatoria (CHECK constraint)  
✅ Mínimo 48 horas de anticipación (Trigger)  
✅ Doctor tiene horario disponible (Trigger)  
✅ Sin citas duplicadas pendientes (Trigger)  
✅ Reembolsos automáticos: 100%/50%/0% según tiempo  
✅ Bitácoras inmutables automáticas (8 triggers)

## 🛠️ Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ (https://nodejs.org/)
- SQL Server 2022 Express
- SQL Server Management Studio (SSMS)
- npm

### 1. Clonar el repositorio

```bash
git clone <url-repositorio>
cd GestorHospital
### Instalación Rápida

**1. Restaurar Base de Datos:**

```sql
-- En SQL Server Management Studio (SSMS)
RESTORE DATABASE GestorHospitalDB
FROM DISK = 'C:\ruta\sql\GestorHospitalDB.bak'
WITH REPLACE;
```

**2. Configurar Backend:**

```powershell
cd "c:\Users\angel\Documents\ESCOM\Bases de Datos\GestorHospital"
npm install
# Verificar src/config/db.config.js
node server.js
```

**3. Configurar Frontend:**

```powershell
cd Gestor-Front
npm install
npm run dev
```

**4. Acceder al Sistema:**

- **URL:** http://localhost:5173/login.html
- **Usuarios de prueba:**
  - Recepcionista: `recepcionista1` / `pass123`
  - Doctor: `doctor1` / `pass123`
  - Paciente: `paciente1` / `pass123`

## 📊 Estado de la Base de Datos

**Base de Datos Limpia (Lista para Demo):**

| Tabla | Registros | Estado |
|-------|-----------|--------|
| Citas | 0 | ✅ Limpia |
| Pago | 0 | ✅ Limpia |
| Venta | 0 | ✅ Limpia |
| Recetas | 0 | ✅ Limpia |
| Usuarios | 37 | ✅ Preservados (4 roles) |
| Pacientes | 11 | ✅ Preservados |
| Empleados | 21 | ✅ Preservados (Doctores) |
| Especialidades | 10 | ✅ Catálogo completo |
| Servicios | 10 | ✅ Catálogo completo |
| Medicamento | 10 | ✅ Inventario disponible |
| Bitacora | 11 | ✅ Limpia (solo estructurales) |

## 🎯 Guía de Demostración

Ver **[DOCUMENTACION_FINAL.md](DOCUMENTACION_FINAL.md) - Sección 4** para:
- 10 pasos de demostración secuencial
- Queries SQL de validación
- Explicación de constraints y triggers
- Casos de uso completos

## 🔐 Seguridad y Auditoría

### Sistema de Bitácoras

- **Tabla Principal:** `Bitacora` (28 tablas auditadas)
- **Triggers Automáticos:** 8 triggers activos
- **Características:**
  - ✅ Inmutables (no se pueden modificar/eliminar)
  - ✅ Automáticas (generadas por triggers)
  - ✅ Completas (valores anteriores/nuevos en JSON)
  - ✅ Trazables (usuario, fecha, hora exacta)

### Tablas Especializadas

- `Bitacora_Estatus_Citas` - Rastreo de cambios de estatus
- `Bitacora_Historial_Medico` - Auditoría de accesos a historiales

Ver **[VEREDICTO_FINAL_AUDITORIA.md](VEREDICTO_FINAL_AUDITORIA.md)** para análisis completo.

## 📁 Estructura del Proyecto

```
GestorHospital/
├── 📄 DOCUMENTACION_FINAL.md          ⭐ DOCUMENTACIÓN PRINCIPAL
├── 📄 COBERTURA_UI_REQUISITOS.md      (Mapeo 23 requisitos)
├── 📄 VEREDICTO_FINAL_AUDITORIA.md    (Validación bitácoras)
├── 📄 README.md                       (Este archivo)
├── 📄 server.js                       (Punto de entrada backend)
├── 📁 src/                            (Backend - 24 archivos)
│   ├── config/                        (Configuración BD)
│   ├── controllers/                   (Controladores API)
│   ├── services/                      (Lógica de negocio)
│   └── routes/                        (Rutas Express)
├── 📁 Gestor-Front/                   (Frontend Vue.js)
│   ├── src/
│   │   ├── components/                (21 componentes .vue)
│   │   │   ├── FormularioCita.vue
│   │   │   ├── GenerarReceta.vue     🆕
│   │   │   ├── HistorialMedico.vue   🆕
│   │   │   ├── PanelDoctor.vue
│   │   │   ├── PanelPaciente.vue
│   │   │   ├── PanelRecepcionista.vue
│   │   │   ├── GestionCitas.vue
│   │   │   ├── GestionPacientes.vue
│   │   │   ├── Farmacia.vue
│   │   │   └── ...
│   │   ├── services/                  (API calls)
│   │   └── assets/                    (CSS)
│   └── public/                        (HTML por rol)
├── 📁 sql/                            
│   └── GestorHospitalDB.bak          (Backup BD - 64 MB)
└── 📁 scripts/                        (Vacío - limpiado)
```

## 🎓 Métricas del Sistema

- **Tablas de Base de Datos:** 28
- **Stored Procedures:** 15+
- **Triggers:** 8 (validación + auditoría)
- **Componentes Vue:** 21
- **Rutas API:** 30+
- **Usuarios del Sistema:** 37 (4 roles)
- **Líneas de Código Backend:** ~2,500
- **Líneas de Código Frontend:** ~3,000

## ✅ Validación de Completitud

| Aspecto | Estado | Evidencia |
|---------|--------|----------|
| **Requisitos PDF** | ✅ 23/23 (100%) | [COBERTURA_UI_REQUISITOS.md](COBERTURA_UI_REQUISITOS.md) |
| **Bitácoras Inmutables** | ✅ Completo | [VEREDICTO_FINAL_AUDITORIA.md](VEREDICTO_FINAL_AUDITORIA.md) |
| **Frontend Funcional** | ✅ 21 componentes | Todos los roles operativos |
| **Backend API** | ✅ 30+ rutas | CRUD completo |
| **Validaciones BD** | ✅ 8 triggers | Constraints + Triggers activos |
| **Documentación** | ✅ Completa | 4 archivos markdown |
| **Base de Datos** | ✅ Limpia | 0 datos de prueba |

## 🎬 Demostración

Para realizar la demostración completa del sistema:

1. **Iniciar servicios:**
   ```powershell
   # Terminal 1 - Backend
   node server.js
   
   # Terminal 2 - Frontend  
   cd Gestor-Front
   npm run dev
   ```


2. **Ejecutar 10 pasos secuenciales:**
   - Acceso al sistema (3 roles)
   - Crear cita (validaciones automáticas)
   - Registrar pago
   - Validar bitácoras
   - Atender cita (médico)
   - Generar receta
   - Ver historial médico
   - Venta en farmacia
   - Cancelar cita (reembolsos)
   - Consultar bitácoras completas

## 📞 Información del Proyecto

**Institución:** ESCOM - Bases de Datos  
**Periodo:** 2026-1  


---

## 🔧 Detalles Técnicos Adicionales

### 1. Configurar la Base de Datos (Detalle)

**Restaurar desde backup (.bak)**

1. Abrir SQL Server Management Studio (SSMS)
2. Conectarse a tu instancia de SQL Server
3. Click derecho en **Databases** → **Restore Database**
4. Seleccionar **Device** → Click en **[...]**
5. Click en **Add** → Buscar el archivo `GestorHospitalDB.bak` en la carpeta `sql/`
6. Click en **OK** → **OK** para restaurar
7. La base de datos `GestorHospitalDB` estará lista con todos los datos de prueba

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
npm run dev
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

## ✅ Fase 4 — Cierre y Demostración

- Interfaz por rol con acceso protegido (login.html → doctor/paciente/farmacia/recepcion).
- Dashboards finales:
    - Paciente: agendar, ver, pagar, cancelar citas.
    - Doctor: ver agenda con filtros (informativo).
    - Recepción: CRUD pacientes/doctores, citas, ventas.
    - Farmacia: inventario, venta y actualización de stock.
- Confirmaciones para acciones críticas y mensajes de error amigables.
- Sin cambios en BD ni reglas de negocio; solo consumo de endpoints existentes.

## 👥 Usuarios de Prueba

| Tipo | Usuario | Rol ID |
|------|---------|--------|
| Recepcionista | rec_laura | 3 |
| Doctor | (existente en BD) | 1 |
| Farmacéutico | (existente en BD) | 2 |
| Paciente | Regístrate en login (createFull) | 4 |

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
POST   /api/citas/agendar                # Paciente agenda autenticado (headers x-user-*)
GET    /api/citas/mis-citas              # Historial de citas del paciente autenticado
GET    /api/citas/mis-citas-doctor       # Historial de citas del doctor autenticado
GET    /api/citas/especialidades         # Listado de especialidades
GET    /api/citas/doctores/:id_especialidad
POST   /api/citas/disponibilidad         # Slots ocupados
POST   /api/citas/horario-trabajo        # Rangos de trabajo
```

### Servicios

```http
GET    /api/recepcion/servicios          # Listar servicios
POST   /api/recepcion/servicios/venta    # Registrar venta
```

### Farmacia

```http
GET    /api/recepcion/medicamentos       # Inventario
POST   /api/recepcion/medicamentos/venta # Registrar venta
PUT    /api/recepcion/medicamentos/:id/stock   # Actualizar stock

### Pagos

```http
POST   /api/pagos/registrar              # Registrar pago
GET    /api/pagos/cita/:id               # Detalle de pago por cita
GET    /api/pagos/plazo/:id              # Verificar plazo de pago (8h)
GET    /api/pagos/paciente/:id           # Historial de pagos
```

### Cancelaciones

```http
POST   /api/cancelaciones/mis-citas/:id_cita   # Paciente cancela autenticado
GET    /api/cancelaciones/calcular-reembolso/:id
GET    /api/cancelaciones/paciente/:id
```
```

## 📂 Estructura del Proyecto

```
GestorHospital/
├── server.js                           # Entry point backend
├── package.json                        # Dependencias backend
├── src/
│   ├── config/
│   │   └── db.config.js               # Configuración SQL Server
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
    └── GestorHospitalDB.bak           # Backup completo de base de datos
```

## 🔒 Seguridad

- Autenticación basada en sesiones con localStorage
- Validación de roles en rutas protegidas
- Bloqueo de acceso por URL directa en páginas públicas
- Sanitización de inputs en backend
- Prepared statements para prevenir SQL injection

## 🐛 Solución de Problemas

### Backend no inicia

- Verificar que SQL Server esté corriendo
- Revisar credenciales en `src/config/db.config.js`
- Verificar que la instancia SQL Server sea accesible
- Comprobar que el puerto 3000 esté disponible

### Error de conexión a base de datos

- Verificar que la base de datos `GestorHospitalDB` exista
- Comprobar credenciales de SQL Server en `db.config.js`
- Verificar que SQL Server permita conexiones remotas
- Revisar que el usuario tenga permisos sobre la base de datos

### Frontend muestra página en blanco

- Verificar que el backend esté corriendo en puerto 3000
- Limpiar cache del navegador (Ctrl + Shift + R)
- Revisar consola del navegador (F12) para errores
 - Confirmar que el rol del usuario coincide con la página (ej. doctor.html requiere rol 1)

### Error de CORS

- Asegurar que el backend incluya headers CORS correctos
- Verificar que las URLs de API coincidan (localhost:3000)

### Error de CORS

- Asegurar que el backend incluya headers CORS correctos
- Verificar que las URLs de API coincidan (localhost:3000)

## 📝 Notas de Desarrollo

- El proyecto usa Vue 3 sin Vue Router (navegación por páginas HTML)
- Los componentes utilizan Composition API y Options API
- Bootstrap se importa globalmente en `main.js`
- Las validaciones de citas se ejecutan en el backend

## 🧪 Guía de Pruebas (Resumen)

- Paciente:
    - Login → paciente.html → agendar cita (recibo mostrado).
    - Pagar cita programada → verificar ticket.
    - Cancelar cita (programada/pagada) → ver mensaje y reembolso calculado.
- Doctor:
    - Login → doctor.html → ver agenda con filtros.
- Recepción:
    - CRUD Pacientes/Doctores, gestión de citas, ventas (Servicios/Medicamentos).
- Farmacia:
    - Inventario, venta y actualización de stock.

Consistencia: flujos completos sin errores, permisos correctos por rol. Ningún cambio de BD.

## 👨‍💻 Autor

Desarrollado como proyecto de Bases de Datos - ESCOM

## 📄 Licencia

Este proyecto es de uso académico.
