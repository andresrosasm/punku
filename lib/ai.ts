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
import { CATEGORIES, FAC_POR_CAT, ODS_MAP, catOf, pareceBasura, type CatId } from "./punku-data";

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
export type CampoB4 = "objetivoGen" | "objetivosEsp" | "metas" | "metodologia" | "recursos" | "evaluacion";

const INSTR_B4: Record<CampoB4, string> = {
  objetivoGen: "redacta el OBJETIVO GENERAL del proyecto en UNA sola oración formal, empezando con un verbo en infinitivo (Contribuir/Mejorar/Garantizar/Fortalecer…).",
  objetivosEsp: "redacta 3 OBJETIVOS ESPECÍFICOS, uno por línea, cada uno empezando con \"• \" y un verbo en infinitivo.",
  metas: "redacta de 1 a 3 METAS cuantitativas y verificables (con números y plazos), una por línea con \"• \".",
  metodologia: "redacta la METODOLOGÍA DE TRABAJO en 2 a 4 líneas: enfoque participativo, fases (diagnóstico, diseño, ejecución, evaluación), técnicas y participación de la comunidad.",
  recursos: "redacta los RECURSOS (materiales, humanos y financieros) necesarios en 2 a 3 líneas, incluyendo el aporte de la comunidad y el acompañamiento de la UNCP (estudiantes y docente).",
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
  if (campo === "metodologia") {
    return `Enfoque participativo en fases: (1) diagnóstico con la comunidad, (2) diseño técnico, (3) ejecución acompañada y (4) evaluación. Se prioriza la mano de obra y el conocimiento local de la comunidad.`;
  }
  if (campo === "recursos") {
    return `Recursos humanos: equipo de estudiantes y docente asesor de la UNCP. Materiales y mano de obra aportados por la comunidad. Financiamiento a gestionar según el plan de trabajo.`;
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
   CO-CONSTRUCCIÓN POR WHATSAPP — reconstrucción de CONTEXTO ciudadano
   ------------------------------------------------------------
   MODELO: hay dos universos de campos en B4.
   · CONTEXTO ciudadano (problema real, qué quiere lograr, cuántas familias,
     qué aporta la comunidad): lo da el CIUDADANO. El módulo WhatsApp SOLO
     pregunta por esto, en lenguaje simple con opciones numeradas.
   · ACADÉMICO (objetivo general, objetivos específicos, metas, metodología,
     evaluación): lo redacta SIEMPRE la UNCP con "Sugerir con IA". El módulo
     WhatsApp NUNCA pregunta por esto.
   La IA genera las preguntas de contexto (banco como fallback); un parser
   determinista interpreta la respuesta y reconstruye el contexto del expediente.
   ============================================================ */
type CocoDim = "problema" | "objetivo" | "familias" | "aportes";
const COCO_DIMS: CocoDim[] = ["problema", "objetivo", "familias", "aportes"];
export interface CocoOption { label: string; formal?: string; familias?: number }
export interface CocoPregunta { dim: CocoDim; q: string; options: CocoOption[] }

/* ----- Banco de opciones de CONTEXTO (fallback / demo). En producción Haiku
   genera las de problema/objetivo/aportes; familias usa siempre estas (números). ----- */
const PROBLEMA_BANK: Record<string, CocoOption[]> = {
  agro: [
    { label: "Mis animales se enferman", formal: "afectación sanitaria del ganado que reduce la producción y los ingresos familiares" },
    { label: "Mis cultivos rinden poco", formal: "baja productividad de los cultivos por falta de asistencia técnica" },
    { label: "No vendo bien mi producto", formal: "dificultades de comercialización y acceso a mercado de la producción local" },
  ],
  salud: [
    { label: "La posta de salud está muy lejos", formal: "baja accesibilidad a servicios de atención primaria de salud por distancia" },
    { label: "El agua nos enferma", formal: "afectación de la salud comunitaria por consumo de agua no segura" },
    { label: "Faltan campañas y atención médica", formal: "ausencia de campañas de salud preventiva y atención médica periódica" },
  ],
  agua: [
    { label: "El agua del río está contaminada", formal: "presunta contaminación hídrica que afecta el consumo y los medios de vida" },
    { label: "No tenemos agua segura para tomar", formal: "falta de acceso a agua apta para consumo humano" },
    { label: "Falta desagüe / saneamiento", formal: "carencia de saneamiento básico y manejo de aguas residuales" },
  ],
  educ: [
    { label: "Los niños necesitan reforzamiento", formal: "necesidad de reforzamiento escolar para niños y niñas de la comunidad" },
    { label: "Queremos aprender un oficio", formal: "demanda de capacitación técnica y formación en oficios" },
    { label: "Faltan materiales para estudiar", formal: "carencia de materiales y recursos educativos" },
  ],
  cultura: [
    { label: "Los jóvenes se van de la comunidad", formal: "migración de jóvenes y pérdida de arraigo comunitario" },
    { label: "Se pierden nuestras costumbres", formal: "riesgo de pérdida de tradiciones e identidad cultural local" },
    { label: "Falta unión en la comunidad", formal: "debilitamiento del tejido social y la organización comunal" },
  ],
  infra: [
    { label: "No tenemos buena electricidad", formal: "abastecimiento eléctrico deficiente o inexistente en la comunidad" },
    { label: "El camino está en mal estado", formal: "vías de acceso deterioradas que dificultan el transporte y los servicios" },
    { label: "Nos falta un local comunal", formal: "ausencia de un local comunal para servicios e integración" },
  ],
};
const PROBLEMA_DEFAULT: CocoOption[] = [
  { label: "Un servicio o necesidad básica nos falta", formal: "carencia de un servicio o necesidad básica en la comunidad" },
  { label: "Algo que tenemos está en mal estado", formal: "deterioro de un bien o servicio comunitario existente" },
  { label: "Necesitamos apoyo y orientación", formal: "necesidad de acompañamiento técnico y orientación de la UNCP" },
];
const OBJETIVO_OPTS: CocoOption[] = [
  { label: "Resolver el problema de raíz", formal: "una solución integral y sostenible a su necesidad" },
  { label: "Una mejora concreta para empezar", formal: "una mejora concreta que alivie la situación" },
  { label: "Que nos capaciten para sostenerlo", formal: "fortalecer sus capacidades locales para sostener la solución" },
];
const FAMILIAS_OPTS: CocoOption[] = [
  { label: "Pocas (menos de 20)", familias: 15 },
  { label: "Varias (entre 20 y 80)", familias: 50 },
  { label: "Muchas (más de 80)", familias: 120 },
];
const APORTES_OPTS: CocoOption[] = [
  { label: "Mano de obra (las personas trabajan)", formal: "mano de obra y participación activa de la comunidad" },
  { label: "Materiales o terreno que ya tenemos", formal: "materiales locales y/o terreno disponible aportado por la comunidad" },
  { label: "Solo organización; necesitamos casi todo", formal: "organización comunal; se requiere apoyo externo en materiales y recursos" },
];

function preguntaDe(dim: CocoDim, exp: Expediente): CocoPregunta {
  if (dim === "problema") return { dim, q: "¿Cuál es el problema principal en tu comunidad?", options: PROBLEMA_BANK[exp.categoria] || PROBLEMA_DEFAULT };
  if (dim === "objetivo") return { dim, q: "¿Qué quieren lograr?", options: OBJETIVO_OPTS };
  if (dim === "familias") return { dim, q: "¿A cuántas familias afecta?", options: FAMILIAS_OPTS };
  return { dim, q: "¿Con qué puede aportar la comunidad?", options: APORTES_OPTS };
}

const SUSTANCIA_SCHEMA = {
  name: "evaluar_sustancia",
  description: "Juzga si el PROBLEMA descrito en el expediente está claro y tiene sustancia real, o si es ininteligible/vacío/genérico (aunque la frase tenga estructura coherente y traiga número de familias).",
  input_schema: {
    type: "object" as const,
    properties: {
      problema_claro: { type: "boolean", description: "true si el problema de la comunidad se entiende y tiene contenido real; false si es ininteligible, vacío, basura/mash de teclado, o solo describe que falta información." },
      motivo: { type: "string", description: "Motivo breve." },
    },
    required: ["problema_claro"],
  },
};

/** ¿El contexto del problema es INSUFICIENTE (ininteligible/vacío/basura) y necesita
 *  reconstrucción? Evalúa la SUSTANCIA del relato/resumen, NO la plantilla. Haiku es el
 *  juez; fallback determinista (pareceBasura). Patrón IA aislada + fallback. */
export async function evaluarSustanciaContexto(exp: Expediente): Promise<boolean> {
  const det = pareceBasura(exp.resumen_formal) || pareceBasura(exp.necesidad_texto);
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return det;
  try {
    const client = new Anthropic({ apiKey });
    const prompt =
      `Eres analista de la Dirección de Proyección Social de la UNCP. Lee el problema reportado por una comunidad y juzga su SUSTANCIA, no su forma.\n` +
      `Pon problema_claro=false si el problema es ininteligible, vacío, genérico sin contenido, o basura/mash de teclado — AUNQUE la oración tenga estructura coherente o traiga número de familias.\n` +
      `Pon problema_claro=true solo si se entiende un problema real y concreto de la comunidad.\n\n` +
      `Resumen del expediente: ${exp.resumen_formal || "(vacío)"}\n` +
      `Relato de la comunidad: ${exp.necesidad_texto || "(vacío)"}\n` +
      `Área tentativa: ${catOf(exp.categoria)?.es || exp.categoria}\n\n` +
      `Usa la herramienta evaluar_sustancia.`;
    const resp = await withTimeout(
      client.messages.create({ model: MODEL, max_tokens: 256, tools: [SUSTANCIA_SCHEMA], tool_choice: { type: "tool", name: SUSTANCIA_SCHEMA.name }, messages: [{ role: "user", content: prompt }] }),
      TIMEOUT_MS
    );
    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    if (block && typeof block.input?.problema_claro === "boolean") return !block.input.problema_claro;
    return det;
  } catch {
    return det;
  }
}

/* Solo se pregunta el CONTEXTO genuinamente pendiente. NUNCA campos académicos.
   - problema: si el contexto es INSUFICIENTE por sustancia (relato basura/ininteligible),
     no solo por el flag datos_incompletos.
   - objetivo: si la comunidad no eligió aspiración (resultado_deseado vacío).
   - familias: si no hay número de familias.
   - aportes:  si el campo Recursos (contexto) aún está vacío.
   Si el problema es insuficiente SIEMPRE incluye "problema" -> el módulo no queda sin preguntas. */
function dimensionesPendientes(exp: Expediente, recursosLleno: boolean, insuficiente: boolean): CocoDim[] {
  const out: CocoDim[] = [];
  if (insuficiente) out.push("problema");
  if (!(exp.resultado_deseado && exp.resultado_deseado.trim())) out.push("objetivo");
  if (!exp.familias_afectadas) out.push("familias");
  if (!recursosLleno) out.push("aportes");
  return out;
}

function validarPreguntasIA(arr: any): boolean {
  return Array.isArray(arr) && arr.length > 0 && arr.every((q) =>
    q && (q.dim === "problema" || q.dim === "objetivo" || q.dim === "aportes") && typeof q.q === "string" && q.q.length > 3 &&
    Array.isArray(q.options) && q.options.length >= 2 && q.options.length <= 4 &&
    q.options.every((o: any) => o && typeof o.label === "string" && typeof o.formal === "string"));
}

const PREGUNTAS_SCHEMA = {
  name: "armar_preguntas_contexto",
  description: "Arma preguntas de CONTEXTO (lenguaje ciudadano) con opciones numeradas para que una comunidad rural reconstruya su contexto por WhatsApp. NUNCA preguntes por campos académicos (objetivo general, objetivos específicos, metas, metodología, evaluación): esos los redacta la UNCP.",
  input_schema: {
    type: "object" as const,
    properties: {
      preguntas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            dim: { type: "string", enum: ["problema", "objetivo", "aportes"], description: "Dimensión de contexto: problema (cuál es el problema real), objetivo (qué quieren lograr, simple), aportes (qué aporta la comunidad)." },
            q: { type: "string", description: "Pregunta en lenguaje simple y cercano (no técnico)." },
            options: {
              type: "array",
              items: { type: "object", properties: { label: { type: "string", description: "Opción simple para el ciudadano." }, formal: { type: "string", description: "El mismo sentido en lenguaje institucional UNCP." } }, required: ["label", "formal"] },
            },
          },
          required: ["dim", "q", "options"],
        },
      },
    },
    required: ["preguntas"],
  },
};

export async function generarPreguntasCoco(exp: Expediente, camposLlenos: string[] = []): Promise<{ preguntas: CocoPregunta[]; generado_por: "ia" | "banco" | "ninguno" }> {
  const recursosLleno = (camposLlenos || []).includes("recursos");
  // El "problema" se pregunta si el contexto es INSUFICIENTE por sustancia (no solo por el flag).
  const insuficiente = !!exp.datos_incompletos || (await evaluarSustanciaContexto(exp));
  const dims = dimensionesPendientes(exp, recursosLleno, insuficiente);
  // En caso bueno totalmente contextualizado puede no faltar nada; en basura SIEMPRE hay "problema".
  if (dims.length === 0) return { preguntas: [], generado_por: "ninguno" };

  const banco = (): CocoPregunta[] => dims.map((d) => preguntaDe(d, exp));
  const apiKey = process.env.ANTHROPIC_API_KEY;
  // "familias" siempre del banco (necesita números); Haiku solo arma las de texto.
  const dimsTexto: CocoDim[] = dims.filter((d) => d !== "familias");
  if (!apiKey || dimsTexto.length === 0) return { preguntas: banco(), generado_por: "banco" };

  try {
    const client = new Anthropic({ apiKey });
    const DIM_DESC: Record<string, string> = { problema: "problema (cuál es el problema REAL en su comunidad)", objetivo: "objetivo (qué quieren lograr, en lenguaje simple)", aportes: "aportes (con qué puede aportar la comunidad: mano de obra, materiales, terreno, organización)" };
    const prompt =
      `Eres asistente de la Dirección de Proyección Social de la UNCP. Una comunidad rural de Huancayo registró una necesidad y falta reconstruir su CONTEXTO con ella.\n` +
      `Arma preguntas MUY simples (lenguaje ciudadano, no técnico), con 3 opciones numeradas cada una, para que la comunidad responda por WhatsApp escribiendo números (ej. "1 2 1").\n` +
      `Genera preguntas SOLO para estas dimensiones de CONTEXTO pendientes: ${dimsTexto.map((d) => DIM_DESC[d]).join(", ")}.\n` +
      `PROHIBIDO preguntar por campos académicos (objetivo general formal, objetivos específicos, metas, metodología, evaluación): esos los redacta la UNCP, NO el ciudadano.\n` +
      `Para cada opción da: label (lo que lee el ciudadano, simple) y formal (el mismo sentido en lenguaje institucional, para el resumen del expediente).\n\n` +
      `Comunidad: ${exp.comunidad} (${exp.distrito}, Huancayo)\n` +
      `Área tentativa: ${catOf(exp.categoria)?.es || exp.categoria}\n` +
      `Lo que se sabe (puede ser pobre): ${exp.resumen_formal}\n` +
      `Relato de la comunidad (puede ser ininteligible): ${exp.necesidad_texto || "(muy breve)"}\n\n` +
      `Usa la herramienta armar_preguntas_contexto.`;

    const resp = await withTimeout(
      client.messages.create({ model: MODEL, max_tokens: 1024, tools: [PREGUNTAS_SCHEMA], tool_choice: { type: "tool", name: PREGUNTAS_SCHEMA.name }, messages: [{ role: "user", content: prompt }] }),
      TIMEOUT_MS
    );
    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    if (block && validarPreguntasIA(block.input?.preguntas)) {
      const iaPorDim = new Map<string, CocoPregunta>();
      for (const q of block.input.preguntas as CocoPregunta[]) if (dimsTexto.includes(q.dim)) iaPorDim.set(q.dim, q);
      // Ensamblar en el orden pendiente: Haiku para texto (con respaldo banco), banco para familias.
      const preguntas = dims.map((d) => (d !== "familias" && iaPorDim.get(d)) || preguntaDe(d, exp));
      return { preguntas, generado_por: "ia" };
    }
    return { preguntas: banco(), generado_por: "banco" };
  } catch {
    return { preguntas: banco(), generado_por: "banco" };
  }
}

export interface CocoResumen { q: string; choiceLabel: string; dim: CocoDim }
/** Parche de CONTEXTO al expediente (columnas existentes). */
export interface CocoContexto { resultado_deseado?: string; familias_afectadas?: number; resumen_formal?: string; datos_incompletos?: boolean }

/** Parser DETERMINISTA: mapea números↔opciones y reconstruye el CONTEXTO ciudadano. */
function interpretarDeterminista(exp: Expediente, preguntas: CocoPregunta[], respuesta: string): { contexto: CocoContexto; recursos?: string; resumen: CocoResumen[]; resumenRegenerado: boolean } {
  const nums = (respuesta.match(/\d+/g) || []).map(Number);
  const resumen: CocoResumen[] = [];
  const ans: Partial<Record<CocoDim, { choice: CocoOption; n: number }>> = {};
  preguntas.forEach((q, i) => {
    const n = nums[i];
    if (!n) return;
    const choice = (n >= 1 && n <= q.options.length) ? q.options[n - 1] : q.options[q.options.length - 1];
    ans[q.dim] = { choice, n };
    resumen.push({ q: q.q, choiceLabel: choice.label, dim: q.dim });
  });

  const contexto: CocoContexto = {};
  let recursos: string | undefined;
  let resumenRegenerado = false;
  if (ans.objetivo?.choice.formal) contexto.resultado_deseado = ans.objetivo.choice.formal;
  if (ans.familias?.choice.familias) contexto.familias_afectadas = ans.familias.choice.familias;
  const aporte = ans.aportes?.choice.formal;
  if (aporte) recursos = `Aporte de la comunidad: ${aporte}. La UNCP aporta asesoría técnica y acompañamiento de estudiantes y docente.`;
  if (ans.problema?.choice.formal) {
    // CASO BASURA: el contexto era ilegible → se reconstruye COMPLETO (incluye el aporte) y se pule.
    const prob = ans.problema.choice.formal;
    const obj = contexto.resultado_deseado || (exp.resultado_deseado || "");
    const fam = contexto.familias_afectadas ?? exp.familias_afectadas;
    contexto.resumen_formal =
      `La comunidad de ${exp.comunidad} (${exp.distrito}, Huancayo) reporta: ${prob}.` +
      (obj ? ` Busca ${obj}.` : "") +
      (fam ? ` Afecta aproximadamente a ${fam} familias.` : "") +
      (aporte ? ` La comunidad aporta ${aporte}.` : "") +
      ` Requiere acompañamiento técnico de la UNCP. (Contexto reconstruido con la comunidad por co-construcción.)`;
    contexto.datos_incompletos = false; // ya no es "basura": el contexto se reconstruyó
    resumenRegenerado = true;
  } else if (aporte && !/La comunidad aporta/i.test(exp.resumen_formal || "")) {
    // CASO BUENO: el resumen ya es válido → NO se reescribe ni se pule; solo se ANEXA el aporte (aditivo, idempotente).
    contexto.resumen_formal = `${(exp.resumen_formal || "").trimEnd()} La comunidad aporta ${aporte}.`.trim();
  }
  return { contexto, recursos, resumen, resumenRegenerado };
}

const PULIR_SCHEMA = {
  name: "pulir_textos",
  description: "Mejora la redacción institucional de cada texto, manteniendo EXACTAMENTE el mismo sentido y los datos. No inventa información nueva.",
  input_schema: {
    type: "object" as const,
    properties: {
      textos: { type: "array", items: { type: "object", properties: { clave: { type: "string" }, texto: { type: "string" } }, required: ["clave", "texto"] } },
    },
    required: ["textos"],
  },
};

export async function interpretarRespuestaCoco(exp: Expediente, preguntas: CocoPregunta[], respuesta: string): Promise<{ contexto: CocoContexto; recursos?: string; resumen: CocoResumen[]; generado_por: "parser" | "ia" }> {
  const base = interpretarDeterminista(exp, preguntas, respuesta);
  const claves: Record<string, string> = {};
  if (base.contexto.resumen_formal && base.resumenRegenerado) claves.resumen_formal = base.contexto.resumen_formal;
  if (base.recursos) claves.recursos = base.recursos;
  if (Object.keys(claves).length === 0) return { ...base, generado_por: "parser" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ...base, generado_por: "parser" };
  try {
    const client = new Anthropic({ apiKey });
    const entradas = Object.entries(claves).map(([clave, texto]) => `- ${clave}: ${texto}`).join("\n");
    const prompt =
      `Eres redactor de la Dirección de Proyección Social de la UNCP. Pule la redacción de estos textos de contexto de un expediente, ` +
      `manteniendo EXACTAMENTE el mismo sentido, los mismos datos y sin inventar nada nuevo. Devuelve cada texto con su misma clave.\n\n${entradas}\n\nUsa la herramienta pulir_textos.`;
    const resp = await withTimeout(
      client.messages.create({ model: MODEL, max_tokens: 600, tools: [PULIR_SCHEMA], tool_choice: { type: "tool", name: PULIR_SCHEMA.name }, messages: [{ role: "user", content: prompt }] }),
      TIMEOUT_MS
    );
    const block = resp.content.find((b) => b.type === "tool_use") as { type: "tool_use"; input: any } | undefined;
    const textos = block?.input?.textos;
    if (Array.isArray(textos)) {
      const contexto = { ...base.contexto };
      let recursos = base.recursos;
      for (const t of textos) {
        if (!t || typeof t.clave !== "string" || typeof t.texto !== "string" || t.texto.trim().length < 10) continue;
        if (t.clave === "resumen_formal" && contexto.resumen_formal) contexto.resumen_formal = t.texto.trim();
        if (t.clave === "recursos" && recursos) recursos = t.texto.trim();
      }
      return { contexto, recursos, resumen: base.resumen, generado_por: "ia" };
    }
    return { ...base, generado_por: "parser" };
  } catch {
    return { ...base, generado_por: "parser" };
  }
}
