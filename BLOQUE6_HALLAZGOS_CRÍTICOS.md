# BLOQUE 6 - HALLAZGOS CRÍTICOS
**Fecha:** 2 de Enero 2026  
**Fase:** 6 - Auditoría Final  
**Estado:** ⚠️ **BLOQUEADO** por dependencias clave

---

## 📋 RESUMEN EJECUTIVO

Se completó Bloque 1–5 conforme se planeó. En Bloque 6, se identificaron **dos bloqueos críticos** que impiden ejecutar pruebas de reglas de negocio (pagos 8h, cancelaciones 100/50/0% reembolso):

1. **CrearCita SP Encrypted**: Imposible modificar la validación de horario (SP usa `WITH ENCRYPTION`)
2. **SP_CancelarCita falla**: Intenta escribir en tabla inexistente `Reembolsos` → crash
3. **Permisos limitados**: Usuario javauser sin permisos CREATE TABLE

---

## 🔴 BLOQUEO #1: Validación de Horario en CrearCita

### **Problema**
- **SP:** `CrearCita` (dbo) - creado 22/12/2025
- **Estado:** `ENCRYPTED` (WITH ENCRYPTION) → código fuente oculto
- **Error observado:** "La cita está fuera del horario laboral del doctor"
  - Ocurre al agendar para 2026-01-13 (Martes, dentro del rango laboral de doctores)

### **Análisis Root Cause**
- SP compare `DATENAME(WEEKDAY, Fecha)` en sesión de cliente con valores en tabla `Horario.Dia_Semana`
- Cliente (conexión node-mssql) retorna nombres en **inglés** ("Tuesday", "Monday", etc.)
- Tabla `Horario.Dia_Semana` contiene **español** ("Martes", "Lunes", etc.)
- Mismatch → validación falla, se rechaza la cita

### **Intentos de Corrección**
```javascript
// 1. Set default language en login
ALTER LOGIN javauser WITH DEFAULT_LANGUAGE = Spanish  // ✅ ejecutado
   → Sin efecto (conexión sigue trayendo inglés)

// 2. SET LANGUAGE Spanish en sesión/SP
await pool.request().query('SET LANGUAGE Spanish');   // ✅ ejecutado
   → Sin efecto (SP encrypted, no se puede modificar)

// 3. Crear tabla Reembolsos
CREATE TABLE Reembolsos (...)                         // ❌ permisos denegados
   → Error 262: "CREATE TABLE permission denied"
```

### **Evidencia**
```sql
-- Horario tabla (actual, español)
SELECT * FROM Horario 
-- Resultado: Dia_Semana = 'Lunes', 'Martes', 'Miércoles', ...

-- Cliente test (inglés)
SELECT DATENAME(WEEKDAY, '2026-01-13')
-- Resultado: 'Tuesday' (sin SET LANGUAGE en cliente)

-- Con SET LANGUAGE Spanish
SET LANGUAGE Spanish;
SELECT DATENAME(WEEKDAY, '2026-01-13')
-- Resultado: 'Martes' (correcto, pero SP encrypted)
```

### **Por qué es Crítico**
- SP está **encriptado**, no se puede leer ni modificar el código
- Usuario javauser **no tiene permisos** para dropar/recrear SP
- Única solución: **DBA** con permisos ALTER PROCEDURE o `sa`
- **Impacto:** Imposible crear citas para reglas de negocio (pruebas Reembolso100/50/0, PlazoPago)

---

## 🔴 BLOQUEO #2: SP_CancelarCita Falla por Tabla Inexistente

### **Problema**
- **SP:** `SP_CancelarCita` intenta escribir en tabla `Reembolsos`
- **Error:** "Invalid object name 'Reembolsos'"
- **Impacto:** No se pueden cancelar citas, no se registran reembolsos

### **Detalles**
```
Error: RequestError: Invalid object name 'Reembolsos'.
Location: sp_cancelarcita line X (encrypted, no se conoce)
```

### **Intentos de Creación**
```javascript
// Intentar crear tabla Reembolsos
CREATE TABLE Reembolsos (...)
// Error 262: CREATE TABLE permission denied
```

### **Análisis**
- Tabla `Reembolsos` no existe en la BD
- SP cancellation service intenta INSERTs/UPDATEs a esa tabla
- Usuario `javauser` no tiene permisos DDL (CREATE TABLE)
- Solución requiere **DBA privilegios**

### **Impacto**
- **Sin cancelación:** No se prueban reglas (100/50/0% reembolso)
- **Sin reembolsos:** Bitácoras no registran REEMBOLSO action
- **Sin pago:** No se pueden generar evidencias de las restricciones de negocio

---

## ✅ WORK DONE (Bloque 1–5)

### Bloque 1: Estructura Datos & BD
- ✅ BD restaurada (`GestorHospitalDB.bak`)
- ✅ Tablas verificadas (Usuarios, Pacientes, Doctores, Citas, Bitacora, etc.)
- ✅ 10 especialidades creadas (Consultorio+Grado asignados)

### Bloque 2: Pruebas Funcionales
- ✅ 11/12 tests PASS (1 warning: doctor profile field)
- ✅ Endpoints verificados: mis-citas, doctores, especialidades, bitácoras, servicios
- ✅ Roles validados: Paciente (user23), Doctor (user1), Recepcionista (user1 role3)

### Bloque 3: Pruebas Negativas
- ✅ 4/4 tests PASS (acceso denegado, recursos no encontrados)
- ✅ Validación de permisos por rol confirmada

### Bloque 4: Bitácoras
- ✅ Bitácora_Historial_Medico con accesos (20 registros)
- ✅ Auditoría de cambios de estatus en Citas
- ✅ Verificación de actividades de recepción

### Bloque 5: Entrega Documentación
- ✅ Guión Bloque 6 redactado
- ✅ Evidencia JSON generada (BLOQUE2, BLOQUE3, BLOQUE4 resultados)
- ✅ Script de login tokens ejecutado

---

## 🟡 PARTIAL: Bloque 6 - Reglas de Negocio

### Completado
- ✅ Análisis de endpoints de cancellación y pago
- ✅ Script `pruebas_cancelaciones_pagos.js` diseñado (4 escenarios)
- ✅ Especialidades completadas a 10 (requisito cumplido)

### Bloqueado
- ❌ **CrearCita SP Encrypted** → no puede crear citas de prueba
- ❌ **SP_CancelarCita falla** → no registra cancelaciones ni reembolsos
- ❌ **Tabla Reembolsos missing** → imposible crear (permisos insuficientes)

### Evidencia Parcial Capturada
```json
{
  "script": "scripts/pruebas_cancelaciones_pagos.js",
  "estado": "listo pero bloqueado",
  "casos": [
    { "nombre": "Reembolso100", "desc": ">48h anticipación", "estado": "pendiente" },
    { "nombre": "Reembolso50", "desc": "24-48h anticipación", "estado": "pendiente" },
    { "nombre": "Reembolso0", "desc": "<24h anticipación", "estado": "pendiente" },
    { "nombre": "PlazoPago", "desc": "8 horas expirado", "estado": "pendiente" }
  ],
  "razon_bloqueo": "SP_CrearCita validation + SP_CancelarCita missing table"
}
```

---

## 📊 MATRIZ DE DEPENDENCIAS

| Componente | Estado | Bloqueante | Solución |
|---|---|---|---|
| Usuarios/Roles | ✅ OK | — | — |
| Especialidades (10) | ✅ OK | — | — |
| Endpoints Funcionales | ✅ OK | — | — |
| Pruebas Negativas | ✅ OK | — | — |
| Bitácoras | ✅ OK | — | — |
| CrearCita SP | 🔴 BLOQUEADO | Encrypted | DBA: Recreate SP sin encryption |
| Reembolsos Tabla | 🔴 MISSING | Permisos | DBA: CREATE TABLE + ALTER SP |
| SP_CancelarCita | 🔴 FALLA | Reembolsos missing | Después de crear Reembolsos |
| Pruebas Reglas Negocio | 🔴 BLOQUEADO | CrearCita+Reembolsos | Después de arreglos arriba |

---

## 🔧 PLAN DE RESOLUCIÓN

### **Opción A: DBA Fixes (Recomendada)**
Requiere usuario `sa` o con permisos `ALTER ANY PROCEDURE`, `CREATE TABLE`:

```sql
-- 1. Crear tabla Reembolsos
CREATE TABLE dbo.Reembolsos (
    Id_Reembolso INT IDENTITY(1,1) PRIMARY KEY,
    Id_Pago INT NULL,
    Id_Cita INT NULL,
    Monto DECIMAL(10,2) NULL,
    Porcentaje INT NULL,
    Fecha DATETIME DEFAULT GETDATE(),
    Usuario VARCHAR(50) NULL,
    Motivo VARCHAR(200) NULL
);

-- 2. Recreate CrearCita sin encryption O mantener y ajustar validación
-- Option 1: Drop y recreate sin WITH ENCRYPTION
DROP PROCEDURE CrearCita;
CREATE PROCEDURE CrearCita (
    @Id_Doctor INT,
    @Id_Paciente INT,
    @Fecha_Cita VARCHAR(10),
    @Hora_Inicio VARCHAR(8),
    @Hora_Fin VARCHAR(8),
    @Usuario VARCHAR(50)
) AS
SET LANGUAGE Spanish;
-- ... (resto del código de creación original)

-- Option 2: Si existe backup original, restaurar procedimiento sin encryption

-- 3. Granular permisos a javauser
GRANT CREATE TABLE TO javauser;
GRANT ALTER ANY PROCEDURE TO javauser;
```

### **Opción B: Workaround (Temporal)**
Crear tabla con permisos elevados manualmente, luego otorgar acceso:
```sql
-- Ejecutar como sa
CREATE TABLE dbo.Reembolsos (...);
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Reembolsos TO javauser;
```

Después:
```bash
node scripts/pruebas_cancelaciones_pagos.js
# Generará: BLOQUE_NEGOCIO_CANCELACIONES_PAGOS.json
```

### **Timeline Estimado**
- DBA fixes: **30 min – 1 hora** (crear tabla, recrear/ajustar SP)
- Re-run tests: **10 min**
- Generar evidencia: **5 min**

---

## 📄 ARCHIVOS GENERADOS

| Archivo | Descripción |
|---|---|
| `scripts/pruebas_cancelaciones_pagos.js` | Script listo (4 escenarios) |
| `BLOQUE2_PRUEBAS_FUNCIONALES.json` | 11/12 PASS |
| `BLOQUE3_PRUEBAS_NEGATIVAS.json` | 4/4 PASS |
| `BLOQUE4_BITACORAS.json` | Evidencia bitácoras |
| `BLOQUE6_HALLAZGOS_CRÍTICOS.md` | Este archivo |

---

## 📝 CONCLUSIONES

### Logros
1. ✅ Funcionalidad de autenticación y roles verificada
2. ✅ Endpoints principales expuestos y funcionando
3. ✅ Auditoría de acceso e historial médico registrado
4. ✅ Especialidades completas (10 registros)
5. ✅ Documentación comprehensiva

### Limitaciones
1. ❌ SP `CrearCita` encriptado impide modificar lógica de validación de horario
2. ❌ Tabla `Reembolsos` inexistente bloquea cancelaciones
3. ❌ Usuario `javauser` sin permisos DDL/ALTER PROCEDURE

### Recomendación Final
**Contactar a DBA** para:
1. Crear tabla `Reembolsos` con permisos SELECT/INSERT/UPDATE/DELETE
2. Recrear SP `CrearCita` sin encriptación (o con lógica de day-name mapping)
3. Otorgar permisos necesarios a `javauser`

Una vez completados estos pasos, todas las pruebas de negocio (Bloque 6) se pueden ejecutar exitosamente.

---

**Audit Date:** 2 enero 2026  
**Auditor:** Proceso de Auditoría Automatizado  
**Status:** ⚠️ PENDING DBA INTERVENTION
