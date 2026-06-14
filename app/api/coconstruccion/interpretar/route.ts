/* ============================================================
   POST /api/coconstruccion/interpretar  — Co-construcción WhatsApp (handoff §3.4)
   ------------------------------------------------------------
   Recibe las preguntas generadas + la respuesta pegada del ciudadano. Un parser
   DETERMINISTA mapea números↔opciones y compone el texto formal por campo (fuente
   fiable); si hay IA, Haiku pule la redacción, con el parser como fallback.
   Acción institucional -> requiere sesión de coordinador.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { interpretarRespuestaCoco, type CocoPregunta } from "@/lib/ai";
import { obtenerExpediente, actualizarContextoExpediente } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function POST(req: NextRequest) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "");
  const respuesta = String(body.respuesta || "");
  const preguntas = Array.isArray(body.preguntas) ? (body.preguntas as CocoPregunta[]) : [];
  if (!preguntas.length || !respuesta.trim()) {
    return NextResponse.json({ error: "Faltan preguntas o respuesta." }, { status: 400, headers: NO_STORE });
  }
  const data = await obtenerExpediente(codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });

  const out = await interpretarRespuestaCoco(data.expediente, preguntas, respuesta);
  // Persistir el CONTEXTO reconstruido en el expediente (columnas existentes).
  if (out.contexto && Object.keys(out.contexto).length > 0) {
    await actualizarContextoExpediente(codigo, out.contexto);
  }
  // `recursos` (aportes de la comunidad) es contexto que llena el campo Recursos de B4.
  return NextResponse.json(
    { recursos: out.recursos ?? null, contexto: out.contexto, resumen: out.resumen, generado_por: out.generado_por },
    { headers: NO_STORE }
  );
}
