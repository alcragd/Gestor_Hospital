# BLOQUE 5 — Documentación de Entrega (Fase 6)
**Fecha:** 2 de Enero 2026  
**Backend:** Node/Express + SQL Server  
**Frontend:** Vue  
**Estado BD:** Congelada (no se modifica en Fase 6)

---

## 🧭 Guía Rápida del Sistema
- **Paciente (rol 1):** Agendar cita, ver especialidades, gestionar sus citas, ver historial propio.
- **Doctor (rol 2):** Ver citas asignadas, atender paciente, crear recetas, consultar historial del paciente con cita asignada.
- **Recepcionista (rol 3):** CRUD pacientes/doctores/recepcionistas, gestionar citas, cancelar por rol, cobrar servicios, vender medicamentos, consultar bitácoras.

## 👤 Usuarios de Prueba (ejemplo headers)
- Paciente: `x-user-id=1`, `x-user-role=1`
- Doctor: `x-user-id=2`, `x-user-role=2`
- Recepcionista: `x-user-id=1`, `x-user-role=3`

*(El sistema real usa JWT; en pruebas se usaron headers simulados solo para validar autorización.)*

## ✅ Casos de Prueba Ejecutados
- **Bloque 2 (funcionales):** 12 pruebas; 7 OK (rol recepcionista 6/6), fallos esperados por falta de JWT en paciente/doctor. Evidencia: BLOQUE2_RESULTADOS.md, BLOQUE2_PRUEBAS_FUNCIONALES.json.
- **Bloque 3 (negativas):** 4/4 bloqueos correctos (403/404). Evidencia: BLOQUE3_PRUEBAS_NEGATIVAS.json, BLOQUE3_RESULTADOS.md.
- **Bloque 4 (bitácoras):** Consultas OK, 2 cambios de estatus (citas 36,37), accesos médicos registrados (pacientes 1 y 4). Evidencia: BLOQUE4_BITACORAS.json, BLOQUE4_RESULTADOS.md.

## ▶️ Instrucciones de Ejecución (local)
1) Backend: `node server.js` (requiere SQL Server con GestorHospitalDB). Config en src/config/db.config.js.
2) Frontend: `cd Gestor-Front && npm install && npm run dev` (Vite).
3) Pruebas: ejecutar scripts en `scripts/`:
   - `powershell -ExecutionPolicy Bypass -File scripts/pruebas_funcionales.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/pruebas_negativas.ps1`
   - `powershell -ExecutionPolicy Bypass -File scripts/bitacoras_fetch.ps1 -PacienteId <id>`

## 🛡 Justificación Técnica
- BD no se modificó: Fase 6 es solo auditoría/pruebas; estructura y SP ya cumplen reglas de negocio.
- Reglas de negocio validadas vía middleware, SPs y triggers; cambios aquí solo se documentan.
- Errores o faltantes se documentan; no se “ocultan” en frontend.

## 📑 Qué hace cada rol (resumen)
- Paciente: agenda y gestiona sus citas; no puede ver datos de otros.
- Doctor: atiende citas asignadas, crea recetas, consulta historial ligado a sus citas.
- Recepcionista: administración completa (citas, pacientes, doctores, servicios, farmacia, bitácoras).

## 🧮 Evidencias clave
- Auditoría BD: FASE6_AUDITORIA.md, BLOQUE1_RESULTADOS.md.
- Pruebas: BLOQUE2_PRUEBAS_FUNCIONALES.json, BLOQUE3_PRUEBAS_NEGATIVAS.json, BLOQUE4_BITACORAS.json.
- Scripts: pruebas_funcionales.ps1, pruebas_negativas.ps1, bitacoras_fetch.ps1, insert_historial_access*.js.
