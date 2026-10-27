/* ============================================================
   POST /api/panel/login   — login simbólico del coordinador (spec 06, regla 7)
   DELETE /api/panel/login — cerrar sesión
   ------------------------------------------------------------
   Setea una cookie httpOnly de sesión de demo. No es auth de producción.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { credencialesOk, sessionToken, panelConfigurado, PANEL_COOKIE, PANEL_SESSION_SECONDS, tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";

// ¿Hay sesión activa? (lo usa /panel para decidir si muestra login o CRM)
export async function GET(req: NextRequest) {
  return NextResponse.json({ auth: await tieneSesion(req) }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  // Fail-closed: sin PANEL_USER/PANEL_PASS/PANEL_SECRET no hay login posible.
  if (!panelConfigurado()) {
    return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  }
  const { user, pass } = await req.json().catch(() => ({ user: "", pass: "" }));
  if (!credencialesOk(String(user || ""), String(pass || ""))) {
    return NextResponse.json({ error: "Usuario o clave incorrectos." }, { status: 401 });
  }
  const token = sessionToken();
  if (!token) return NextResponse.json({ error: "Servicio no disponible." }, { status: 503 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PANEL_SESSION_SECONDS, // coherente con exp del token
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PANEL_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 0 });
  return res;
}
