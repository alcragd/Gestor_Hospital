# FASE 3 - ANÁLISIS DE BASE DE DATOS EXISTENTE

## 📊 TABLAS IDENTIFICADAS (26 total)

### 👥 Gestión de Usuarios
- **Usuarios** - Tabla principal de autenticación
- **Tipo_Usuario** - Catálogo de roles (1=Doctor, 2=Farmacéutico, 3=Recepcionista, 4=Paciente)
- **Empleados** - Datos de empleados (doctores, recepcionistas, farmacéuticos)
- **Pacientes** - Datos de pacientes
- **Doctores** - Información específica de doctores (RFC, Cédula)
- **Farmaceutico** - Información de farmacéuticos

### 🏥 Gestión de Citas y Consultorios
- **Citas** - Registro de citas médicas
- **Estatus_Cita** - Catálogo de estados (1=Agendada, 2=Pagada, 3=Cancelada Falta Pago, 4=Cancelada Paciente, 5=Cancelada Doctor, 6=Atendida, 7=No acudió)
- **Consultorio** - Catálogo de consultorios (Id, Numero, Piso)
- **Especialidades** - Catálogo de especialidades médicas
- **Horario** - Horarios de trabajo
- **Empleado_Horario** - Relación empleado-horario

### 💊 Farmacia
- **Medicamento** - Inventario de medicamentos (Nombre, Stock, Precio, Presentación)
- **Venta** - Registro de ventas de farmacia (Id_Farmaceutico, Fecha_Hora, Nombre_Cliente, Estatus)
- **Detalles_med** - Detalle de medicamentos vendidos por venta
- **Recetas** - Recetas médicas emitidas
- **Detalles_receta** - Detalle de medicamentos en receta

### 🏥 Servicios Médicos
- **Servicios** - Catálogo de servicios (10 servicios: Toma Presión, Inyección, Glucosa, Sutura, Curación, Vendaje, Retiro Puntos, Nebulización, Chequeo Ocular, Lavado Heridas)
- **Detalle_Servicio** - Relación servicio-venta

### 💰 Pagos
- **Pago** - Registro de pagos de citas

### 📝 Auditoría y Historial
- **Bitacora** - Registro de acciones del sistema
- **Historial_Paciente** - Historial médico
- **Alergias** - Catálogo de alergias
- **Paciente_Alergias** - Relación paciente-alergia
- **Padecimientos_previos** - Catálogo de padecimientos
- **Paciente_Padecimientos** - Relación paciente-padecimiento

## 🔧 PROCEDIMIENTOS ALMACENADOS (4)
1. **CrearCita** - Crea una cita con validaciones de horario (FASE 1/2 - FUNCIONANDO)
2. **SP_RegistrarPago** - Registra pago de cita
3. **SP_CancelarCita** - Cancela cita con cálculo de reembolso (FASE 1/2 - FUNCIONANDO)
4. **SP_CancelarCitasExpiradas** - Proceso automático de cancelación

## 👁️ VISTAS (4)
1. **VW_Citas_Completas_Paciente** - Vista completa de citas
2. **VW_Historial_Medico_Detalle** - Historial médico detallado
3. **VW_Inventario_Farmacia** - Estado actual de inventario
4. **VW_Personal_Medico_Activo** - Personal médico activo

## 🔒 TRIGGERS (2)
1. **TRG_Validar_Cita_Insert** - Valida reglas de negocio al crear cita (FASE 1/2 - FUNCIONANDO)
2. **TRG_Validar_Transicion_Estatus** - Valida cambios de estatus de cita

## 📋 FUNCIONES (5)
1. **FN_Calcular_Edad** - Calcula edad a partir de fecha
2. **FN_ExisteCitaPendiente** - Verifica si hay cita pendiente
3. **FN_Obtener_Costo_Cancelacion** - Calcula costo de cancelación
4. **FN_Validar_Anticipacion_Cita** - Valida anticipación mínima/máxima
5. **FN_Validar_Login** - Valida credenciales de usuario

---

## ✅ CONCLUSIONES PARA FASE 3

### ✅ Lo que YA EXISTE y NO necesita cambios en BD:

1. **Gestión de Usuarios**: Tablas completas (Usuarios, Empleados, Pacientes, Doctores)
2. **Servicios**: Tabla Servicios con 10 servicios predefinidos
3. **Farmacia**: Estructura completa (Medicamento, Venta, Detalles_med)
4. **Consultorios**: Tabla Consultorio con 5 consultorios
5. **Especialidades**: Tabla existente con especialidades médicas
6. **Cancelación**: SP_CancelarCita ya maneja reembolsos y bitácora

### 🎯 IMPLEMENTACIÓN FASE 3 - SIN MODIFICAR BD

#### 1️⃣ CRUD Usuarios (Recepcionista puede gestionar)
- **Backend**: Nuevas rutas en `/api/admin/` o `/api/recepcion/`
- **Frontend**: Componentes Vue para listar/crear/editar usuarios
- **Tablas usadas**: Usuarios, Empleados, Pacientes, Doctores (INSERT/UPDATE/SELECT)

#### 2️⃣ Gestión de Especialidades
- **Backend**: Endpoints GET/POST/PUT para Especialidades
- **Frontend**: CRUD de especialidades
- **Tabla usada**: Especialidades (ya existe)

#### 3️⃣ Gestión de Consultorios
- **Backend**: CRUD sobre tabla Consultorio
- **Frontend**: Administración de consultorios
- **Tabla usada**: Consultorio (ya tiene Numero y Piso)

#### 4️⃣ Gestión de Citas (vista ampliada)
- **Backend**: Endpoint GET /api/recepcion/citas (todas las citas)
- **Backend**: Endpoint POST /api/recepcion/cancelar-cita (usa SP_CancelarCita existente)
- **Frontend**: Vista de todas las citas con filtros
- **Tablas/SPs usados**: Citas, SP_CancelarCita

#### 5️⃣ Venta de Servicios
- **Backend**: POST /api/recepcion/vender-servicio
- **Frontend**: Punto de venta de servicios
- **Tablas usadas**: Venta, Detalle_Servicio, Servicios (INSERT en Venta y Detalle_Servicio)

#### 6️⃣ Farmacia
- **Backend**: GET /api/farmacia/inventario (usa VW_Inventario_Farmacia o Medicamento)
- **Backend**: POST /api/farmacia/vender (INSERT en Venta y Detalles_med)
- **Frontend**: Punto de venta de medicamentos
- **Tablas usadas**: Medicamento, Venta, Detalles_med

### 🚫 RESTRICCIONES DE ACCESO (Backend Middleware)

```javascript
// Middleware de autorización
const requiereRol = (rolesPermitidos) => (req, res, next) => {
  const userRole = parseInt(req.headers['x-user-role']);
  if (!rolesPermitidos.includes(userRole)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

// Recepcionista: rol 3
// NO puede acceder a:
// - /api/doctores/receta
// - /api/doctores/paciente/:id/historial (datos médicos sensibles)
```

---

## 📝 PLAN DE IMPLEMENTACIÓN

### BLOQUE 1: Backend - Rutas de Administración
1. Crear `/src/routes/recepcion.routes.js`
2. Crear `/src/controllers/recepcion.controller.js`
3. Crear `/src/services/recepcion.service.js`

### BLOQUE 2: Backend - CRUD Usuarios
1. Endpoints para listar/crear/editar Pacientes
2. Endpoints para listar/crear/editar Doctores
3. Endpoints para listar/crear/editar Recepcionistas

### BLOQUE 3: Backend - Servicios y Farmacia
1. Endpoint venta de servicios
2. Endpoint venta de medicamentos
3. Endpoint consulta de inventario

### BLOQUE 4: Frontend Vue
1. Vista de administración de usuarios
2. Vista de servicios
3. Vista de farmacia
4. Vista de citas (solo lectura + cancelar)

### BLOQUE 5: Pruebas
1. Pruebas de acceso cruzado de roles
2. Pruebas de ventas sin paciente
3. Pruebas de cancelaciones

---

## ⚠️ NOTAS IMPORTANTES

- **NO se requiere crear ninguna tabla nueva**
- **NO se requiere modificar SPs existentes**
- **La tabla Venta ya soporta ventas sin paciente** (usa Nombre_Cliente como string)
- **Los servicios ya están catalogados** en la tabla Servicios
- **La cancelación ya funciona** con SP_CancelarCita
- **Todo se puede resolver con INSERTs/UPDATEs/SELECTs normales**

✅ **La BD está lista para soportar FASE 3 sin modificaciones**
