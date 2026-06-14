/* ============================================================
   POST /api/sugerir  — "Sugerir con IA" de B4 (spec 04)
   ------------------------------------------------------------
   Genera con IA real (Claude Haiku) el texto de un campo del formato UNCP
   (objetivo general, objetivos específicos, metas) a partir del expediente.
   Si la IA no está disponible, cae a una plantilla. Si el expediente no tiene
   info suficiente / coherente, devuelve la señal para que la UI lo indique.
   Acción institucional -> requiere sesión de coordinador.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { sugerirCampoB4, type CampoB4 } from "@/lib/ai";
import { obtenerExpediente } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };
const CAMPOS: CampoB4[] = ["objetivoGen", "objetivosEsp", "metas", "evaluacion"];

export async function POST(req: NextRequest) {
  if (!tieneSesion(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  }
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "");
  const campo = String(body.campo || "") as CampoB4;
  if (!CAMPOS.includes(campo)) {
    return NextResponse.json({ error: "Campo inválido" }, { status: 400, headers: NO_STORE });
  }
  const data = await obtenerExpediente(codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });

  const sug = await sugerirCampoB4(data.expediente, campo);
  return NextResponse.json(sug, { headers: NO_STORE });
}
