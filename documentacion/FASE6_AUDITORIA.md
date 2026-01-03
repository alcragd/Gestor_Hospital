# FASE 6 - AUDITORÍA FINAL Y PREPARACIÓN DE ENTREGA
**Sistema de Gestión Hospital**  
**Fecha:** 2 de Enero 2026  
**Estado:** En ejecución

---

## 🎯 OBJETIVO
Verificar que el sistema cumple especificaciones, es consistente, respeta roles y está listo para evaluación académica **SIN modificar BD ni reglas de negocio**.

---

## 📊 BLOQUE 1 - AUDITORÍA DE BASE DE DATOS

### 1.1 Inventario de Tablas

#### FASE 1: Citas, Pagos y Bitácoras
| Tabla | Propósito | PKs | FKs | Estado |
|-------|-----------|-----|-----|--------|
| `Citas` | Registro de citas médicas | Id_Cita | Id_Paciente, Id_Doc, ID_Estatus | ✅ |
| `Pago` | Registro de pagos | Id_Pago | Id_Cita | ✅ |
| `Estatus_Cita` | Catálogo de estatus | Id_Estatus | - | ✅ |
| `Reembolsos` | Cancelaciones con devolución | Id_Reembolso | Id_Cita | ✅ |
| `Bitacora_Estatus_Citas` | Auditoría de cambios de estatus | Id_Bitacora | Id_Cita, Usuario_Modifico | ✅ |
| `Bitacora_Historial_Medico` | Auditoría de accesos médicos | Id_Bitacora | Id_Cita, Id_Paciente, Usuario_Acceso | ✅ |

#### FASE 2: Pacientes y Doctores
| Tabla | Propósito | PKs | FKs | Estado |
|-------|-----------|-----|-----|--------|
| `Pacientes` | Datos de pacientes | Id_Paciente | Id_User | ✅ |
| `Doctores` | Datos de doctores | Id_Doctor | Id_Empleado, Id_Especialidad | ✅ |
| `Empleados` | Datos generales de empleados | Id_Empleado | Id_User | ✅ |
| `Especialidades` | Catálogo de especialidades médicas | Id_Especialidad | ID_Consultorio | ✅ |
| `Consultorio` | Ubicaciones de consultorios | Id_Consultorio | - | ✅ |
| `Horarios_Trabajo` | Horarios de doctores | Id_Horario | Id_Doctor | ✅ |
| `Historial_Medico` | Historiales de pacientes | Id_Historial | Id_Paciente | ✅ |
| `Recetas` | Recetas médicas | Id_Receta | Id_Cita | ✅ |
| `Recetas_Medicamentos` | Detalle de recetas | Id_Receta_Medicamento | Id_Receta, Id_Medicamento | ✅ |

#### FASE 3: Administración
| Tabla | Propósito | PKs | FKs | Estado |
|-------|-----------|-----|-----|--------|
| `Usuarios` | Cuentas de acceso al sistema | Id_User | Id_Rol | ✅ |
| `Roles` | Catálogo de roles (1=Paciente, 2=Doctor, 3=Recepcionista) | Id_Rol | - | ✅ |

#### FASE 4: Farmacia y Servicios
| Tabla | Propósito | PKs | FKs | Estado |
|-------|-----------|-----|-----|--------|
| `Medicamentos` | Inventario de medicamentos | Id_Medicamento | - | ✅ |
| `Servicios` | Catálogo de servicios médicos | Id_Servicio | - | ✅ |
| `Ventas_Servicios` | Ventas de servicios | Id_Venta_Servicio | Id_Servicio, Id_Empleado | ✅ |
| `Ventas_Medicamentos` | Ventas de medicamentos | Id_Venta_Medicamento | Id_Medicamento, Id_Empleado | ✅ |

### 1.2 Verificación de Integridad Referencial

**Pendiente de ejecutar queries de verificación...**

### 1.3 Verificación de Triggers

| Trigger | Tabla | Evento | Propósito | Estado |
|---------|-------|--------|-----------|--------|
| `TRG_Bitacora_Cambio_Estatus_Cita` | Citas | AFTER UPDATE | Registrar cambios de estatus automáticamente | ✅ PROBADO |
| `TRG_Validar_Transicion_Estatus` | Citas | AFTER UPDATE | Validar transiciones de estatus permitidas | ✅ EXISTE |
| Otros triggers... | - | - | Pendiente de mapear | ⏳ |

### 1.4 Verificación de Stored Procedures

| SP | Propósito | Estado |
|----|-----------|--------|
| `SP_Registrar_Acceso_Historial` | Registrar acceso a historial médico | ✅ CREADO |
| `SP_Consultar_Bitacora_Cita` | Obtener historial de una cita | ✅ CREADO |
| `SP_Consultar_Bitacora_Historial_Paciente` | Obtener accesos a historial de paciente | ✅ CREADO |
| `SP_Consultar_Bitacora_Cambios_Estatus` | Query global de cambios de estatus | ✅ CREADO |

---

## 🧪 BLOQUE 2 - PRUEBAS FUNCIONALES POR ROL

### 2.1 ROL: PACIENTE (ID_ROL = 1)

#### Prueba 2.1.1: Alta de paciente
- **Entrada:** Datos completos de nuevo paciente
- **Esperado:** Registro exitoso en Pacientes y Usuarios
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.1.2: Agendar cita válida
- **Entrada:** Doctor disponible, fecha futura, horario válido
- **Esperado:** Cita creada con estatus 1 (Programada)
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.1.3: Intentar agendar cita inválida
- **Entrada:** Fecha pasada / horario ocupado
- **Esperado:** Rechazo con mensaje de error
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.1.4: Cancelar cita con política
- **Entrada:** Cita > 48h anticipación
- **Esperado:** Reembolso 100%
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.1.5: Ver historial completo
- **Entrada:** ID paciente autenticado
- **Esperado:** Solo sus propias citas
- **Resultado:** ⏳ PENDIENTE

### 2.2 ROL: DOCTOR (ID_ROL = 2)

#### Prueba 2.2.1: Ver citas asignadas
- **Entrada:** ID doctor autenticado
- **Esperado:** Solo citas donde Id_Doc = su ID
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.2.2: Atender paciente
- **Entrada:** Cita en estatus 2 (Pagada)
- **Esperado:** Cambio a estatus 6 (Atendida), registro en bitácora
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.2.3: Generar receta
- **Entrada:** Cita atendida, medicamentos válidos
- **Esperado:** Receta creada en BD
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.2.4: Intentar acciones prohibidas
- **Entrada:** Ver recetas de otro doctor
- **Esperado:** Acceso denegado
- **Resultado:** ⏳ PENDIENTE

### 2.3 ROL: RECEPCIONISTA (ID_ROL = 3)

#### Prueba 2.3.1: Cancelar citas por paciente
- **Entrada:** Cita válida para cancelación
- **Esperado:** Cambio a estatus 4, cálculo de reembolso
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.3.2: Cancelar citas por doctor
- **Entrada:** Cita válida
- **Esperado:** Cambio a estatus 5, reembolso 100%
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.3.3: Cobrar servicios
- **Entrada:** Servicio válido, cliente sin cita
- **Esperado:** Registro en Ventas_Servicios
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.3.4: Vender medicamentos
- **Entrada:** Medicamento en stock
- **Esperado:** Venta registrada, stock actualizado
- **Resultado:** ⏳ PENDIENTE

#### Prueba 2.3.5: Intentar ver historial médico
- **Entrada:** Acceso a ruta de historial médico
- **Esperado:** Acceso denegado por middleware
- **Resultado:** ⏳ PENDIENTE

---

## 🔴 BLOQUE 3 - PRUEBAS NEGATIVAS (CRÍTICAS)

### 3.1 Pruebas de Seguridad de Roles

#### Prueba 3.1.1: Paciente intenta acceder a panel de recepción
- **Entrada:** Token de paciente + ruta `/recepcion`
- **Esperado:** Error 403 Forbidden
- **Resultado:** ⏳ PENDIENTE

#### Prueba 3.1.2: Recepcionista intenta ver recetas
- **Entrada:** Token de recepcionista + GET `/api/doctores/receta/:id`
- **Esperado:** Middleware bloquea acceso
- **Resultado:** ⏳ PENDIENTE

#### Prueba 3.1.3: Doctor intenta modificar otro doctor
- **Entrada:** Doctor A modifica horarios de Doctor B
- **Esperado:** Validación rechaza operación
- **Resultado:** ⏳ PENDIENTE

### 3.2 Pruebas de Integridad de Estados

#### Prueba 3.2.1: Cancelar cita ya atendida
- **Entrada:** Cita con estatus 6 (Atendida)
- **Esperado:** Trigger rechaza cambio
- **Resultado:** ⏳ PENDIENTE

#### Prueba 3.2.2: Volver de estatus Pagada a Programada
- **Entrada:** UPDATE Citas SET ID_Estatus=1 WHERE ID_Estatus=2
- **Esperado:** Trigger TRG_Validar_Transicion_Estatus rechaza
- **Resultado:** ⏳ PENDIENTE

#### Prueba 3.2.3: Pagar cita ya pagada
- **Entrada:** Doble POST a /api/pagos para misma cita
- **Esperado:** Validación detecta pago existente
- **Resultado:** ⏳ PENDIENTE

### 3.3 Pruebas de Modificación Indebida

#### Prueba 3.3.1: Modificar bitácora directamente
- **Entrada:** UPDATE Bitacora_Estatus_Citas SET ...
- **Esperado:** No debería existir endpoint, solo lectura
- **Resultado:** ⏳ PENDIENTE

#### Prueba 3.3.2: Eliminar registro de pago
- **Entrada:** DELETE FROM Pago WHERE ...
- **Esperado:** FK constraints / triggers bloquean
- **Resultado:** ⏳ PENDIENTE

---

## 🧾 BLOQUE 4 - REVISIÓN DE BITÁCORAS

### 4.1 Verificación de Trazabilidad Completa

#### Caso de Prueba: Ciclo de vida de una cita
1. Cita creada (estatus 1) → ✅ Debe registrarse
2. Pago realizado (estatus 2) → ✅ Debe registrarse
3. Doctor atiende (estatus 6) → ✅ Debe registrarse
4. Doctor consulta historial → ✅ Debe registrarse en Bitacora_Historial_Medico
5. Doctor crea receta → ✅ Debe registrarse en Bitacora_Historial_Medico

**Estado:** ⏳ PENDIENTE DE EJECUTAR

### 4.2 Verificación de Inmutabilidad

- [ ] Bitácoras no tienen UPDATE en código
- [ ] Bitácoras no tienen DELETE en código
- [ ] Bitácoras no son accesibles por usuarios

---

## 📄 BLOQUE 5 - DOCUMENTACIÓN DE ENTREGA

**Archivos a generar:**
- [ ] `GUIA_RAPIDA_SISTEMA.md`
- [ ] `USUARIOS_PRUEBA.md`
- [ ] `CASOS_PRUEBA_EJECUTADOS.md`
- [ ] `INSTRUCCIONES_EJECUCION.md`
- [ ] `JUSTIFICACION_TECNICA.md`

---

## 🎤 BLOQUE 6 - PREPARACIÓN PARA EXPOSICIÓN

**Guion de presentación:**
- [ ] Arquitectura general (cliente-servidor, BD)
- [ ] Flujo completo de una cita
- [ ] Demostración de reglas de negocio
- [ ] Demostración de integridad de datos
- [ ] Demostración de sistema de auditoría

---

## ✅ CRITERIOS DE ÉXITO

- [ ] Sistema cumple PDF al 100%
- [ ] No hay accesos indebidos entre roles
- [ ] No hay estados inválidos permitidos
- [ ] Bitácoras son completas y trazables
- [ ] Sistema puede demostrarse sin improvisar

---

**ÚLTIMA ACTUALIZACIÓN:** Iniciando Fase 6
