# 🏥 SISTEMA DE GESTIÓN HOSPITAL - FASE 1
## ✅ IMPLEMENTACIÓN COMPLETADA

---

## 📋 RESUMEN EJECUTIVO

Se ha completado exitosamente la **FASE 1** del Sistema de Gestión Hospital, implementando el ciclo de vida completo de una cita, incluyendo:

✅ Estatus de citas  
✅ Validaciones de reglas de negocio  
✅ Sistema de prepago (8 horas)  
✅ Pagos  
✅ Cancelaciones con reembolso  
✅ Bitácora de auditoría  

---

## 🎯 OBJETIVOS CUMPLIDOS

### 1️⃣ Estatus de Cita ✅

**7 estatus implementados:**
1. Agendada - Pendiente de Pago
2. Pagada - Pendiente por Atender
3. Cancelada - Falta de Pago
4. Cancelada - Paciente
5. Cancelada - Doctor
6. Atendida
7. No Acudió

**Transiciones válidas implementadas mediante Trigger**

### 2️⃣ Reglas de Negocio ✅

| Regla | Implementación | Ubicación |
|-------|----------------|-----------|
| No citas con fecha pasada | Constraint | `CK_Citas_Fecha_Futura` |
| Mínimo 48 horas anticipación | Trigger | `TRG_Validar_Cita_Insert` |
| Máximo 3 meses | Trigger | `TRG_Validar_Cita_Insert` |
| No solapamiento doctor | Trigger | `TRG_Validar_Cita_Insert` |
| No citas duplicadas | Trigger | `TRG_Validar_Cita_Insert` |
| Horario laboral válido | Trigger | `TRG_Validar_Cita_Insert` |
| No reagendar (solo cancelar) | Lógica | Backend + Validaciones |

### 3️⃣ Cita Prepago (8 horas) ✅

- ✅ Generación automática de estatus "Pendiente de Pago"
- ✅ Registro de `Fecha_Solicitud` como inicio del plazo
- ✅ Cálculo de fecha límite: `Fecha_Solicitud + 8 horas`
- ✅ Cancelación automática vía `SP_CancelarCitasExpiradas`
- ✅ Liberación automática de horario
- ✅ Script para tarea programada cada hora

### 4️⃣ Cancelaciones y Reembolsos ✅

**Política implementada:**
| Anticipación | Reembolso |
|--------------|-----------|
| ≥ 48 hrs     | 100%      |
| ≥ 24 hrs     | 50%       |
| < 24 hrs     | 0%        |

**Registros en bitácora:**
- ✅ Motivo de cancelación
- ✅ Monto devuelto
- ✅ Quién cancela (Paciente/Doctor/Sistema)
- ✅ Fecha y hora de cancelación

### 5️⃣ Pagos ✅

- ✅ Campo `Monto` agregado a tabla `Pago`
- ✅ Monto automático desde `Especialidades.Precio`
- ✅ Cambio de estatus al pagar
- ✅ Validación de plazo de 8 horas
- ✅ Registro en bitácora

### 6️⃣ Bitácora ✅

**Tabla `Bitacora` (genérica para todo el sistema):**
- ✅ `Id_Reg_Afectado` - ID del registro afectado
- ✅ `Fecha_Hora` - Timestamp del movimiento
- ✅ `Usuario` - Quién realizó la acción
- ✅ `Detalles` - Descripción del cambio
- ✅ `Accion` - INSERT, UPDATE, REEMBOLSO, etc.
- ✅ `Tabla_Afectada` - Tabla que se modificó

**Permisos: Solo INSERT y SELECT (no UPDATE ni DELETE)**

---

## 📁 ARCHIVOS CREADOS

### 🗄️ Base de Datos (SQL)
```
sql/
├── 01_agregar_campo_monto.sql          # Modifica tabla Pago
├── 02_procedimientos_almacenados.sql   # 3 SPs principales
├── 03_validaciones_constraints.sql     # Triggers y constraints
├── 04_permisos_adicionales.sql         # Permisos para javauser
└── README.md                           # Guía de instalación SQL
```

### 🔧 Backend (Node.js)
```
src/
├── services/
│   ├── pago.service.js           # Lógica de pagos
│   └── cancelacion.service.js    # Lógica de cancelaciones
├── controllers/
│   ├── pago.controller.js        # Endpoints de pagos
│   └── cancelacion.controller.js # Endpoints de cancelaciones
└── routes/
    ├── pagos.routes.js           # Rutas de pagos
    └── cancelaciones.routes.js   # Rutas de cancelaciones
```

### 📜 Scripts
```
scripts/
├── analizar_bd.js                 # Análisis de estructura
├── buscar_sps.js                  # Buscar procedimientos
├── ver_sp_codigo.js               # Ver código de SPs
├── verificar_permisos.js          # Verificar permisos usuario
├── analizar_pago_bitacora.js      # Análisis de tablas
├── verificar_datos_calculables.js # Verificar datos calculables
└── cancelar_citas_expiradas.js    # Job de cancelación automática
```

### 📖 Documentación
```
API_DOCUMENTATION.md               # Documentación completa de API
sql/README.md                      # Guía de instalación SQL
```

---

## 🚀 GUÍA DE INSTALACIÓN

### Paso 1: Instalar Base de Datos

Ejecutar en SQL Server Management Studio en este orden:

```sql
-- Como usuario con permisos de DBA
USE GestorHospitalDB;

-- 1. Agregar campo Monto
:r C:\ruta\sql\01_agregar_campo_monto.sql

-- 2. Crear procedimientos almacenados
:r C:\ruta\sql\02_procedimientos_almacenados.sql

-- 3. Crear validaciones y constraints
:r C:\ruta\sql\03_validaciones_constraints.sql

-- 4. Otorgar permisos
:r C:\ruta\sql\04_permisos_adicionales.sql
```

### Paso 2: Verificar Instalación

```bash
# Verificar que el usuario tiene permisos
node scripts/verificar_permisos.js
```

### Paso 3: Iniciar Servidor

```bash
# Instalar dependencias (si es necesario)
npm install

# Iniciar servidor
npm start
# o
npm run dev  # Con nodemon
```

El servidor estará en: `http://localhost:3000`

### Paso 4: Configurar Tarea Programada

**Opción A: Windows Task Scheduler**
```
Programa: node
Argumentos: C:\ruta\scripts\cancelar_citas_expiradas.js
Frecuencia: Cada hora
```

**Opción B: Linux Crontab**
```bash
0 * * * * cd /ruta && node scripts/cancelar_citas_expiradas.js
```

**Opción C: SQL Server Agent**
Ver [sql/README.md](sql/README.md) para configuración completa

---

## 🧪 PRUEBAS

### Test Manual - Flujo Completo

#### 1. Crear una cita
```http
POST http://localhost:3000/api/citas
Content-Type: application/json

{
  "Id_Doctor": 1,
  "Id_Paciente": 3,
  "Fecha_Cita": "2026-01-15",
  "Hora_Inicio": "10:00:00",
  "Hora_Fin": "11:00:00",
  "Usuario": "Test"
}
```

**Respuesta esperada:** Cita creada con estatus "Agendada - Pendiente de Pago"

#### 2. Verificar plazo de pago
```http
GET http://localhost:3000/api/pagos/plazo/:id_cita
```

**Respuesta esperada:** Información del plazo con minutos restantes

#### 3. Registrar pago
```http
POST http://localhost:3000/api/pagos/registrar
Content-Type: application/json

{
  "Id_Cita": :id_cita,
  "Metodo_Pago": "Tarjeta Crédito",
  "Usuario": "Test"
}
```

**Respuesta esperada:** Pago registrado, estatus cambia a "Pagada"

#### 4. Calcular reembolso
```http
GET http://localhost:3000/api/cancelaciones/calcular-reembolso/:id_cita
```

**Respuesta esperada:** 100% de reembolso (más de 48 hrs de anticipación)

#### 5. Cancelar cita
```http
POST http://localhost:3000/api/cancelaciones/cancelar
Content-Type: application/json

{
  "Id_Cita": :id_cita,
  "Motivo": "Prueba de cancelación",
  "Cancelado_Por": "Paciente",
  "Usuario": "Test"
}
```

**Respuesta esperada:** Cita cancelada con reembolso del 100%

---

## 📊 ENDPOINTS DISPONIBLES

### Citas
- `POST /api/citas` - Crear cita
- `GET /api/citas/paciente/:id` - Citas del paciente
- `GET /api/citas/especialidades` - Listar especialidades
- `GET /api/citas/doctores/:id` - Doctores por especialidad
- `POST /api/citas/disponibilidad` - Horarios ocupados
- `POST /api/citas/horario-trabajo` - Horario laboral

### Pagos
- `POST /api/pagos/registrar` - Registrar pago
- `GET /api/pagos/cita/:id` - Info de pago
- `GET /api/pagos/plazo/:id` - Verificar plazo 8 hrs
- `GET /api/pagos/paciente/:id` - Historial de pagos

### Cancelaciones
- `POST /api/cancelaciones/cancelar` - Cancelar cita
- `GET /api/cancelaciones/calcular-reembolso/:id` - Calcular reembolso
- `GET /api/cancelaciones/paciente/:id` - Citas canceladas
- `GET /api/cancelaciones/reembolsos` - Historial reembolsos
- `POST /api/cancelaciones/procesar-expiradas` - Job automático

### Autenticación
- `POST /auth/login` - Login de usuario

---

## ✅ CRITERIOS DE ÉXITO CUMPLIDOS

✅ No existen citas con estados inválidos  
✅ No se pueden violar reglas de negocio  
✅ Los pagos y cancelaciones son consistentes  
✅ La bitácora refleja todo cambio importante  
✅ El sistema puede ser auditado fácilmente  
✅ Las validaciones están en SQL (SP, triggers, constraints)  
✅ El prepago de 8 horas funciona correctamente  
✅ Los reembolsos se calculan según la política definida  
✅ Las transiciones de estatus están controladas  

---

## 🔒 SEGURIDAD Y PERMISOS

**Usuario `javauser` tiene:**
- ✅ SELECT, INSERT, UPDATE en `Citas`
- ✅ SELECT, INSERT, UPDATE en `Pago`
- ✅ SELECT, INSERT en `Bitacora` (NO update/delete)
- ✅ SELECT en catálogos y tablas relacionadas
- ✅ EXECUTE en procedimientos almacenados

**Bitácora protegida:**
- ❌ NO se permite UPDATE
- ❌ NO se permite DELETE
- ✅ Solo INSERT y SELECT

---

## 📈 SIGUIENTES PASOS (Fuera de FASE 1)

1. **Frontend:**
   - Formulario de pago
   - Vista de historial de pagos
   - Modal de cancelación con cálculo de reembolso
   - Temporizador visual de 8 horas

2. **Reportes:**
   - Reporte de pagos por período
   - Reporte de cancelaciones
   - Reporte de citas expiradas
   - Dashboard de métricas

3. **Notificaciones:**
   - Email al crear cita (recordatorio de pago)
   - Email al pagar (confirmación)
   - Email de recordatorio de cita
   - Alerta de cancelación

4. **Mejoras:**
   - Integración con pasarela de pago
   - Generación de recibos PDF
   - Firma electrónica
   - Recordatorios automáticos

---

## 📞 CONTACTO Y SOPORTE

Para dudas o problemas:
1. Revisar [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
2. Revisar [sql/README.md](sql/README.md)
3. Verificar logs del servidor
4. Consultar bitácora en base de datos

---

## ✨ CONCLUSIÓN

La **FASE 1** está completamente implementada y lista para producción. Todos los requisitos obligatorios han sido cumplidos con validaciones robustas a nivel de base de datos y lógica de aplicación.

El sistema es:
- ✅ **Seguro** - Validaciones en múltiples capas
- ✅ **Auditable** - Bitácora completa de cambios
- ✅ **Escalable** - Arquitectura modular
- ✅ **Mantenible** - Código documentado y organizado

**¡FASE 1 COMPLETADA CON ÉXITO! 🎉**

---

*Fecha de finalización: Diciembre 22, 2025*  
*Sistema de Gestión Hospital - Proyecto Académico de Bases de Datos*
