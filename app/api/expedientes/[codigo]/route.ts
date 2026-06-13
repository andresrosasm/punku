/* ============================================================
   GET   /api/expedientes/[codigo]         — Detalle del expediente (CRM B2)
   PATCH /api/expedientes/[codigo]         — Cambiar estado / derivar (B2 -> A5)
   ------------------------------------------------------------
   El detalle NO incluye el contacto (sensible); este se pide aparte y solo
   con sesión de coordinador (ver ./contacto/route.ts). spec 06.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { obtenerExpediente, cambiarEstado } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";
import { ESTADOS, type EstadoId } from "@/lib/punku-data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const data = await obtenerExpediente(params.codigo);
  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  // Cambiar estado es una acción institucional -> requiere sesión de coordinador.
  if (!tieneSesion(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const estado = String(body.estado || "") as EstadoId;
  if (!ESTADOS.some((e) => e.id === estado)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }
  const nota = String(body.nota || "").slice(0, 400);
  const exp = await cambiarEstado(params.codigo, estado, nota);
  if (!exp) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ expediente: exp });
}
