# 03 — Motor de Estructuración (IA)
## Una llamada: de "tengo un problema" a Expediente Territorial

> Hereda de `00`, `01`, `02`. Define cómo la IA convierte lenguaje ciudadano en un Expediente Territorial estructurado, con privacidad por diseño, una sola llamada, fallback a reglas, y estrategia de migración a soberanía de datos.

---

## 1. Objetivo

Transformar la necesidad expresada por el ciudadano (selecciones del árbol + texto libre opcional) en los campos estructurados del Expediente Territorial: categoría, facultad sugerida, modalidad, urgencia y resumen formal.

## 2. Principio rector del motor

**La IA acelera, no decide sola, y no es indispensable.** La IA estructura y sugiere; el coordinador valida en el CRM (human-in-the-loop). Si la IA no está disponible, el sistema sigue funcionando con reglas. La innovación es la *traducción institucional*, no el modelo en sí.

## 3. Una sola llamada (decisión de diseño)

Para el MVP: **una única llamada** a la IA por solicitud (no dos momentos). Reduce latencia, costo y puntos de falla en la demo en vivo.

**Entrada (anonimizada — sin datos personales):**
```
Área elegida: Medio ambiente y agua
Qué pasa: contaminación / mortandad
Distrito: Sapallanga
Familias: 120
Qué quieren lograr: "que el río esté limpio y podamos criar truchas otra vez"
Urgencia: urgente
Relato libre: "se nos murieron las truchas por agua contaminada de la mina"
```

**Salida (JSON estructurado):**
```json
{
  "categoria": "ambiental",
  "modalidad": "polivalente",
  "urgencia": "alta",
  "facultades_sugeridas": ["Ingeniería Forestal y Ambiental", "Ingeniería Química Ambiental", "Economía"],
  "ods_sugerido": "ODS 6 - Agua limpia y saneamiento",
  "resumen_formal": "Comunidad de Sapallanga reporta mortandad de truchas por presunta contaminación hídrica de origen minero, afectando a 120 familias. Requiere evaluación ambiental e intervención técnica.",
  "objetivo_sugerido": "Recuperar la calidad del agua del río para restablecer la crianza de truchas en la comunidad.",
  "meta_sugerida": "120 familias con acceso a agua apta y un plan de manejo en 6 meses.",
  "confianza": 0.92,
  "coherente": true,
  "motivo": ""
}
```

Los campos `ods_sugerido`, `objetivo_sugerido` y `meta_sugerida` se derivan del área/facultad y del "qué quieren lograr" capturado en el paso E de la ingesta. Alimentan el borrador de solicitud del CRM (B4) en formato oficial UNCP. El humano (coordinador/facultad) siempre los edita; son sugerencias, no decisiones finales.

> **Asignación del ODS:** la IA usa el mapeo oficial ODS-Facultad de la UNCP (tabla `ods_facultad`, spec 02). Sabiendo la facultad/área deducida, asigna el ODS específico correcto (ej. ambiente → ODS 6/15; ingenierías → ODS 7/9; económicas → ODS 8; sociales → ODS 5/16) o un ODS transversal pertinente. Esto evita que la IA invente ODS y alinea cada necesidad con los Objetivos de Desarrollo Sostenible 2030, en el lenguaje que la universidad ya usa.

Con ese JSON + los datos del árbol se crea el Expediente Territorial (spec 02). El contacto se guarda aparte, nunca entra aquí.

## 4. Privacidad por diseño (cumplimiento)

- A la IA se le envía SOLO la necesidad anonimizada (área, qué pasa, distrito, familias, relato). **Nunca** nombre, teléfono ni DNI.
- Cumple Ley 31814, DL 1412 y protección de datos (Indecopi). Declaración jurada: la demo usa datos 100% ficticios.

## 5. Estrategia de IA en dos tiempos (el punto que da viabilidad y soberanía)

### Tiempo 1 — MVP / Hackatón
- **Proveedor:** API de Claude (modelo Haiku) — elegido por velocidad de implementación, estabilidad en demo en vivo, y soporte nativo de salida estructurada (JSON confiable sin alucinar campos).
- **Candados:** key solo en backend (variable de entorno), saldo limitado, modelo barato. (Ver spec 06.)

> **Estado de implementación (MVP construido):** la IA real **está activa y
> clasificando**. `lib/ai.ts` implementa `estructurarNecesidad()` llamando a
> Claude Haiku (`ANTHROPIC_API_KEY` en el servidor) con **tool use / salida
> estructurada** validada contra esquema y **timeout de 10 s**. Verificado en
> vivo: ante un caso ambiguo ("niños enfermos por el agua del pozo") la IA
> dedujo `clasificado_por: ia`, confianza 0.85, modalidad polivalente, facultades
> cruzadas (Medicina Humana + Ing. Civil) y **ODS 6 (Agua)** mirando la causa
> raíz, no el síntoma — algo que el fallback por reglas no haría. Si falta la
> key o la IA falla/timeout, cae a reglas (`clasificado_por: reglas`, confianza
> fija ~0.6) y el expediente se crea igual. **La demo nunca se cae.**

### Tiempo 2 — Implementación real / Producción
- **Migración a soberanía de datos y costo cero recurrente**, tal como recomendó el mentor de IA: reemplazar el proveedor comercial por un **modelo abierto (DeepSeek u otro) corriendo on-premise** sobre infraestructura nacional/institucional — por ejemplo **Huawei Cloud o un servidor de la OTIC-UNCP**.
- Beneficio: ningún dato sale de la universidad; cero costo por token; cumplimiento total de soberanía de datos del Estado.

### Por qué la migración es trivial (decisión de arquitectura)
El motor de IA está **aislado tras una interfaz** (`estructurarNecesidad(input) → Expediente`). El resto del sistema (árbol, CRM, base de datos) no sabe ni le importa qué modelo hay detrás. Cambiar de Claude a DeepSeek/Huawei es reemplazar la implementación de esa función, sin tocar nada más. **No hay dependencia dura de ningún proveedor.**

## 6. Fallback a reglas (resiliencia — la demo nunca se cae)

Si la API falla, no responde, se agota el saldo, o **excede el timeout de 10 segundos**:
- El sistema clasifica por **reglas/palabras clave** usando el catálogo de facultades (spec 02) y las selecciones del árbol.
- El expediente se genera igual, marcado `clasificado_por: "reglas"`.
- El resumen formal se arma con una plantilla simple a partir de las selecciones.
- La experiencia del ciudadano NO cambia ni se interrumpe.

> En una demo en vivo, la resiliencia vale más que la sofisticación. El árbol ya clasifica sin IA; la IA solo enriquece.

## 6.bis Evaluación de coherencia — aviso, no bloqueo (construido)

En la misma llamada, la IA evalúa si el input del ciudadano es **coherente y suficiente** y devuelve `coherente` (bool) + `motivo` (texto breve). Decisión de diseño deliberada (cambió respecto a un enfoque previo de bloqueo):

- **Nunca se frena ni se rechaza la creación.** Aunque el input sea incoherente, vacío o sin sentido, el expediente **se crea igual** (fricción cero: el ciudadano que más necesita el servicio suele ser el que peor redacta). La IA **no inventa** datos que no existen; pre-llena con lo que hay y marca la calidad.
- Si `coherente = false`, el expediente se guarda con `datos_incompletos = true` (spec 02). Ese flag es un **aviso interno** que solo ve el coordinador en el panel: tag "Datos incompletos", banner ámbar y barra de B4 en ámbar (spec 04). El ciudadano nunca ve una pantalla de error.
- El fallback por reglas incluye una heurística local (`pareceCoherente`) para marcar el flag cuando la IA no está disponible.

> Criterio: la validación de calidad es responsabilidad **interna** (el coordinador completa o contacta por WhatsApp), no una barrera de entrada para el ciudadano.

### Guardia anti-alucinación en la estructuración (construido)

Una auditoría de los resúmenes de producción detectó que, con input **fino o basura**, la IA "rellenaba" el resumen **inventando** necesidades que el ciudadano no escribió (p. ej. agregar "demanda de sistemas de riego" sobre un pedido de baches) o elaboraba texto basura ("DEMO ejemplo", "asdsdadss") como si fuera un proyecto real; con input rico la IA era fiel. Se cerró en dos frentes, **solo en la estructuración del registro** (`estructurarNecesidad`) — el pulido de co-construcción (§6.quater) ya era fiel:

1. **Regla anti-invención (prompt + esquema):** se instruye explícitamente reformular ÚNICAMENTE lo que el ciudadano escribió — sin agregar necesidades, cifras, temas, ubicaciones ni causas no presentes, y sin añadir un segundo problema "paralelo". Resúmenes escuetos para inputs escuetos.
2. **Guardia de sustancia (reutiliza la MISMA de co-construcción):** tras estructurar, se invoca `evaluarSustanciaContexto` (juez Haiku + fallback determinista `pareceBasura`, §6.quater) sobre el texto del ciudadano. Si no tiene sustancia → `coherente=false` / `datos_incompletos=true`: se descarta el resumen y el expediente se rutea a co-construcción en vez de elaborar contenido inventado. Es la **misma** función de detección que usa la co-construcción, no una variante nueva.

Verificado con Haiku real en producción: el caso de baches ya no inventa riego; la basura va a co-construcción con resumen-plantilla (sin proyecto inventado); los casos de input rico (posta de salud a tres horas, pozo contaminado) siguen fieles y completos, sin acortarse ni degradarse.

> **Roadmap (no implementado, decisión deliberada):** la guardia de sustancia es algo agresiva con inputs **reales pero escuetos** (ej. "No tenemos buena electricidad"), que también enruta a co-construcción en lugar de producir un resumen corto. La dirección es segura (pregunta a la comunidad en vez de inventar) y ningún caso de input rico se ve afectado; afinar el umbral del juez de sustancia queda en el roadmap.

## 6.ter Sugerencias de IA en B4 (segunda capacidad, on-demand — construido)

Además de la estructuración al crear (una sola llamada), el motor expone una capacidad **separada y bajo demanda** para el CRM: `sugerirCampoB4(expediente, campo)`. Desde B4 (spec 04), cada botón "✨ Sugerir con IA" dispara una llamada que redacta el campo académico pedido a partir del contexto del expediente. Son **seis campos**: objetivo general, objetivos específicos, metas, metodología, recursos, evaluación/indicadores.

- Es IA **real** (Claude Haiku, server-side, sesión de coordinador requerida), con **fallback a plantilla** (`plantillaB4`) si la IA falla.
- No contradice el principio de "una sola llamada" de §3: aquella aplica a la **creación** del expediente; estas son acciones explícitas y opcionales del coordinador dentro del CRM, una por clic.

## 6.quater Co-construcción del CONTEXTO ciudadano por WhatsApp (tercera capacidad on-demand — construido)

Cuando un expediente llega con poca información o con un problema **sin sustancia** (relato ininteligible o vacío), faltan datos de **contexto que solo la comunidad tiene**: cuál es su problema real, qué quiere lograr, a cuántas familias afecta y con qué puede aportar. El motor co-construye **ese contexto ciudadano** —nunca los campos académicos, que los redacta la UNCP con "Sugerir con IA" (§6.ter)— vía WhatsApp, integrado en B4 (spec 04 §4):

1. **`generarPreguntasCoco(exp, camposLlenos)` → preguntas con opciones numeradas.** Pregunta SOLO por las dimensiones de **contexto ciudadano**: `problema | objetivo | familias | aportes`. Claude Haiku (server-side, sesión de coordinador) arma las pendientes, cada una con 3 opciones (`label` ciudadano + `formal` institucional); banco estático por categoría como fallback. Nunca pregunta por objetivo académico, metas, metodología, etc.

2. **Detección por SUSTANCIA, no por plantilla (construido).** Un problema puede ser **basura disfrazada**: un relato ininteligible que igual trae plantilla coherente y número de familias. `evaluarSustanciaContexto` —Claude Haiku como juez (`problema_claro`) con fallback determinista `pareceBasura`— evalúa la sustancia del relato/resumen y, si es insuficiente, agrega la dimensión `problema` a las preguntas. **Esta misma función la reutiliza la estructuración del registro (§6.bis)** para no elaborar inputs sin sustancia.

3. **`interpretarRespuestaCoco(exp, preguntas, respuesta)` → reconstruye el CONTEXTO del expediente.** La comunidad responde por números ("1 2 1 2"); un **parser determinista** mapea números↔opciones y reconstruye los campos de contexto del expediente: `resultado_deseado` (objetivo), `familias_afectadas`, `resumen_formal` (problema reconstruido) y el campo B4 `recursos` (aporte). Aparecen en la columna verde "Lo que ya sabemos" de B4 (spec 04). Si hay IA, **Haiku pule** el `resumen_formal` regenerado; el parser es el respaldo. Maneja respuestas sucias ("respondo 1, 2, y somos como 15").

### El aporte comunitario en el contexto (fix construido)

El aporte de la comunidad (dim `aportes`) no va solo al campo académico **Recursos**: también entra al **contexto** (`resumen_formal`, visible en "Lo que ya sabemos"). Dos caminos según el caso:
- **Caso basura** (se reconstruye el problema): el aporte se incluye en el `resumen_formal` **regenerado**, que sí pasa por el pulido de Haiku.
- **Caso bueno** (el resumen ya es válido): el aporte se **anexa de forma aditiva** al final del resumen existente, **sin reescribirlo y sin re-pasar por el pulido de Haiku** (preservando byte a byte el texto bueno); idempotente — no duplica si se reinterpreta.

> Criterio: un texto ya bueno NO se re-pasa por el LLM para enriquecerlo (lo reescribiría); solo el texto regenerado desde cero se pule. El anexo aditivo queda fuera del pulido.

### Filtrado: solo se pregunta el contexto genuinamente pendiente (construido)

El generador nunca repregunta lo que el ciudadano ya definió. `generarPreguntasCoco` recibe los campos ya llenos (`camposLlenos`) y descarta:
- **Objetivo** si el expediente ya trae `resultado_deseado` (aspiración del paso E, spec 01).
- **Familias** si ya trae `familias_afectadas`.
- **Aportes** si el campo Recursos de B4 ya está lleno.
- **Problema** si el problema tiene sustancia (no es basura).

El filtro se aplica **tanto al banco como al prompt de Haiku**. Si tras filtrar no queda nada, muestra **"No hay contexto pendiente que preguntar"**. Verificado en producción.

> Criterio: la co-construcción respeta el trabajo del ciudadano y se limita al contexto que solo la comunidad tiene; lo académico es trabajo de la UNCP. Cada pregunta por WhatsApp aporta información que el sistema realmente no tiene.

### Honestidad (rótulo obligatorio)

El módulo lleva un rótulo visible: en la **demo**, el coordinador pega manualmente la respuesta y la IA la interpreta (esto sí es funcional); en **producción**, con WhatsApp Business API, la respuesta llegaría automática y escribiría en la BD sin intervención. El enlace `wa.me` se arma **server-side con el teléfono real** del contacto, nunca expuesto al frontend público (ver spec 04/06).

## 7. Cómo se fuerza JSON válido

- Usar la salida estructurada nativa del proveedor (tool use / structured output) para garantizar el esquema.
- Validar el JSON contra el esquema esperado antes de usarlo; si no valida, caer al fallback por reglas.

## 8. Decisiones con rango de maniobra

> **RANGO DE MANIOBRA — Modelo MVP:** Claude Haiku base. Alternativas: GPT-4o-mini. Lo que no cambia: el aislamiento tras interfaz y el fallback. Se confirma al implementar.

> **RANGO DE MANIOBRA — Modelo producción:** DeepSeek on-premise (Huawei/OTIC-UNCP) es la dirección recomendada; la elección final del modelo abierto y la infraestructura se define en el piloto según recursos de la UNCP.

## 9. Criterios de aceptación

- [x] Una sola llamada produce el JSON con los campos (categoría, modalidad, urgencia, facultades, resumen, ODS, objetivo/meta, confianza, coherencia).
- [x] A la IA nunca se le envían datos personales.
- [x] Si la IA falla, el fallback por reglas genera el expediente igual.
- [x] El JSON se valida contra esquema antes de usarse.
- [x] El motor está aislado tras una interfaz (migrable sin reescribir el sistema).
- [x] La spec documenta la migración Claude → DeepSeek/Huawei para producción.
- [x] La IA evalúa coherencia y marca `datos_incompletos` como aviso, sin bloquear la creación.
- [x] Guardia anti-alucinación en la estructuración: regla anti-invención (prompt + esquema) + detección de sustancia (reutilizada de co-construcción) que rutea inputs sin sustancia a co-construcción en vez de inventar.
- [x] Los seis botones "Sugerir con IA" de B4 (objetivo general, objetivos específicos, metas, metodología, recursos, evaluación) usan IA real con fallback a plantilla.
- [x] La co-construcción pregunta SOLO contexto ciudadano (problema/objetivo/familias/aportes), detecta basura por sustancia, y reconstruye el contexto del expediente (no campos académicos); el aporte entra a "Lo que ya sabemos" (anexo aditivo en casos buenos, sin re-pulir).
- [x] El filtrado no repregunta el contexto ya definido (aspiración/familias/aporte/problema con sustancia); si no falta nada, lo indica.

## 10. Lo que NO hace

- NO toma decisiones finales de derivación (solo sugiere; el coordinador valida).
- NO hace búsqueda semántica sobre tesis (roadmap RAG).
- NO procesa los datos personales del ciudadano.
- NO depende absolutamente de ningún proveedor (fallback + interfaz aislada).
