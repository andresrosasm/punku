/* ============================================================
   PUNKU — Capa de datos (store)  ·  specs 02, 04, 05
   ------------------------------------------------------------
   Almacén EN MEMORIA, sembrado con los 7 expedientes ficticios.
   · Garantiza que la demo en vivo nunca dependa de un servicio externo
     (coherente con spec 05: "la demo nunca se cae"). El cambio de estado en
     el CRM (B2) se refleja al instante en la consulta ciudadana (A5) mientras
     el servidor está vivo — exactamente el puente del dolor #2.
   · Para producción, spec 02 define el esquema Supabase (ver supabase/schema.sql)
     y la interfaz de este módulo está pensada para reemplazarse por un store
     Supabase sin tocar las rutas API ni el frontend.
   · Los datos sensibles (contactos) viven en un mapa APARTE, accesible solo
     desde el servidor (spec 02 §7, spec 06). Nunca se exponen al frontend.
   ============================================================ */
import {
  EXPEDIENTES, ESTADOS, ODS_MAP, AREA_MAP, type EstadoId, type CatId,
} from "./punku-data";
import type {
  Expediente, EstadoHistorial, ConsultaPublica, ContactoInput,
  NecesidadInput, ClasificacionIA, TarjetaReconocimiento,
} from "./types";

interface DBShape {
  expedientes: Map<string, Expediente>;
  historial: Map<string, EstadoHistorial[]>;
  contactos: Map<string, ContactoInput>; // SENSIBLE — solo server
  correlativo: number;
  seeded: boolean;
}

// Singleton global: sobrevive al hot-reload de Next.js en desarrollo.
const g = globalThis as unknown as { __PUNKU_DB__?: DBShape };

function db(): DBShape {
  if (!g.__PUNKU_DB__) {
    g.__PUNKU_DB__ = {
      expedientes: new Map(),
      historial: new Map(),
      contactos: new Map(),
      correlativo: 0,
      seeded: false,
    };
  }
  if (!g.__PUNKU_DB__.seeded) seed(g.__PUNKU_DB__);
  return g.__PUNKU_DB__;
}

/* ---------- Siembra de datos ficticios ---------- */
function seed(d: DBShape) {
  let max = 0;
  for (const s of EXPEDIENTES) {
    const idx = ESTADOS.findIndex((e) => e.id === s.estado);
    const canal_origen = s.canal === "PUNKU Emergencias" ? "emergencias" : "web";

    const exp: Expediente = {
      codigo: s.codigo,
      comunidad: s.comunidad,
      distrito: s.distrito,
      familias_afectadas: s.familias,
      necesidad_texto: s.resumen,
      categoria: s.cat,
      facultades_sugeridas: s.facultades,
      ods_sugerido: ODS_MAP[s.cat] || "ODS 17 · Alianzas",
      resultado_deseado: s.aspiracion,
      urgencia_ciudadana: s.urgencia === "alta" ? "alta" : s.urgencia === "media" ? "anio" : "espera",
      foto_url: null,
      modalidad: s.modalidad,
      urgencia: s.urgencia,
      resumen_formal: s.resumen,
      estado: s.estado,
      canal_origen,
      origen_registro: "ciudadano",
      clasificado_por: "ia",
      confianza: s.confianza / 100,
      titulo: s.titulo,
      objetivo_sugerido: `Contribuir a que ${s.comunidad} logre: ${s.aspiracion.replace(/\.$/, "")}, con el acompañamiento de la UNCP.`,
      meta_sugerida: `${s.familias} familias beneficiadas y un plan de trabajo en 6 meses.`,
      creado_en: s.fecha,
      actualizado_en: s.fecha,
    };
    d.expedientes.set(exp.codigo, exp);

    // Historial: secuencia de Recibido hasta el estado actual.
    const hist: EstadoHistorial[] = [];
    for (let i = 0; i <= idx; i++) {
      hist.push({ estado: ESTADOS[i].id, nota: i === 0 ? "Expediente creado." : "", fecha: s.fecha });
    }
    d.historial.set(exp.codigo, hist);

    // Contacto ficticio (sensible, aparte).
    d.contactos.set(exp.codigo, {
      nombre_representante: "(dato ficticio reservado)",
      telefono: "9XX XXX XXX",
      comunidad: s.comunidad,
      es_facilitador: false,
    });

    const n = parseInt(s.codigo.split("-")[2], 10);
    if (!isNaN(n) && n > max) max = n;
  }
  d.correlativo = max; // próximos códigos continúan la secuencia
  d.seeded = true;
}

/* ---------- Generación del código único (spec 02 §5) ---------- */
function nuevoCodigo(d: DBShape): string {
  d.correlativo += 1;
  return `PUNKU-2026-${String(d.correlativo).padStart(3, "0")}`;
}

function ahora(): string {
  // Fecha legible para la demo (es-PE). En producción usar timestamptz de Postgres.
  return new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

/* ============================================================
   API del store
   ============================================================ */

/** Crea un Expediente Territorial + Contacto (aparte) + primer estado "Recibido".
 *  Devuelve SOLO la Tarjeta de Reconocimiento (nunca el contacto). spec 06. */
export async function crearExpediente(
  input: NecesidadInput,
  ia: ClasificacionIA,
  contacto: ContactoInput,
  foto_url: string | null
): Promise<TarjetaReconocimiento> {
  const d = db();
  const codigo = nuevoCodigo(d);
  const fecha = ahora();
  const urgencia = ia.urgencia === "alta" ? "alta" : input.urgenciaCiudadana === "anio" ? "media" : "baja";

  // Título tentativo a partir del problema/relato (máx ~15 palabras).
  const base = input.relato && input.relato.trim().length > 8 ? input.relato.trim() : input.quePasa;
  const titulo = base.split(/\s+/).slice(0, 12).join(" ");

  const exp: Expediente = {
    codigo,
    comunidad: contacto.comunidad,
    distrito: input.distrito,
    familias_afectadas: input.familias,
    necesidad_texto: base,
    categoria: ia.categoria,
    facultades_sugeridas: ia.facultades_sugeridas,
    ods_sugerido: ia.ods_sugerido,
    resultado_deseado: input.aspiracion,
    urgencia_ciudadana: input.urgenciaCiudadana,
    foto_url,
    modalidad: ia.modalidad === "polivalente" ? "Polivalente · varias facultades" : "Monovalente · una facultad",
    urgencia,
    resumen_formal: ia.resumen_formal,
    estado: "recibido",
    canal_origen: input.emergencia ? "emergencias" : contacto.es_facilitador ? "asistido" : "web",
    origen_registro: contacto.es_facilitador ? "facilitador" : "ciudadano",
    clasificado_por: ia.clasificado_por,
    confianza: ia.confianza,
    titulo: titulo || "Necesidad de la comunidad",
    objetivo_sugerido: ia.objetivo_sugerido,
    meta_sugerida: ia.meta_sugerida,
    creado_en: fecha,
    actualizado_en: fecha,
  };

  d.expedientes.set(codigo, exp);
  d.historial.set(codigo, [{ estado: "recibido", nota: "Expediente creado.", fecha }]);
  d.contactos.set(codigo, contacto); // tabla SENSIBLE aparte

  const cat = CATEGORIES_LABEL(ia.categoria);
  return {
    codigo,
    area: cat,
    categoria: ia.categoria,
    familias: input.familias,
    resumen: ia.resumen_formal,
    urgente: ia.urgencia === "alta",
    clasificado_por: ia.clasificado_por,
  };
}

// helper local para evitar import circular de CATEGORIES con catLabel
function CATEGORIES_LABEL(cat: CatId): string {
  const m: Record<CatId, string> = {
    agro: "Agricultura y ganadería", salud: "Salud", educ: "Educación",
    agua: "Medio ambiente y agua", cultura: "Cultura y sociedad", infra: "Infraestructura y servicios",
  };
  return m[cat];
}

/** Consulta ciudadana por código (A5). Solo campos NO sensibles. spec 02 §7. */
export async function consultarPorCodigo(codigo: string): Promise<ConsultaPublica | null> {
  const d = db();
  const exp = d.expedientes.get(codigo.trim().toUpperCase());
  if (!exp) return null;
  return {
    codigo: exp.codigo,
    comunidad: exp.comunidad,
    distrito: exp.distrito,
    categoria: exp.categoria,
    familias_afectadas: exp.familias_afectadas,
    resumen_formal: exp.resumen_formal,
    estado: exp.estado,
    urgencia: exp.urgencia,
    historial: d.historial.get(exp.codigo) || [],
  };
}

/** Lista de expedientes para la bandeja del CRM (B1). Sin datos de contacto. */
export async function listarExpedientes(): Promise<Expediente[]> {
  const d = db();
  return Array.from(d.expedientes.values()).sort((a, b) => b.codigo.localeCompare(a.codigo));
}

/** Detalle de un expediente para el CRM (B2). El contacto se entrega aparte
 *  solo cuando el coordinador lo solicita (revelarContacto). */
export async function obtenerExpediente(
  codigo: string
): Promise<{ expediente: Expediente; historial: EstadoHistorial[] } | null> {
  const d = db();
  const exp = d.expedientes.get(codigo.trim().toUpperCase());
  if (!exp) return null;
  return { expediente: exp, historial: d.historial.get(exp.codigo) || [] };
}

/** Cambia el estado de un expediente y lo registra en el historial (B2 -> A5). */
export async function cambiarEstado(
  codigo: string,
  estado: EstadoId,
  nota: string
): Promise<Expediente | null> {
  const d = db();
  const exp = d.expedientes.get(codigo.trim().toUpperCase());
  if (!exp) return null;
  const fecha = ahora();
  exp.estado = estado;
  exp.actualizado_en = fecha;
  const hist = d.historial.get(exp.codigo) || [];
  hist.push({ estado, nota: nota || "", fecha });
  d.historial.set(exp.codigo, hist);
  return exp;
}

/** Acceso al contacto SENSIBLE — solo desde el servidor, rol coordinador. spec 06. */
export async function revelarContacto(codigo: string): Promise<ContactoInput | null> {
  const d = db();
  return d.contactos.get(codigo.trim().toUpperCase()) || null;
}
