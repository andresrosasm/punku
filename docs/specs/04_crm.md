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

**ESTADO DE IMPLEMENTACIÓN — recorrido guiado lineal (construido):** el detalle se rediseñó como un **flujo lineal guiado** (UX: *progressive disclosure*), no una lista de botones sueltos:

- **Stepper horizontal** arriba del detalle como columna vertebral: `Recibido → En revisión → Derivado → Atendido → Cerrado` (paso hecho = verde con check, actual = anillo verde, futuros = gris).
- **Una sola acción principal por estado**, ocultando las demás:
  - **Recibido** → "Revisar y clasificar" (pasa a *En revisión*).
  - **En revisión** (no marcada lista) → "Armar solicitud" / "Continuar la solicitud" si ya hay borrador (abre B4). La tarjeta muestra el sello "✓ Borrador guardado" cuando existe borrador.
  - **En revisión** (marcada lista para derivar, flag `listo_para_derivar`) → selector de facultad destino + "Derivar a [facultad]" → **dispara el modal de correo**; al confirmar el envío el expediente pasa a *Derivado* + historial, en **un solo gesto** (derivar = notificar).
  - **Derivado** → "Marcar como atendido".
  - **Atendido** → "Cerrar caso".
  - **Cerrado** → sin acciones (resumen de cierre).
- **Campo de nota opcional** en la acción de cada estado (queda en el historial).
- Se **eliminaron los botones sueltos** previos ("Avanzar", "Derivar a este destino", "Enviar a la facultad"): sus funciones viven ahora dentro de la acción contextual del estado.
- El **selector de facultad** se inicializa con la facultad sugerida por la IA mapeada a su nombre canónico (selector y botón muestran siempre la misma facultad).

- **Destino de la derivación:** una facultad (ej. "Medicina Humana") o "Otra entidad" (ONG/gobierno regional). Marcar "Otra entidad" deja el expediente visible como necesidad no atendida por la UNCP, sin construir el flujo externo completo (roadmap). Sin workflow complejo: solo estado + destino.

- **"Derivar" = notificar a la facultad en un solo gesto (construido):** al pulsar "Derivar a [facultad]" se abre un modal que **previsualiza el correo** tal como saldría en producción: destinatario (placeholder con la facultad destino), asunto auto-armado (`Solicitud de proyección social — [comunidad] — deriva a [facultad]`), cuerpo con el resumen formal + datos clave (comunidad, distrito, familias, categoría, urgencia, código), y **dos adjuntos reales descargables** (`solicitud-[codigo].pdf` en formato UNCP y `expediente-[codigo].csv`). El botón "Derivar y enviar" → pasa el estado a *Derivado*, registra el historial y muestra el toast "Derivado a [facultad] ✓ Correo enviado (simulación). El ciudadano ya lo ve." Lleva un **rótulo honesto**: los archivos son reales y descargables, pero el envío es una simulación; en producción, con el dominio institucional de la UNCP, el correo se enviaría automáticamente. Es frontend puro (no conecta servidor de correo).

- **Botón "Contactar por WhatsApp" (construido):** en la tarjeta de contacto del detalle. Tras revelar el contacto (solo el rol coordinador, vía backend), aparece un botón que abre `wa.me/[teléfono real]` con un **mensaje pre-redactado** que referencia el código y la comunidad del expediente. El teléfono se sirve server-side y solo con sesión activa (nunca al frontend público). Facilita el seguimiento humano, sobre todo en expedientes con `datos_incompletos`.

- **Flag `datos_incompletos` como AVISO, no bloqueo (construido):** cuando la IA detectó input incoherente/incompleto, el expediente se creó igual (fricción cero para el ciudadano) y el detalle lo señala con un **tag** ("Datos incompletos") junto al estado y un **banner ámbar** que sugiere contactar al ciudadano por WhatsApp antes de formalizar. Ver spec 03 para cómo se determina el flag.

### Vista 3 — Tablero resumen (opcional, si da el tiempo)
- Conteos simples: total de solicitudes, por estado, por área, por distrito.
- Métrica destacada: necesidades registradas vs. atendidas (visibiliza el principio "nada se pierde").
- > Esta vista es **deseable**, no crítica. Si el tiempo aprieta, se omite; la bandeja + detalle ya demuestran el valor.

### Vista 4 — Completar solicitud de proyección social (B4) — el traductor de salida
Desde el detalle (B2), un botón "Armar solicitud de proyección social" abre esta pantalla dedicada. PUNKU traduce la necesidad ciudadana al **formato oficial UNCP** (estructura del proyecto: título, introducción/problema, ODS, descripción, objetivos, metas, justificación, metodología, cronograma, recursos, evaluación), dejándola semi-llenada. Es el traductor de salida: así como simplifica para la comunidad, le hace fácil a la UNCP completar la solicitud sin empezar de cero.

Dos bloques claros:
- **"Lo que ya sabemos" (pre-llenado por PUNKU, solo lectura):** título tentativo, lugar, población beneficiaria, descripción del problema, área, modalidad, facultades, ODS sugerido, objetivo y meta sugeridos, justificación inicial. Todo derivado de la necesidad ciudadana + IA.
- **"Completa para formalizar" (cajas reales editables por la UNCP):** objetivo general, objetivos específicos, metas cuantitativas, metodología (con chips de opción rápida: capacitación, asistencia técnica, diagnóstico participativo, taller), recursos e indicadores/evaluación — **los seis con botón "✨ Sugerir con IA"** —, más cronograma (selector de fechas), presupuesto (S/), docente responsable y estudiantes participantes (nombre/DNI/código). Encabezado: "Completa para formalizar — lo redacta la UNCP con apoyo de IA".
- **Firmas:** se completan al imprimir (no se digitalizan).
- **Barra de acciones fija (footer sticky) — rediseño construido:** tres salidas, todas vuelven al expediente en revisión: "Guardar borrador y volver" (ghost), "Descargar copia (PDF)" (ghost) y "Guardar y volver para derivar →" (primary, marca la solicitud lista). Reemplaza los botones sueltos previos. Microcopy honesto: *el PDF en formato UNCP se genera y adjunta solo al derivar; "Descargar copia" es solo una copia para revisar* (usa el diálogo de impresión nativo del navegador).
- **Barra de progreso viva — construido:** "Formato oficial completo al **X%**" arranca en **70%** (info rica) o **26%** (info pobre — por `datos_incompletos` **o por un problema sin sustancia** detectado al abrir B4, no solo por la plantilla; ver spec 03 §6.quater) — lo que PUNKU ya pre-llenó — y **sube en vivo hacia 100%** conforme la UNCP completa los 9 campos académicos (con "Sugerir con IA", a mano, o vía co-construcción WhatsApp). Refuerza que B4 convierte una necesidad simple en el documento formal, partiendo ya con la mayor parte hecha.
- **Campos pendientes resaltados — construido:** cada caja sin llenar lleva un pill ámbar **"PENDIENTE"** (y un check ✓ verde al llenarse), y un resumen "Faltan **N** campos: …" lista los que faltan. Hace evidente qué resta sin bloquear nada.
- **Entrada pobre como punto de partida bajo — construido:** si el expediente tiene `datos_incompletos = true`, la base del progreso arranca en **26%** (en vez de 70%) y la columna verde marca con "Por confirmar" / "La comunidad no precisó…" lo que falta; el módulo de co-construcción WhatsApp se abre por defecto para cerrar la brecha. El % sí sube conforme se completa.

- **"✨ Sugerir con IA" = IA real (construido):** los seis botones de B4 (objetivo general, objetivos específicos, metas, metodología, recursos, evaluación/indicadores) llaman al motor de IA real (Claude Haiku, server-side, ver spec 03) que genera el texto a partir del contexto del expediente, con **fallback a plantilla** si la IA falla. No son sugerencias pre-cargadas.

- **ESTADO DE IMPLEMENTACIÓN — Persistencia de B4 en Supabase (construido):** los campos que la UNCP completa en B4 **persisten en Supabase** en una **tabla nueva y separada `borradores_b4`** (relación 1:1 con `expedientes`, ver spec 02), no en columnas de `expedientes` (para rollback limpio). "Guardar borrador" hace upsert; al abrir B4 el formulario se **hidrata desde la BD** (la BD es fuente de verdad; el estado de sesión es solo capa de UX). El mismo formulario hidratado alimenta la **generación del PDF** y el **modal de correo**, de modo que B4 → PDF → correo comparten siempre los mismos datos. Se entregan los scripts `supabase/migration-borradores-b4.sql` y `supabase/rollback-borradores-b4.sql`. Verificado en producción: el borrador persiste entre sesiones (logout/login).

- **ESTADO DE IMPLEMENTACIÓN — Crumb de recorrido + flag "listo para derivar" (construido):** B4 abre con un **crumb** ("← Volver al expediente › Paso 2 de 3 · En revisión · Armar la solicitud oficial") que ancla B4 dentro del flujo guiado; "Volver" **guarda el avance**, no descarta. El flag explícito **"listo para derivar"** (`listo_para_derivar`, **columna nueva** en `borradores_b4`; se entrega `supabase/migration-listo-para-derivar.sql`) solo lo activa "Guardar y volver para derivar", y hace que la tarjeta del detalle pase de "Continúa la solicitud" (con sello "✓ Borrador guardado") a "Deriva a la facultad".

- **ESTADO DE IMPLEMENTACIÓN — Módulo de co-construcción del CONTEXTO por WhatsApp en B4 (construido):** card full-width dentro de B4, **abierta por defecto** cuando el expediente llegó con poca información o con un problema **sin sustancia** (`datos_incompletos` o basura detectada por sustancia). Pregunta SOLO por **contexto ciudadano** (problema, qué quiere lograr, familias, aportes), **nunca** por los campos académicos —esos los redacta la UNCP con "Sugerir con IA". Tres pasos: (1) **"Generar preguntas"** → Claude Haiku arma las preguntas de contexto pendientes con opciones numeradas (banco estático como fallback); (2) **"Contactar por WhatsApp"** → abre `wa.me` con el teléfono real (resuelto server-side) y las preguntas pre-redactadas; (3) pegar la respuesta del ciudadano ("1 2 1 2") + **"Interpretar"** → un parser determinista **reconstruye el contexto del expediente** (problema, objetivo, familias), que se refleja en la columna verde "Lo que ya sabemos"; el **aporte** llena el campo Recursos y aparece también en "Lo que ya sabemos" (anexo aditivo si el resumen ya era bueno; ver spec 03 §6.quater), subiendo el progreso. **Filtrado (construido):** solo pregunta el contexto genuinamente pendiente — nunca lo que el ciudadano ya eligió con botones (aspiración/familias) ni el aporte/problema ya resueltos; si no falta nada, muestra "No hay contexto pendiente que preguntar". **Contacto inválido (construido):** si el teléfono o el nombre del contacto no son válidos, el módulo oculta el botón de WhatsApp y sugiere "marcar para contacto manual". Rótulo honesto (demo: interpretación manual funcional; producción: WhatsApp Business API automática). Ver spec 03 §6.quater para el motor. Verificado en producción.

> Distinción de alcance clave: PUNKU pre-llena lo que nace de la NECESIDAD (la comunidad lo sabe); la UNCP completa lo ACADÉMICO/interno (objetivos formales, presupuesto, equipo, firmas). PUNKU entrega el punto de partida, no el proyecto final ni reemplaza la formalización.

> Hallazgo de cumplimiento: el formato oficial UNCP exige como anexo la "Solicitud del beneficiario (escaneada)". El Expediente Territorial de PUNKU ES esa solicitud, en digital — encaja directamente en el proceso real.

> **RANGO DE MANIOBRA — Sugerencias de IA en B4 → RESUELTO (construido con IA real):** se construyeron como **llamadas reales** al motor de IA (Claude Haiku) con fallback a plantilla, no como sugerencias pre-cargadas. Las cajas editables existen y los seis botones "✨ Sugerir con IA" funcionan en producción.

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

- [x] La bandeja muestra todos los expedientes con filtros por estado/área/distrito/urgencia.
- [x] El detalle permite avanzar el estado con nota opcional (recorrido guiado: una acción por estado).
- [x] Los cambios de estado se reflejan en la consulta del ciudadano.
- [x] Existe la acción de derivar (a facultad o marcar derivable a otra entidad); "Derivar" abre el correo y notifica en un solo gesto.
- [x] Los datos de contacto solo son accesibles por el rol coordinador; con botón "Contactar por WhatsApp".
- [x] Las emergencias (urgencia alta) se destacan.
- [x] B4 persiste en Supabase (`borradores_b4`) y alimenta el PDF y el correo con los mismos datos.
- [x] Los seis botones "Sugerir con IA" de B4 (objetivo general, objetivos específicos, metas, metodología, recursos, evaluación) usan IA real con fallback.
- [x] El flag `datos_incompletos` se muestra como aviso (tag + banner + variante ámbar de la tarjeta PASO), sin bloquear.
- [x] B4 rediseñado: crumb de recorrido, barra de acciones fija con 3 salidas, progreso vivo (base 70%/26%), "Descargar copia (PDF)" con microcopy honesto, flag `listo_para_derivar`.
- [x] Módulo de co-construcción WhatsApp en B4: pregunta SOLO contexto ciudadano (problema/objetivo/familias/aportes), detecta basura por sustancia → wa.me server-side → reconstruye el contexto en "Lo que ya sabemos"; el aporte entra a Recursos y a "Lo que ya sabemos" (anexo aditivo, sin re-pulir). Contacto inválido → oculta WhatsApp y sugiere contacto manual.
- [x] El filtrado de co-construcción no repregunta el contexto ya definido (aspiración/familias/aporte/problema con sustancia); indica cuándo no falta nada.

## 9. Métricas de éxito (para impacto/piloto)

- Tiempo de clasificación (de "Recibido" a "En revisión").
- % de solicitudes que avanzan más allá de "Recibido" (no se estancan).
- Necesidades registradas vs. atendidas vs. derivadas.

## 10. Lo que NO hace

- NO reemplaza el proceso formal de evaluación/aprobación (que sigue en su cauce; PUNKU solo da visibilidad de entrada).
- NO construye el flujo completo de derivación externa a ONG/gobierno regional (roadmap; aquí solo se marca).
- NO gestiona la ejecución de proyectos ni a los estudiantes (eso vive en los sistemas existentes).
- NO tiene roles complejos ni auditoría avanzada en el MVP.
