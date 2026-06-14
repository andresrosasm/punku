/* ============================================================
   GET /api/expedientes/[codigo]/borrador  — Cargar el borrador de B4
   PUT /api/expedientes/[codigo]/borrador  — Guardar (upsert) el borrador de B4
   ------------------------------------------------------------
   Persiste lo que la UNCP completa en B4 en la tabla `borradores_b4` (1:1).
   Acción institucional interna -> requiere sesión de coordinador (spec 06).
   ============================================================ */
import { NextRequest, NextResponse } from "next/server";
import { cargarBorrador, guardarBorrador } from "@/lib/store";
import { tieneSesion } from "@/lib/panel-auth";
import type { B4Form } from "@/lib/uncp-doc";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const NO_STORE = { "Cache-Control": "no-store, max-age=0, must-revalidate" };

export async function GET(req: NextRequest, { params }: { params: { codigo: string } }) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const data = await cargarBorrador(params.codigo);
  return NextResponse.json({ borrador: data?.form ?? null, listo: data?.listo ?? false }, { headers: NO_STORE });
}

export async function PUT(req: NextRequest, { params }: { params: { codigo: string } }) {
  if (!tieneSesion(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: NO_STORE });
  const body = (await req.json().catch(() => ({}))) as Partial<B4Form>;

  // Saneo a un B4Form completo (campos faltantes -> valores por defecto).
  const form: B4Form = {
    objetivoGen: String(body.objetivoGen ?? ""),
    objetivosEsp: String(body.objetivosEsp ?? ""),
    metas: String(body.metas ?? ""),
    metodologia: String(body.metodologia ?? ""),
    fechaIni: String(body.fechaIni ?? "2026-05-11"),
    fechaFin: String(body.fechaFin ?? "2026-12-28"),
    recursos: String(body.recursos ?? ""),
    presupuesto: String(body.presupuesto ?? ""),
    docente: String(body.docente ?? ""),
    evaluacion: String(body.evaluacion ?? ""),
    estudiantes: Array.isArray(body.estudiantes)
      ? body.estudiantes.slice(0, 50).map((e: any) => ({ nombre: String(e?.nombre ?? ""), dni: String(e?.dni ?? ""), codigo: String(e?.codigo ?? "") }))
      : [{ nombre: "", dni: "", codigo: "" }],
  };

  const listo = !!(body as any).listo;
  const ok = await guardarBorrador(params.codigo, form, listo);
  if (!ok) return NextResponse.json({ error: "No se pudo guardar el borrador." }, { status: 404, headers: NO_STORE });
  return NextResponse.json({ ok: true, listo }, { headers: NO_STORE });
}
