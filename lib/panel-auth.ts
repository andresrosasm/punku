/* ============================================================
   PUNKU — Acceso al panel institucional (spec 06, regla 7)
   ------------------------------------------------------------
   /panel es alcanzable desde la puerta pública, así que va detrás de login.
   Esto protege la tabla `contactos` (datos sensibles) y suma a "ética digital".
   Sesión: token firmado HMAC-SHA256 `<exp>.<firma>`. Sin PANEL_USER, PANEL_PASS
   y PANEL_SECRET definidos, falla cerrado (ninguna sesión es válida).
   ============================================================ */
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const PANEL_COOKIE = "punku_panel";
/** Duración de la sesión (segundos). Usada para exp y para maxAge de la cookie. */
export const PANEL_SESSION_SECONDS = 60 * 60 * 8; // 8 horas

/** Config del panel; null si falta cualquiera de las tres variables (fail-closed). */
function config(): { user: string; pass: string; secret: string } | null {
  const user = process.env.PANEL_USER;
  const pass = process.env.PANEL_PASS;
  const secret = process.env.PANEL_SECRET;
  if (!user || !pass || !secret) return null;
  return { user, pass, secret };
}

export function panelConfigurado(): boolean {
  return config() !== null;
}

function sha256(v: string): Buffer {
  return createHash("sha256").update(v, "utf8").digest();
}

/** Comparación en tiempo constante (hashea ambos lados para igualar longitudes). */
function igual(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

function firmar(secret: string, user: string, exp: number): string {
  return createHmac("sha256", secret).update(`${user}.${exp}`).digest("base64url");
}

/** Token de sesión firmado `<exp>.<firma>`; null si el panel no está configurado. */
export function sessionToken(now: number = Date.now()): string | null {
  const c = config();
  if (!c) return null;
  const exp = Math.floor(now / 1000) + PANEL_SESSION_SECONDS;
  return `${exp}.${firmar(c.secret, c.user, exp)}`;
}

/** Verifica formato, vencimiento y firma de un token. */
export function tokenValido(token: string | undefined, now: number = Date.now()): boolean {
  const c = config();
  if (!c || !token) return false;
  const m = /^(\d{1,12})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!m) return false;
  const exp = Number(m[1]);
  if (!Number.isSafeInteger(exp) || exp <= Math.floor(now / 1000)) return false;
  const esperada = Buffer.from(firmar(c.secret, c.user, exp));
  const recibida = Buffer.from(m[2]);
  if (esperada.length !== recibida.length) return false;
  return timingSafeEqual(esperada, recibida);
}

export function credencialesOk(user: string, pass: string): boolean {
  const c = config();
  if (!c) return false;
  const okUser = igual(user, c.user);
  const okPass = igual(pass, c.pass);
  return okUser && okPass;
}

/** ¿Hay sesión válida? (lee la cookie httpOnly). Para uso en route handlers. */
export async function tieneSesion(req?: NextRequest): Promise<boolean> {
  const value = req
    ? req.cookies.get(PANEL_COOKIE)?.value
    : (await cookies()).get(PANEL_COOKIE)?.value;
  return tokenValido(value);
}
