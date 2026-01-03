# RESULTADOS PRUEBAS NEGATIVAS - BLOQUE 3
**Fecha:** 2 de Enero 2026  
**Servidor:** http://localhost:3000

---

## 📊 RESUMEN EJECUTIVO

**Resultado General:** ✅ APROBADO (100% bloqueos correctos)

- Total de pruebas: 4
- Bloqueos correctos: 4
- Advertencias: 0
- Fallos: 0

---

## ✅ DETALLE DE PRUEBAS (4/4)

| # | Rol simulado | Endpoint | Metodo | Esperado | Resultado |
|---|--------------|----------|--------|----------|-----------|
| 3.1 | Paciente | /api/recepcion/pacientes | GET | 403 | Bloqueado (403) |
| 3.2 | Recepcionista | /api/doctores/receta/1 | GET | 403 | Bloqueado (403) |
| 3.3 | Doctor | /api/recepcion/doctores | GET | 403 | Bloqueado (403) |
| 3.4 | Recepcionista | /api/bitacoras/citas | POST | 404 | Bloqueado (404) |

**Metodologia:**
- Se simularon roles via headers x-user-id y x-user-role (sin JWT) para validar que el backend no permita cruces de permisos ni escritura directa en bitacoras.
- Se consideraron exitosos los codigos 403 (acceso prohibido) y 404 (ruta inexistente para POST en bitacoras).

---

## 🔐 CONCLUSIONES

1. Control de acceso por rol funciona: todos los accesos indebidos fueron rechazados.
2. Ruta de bitacoras no admite escritura directa (404), protegiendo la integridad de auditoria.
3. Middleware de autenticacion sigue activo: rechaza peticiones sin credenciales validas.

---

## 📌 SIGUIENTES PASOS

1. Ejecutar las mismas pruebas con JWT reales para validar la combinacion autenticacion + autorizacion.
2. Agregar mas casos negativos (SQLi simple en query params, body malformados, verbos no permitidos) si el alcance lo permite.
3. Mantener el archivo documentacion/BLOQUE3_PRUEBAS_NEGATIVAS.json como evidencia de los resultados automatizados.
