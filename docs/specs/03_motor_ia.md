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

## 6.ter Sugerencias de IA en B4 (segunda capacidad, on-demand — construido)

Además de la estructuración al crear (una sola llamada), el motor expone una capacidad **separada y bajo demanda** para el CRM: `sugerirCampoB4(expediente, campo)`. Desde B4 (spec 04), cada botón "✨ Sugerir con IA" dispara una llamada que redacta el campo académico pedido a partir del contexto del expediente. Son **cuatro campos**: objetivo general, objetivos específicos, metas, evaluación/indicadores.

- Es IA **real** (Claude Haiku, server-side, sesión de coordinador requerida), con **fallback a plantilla** (`plantillaB4`) si la IA falla.
- No contradice el principio de "una sola llamada" de §3: aquella aplica a la **creación** del expediente; estas son acciones explícitas y opcionales del coordinador dentro del CRM, una por clic.

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
- [x] Los cuatro botones "Sugerir con IA" de B4 usan IA real con fallback a plantilla.

## 10. Lo que NO hace

- NO toma decisiones finales de derivación (solo sugiere; el coordinador valida).
- NO hace búsqueda semántica sobre tesis (roadmap RAG).
- NO procesa los datos personales del ciudadano.
- NO depende absolutamente de ningún proveedor (fallback + interfaz aislada).
