# 🏥 Sistema de Gestión Hospital - FASE 1
## Instalación de Base de Datos

### 📋 Orden de Ejecución

Ejecuta los scripts SQL en este orden desde SQL Server Management Studio (SSMS):

```
1. ✅ 01_agregar_campo_monto.sql
2. ✅ 02_procedimientos_almacenados.sql  
3. ✅ 03_validaciones_constraints.sql
4. ✅ 04_permisos_adicionales.sql
```

### ⚠️ Requisitos Previos

- Usuario `javauser` debe existir
- Base de datos `GestorHospitalDB` debe existir
- Ejecutar scripts como usuario con permisos de DBA

### 🔧 Cambios Implementados

#### 1. Tabla Pago
- ✅ Campo `Monto DECIMAL(10,2)` agregado
- ✅ Valores actualizados automáticamente desde `Especialidades.Precio`

#### 2. Procedimientos Almacenados

**SP_RegistrarPago**
- Valida estatus de la cita
- Verifica límite de 8 horas
- Registra pago con monto correcto
- Actualiza estatus a "Pagada"
- Registra en bitácora

**SP_CancelarCita**
- Calcula reembolso según anticipación (100%, 50%, 0%)
- Cambia estatus según quién cancela
- Registra todo en bitácora

**SP_CancelarCitasExpiradas**
- Cancela automáticamente citas sin pago después de 8 horas
- Para usar con SQL Server Agent Job

#### 3. Validaciones y Constraints

**Constraints:**
- ✅ No fechas pasadas

**Triggers:**
- ✅ Mínimo 48 horas de anticipación
- ✅ Máximo 3 meses de anticipación  
- ✅ No solapamiento de horarios
- ✅ No dos citas pendientes mismo paciente-doctor
- ✅ Horario dentro del horario laboral del doctor
- ✅ Transiciones de estatus válidas

#### 4. Permisos
- ✅ `SELECT, INSERT, UPDATE` en `Pago`
- ✅ `SELECT, INSERT` en `Bitacora`
- ✅ `INSERT, UPDATE` en `Citas`
- ✅ `EXECUTE` en los 3 SPs nuevos

### 📊 Reglas de Negocio Implementadas

| Regla | Ubicación | Estado |
|-------|-----------|--------|
| No fechas pasadas | Constraint | ✅ |
| Mínimo 48 hrs anticipación | Trigger | ✅ |
| Máximo 3 meses | Trigger | ✅ |
| No solapamiento | Trigger | ✅ |
| No citas duplicadas paciente-doctor | Trigger | ✅ |
| Horario laboral válido | Trigger | ✅ |
| Prepago 8 horas | SP | ✅ |
| Reembolso según anticipación | SP | ✅ |
| Transiciones de estatus | Trigger | ✅ |
| Bitácora de cambios | SP | ✅ |

### 🔄 Transiciones de Estatus Permitidas

```
1 (Agendada) ──────┬────→ 2 (Pagada)
                   └────→ 3 (Cancelada - Falta de Pago)

2 (Pagada) ────────┬────→ 4 (Cancelada - Paciente)
                   ├────→ 5 (Cancelada - Doctor)  
                   ├────→ 6 (Atendida)
                   └────→ 7 (No acudió)

Estados 3,4,5,6,7 son FINALES (no pueden cambiar)
```

### 💸 Política de Reembolsos

| Anticipación | Reembolso |
|--------------|-----------|
| ≥ 48 horas   | 100%      |
| ≥ 24 horas   | 50%       |
| < 24 horas   | 0%        |

### ⏰ Sistema de Prepago (8 horas)

1. Cita creada → Estatus: "Agendada - Pendiente de Pago"
2. Se registra `Fecha_Solicitud`
3. Usuario tiene 8 horas para pagar
4. Si paga → Estatus: "Pagada - Pendiente por Atender"
5. Si no paga → Job automático cancela → Estatus: "Cancelada - Falta de Pago"

### 🤖 Tarea Programada (SQL Server Agent)

Para configurar la cancelación automática cada hora:

```sql
-- Crear Job en SQL Server Agent
USE msdb;
GO

EXEC sp_add_job
    @job_name = N'CancelarCitasExpiradas',
    @enabled = 1,
    @description = N'Cancela automáticamente citas sin pago después de 8 horas';

EXEC sp_add_jobstep
    @job_name = N'CancelarCitasExpiradas',
    @step_name = N'Ejecutar SP',
    @subsystem = N'TSQL',
    @database_name = N'GestorHospitalDB',
    @command = N'EXEC SP_CancelarCitasExpiradas';

EXEC sp_add_schedule
    @schedule_name = N'Cada Hora',
    @freq_type = 4,  -- Diario
    @freq_interval = 1,
    @freq_subday_type = 8,  -- Horas
    @freq_subday_interval = 1,  -- Cada 1 hora
    @active_start_time = 000000;

EXEC sp_attach_schedule
    @job_name = N'CancelarCitasExpiradas',
    @schedule_name = N'Cada Hora';

EXEC sp_add_jobserver
    @job_name = N'CancelarCitasExpiradas';
GO
```

### ✅ Verificación de Instalación

Ejecuta este script para verificar:

```sql
-- Verificar campo Monto
SELECT COLUMN_NAME, DATA_TYPE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'Pago' AND COLUMN_NAME = 'Monto';

-- Verificar SPs
SELECT name FROM sys.procedures 
WHERE name LIKE 'SP_%';

-- Verificar triggers
SELECT name FROM sys.triggers 
WHERE parent_class_desc = 'OBJECT_OR_COLUMN';

-- Verificar permisos
SELECT 
    OBJECT_NAME(major_id) AS Objeto,
    permission_name AS Permiso
FROM sys.database_permissions
WHERE grantee_principal_id = USER_ID('javauser')
ORDER BY Objeto;
```

### 🚀 Siguiente Fase

Después de instalar la BD, continuar con:
- Implementar endpoints en Node.js
- Crear servicios de pago y cancelación
- Integrar con frontend
- Pruebas de flujo completo
