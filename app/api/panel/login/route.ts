/* ============================================================
   POST /api/panel/login   — login simbólico del coordinador (spec 06, regla 7)
   DELETE /api/panel/login — cerrar sesión
   ------------------------------------------------------------
   Setea una cookie httpOnly de sesión de demo. No es auth de producción.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { credencialesOk, sessionToken, PANEL_COOKIE, tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";

// ¿Hay sesión activa? (lo usa /panel para decidir si muestra login o CRM)
export async function GET(req: NextRequest) {
  return NextResponse.json({ auth: tieneSesion(req) });
}

export async function POST(req: NextRequest) {
  const { user, pass } = await req.json().catch(() => ({ user: "", pass: "" }));
  if (!credencialesOk(String(user || ""), String(pass || ""))) {
    return NextResponse.json({ error: "Usuario o clave incorrectos." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
