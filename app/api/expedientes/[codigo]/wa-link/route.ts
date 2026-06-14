/* ============================================================
   POST /api/expedientes/[codigo]/wa-link  — Co-construcción WhatsApp (handoff §3.2)
   ------------------------------------------------------------
   Arma el enlace wa.me con las preguntas pre-redactadas y el TELÉFONO REAL del
   contacto resuelto SERVER-SIDE (la ficha de contacto nunca sale al frontend;
   igual que el reveal de contacto). Acción institucional -> sesión de coordinador.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { obtenerExpediente, revelarContacto } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";
import type { CocoPregunta } from "@/lib/ai";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

/** Normaliza a número marcable en Perú (prefijo 51 si es móvil de 9 dígitos). */
function numeroPeru(tel: string): string {
  const d = (tel || "").replace(/\D/g, "");
  if (d.length === 9 && d.startsWith("9")) return "51" + d;
  return d;
}

export async function POST(req: NextRequest, { params }: { params: { codigo: string } }) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const body = await req.json().catch(() => ({}));
  const preguntas = Array.isArray(body.preguntas) ? (body.preguntas as CocoPregunta[]) : [];

  const data = await obtenerExpediente(params.codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });
  const exp = data.expediente;

  let m = `Hola, somos de la UNCP (PUNKU) sobre su pedido ${exp.codigo}. Para ayudarles mejor, responda con el número de su respuesta:\n\n`;
  preguntas.forEach((q, i) => {
    m += `${i + 1}. ${q.q}\n`;
    q.options.forEach((o, j) => { m += `   ${j + 1}) ${o.label}\n`; });
    m += `\n`;
  });
  m += `Puede responder así: "1 2 1 2". ¡Gracias!`;

  const contacto = await revelarContacto(params.codigo);
  const numero = contacto ? numeroPeru(contacto.telefono) : "";
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(m)}`;
  return NextResponse.json({ url }, { headers: NO_STORE });
}
