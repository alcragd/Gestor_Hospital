# 📘 API Documentation - Sistema de Gestión Hospital FASE 1

## 🏥 Base URL
```
http://localhost:3000
```

---

## 📅 CITAS

### Crear Cita
```http
POST /api/citas
```

**Request Body:**
```json
{
  "Id_Doctor": 1,
  "Id_Paciente": 3,
  "Fecha_Cita": "2026-01-15",
  "Hora_Inicio": "10:00:00",
  "Hora_Fin": "11:00:00",
  "Usuario": "Web_Recepcion"
}
```

**Response 201:**
```json
{
  "message": "Cita creada exitosamente",
  "cita": { ... }
}
```

**Validaciones automáticas:**
- ✅ Mínimo 48 horas de anticipación
- ✅ Máximo 3 meses
- ✅ Sin solapamiento de horarios
- ✅ No citas duplicadas paciente-doctor
- ✅ Dentro del horario laboral del doctor

---

### Obtener Citas de Paciente
```http
GET /api/citas/paciente/:id
```

**Response 200:**
```json
[
  {
    "ID_Cita": 23,
    "Fecha_cita": "2026-03-12",
    "Hora_Inicio": "14:00:00",
    "Hora_Fin": "15:00:00",
    "Estatus_Cita": "Agendada - Pendiente de Pago",
    "Especialidad": "Cardiología",
    "Doctor_Nombre": "Dr. Juan Pérez"
  }
]
```

---

## 💰 PAGOS

### Registrar Pago
```http
POST /api/pagos/registrar
```

**Request Body:**
```json
{
  "Id_Cita": 23,
  "Metodo_Pago": "Tarjeta Crédito",
  "Usuario": "Web_Paciente"
}
```

**Response 201:**
```json
{
  "success": true,
  "mensaje": "Pago registrado exitosamente",
  "monto": 950.00,
  "idPago": 12
}
```

**Errores posibles:**
- `400` - La cita no está pendiente de pago
- `400` - El plazo de 8 horas ha expirado

---

### Verificar Plazo de Pago
```http
GET /api/pagos/plazo/:id
```

**Response 200:**
```json
{
  "idCita": 23,
  "fechaSolicitud": "2025-12-22",
  "fechaLimitePago": "2025-12-22T08:00:00.000Z",
  "minutosTranscurridos": 120,
  "minutosRestantes": 360,
  "estadoPlazo": "VIGENTE",
  "montoAPagar": 950.00,
  "estatusActual": "Agendada - Pendiente de Pago",
  "puedePagar": true
}
```

---

### Obtener Pago de Cita
```http
GET /api/pagos/cita/:id
```

**Response 200:**
```json
{
  "Id_Pago": 12,
  "Id_Cita": 23,
  "Monto": 950.00,
  "Metodo_Pago": "Tarjeta Crédito",
  "Fecha": "2025-12-22",
  "Hora": "10:30:00",
  "Fecha_cita": "2026-03-12",
  "Estatus_Cita": "Pagada - Pendiente por Atender"
}
```

---

### Historial de Pagos del Paciente
```http
GET /api/pagos/paciente/:id
```

**Response 200:**
```json
[
  {
    "Id_Pago": 12,
    "Id_Cita": 23,
    "Monto": 950.00,
    "Metodo_Pago": "Tarjeta Crédito",
    "Fecha_Pago": "2025-12-22",
    "Hora_Pago": "10:30:00",
    "Fecha_cita": "2026-03-12",
    "Hora_Inicio": "14:00:00",
    "Especialidad": "Cardiología",
    "NombreDoctor": "Dr. Juan Pérez"
  }
]
```

---

## ❌ CANCELACIONES

### Cancelar Cita
```http
POST /api/cancelaciones/cancelar
```

**Request Body:**
```json
{
  "Id_Cita": 23,
  "Motivo": "Cambio de planes del paciente",
  "Cancelado_Por": "Paciente",
  "Usuario": "Web_Paciente"
}
```

**Valores válidos para `Cancelado_Por`:**
- `"Paciente"`
- `"Doctor"`
- `"Sistema"`

**Response 200:**
```json
{
  "success": true,
  "mensaje": "Cita cancelada exitosamente",
  "montoReembolso": 950.00,
  "porcentajeReembolso": 100
}
```

**Política de reembolsos:**
| Anticipación | Reembolso |
|--------------|-----------|
| ≥ 48 horas   | 100%      |
| ≥ 24 horas   | 50%       |
| < 24 horas   | 0%        |

---

### Calcular Reembolso (sin cancelar)
```http
GET /api/cancelaciones/calcular-reembolso/:id
```

**Response 200:**
```json
{
  "Id_Cita": 23,
  "Fecha_cita": "2026-03-12",
  "Hora_Inicio": "14:00:00",
  "Estatus": "Pagada - Pendiente por Atender",
  "Monto_Pagado": 950.00,
  "Horas_Anticipacion": 2040,
  "Porcentaje_Reembolso": 100,
  "Monto_Reembolso": 950.00,
  "Puede_Cancelar": 1
}
```

---

### Obtener Citas Canceladas del Paciente
```http
GET /api/cancelaciones/paciente/:id
```

**Response 200:**
```json
[
  {
    "Id_Cita": 15,
    "Fecha_cita": "2025-12-20",
    "Hora_Inicio": "10:00:00",
    "Estatus": "Cancelada - Paciente",
    "Especialidad": "Cardiología",
    "NombreDoctor": "Dr. Juan Pérez",
    "Motivo": "Cita cancelada por: Paciente - Motivo: Cambio de planes",
    "Fecha_Cancelacion": "2025-12-18T14:30:00.000Z"
  }
]
```

---

### Historial de Reembolsos
```http
GET /api/cancelaciones/reembolsos
GET /api/cancelaciones/reembolsos/:idPaciente
```

**Response 200:**
```json
[
  {
    "Id_Pago": 10,
    "Id_Cita": 15,
    "ID_Paciente": 3,
    "NombrePaciente": "María López",
    "Fecha_Reembolso": "2025-12-18T14:30:00.000Z",
    "Detalle_Reembolso": "Reembolso: $950.00 (100%) - Motivo: Cambio de planes",
    "Usuario": "Web_Paciente"
  }
]
```

---

### Procesar Citas Expiradas (Job automático)
```http
POST /api/cancelaciones/procesar-expiradas
```

**Response 200:**
```json
{
  "success": true,
  "mensaje": "Proceso completado",
  "citasCanceladas": 3
}
```

**Nota:** Este endpoint debería ser llamado por una tarea programada cada hora.

---

## 📊 ESPECIALIDADES Y DISPONIBILIDAD

### Obtener Especialidades
```http
GET /api/citas/especialidades
```

### Obtener Doctores por Especialidad
```http
GET /api/citas/doctores/:id_especialidad
```

### Obtener Slots Ocupados
```http
POST /api/citas/disponibilidad
```

**Request Body:**
```json
{
  "Id_Doctor": 1,
  "Fecha_cita": "2026-01-15"
}
```

### Obtener Horario de Trabajo
```http
POST /api/citas/horario-trabajo
```

**Request Body:**
```json
{
  "Id_Doctor": 1,
  "Fecha": "2026-01-15"
}
```

---

## 🔐 AUTENTICACIÓN

### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "usuario": "usuario123",
  "contrasena": "password123"
}
```

---

## ⚙️ CÓDIGOS DE ESTADO

| Código | Significado |
|--------|-------------|
| 200    | OK - Operación exitosa |
| 201    | Created - Recurso creado |
| 400    | Bad Request - Datos inválidos o regla de negocio violada |
| 404    | Not Found - Recurso no encontrado |
| 500    | Internal Server Error - Error del servidor |

---

## 🧪 TESTING CON POSTMAN

### Flujo completo de una cita:

1. **Crear cita** → `POST /api/citas`
2. **Verificar plazo** → `GET /api/pagos/plazo/:id`
3. **Registrar pago** → `POST /api/pagos/registrar`
4. **Ver pago** → `GET /api/pagos/cita/:id`
5. **Calcular reembolso** → `GET /api/cancelaciones/calcular-reembolso/:id`
6. **Cancelar (opcional)** → `POST /api/cancelaciones/cancelar`

---

## 🚀 TAREA PROGRAMADA

Para configurar la tarea que cancela citas expiradas:

**Windows (Task Scheduler):**
```cmd
Programa: node
Argumentos: C:\ruta\proyecto\scripts\cancelar_citas_expiradas.js
Frecuencia: Cada hora
```

**Linux (crontab):**
```bash
0 * * * * cd /ruta/proyecto && node scripts/cancelar_citas_expiradas.js >> /var/log/citas_expiradas.log 2>&1
```

**Alternativa con endpoint:**
```bash
0 * * * * curl -X POST http://localhost:3000/api/cancelaciones/procesar-expiradas
```
