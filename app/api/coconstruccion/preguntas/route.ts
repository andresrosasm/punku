/* ============================================================
   POST /api/coconstruccion/preguntas  — Co-construcción WhatsApp (handoff §3.1)
   ------------------------------------------------------------
   La IA (Claude Haiku) arma preguntas con opciones numeradas según el
   expediente; si no hay IA disponible, cae a un banco por categoría. Acción
   institucional -> requiere sesión de coordinador. La demo nunca se cae.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { generarPreguntasCoco } from "@/lib/ai";
import { obtenerExpediente, revelarContacto } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

/** ¿El contacto sirve para co-construir por WhatsApp? (móvil Perú + nombre legible).
 *  Se evalúa SERVER-SIDE; al frontend solo va un booleano, nunca el número. */
function contactoEsValido(c: { nombre_representante?: string; telefono?: string } | null): boolean {
  if (!c) return false;
  const tel = (c.telefono || "").replace(/\D/g, "");
  const telOk = tel.length === 9 && tel.startsWith("9");
  const nombre = (c.nombre_representante || "").replace(/\(.*?\)/g, "").trim();
  const nombreOk = /[a-záéíóúñ]{3,}/i.test(nombre) && !/reservado|ficticio|ilegible/i.test(nombre);
  return telOk && nombreOk;
}

export async function POST(req: NextRequest) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const codigo = String(body.codigo || "");
  // Campos de B4 ya llenos (para saber si el contexto "aportes"/Recursos ya está cubierto).
  const camposLlenos = Array.isArray(body.camposLlenos) ? body.camposLlenos.map(String) : [];
  const data = await obtenerExpediente(codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });

  const out = await generarPreguntasCoco(data.expediente, camposLlenos);
  const contactoValido = contactoEsValido(await revelarContacto(codigo));
  return NextResponse.json({ ...out, contactoValido }, { headers: NO_STORE });
}
