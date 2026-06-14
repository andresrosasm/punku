/* ============================================================
   POST /api/expedientes/[codigo]/evaluar-contexto
   ------------------------------------------------------------
   Al abrir B4, evalúa la SUSTANCIA del contexto (¿el problema está claro o es
   basura disfrazada de plantilla coherente?). Si es insuficiente, marca
   `datos_incompletos = true` para que el % de B4 arranque bajo y el módulo
   WhatsApp pregunte por el problema. Es ADITIVO: solo flaggea; nunca des-flaggea
   (eso lo hace la reconstrucción de contexto). Acción interna -> sesión de coordinador.
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { evaluarSustanciaContexto } from "@/lib/ai";
import { obtenerExpediente, actualizarContextoExpediente } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function POST(req: NextRequest, { params }: { params: { codigo: string } }) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const data = await obtenerExpediente(params.codigo);
  if (!data) return NextResponse.json({ error: "Expediente no encontrado" }, { status: 404, headers: NO_STORE });
  const exp = data.expediente;

  const evalInsuficiente = await evaluarSustanciaContexto(exp);
  const nuevo = evalInsuficiente || !!exp.datos_incompletos; // aditivo: solo flaggea
  const cambio = nuevo !== !!exp.datos_incompletos;
  if (cambio) await actualizarContextoExpediente(params.codigo, { datos_incompletos: nuevo });
  return NextResponse.json({ cambio, insuficiente: nuevo }, { headers: NO_STORE });
}
