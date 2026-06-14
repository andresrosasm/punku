/* ============================================================
   GET /api/expedientes/[codigo]/contacto  — Datos de contacto SENSIBLES (B2)
   ------------------------------------------------------------
   Solo accesible con sesión de coordinador (spec 04 §6, spec 06). Estos datos
   nunca se exponen en la cara ciudadana ni se envían a la IA.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { revelarContacto } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  if (!tieneSesion(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  }
  const contacto = await revelarContacto(params.codigo);
  if (!contacto) return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ contacto }, { headers: NO_STORE });
}
