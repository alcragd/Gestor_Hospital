# ✅ PASOS A SEGUIR - Verificar Panel Recepcionista

## 🚀 PASO 1: Recarga la Aplicación

```
1. En el navegador donde estás viendo el panel
2. Presiona Ctrl+R o Cmd+R para recargar
3. Abre la consola: F12 → Console
```

Deberías ver en la consola:
```
"App - Rol cargado: 3"
"PanelRecepcionista montado - currentView: pacientes"
"Usuario cargado: rec_laura"
```

---

## 📊 PASO 2: Verifica que ves el Panel Completo

Después de recargar, deberías ver:

```
┌─────────────────────────────────────────────┐
│ 🏥 Panel de Recepcionista                   │
│               rec_laura  [Cerrar Sesión]    │
├─────────────────────────────────────────────┤
│ 👤 Pacientes | 👨‍⚕️ Doctores | 🏥 Servicios | 💊 Farmacia │
├─────────────────────────────────────────────┤
│                                             │
│  (CONTENIDO DEL COMPONENTE SELECCIONADO)   │
│                                             │
├─────────────────────────────────────────────┤
│ © 2025 Gestor Hospital - Sistema de Recepción
└─────────────────────────────────────────────┘
```

✅ Si ves esto → **PERFECTO, FUNCIONA**

---

## 🧪 PASO 3: Prueba los Botones del Navbar

### 3.1 Click en "👤 Pacientes"
```
Resultado esperado:
- Botón se resalta en azul
- Se muestra una tabla con pacientes
- Hay un campo de búsqueda
```

### 3.2 Click en "👨‍⚕️ Doctores"
```
Resultado esperado:
- Botón se resalta en azul
- Se muestra una tabla con doctores
- Hay filtro por especialidad
```

### 3.3 Click en "🏥 Servicios"
```
Resultado esperado:
- Botón se resalta en azul
- Se muestra un grid con 10 servicios
- Hay un carrito en la derecha
```

### 3.4 Click en "💊 Farmacia"
```
Resultado esperado:
- Botón se resalta en azul
- Se muestra un grid con medicinas
- Hay un carrito y un tab de inventario
```

---

## 🔍 PASO 4: Verifica Errores

En F12 → Console, NO deberías ver errores como:

```
❌ "Cannot read property 'listarPacientes' of undefined"
❌ "GestionPacientes is not defined"
❌ "Failed to fetch"
❌ "Unexpected token"
```

Si ves errores, toma una captura y revisa:
1. ¿El backend está corriendo? (`node server.js`)
2. ¿localStorage tiene los valores correctos?
3. ¿Hay errores de red? (F12 → Network)

---

## 📝 PASO 5: Prueba una Operación Real

### Crear un Nuevo Paciente

```
1. Click en "👤 Pacientes"
2. Click en pestaña "Crear Paciente"
3. Llena el formulario:
   - Nombre: TestPaciente
   - Paterno: Testing
   - Materno: Dev
   - DNI: 99999999TEST
   - Fecha Nac: 1990-01-15
   - Edad: 34
   - Sexo: Hombre
   - Correo: test@hospital.com
   - Teléfono: 1234567890
   - Teléfono Emergencia: 9876543210
4. Click en "Crear Paciente"
```

Resultado esperado:
```
✅ Mensaje verde: "Paciente creado exitosamente (ID: XXX)"
✅ Formulario se limpia
✅ Se redirige a "Listar Pacientes" después de 2 segundos
✅ El nuevo paciente aparece en la tabla
```

---

## 📞 PASO 6: Si Algo No Funciona

### Problema 1: "Solo veo un cuadro vacío"
```
Solución:
1. Abre F12 → Console
2. Revisa si hay errores en rojo
3. Si hay error: "Cannot find module"
   → Verifica que los archivos .vue existen en:
     Gestor-Front/src/components/recepcion/
   → Verifica los imports en PanelRecepcionista.vue
```

### Problema 2: "Veo los botones pero el contenido no carga"
```
Solución:
1. F12 → Network → XHR
2. Haz click en "Pacientes"
3. Deberías ver una request a:
   http://localhost:3000/api/recepcion/pacientes
4. Si la request falla (status 4xx, 5xx):
   → Backend no está corriendo o falló
   → Verifica: node server.js
5. Si no hay request:
   → El componente no está llamando al API
   → Revisa: RecepcionService.js
```

### Problema 3: "Los datos no aparecen"
```
Solución:
1. F12 → Network → click request a /pacientes
2. Haz click en "Response" 
3. Deberías ver JSON con datos:
   {
     "success": true,
     "message": "...",
     "data": { ... }
   }
4. Si ves un error:
   → La BD no tiene datos o está caída
   → Verifica conexión SQL Server
5. Si ves datos pero no aparecen en pantalla:
   → Hay error en el componente Vue
   → Revisa F12 → Console para ver error específico
```

---

## ✅ VALIDACIÓN FINAL

Marca los checkboxes después de verificar cada punto:

```
Checklist de Validación:

□ Recargué la página y vi los logs en consola
□ Veo el header con "Panel de Recepcionista"
□ Veo el navbar con 4 botones
□ Veo el username "rec_laura" arriba
□ Al hacer click en "Pacientes" → carga tabla
□ Al hacer click en "Doctores" → carga tabla
□ Al hacer click en "Servicios" → carga grid
□ Al hacer click en "Farmacia" → carga grid
□ No hay errores en F12 → Console
□ Las requests llegan al backend (status 200)
□ Los datos de la BD se muestran correctamente
□ Puedo crear un nuevo paciente
□ El nuevo paciente aparece en la lista
```

Si todos tienen ✅ → **PANEL ESTÁ 100% FUNCIONAL**

---

## 🆘 AYUDA RÁPIDA

Si necesitas más información, consulta:

- **Guía Completa:** [QUICK_START.md](QUICK_START.md)
- **Solución Detallada:** [SOLUCION_PANEL_RECEPCIONISTA.md](SOLUCION_PANEL_RECEPCIONISTA.md)
- **Testing Manual:** [TESTING_MANUAL.md](TESTING_MANUAL.md)
- **Troubleshooting:** [TESTING_MANUAL.md#-errores-comunes-y-soluciones](TESTING_MANUAL.md)

---

**Última actualización:** 2025
**Estado:** ✅ LISTO PARA USAR
