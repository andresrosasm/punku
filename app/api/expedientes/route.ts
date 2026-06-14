/* ============================================================
   POST /api/expedientes  — Creación del Expediente Territorial (spec 03, 05, 06)
   GET  /api/expedientes  — Bandeja del CRM (lista, sin contactos)
   ------------------------------------------------------------
   Toda la lógica sensible vive aquí (server-side). El frontend nunca toca
   llaves ni datos de contacto. La IA recibe SOLO la necesidad anonimizada.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { estructurarNecesidad } from "@/lib/ai";
import { crearExpediente, listarExpedientes } from "@/lib/store";
import type { NecesidadInput, ContactoInput } from "@/lib/types";
import { CATEGORIES, type CatId } from "@/lib/punku-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

function clean(s: unknown, max = 1200): string {
  return String(s ?? "").slice(0, max).trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const catId = (CATEGORIES.find((c) => c.id === body.catId)?.id || "agua") as CatId;
    const emergencia = !!body.emergencia;

    // 1) Entrada ANONIMIZADA al motor de IA — SIN datos personales (spec 03 §4).
    const input: NecesidadInput = {
      area: clean(body.area, 80),
      catId,
      quePasa: clean(body.quePasa, 200),
      distrito: clean(body.distrito, 80),
      familias: Math.max(0, Math.min(100000, parseInt(body.familias, 10) || 0)),
      aspiracion: clean(body.aspiracion, 400),
      urgenciaCiudadana: clean(body.urgenciaCiudadana, 20),
      relato: clean(body.relato, 1200),
      emergencia,
    };

    // 2) Una sola llamada al motor (timeout 10s) — con fallback a reglas adentro.
    const ia = await estructurarNecesidad(input);

    // 2b) Validación de coherencia: si el input no es una necesidad real, NO se
    //     inventa ni se crea el expediente. Se devuelve la señal para que la UI
    //     pida reescribir. (No se persiste nada.)
    if (!ia.coherente) {
      return NextResponse.json(
        {
          incoherente: true,
          motivo: ia.motivo || "El texto ingresado no es suficiente o no es claro.",
          mensaje: "El texto ingresado no es suficiente o no es claro. Por favor describe la necesidad real de tu comunidad.",
        },
        { status: 422, headers: NO_STORE }
      );
    }

    // 3) Contacto SENSIBLE — tabla aparte, jamás a la IA (spec 02 §3 / 06).
    const c = body.contacto || {};
    const contacto: ContactoInput = {
      nombre_representante: clean(c.nombre, 120) || "(sin nombre)",
      telefono: clean(c.tel, 30),
      comunidad: clean(c.comunidad, 120) || clean(body.comunidad, 120) || "Comunidad",
      es_facilitador: body.mode === "other" || !!c.es_facilitador,
    };

    const foto_url = body.foto_url ? clean(body.foto_url, 400) : null;

    // 4) Genera código, guarda Expediente + Contacto + primer estado "Recibido".
    // 5) Devuelve SOLO la Tarjeta de Reconocimiento (nunca el contacto).
    const tarjeta = await crearExpediente(input, ia, contacto, foto_url);

    return NextResponse.json(tarjeta, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "No se pudo crear el expediente." },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Bandeja del CRM: lista de expedientes (sin datos de contacto).
  const expedientes = await listarExpedientes();
  return NextResponse.json({ expedientes }, { headers: NO_STORE });
}
