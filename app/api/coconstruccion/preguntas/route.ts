/* ============================================================
   POST /api/coconstruccion/preguntas  — Co-construcción WhatsApp (handoff §3.1)
   ------------------------------------------------------------
   La IA (Claude Haiku) arma preguntas con opciones numeradas según el
   expediente; si no hay IA disponible, cae a un banco por categoría. Acción
   institucional -> requiere sesión de coordinador. La demo nunca se cae.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { generarPreguntasCoco } from "@/lib/ai";
import { obtenerExpediente } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function POST(req: NextRequest) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "");
  // Campos ámbar de B4 que el coordinador ya llenó (a mano o con "Sugerir con IA").
  const camposLlenos = Array.isArray(body.camposLlenos) ? body.camposLlenos.map(String) : [];
  const data = await obtenerExpediente(codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });

  const out = await generarPreguntasCoco(data.expediente, camposLlenos);
  return NextResponse.json(out, { headers: NO_STORE });
}
