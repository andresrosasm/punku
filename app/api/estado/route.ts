/* ============================================================
   GET /api/estado?codigo=PUNKU-2026-001  — Consulta ciudadana por código (A5)
   ------------------------------------------------------------
   Devuelve SOLO campos no sensibles + el timeline de estados.
   Nunca expone datos de contacto (spec 02 §7, spec 06).
   Es el cierre del dolor #2: lo que el coordinador cambia en el CRM se ve aquí.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { consultarPorCodigo } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo") || "";
  if (!codigo.trim()) {
    return NextResponse.json({ error: "Falta el código." }, { status: 400 });
  }
  const data = await consultarPorCodigo(codigo);
  if (!data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }
  return NextResponse.json(data);
}
