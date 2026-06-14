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
export const revalidate = 0;
export const fetchCache = "force-no-store";

// Sin caché: el estado cambia en el CRM y debe verse al instante en la consulta.
const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(req: NextRequest) {
  const codigo = req.nextUrl.searchParams.get("codigo") || "";
  if (!codigo.trim()) {
    return NextResponse.json({ error: "Falta el código." }, { status: 400, headers: NO_STORE });
  }
  const data = await consultarPorCodigo(codigo);
  if (!data) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404, headers: NO_STORE });
  }
  return NextResponse.json(data, { headers: NO_STORE });
}
