# Handoff — Update diferencial: **B4 rediseñado + Co-construcción WhatsApp**

> Para Claude Code. Este paquete documenta **solo lo nuevo/cambiado** respecto a la app PUNKU actual (Next.js + Supabase + Claude Haiku), para que apliques un **update diferencial** sin rehacer lo que ya funciona.

---

## 0. Qué es este bundle (léelo primero)

- Los archivos en `design/` son **referencias de diseño hechas en HTML/JSX (React + Babel en navegador)**. **No son código de producción para copiar tal cual.** Son el prototipo que muestra el look & feel y el comportamiento deseado.
- Tu tarea: **recrear estos cambios en la app real** (Next.js, con sus componentes, Tailwind/CSS-in-JS o lo que use el repo, y Supabase/Claude reales) siguiendo los patrones existentes del codebase.
- **Fidelidad: ALTA (hi-fi).** Colores, tipografía, spacing y microcopys son finales — respétalos.
- **El flujo guiado del panel YA EXISTE en la app real** (stepper horizontal Recibido→Cerrado, tarjeta "PASO ACTUAL" con 1 acción por estado, modal de correo al derivar). En el prototipo lo replicamos como *contexto* para poder revisar el recorrido completo. **No lo rediseñes**: úsalo para verificar que el detalle real coincide. Lo realmente NUEVO es lo de las secciones 2–6.

---

## 1. Resumen del diferencial (changelog)

| # | Cambio | Tipo | Archivo de referencia |
|---|--------|------|----------------------|
| 1 | **B4 rediseñado**: jerarquía de acciones, barra de progreso viva, barra de acciones fija (footer sticky), "Volver al expediente" como parte del recorrido | NUEVO/REEMPLAZO | `design/punku-b4.jsx` (`Solicitud`) |
| 2 | **Módulo de co-construcción por WhatsApp** dentro de B4: generar preguntas IA con opciones numeradas → enviar por wa.me → pegar respuesta → interpretar con IA → rellenar campos | NUEVO | `design/punku-b4.jsx` (`WhatsAppModule`) |
| 3 | **Manejo de entrada “basura”** (relato pobre): nunca se rechaza, llega a revisión con confianza baja, flags de "por confirmar/precisar", empuja a co-crear | NUEVO | `punku-crm.jsx` (`Detalle`, `Bandeja`), `punku-b4.jsx`, `punku-data.jsx` |
| 4 | **Persistencia de estado y borrador** entre Detalle ↔ B4 (fix: ya no se reinicia a "Recibido"; el borrador se conserva) | FIX | `punku-crm.jsx` (`CrmApp`, `Detalle`), `punku-b4.jsx` (`Solicitud`) |
| 5 | **Acción “Generar PDF” → “Descargar copia (PDF)”** + microcopy honesto (el PDF se adjunta solo al derivar) | CAMBIO | `punku-b4.jsx` (footer) |
| 6 | **Botones unificados** (sistema `gbtn`) en todo el CRM | CAMBIO | `PUNKU - Prototipo.html` (CSS `.gbtn*`), usados en crm/b4 |

Los datos demo `PUNKU-2026-039` (bien llenado) y `PUNKU-2026-041` (basura) están en `design/punku-data.jsx` — son ejemplos para QA de los dos recorridos, no contenido de producción.

---

## 2. B4 — Pantalla "Completar solicitud de proyección social" (rediseño)

**Componente de referencia:** `Solicitud` en `design/punku-b4.jsx`.
**Problema que resuelve:** B4 antes se sentía desordenada — "Volver al expediente" flotaba suelto arriba, "Guardar borrador / Generar PDF" perdidos abajo, sin jerarquía ni siguiente paso claro.

### 2.1 Estructura (de arriba a abajo)
1. **Crumb de recorrido** (`.b4-crumb`): `← Volver al expediente` + `›` + pill ámbar `Paso 2 de 3 · En revisión` + `Armar la solicitud oficial`. Esto ancla B4 dentro del flujo guiado; el "volver" deja de ser un escape suelto.
2. **Hero** (`.b4-hero`): ícono sparkle + `h2` "Completar solicitud de proyección social" + subtítulo (PUNKU pre-llena verde / la UNCP completa ámbar con IA) + meta a la derecha (código, comunidad·distrito).
3. **Leyenda de 2 colores** (`.b4-legend`): • verde "Lo que ya sabemos — pre-llenado por PUNKU"  • ámbar "Completa para formalizar — lo redacta la UNCP con apoyo de IA".
4. **Barra de progreso viva** (`.b4-progress`): "Formato oficial completo al **X%**" + hint, barra, y línea "Faltan **N** campos: [lista]". Ver §2.3.
5. **Módulo WhatsApp** (full-width, `.wa-card`) — ver §3.
6. **Dos columnas** (`.b4-grid`, `1fr / 1.04fr`):
   - **Izquierda verde** (`.b4-block.pre`): contexto **solo lectura** (título, lugar, beneficiarios, descripción, resultado esperado, área, modalidad, facultades, ODS, justificación). Es CONTEXTO, no acción.
   - **Derecha ámbar** (`.b4-block.fill`): campos **editables** (foco de la acción), cada uno con pill `PENDIENTE` o check ✓ cuando se llena, y botón "Sugerir con IA" (spinner "Generando…") en objetivo general, objetivos específicos, metodología, evaluación.
7. **Barra de acciones FIJA** (`.b4-actionbar`, `position: sticky; bottom: 0`) — ver §2.4.

### 2.2 Jerarquía de foco
- Los campos **ámbar atraen la acción**; los verdes son contexto atenuado. La pantalla guía a "completa lo que falta y guarda".
- Densa pero ordenada: una sola columna editable, agrupación clara, footer fijo siempre visible.

### 2.3 Lógica del progreso (`pct`)
```
base = (calidad === 'pobre') ? 26 : 70   // la comunidad bien-informada llena ~70%
AMBER_FIELDS = [objetivoGen, objetivosEsp, metas, metodologia, recursos,
                presupuesto, docente, estudiantes, evaluacion]  // 9 campos
filledAmber = count(AMBER_FIELDS llenos)
pct = round( base + (filledAmber/9) * (100 - base) )   // llega a 100 al completar los 9
"Faltan N campos: ..." = lista de AMBER_FIELDS vacíos
```
`isFilled('estudiantes')` = existe al menos un estudiante con nombre. Cronograma viene pre-lleno (no cuenta como pendiente). Esto materializa la narrativa Parte 3: **bien llenado arranca en 70%, basura en 26%, y la co-creación cierra la brecha.**

### 2.4 Barra de acciones fija (footer) — jerarquía corregida
Tres salidas, **todas vuelven al expediente en revisión** (B4 es sub-paso de "En revisión"; el estado solo avanza a "Derivado" al derivar de verdad):

| Botón | Estilo | Acción | Microcopy |
|-------|--------|--------|-----------|
| **Guardar borrador y volver** | ghost | Persiste borrador en BD → vuelve al expediente | toast "Borrador guardado. El expediente sigue en revisión." |
| **Descargar copia (PDF)** | ghost | Descarga copia para revisar (no avanza nada) | hint: "El PDF (formato UNCP) se genera y adjunta **solo al derivar**. Aquí descargas una copia para revisar." |
| **Guardar y volver para derivar →** | **primary** | Persiste + marca solicitud lista → vuelve al expediente, la tarjeta PASO pasa a "Deriva a la facultad" | toast "Solicitud lista. Ahora puedes derivar a la facultad." |

> **Importante (cambio honesto):** ya **no** existe "Generar PDF" como acción ambigua. El PDF es automático en la derivación; el botón de B4 es solo descarga de copia. No confundir generar≠derivar.

El `← Volver al expediente` del crumb superior también **guarda el avance** (no descarta) y vuelve a "En revisión".

---

## 3. Módulo de co-construcción por WhatsApp (la pieza central)

**Componente:** `WhatsAppModule` en `design/punku-b4.jsx`. Card full-width verde-WhatsApp (`.wa-card`), colapsable. **Abierto por defecto cuando `calidad === 'pobre'`** (poca info → hay que preguntar).

### 3.1 Concepto
Cuando faltan datos que **solo la comunidad** tiene (su meta real, plazos, aportes) y el ciudadano es rural/baja alfabetización digital: la IA genera **preguntas con opciones numeradas**, el coordinador las manda por WhatsApp, la comunidad responde con números ("1 2 1 2"), y la IA **traduce esas elecciones a texto formal** que completa los campos de B4.

### 3.2 Tres pasos (UI)
1. **"Generar preguntas para el ciudadano"** (botón, spinner "Generando…") → 3–5 preguntas con opciones numeradas, según campos faltantes + contexto del expediente. Se muestran en un preview (`.wa-qbox`).
2. **"Contactar por WhatsApp"** (botón verde) → abre `wa.me/?text=<preguntas pre-armadas>`. En el preview decimos honestamente "sobre el teléfono real del contacto (server-side)".
3. **Textarea "pega la respuesta"** + **"Interpretar respuesta con IA"** (spinner) → mapea números↔preguntas, compone texto formal y **rellena los campos ámbar**; el progreso sube. Muestra resumen `pregunta → respuesta elegida → campo`.

### 3.3 Banco de preguntas (referencia)
`QUESTION_BANK` keyed por categoría. Cada pregunta: `{ field, q, options:[{label, formal}] }` donde `field` = campo de B4 que rellena y `formal` = fragmento formal. Ejemplo (infra/electricidad) en el código. **En producción esto lo genera Claude Haiku** a partir de los campos faltantes + contexto; el banco estático es solo el fallback/demo.

### 3.4 Lógica de interpretación (`interpret`) — replícala
```
nums = extraer todos los enteros del texto pegado, en orden     // "respondo 1, 2, y somos como 15, y 1" → [1,2,15,1]
para cada pregunta i:
   n = nums[i]
   si 1 <= n <= options.length: choice = options[n-1]
   si no (cantidad libre, ej. 15): choice = última opción + anexar "(la comunidad indicó 15)"
   acumular choice.formal por campo
componer texto formal por campo:
   objetivoGen → "Contribuir a que <comunidad> logre <formal>, con acompañamiento técnico y académico de la UNCP, en beneficio de <familias> familias de <distrito>."
   metas       → "Plazo acordado con la comunidad: <formal>. Meta: atender a <familias> familias dentro de ese periodo."
   recursos    → "Aporte de la comunidad: <formal>. La UNCP aporta asesoría técnica y acompañamiento de estudiantes y docente."
   metodologia → "Trabajo participativo por fases (diagnóstico, diseño, ejecución, evaluación). <formal>."
   (otros)     → formal tal cual
setF(updates) ; subir progreso
```
**Esto SÍ es funcional en la demo** (parsing determinista). Maneja respuestas sucias ("respondo 1, 2, y somos como 15").

### 3.5 Rótulo de honestidad (obligatorio)
`.wa-honest`: **"Demo:** pega manualmente la respuesta del ciudadano y la IA la interpreta (esto sí es funcional). En producción, la respuesta llega **automática por WhatsApp Business API** y escribe en la base de datos sin intervención." Mantén esta distinción visible en producción mientras el canal automático sea roadmap.

---

## 4. Recorrido completo + entrada “basura” (Parte 3)

**Principio: nunca se rechaza un pedido.** Hay dos recorridos que convergen en el mismo "punto cero de revisión" pero se ven distintos:

### 4.1 Bien llenado — `PUNKU-2026-039` ("No tenemos buena electricidad")
- `calidad: 'rica'`, `confianza: 75`, relato útil → B4 arranca en **70%**, campos verdes completos, módulo WhatsApp colapsado.

### 4.2 Basura — `PUNKU-2026-041` (relato: "xyz asdfg ayuda porfa no se que poner")
- `calidad: 'pobre'`, `confianza: 31`, `familias: null`, `aspiracion: ''`.
- **Detalle (estado recibido):** tarjeta PASO en variante **ámbar "señal baja"** → título "Llegó con poca información", microcopy "No se rechaza ningún pedido: contáctala para precisar", acción "Empezar revisión y contactar".
- **Resumen IA:** muestra el **relato crudo citado** (`.raw-quote` "Lo que escribió la comunidad: …") + texto honesto de la IA explicando que registró igual el pedido pero faltan datos. Barra de confianza en ámbar.
- **Clasificación:** Área "Por confirmar", Familias "Por estimar" (`.kv-pend`).
- **Bandeja:** chip "Por precisar" en vez de categoría.
- **B4:** arranca en **26%**, campos verdes faltantes resaltados (`.ro-missing` "La comunidad no precisó… confírmalo por WhatsApp"), **módulo WhatsApp abierto por defecto**.
- El círculo se cierra: basura → IA pregunta con opciones → comunidad elige → IA traduce → formulario completo → derivar → trazabilidad.

### 4.3 Tras derivar — verificar info adecuada
El modal de correo (`.mail-modal`) muestra: Para (facultad), Asunto, resumen (distrito, familias, categoría, urgencia, código), **adjuntos PDF + CSV**, y nota honesta de envío simulado. Al confirmar: estado→"Derivado", toast "Derivado a X. Correo enviado (simulación). El ciudadano ya lo ve." Verifica en tu app que estos campos sean los reales que viajan a la facultad.

---

## 5. Estado, navegación y persistencia (FIX clave)

Antes el estado vivía dentro del detalle y se perdía al ir a B4 → al volver se reiniciaba a "Recibido". **Solución:** elevar estado + borrador a un contenedor (en la demo `CrmApp`; en tu app, store/route/DB).

Estado a mantener por expediente (`codigo`):
- `estado` (recibido|revision|derivado|atendido|cerrado) — efectivo = override en memoria/DB sobre `exp.estado`. **La bandeja también lo refleja** (trazabilidad).
- `prepared` (bool) — la solicitud fue marcada lista para derivar.
- `draft` (objeto del formulario B4, incl. lo que rellenó WhatsApp) — se restaura al re-entrar a B4.

Reglas:
- Detalle (revisión) muestra "Continúa la solicitud" + sello "borrador guardado" si hay draft y `!prepared`; muestra "Deriva a la facultad" si `prepared`.
- Las tres salidas de B4 guardan el draft y vuelven a "En revisión". Solo "Guardar y volver para derivar" pone `prepared=true`.
- En Supabase: persistir `draft` y `prepared` en la fila del expediente (o tabla `solicitudes`). El estado del expediente ya debería existir.

---

## 6. Botones unificados (sistema `gbtn`)

Definidos en el `<style>` de `PUNKU - Prototipo.html`. Reemplazan botones sueltos del CRM/dashboard.

| Clase | Uso | Valores |
|-------|-----|---------|
| `.gbtn-primary` | acción principal | bg `#2E6B4E` (`--green-700`), texto #fff, radius 12px, sombra `0 6px 16px rgba(46,107,78,.26)`; hover `#234E3A` |
| `.gbtn-secondary` | secundaria | bg #fff, texto verde-700, borde 1.5px `#9AD0B2` |
| `.gbtn-ghost` | terciaria | bg #fff, texto `--slate-600`, borde 1.5px `--slate-200` |
| `.gbtn-wa` | WhatsApp | bg `#1FA855`, texto #fff |
| `.gbtn-sm` | compacto | font 13px, padding 9×14, radius 10px |
| estado `.busy/.disabled` | opacity .7, sin pointer | |

Tipografía botones: **Sora 600**. Aplicado a: filtros/exportar de bandeja, botones del tablero, acciones de las tarjetas PASO, footer B4, y módulo WhatsApp.

---

## 7. Design tokens nuevos (los demás ya existen en `:root`)

- Verde WhatsApp: `#1FA855` (hover `#178A46`).
- Stepper horizontal: nodo 34px, done `--green-600`, current borde verde + halo `0 0 0 4px var(--green-50)`, línea 2.5px (`--green` cuando on, `--slate-200` off).
- PASO card: verde `border #9AD0B2 / bg linear-gradient(135deg,#F1F8F3,#FBFDFB)`; variante warn `border --gold-300 / bg #FDF6E8→#FFFDF8`.
- Progreso B4: track `--slate-100` 10px, fill `linear-gradient(90deg,--green-500,--green-700)`.
- Footer fijo: `rgba(255,255,255,.94)` + `backdrop-filter: blur(10px)`, borde superior `--slate-200`, sombra `0 -6px 18px rgba(35,32,26,.05)`.
- Pills: `PENDIENTE` (`--gold-200` sobre texto `--gold-600`), check ✓ (`--green-600`), `--kv-pend`/`--ro-missing` en `--gold-600`.
- Spinners IA: `.ai-spin` (ámbar) y `.ai-spin.dark` (verde), 11px, borde 2px, `spin .7s linear`.

Todos los hex exactos están en el `<style>` de `design/PUNKU - Prototipo.html` (secciones comentadas: BOTONES UNIFICADOS, STEPPER HORIZONTAL, TARJETA PASO ACTUAL, MODAL DE CORREO, B4 REDISEÑO, MÓDULO WHATSAPP).

---

## 8. Qué cablear de verdad en producción (Next.js + Supabase + Claude Haiku)

1. **Generar preguntas** (§3.1 paso 1): endpoint server-side → Claude Haiku con prompt = campos faltantes + contexto del expediente → JSON `[{field, q, options:[{label, formal}]}]`. Renderizar igual que `QUESTION_BANK`.
2. **wa.me** (paso 2): construir el `text` server-side con el **teléfono real** del contacto (protegido); el front solo abre el enlace.
3. **Interpretar respuesta** (paso 3): endpoint → Claude Haiku que recibe preguntas generadas + texto pegado → devuelve `updates` por campo (puedes apoyarte en el parser determinista del §3.4 como pre-procesado/validación). Escribir en `draft` (Supabase).
4. **Borrador/estado**: persistir `draft`, `prepared`, `estado` en Supabase; bandeja y consulta ciudadana leen el estado (trazabilidad).
5. **Derivar**: genera PDF (formato UNCP, ver `uncpPrintHtml` como plantilla de campos/orden) + CSV, adjunta y envía el correo a la facultad; cambia estado a "Derivado".
6. **WhatsApp Business API** (roadmap): cuando exista, la respuesta del ciudadano escribe el `draft` directo sin pegar manual — quita el rótulo "Demo".

---

## 9. Archivos en `design/`

| Archivo | Contenido |
|---------|-----------|
| `PUNKU - Prototipo.html` | Shell + **todo el CSS** (tokens + clases nuevas). Abrir aquí para ver el prototipo. |
| `punku-b4.jsx` | **B4 + módulo WhatsApp** (lo más nuevo): `Solicitud`, `WhatsAppModule`, `QUESTION_BANK`, `interpret`, `uncpPrintHtml`, `AMBER_FIELDS`, `SUG`. |
| `punku-crm.jsx` | CRM: `Detalle` guiado (stepper, PASO actual, modal correo), `Bandeja` (estados efectivos + chip "por precisar"), `Tablero`, `CrmApp` (estado/borrador elevados). |
| `punku-data.jsx` | Datos demo incl. `039` (rica) y `041` (basura) + campos `calidad`, `relato`. |
| `punku-icons.jsx` | Íconos nuevos: `whatsapp`, `download`, `wand`, `list`, `eye`, `send`. |
| `punku-app.jsx`, `punku-citizen.jsx`, `punku-symbol.jsx` | Shell/cara ciudadana/logo (contexto, sin cambios relevantes). |

---

## 10. Checklist de implementación

- [ ] B4: crumb de recorrido + hero + leyenda + **progreso vivo** (fórmula §2.3).
- [ ] B4: columna verde solo-lectura vs columna ámbar editable con `PENDIENTE/✓` y "Sugerir con IA".
- [ ] B4: **barra de acciones fija** con los 3 botones y microcopys (§2.4). Quitar "Generar PDF" ambiguo.
- [ ] Módulo WhatsApp: 3 pasos, abierto por defecto si `calidad==='pobre'`, rótulo Demo/Producción.
- [ ] Generar preguntas (Haiku) + wa.me server-side + interpretar (Haiku) que rellena campos.
- [ ] Entrada basura: nunca rechazar, confianza baja, flags "por confirmar/precisar", relato crudo citado, empuje a co-crear.
- [ ] Persistencia: `estado` (refleja en bandeja + consulta ciudadana), `prepared`, `draft` en Supabase; "Volver" no reinicia a Recibido.
- [ ] Botones `gbtn` unificados.

> ¿Quieres screenshots de cada pantalla incluidos en el bundle? No los incluí por defecto — pídemelos y los agrego.
