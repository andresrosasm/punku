# Handoff: PUNKU — Plataforma ciudadana de proyección social (UNCP)

> Paquete de entrega para implementar PUNKU en un codebase real con Claude Code.
> **Stack objetivo recomendado: Next.js + Tailwind CSS** (confirmado por el equipo). Backend sugerido: Supabase (o el que prefieran), compatible con el sistema ADESA de la UNCP.

---

## 1. Overview

**PUNKU** ("puerta" en quechua) es una plataforma que permite a comunidades campesinas, urbanas y gobiernos locales de Huancayo plantear una necesidad a la Universidad Nacional del Centro del Perú (UNCP) **sin viajar ni entender la burocracia**. La persona cuenta qué pasa en su comunidad tocando opciones visuales simples; el sistema lo traduce a una **solicitud formal de proyección social** y le entrega un **código** para seguir su caso.

Tiene **dos caras**:
- **Cara ciudadana (móvil, cálida)** — flujo de ingesta tipo árbol de decisiones + consulta de estado por código. Es lo más importante: define la percepción de "fricción cero".
- **Cara interna / CRM (escritorio, sobria)** — el "Coordinador de enlace territorial" de la UNCP ve, clasifica, deriva y **formaliza** las solicitudes al formato oficial.

El gran diferenciador: **PUNKU es traductor para ambos lados**. Convierte el lenguaje administrativo en algo simple para la comunidad, y a la vez le entrega a la universidad el formato oficial **semi-llenado** (no un papel en blanco).

---

## 2. About the Design Files

Los archivos en `design/` son **referencias de diseño creadas en HTML** (un prototipo React + Babel en el navegador, sin build). **NO son código de producción para copiar tal cual.** Muestran el look & feel, la copy real, las interacciones y el flujo previstos.

La tarea es **recrear estos diseños en Next.js + Tailwind** usando componentes reales, routing, estado y (cuando aplique) llamadas a IA/backend. Usa el HTML como fuente de verdad visual: extrae de ahí colores, tipografía, espaciados, textos y comportamiento.

**Cómo abrir el prototipo:** abre `design/PUNKU - Prototipo.html` en un navegador. Arriba tienes:
- Switch **Ciudadano / Universidad·CRM**
- Toggle de idioma **ES / QU** (quechua)
- Menú **"Pantallas"** para saltar a cualquiera de las 13 vistas (A0–A6, B1–B4).

El prototipo está modularizado para que el mapeo a componentes sea directo:
- `punku-data.jsx` — datos + i18n (categorías, problemas, distritos, estados, expedientes ficticios, strings ES/QU). **Empieza por aquí.**
- `punku-symbol.jsx` — el símbolo de marca (montaña-puerta) y el logo.
- `punku-icons.jsx` — íconos de categoría (SVG) e íconos de UI (SVG trazo).
- `punku-citizen.jsx` — todas las pantallas A0–A6 + controlador de flujo.
- `punku-crm.jsx` — todas las pantallas B1–B4 + gráfico donut.
- `punku-app.jsx` — shell, navegación, marcos de dispositivo.

---

## 3. Fidelity

**Alta fidelidad (hi-fi).** Colores, tipografía, espaciados, copy e interacciones son finales. Recrea la UI **pixel-perfect** con los componentes/librerías del codebase. La única licencia creativa esperada es adaptar a los patrones del stack (p. ej. usar componentes de formulario propios, Recharts para el donut, etc.).

---

## 4. Identidad visual y símbolo

**Símbolo PUNKU = una montaña andina (apu) con una puerta integrada.** La montaña es la tierra viva que protege a la comunidad; la puerta dorada literaliza el nombre ("Punku" = puerta) y la narrativa "la universidad abre su puerta al territorio". **Sin mascota ni personaje.** Limpio, simbólico, digno.

- Está dibujado como SVG geométrico en `punku-symbol.jsx` (`<MountainDoor>`), con tres variantes: `mark` (logo pequeño), `hero` (bienvenida, con halo) y `open` (el "momento mágico"). Reutilízalo como componente SVG.
- **Momento mágico (pantalla A4):** la hoja de la puerta gira y se abre revelando una luz dorada (`transform: perspective(180px) rotateY(-78deg)`, transición `1.1s cubic-bezier(.22,1,.36,1)`), el halo y el "spill" de luz suben de opacidad. Se dispara ~350ms después de montar la pantalla. Respeta `prefers-reduced-motion` (deja la puerta abierta/estática).

---

## 5. Design Tokens

### Colores (exactos)
```
/* Tierra / fondo cálido */
--sand-50:#FBF8F2;  --sand-100:#F4ECDD;  --sand-200:#EADAC4;  --sand-300:#DEC8A8;
--ink:#23201A;  --ink-70:#5C5347;  --ink-50:#8B8275;

/* Verde naturaleza/territorio (primario ciudadano) */
--green-800:#234E3A; --green-700:#2E6B4E; --green-600:#357A58; --green-500:#4A9B72;
--green-300:#9AD0B2; --green-100:#DCEEE3; --green-50:#EDF6F0;

/* Terracota / ocre andino */
--terra-700:#9A4A2C; --terra-600:#B65A36; --terra-500:#C56B3F; --terra-300:#E7AC8A;
--terra-100:#F6E2D5; --terra-50:#FBEFE7;

/* Dorado luminoso (la puerta / acento) */
--gold-600:#D08E2A; --gold-500:#E8A13C; --gold-400:#F4B954; --gold-300:#F9CE7C;
--gold-200:#FBE6BC; --gold-100:#FDF3DD;

/* Emergencia (rojo serio) */
--red-700:#8F2A20; --red-600:#B23A2E; --red-500:#C84A3C; --red-100:#F6DAD4; --red-50:#FBEAE6;

/* CRM neutro (más sobrio, fresco) */
--slate-50:#F7F8F8; --slate-100:#EDF0F0; --slate-200:#DCE2E2; --slate-300:#C3CCCC;
--slate-400:#9AA5A4; --slate-500:#6B7675; --slate-600:#4E5857; --slate-700:#36403F; --slate-900:#1A211F;
```
Colores por categoría (ícono + tinte de fondo):
```
agro   #357A58 / tint #DCEEE3      salud  #B23A2E / tint #F6DAD4
educ   #C56B3F / tint #F6E2D5      agua   #2F7E9C / tint #D8ECF2
cultura#8A5BB0 / tint #EBDFF5      infra  #C99A2E / tint #FBE6BC
```
Colores por estado (pill + punto del donut): recibido `#4A78B8` (bg #E8EEF6), revisión `#E8A13C` (bg #FBE6BC), derivado `#8A5BB0` (bg #EBDFF5), atendido `#357A58` (bg #DCEEE3), cerrado `#8A9594` (bg #E7EAEA).

### Tipografía
- **Sora** (Google Fonts): titulares, números, etiquetas, botones. Pesos 400/500/600/700/800. `letter-spacing: -0.02em` en h1–h4.
- **Inter** (Google Fonts): cuerpo, inputs, descripciones. Pesos 400/500/600/700.
- Escala móvil ciudadana: h1 ~25–27px/1.15; cuerpo 14.5–16px/1.5. CRM: h2 21–22px; cuerpo 13–14px.

### Radios, sombras, espaciado
```
--radius:18px; --radius-lg:26px;     /* botones 14–16px; cards 14–20px; pills 999px; teléfono 54px */
--shadow-sm:0 1px 2px rgba(35,32,26,.06), 0 2px 8px rgba(35,32,26,.05);
--shadow-md:0 6px 20px rgba(35,32,26,.10), 0 2px 6px rgba(35,32,26,.06);
--shadow-lg:0 18px 50px rgba(35,32,26,.16), 0 6px 18px rgba(35,32,26,.08);
```
Fondo de página: capa de dos `radial-gradient` muy suaves (verde arriba-izq, terracota arriba-der) sobre `--sand-50`. Ver `body` en el HTML.

---

## 6. Principios de UX (no negociables)

1. **Cara ciudadana = una pantalla, una pregunta corta, botones con ícono para TOCAR.** El texto libre y el audio son siempre la salida *opcional*, nunca la entrada principal.
2. **Sin login** en la cara ciudadana. Fricción cero.
3. **Datos de contacto NUNCA van a la IA** y se guardan separados, ligados solo por el código. Solo el rol Coordinador los ve (vía backend).
4. **Accesibilidad WCAG 2.2 AA:** alto contraste, texto grande, botones grandes con **ícono + texto** (nunca solo ícono), navegable por teclado, HTML semántico.
5. **Degradación elegante:** si la IA falla, se clasifica por la categoría del árbol (reglas) y el flujo NO se cae.
6. **Bilingüe ES/QU** con estructura i18n lista para más lenguas (ver §10).

---

## 7. Screens / Views — Cara ciudadana (móvil, 390px de ancho)

Todas viven dentro de un marco de teléfono. Barra de progreso reutilizable (`StepShell`): pista `--sand-200` de 9px, relleno con degradado `--green-500→--green-700`, etiqueta "Paso X de 5" con ícono sparkle. Botón "atrás" (flecha) a la izquierda de la barra. Transición de entrada: `translateY(10px)→0` en 0.45s (no animar opacidad — ver §11).

### A0 · Bienvenida (`Welcome`)
- **Propósito:** entrada cálida + elegir modo + elegir flujo normal o emergencia.
- **Layout:** centrado. Símbolo `hero` (132px) arriba, eyebrow en terracota (`Allinllachu`/"Bienvenido a PUNKU"), h1 "Cuéntanos qué está pasando en tu comunidad.", subtítulo gris.
- **Toggle facilitador** (card blanca, 2 botones): "Registro mi comunidad" / "Ayudo a registrar a otra". Activo: fondo `--green-50`, texto `--green-800`, ring `--green-300`.
- **Botones grandes (full width, 18px, Sora 600):** `PUNKU` Empezar (verde, sombra verde) → árbol; `PUNKU Emergencias` (rojo) → A6. Hint pequeño debajo.
- Link "Ya tengo un código" (search) → A5.

### A1 · Árbol de decisiones (4 sub-pasos)
- **Paso A — `StepA` (1/5) "¿De qué se trata?":** grid 2 columnas de 6 **cards de categoría** (`cat-card`): ícono ilustrado (58px, sobre tinte de categoría) + label Sora 600. Hover: `translateY(-3px)`, borde del color de categoría.
- **Paso B — `StepB` (2/5) "¿Qué está pasando?":** chip de categoría arriba; luego **lista de opciones** (`opt-row`): **emoji grande (26px) + texto + flecha**. 5 opciones por categoría (4 + "➕ Otra cosa"). Hover: `translateX(3px)`, borde de categoría. Emojis exactos en `punku-data.jsx` (`PROBLEMS[cat].ic`).
- **Paso C — `StepC` (3/5) "¿Dónde y a quiénes afecta?":** `<select>` de distrito (con ícono pin + chevron) y **stepper de familias** (botones – / +, número grande Sora 800 42px) + chips rápidos [10,30,60,120,200]. Botón "Continuar" deshabilitado sin distrito.
- **Paso D — `StepD` (4/5) "¿Quieres contarnos más?" (opcional):** textarea amable + botón "🎙️ O cuéntalo hablando" (audio, placeholder). Botón Continuar + link "Prefiero no contar más".
- **Paso 5 — `StepGoal` (5/5) "¿Qué quieres lograr?" (opcional):** **tap-first.** Lista de 3 **botones grandes con emoji** (resultados deseados por categoría, `GOAL_OPTS`); al tocar → check verde. Debajo, secundario y pequeño: "✏️ o cuéntalo con tus palabras" (despliega textarea) + "🎙️ hablando". Luego **"¿Es urgente?"** con 3 botones tipo semáforo en fila (🔴 Sí, urgente / 🟡 Este año / 🟢 Puede esperar; seleccionado usa el color como borde+fondo). Continuar + "Prefiero no responder".
  - *Concepto:* la comunidad define el QUÉ y el PARA QUÉ; la universidad pone el CÓMO. Esta respuesta alimenta B4 (objetivo/meta).

### A2 · Datos de contacto (`Contact`)
- **Solo 4 campos:** nombre del representante, comunidad, distrito, teléfono. **NO pedir DNI ni correo.**
- Cada campo: card con ícono verde a la izquierda. Barra de progreso al 100% ("Casi terminamos").
- **Aviso de privacidad** (card verde con ícono escudo): "Tus datos personales se guardan de forma segura y no se comparten. No los usamos para la inteligencia que clasifica tu caso."
- Botón final **dorado** "✨ Enviar mi caso" (deshabilitado hasta completar los 4).

### A3 · Procesando (`Processing`) — momento IA
- Símbolo `hero` con animación "breathe" (scale 1↔1.05, 2.4s). h1 "PUNKU está entendiendo tu caso…". 3 micro-pasos que se completan en cadena ("Leyendo tu caso…" → "Buscando el área…" → "Preparando tu código…"), cada uno con spinner→check. Auto-avanza a A4 tras ~3.3s. *En real: una llamada a IA con la necesidad anonimizada → categoría, urgencia, facultad(es), resumen formal.*

### A4 · Tarjeta de Reconocimiento (`Recognition`) — **la pantalla más importante**
- **NO dice "solicitud enviada".** Dice, con dignidad: **"Tu comunidad ya fue escuchada"** + "Te abrimos la puerta. Tu necesidad ya entró a la UNCP."
- Fondo se "enciende" (radial dorado suave). Símbolo `open` (140px) con la **puerta que se abre e ilumina**.
- **Card de código** (degradado a `--gold-100`, borde dorado): "TU CÓDIGO" + `PUNKU-2026-001` (Sora 800 27px) + botón "Copiar código" (→ "¡Copiado!" con check, usa `navigator.clipboard`).
- **Filas:** Área sugerida (con ícono de categoría, en verde — *muestra la inteligencia del sistema*), Estado (Recibido, con punto verde pulsante), A quiénes ayuda (N familias), Próximo paso (Clasificación institucional).
- Bloque "Tu necesidad" (resumen en lenguaje claro, entre comillas).
- Botón verde "Consultar mi caso" → A5. Si viene de Emergencias, muestra pill "URGENTE".

### A5 · Consulta de estado (`Track`)
- Input de código (search) + botón "Ver mi caso" (deshabilitado sin código) + link "Perdí mi código".
- Al consultar: card con código + comunidad/distrito, y **timeline vertical de 5 estados** (Recibido → En revisión → Derivado → Atendido → Cerrado). Estados pasados = punto verde con check; actual = punto dorado + label "Ahora" + punto pulsante; futuros = gris. **Cada estado en lenguaje ciudadano cálido** (ej. "En revisión" = "La universidad está viendo a qué facultad corresponde"). Textos en `ESTADOS[].czEs/czQu`.

### A6 · PUNKU Emergencias (`Emergency`)
- **Tono sobrio**, no lúdico. Cabecera roja (degradado) con ícono de alerta. Formulario corto: ¿Qué pasó? (textarea) · ¿Dónde? · ¿A quiénes afecta? · ¿Cómo te llamamos? · botón "Agregar una foto (opcional)". Botón rojo "Enviar emergencia" → A3 → A4 marcada **URGENTE** (`urgencia=alta`, código `PUNKU-2026-015`).

---

## 8. Screens / Views — Cara interna / CRM (escritorio, en ventana de navegador ~1180px)

Layout: **rail izquierdo (230px)** + main. Rail: logo, nav (Bandeja territorial / Tablero resumen), pie con avatar "Coordinador de enlace · Proyección Social · UNCP". Neutro slate + acento verde.

### B1 · Bandeja territorial (`Bandeja`)
- Header: título + "7 solicitudes…" + buscador (comunidad/código).
- **Filtros** (segmentados): Estado (Todos + 5 estados), Urgencia (Todas/Alta/Media/Baja). Botón "Exportar CSV".
- **Tabla** (grid 6 col: Código · Comunidad/Distrito · Categoría · Urgencia · Estado · Fecha). Código en mono (Sora). Categoría: mini-ícono + nombre corto. Urgencia: tag (Alta roja / Media dorada / Baja gris). Estado: **pill de color**. **Las emergencias (urgencia alta) se ordenan arriba** y llevan acento rojo a la izquierda (`box-shadow: inset 3px 0 0 --red-600`). Fila clicable → B2.

### B2 · Detalle del expediente (`Detalle`)
- Back "Volver a la bandeja". Header: mini-ícono de categoría + código (mono) + tags (urgencia, estado, canal) + **título** + comunidad·distrito·fecha.
- **Columna izquierda:**
  - Card "Resumen formal · generado por IA": párrafo + barra de **Confianza de la IA** (%) + nota "Clasificado sin datos personales. Si la IA falla, se usa la categoría del árbol."
  - Card "Clasificación territorial": KV grid (Área sugerida, Modalidad, Familias afectadas, Canal de origen) + chips de **Facultades sugeridas**.
  - Card "Datos de contacto": **protegidos**; botón "Mostrar" los revela (dato ficticio). *En real: solo el rol coordinador, vía backend.*
- **Columna derecha (acciones):**
  - **Botón CTA verde "Armar solicitud de proyección social"** → abre B4.
  - Card "Estado del caso": **state-rail** (5 estados) + botón "Avanzar a '<siguiente>'" (cambio en 1 clic, muestra toast "…El ciudadano ya lo ve") + textarea de nota opcional.
  - Card "Derivar": `<select>` de destino (facultad o "Otra entidad (ONG/Gob. regional)") + botón "Derivar a este destino" (pone estado=derivado).
  - Nota: "Cada cambio aquí se refleja al instante en la consulta del ciudadano por su código." **(Este es el puente clave: el cambio de estado en CRM debe reflejarse en A5.)**

> **ESTADO DE IMPLEMENTACIÓN (el código entregado evolucionó este prototipo):** la columna de acciones del detalle se rediseñó como **recorrido guiado lineal** — un **stepper horizontal** (Recibido→En revisión→Derivado→Atendido→Cerrado) + **una sola acción principal por estado**, ocultando las demás. Se eliminaron los botones sueltos ("Avanzar", "Derivar a este destino", "Enviar a la facultad"): "Derivar" abre el modal de correo y, al confirmar, pasa a *Derivado* en un gesto (derivar = notificar). Se añadió el botón "Contactar por WhatsApp" en la tarjeta de contacto. La fuente de verdad de este comportamiento es la **spec 04 (§4 Vista 2)**; este prototipo conserva el diseño visual original.

### B4 · Completar solicitud de proyección social (`Solicitud`) — **el otro lado del traductor**
Se llega desde B2 ("Armar solicitud"). Mapea al **formato oficial UNCP** (ver `reference/lineamientos-UNCP-2026.pdf`, "ESTRUCTURA DEL PROYECTO" I–X). Dos bloques lado a lado:
- **Izquierda — "Lo que ya sabemos" (verde, SOLO LECTURA):** Título (con contador máx. 15 palabras), Lugar de ejecución, Población beneficiaria, **Descripción del problema** (resumen IA), **Resultado que espera la comunidad (en sus palabras)** ← viene del Paso 5 ciudadano, **Área de proyección social** (Extensión Universitaria / Intervención Tecnológica / Imagen Institucional — sugerida por IA), **Modalidad** (Monovalente/Polivalente — se deduce del nº de facultades), Facultad(es) sugerida(s), **ODS sugerido** (deducido por categoría) y **Justificación inicial** (generada).
- **Derecha — "Completa para formalizar" (naranja, CAJAS REALES EDITABLES):** Objetivo general (textarea + **"✨ Sugerir con IA"**), Objetivos específicos (+ IA), Metas (textarea), Metodología (textarea), **Cronograma** (date inicio/fin, pre-cargados 2026-05-11 / 2026-12-28), Recursos (textarea), Presupuesto S/ (number), Docente responsable (text), **Estudiantes participantes** (lista editable: Apellidos y Nombres · DNI · Código, con agregar/quitar), Evaluación y monitoreo (+ IA).
  - Los botones **"✨ Sugerir con IA"** proponen texto a partir de la necesidad/aspiración y el humano lo edita (son de apoyo, opcionales — siempre se puede escribir directo).
- **Pie:** nota "Las firmas (Dir. de Proyección Social, Decano y representante comunal) se completan al imprimir el documento". Botón principal **"Generar solicitud completa (PDF formato UNCP)"** (abre documento imprimible con la estructura oficial) + secundario "Guardar borrador".

> **ESTADO DE IMPLEMENTACIÓN:** el encabezado del bloque editable dice "Completa para formalizar — lo redacta la UNCP con apoyo de IA". Los cuatro botones "✨ Sugerir con IA" usan **IA real** (Claude Haiku) con fallback a plantilla. Se añadieron **barra de progreso** ("Formato oficial completo al X%"), **campos pendientes** resaltados con pills "PENDIENTE" + resumen "Faltan N campos", y aviso ámbar si el expediente tiene `datos_incompletos`. "Guardar borrador" **persiste en Supabase** (tabla `borradores_b4`, 1:1) y el formulario se hidrata desde la BD; el mismo borrador alimenta el PDF y el correo. Fuente de verdad: **spec 04 (§4 Vista 4)** y **spec 02**.

### B3 · Tablero resumen (`Tablero`)
- 4 stat cards: Necesidades registradas (hero verde), Atendidas o derivadas (con anillo de progreso), Emergencias activas, Distritos alcanzados.
- **"Por estado": gráfico DONUT** (SVG, partes de un todo) con total al centro + leyenda (color · conteo · %).
- **"Por área": barras horizontales** (ranking por categoría).
  - *En producción puede usarse Recharts/visx; el patrón actual es SVG puro sin dependencias.*

---

## 9. Interactions & Behavior

- **Navegación ciudadana:** máquina de estados simple (`screen`): welcome → stepA → stepB → stepC → stepD → goal → contact → processing → recognition → track. Emergencias: welcome → emergency → processing → recognition. Cada selección autocompleta campos por detrás.
- **Animaciones:** entrada de pantalla `translateY` 0.45s; puerta A4 1.1s; "breathe" del símbolo en A3; punto pulsante en estado actual; hover de cards (translate + borde de color). **Respetar `prefers-reduced-motion`.**
- **Copiar código** (A4): `navigator.clipboard.writeText`.
- **Generar PDF** (B4 y export): el prototipo abre `window.open` + `document.write(html)` + `print()`. En producción, generar el PDF server-side con plantilla del formato UNCP.
- **Cambio de estado (B2)** debe propagarse a la consulta ciudadana (A5) — es el cierre del dolor "no sé si avanzó mi trámite".
- **Validación:** botones de continuar deshabilitados hasta tener lo mínimo (distrito en C; 4 campos en contacto; código en track; qué/dónde/contacto en emergencia).

## 10. State Management & i18n

- **Ciudadano:** `mode` (self/other), `cat`, `problem`, `distrito`, `familias`, `detalle`, `aspiracion`, `aspUrg` (urgencia), `contact{nombre,comunidad,distrito,tel}`, `urgent`. Al "enviar" se genera el expediente (código, área=categoría, familias, resumen, aspiración).
- **CRM:** `view` (bandeja/detalle/solicitud/tablero), `sel` (expediente). En B2: `estado`, `nota`, `destino`, `revealed`. En B4: el formulario completo + `estudiantes[]`.
- **i18n:** `STR = { es:{...}, qu:{...} }` con helper `t(key, lang, vars)` (fallback a ES). Quechua = **Waylla Wanka (Quechua Central, Huancayo)** — ver nota abajo. Estructura lista para añadir lenguas (agregar una clave de idioma). Recomendado migrar a `next-intl` o `i18next` con estos diccionarios como semilla.

> ⚠️ **Quechua — validar antes del piloto.** Las cadenas `qu` son un **borrador informado** hacia Waylla Wanka (rasgos aplicados: /r/→/l/, runa→nuna, rimay→limay, simi→shimi, hamuy→shamuy, 1ª persona por alargamiento vocálico), basado en la Gramática/Diccionario Junín-Huanca de Cerrón-Palomino y recursos MINEDU. **Morfología fina (lenición de /q/, alargamiento vocálico completo) debe ser validada por un hablante nativo** antes del piloto — el jurado incluye representantes de las comunidades.

## 11. Notas técnicas de implementación (aprendizajes del prototipo)

- **No ocultar contenido detrás de animaciones de entrada.** El estado base debe ser visible; animar solo *desde* oculto cuando la pantalla está activa, gateado por `prefers-reduced-motion`. (En el prototipo, animar opacidad desde 0 con fill-mode dejaba el contenido invisible si el frame se congelaba.) Las entradas animan **transform**, no opacidad.
- **Slides/fixed-size no aplican aquí** — es UI responsiva normal. El móvil ciudadano se diseñó a 390px; el CRM a ~1180px.
- **Marcos de dispositivo** (teléfono, ventana de navegador) son solo del prototipo de presentación — **no** se implementan en producción.

## 12. Assets

- **Fuentes:** Sora + Inter (Google Fonts). En Next.js usar `next/font/google`.
- **Símbolo de marca:** `<MountainDoor>` (SVG en `punku-symbol.jsx`) — portar como componente SVG/React. Tres variantes (mark/hero/open).
- **Íconos de categoría:** SVG simples a color en `punku-icons.jsx` (`CatGlyph`). **Íconos de UI:** SVG de trazo (`I.*`) — pueden reemplazarse por `lucide-react` (equivalentes: arrow-right, check, copy, phone, map-pin, clock, users, shield, alert-triangle, camera, mic, search, chevron-down, filter, sparkles, arrow-up-right, send).
- **Emojis** en opciones del Paso B y resultados del Paso 5: son parte del diseño (ver `PROBLEMS[].ic` y `GOAL_OPTS`).
- **Documento oficial UNCP:** `reference/lineamientos-UNCP-2026.pdf` — fuente del formato de B4.
- **Datos 100% ficticios** (Genaro, comunidades, números) — requisito de la declaración jurada del concurso. No usar datos reales.

## 13. Files

```
design/
  PUNKU - Prototipo.html   ← abrir esto; contiene todo el CSS/tokens en <style>
  punku-data.jsx           ← datos + i18n (empezar aquí)
  punku-symbol.jsx         ← símbolo montaña-puerta + logo
  punku-icons.jsx          ← íconos categoría (CatGlyph) + UI (I.*)
  punku-citizen.jsx        ← pantallas A0–A6 + flujo
  punku-crm.jsx            ← pantallas B1–B4 + donut
  punku-app.jsx            ← shell, navegación, marcos
reference/
  lineamientos-UNCP-2026.pdf  ← formato oficial del proyecto (base de B4)
```

## 14. Alcance y restricciones (del desafío)

- **SÍ:** centralizar info de servicios; orientar dónde/cómo presentar; registrar y dar **seguimiento** virtual; reducir tiempos.
- **NO:** soluciones de alto costo; reemplazar el proceso formal de aprobación/ejecución de la UNCP; flujo completo de derivación externa (solo se marca). Debe ser **compatible con el sistema ADESA** y respetar los canales de la universidad.
- **MVP:** prototipo funcional / mockup navegable. Construible con humano + IA en ~8h sobre Next.js + Tailwind. Sin librerías raras ni 3D pesado.
