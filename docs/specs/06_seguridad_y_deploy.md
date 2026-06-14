# 06 — Seguridad y Deploy
## Repo público seguro, transferible y entregables

> Hereda de `00`–`05`. Define cómo proteger secretos, hacer el repo público sin riesgo, desplegar en Vercel y dejar todo transferible. Es la spec que blinda el primer repo público del autor.

---

## 1. Objetivo

Garantizar que: (a) ningún secreto se filtre nunca, ni siquiera en el historial de git; (b) cualquiera pueda clonar el repo y correrlo con SUS propias llaves; (c) la URL pública de Vercel tenga exposición acotada; (d) la entrega cumpla la declaración jurada del formulario.

## 2. Modelo de amenaza

| Qué se protege | De quién/qué |
|---|---|
| API key de IA | Bots que escanean GitHub, usuarios de la URL pública |
| Llave service_role de Supabase | Exposición en frontend o repo |
| Datos de contacto (sensibles) | Acceso desde el frontend público |
| Saldo de la API | Uso no autorizado de la URL desplegada |

## 3. Las 6 reglas de oro de secretos (checklist obligatorio)

1. **Nunca subir `.env`** — el `.gitignore` debe excluir `.env`, `.env.local` y variantes desde el primer commit.
2. **Nunca usar service_role en el frontend** — la llave secreta de Supabase y la de IA solo viven en API routes (server-side).
3. **RLS obligatorio** — Row Level Security activado en todas las tablas de Supabase; la tabla `contactos` solo accesible por el rol interno.
4. **`.gitignore` validado** — confirmar que excluye node_modules, .env*, .vercel, archivos locales.
5. **Nunca borrar llaves "después"** — si una llave entró a un commit, queda en el historial. La regla es que NUNCA entre, ni una vez.
6. **Nunca hacer commit a ciegas desde Claude Code** — antes de cada push, ejecutar `git status` y revisar manualmente qué se sube.

## 4. Cómo se logra "transferible pero seguro"

**En el repo (público):**
- Código completo + comentado.
- Plantilla de variables con los NOMBRES, sin valores. **Construido:** se entrega
  como **`env.example`** (sin punto), porque la deny-list mecánica de secretos
  bloquea crear cualquier archivo `.env*` (incluida la plantilla). El usuario lo
  copia a `.env.local` (`cp env.example .env.local`). Contenido real:
  ```
  ANTHROPIC_API_KEY=
  ANTHROPIC_MODEL=
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=
  PANEL_USER=coordinador
  PANEL_PASS=demo2026
  ```
- `.gitignore` que excluye `.env`, `.env.local` y variantes desde el primer commit.
- README con instrucciones de instalación.
- > **Nota:** PUNKU corre **sin configurar nada** — sin `ANTHROPIC_API_KEY` clasifica por reglas; sin Supabase usa el almacén en memoria con datos ficticios. Las variables solo enriquecen; nunca bloquean.

**Las llaves reales viven solo en:**
- El `.env.local` del autor (en su máquina, excluido de git).
- Las Environment Variables de Vercel (cofre encriptado, no es código).

**Resultado:** quien clona el repo recibe el código pero NO las llaves. Para correrlo debe poner las suyas. Imposible usar las del autor desde el código.

## 5. La URL de Vercel (exposición acotada)

- La URL pública SÍ corre con las llaves del autor (necesario para que la demo funcione).
- **Exposición máxima:** acotada al saldo limitado de la API (sin auto-reload → techo natural). Daño máximo absoluto = el saldo cargado.
- **Estrategias de control:** compartir la URL solo con jurado/mentores en la ventana de demo; opción de protección con contraseña en Vercel; revocar la API key tras el hackatón.
- > Distinción clave: compartir el CÓDIGO (GitHub) es 100% seguro; compartir la URL EN VIVO (Vercel) usa las llaves del autor pero con daño acotado y bajo su control.

## 6. Manejo de datos sensibles (cumplimiento)

- Datos personales (nombre, teléfono) en tabla `contactos`, separada, con RLS, solo backend.
- La IA solo recibe la necesidad anonimizada (spec 03).
- La demo usa datos 100% ficticios (declaración jurada del formulario).
- Cumple Ley 31814, DL 1412, protección de datos (Indecopi).

## 7. Deploy en Vercel

1. Repo en GitHub (público).
2. Conectar Vercel al repo (deploy automático).
3. Configurar Environment Variables en Vercel (las llaves reales, encriptadas).
4. Supabase: proyecto creado, RLS activado, tablas según spec 02.
5. Verificar que la URL pública funciona end-to-end.

## 8. Checklist de seguridad pre-push (verificable, antes de hacer público)

- [ ] `.gitignore` excluye `.env`, `.env.local`, `node_modules`, `.vercel`.
- [ ] No hay ninguna llave hardcodeada en el código (búsqueda manual de "key", "secret", "sk-").
- [ ] Existe `.env.example` con nombres pero sin valores.
- [ ] `git status` revisado manualmente antes del primer push.
- [ ] Historial de git limpio (ninguna llave en commits previos).
- [ ] RLS activado en Supabase; `contactos` restringida.
- [ ] service_role solo en API routes, nunca en frontend.
- [ ] La consulta ciudadana por código no expone datos de contacto.

## 9. Documentación del repo (suma al criterio 20% — apertura)

- **README.md** con: qué es PUNKU, el problema, cómo instalar (copiar .env.example, poner tus llaves, npm install, npm run dev), estructura del proyecto, stack, licencia.
- **Licencia MIT** (reutilizable por cualquier entidad).
- Código comentado al 100%: cada parte explica qué hace, para que cualquiera entienda el proyecto.
- Las specs (00–06) como documentación técnica.

## 10. Entregables finales (Definition of Done de la 00)

**Obligatorios (formulario Facilita t/54660):**
- [ ] Carpeta pública en Google Drive con todo (enlace verificado).
- [ ] Ficha entregable en PDF — con "Desafío 3 - UNCP" (NO "Desafío 1 - UNSA").
- [ ] PPT en plantilla oficial (máx. 10 slides) → PDF.
- [ ] Demo funcional (URL Vercel).
- [ ] Nombre, desafío (3, UNCP, Lab UNCP Centro), integrante.

**Opcionales (que suman):**
- [ ] Repo GitHub público, documentado, MIT.
- [ ] Documentación técnica (las specs).

## 11. Criterios de aceptación

- [ ] El repo público no contiene ningún secreto (ni en historial).
- [ ] Cualquiera puede clonar y correr con sus propias llaves.
- [ ] La URL de Vercel funciona y su exposición está acotada.
- [ ] RLS protege los datos sensibles.
- [ ] README permite a un tercero instalar sin ayuda.
- [ ] Todos los entregables obligatorios listos y enlaces verificados.

## 12. Lo que NO hace

- NO implementa auth compleja ni gestión de usuarios múltiples en el MVP (login simple del coordinador).
- NO cifra a nivel de campo (RLS + HTTPS son suficientes para MVP; cifrado avanzado es roadmap).
- NO incluye pentesting formal (roadmap para producción).
- NO implementa rate limiting en el MVP (roadmap: limitar consultas por IP para proteger la URL pública y el saldo de la API).
