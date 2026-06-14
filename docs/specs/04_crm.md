# 04 — CRM Interno (Bandeja Territorial)
## La cara de la UNCP: ver, clasificar y dar seguimiento

> Hereda de `00`, `01`, `02`, `03`. Define la cara institucional que opera el Coordinador de enlace territorial. Consume el Expediente Territorial (02) que produce el motor (03).

---

## 1. Objetivo

Dar a la UNCP un único lugar donde ver todas las necesidades entrantes (de cualquier canal), clasificarlas, cambiar su estado y derivarlas — terminando con el caos de 3-4 canales sin trazabilidad. Concentra la responsabilidad hoy difusa en un punto claro.

## 2. Por qué es importante

Ataca el Insight 4 del desafío ("muchos actores, responsabilidades difusas") y materializa el dolor #2 (trazabilidad). Es la mitad institucional del valor: sin esto, las necesidades entran pero nadie las gestiona de forma visible.

## 3. Usuario

El **Coordinador de enlace territorial** — rol que ya existe (la secretaria de la Unidad de Proyección Social que hoy recibe todos los canales). Un solo recurso humano, sin puesto nuevo.

## 4. Flujo principal

### Vista 1 — Bandeja territorial (la pantalla principal)
- Lista de todos los Expedientes Territoriales entrantes, más recientes primero.
- Por cada fila: código, comunidad, distrito, categoría, urgencia (con indicador visual para "alta"), estado actual, fecha.
- **Filtros simples:** por estado, por categoría/área, por distrito, por urgencia.
- Los expedientes de PUNKU Emergencias (urgencia alta) se destacan visualmente arriba.

### Vista 2 — Detalle del expediente
- Muestra todo el Expediente Territorial: resumen formal de la IA, área/facultades sugeridas, modalidad, confianza de la IA, familias afectadas, canal y origen de registro.
- Acceso a los datos de contacto (solo este rol, vía backend) para comunicarse con el representante.
- **Cambio de estado en 1 clic:** Recibido → En revisión → Derivado → Atendido → Cerrado.
- Campo de nota opcional al cambiar estado (queda en el historial).
- **Acción "Derivar" (estado + destino):** al derivar se registra el **destino** — una facultad (ej. "Ingeniería Ambiental") o "Otra entidad" (ONG/gobierno regional). Esto deja el timeline más claro. Marcar como "derivable a otra entidad" deja el expediente visible como necesidad no atendida por la UNCP, sin construir el flujo externo completo (roadmap). Sin workflow complejo: solo estado + destino.
- **Acción "Enviar a la facultad" (simulación de correo) — construido:** abre una ventana modal que **previsualiza el correo** tal como saldría en producción: destinatario (placeholder con la facultad sugerida por la IA), asunto auto-armado (`Solicitud de proyección social — [comunidad] — deriva a [facultad]`), cuerpo con el resumen formal + datos clave (comunidad, distrito, familias, categoría, urgencia, código), y **dos adjuntos reales descargables** (`solicitud-[codigo].pdf` en formato UNCP y `expediente-[codigo].csv`). Botón "Enviar" → toast "Correo preparado para la facultad ✓ (simulación)". Lleva un **rótulo honesto**: los archivos son reales y descargables, pero el envío es una simulación; en producción, con el dominio institucional de la UNCP, el correo se enviaría automáticamente con un clic. Es frontend puro (no conecta servidor de correo).

### Vista 3 — Tablero resumen (opcional, si da el tiempo)
- Conteos simples: total de solicitudes, por estado, por área, por distrito.
- Métrica destacada: necesidades registradas vs. atendidas (visibiliza el principio "nada se pierde").
- > Esta vista es **deseable**, no crítica. Si el tiempo aprieta, se omite; la bandeja + detalle ya demuestran el valor.

### Vista 4 — Completar solicitud de proyección social (B4) — el traductor de salida
Desde el detalle (B2), un botón "Armar solicitud de proyección social" abre esta pantalla dedicada. PUNKU traduce la necesidad ciudadana al **formato oficial UNCP** (estructura del proyecto: título, introducción/problema, ODS, descripción, objetivos, metas, justificación, metodología, cronograma, recursos, evaluación), dejándola semi-llenada. Es el traductor de salida: así como simplifica para la comunidad, le hace fácil a la UNCP completar la solicitud sin empezar de cero.

Dos bloques claros:
- **"Lo que ya sabemos" (pre-llenado por PUNKU, solo lectura):** título tentativo, lugar, población beneficiaria, descripción del problema, área, modalidad, facultades, ODS sugerido, objetivo y meta sugeridos, justificación inicial. Todo derivado de la necesidad ciudadana + IA.
- **"Completa para formalizar" (cajas reales editables por la UNCP):** objetivo general/específicos (con botón "✨ Sugerir con IA"), metas cuantitativas, metodología (con chips de opción rápida: capacitación, asistencia técnica, diagnóstico participativo, taller), cronograma (selector de fechas), recursos, presupuesto (S/), docente responsable, estudiantes participantes (nombre/DNI/código), indicadores (con "✨ Sugerir con IA").
- **Firmas:** se completan al imprimir (no se digitalizan).
- Botones: "Generar solicitud completa (PDF formato UNCP)" + "Guardar borrador".
- **Barra de progreso del formato — construido:** un indicador "Formato oficial completo al **X%**" arranca en ~70% (lo que PUNKU ya pre-llenó desde el expediente) y **sube en vivo hacia 100%** conforme la UNCP completa los campos académicos (con "Sugerir con IA" o a mano). Refuerza visualmente que B4 convierte una necesidad simple en el documento formal, partiendo ya con la mayor parte hecha.

> Distinción de alcance clave: PUNKU pre-llena lo que nace de la NECESIDAD (la comunidad lo sabe); la UNCP completa lo ACADÉMICO/interno (objetivos formales, presupuesto, equipo, firmas). PUNKU entrega el punto de partida, no el proyecto final ni reemplaza la formalización.

> Hallazgo de cumplimiento: el formato oficial UNCP exige como anexo la "Solicitud del beneficiario (escaneada)". El Expediente Territorial de PUNKU ES esa solicitud, en digital — encaja directamente en el proceso real.

> **RANGO DE MANIOBRA — Sugerencias de IA en B4:** para el MVP, lo esencial es que las cajas editables existan (resuelve la fricción). Los botones "✨ Sugerir con IA" son el diferenciador; si el tiempo aprieta, pueden quedar como sugerencias pre-cargadas en la demo (dato ficticio) en vez de llamadas reales.

> **RANGO DE MANIOBRA — B4 como recorrido guiado (opción B):** existe una alternativa de B4 como wizard paso a paso (estilo árbol ciudadano) en vez de una sola pantalla. Deseable pero más costosa; la opción A (una pantalla con cajas + chips + sugerencias) es la base segura para el MVP.

## 5. Cómo cada cambio impacta al ciudadano

Cada cambio de estado en el CRM se refleja automáticamente en la consulta de estado del ciudadano (spec 01, pantalla de seguimiento). Así, cuando el coordinador marca "En revisión", Genaro lo ve al consultar su código. Es el puente que cierra el dolor #2.

## 6. Requisitos de seguridad (heredados de 06)

- El CRM requiere autenticación del coordinador (login simple del lado interno).
- Solo este rol accede a la tabla `contactos` (datos sensibles) vía backend con service role; nunca desde el frontend público.
- La cara ciudadana (consulta por código) y la cara CRM están separadas: el ciudadano nunca ve la bandeja completa ni datos de otros.

## 7. Decisiones con rango de maniobra

> **RANGO DE MANIOBRA — Autenticación del CRM:** en el MVP, un login simple (usuario único del coordinador) basta para la demo. Producción: roles múltiples (coordinador + facultades con vista filtrada). Se confirma en piloto.

> **RANGO DE MANIOBRA — Exportación CSV:** deseable para interoperar con registros internos sin tocar ADESA. Si da el tiempo se incluye; si no, se narra como capacidad inmediata. Se confirma al construir.

## 8. Criterios de aceptación

- [ ] La bandeja muestra todos los expedientes con filtros por estado/área/distrito/urgencia.
- [ ] El detalle permite cambiar estado en 1 clic con nota opcional.
- [ ] Los cambios de estado se reflejan en la consulta del ciudadano.
- [ ] Existe la acción de derivar (a facultad o marcar derivable a otra entidad).
- [ ] Los datos de contacto solo son accesibles por el rol coordinador.
- [ ] Las emergencias (urgencia alta) se destacan.

## 9. Métricas de éxito (para impacto/piloto)

- Tiempo de clasificación (de "Recibido" a "En revisión").
- % de solicitudes que avanzan más allá de "Recibido" (no se estancan).
- Necesidades registradas vs. atendidas vs. derivadas.

## 10. Lo que NO hace

- NO reemplaza el proceso formal de evaluación/aprobación (que sigue en su cauce; PUNKU solo da visibilidad de entrada).
- NO construye el flujo completo de derivación externa a ONG/gobierno regional (roadmap; aquí solo se marca).
- NO gestiona la ejecución de proyectos ni a los estudiantes (eso vive en los sistemas existentes).
- NO tiene roles complejos ni auditoría avanzada en el MVP.
