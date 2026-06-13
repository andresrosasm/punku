# HANDOFF / ORQUESTACIÓN — Construcción de PUNKU con Claude Code

> Instrucción maestra para construir el MVP de PUNKU. Léela primero. Tu PRIMERA tarea es organizar el proyecto profesionalmente (paso 1); luego construir.

---

## 0. Qué es PUNKU (una línea)

PUNKU ("puerta" en quechua) es una plataforma ciudadana para que comunidades de Huancayo planteen necesidades a la Universidad Nacional del Centro del Perú (UNCP) sin viajar ni entender la burocracia. Dos caras: ciudadana (móvil, cálida) y CRM interno (escritorio). Entrega: hoy, hackatón GovTech.

## 1. PRIMERA TAREA — Organizar el proyecto profesionalmente

Antes de codear, organiza los archivos de documentación que ya existen en el proyecto en una estructura limpia y estándar. Hoy hay grupos sueltos:
- `design_handoff_punku/` — paquete de Claude Design: `design/` (los `.jsx` + `PUNKU - Prototipo.html`), `reference/` (lineamientos-UNCP-2026.pdf), y su `README.md` (handoff visual).
- `specs/` — las 7 specs técnicas (00–06).
- Este archivo (`HANDOFF_Claude_Code.md`).

Reorganízalos en una estructura profesional de documentación (sugerencia, ajusta a tus convenciones):
```
docs/
  specs/        ← las 7 specs (00–06) + este HANDOFF
  design/       ← el README de Design + los .jsx + el .html
reference/      ← lineamientos-UNCP-2026.pdf
```
Crea un `README.md` raíz que sea la puerta de entrada (qué es PUNKU, stack, orden de lectura). Luego procede a construir en la raíz del proyecto según tus convenciones de Next.js.

### Estructura de rutas (URL única con selección de rol)

La entrega exige **un solo enlace público**. Por eso la raíz NO es la cara ciudadana: es una **pantalla-puerta** que enruta por rol. Ambas caras viven bajo el mismo dominio, mismo deploy, misma base Supabase.

```
app/
  page.tsx              ← LA PUERTA · URL única de entrega · selección de rol
  comunidad/page.tsx    ← cara ciudadana (flujo completo de registro y consulta)
  panel/page.tsx        ← CRM institucional (login simbólico)
```

- La pantalla-puerta es una bienvenida breve y deliberada (refuerza el nombre: PUNKU = "puerta"): símbolo montaña-puerta, una línea de concepto ("La puerta que escucha al territorio"), y **dos accesos** con ícono + subtítulo de una frase: **"Soy líder de comunidad"** → `/comunidad`, y **"Soy de la UNCP"** → `/panel`.
- **La trazabilidad NO cambia:** ambas caras siguen leyendo/escribiendo el mismo expediente en Supabase. La puerta solo enruta; no toca datos ni lógica.
- Durante la demo en vivo, deja un acceso discreto en el header para saltar entre caras sin volver a la puerta; pero el flujo limpio para el jurado siempre empieza en la puerta (`/`).

## 2. Las dos fuentes de verdad y quién manda en qué

| Fuente | Qué es | Manda en |
|---|---|---|
| **README de Claude Design** + el prototipo `.jsx`/`.html` | Paquete visual de diseño | TODO lo VISUAL: design tokens (colores, tipografía), las 13 pantallas, copy, animaciones, estado del front, i18n, símbolo montaña-puerta |
| **Specs 00–06** | Documentación técnica | TODO lo de DATOS, LÓGICA y SEGURIDAD: esquema de BD, flujo de creación, motor IA, fallback, RLS, secretos, alcance |

**Regla de conflicto:** duda VISUAL → manda el README de Design. Duda de DATOS/LÓGICA/SEGURIDAD → mandan las specs. No se contradicen; cubren capas distintas. Este HANDOFF es el puente entre ambas.

## 3. Orden de lectura recomendado

1. `00_contexto_proyecto.md` — el qué y el por qué.
2. El README de Claude Design + abrir `PUNKU - Prototipo.html` en el navegador.
3. `02_modelo_datos.md` — el esquema de la BD.
4. `01, 03, 04, 05, 06` — ingesta, motor IA, CRM, arquitectura, seguridad.
5. `lineamientos-UNCP-2026.pdf` — formato oficial (base de la pantalla B4).

## 4. Regla de oro: construir en orden de valor decreciente

Si el tiempo se acaba, lo construido primero ya debe ser demo ganadora:
0. **Pantalla-puerta** (`app/page.tsx`): selección de rol. Es la URL única de entrega. **Prioridad de routing alta** (reserva las rutas `/comunidad` y `/panel` desde el inicio) pero **prioridad de construcción baja**: arma la puerta al final, cuando ambas caras ya existen y hay a dónde derivar. Es liviana (media hora).
1. **Flujo ciudadano end-to-end** (necesidad → IA → expediente → código → tarjeta → consulta de estado), en `/comunidad`. Esto SOLO ya gana.
2. **CRM básico** (bandeja + detalle + cambio de estado que se refleja en la consulta ciudadana), en `/panel`.
3. **B4 — Completar solicitud** (traductor de salida al formato UNCP).
4. **Diferenciadores** (emergencias, toggle facilitador, tablero).

Si el reloj aprieta, detente en lo completo y funcionando. Demo parcial sólida > todo a medias.

## 5. El puente que aportan las specs (y el README de Design NO): persistencia

El README de Design describe el ESTADO DEL FRONT (`cat`, `problem`, `aspiracion`, etc.), pero NO cómo se guarda en la base de datos. Mapeo del estado del front → columnas de `expedientes` (spec 02):

| Estado en el front (README de Design §10) | Columna en BD (spec 02) |
|---|---|
| `cat` (categoría) | → alimenta `categoria` vía IA |
| `problem` | parte de `necesidad_texto` |
| `distrito` | `distrito` |
| `familias` | `familias_afectadas` |
| `detalle` (texto/audio) | `necesidad_texto` |
| foto opcional | `foto_url` |
| `aspiracion` (qué quiere lograr) | `resultado_deseado` |
| `aspUrg` (urgencia ciudadana) | `urgencia_ciudadana` |
| `mode` (self/other) | `origen_registro` |
| `urgent` (emergencia) | `urgencia` = alta, `canal_origen` = emergencias |
| `contact{nombre, tel}` | tabla `contactos` (SEPARADA — nunca a la IA) |
| `contact{comunidad}` | `expedientes.comunidad` |
| (IA deduce) | `categoria, modalidad, urgencia, facultades_sugeridas, ods_sugerido, resumen_formal, objetivo_sugerido, meta_sugerida, confianza, clasificado_por` |

Verifica este mapeo al implementar el POST de creación. Es lo que hace que las solicitudes se creen correctas y que B4 llegue semi-lleno.

## 6. El flujo de creación server-side (spec 03 y 05)

Al "Enviar mi caso", una API route server-side:
1. Arma input anonimizado (área, qué pasa, distrito, familias, aspiración, urgencia, relato) — SIN datos personales.
2. Llama `estructurarNecesidad(input)` — interfaz ÚNICA y AISLADA al motor IA. Una llamada, timeout 10s, JSON validado contra esquema.
   - Si falla/timeout/sin saldo → **fallback a reglas**. El expediente se crea igual (`clasificado_por: "reglas"`). La demo NUNCA se cae.
3. Genera código `PUNKU-2026-NNN`.
4. Guarda Expediente (no sensible) + Contacto (sensible, tabla aparte) + primer `estados_historial` = "Recibido".
5. Devuelve al front solo lo de la Tarjeta de Reconocimiento (código, área, resumen, familias) — NUNCA el contacto.

**ODS:** la IA asigna el ODS con el mapeo oficial ODS-Facultad (tabla `ods_facultad`, spec 02). No inventar ODS.

## 7. Seguridad — CRÍTICO para el repo público (spec 06)

Las 6 reglas de oro:
1. `.gitignore` excluye `.env`, `.env.local`, `node_modules`, `.vercel` desde el primer commit.
2. service_role de Supabase + API key de IA SOLO en API routes (server-side), nunca en front.
3. RLS activado en todas las tablas; `contactos` solo accesible por rol interno.
4. `.gitignore` validado antes del primer push.
5. Ninguna llave en el código, ni una vez (git recuerda el historial).
6. `git status` revisado antes de cada push.
7. **Acceso al panel:** como `/panel` es alcanzable desde la puerta pública, va detrás de un **login simbólico** (usuario/clave de muestra, p. ej. `coordinador / demo2026`) o, en su defecto, rotulado visiblemente como "vista institucional — demo". Esto refuerza el control de acceso a la tabla `contactos` (datos sensibles) y suma al criterio de ética digital (20%).

Entregar: `.env.example` (nombres sin valores), README de instalación, licencia MIT.

## 8. Detalles que el prototipo deja para producción

- **Generación de PDF (B4):** el prototipo usa `window.print()`; en producción, generar server-side con plantilla del formato oficial UNCP (ver reference/).
- **Datos de contacto:** en el prototipo se revelan con botón; en real, solo rol coordinador vía backend con service_role.
- **Donut/barras del tablero:** prototipo en SVG puro; puede migrarse a Recharts.
- **Ícono oficial del ODS** en B4: cargar los íconos oficiales de los 17 ODS (uso libre ONU).
- **Marcos de dispositivo** (teléfono/ventana): solo del prototipo, NO en producción.
- **i18n quechua:** las cadenas `qu` son borrador (Waylla Wanka); validar con hablante nativo antes del piloto. Demo en español.
- **Datos 100% FICTICIOS** siempre (declaración jurada). Cargar ~7 expedientes ficticios para poblar bandeja/tablero.
- **Bocas de entrada adicionales (ROADMAP — NO construir):** el MVP tiene UNA entrada real (la web conversacional de `/comunidad`, con el toggle facilitador `self/other` y la ruta de emergencia adentro). El concepto de "una puerta lógica, muchas bocas" se menciona en el pitch como evolución futura: la misma API de creación de expedientes podrá recibir, mañana, entradas por **WhatsApp Business**, **correo** (conversión a expediente) o **mesa de partes**. NO se construyen este fin de semana; se nombran como capacidad de la arquitectura (nuevos puntos de entrada que llaman al mismo motor). Mantener el alcance honesto: una boca real, las demás como roadmap.

## 9. Definition of Done (spec 00)

- [ ] Proyecto organizado profesionalmente (docs/ + reference/ + README raíz).
- [ ] **Pantalla-puerta (`/`) enruta por rol a `/comunidad` y `/panel`.**
- [ ] Flujo ciudadano completo end-to-end (en `/comunidad`).
- [ ] CRM (bandeja + estado + historial); el cambio de estado se refleja en la consulta ciudadana (A5).
- [ ] **Panel (`/panel`) con login simbólico o rótulo "vista institucional — demo".**
- [ ] B4 genera el borrador en formato UNCP.
- [ ] IA con fallback operativo (demo no se cae).
- [ ] Datos ficticios cargados.
- [ ] Desplegado en Vercel: **URL pública única que enruta a ambas caras** (es el enlace de la ficha de entregables).
- [ ] Repo público sin secretos (checklist pasado), README + .env.example + MIT.

## 10. Recordatorios

- PUNKU capta y traduce; NO reemplaza la formalización ni toca ADESA (compatible vía exportación, no integración).
- La demo NUNCA depende de que la IA responda (fallback siempre).
- Construye el flujo ciudadano primero, prueba end-to-end, y despliega temprano.
- Respeta `prefers-reduced-motion` en las animaciones (ver README de Design).
