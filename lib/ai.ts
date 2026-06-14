/* ============================================================
   PUNKU — Motor de estructuración (IA)  ·  spec 03
   ------------------------------------------------------------
   Interfaz ÚNICA y AISLADA: estructurarNecesidad(input) -> ClasificacionIA.
   El resto del sistema no sabe qué modelo hay detrás. Migrar de Claude a
   DeepSeek/Huawei on-premise (producción) = reemplazar solo este archivo.

   Garantías de la spec:
   · Una sola llamada, timeout 10s, JSON validado contra esquema.
   · La IA evalúa COHERENCIA: si el input es texto aleatorio, sin sentido, vacío
     o no es una necesidad real, NO inventa contenido -> coherente=false + motivo.
   · Si la IA falla / no responde / sin saldo / timeout / JSON inválido
     -> FALLBACK A REGLAS (con un chequeo de coherencia heurístico).
   · A la IA se le envía SOLO la necesidad anonimizada (sin datos personales).
   ============================================================ */
import Anthropic from "@anthropic-ai/sdk";
import type { NecesidadInput, ClasificacionIA, SugerenciaB4, Expediente } from "./types";
import { CATEGORIES, FAC_POR_CAT, ODS_MAP, catOf, type CatId } from "./punku-data";

const TIMEOUT_MS = 10_000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";
const CAT_IDS = CATEGORIES.map((c) => c.id);

/* ---------- Esquema de salida del clasificador (tool use) ---------- */
const TOOL_SCHEMA = {
  name: "registrar_expediente",
  description:
    "Evalúa si la necesidad es real y coherente y, solo si lo es, la estructura en un Expediente Territorial para la UNCP, en lenguaje institucional.",
  input_schema: {
    type: "object" as const,
    properties: {
      coherente: { type: "boolean", description: "true si el input describe una necesidad comunitaria REAL y comprensible; false si es texto aleatorio, caracteres sin sentido, está vacío, o claramente no es una necesidad." },
      motivo: { type: "string", description: "Si coherente=false, motivo breve para el ciudadano. Si true, cadena vacía." },
      categoria: { type: "string", enum: CAT_IDS, description: "Área (solo si coherente=true)." },
      modalidad: { type: "string", enum: ["monovalente", "polivalente"], description: "Polivalente si requiere más de una facultad." },
      urgencia: { type: "string", enum: ["normal", "alta"] },
      facultades_sugeridas: { type: "array", items: { type: "string" }, description: "1 a 3 facultades de la UNCP que pueden atender." },
      ods_sugerido: { type: "string", description: "ODS oficial pertinente (número y nombre)." },
      resumen_formal: { type: "string", description: "Resumen en lenguaje institucional, sin datos personales (solo si coherente=true)." },
      objetivo_sugerido: { type: "string", description: "Objetivo general derivado de lo que la comunidad quiere lograr." },
      meta_sugerida: { type: "string", description: "Meta cuantitativa tentativa." },
      confianza: { type: "number", description: "Confianza de la clasificación, 0 a 1." },
    },
    required: ["coherente", "motivo"],
  },
};

/** Promesa con timeout: si la IA tarda más de TIMEOUT_MS, se rechaza y cae a reglas. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/* ============================================================
   COHERENCIA por heurística (para el fallback por reglas)
   La IA es el juez principal; esto cubre el caso sin IA disponible.
   ============================================================ */
function pareceCoherente(input: NecesidadInput): { ok: boolean; motivo: string } {
  // En el flujo normal, una selección concreta del árbol YA es una necesidad real
  // (ej. "El agua nos enferma"). Solo es incoherente si no hay selección clara y el
  // texto libre es vacío o aleatorio (típico de Emergencias o "Otra cosa" + gibberish).
  const sel = (input.quePasa || "").trim();
  const seleccionReal = sel.length > 3 && !/^otra cosa$/i.test(sel);
  if (seleccionReal) return { ok: true, motivo: "" };

  const texto = `${input.relato || ""} ${input.aspiracion || ""}`.trim().toLowerCase();
  if (texto.length < 12) return { ok: false, motivo: "El texto es muy corto para entender la necesidad." };
  const palabras = texto.split(/\s+/).filter((w) => w.length >= 2);
  const letras = (texto.match(/[a-záéíóúñ]/g) || []).length;
  if (palabras.length < 3 || letras / Math.max(1, texto.length) < 0.55) {
    return { ok: false, motivo: "El texto no parece describir una necesidad real." };
  }
  // Señal de texto REAL en español: alguna palabra común o alguna palabra larga.
  // El mash de teclado ("asdf jkl qwe") no tiene ni una ni otra. (La IA real, cuando
  // está disponible, es el juez fino; esto es solo el respaldo sin IA.)
  const COMUNES = new Set(["el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "que", "no", "se", "en", "con", "por", "para", "es", "son", "esta", "está", "mi", "nos", "nuestra", "nuestro", "su", "sus", "agua", "salud", "ninos", "niños", "comunidad", "rio", "río", "pozo", "enferman", "enferma", "contamina", "contaminada", "necesita", "necesitamos", "falta", "mal", "hay", "tienen", "tenemos", "queremos", "ayuda"]);
  const tieneComun = palabras.some((w) => COMUNES.has(w));
  const tieneLarga = palabras.some((w) => w.length >= 6 && /[aeiouáéíóú].*[aeiouáéíóú]/.test(w));
  if (!tieneComun && !tieneLarga) {
    return { ok: false, motivo: "El texto no parece describir una necesidad real." };
  }
  return { ok: true, motivo: "" };
}

/* ============================================================
   FALLBACK POR REGLAS (resiliencia — spec 03 §6)
   ============================================================ */
export function clasificarPorReglas(input: NecesidadInput): ClasificacionIA {
  const coh = pareceCoherente(input);
  const cat = input.catId;
  const facultades = FAC_POR_CAT[cat] || [];
  const modalidad = facultades.length > 1 ? "polivalente" : "monovalente";
  const urgencia = input.emergencia || input.urgenciaCiudadana === "alta" ? "alta" : "normal";

  const necesidad = (input.relato && input.relato.trim().length > 8) ? input.relato.trim() : input.quePasa;
  const resumen_formal =
    `La comunidad del distrito de ${input.distrito} reporta: ${necesidad.toLowerCase()}. ` +
    `Afecta aproximadamente a ${input.familias} familias. ` +
    `Requiere orientación y acompañamiento técnico de la UNCP.`;
  const objetivo_sugerido = input.aspiracion
    ? `Contribuir a que la comunidad logre: ${input.aspiracion.replace(/\.$/, "")}, con el acompañamiento de la UNCP.`
    : `Atender la necesidad identificada en ${input.distrito}, en beneficio de ${input.familias} familias.`;

  return {
    coherente: coh.ok,
    motivo: coh.motivo,
    categoria: cat,
    modalidad,
    urgencia,
    facultades_sugeridas: facultades,
    ods_sugerido: ODS_MAP[cat] || "ODS 17 · Alianzas",
    resumen_formal,
    objetivo_sugerido,
    meta_sugerida: `${input.familias} familias beneficiadas y un plan de trabajo en 6 meses.`,
    confianza: 0.6,
    clasificado_por: "reglas",
  };
}

/** Valida que la salida COHERENTE de la IA cumpla el esquema de clasificación. */
function validarClasificacion(o: any): boolean {
  return (
    o &&
    CAT_IDS.includes(o.categoria) &&
    (o.modalidad === "monovalente" || o.modalidad === "polivalente") &&
    (o.urgencia === "normal" || o.urgencia === "alta") &&
    Array.isArray(o.facultades_sugeridas) && o.facultades_sugeridas.length > 0 &&
    typeof o.ods_sugerido === "string" &&
    typeof o.resumen_formal === "string" && o.resumen_formal.length > 10 &&
    typeof o.objetivo_sugerido === "string" &&
    typeof o.meta_sugerida === "string" &&
    typeof o.confianza === "number"
  );
}

/* ============================================================
   INTERFAZ ÚNICA — estructurarNecesidad
   ============================================================ */
export async function estructurarNecesidad(input: NecesidadInput): Promise<ClasificacionIA> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return clasificarPorReglas(input);

  try {
    const client = new Anthropic({ apiKey });
    // Entrada ANONIMIZADA — sin nombre, teléfono ni DNI (spec 03 §4).
    const prompt =
      `Eres el clasificador territorial de PUNKU para la Universidad Nacional del Centro del Perú (UNCP), Huancayo.\n` +
      `PRIMERO evalúa la COHERENCIA: ¿este input describe una necesidad comunitaria REAL y comprensible?\n` +
      `- Si la selección del árbol indica una necesidad concreta (ej. "El agua nos enferma"), es coherente aunque el relato sea pobre.\n` +
      `- Si es texto aleatorio, caracteres sin sentido, está vacío, o claramente no es una necesidad (p. ej. relato "asdf jkl qwe" con selección genérica "Otra cosa"), pon coherente=false con un motivo breve y NO inventes los demás campos.\n` +
      `Si coherente=true, estructura la necesidad en lenguaje institucional, sin inventar datos personales, y asigna el ODS oficial pertinente al área/facultad.\n\n` +
      `Área elegida: ${input.area}\n` +
      `Qué pasa: ${input.quePasa}\n` +
      `Distrito: ${input.distrito}\n` +
      `Familias afectadas: ${input.familias}\n` +
      `Qué quieren lograr: ${input.aspiracion || "(no especificado)"}\n` +
      `Urgencia declarada: ${input.urgenciaCiudadana || "(no especificada)"}${input.emergencia ? " — vino por PUNKU Emergencias" : ""}\n` +
      `Relato libre: ${input.relato || "(sin relato)"}\n\n` +
      `Usa la herramienta registrar_expediente.`;

    const resp = await withTimeout(
      client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "tool", name: TOOL_SCHEMA.name },
        messages: [{ role: "user", content: prompt }],
      }),
      TIMEOUT_MS
    );

    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;

    if (block && typeof block.input?.coherente === "boolean") {
      const o = block.input;
      // Caso INCOHERENTE: no se inventa contenido, se devuelve la señal.
      if (o.coherente === false) {
        return {
          ...clasificarPorReglas(input),
          coherente: false,
          motivo: o.motivo || "El texto ingresado no describe una necesidad clara.",
          clasificado_por: "ia",
        };
      }
      // Caso COHERENTE válido.
      if (validarClasificacion(o)) {
        return {
          coherente: true,
          motivo: "",
          categoria: o.categoria as CatId,
          modalidad: o.modalidad,
          urgencia: input.emergencia ? "alta" : o.urgencia, // emergencia siempre prioriza
          facultades_sugeridas: o.facultades_sugeridas.slice(0, 3),
          ods_sugerido: o.ods_sugerido,
          resumen_formal: o.resumen_formal,
          objetivo_sugerido: o.objetivo_sugerido,
          meta_sugerida: o.meta_sugerida,
          confianza: Math.max(0, Math.min(1, o.confianza)),
          clasificado_por: "ia",
        };
      }
    }
    // JSON inválido -> fallback.
    return clasificarPorReglas(input);
  } catch {
    // Falla / timeout / sin saldo -> fallback. La demo NUNCA se cae.
    return clasificarPorReglas(input);
  }
}

/* ============================================================
   SUGERENCIAS DE B4 (botones "Sugerir con IA")
   IA real cuando hay key; plantilla como fallback. Evalúa coherencia también.
   ============================================================ */
export type CampoB4 = "objetivoGen" | "objetivosEsp" | "metas" | "evaluacion";

const INSTR_B4: Record<CampoB4, string> = {
  objetivoGen: "redacta el OBJETIVO GENERAL del proyecto en UNA sola oración formal, empezando con un verbo en infinitivo (Contribuir/Mejorar/Garantizar/Fortalecer…).",
  objetivosEsp: "redacta 3 OBJETIVOS ESPECÍFICOS, uno por línea, cada uno empezando con \"• \" y un verbo en infinitivo.",
  metas: "redacta de 1 a 3 METAS cuantitativas y verificables (con números y plazos), una por línea con \"• \".",
  evaluacion: "redacta los INDICADORES DE EVALUACIÓN Y MONITOREO, de 3 a 4 líneas verificables, una por línea con \"• \".",
};

const SUGERIR_SCHEMA = {
  name: "sugerir_campo",
  description: "Redacta el campo solicitado del proyecto de proyección social, o indica si no hay información suficiente.",
  input_schema: {
    type: "object" as const,
    properties: {
      coherente: { type: "boolean", description: "true si el expediente tiene una necesidad real y suficiente para redactar el campo; false si el resumen es vacío o sin sentido." },
      motivo: { type: "string", description: "Si coherente=false, motivo breve." },
      texto: { type: "string", description: "El texto redactado del campo (si coherente=true)." },
    },
    required: ["coherente"],
  },
};

function plantillaB4(exp: Expediente, campo: CampoB4): string {
  if (campo === "objetivoGen") {
    return `Contribuir a que ${exp.comunidad} logre ${exp.resultado_deseado ? "“" + exp.resultado_deseado.replace(/\.$/, "") + "”" : "atender su necesidad"}, mediante el acompañamiento técnico y académico de la UNCP, en beneficio de ${exp.familias_afectadas} familias del distrito de ${exp.distrito}.`;
  }
  if (campo === "objetivosEsp") {
    return `• Realizar un diagnóstico participativo de la situación junto a la comunidad.\n• Diseñar y ejecutar acciones pertinentes con los beneficiarios.\n• Fortalecer capacidades locales para dar sostenibilidad a los resultados.`;
  }
  if (campo === "evaluacion") {
    return `• N.° de familias participantes y beneficiadas.\n• % de avance respecto al cronograma.\n• Cumplimiento de metas por objetivo específico.\n• Nivel de satisfacción de la comunidad (encuesta breve).`;
  }
  return `• ${exp.familias_afectadas} familias beneficiadas con la intervención.\n• 1 diagnóstico y 1 plan de trabajo elaborados en 6 meses.\n• Al menos 80% de cumplimiento de las actividades programadas.`;
}

export async function sugerirCampoB4(exp: Expediente, campo: CampoB4): Promise<SugerenciaB4> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { coherente: true, texto: plantillaB4(exp, campo), motivo: "", generado_por: "plantilla" };

  try {
    const client = new Anthropic({ apiKey });
    const prompt =
      `Eres asistente de la Dirección de Proyección Social de la UNCP, redactando un proyecto.\n` +
      `Contexto del expediente (necesidad real registrada por la comunidad):\n` +
      `- Comunidad: ${exp.comunidad} (${exp.distrito}, Huancayo, Junín)\n` +
      `- Familias afectadas: ${exp.familias_afectadas}\n` +
      `- Área: ${catOf(exp.categoria)?.es || exp.categoria}\n` +
      `- Resumen de la necesidad: ${exp.resumen_formal}\n` +
      `- Lo que la comunidad quiere lograr: ${exp.resultado_deseado || "(no especificado)"}\n` +
      `- Facultad(es) sugerida(s): ${exp.facultades_sugeridas.join(", ") || "(sin asignar)"}\n\n` +
      `PRIMERO evalúa coherente: ¿el expediente describe una necesidad real y suficiente para redactar este campo? Si el resumen está vacío o es texto sin sentido, coherente=false.\n` +
      `Si coherente=true, ${INSTR_B4[campo]} Devuelve solo el texto del campo, sin encabezados.\n` +
      `Usa la herramienta sugerir_campo.`;

    const resp = await withTimeout(
      client.messages.create({
        model: MODEL,
        max_tokens: 512,
        tools: [SUGERIR_SCHEMA],
        tool_choice: { type: "tool", name: SUGERIR_SCHEMA.name },
        messages: [{ role: "user", content: prompt }],
      }),
      TIMEOUT_MS
    );

    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    if (block && typeof block.input?.coherente === "boolean") {
      const o = block.input;
      if (o.coherente === false) {
        return { coherente: false, texto: "", motivo: o.motivo || "No hay información suficiente para redactar este campo.", generado_por: "ia" };
      }
      if (typeof o.texto === "string" && o.texto.trim().length > 5) {
        return { coherente: true, texto: o.texto.trim(), motivo: "", generado_por: "ia" };
      }
    }
    // Salida inválida -> plantilla.
    return { coherente: true, texto: plantillaB4(exp, campo), motivo: "", generado_por: "plantilla" };
  } catch {
    return { coherente: true, texto: plantillaB4(exp, campo), motivo: "", generado_por: "plantilla" };
  }
}

/* ============================================================
   CO-CONSTRUCCIÓN POR WHATSAPP (spec handoff §3)
   ------------------------------------------------------------
   La IA genera preguntas con opciones numeradas para datos que SOLO la
   comunidad tiene (su meta, plazos, aportes). El coordinador las manda por
   WhatsApp; la comunidad responde con números; un parser DETERMINISTA traduce
   esas elecciones a texto formal de B4. Si hay IA, pule la redacción.
   El parser es la fuente fiable: la demo nunca se cae.
   ============================================================ */
export interface CocoOption { label: string; formal: string }
export interface CocoPregunta { field: string; q: string; options: CocoOption[] }
const COCO_FIELDS = ["objetivoGen", "metas", "recursos", "metodologia"];

/** Banco de preguntas por categoría (fallback / demo). En producción lo genera Haiku. */
function bancoPreguntas(exp: Expediente): CocoPregunta[] {
  const infra: CocoPregunta[] = [
    { field: "objetivoGen", q: "¿Cuál es su meta principal?", options: [
      { label: "Tener un local comunal con buena electricidad", formal: "contar con un local comunal dotado de servicio eléctrico confiable, que funcione como centro de servicios e integración" },
      { label: "Mejorar la red eléctrica de las casas", formal: "mejorar y ampliar la red de distribución eléctrica domiciliaria de la comunidad" },
      { label: "Ambas cosas", formal: "mejorar el abastecimiento eléctrico y, a la vez, contar con un local comunal que concentre los servicios" },
    ] },
    { field: "metas", q: "¿En cuánto tiempo lo necesitan?", options: [
      { label: "Urgente, este mes", formal: "atención urgente en el plazo de 1 mes" },
      { label: "Este año", formal: "ejecución dentro del presente año (horizonte de 6 a 12 meses)" },
      { label: "Puede esperar al próximo año", formal: "ejecución planificada para el próximo periodo" },
    ] },
    { field: "recursos", q: "¿Cuántas personas de la comunidad ayudarían en la obra?", options: [
      { label: "Pocas (5–10)", formal: "aporte de mano de obra comunal de 5 a 10 personas" },
      { label: "Varias (10–30)", formal: "aporte de mano de obra comunal de 10 a 30 personas" },
      { label: "Muchas (30+)", formal: "aporte de mano de obra comunal de más de 30 personas" },
    ] },
    { field: "metodologia", q: "¿Con qué ya cuentan ustedes?", options: [
      { label: "Terreno para el local", formal: "la comunidad aporta el terreno saneado para la edificación" },
      { label: "Algunos materiales", formal: "la comunidad aporta parte de los materiales de construcción" },
      { label: "Solo mano de obra", formal: "la comunidad aporta principalmente mano de obra y organización" },
    ] },
  ];
  const generico: CocoPregunta[] = [
    { field: "objetivoGen", q: "¿Cuál es su meta principal?", options: [
      { label: "Resolver el problema de raíz", formal: "dar solución integral y sostenible a la necesidad planteada" },
      { label: "Una mejora rápida por ahora", formal: "lograr una mejora inmediata que alivie la situación" },
      { label: "Capacitarnos para hacerlo nosotros", formal: "fortalecer capacidades locales para sostener la solución en el tiempo" },
    ] },
    { field: "metas", q: "¿En cuánto tiempo lo necesitan?", options: [
      { label: "Urgente, este mes", formal: "atención urgente en el plazo de 1 mes" },
      { label: "Este año", formal: "ejecución dentro del presente año" },
      { label: "Puede esperar", formal: "ejecución planificada a mediano plazo" },
    ] },
    { field: "recursos", q: "¿Cuántas personas de la comunidad participarían?", options: [
      { label: "Pocas (5–10)", formal: "participación de 5 a 10 personas de la comunidad" },
      { label: "Varias (10–30)", formal: "participación de 10 a 30 personas de la comunidad" },
      { label: "Muchas (30+)", formal: "participación de más de 30 personas de la comunidad" },
    ] },
  ];
  return exp.categoria === "infra" ? infra : generico;
}

function validarPreguntas(arr: any): arr is CocoPregunta[] {
  return Array.isArray(arr) && arr.length > 0 && arr.length <= 6 && arr.every((q) =>
    q && COCO_FIELDS.includes(q.field) && typeof q.q === "string" && q.q.length > 3 &&
    Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4 &&
    q.options.every((o: any) => o && typeof o.label === "string" && typeof o.formal === "string"));
}

const PREGUNTAS_SCHEMA = {
  name: "armar_preguntas",
  description: "Arma 3 a 4 preguntas con opciones numeradas para que una comunidad rural responda con números, para completar su solicitud.",
  input_schema: {
    type: "object" as const,
    properties: {
      preguntas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: { type: "string", enum: COCO_FIELDS, description: "Campo de B4 que esta pregunta ayuda a llenar." },
            q: { type: "string", description: "Pregunta en lenguaje simple y cercano." },
            options: {
              type: "array",
              items: { type: "object", properties: { label: { type: "string", description: "Opción simple para el ciudadano." }, formal: { type: "string", description: "Fragmento en lenguaje institucional UNCP." } }, required: ["label", "formal"] },
            },
          },
          required: ["field", "q", "options"],
        },
      },
    },
    required: ["preguntas"],
  },
};

/* Solo se pregunta lo GENUINAMENTE pendiente: nunca lo que el ciudadano ya eligió
   con botones (aspiración -> objetivoGen, urgencia -> metas/plazo, familias) ni lo
   que el coordinador ya llenó en B4 (campos ámbar pasados en `camposLlenos`). */
function camposPendientesCoco(exp: Expediente, camposLlenos: string[]): string[] {
  const resueltos = new Set<string>((camposLlenos || []).filter((c) => COCO_FIELDS.includes(c)));
  if (exp.resultado_deseado && exp.resultado_deseado.trim()) resueltos.add("objetivoGen"); // la comunidad ya dio su meta
  if (exp.urgencia_ciudadana && exp.urgencia_ciudadana.trim()) resueltos.add("metas");      // ya eligió plazo/urgencia
  return COCO_FIELDS.filter((f) => !resueltos.has(f));
}

export async function generarPreguntasCoco(exp: Expediente, camposLlenos: string[] = []): Promise<{ preguntas: CocoPregunta[]; generado_por: "ia" | "banco" | "ninguno" }> {
  const pendientes = camposPendientesCoco(exp, camposLlenos);
  // Si la comunidad y el coordinador ya cubrieron todo, no se inventan preguntas.
  if (pendientes.length === 0) return { preguntas: [], generado_por: "ninguno" };

  const banco = () => bancoPreguntas(exp).filter((q) => pendientes.includes(q.field));
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { preguntas: banco(), generado_por: "banco" };

  try {
    const client = new Anthropic({ apiKey });
    const yaResuelto: string[] = [];
    if (exp.resultado_deseado && exp.resultado_deseado.trim()) yaResuelto.push(`la META/objetivo (la comunidad ya la indicó: "${exp.resultado_deseado}")`);
    if (exp.urgencia_ciudadana && exp.urgencia_ciudadana.trim()) yaResuelto.push(`el PLAZO/urgencia (la comunidad ya lo eligió)`);
    if (exp.familias_afectadas) yaResuelto.push(`el número de FAMILIAS beneficiarias (${exp.familias_afectadas})`);
    const FIELD_DESC: Record<string, string> = { objetivoGen: "objetivoGen (su meta principal)", metas: "metas (plazo)", recursos: "recursos (aportes/personas)", metodologia: "metodologia (con qué cuentan)" };

    const prompt =
      `Eres asistente de la Dirección de Proyección Social de la UNCP. Una comunidad rural de Huancayo registró una necesidad y faltan datos que SOLO la comunidad tiene.\n` +
      `Arma preguntas MUY simples (1 a ${pendientes.length}), con 3 opciones numeradas cada una, para que la comunidad responda por WhatsApp escribiendo números (ej. "1 2 1").\n` +
      `Genera preguntas SOLO para estos campos pendientes: ${pendientes.map((f) => FIELD_DESC[f] || f).join(", ")}.\n` +
      (yaResuelto.length ? `NO vuelvas a preguntar por nada de esto, que la comunidad YA resolvió con botones: ${yaResuelto.join("; ")}.\n` : "") +
      `Para cada opción da: label (lo que lee el ciudadano, simple) y formal (el mismo sentido en lenguaje institucional para el formato UNCP).\n\n` +
      `Comunidad: ${exp.comunidad} (${exp.distrito}, Huancayo)\n` +
      `Área tentativa: ${catOf(exp.categoria)?.es || exp.categoria}\n` +
      `Lo que se sabe: ${exp.resumen_formal}\n` +
      `Relato de la comunidad: ${exp.necesidad_texto || "(muy breve)"}\n\n` +
      `Usa la herramienta armar_preguntas.`;

    const resp = await withTimeout(
      client.messages.create({ model: MODEL, max_tokens: 1024, tools: [PREGUNTAS_SCHEMA], tool_choice: { type: "tool", name: PREGUNTAS_SCHEMA.name }, messages: [{ role: "user", content: prompt }] }),
      TIMEOUT_MS
    );
    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    if (block && validarPreguntas(block.input?.preguntas)) {
      // Refuerzo determinista: aunque la IA se desvíe, se descarta lo ya resuelto.
      const filtered = (block.input.preguntas as CocoPregunta[]).filter((q) => pendientes.includes(q.field)).slice(0, 4);
      if (filtered.length === 0) return { preguntas: banco(), generado_por: "banco" };
      return { preguntas: filtered, generado_por: "ia" };
    }
    return { preguntas: banco(), generado_por: "banco" };
  } catch {
    return { preguntas: banco(), generado_por: "banco" };
  }
}

export interface CocoResumen { q: string; choiceLabel: string; field: string }

/** Parser DETERMINISTA (handoff §3.4): mapea números↔opciones y compone texto formal por campo. */
function interpretarDeterminista(exp: Expediente, preguntas: CocoPregunta[], respuesta: string): { updates: Record<string, string>; resumen: CocoResumen[] } {
  const nums = (respuesta.match(/\d+/g) || []).map(Number);
  const resumen: CocoResumen[] = [];
  const byField: Record<string, string> = {};
  preguntas.forEach((q, i) => {
    const n = nums[i];
    if (!n) return;
    let choice: CocoOption, extra = "";
    if (n >= 1 && n <= q.options.length) { choice = q.options[n - 1]; }
    else { choice = q.options[q.options.length - 1]; extra = ` (la comunidad indicó ${n})`; }
    resumen.push({ q: q.q, choiceLabel: choice.label + (extra ? ` · ${n}` : ""), field: q.field });
    const phrase = choice.formal + extra;
    byField[q.field] = byField[q.field] ? `${byField[q.field]}; ${phrase}` : phrase;
  });
  const fam = exp.familias_afectadas || "las";
  const updates: Record<string, string> = {};
  Object.keys(byField).forEach((field) => {
    if (field === "objetivoGen") {
      updates.objetivoGen = `Contribuir a que ${exp.comunidad} logre ${byField.objetivoGen}, con el acompañamiento técnico y académico de la UNCP, en beneficio de ${fam} familias de ${exp.distrito}.`;
    } else if (field === "metas") {
      updates.metas = `Plazo acordado con la comunidad: ${byField.metas}. Meta: atender a ${fam} familias beneficiarias dentro de ese periodo.`;
    } else if (field === "recursos") {
      updates.recursos = `Aporte de la comunidad: ${byField.recursos}. La UNCP aporta asesoría técnica y acompañamiento de estudiantes y docente.`;
    } else if (field === "metodologia") {
      const t = byField.metodologia;
      updates.metodologia = `Trabajo participativo por fases (diagnóstico, diseño, ejecución, evaluación). ${t.charAt(0).toUpperCase() + t.slice(1)}.`;
    } else {
      updates[field] = byField[field];
    }
  });
  return { updates, resumen };
}

const PULIR_SCHEMA = {
  name: "pulir_campos",
  description: "Mejora la redacción institucional de cada texto, manteniendo EXACTAMENTE el mismo sentido y los datos. No inventa información nueva.",
  input_schema: {
    type: "object" as const,
    properties: {
      campos: { type: "array", items: { type: "object", properties: { field: { type: "string" }, texto: { type: "string" } }, required: ["field", "texto"] } },
    },
    required: ["campos"],
  },
};

export async function interpretarRespuestaCoco(exp: Expediente, preguntas: CocoPregunta[], respuesta: string): Promise<{ updates: Record<string, string>; resumen: CocoResumen[]; generado_por: "parser" | "ia" }> {
  const base = interpretarDeterminista(exp, preguntas, respuesta);
  if (Object.keys(base.updates).length === 0) return { ...base, generado_por: "parser" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ...base, generado_por: "parser" };
  try {
    const client = new Anthropic({ apiKey });
    const entradas = Object.entries(base.updates).map(([field, texto]) => `- ${field}: ${texto}`).join("\n");
    const prompt =
      `Eres redactor de la Dirección de Proyección Social de la UNCP. Pule la redacción de estos campos de un proyecto, ` +
      `manteniendo EXACTAMENTE el mismo sentido, los mismos datos y sin inventar nada nuevo. Devuelve cada campo con su mismo identificador.\n\n${entradas}\n\nUsa la herramienta pulir_campos.`;
    const resp = await withTimeout(
      client.messages.create({ model: MODEL, max_tokens: 700, tools: [PULIR_SCHEMA], tool_choice: { type: "tool", name: PULIR_SCHEMA.name }, messages: [{ role: "user", content: prompt }] }),
      TIMEOUT_MS
    );
    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    const campos = block?.input?.campos;
    if (Array.isArray(campos)) {
      const pulido = { ...base.updates };
      for (const c of campos) {
        if (c && typeof c.field === "string" && typeof c.texto === "string" && c.texto.trim().length > 10 && c.field in pulido) {
          pulido[c.field] = c.texto.trim();
        }
      }
      return { updates: pulido, resumen: base.resumen, generado_por: "ia" };
    }
    return { ...base, generado_por: "parser" };
  } catch {
    return { ...base, generado_por: "parser" };
  }
}
