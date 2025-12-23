# 🎨 Diagrama de Flujo - FASE 3 BLOQUE 4

## 📊 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICACIÓN DE HOSPITAL                        │
│                    (FASE 3 COMPLETADA)                          │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vue 3)                          │
│                     (Gestor-Front)                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌───────────────────────────────────────────────────────┐   │
│    │        App.vue (Router Principal)                      │   │
│    │  Valida: userRole === 3 → Panel Recepcionista        │   │
│    └───────────────────────────────────────────────────────┘   │
│                          │                                       │
│    ┌────────────────────┴─────────────────────────────────┐    │
│    │      PanelRecepcionista.vue (Shell)                  │    │
│    │    ┌─────────────────────────────────────────┐       │    │
│    │    │  🏥 Header: Nombre usuario + Logout    │       │    │
│    │    │                                          │       │    │
│    │    │  📋 Navbar:                             │       │    │
│    │    │  ├─ 👤 Pacientes                       │       │    │
│    │    │  ├─ 👨‍⚕️ Doctores                         │       │    │
│    │    │  ├─ 🏥 Servicios                       │       │    │
│    │    │  └─ 💊 Farmacia                        │       │    │
│    │    └─────────────────────────────────────────┘       │    │
│    └────────────────────┬─────────────────────────────────┘    │
│                         │                                        │
│        ┌────────────────┼────────────────┬───────────────┐      │
│        │                │                │               │      │
│        ▼                ▼                ▼               ▼      │
│   ┌────────────┐  ┌────────────┐  ┌─────────────┐ ┌────────┐  │
│   │ Gestión    │  │ Gestión    │  │ Venta de    │ │Farmacia│  │
│   │ Pacientes  │  │ Doctores   │  │ Servicios   │ │        │  │
│   │            │  │            │  │             │ │- Venta │  │
│   │- Listar    │  │- Listar    │  │- Catálogo   │ │- Stock │  │
│   │- Crear     │  │- Crear     │  │- Carrito    │ │        │  │
│   │- Editar    │  │- Crear     │  │- Venta      │ └────────┘  │
│   └────────────┘  │- Detalles  │  │- Historial  │             │
│                   └────────────┘  └─────────────┘             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                ▲
                                │
                    RecepcionService.js
                    (API Client)
                    
             Headers:
             ├─ x-user-role: 3
             ├─ x-user-id: [id]
             └─ Content-Type: application/json
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        BACKEND (Node.js)                          │
│                   (server.js + src/)                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Middleware: requiereRecepcionista (verifica rol === 3)         │
│                                                                  │
│  Routes (/api/recepcion):                                       │
│  ├─ GET /pacientes          → listarPacientes()               │
│  ├─ GET /pacientes/:id      → obtenerPaciente()              │
│  ├─ POST /pacientes         → crearPaciente()                │
│  ├─ PUT /pacientes/:id      → actualizarPaciente()           │
│  │                                                             │
│  ├─ GET /doctores           → listarDoctores()               │
│  ├─ GET /doctores/:id       → obtenerDoctor()               │
│  ├─ POST /doctores          → crearDoctor()                 │
│  ├─ PUT /doctores/:id       → actualizarDoctor()            │
│  │                                                             │
│  ├─ GET /servicios          → listarServicios()             │
│  ├─ POST /servicios/venta   → venderServicio()              │
│  │                                                             │
│  ├─ GET /medicamentos       → listarMedicamentos()          │
│  ├─ POST /medicamentos/venta→ venderMedicamento()           │
│  ├─ PUT /medicamentos/:id/stock → actualizarStock()         │
│  │                                                             │
│  └─ POST /citas/:id/cancelar→ cancelarCita()               │
│                                                                  │
│  Services (recepcion.service.js):                              │
│  ├─ Lógica CRUD                                               │
│  ├─ Validaciones de negocio                                   │
│  ├─ Transacciones BD                                          │
│  └─ Logging en Bitácora                                       │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                                ▲
                                │
                    Queries SQL + Stored Procedures
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                  BASE DE DATOS (SQL Server)                      │
│                   GestorHospitalDB                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TABLAS UTILIZADAS:                                            │
│  ├─ Pacientes        → Datos pacientes                         │
│  ├─ Usuarios         → Cuentas de usuario                      │
│  ├─ Empleados        → Empleados hospital                      │
│  ├─ Doctores         → Información doctores                    │
│  ├─ Especialidades   → 5 especialidades                        │
│  ├─ Citas            → Citas médicas                           │
│  ├─ Estatus_Cita     → Estados de citas                        │
│  ├─ Servicios        → 10 servicios disponibles               │
│  ├─ Detalle_Servicio → Items vendidos de servicios            │
│  ├─ Medicamento      → 10 medicamentos con stock              │
│  ├─ Detalles_med     → Items vendidos de medicinas            │
│  ├─ Venta            → Registro de ventas                      │
│  ├─ Pago             → Pagos de citas                          │
│  ├─ Bitacora         → Auditoría de operaciones               │
│  ├─ Farmaceutico     → Farmacéuticos                           │
│  └─ ... (11 tablas más)                                         │
│                                                                  │
│  STORED PROCEDURES:                                            │
│  ├─ CrearCita        → Crear cita con trigger                 │
│  ├─ SP_CancelarCita  → Cancelar cita + reembolso              │
│  ├─ SP_RegistrarPago → Registrar pago                         │
│  └─ SP_CancelarCitasExpiradas → Limpieza automática          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Operaciones Principales

### 1. CREAR PACIENTE
```
Usuario escribe datos
    ▼
GestionPacientes.vue valida
    ▼
RecepcionService.crearPaciente()
    ▼
API POST /api/recepcion/pacientes
    ▼
Backend: requiereRecepcionista (rol 3) ✅
    ▼
recepcion.controller.crearPaciente()
    ▼
recepcion.service.crearPaciente()
    ▼
INSERT INTO Pacientes (DNI único)
    ▼
Registrar en Bitácora
    ▼
Retornar ID nuevo paciente
    ▼
Frontend: Mostrar "Paciente creado (ID: 5)"
    ▼
Cargar lista pacientes
    ▼
✅ Nuevo paciente visible
```

### 2. VENDER SERVICIO
```
Usuario selecciona servicios
    ▼
Agregar al carrito (estado local)
    ▼
Editar cantidades
    ▼
Escribir nombre cliente
    ▼
Click "Registrar Venta"
    ▼
RecepcionService.venderServicio()
    ▼
API POST /api/recepcion/servicios/venta
    ▼
Backend: Validar (cliente, items, stock)
    ▼
INSERT INTO Venta (ID auto)
    ▼
INSERT INTO Detalle_Servicio (múltiples)
    ▼
Registrar en Bitácora
    ▼
Retornar venta ID + total
    ▼
Frontend: "Venta registrada (ID: 14, Total: $45)"
    ▼
Limpiar carrito
    ▼
✅ Venta completada
```

### 3. ACTUALIZAR STOCK MEDICAMENTO
```
Usuario ve inventario
    ▼
Cambia valor de stock
    ▼
Click "Guardar cambios"
    ▼
RecepcionService.actualizarStock()
    ▼
API PUT /api/recepcion/medicamentos/1/stock
    ▼
Backend: Validar stock >= 0
    ▼
UPDATE Medicamento SET Stock = [nuevo]
    ▼
Registrar en Bitácora
    ▼
Retornar nuevo valor
    ▼
Frontend: "Stock actualizado (Losartán: 75)"
    ▼
Actualizar color indicador
    ▼
✅ Stock modificado
```

### 4. CANCELAR CITA
```
Usuario selecciona cita a cancelar
    ▼
Ingresa motivo
    ▼
Click "Cancelar cita"
    ▼
RecepcionService.cancelarCita()
    ▼
API POST /api/recepcion/citas/38/cancelar
    ▼
Backend: Validar cita existe
    ▼
EXEC SP_CancelarCita
    @Id_Cita=38,
    @Motivo='[motivo]',
    @Cancelado_Por='Recepcionista',
    @Usuario=[id usuario]
    ▼
UPDATE Citas SET Estado = 'Cancelada'
    ▼
Calcular reembolso (si aplica)
    ▼
Registrar en Bitácora
    ▼
Frontend: "Cita 38 cancelada (Reembolso: $XX)"
    ▼
✅ Cita cancela
