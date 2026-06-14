# 02 — Modelo de Datos
## El Expediente Territorial y su estructura en Supabase

> Hereda de `00` y `01`. Define las tablas, el objeto central (Expediente Territorial), los estados y el código único. Es el cimiento que consumen el motor de IA (03) y el CRM (04).

---

## 1. Objetivo

Definir la estructura de datos mínima y suficiente para que PUNKU capture, estructure, rastree y derive necesidades — separando datos sensibles de datos procesables por IA.

## 2. Principio de datos

- **Separación dato sensible / dato procesable:** los datos personales (nombre, teléfono) viven en su propia tabla, ligados al expediente solo por el código. La IA solo recibe la descripción de la necesidad, nunca lo personal. (Hereda principio de privacidad de la 00.)
- **Mínimo viable:** solo los campos que el MVP usa. Nada especulativo.

## 3. Tablas (Supabase / PostgreSQL)

### Tabla `expedientes` (el corazón — el Expediente Territorial)
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador interno |
| codigo | text (único) | Código público de seguimiento (ej. PUNKU-2026-001) |
| comunidad | text | Nombre de la comunidad/organización |
| distrito | text | Distrito de Huancayo |
| familias_afectadas | int | Número aproximado de beneficiarios |
| necesidad_texto | text | Descripción libre de la necesidad (lo que va a la IA, anonimizado) |
| categoria | text | Clasificación (área): salud, agricultura, ambiente, educación, cultura, infraestructura |
| facultades_sugeridas | text[] | Facultad(es) sugerida(s) por la IA (array) |
| ods_sugerido | text | ODS sugerido por la IA (número y nombre), según área/facultad |
| resultado_deseado | text | Qué quiere lograr la comunidad (paso E, en su lenguaje) |
| urgencia_ciudadana | text | urgente / este_año / puede_esperar (paso E) |
| foto_url | text | URL de foto opcional del problema (evidencia visual) |
| modalidad | text | monovalente / polivalente (deducido; interno, no se muestra al ciudadano) |
| urgencia | text | normal / alta (alta = vino por Emergencias) |
| resumen_formal | text | Resumen en lenguaje institucional generado por IA |
| estado | text | Estado actual (ver sección 4) |
| canal_origen | text | web / emergencias / asistido (toggle facilitador) |
| origen_registro | text | ciudadano / facilitador (mide impacto de la arquitectura social) |
| clasificado_por | text | ia / reglas (trazabilidad del método) |
| confianza | float | Nivel de confianza de la clasificación IA (ej. 0.92) — explicabilidad |
| titulo | text | Título tentativo del proyecto (derivado del relato; alimenta B4) |
| objetivo_sugerido | text | Objetivo general sugerido por la IA (paso E + relato; alimenta B4) |
| meta_sugerida | text | Meta cuantitativa tentativa sugerida por la IA (alimenta B4) |
| datos_incompletos | bool | **(Construido)** Aviso de calidad: `true` si la IA detectó input incoherente/poco claro. NO bloquea la creación; solo señala al coordinador en el panel (ver spec 03/04). Default `false`. |
| creado_en | timestamp | Fecha de ingreso |
| actualizado_en | timestamp | Última actualización de estado |

> **Estado de implementación (MVP construido):** el esquema completo vive en
> `supabase/schema.sql`. La capa de datos (`lib/store.ts`) es un **facade** que
> usa **Supabase como almacén principal** cuando están las variables de entorno
> (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`), y **cae a un almacén
> en memoria** sembrado con los 7 expedientes ficticios cuando no las hay. Esto
> garantiza que la demo nunca dependa de un servicio externo: con Supabase
> configurado persiste de verdad (crear en `/comunidad` aparece en `/panel` y la
> consulta por código refleja el estado); sin él, corre igual con datos ficticios.

### Tabla `contactos` (datos sensibles — aislados)
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador interno |
| expediente_id | uuid (FK) | Liga al expediente |
| nombre_representante | text | Nombre del líder/representante |
| telefono | text | Número de contacto |
| es_facilitador | bool | True si lo registró un tercero (municipio, etc.) |

> Esta tabla NUNCA se envía a la IA. Acceso restringido por RLS al rol interno. (Ver spec 06.)

### Tabla `estados_historial` (trazabilidad / timeline)
| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador |
| expediente_id | uuid (FK) | Liga al expediente |
| estado | text | Estado registrado |
| nota | text | Comentario opcional del coordinador |
| fecha | timestamp | Cuándo se registró el cambio |

### Tabla `borradores_b4` (persistencia del formato UNCP — **construido**)
Guarda lo que la UNCP completa en B4 (spec 04). **Tabla nueva y separada**, en relación **1:1** con `expedientes` — deliberadamente NO se añadieron columnas a `expedientes`, para poder revertir la feature sin tocar el núcleo. Los scripts `supabase/migration-borradores-b4.sql` y `supabase/rollback-borradores-b4.sql` la crean/eliminan de forma aislada.

| Campo | Tipo | Descripción |
|---|---|---|
| id | uuid (PK) | Identificador interno |
| expediente_id | uuid (FK, único) | Liga 1:1 al expediente |
| objetivo_general | text | Objetivo general (editable; "Sugerir con IA") |
| objetivos_especificos | text | Objetivos específicos (editable; "Sugerir con IA") |
| metas | text | Metas cuantitativas (editable; "Sugerir con IA") |
| metodologia | text | Metodología (chips de opción rápida) |
| fecha_ini / fecha_fin | date | Cronograma |
| recursos | text | Recursos necesarios |
| presupuesto | text | Presupuesto (S/) |
| docente_asesor | text | Docente responsable |
| evaluacion | text | Indicadores / evaluación (editable; "Sugerir con IA") |
| estudiantes | jsonb | Lista de estudiantes (nombre/DNI/código) |
| actualizado_en | timestamp | Último guardado |

> "Guardar borrador" hace **upsert** por `expediente_id`; al abrir B4 el formulario se **hidrata desde esta tabla** (la BD es fuente de verdad; el estado de sesión es solo capa de UX). El mismo borrador hidratado alimenta el PDF y el modal de correo. RLS activado: tabla interna, solo `service_role` (ver spec 06).

### Tabla `facultades` (catálogo para clasificar/derivar)
| Campo | Tipo | Descripción |
|---|---|---|
| id | int (PK) | Identificador |
| nombre | text | Nombre de la facultad |
| area | text | Una de las 5 áreas de la UNCP |
| palabras_clave | text[] | Para el fallback por reglas y la sugerencia |

> Se precarga con las 38 carreras / 5 áreas oficiales (dato de la 00). Datos de catálogo, no sensibles.

### Tabla `ods_facultad` (mapeo ODS ↔ facultad, para clasificación)
Catálogo de referencia que usa el motor de IA para asignar el ODS correcto según la facultad/área deducida. Basado en el alineamiento oficial ODS-2030 de la UNCP.

| Campo | Tipo | Descripción |
|---|---|---|
| ods_numero | int | Número del ODS (1-17) |
| ods_nombre | text | Nombre del ODS |
| facultades | text[] | Facultades alineadas a ese ODS |
| es_transversal | bool | True si aplica a TODAS las facultades |

**Mapeo oficial UNCP (precargado):**
- **Transversales (todas las facultades):** ODS 1 (Fin de la pobreza), 2 (Hambre cero), 3 (Salud y bienestar), 4 (Educación de calidad), 6 (Agua limpia), 10 (Reducción de desigualdades), 11 (Ciudades sostenibles), 12 (Producción y consumo responsables), 13 (Acción por el clima), 17 (Alianzas).
- **ODS 5 (Igualdad de género):** Ciencias de la Comunicación, Enfermería, Medicina Humana, Sociología, Trabajo Social.
- **ODS 7 (Energía asequible y no contaminante):** Ing. Civil, Ing. Eléctrica y Electrónica, Ing. Mecánica, Ing. Química, Ing. Sistemas.
- **ODS 8 (Trabajo decente y crecimiento económico):** Adm. Negocios (Tarma), Administración, Contabilidad, Economía, Ing. Sistemas, Turismo (Tarma).
- **ODS 9 (Industria, innovación e infraestructura):** Agroindustria (Junín), Arquitectura, Ing. Sistemas, Ingeniería Civil.
- **ODS 14 (Vida submarina):** Ing. Mecánica, Ing. Química, Zootecnia, Zootecnia Tropical (Satipo).
- **ODS 15 (Vida de ecosistemas terrestres):** Ciencias de la Comunicación, Ing. Forestal Tropical (Satipo), Ing. Forestales y del Ambiente, Turismo, Zootecnia.
- **ODS 16 (Paz, justicia e instituciones sólidas):** Antropología, Ciencias de la Comunicación, Sociología, Trabajo Social.

> La IA, sabiendo la facultad/área deducida, asigna el ODS específico correcto (o uno transversal pertinente). El ciudadano NUNCA ve el ODS — es lenguaje institucional que solo aparece en el borrador de solicitud (B4) del CRM.

## 4. Estados del trámite (máximo 5 — heredado de 00)

```
Recibido → En revisión → Derivado → Atendido → Cerrado
```

| Estado | Significado interno | Cómo se muestra al ciudadano |
|---|---|---|
| Recibido | Expediente creado, con código | "Tu necesidad llegó y tiene código" |
| En revisión | El coordinador la está clasificando | "La universidad está viendo a qué facultad corresponde" |
| Derivado | Asignado a facultad o a otra entidad | "Tu caso fue enviado a quien puede ayudarte" |
| Atendido | Una facultad/grupo lo tomó | "Una facultad está trabajando en tu caso" |
| Cerrado | Finalizado o archivado con aviso | "Tu caso fue cerrado" (con motivo) |

> El estado "Derivado" cubre tanto derivación interna (facultad) como el concepto "derivable a otra entidad" (ONG/gobierno regional), sin construir el flujo completo de derivación externa (eso es roadmap). Un campo o nota distingue el destino.

## 5. El código único

- Formato: `PUNKU-{año}-{correlativo}` (ej. PUNKU-2026-001).
- Generado al crear el expediente. Es la llave pública que el ciudadano usa para consultar (sin login).
- > **RANGO DE MANIOBRA — generación del correlativo:** secuencia simple en MVP. Para producción, considerar formato con prefijo de distrito o área. Se confirma en piloto.

## 6. Relaciones

```
contactos.expediente_id      → expedientes.id   (1:1)
borradores_b4.expediente_id  → expedientes.id   (1:1)
estados_historial.expediente_id → expedientes.id (1:N)
expedientes.facultad_sugerida ~ facultades.nombre (referencia lógica)
```

## 7. Requisitos de seguridad (heredados de 06)

- **RLS (Row Level Security) activado** en todas las tablas.
- Tabla `contactos`: solo accesible por el rol interno (service role en backend), nunca por la llave pública del frontend.
- La consulta ciudadana por código solo expone campos no sensibles del expediente (estado, resumen, área) — NO el contacto.

## 8. Criterios de aceptación

- [x] El Expediente Territorial tiene todos los campos mínimos de la 00 (código, comunidad, categoría, urgencia, resumen, estado).
- [x] Datos sensibles (contacto) están en tabla separada con RLS.
- [x] Máximo 5 estados, con su traducción a lenguaje ciudadano.
- [x] El código único se genera al crear el expediente.
- [x] El historial de estados permite reconstruir el timeline.
- [x] El catálogo de facultades está precargado con las 5 áreas / 38 carreras.
- [x] B4 persiste en la tabla separada `borradores_b4` (1:1), con migration + rollback aislados.

## 9. Lo que NO hace

- NO almacena documentos adjuntos pesados en el MVP (solo texto; foto opcional en emergencias queda como referencia simple o roadmap).
- NO guarda historial de versiones del expediente (solo cambios de estado).
- NO implementa búsqueda semántica ni vectores (eso es roadmap RAG).
