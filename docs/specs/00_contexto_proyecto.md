# 00 — Contexto del Proyecto (Spec Madre)
## PUNKU — La puerta que escucha al territorio

> **Spec madre.** Gobierna todas las demás specs. Toda decisión técnica, de diseño o de alcance hereda de aquí. Las specs siguientes (01–06) referencian esta sin duplicarla.

---

## 1. Qué es el proyecto

**En una línea:** PUNKU es una capa digital ciudadana, independiente y de costo cero, que traduce la necesidad de una comunidad en una solicitud que la UNCP entiende y puede rastrear — sin que el ciudadano viaje ni aprenda la estructura interna de la universidad.

**El problema que resuelve (validado en campo con el Lab UNCP):** hoy un representante comunal de Huancayo que necesita apoyo de la universidad enfrenta dos dolores concretos:
1. **No sabe cómo entrar:** qué puede pedir, a qué facultad, con qué formato, en qué plazo, por cuál de 3-4 canales sin estándar.
2. **No sabe qué pasó después:** tras presentar, no recibe trazabilidad. Viaja horas una vez para preguntar cómo presentar, y otra vez 15 días después solo para preguntar cómo va — perdiendo jornales de trabajo.

**La solución:** una "puerta" conversacional y visual (árbol de decisiones lúdico) que captura la necesidad en lenguaje cotidiano, la estructura automáticamente con IA hacia la facultad correcta, entrega un código de seguimiento, y le da trazabilidad al ciudadano. Por dentro, un CRM permite a la UNCP ver, clasificar y dar seguimiento a todas las solicitudes en un solo lugar.

**El nombre:** *Punku* significa "puerta" en quechua.

**El artefacto central — el Expediente Territorial:** toda necesidad, sin importar por qué boca entre, termina convertida en un único objeto llamado **Expediente Territorial**. Es el corazón del sistema: la IA lo genera, el CRM lo consume, el ciudadano lo rastrea. Campos mínimos: código, comunidad, categoría, urgencia, resumen, estado. Todo en PUNKU gira alrededor de este objeto.

---

## 2. Para quién

**Cliente / entidad:** Universidad Nacional del Centro del Perú (UNCP) — sector público. Desafío 3, Hackatón Transformagob 2026. Lab: LAB UNCP Centro (Unidad de Modernización + Incubadora). Punto focal: Ing. Gerardo Aylas (gaylas@uncp.edu.pe).

**Usuarios ciudadanos (cara externa):** representantes de comunidades campesinas, urbanas y gobiernos locales de la provincia de Huancayo. Mayores de 18 años, líderes elegidos que rinden cuentas a su comunidad. Alfabetización digital diversa; usan smartphone pero con dominio variable; región multilingüe (español, quechua, asháninka, nomatsiguenga). Algunos en zonas con conectividad limitada.

**Usuario institucional (cara interna):** el "Coordinador de enlace territorial" — rol que ya existe (la secretaria de la Unidad de Proyección Social que hoy recibe todos los canales). Opera el CRM.

**Implementador:** Andres Rosas (participante individual).

---

## 3. Naturaleza y modelo

- **Prototipo de hackatón** demostrable, entregable el domingo 14/06 a las 11:59 PM (hora inapelable).
- Si gana: la UNCP evalúa el prototipo en 30 días y puede desarrollar un piloto en el 2do semestre 2026, sujeto a viabilidad técnica/normativa/presupuestal.
- **No genera derecho a pago ni contratación** (declaración jurada del formulario).
- Open source (licencia MIT), reutilizable por otras universidades, municipios o entidades públicas.

---

## 4. Principios rectores (ordenados por prioridad)

Toda decisión hereda de estos principios, en este orden:

1. **Fricción cero para el ciudadano.** Cada clic, requisito o decisión extra reduce participación. El ciudadano no llena formularios: juega un árbol visual y el sistema estructura por detrás.
2. **La universidad entiende al ciudadano, no al revés.** PUNKU traduce de "lenguaje comunidad" a "lenguaje universidad". El ciudadano nunca aprende jerga (mono/polivalente, áreas, formatos).
3. **Nada se pierde / trazabilidad total.** Toda necesidad queda registrada y visible. El ciudadano siempre sabe en qué va su caso. Ataca el dolor emocional de "sentirse invisible".
4. **Respetar lo que ya funciona.** No tocar ADESA (ni módulos ni APIs), no reemplazar los procesos de aprobación ni ejecución (que funcionan al 100%). PUNKU es la puerta de entrada que hoy no existe, no un reemplazo.

---

## 5. Alcance funcional

### 5.1 Qué SÍ hace (MVP congelado)

| Componente | Descripción | Cara |
|---|---|---|
| Árbol de decisiones visual | Captura la necesidad con botones-ícono, lenguaje llano, sin jerga. **Degradación elegante:** si el árbol visual se complica en el tiempo, cae a 3 preguntas secuenciales simples. La experiencia sobrevive aunque el árbol no esté perfecto | Ciudadana |
| PUNKU Emergencias | Botón aparte para casos urgentes (ej. contaminación). **Mismo flujo interno** que el normal (Solicitud → Clasificación → CRM); la única diferencia es urgencia = alta. No duplica lógica | Ciudadana |
| Toggle facilitador | "Registrar para mí" / "Registrar para otra persona" — representa la arquitectura social (municipio, hijo, líder) | Ciudadana |
| Motor de estructuración IA | UNA llamada: texto/selecciones → JSON (categoría, urgencia, facultades, resumen). Anonimizado. Con fallback a reglas | Transversal |
| Código de seguimiento | Identificador único por solicitud (ej. PUNKU-2026-001) | Ciudadana |
| Tarjeta de Reconocimiento Territorial | Pantalla final: "Tu comunidad ya fue escuchada" + código + impacto + próximo paso | Ciudadana |
| Consulta de estado | Con el código, ver el timeline de avance | Ciudadana |
| CRM / bandeja territorial | Todas las solicitudes en un lugar, con clasificación y filtros | Interna |
| Trazabilidad (estados) | Cambio de estado en 1 clic, historial visible. **Máximo 5 estados:** Recibido → En revisión → Derivado → Atendido → Cerrado | Interna |
| Estado "derivable a otra entidad" | Marca lo que la UNCP no puede atender (sin construir el flujo completo) | Interna |

### 5.2 Qué NO hace (límites explícitos / roadmap narrado)

- NO crea módulos en ADESA ni se integra con él por API. (Restricción dura.)
- NO reemplaza los procesos de aprobación/evaluación/ejecución de proyectos.
- NO construye (se narran como roadmap): RAG/búsqueda semántica sobre tesis, matching automático de tesis, mapa geográfico de necesidades, flujo completo de derivación a ONG/gobierno regional, semáforo de plazos avanzado, red operativa de nexos territoriales, WhatsApp real, multiidioma quechua/asháninka, modo SMS/voz.

---

## 6. Restricciones

### 6.1 Técnicas
- **Costo cero / casi cero:** software libre + horas hombre asistidas por IA. Sin servicios comerciales cerrados como dependencia dura.
- **Independencia de ADESA:** cero módulos, cero APIs, cero integraciones pagas. Interoperabilidad futura solo por exportación CSV/Excel.
- **Stack definido:** Next.js (App Router) + Supabase (PostgreSQL) + Vercel + Tailwind. IA vía API comercial (Claude Haiku) **como componente reemplazable, no como dependencia dura**: el motor de IA está aislado tras una interfaz, con fallback a reglas, y diseñado para migrar en producción a un modelo abierto (DeepSeek u otro) on-premise sobre infraestructura nacional/institucional (ej. Huawei Cloud o servidor de la OTIC-UNCP), logrando soberanía de datos y cero costo recurrente. Esto cumple la cláusula de "no depender de software propietario restrictivo".
  - > **Construido:** en vez de shadcn/ui, el MVP **porta directamente el sistema de diseño hi-fi** del paquete de Claude Design (tokens, tipografía Sora/Inter, símbolo montaña-puerta y las 13 pantallas) a CSS propio sobre Tailwind. Era lo más fiel al handoff visual y evita una capa de componentes intermedia. Tailwind queda disponible para utilidades.

### 6.2 Normativas y de cumplimiento (sector público)
- **Accesibilidad obligatoria:** WCAG 2.2 nivel AA (Lineamiento SGTD N° 001-2025-PCM/SGTD). Principios: Perceptible, Operable, Comprensible, Robusto. Aplicado desde el diseño (contraste, navegación por teclado, lector de pantalla, texto agrandable, lenguaje sencillo).
- **Marco legal habilitante:** Ley 31814 (promoción de IA), DL 1412 (Gobierno Digital), enfoque ciudadano-céntrico.
- **Protección de datos:** datos personales (DNI, contacto) NO salen de la solución; la IA solo procesa la necesidad anonimizada.
- **Declaración jurada del formulario:** solución prototípica; original o con componentes de terceros autorizados; no depende de software propietario restrictivo; **no usa datos personales reales** (la demo usa datos 100% ficticios).

---

## 7. Datos oficiales de contexto (para narrativa y diseño)

Fuente: Base de datos del Sistema de Proyección Social 2025-1, UNCP.
- **1,932 personas** realizan proyección social (590 docentes, **1,325 estudiantes**, 17 administrativos).
- **217 proyectos** en el semestre 2025-1: Extensión Universitaria (143), Intervención Tecnológica (61), Imagen Institucional (13).
- **213 monovalentes vs. 4 polivalentes** → confirma que monovalente es el caso por defecto.
- **5 áreas académicas / 38 carreras** (catálogo oficial para el clasificador).
- **Desbalance oferta-demanda confirmado:** 1,325 estudiantes necesitan proyectos para titularse; faltan necesidades canalizadas del territorio. PUNKU alimenta esa demanda.
- **Narrativa raíz:** la UNCP nació en 1959 del esfuerzo de 36 comunidades campesinas (Universidad Comunal del Centro).

---

## 8. Definition of Done (cuándo el proyecto está listo para entregar)

- [ ] Flujo ciudadano completo funcionando: necesidad → IA → expediente → código → tarjeta de reconocimiento → consulta de estado.
- [ ] CRM funcionando: bandeja con solicitudes, cambio de estado, historial visible.
- [ ] IA estructurando en vivo con fallback a reglas operativo (la demo no se cae si falla la API).
- [ ] Datos de muestra 100% ficticios cargados.
- [ ] Desplegado en Vercel con URL pública funcional.
- [ ] Repo GitHub público, documentado, licencia MIT, sin secretos (checklist de seguridad pasado).
- [ ] Carpeta pública en Google Drive con todos los entregables y enlaces verificados.
- [ ] Ficha entregable en PDF (con "Desafío 3 - UNCP" correcto).
- [ ] PPT en plantilla oficial (máx. 10 slides) exportada a PDF.
- [ ] Formulario Facilita (t/54660) enviado antes de las 11:59 PM (meta interna 8 PM).

**Deseable (suma, pero no bloquea la entrega):**
- [ ] Accesibilidad WCAG 2.2 AA básica verificada (contraste, teclado, semántica). Si a las 8 PM del domingo hay que elegir entre flujo funcionando vs. accesibilidad perfecta, gana el flujo funcionando. Lo básico (contraste, lenguaje simple) ya viene con buen diseño.

---

## 9. Variables abiertas (rangos de maniobra a confirmar)

> **RANGO DE MANIOBRA — Modelo de IA (estrategia en dos tiempos):** Para el MVP de hackatón se usa la **API de Claude (Haiku)** por velocidad de implementación, estabilidad en la demo en vivo y JSON estructurado nativo. **Esta NO es una dependencia dura:** la arquitectura aísla el motor de IA detrás de una interfaz, de modo que en la implementación real se puede migrar sin reescribir el sistema a una alternativa de soberanía de datos y costo cero recurrente — por ejemplo, **DeepSeek (u otro modelo abierto) corriendo on-premise sobre infraestructura nacional/institucional (tipo Huawei Cloud o servidor de la OTIC-UNCP)**, según recomendó el mentor de IA. El sistema además tiene fallback a clasificación por reglas, por lo que nunca depende absolutamente de ningún proveedor. Se confirma al implementar el motor (spec 03).

> **RANGO DE MANIOBRA — Notificaciones al ciudadano:** en el MVP son simuladas en pantalla. Producción: correo automático o WhatsApp Business app. Se confirma en piloto.

> **RANGO DE MANIOBRA — Catálogo fino de servicios por facultad:** el árbol usa las 5 áreas + ejemplos validados; el catálogo exacto por carrera se afina con el boletín de la UNCP en fase de piloto.

---

## 10. Mapa de specs

```
00_contexto_proyecto      ← (esta) spec madre
01_ingesta_ciudadana      → árbol visual + emergencias + toggle facilitador + tarjeta reconocimiento
02_modelo_datos           → tablas Supabase, estados, código único
03_motor_ia               → una llamada, JSON, anonimizado, fallback a reglas
04_crm                    → bandeja + estados + seguimiento + estado "derivable"
05_arquitectura           → Next.js/Supabase/Vercel, cómo encaja todo, flujo end-to-end
06_seguridad_y_deploy     → reglas de secretos, RLS, README, .env.example, checklist pre-push, entregables
```

> Orden por flujo de valor: la experiencia del ciudadano (01) define los datos (02), que definen el motor (03) y el CRM (04); la arquitectura (05) y la seguridad/deploy (06) cierran. Cada spec se valida antes de pasar a la siguiente.

---

## Criterios de aceptación de esta spec

- [ ] El problema y los 2 dolores están claros y validados.
- [ ] Los 4 principios rectores son la guía de toda decisión posterior.
- [ ] El alcance MVP vs. roadmap está congelado y explícito.
- [ ] Las restricciones duras (ADESA, costo cero, accesibilidad, datos) están fijadas.
- [ ] El mapa de specs y su orden están aprobados.
