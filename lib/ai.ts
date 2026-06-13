/* ============================================================
   PUNKU — Motor de estructuración (IA)  ·  spec 03
   ------------------------------------------------------------
   Interfaz ÚNICA y AISLADA: estructurarNecesidad(input) -> ClasificacionIA.
   El resto del sistema no sabe qué modelo hay detrás. Migrar de Claude a
   DeepSeek/Huawei on-premise (producción) = reemplazar solo este archivo.

   Garantías de la spec:
   · Una sola llamada, timeout 10s, JSON validado contra esquema.
   · Si la IA falla / no responde / sin saldo / timeout / JSON inválido
     -> FALLBACK A REGLAS. El expediente se crea igual. La demo NUNCA se cae.
   · A la IA se le envía SOLO la necesidad anonimizada (sin datos personales).
   ============================================================ */
import Anthropic from "@anthropic-ai/sdk";
import type { NecesidadInput, ClasificacionIA } from "./types";
import { CATEGORIES, FAC_POR_CAT, ODS_MAP, type CatId } from "./punku-data";

const TIMEOUT_MS = 10_000;
const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

/* ---------- Esquema de salida (tool use / structured output) ---------- */
const CAT_IDS = CATEGORIES.map((c) => c.id);

const TOOL_SCHEMA = {
  name: "registrar_expediente",
  description:
    "Estructura la necesidad ciudadana en un Expediente Territorial para la UNCP, en lenguaje institucional.",
  input_schema: {
    type: "object" as const,
    properties: {
      categoria: { type: "string", enum: CAT_IDS, description: "Área de la necesidad." },
      modalidad: { type: "string", enum: ["monovalente", "polivalente"], description: "Polivalente si requiere más de una facultad." },
      urgencia: { type: "string", enum: ["normal", "alta"] },
      facultades_sugeridas: { type: "array", items: { type: "string" }, description: "1 a 3 facultades de la UNCP que pueden atender." },
      ods_sugerido: { type: "string", description: "ODS oficial pertinente (número y nombre)." },
      resumen_formal: { type: "string", description: "Resumen en lenguaje institucional, sin datos personales." },
      objetivo_sugerido: { type: "string", description: "Objetivo general derivado de lo que la comunidad quiere lograr." },
      meta_sugerida: { type: "string", description: "Meta cuantitativa tentativa." },
      confianza: { type: "number", description: "Confianza de la clasificación, 0 a 1." },
    },
    required: ["categoria", "modalidad", "urgencia", "facultades_sugeridas", "ods_sugerido", "resumen_formal", "objetivo_sugerido", "meta_sugerida", "confianza"],
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
   FALLBACK POR REGLAS (resiliencia — spec 03 §6)
   El árbol ya clasifica sin IA: la categoría elegida ES la clasificación.
   ============================================================ */
export function clasificarPorReglas(input: NecesidadInput): ClasificacionIA {
  const cat = input.catId;
  const facultades = FAC_POR_CAT[cat] || [];
  const modalidad = facultades.length > 1 ? "polivalente" : "monovalente";
  const urgencia = input.emergencia || input.urgenciaCiudadana === "alta" ? "alta" : "normal";

  const necesidad = (input.relato && input.relato.trim().length > 8)
    ? input.relato.trim()
    : input.quePasa;

  const resumen_formal =
    `La comunidad del distrito de ${input.distrito} reporta: ${necesidad.toLowerCase()}. ` +
    `Afecta aproximadamente a ${input.familias} familias. ` +
    `Requiere orientación y acompañamiento técnico de la UNCP.`;

  const objetivo_sugerido = input.aspiracion
    ? `Contribuir a que la comunidad logre: ${input.aspiracion.replace(/\.$/, "")}, con el acompañamiento de la UNCP.`
    : `Atender la necesidad identificada en ${input.distrito}, en beneficio de ${input.familias} familias.`;

  return {
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

/** Valida que la salida de la IA cumpla el esquema esperado (spec 03 §7). */
function validar(o: any): o is Omit<ClasificacionIA, "clasificado_por"> {
  return (
    o &&
    typeof o === "object" &&
    CAT_IDS.includes(o.categoria) &&
    (o.modalidad === "monovalente" || o.modalidad === "polivalente") &&
    (o.urgencia === "normal" || o.urgencia === "alta") &&
    Array.isArray(o.facultades_sugeridas) &&
    o.facultades_sugeridas.length > 0 &&
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

  // Sin llave configurada -> fallback inmediato (la demo funciona sin IA).
  if (!apiKey) return clasificarPorReglas(input);

  try {
    const client = new Anthropic({ apiKey });

    // Entrada ANONIMIZADA — sin nombre, teléfono ni DNI (spec 03 §4).
    const prompt =
      `Eres el clasificador territorial de PUNKU para la Universidad Nacional del Centro del Perú (UNCP), Huancayo.\n` +
      `Convierte esta necesidad ciudadana en un Expediente Territorial estructurado, en lenguaje institucional y sin inventar datos.\n\n` +
      `Área elegida: ${input.area}\n` +
      `Qué pasa: ${input.quePasa}\n` +
      `Distrito: ${input.distrito}\n` +
      `Familias afectadas: ${input.familias}\n` +
      `Qué quieren lograr: ${input.aspiracion || "(no especificado)"}\n` +
      `Urgencia declarada: ${input.urgenciaCiudadana || "(no especificada)"}${input.emergencia ? " — vino por PUNKU Emergencias" : ""}\n` +
      `Relato libre: ${input.relato || "(sin relato)"}\n\n` +
      `Asigna el ODS oficial pertinente al área/facultad. Usa la herramienta registrar_expediente.`;

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

    const block = resp.content.find((b) => b.type === "tool_use") as
      | { type: "tool_use"; input: any }
      | undefined;

    if (block && validar(block.input)) {
      const o = block.input;
      return {
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
    // JSON inválido -> fallback.
    return clasificarPorReglas(input);
  } catch {
    // Falla / timeout / sin saldo -> fallback. La demo NUNCA se cae.
    return clasificarPorReglas(input);
  }
}
