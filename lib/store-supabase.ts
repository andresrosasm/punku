/* ============================================================
   PUNKU — Capa de datos en SUPABASE (producción)  ·  specs 02, 04, 05, 06
   ------------------------------------------------------------
   Implementa la misma interfaz que store-memory.ts pero persistiendo en
   Postgres (Supabase). Se usa cuando hay Supabase configurado. Toda la
   escritura va con service_role desde el servidor (las API routes); los
   contactos (sensibles) nunca salen al frontend. Siembra los 7 expedientes
   ficticios de forma idempotente la primera vez.
   ============================================================ */
import { supabaseAdmin } from "./supabase";
import { EXPEDIENTES, ESTADOS, ODS_MAP, type EstadoId, type CatId, type ExpedienteSeed } from "./punku-data";
import type { B4Form } from "./uncp-doc";
import type {
  Expediente, EstadoHistorial, ConsultaPublica, ContactoInput,
  NecesidadInput, ClasificacionIA, TarjetaReconocimiento,
} from "./types";

/* ---------- helpers ---------- */
function fmtFecha(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }).replace(/\./g, "");
}

const MESES: Record<string, string> = { ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06", jul: "07", ago: "08", sep: "09", set: "09", oct: "10", nov: "11", dic: "12" };
function seedDateISO(fecha: string, offsetMin = 0): string {
  // "13 jun 2026" -> ISO; offsetMin desplaza para ordenar el historial.
  const [d, mon, y] = fecha.split(/\s+/);
  const mm = MESES[(mon || "").toLowerCase().slice(0, 3)] || "01";
  const base = Date.parse(`${y}-${mm}-${String(d).padStart(2, "0")}T12:00:00Z`);
  return new Date(base + offsetMin * 60000).toISOString();
}

function CATEGORIES_LABEL(cat: CatId): string {
  const m: Record<CatId, string> = { agro: "Agricultura y ganadería", salud: "Salud", educ: "Educación", agua: "Medio ambiente y agua", cultura: "Cultura y sociedad", infra: "Infraestructura y servicios" };
  return m[cat];
}

function toExp(r: any): Expediente {
  return {
    codigo: r.codigo, comunidad: r.comunidad, distrito: r.distrito,
    familias_afectadas: r.familias_afectadas ?? 0, necesidad_texto: r.necesidad_texto ?? "",
    categoria: r.categoria, facultades_sugeridas: r.facultades_sugeridas ?? [],
    ods_sugerido: r.ods_sugerido ?? "", resultado_deseado: r.resultado_deseado ?? "",
    urgencia_ciudadana: r.urgencia_ciudadana ?? "", foto_url: r.foto_url ?? null,
    modalidad: r.modalidad ?? "", urgencia: r.urgencia ?? "baja", resumen_formal: r.resumen_formal ?? "",
    estado: r.estado ?? "recibido", canal_origen: r.canal_origen ?? "web",
    origen_registro: r.origen_registro ?? "ciudadano", clasificado_por: r.clasificado_por ?? "ia",
    confianza: typeof r.confianza === "number" ? r.confianza : 0, titulo: r.titulo ?? "",
    objetivo_sugerido: r.objetivo_sugerido ?? "", meta_sugerida: r.meta_sugerida ?? "",
    datos_incompletos: !!r.datos_incompletos,
    creado_en: fmtFecha(r.creado_en), actualizado_en: fmtFecha(r.actualizado_en),
  };
}

/* ---------- siembra idempotente ---------- */
let _seeded = false;
function seedRow(s: ExpedienteSeed) {
  const canal_origen = s.canal === "PUNKU Emergencias" ? "emergencias" : "web";
  const iso = seedDateISO(s.fecha);
  return {
    codigo: s.codigo, comunidad: s.comunidad, distrito: s.distrito, familias_afectadas: s.familias,
    necesidad_texto: s.resumen, categoria: s.cat, facultades_sugeridas: s.facultades,
    ods_sugerido: ODS_MAP[s.cat] || "ODS 17 · Alianzas", resultado_deseado: s.aspiracion,
    urgencia_ciudadana: s.urgencia === "alta" ? "alta" : s.urgencia === "media" ? "anio" : "espera",
    foto_url: null, modalidad: s.modalidad, urgencia: s.urgencia, resumen_formal: s.resumen,
    estado: s.estado, canal_origen, origen_registro: "ciudadano", clasificado_por: "ia",
    confianza: s.confianza / 100, titulo: s.titulo,
    objetivo_sugerido: `Contribuir a que ${s.comunidad} logre: ${s.aspiracion.replace(/\.$/, "")}, con el acompañamiento de la UNCP.`,
    meta_sugerida: `${s.familias} familias beneficiadas y un plan de trabajo en 6 meses.`,
    datos_incompletos: false,
    creado_en: iso, actualizado_en: iso,
  };
}

async function ensureSeed(): Promise<void> {
  if (_seeded) return;
  try {
    const sb = supabaseAdmin();
    const codes = EXPEDIENTES.map((e) => e.codigo);
    const { data: existing } = await sb.from("expedientes").select("codigo").in("codigo", codes);
    const have = new Set((existing || []).map((r: any) => r.codigo));
    const missing = EXPEDIENTES.filter((s) => !have.has(s.codigo));
    if (missing.length === 0) { _seeded = true; return; }

    const { data: inserted, error } = await sb.from("expedientes").insert(missing.map(seedRow)).select("id, codigo");
    if (error || !inserted) return; // reintenta en la próxima llamada
    const idByCode = new Map<string, string>(inserted.map((r: any) => [r.codigo, r.id]));

    const hist: any[] = [];
    const cont: any[] = [];
    for (const s of missing) {
      const id = idByCode.get(s.codigo);
      if (!id) continue;
      const idx = ESTADOS.findIndex((e) => e.id === s.estado);
      for (let i = 0; i <= idx; i++) {
        hist.push({ expediente_id: id, estado: ESTADOS[i].id, nota: i === 0 ? "Expediente creado." : "", fecha: seedDateISO(s.fecha, i) });
      }
      cont.push({ expediente_id: id, nombre_representante: "(dato ficticio reservado)", telefono: "9XX XXX XXX", es_facilitador: false });
    }
    if (hist.length) await sb.from("estados_historial").insert(hist);
    if (cont.length) await sb.from("contactos").insert(cont);
    _seeded = true;
  } catch {
    // transitorio: se reintenta en la próxima llamada
  }
}

/* ---------- código único (con reintento ante colisión) ---------- */
async function siguienteCodigo(sb: ReturnType<typeof supabaseAdmin>): Promise<string> {
  const { data } = await sb.from("expedientes").select("codigo").order("codigo", { ascending: false }).limit(1);
  let max = 14;
  if (data && data[0]) {
    const n = parseInt(String(data[0].codigo).split("-")[2], 10);
    if (!isNaN(n)) max = n;
  }
  return `PUNKU-2026-${String(max + 1).padStart(3, "0")}`;
}

/* ============================================================
   API del store (Supabase)
   ============================================================ */
export async function crearExpediente(input: NecesidadInput, ia: ClasificacionIA, contacto: ContactoInput, foto_url: string | null): Promise<TarjetaReconocimiento> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const urgencia = ia.urgencia === "alta" ? "alta" : input.urgenciaCiudadana === "anio" ? "media" : "baja";
  const base = input.relato && input.relato.trim().length > 8 ? input.relato.trim() : input.quePasa;
  const titulo = base.split(/\s+/).slice(0, 12).join(" ") || "Necesidad de la comunidad";

  const row = {
    comunidad: contacto.comunidad, distrito: input.distrito, familias_afectadas: input.familias,
    necesidad_texto: base, categoria: ia.categoria, facultades_sugeridas: ia.facultades_sugeridas,
    ods_sugerido: ia.ods_sugerido, resultado_deseado: input.aspiracion, urgencia_ciudadana: input.urgenciaCiudadana,
    foto_url, modalidad: ia.modalidad === "polivalente" ? "Polivalente · varias facultades" : "Monovalente · una facultad",
    urgencia, resumen_formal: ia.resumen_formal, estado: "recibido" as const,
    canal_origen: input.emergencia ? "emergencias" : contacto.es_facilitador ? "asistido" : "web",
    origen_registro: contacto.es_facilitador ? "facilitador" : "ciudadano", clasificado_por: ia.clasificado_por,
    confianza: ia.confianza, titulo, objetivo_sugerido: ia.objetivo_sugerido, meta_sugerida: ia.meta_sugerida,
    datos_incompletos: !ia.coherente,
  };

  let inserted: any = null;
  for (let attempt = 0; attempt < 4 && !inserted; attempt++) {
    const codigo = await siguienteCodigo(sb);
    const { data, error } = await sb.from("expedientes").insert({ codigo, ...row }).select("id, codigo").single();
    if (!error && data) { inserted = data; break; }
    if (error && !/duplicate|unique|23505/i.test(error.message + (error as any).code)) throw error;
    // colisión de código -> reintenta con el siguiente
  }
  if (!inserted) throw new Error("No se pudo generar un código único.");

  await sb.from("contactos").insert({
    expediente_id: inserted.id,
    nombre_representante: contacto.nombre_representante,
    telefono: contacto.telefono,
    es_facilitador: contacto.es_facilitador,
  });
  await sb.from("estados_historial").insert({ expediente_id: inserted.id, estado: "recibido", nota: "Expediente creado." });

  return { codigo: inserted.codigo, area: CATEGORIES_LABEL(ia.categoria), categoria: ia.categoria, familias: input.familias, resumen: ia.resumen_formal, urgente: ia.urgencia === "alta", clasificado_por: ia.clasificado_por };
}

export async function consultarPorCodigo(codigo: string): Promise<ConsultaPublica | null> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("*").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return null;
  const { data: hist } = await sb.from("estados_historial").select("estado, nota, fecha").eq("expediente_id", exp.id).order("fecha", { ascending: true });
  return {
    codigo: exp.codigo, comunidad: exp.comunidad, distrito: exp.distrito, categoria: exp.categoria,
    familias_afectadas: exp.familias_afectadas, resumen_formal: exp.resumen_formal, estado: exp.estado, urgencia: exp.urgencia,
    historial: (hist || []).map((h: any) => ({ estado: h.estado, nota: h.nota || "", fecha: fmtFecha(h.fecha) })),
  };
}

export async function listarExpedientes(): Promise<Expediente[]> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const { data } = await sb.from("expedientes").select("*").order("codigo", { ascending: false });
  return (data || []).map(toExp);
}

export async function obtenerExpediente(codigo: string): Promise<{ expediente: Expediente; historial: EstadoHistorial[] } | null> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("*").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return null;
  const { data: hist } = await sb.from("estados_historial").select("estado, nota, fecha").eq("expediente_id", exp.id).order("fecha", { ascending: true });
  return { expediente: toExp(exp), historial: (hist || []).map((h: any) => ({ estado: h.estado, nota: h.nota || "", fecha: fmtFecha(h.fecha) })) };
}

export async function cambiarEstado(codigo: string, estado: EstadoId, nota: string): Promise<Expediente | null> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("id").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return null;
  await sb.from("expedientes").update({ estado, actualizado_en: new Date().toISOString() }).eq("id", exp.id);
  await sb.from("estados_historial").insert({ expediente_id: exp.id, estado, nota: nota || "" });
  const { data: updated } = await sb.from("expedientes").select("*").eq("id", exp.id).maybeSingle();
  return updated ? toExp(updated) : null;
}

export async function revelarContacto(codigo: string): Promise<ContactoInput | null> {
  await ensureSeed();
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("id, comunidad").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return null;
  const { data: c } = await sb.from("contactos").select("nombre_representante, telefono, es_facilitador").eq("expediente_id", exp.id).maybeSingle();
  if (!c) return null;
  return { nombre_representante: c.nombre_representante, telefono: c.telefono, comunidad: exp.comunidad, es_facilitador: c.es_facilitador };
}

/* ---------- Borrador de B4 (tabla borradores_b4, 1:1 con expedientes) ---------- */
function rowToForm(r: any): B4Form {
  return {
    objetivoGen: r.objetivo_general ?? "",
    objetivosEsp: r.objetivos_especificos ?? "",
    metas: r.metas ?? "",
    metodologia: r.metodologia ?? "",
    fechaIni: r.fecha_ini ?? "2026-05-11",
    fechaFin: r.fecha_fin ?? "2026-12-28",
    recursos: r.recursos ?? "",
    presupuesto: r.presupuesto ?? "",
    docente: r.docente_asesor ?? "",
    evaluacion: r.evaluacion ?? "",
    estudiantes: Array.isArray(r.estudiantes) && r.estudiantes.length ? r.estudiantes : [{ nombre: "", dni: "", codigo: "" }],
  };
}

export async function cargarBorrador(codigo: string): Promise<B4Form | null> {
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("id").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return null;
  const { data: b } = await sb.from("borradores_b4").select("*").eq("expediente_id", exp.id).maybeSingle();
  return b ? rowToForm(b) : null;
}

export async function guardarBorrador(codigo: string, form: B4Form): Promise<boolean> {
  const sb = supabaseAdmin();
  const { data: exp } = await sb.from("expedientes").select("id").eq("codigo", codigo.trim().toUpperCase()).maybeSingle();
  if (!exp) return false;
  const row = {
    expediente_id: exp.id,
    objetivo_general: form.objetivoGen || null,
    objetivos_especificos: form.objetivosEsp || null,
    metas: form.metas || null,
    metodologia: form.metodologia || null,
    fecha_ini: form.fechaIni || null,
    fecha_fin: form.fechaFin || null,
    recursos: form.recursos || null,
    presupuesto: form.presupuesto || null,
    docente_asesor: form.docente || null,
    evaluacion: form.evaluacion || null,
    estudiantes: form.estudiantes || [],
    actualizado_en: new Date().toISOString(),
  };
  const { error } = await sb.from("borradores_b4").upsert(row, { onConflict: "expediente_id" });
  return !error;
}
