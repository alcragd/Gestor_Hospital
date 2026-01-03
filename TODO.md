# TODO - Plan de Trabajo
> **Última actualización**: 2 de Enero 2026  
> **Estado del proyecto**: 85% completado - Fase 5 y 6 pendientes

## Estado general
- [x] **FASE 1** — Consolidación núcleo: ciclo de vida de citas, cancelaciones, bloqueos de reglas, pagos y reembolsos ✅
- [x] **FASE 2** — Perfiles: Paciente (historial, filtros, cancelación con política, agendar con disponibilidad, comprobante), Doctor (citas, datos paciente, historial, recetas, restricciones) ✅
- [x] **FASE 3** — Recepcionista: CRUD completo, cancelaciones, cobros, servicios, farmacia ✅
- [x] **FASE 4** — Servicios y Farmacia: inventario, ventas, integración de cobros ✅
- [ ] **FASE 5** — Bitácoras: estatus de citas, historial médico-citas (OBLIGATORIA) ⚠️
- [ ] **FASE 6** — Validaciones finales y pruebas exhaustivas 🔨

## Detalle por objetivo

### ✅ FASE 1 — Citas y Pagos (COMPLETADA)
- [x] Estatus y transiciones: Programada(1) → Pagada(2) → Atendida(6) / Cancelaciones(3,4,5)
- [x] Cancelaciones con política y aprobaciones implementadas en `SP_RegistrarPago`
- [x] Bloqueos: trigger `TRG_Validar_Cita_Insert` valida 48h anticipación, máx 3 meses, horarios, solapamientos
- [x] Pagos: ventana de 8 horas con `DATEDIFF(MINUTE)`, reembolsos (100%/50%/0%), integración con servicios/medicamentos
- [x] Endpoints: `/api/pagos/*`, `/api/cancelaciones/*`, `/api/citas/*`

### ✅ FASE 2 — Perfiles (COMPLETADA)
- [x] **Paciente**: 
  - Panel con tabs (Agendar/Mis Citas)
  - Historial completo con filtros por fecha y estatus
  - Cancelación con políticas de reembolso
  - Agendamiento con validación de disponibilidad
  - Formateo de fechas y cálculo automático de edad
  - Detección de traslapes de citas
  - Componentes: `PanelPaciente.vue`, `FormularioCita.vue`
  
- [x] **Doctor**: 
  - Vista de citas asignadas con filtros
  - Acceso a datos de pacientes con citas activas
  - Consulta de historial médico del paciente
  - Creación de recetas (diagnóstico, medicamentos, indicaciones)
  - Restricciones: no auto-alta, no editar datos sensibles, solo 1 especialidad
  - Middleware bloquea acceso de recepcionistas a rutas médicas
  - Componente: `PanelDoctor.vue`
  - Endpoints: `/api/doctores/me`, `/api/doctores/paciente/:id`, `/api/doctores/receta`

### ✅ FASE 3 — Recepcionista (COMPLETADA)
- [x] **CRUD completo implementado**:
  - Pacientes: crear, listar, obtener, actualizar (contacto)
  - Doctores: crear, listar, obtener, actualizar, dar de baja, gestión de horarios
  - Recepcionistas: crear, listar, obtener, actualizar, dar de baja
  - Auto-cálculo de edad desde fecha de nacimiento (backend + frontend)
  
- [x] **Gestión de citas**: 
  - Listar todas las citas con filtros
  - Cancelar citas de pacientes/doctores con motivo
  - Endpoint: `POST /api/recepcion/citas/:id/cancelar`
  
- [x] **Restricciones de seguridad**:
  - Middleware `requiereRecepcionista` (rol 3) en todas las rutas
  - Bloqueo explícito en `/api/doctores/*` para recepcionistas (línea 12-18 de doctores.routes.js)
  - No acceso a recetas ni historiales médicos
  
- [x] **Componentes UI**:
  - `PanelRecepcionista.vue` con sidebar navegable
  - `GestionPacientes.vue`, `GestionDoctores.vue`, `GestionRecepcionistas.vue`
  - `GestionCitas.vue` para gestión centralizada
  - Diseño consistente con Bootstrap cards

### ✅ FASE 4 — Servicios y Farmacia (COMPLETADA)
- [x] **Servicios médicos**:
  - Listar catálogo de servicios: `GET /api/recepcion/servicios`
  - Vender servicios: `POST /api/recepcion/servicios/venta`
  - Permite venta sin ser paciente registrado (campo `Nombre_Cliente`)
  - Componente: `VentaServicios.vue`
  
- [x] **Farmacia**:
  - Inventario completo: `GET /api/recepcion/medicamentos`
  - Venta de medicamentos: `POST /api/recepcion/medicamentos/venta`
  - Actualizar stock: `PUT /api/recepcion/medicamentos/:id/stock`
  - Permite venta sin registro (campo `Nombre_Cliente`)
  - Búsqueda y filtro por disponibilidad
  - Componente: `Farmacia.vue` con tabs (Venta/Inventario)
  
- [x] **Integración de cobros**:
  - `VentasUnificadas.vue` para registro unificado
  - Carrito dinámico para servicios y medicamentos
  - Cálculo automático de totales
  - Registro en BD con stored procedures

### ⚠️ FASE 5 — Bitácoras (PENDIENTE - OBLIGATORIA)
**Estado**: Parcialmente implementado en algunas tablas, falta sistematizar

**Lo que existe**:
- [x] Inserciones aisladas en tabla `Bitacora` (doctores.routes.js línea 156, pacientes.routes.js línea 224)
- [x] Estructura básica: `(Fecha_Hora, Usuario, Accion, Tabla_Afectada, Id_Reg_Afectado, Detalles)`

**Lo que falta**:
- [ ] **Bitácora de cambios de estatus de citas**:
  - Trigger automático en `UPDATE Citas.ID_Estatus`
  - Registrar: estatus anterior, estatus nuevo, usuario que hizo el cambio, fecha/hora
  - Incluir monto devuelto en caso de cancelaciones
  - Tabla sugerida: `Bitacora_Estatus_Citas`
  
- [ ] **Bitácora de accesos a historiales médicos**:
  - Trigger en `SELECT/INSERT/UPDATE` de tabla `Historial_Medico` (si existe)
  - Registrar: quién accedió, tipo de acción, fecha/hora, id de cita relacionada
  - Vincular con recetas creadas
  - **Sin permitir edición ni borrado** de registros históricos
  - Tabla sugerida: `Bitacora_Historial_Medico`
  
- [ ] **Endpoints de consulta**:
  - `GET /api/bitacoras/citas?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&estatus=X`
  - `GET /api/bitacoras/historial/:paciente_id`
  - Solo lectura, no modificación de bitácoras
  
- [ ] **Componente UI**:
  - Vista de auditoría para recepcionistas/administradores
  - Tabla de cambios con filtros por fecha, usuario, tipo de acción
  - Visualización cronológica de eventos

### 🔨 FASE 6 — Validaciones Finales (PENDIENTE)
**Estado**: Mayoría implementada, falta pruebas formales

**Implementado**:
- [x] Permisos por rol en todas las rutas
- [x] Mensajes de error en español
- [x] Validaciones de entrada en controllers
- [x] Manejo de errores con try-catch
- [x] Diseño UI consistente con Bootstrap

**Pendiente**:
- [ ] **Pruebas de casos extremos**:
  - Intentos de agendar citas en fechas pasadas
  - IDs inexistentes o formatos inválidos
  - Doble submit de formularios
  - Stocks negativos en farmacia
  
- [ ] **Integridad referencial**:
  - Verificar cascadas en eliminaciones
  - Probar borrado de doctor con citas activas
  - Validar constraints de BD
  
- [ ] **Demo con datos realistas**:
  - Mínimo 10 especialidades diferentes
  - Mínimo 40 doctores (4 por especialidad)
  - 50+ citas en diferentes estatus
  - 20+ pacientes activos
  - 15+ medicamentos en inventario
  - 5+ servicios médicos
  
- [ ] **Documentación final**:
  - Actualizar README.md con todas las funcionalidades
  - Crear documento de casos de prueba
  - Video/GIF demostrativo (opcional)
