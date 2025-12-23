# TODO - Plan de Trabajo

## Estado general
- [x] FASE 1 — Consolidación núcleo: ciclo de vida de citas, cancelaciones, bloqueos de reglas, pagos y reembolsos
- [x] FASE 2 — Perfiles: Paciente (historial, filtros, cancelación con política, agendar con disponibilidad, comprobante), Doctor (citas, datos paciente, historial, recetas, restricciones)
- [~] FASE 3 — Recepcionista: CRUD de pacientes/doctores/recepcionistas/especialidades/consultorios, cancelaciones, cobros, restricciones a recetas/historial
- [ ] FASE 4 — Servicios y Farmacia: servicios independientes y cobro, farmacia inventario/venta sin ser paciente, relación con recetas
- [ ] FASE 5 — Bitácoras: estatus de citas (solo insert/consulta), historial médico–citas (movimientos, estatus, receta, sin edición/borrado)
- [ ] FASE 6 — Validaciones finales: permisos por perfil, mensajes claros, integridad referencial, pruebas límite, demo y datos de prueba

## Detalle por objetivo

### FASE 1 — Citas y Pagos (CRÍTICA)
- [x] Estatus y transiciones: pendiente pago → pagada → atendida / no acudió; cancelaciones (paciente, doctor, falta de pago 8h)
- [x] Cancelaciones con política y aprobaciones (paciente/doctor/falta de pago)
- [x] Bloqueos: reagendar, fuera de horario doctor, fecha pasada, <48h o >3 meses, doble cita doctor/paciente
- [x] Pagos: generar línea al crear cita, registrar pago, reembolsos (100/50/0), integración con servicios y medicamentos

### FASE 2 — Perfiles (ALTA)
- [x] Paciente: datos personales, historial completo, filtros por fecha/estatus, cancelar con política, agendar (≥10 especialidades, ≥4 doctores por especialidad), comprobante
- [x] Doctor: citas asignadas, datos paciente, historial médico, recetas (diagnóstico/medicamentos/tratamiento/observaciones), restricciones (sin alta propia, sin editar sensibles, solo 1 especialidad, cancelación vía recepcionista)

### FASE 3 — Recepcionista (MEDIA)
- [x] CRUD: pacientes, doctores, recepcionistas, especialidades, consultorios
- [ ] Cancelar citas (doctor/paciente); gestionar cobros (servicios, medicamentos); restringir acceso a recetas/historial

### FASE 4 — Servicios y Farmacia (MEDIA–BAJA)
- [ ] Servicios extra: registrar ≥3, vender sin ser paciente, integrar cobro
- [ ] Farmacia: inventario, venta sin ser paciente, relación con recetas, cobro integrado

### FASE 5 — Bitácoras (OBLIGATORIA)
- [ ] Bitácora estatus de citas: cambios, fechas, usuario, montos devueltos; solo inserción/consulta
- [ ] Bitácora historial médico–citas: quién, estatus, receta asociada; sin edición/borrado

### FASE 6 — Validaciones y Calidad (FINAL)
- [ ] Permisos por perfil, manejo de errores, integridad referencial, pruebas de borde, demo y datos realistas
