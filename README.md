# PUNKU — la puerta que escucha al territorio

> **PUNKU** ("puerta" en quechua) es una plataforma ciudadana para que comunidades de
> Huancayo planteen necesidades a la **Universidad Nacional del Centro del Perú (UNCP)**
> sin viajar ni entender la burocracia. Traduce la necesidad de la comunidad a una
> solicitud que la universidad entiende y puede rastrear.
>
> Prototipo para el **Desafío 3 — Hackatón Transformagob 2026** (Lab UNCP Centro).
> Datos **100% ficticios** (declaración jurada del concurso).

## 🔗 Pruébalo

- **Demo en vivo:** https://punku-uncp.vercel.app
- **Acceso al panel UNCP (demo para jurado):** usuario `coordinador` · clave `demo2026`
- **Recomendado:** ver la cara comunidad en móvil, el panel UNCP en escritorio.

---

## Qué hace

Una sola URL pública con **una pantalla-puerta** que enruta por rol a dos caras que
comparten el mismo expediente:

| Ruta | Cara | Para quién |
|---|---|---|
| `/` | **La puerta** — selección de rol | Entrada única de la demo |
| `/comunidad` | **Ciudadana** (móvil, cálida) | Líder de comunidad: cuenta su necesidad por un árbol visual, recibe un código y consulta el estado |
| `/panel` | **CRM institucional** (escritorio) | Coordinador de enlace de la UNCP: bandeja, clasificación, cambio de estado, formato oficial UNCP |

**El flujo clave (dolor #2):** cuando el coordinador cambia el estado en `/panel`, el
ciudadano lo ve al instante al consultar su código en `/comunidad`. Es el mismo expediente.

### Características
- **Árbol de decisiones visual** ciudadano (categoría → problema → dónde → relato → aspiración) + **PUNKU Emergencias** + **toggle facilitador**.
- **Motor de IA aislado** (`lib/ai.ts`): una llamada a Claude (Haiku) estructura la necesidad → JSON validado, **con fallback a reglas** si la IA falla. *La demo nunca se cae.* Evalúa coherencia y marca `datos_incompletos` como **aviso** (nunca bloquea al ciudadano). **Guardia anti-alucinación:** la IA **solo reformula lo que el ciudadano dijo, nunca inventa necesidades**; y **detección de sustancia** — si el pedido llega vacío o ilegible, el sistema **pregunta a la comunidad** (co-construcción) en vez de rellenar con datos falsos.
- **Tarjeta de Reconocimiento** ("Tu comunidad ya fue escuchada") con código de seguimiento.
- **CRM con recorrido guiado**: bandeja con filtros y detalle del expediente como **flujo lineal** (stepper Recibido → En revisión → Derivado → Atendido → Cerrado + una acción principal por estado). **"Derivar" = notificar** a la facultad en un gesto (abre el correo con PDF+CSV adjuntos y pasa a *Derivado*). Botón **"Contactar por WhatsApp"** (teléfono real, server-side). Cada cambio de estado se refleja en la consulta del ciudadano.
- **B4 — formato oficial UNCP** semi-llenado: **seis** botones **"Sugerir con IA"** (objetivo general, objetivos específicos, metas, metodología, recursos, evaluación — IA real con fallback), campos pendientes resaltados, y **persistencia en Supabase** (tabla `borradores_b4`) que alimenta el PDF y el correo.
- **Co-construcción del contexto por WhatsApp** (co-creación, no buzón): cuando el pedido llega pobre o sin sustancia, la IA arma preguntas de **contexto ciudadano** —problema, qué quiere lograr, familias, aportes— con **opciones numeradas**; la comunidad responde por WhatsApp, el sistema **reconstruye el contexto** del expediente y el **aporte comunitario se integra al contexto**. Los campos **académicos los redacta la UNCP**; la comunidad aporta solo lo que únicamente ella sabe.
- **Tablero** con donut por estado y barras por área.
- **Bilingüe ES / QU** (quechua Wanka, borrador a validar con hablante nativo).
- **Privacidad por diseño**: los datos de contacto viven aparte, nunca van a la IA, y solo el rol coordinador los ve.

---

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind + sistema de diseño propio · `@anthropic-ai/sdk` · Supabase (esquema listo) · desplegable en Vercel.

El motor de IA está **aislado tras una interfaz** (`estructurarNecesidad`), de modo que en
producción puede migrarse a un modelo abierto on-premise (DeepSeek/Huawei/OTIC-UNCP) sin
reescribir el sistema — soberanía de datos y costo cero recurrente (ver `docs/specs/03_motor_ia.md`).

---

## Cómo correrlo

```bash
# 1. Instalar dependencias
npm install

# 2. (Opcional) Configurar variables de entorno
cp env.example .env.local
#    Edita .env.local con TUS llaves. NO es obligatorio:
#    sin ANTHROPIC_API_KEY -> el motor usa el fallback por reglas.
#    sin Supabase          -> usa un almacén en memoria con datos ficticios.

# 3. Desarrollo
npm run dev      # http://localhost:3000

# 4. Producción
npm run build && npm run start
```

> **PUNKU funciona sin configurar nada.** Arranca con datos ficticios en memoria y el
> clasificador por reglas. Configurar la IA y Supabase solo enriquece; nunca es un bloqueo.

**Acceso al panel (demo):** usuario `coordinador` · clave `demo2026` (configurable con
`PANEL_USER` / `PANEL_PASS`).

---

## Estructura del proyecto

```
app/
  page.tsx              ← LA PUERTA (URL única, enruta por rol)
  comunidad/page.tsx    ← cara ciudadana (flujo end-to-end)
  panel/page.tsx        ← CRM institucional (login simbólico)
  api/
    expedientes/        ← crear (POST) · listar (GET) · detalle/estado (GET/PATCH) · contacto
    estado/             ← consulta ciudadana por código (GET)
    panel/login/        ← login simbólico del coordinador
lib/
  ai.ts                 ← motor de IA aislado + fallback a reglas (spec 03)
  store.ts              ← capa de datos (en memoria, sembrada con datos ficticios)
  punku-data.ts         ← categorías, estados, i18n, datos ficticios (fuente visual)
  types.ts              ← Expediente Territorial y tipos del dominio
  uncp-doc.ts           ← generación del borrador en formato oficial UNCP (B4)
  panel-auth.ts         ← login simbólico (spec 06)
components/             ← MountainDoor (símbolo), icons (CatGlyph + UI)
supabase/schema.sql     ← esquema de BD para producción (tablas + RLS)
docs/
  specs/                ← las 7 specs técnicas (00–06) + HANDOFF (orquestación)
  design/               ← README de diseño + prototipo (.html/.jsx)
reference/              ← lineamientos-UNCP-2026.pdf (formato oficial)
```

### Orden de lectura de la documentación
1. `docs/specs/00_contexto_proyecto.md` — el qué y el por qué (spec madre).
2. **La verdad visual oficial es la demo en vivo:** https://punku-uncp.vercel.app (interactiva, de un clic). El `docs/design/README.md` + el prototipo `docs/design/PUNKU - Prototipo.html` son **referencia de diseño**, no la demo (el HTML requiere un servidor local; no abre con doble clic por CORS).
3. `docs/specs/02_modelo_datos.md` — el esquema de datos.
4. `docs/specs/01, 03, 04, 05, 06` — ingesta, IA, CRM, arquitectura, seguridad.
5. `docs/specs/HANDOFF_Claude_Code.md` — cómo se orquestó la construcción.

---

## Seguridad (spec 06)

- `.gitignore` excluye `.env*`, `node_modules`, `.vercel` desde el primer commit.
- Llaves (IA y `service_role` de Supabase) **solo en API routes** (server-side), nunca en el front.
- Datos de contacto **aislados**, con RLS en producción; la consulta ciudadana por código nunca los expone.
- `env.example` con los **nombres** de las variables, sin valores.

> Este repo es **transferible y seguro**: cualquiera puede clonarlo y correrlo con SUS
> propias llaves. El código no contiene ningún secreto.

---

## Despliegue en Vercel

1. Sube este repo a GitHub (público).
2. En [vercel.com](https://vercel.com) → *New Project* → importa el repo.
3. (Opcional) Configura las *Environment Variables* (`ANTHROPIC_API_KEY`, Supabase, `PANEL_PASS`) en el panel de Vercel — cifradas, nunca en el código.
4. Deploy. La URL pública enruta a ambas caras desde la puerta (`/`).

---

## Roadmap (narrado, no construido en el MVP)

Una puerta lógica, muchas bocas: la misma API de creación de expedientes podrá recibir
mañana entradas por **WhatsApp Business**, **correo** o **mesa de partes**. PUNKU capta y
traduce; no reemplaza la formalización ni toca ADESA (compatible vía exportación).

---

## Licencia

[MIT](./LICENSE) — reutilizable por cualquier universidad, municipio o entidad pública.

Hecho por **Miguel Andrés Rosas Malpartida** · **Equipo Human in the Loop** · Lab UNCP Centro · Hackatón Transformagob 2026.
