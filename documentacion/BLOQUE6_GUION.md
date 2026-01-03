# BLOQUE 6 — Guion de Exposición (Fase 6)
**Objetivo:** Explicar la solución y evidenciar que cumple reglas, integridad y auditoría sin improvisar.

---

## 1) Arquitectura General
- Backend: Node/Express + SQL Server (mssql), BD GestorHospitalDB congelada.
- Frontend: Vue + Vite. Consumo vía axios.
- Seguridad: middleware por rol (headers x-user-id/x-user-role en pruebas; JWT real en sistema), rutas segregadas por rol.
- Auditoría: tablas Bitacora, Bitacora_Estatus_Citas, Bitacora_Historial_Medico; triggers/SPs de bitácora de estatus.

## 2) Flujo de una Cita (extremo a extremo)
1. Paciente agenda cita (reglas de anticipación/solapes en SP/trigger).
2. Pago y cambio de estatus → Bitácora_Estatus_Citas registra (Programada→Pagada).
3. Doctor atiende y puede crear receta (solo si cita asignada y estatus válido).
4. Recepcionista puede cancelar con política de reembolso; trigger/bitácora registran cambio y montos devueltos.
5. Consulta de bitácoras: recepcionista audita cambios y accesos médicos.

## 3) Reglas de Negocio (cómo se aplican)
- Validaciones en BD: triggers (transiciones de estatus, anticipación, solapes), constraints y FK.
- SPs de bitácora: registro de cambios de cita y acceso a historial.
- Middleware: rutas por rol (`requiereRecepcionista`, chequeo de rol doctor/paciente) y rechazo 403/404.
- Recetas solo si la cita pertenece al doctor y estatus en {Pagada, Atendida}.

## 4) Integridad de Datos
- PK/FK verificados (BLOQUE1_RESULTADOS.md); sin huérfanos.
- Trigger de cambios de estatus activo (Bitacora_Estatus_Citas). Trazabilidad por Id_Cita.
- Bitácoras inmutables (solo lectura vía endpoints; no hay DELETE/UPDATE expuestos).

## 5) Evidencia de Pruebas (responder “¿qué pasa si…?”)
- Funcionales: BLOQUE2_RESULTADOS.md (rol recepcionista OK; paciente/doctor requieren JWT → 403/404 esperado).
- Negativas: BLOQUE3_PRUEBAS_NEGATIVAS.json (accesos cruzados bloqueados 403/404).
- Bitácoras: BLOQUE4_BITACORAS.json (cambios de estatus + accesos médicos reales). Scripts: bitacoras_fetch.ps1, insert_historial_access*.js.

### Preguntas típicas
- ¿Qué pasa si un paciente intenta ver administración? → 403 (pruebas negativas).
- ¿Qué pasa si se intenta POST en bitácoras? → 404/403 (prueba negativa).
- ¿Qué pasa si un doctor crea receta de cita ajena? → 403 por validación de asignación.
- ¿Qué pasa si se cancela cita atendida? → Trigger/reglas lo impiden (estados válidos documentados).

## 6) Plan de Demo (pasos breves)
1. Mostrar arquitectura y roles.
2. Abrir frontend (paciente agenda; recepcionista gestiona; doctor atiende/receta).
3. Ejecutar scripts de prueba rápidos: `pruebas_negativas.ps1` y `bitacoras_fetch.ps1` para evidencias.
4. Mostrar bitácoras en UI (BitacorasSistema.vue) y JSON generado.

## 7) Cierre
- BD no modificada en Fase 6; solo auditoría y pruebas.
- Reglas de negocio respetadas; accesos indebidos bloqueados.
- Bitácoras permiten auditar de inicio a fin.
- Documentación y evidencia listas para entrega.
