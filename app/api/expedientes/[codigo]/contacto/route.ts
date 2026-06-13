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

export async function GET(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  if (!tieneSesion(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const contacto = await revelarContacto(params.codigo);
  if (!contacto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ contacto });
}
