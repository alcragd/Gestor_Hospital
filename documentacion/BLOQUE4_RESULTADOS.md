# RESULTADOS BITÁCORAS - BLOQUE 4
**Fecha:** 2 de Enero 2026  
**Servidor:** http://localhost:3000

---

## 📊 RESUMEN EJECUTIVO
- Endpoints consultados como recepcionista (rol 3) vía headers `x-user-id=1`, `x-user-role=3`.
- Periodo consultado: 2024-01-01 a 2026-12-31.
- Cambios de estatus obtenidos: 2 registros (citas 36 y 37, ambos de Programada→Pagada).
- Acceso a historial médico (paciente 1): 1 registro (CREACION_RECETA con Id_Receta=8, cita 33).
- Estadísticas: 2 cambios hacia "Pagada - Pendiente por Atender", 0 cancelaciones, monto devuelto nulo.

---

## ✅ ENDPOINTS PROBADOS
| # | Endpoint | Filtros | Resultado |
|---|----------|---------|-----------|
| 4.1 | GET /api/bitacoras/citas | desde=2024-01-01, hasta=2026-12-31 | success=true, total=2 |
| 4.2 | GET /api/bitacoras/citas/37 | N/A | total_cambios=1 (Programada→Pagada) |
| 4.3 | GET /api/bitacoras/historial/1 | desde=2024-01-01, hasta=2026-12-31 | total_accesos=1 (CREACION_RECETA, Id_Receta=8) |
| 4.4 | GET /api/bitacoras/estadisticas | desde=2024-01-01, hasta=2026-12-31 | cambios_por_estatus: 2 (Pagada), cancelaciones: 0, monto_total_devuelto: null |

---

## 🔎 HALLAZGOS
1. Bitácora de cambios de estatus responde y contiene registros recientes (IDs de cita 36 y 37).
2. Bitácora de historial médico muestra 1 acceso para paciente 1 ligado a creación de receta (Id_Receta=8).
3. Estadísticas coherentes con los cambios encontrados (solo transiciones a Pagada, sin cancelaciones ni reembolsos).

---

## 📂 EVIDENCIAS
- JSON crudo: documentacion/BLOQUE4_BITACORAS.json
- Script usado para extracción: scripts/bitacoras_fetch.ps1
- Registros de acceso médico generados para evidencia: scripts/insert_historial_access.js (paciente 4) y scripts/insert_historial_access_receta.js (paciente 1, receta 8)

---

## 🚩 SIGUIENTES PASOS
1. Registrar accesos adicionales desde el flujo real de doctor (GET historial, creación de recetas) para seguir poblando la bitácora médica.
2. Ejecutar 4.1/4.2 tras cualquier cambio de estatus de citas para validar que nuevas transiciones se registren.
3. (Opcional) Añadir filtros adicionales en UI para exportar CSV/Excel desde [BitacorasSistema.vue](../Gestor-Front/src/components/recepcion/BitacorasSistema.vue).
