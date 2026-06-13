/* ============================================================
   PUNKU — Acceso simbólico al panel institucional (spec 06, regla 7)
   ------------------------------------------------------------
   /panel es alcanzable desde la puerta pública, así que va detrás de un login
   simbólico (usuario/clave de demo). Esto refuerza el control de acceso a la
   tabla `contactos` (datos sensibles) y suma a "ética digital" (20%).
   No es auth de producción: es un candado de demo, suficiente para el MVP.
   ============================================================ */
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export const PANEL_COOKIE = "punku_panel";

export function panelUser(): string {
  return process.env.PANEL_USER || "coordinador";
}
export function panelPass(): string {
  return process.env.PANEL_PASS || "demo2026";
}

/** Token de sesión simbólico (no secreto real — candado de demo). */
export function sessionToken(): string {
  return `ok:${panelUser()}`;
}

export function credencialesOk(user: string, pass: string): boolean {
  return user === panelUser() && pass === panelPass();
}

/** ¿Hay sesión válida? (lee la cookie httpOnly). Para uso en route handlers. */
export function tieneSesion(req?: NextRequest): boolean {
  const value = req
    ? req.cookies.get(PANEL_COOKIE)?.value
    : cookies().get(PANEL_COOKIE)?.value;
  return value === sessionToken();
}
