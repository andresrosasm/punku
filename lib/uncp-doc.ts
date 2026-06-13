/* ============================================================
   PUNKU — Generación del borrador en formato oficial UNCP (B4)
   Basado en docs/reference/lineamientos-UNCP-2026.pdf ("ESTRUCTURA DEL PROYECTO" I–X)
   y portado de docs/design/punku-crm.jsx.
   El prototipo abre window.open + document.write + print(). En producción esto
   podría generarse server-side; para el MVP se mantiene el imprimible cliente.
   ============================================================ */
import type { Expediente } from "./types";
import type { Categoria } from "./punku-data";

export interface B4Form {
  objetivoGen: string;
  objetivosEsp: string;
  metas: string;
  metodologia: string;
  fechaIni: string;
  fechaFin: string;
  recursos: string;
  presupuesto: string;
  docente: string;
  evaluacion: string;
  estudiantes: { nombre: string; dni: string; codigo: string }[];
}

export interface B4Ctx {
  area: string;
  modal: "mono" | "poli";
  ods: string;
  justificacion: string;
  fechaIni: string;
  fechaFin: string;
  form: B4Form;
}

export function modalidadDe(exp: Expediente): "mono" | "poli" {
  const reales = exp.facultades_sugeridas.filter((f) => !/otra entidad/i.test(f));
  return reales.length > 1 ? "poli" : "mono";
}

export function justificacionIA(exp: Expediente, ods: string): string {
  return `Esta propuesta responde a una necesidad real identificada por ${exp.comunidad} (${exp.distrito}, Huancayo), que afecta a ${exp.familias_afectadas} familias. Atenderla fortalece la presencia territorial de la UNCP y contribuye al ${ods}.`;
}

/* Sugerencias "✨ con IA" (para el MVP son plantillas derivadas; el humano edita). */
export const SUG = {
  objetivoGen: (exp: Expediente, c: Categoria) =>
    `Contribuir a que ${exp.comunidad} logre ${exp.resultado_deseado ? "“" + exp.resultado_deseado.replace(/\.$/, "") + "”" : "mejorar su situación en " + c.es.toLowerCase()}, mediante el acompañamiento técnico y académico de la UNCP, en beneficio de ${exp.familias_afectadas} familias del distrito de ${exp.distrito}.`,
  objetivosEsp: () =>
    `• Realizar un diagnóstico participativo de la situación junto a la comunidad.\n• Diseñar y ejecutar acciones pertinentes con los beneficiarios.\n• Fortalecer capacidades locales para dar sostenibilidad a los resultados.`,
  evaluacion: () =>
    `• N.° de familias participantes y beneficiadas.\n• % de avance respecto al cronograma.\n• Cumplimiento de metas por objetivo específico.\n• Nivel de satisfacción de la comunidad (encuesta breve).`,
};

function esc(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Genera el HTML imprimible del proyecto de proyección social en formato UNCP. */
export function uncpPrintHtml(exp: Expediente, ctx: B4Ctx): string {
  const f = ctx.form;
  const estu =
    (f.estudiantes || [])
      .filter((e) => e.nombre || e.dni)
      .map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.nombre) || "—"}</td><td>${esc(e.dni) || "—"}</td><td>${esc(e.codigo) || "—"}</td></tr>`)
      .join("") || "<tr><td>1</td><td>—</td><td>—</td><td>—</td></tr>";
  const sec = (titulo: string, body?: string) => `<h3>${titulo}</h3><div class="bx">${body ? esc(body) : "<i>Por completar</i>"}</div>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Solicitud ${esc(exp.codigo)} — UNCP</title>
  <style>
   *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;color:#1A211F;}
   body{margin:0;padding:44px 52px;font-size:12px;line-height:1.5;}
   .hd{text-align:center;border-bottom:2px solid #2E6B4E;padding-bottom:10px;margin-bottom:14px;}
   .hd b{font-size:13px;} .hd div{font-size:11px;color:#56605F;}
   table{width:100%;border-collapse:collapse;margin:6px 0 14px;}
   td,th{border:1px solid #CBD3D2;padding:5px 7px;font-size:11px;text-align:left;}
   th{background:#EEF3F1;}
   .kv{display:flex;gap:8px;margin:3px 0;font-size:11.5px;}.kv b{min-width:150px;color:#36403F;}
   h2{font-size:13px;margin:18px 0 4px;color:#2E6B4E;border-bottom:1px solid #DCEEE3;padding-bottom:3px;}
   h3{font-size:11.5px;margin:10px 0 3px;color:#36403F;}
   .bx{border:1px solid #E3E9E8;border-radius:6px;padding:8px 10px;min-height:24px;white-space:pre-wrap;background:#FAFBFB;}
   i{color:#9AA5A4;}
   .sign{display:flex;justify-content:space-around;margin-top:46px;text-align:center;font-size:10.5px;}
   .sign div{border-top:1px solid #6B7675;padding-top:5px;width:30%;}
   .ft{margin-top:14px;font-size:10px;color:#9AA5A4;}
  </style></head><body>
   <div class="hd"><b>UNIVERSIDAD NACIONAL DEL CENTRO DEL PERÚ</b>
   <div>Dirección de Proyección Social y Extensión Cultural · Facultad de ${esc(exp.facultades_sugeridas[0] || "…")}</div>
   <div>PROYECTO DE PROYECCIÓN SOCIAL · ${esc(exp.codigo)} · Periodo 2026</div></div>

   <div class="kv"><b>Título del proyecto:</b><span>${esc(exp.titulo)}</span></div>
   <div class="kv"><b>Lugar de ejecución:</b><span>${esc(exp.distrito)}, ${esc(exp.comunidad)}, Huancayo, Junín</span></div>
   <div class="kv"><b>Población beneficiaria:</b><span>${exp.familias_afectadas} familias · ${esc(exp.comunidad)}</span></div>
   <div class="kv"><b>Modalidad:</b><span>${ctx.modal === "poli" ? "Polivalente" : "Monovalente"}</span></div>
   <div class="kv"><b>Área:</b><span>${esc(ctx.area)}</span></div>
   <div class="kv"><b>ODS:</b><span>${esc(ctx.ods)}</span></div>
   <div class="kv"><b>Facultad(es):</b><span>${esc(exp.facultades_sugeridas.join(", "))}</span></div>
   <div class="kv"><b>Fecha inicio / culminación:</b><span>${esc(ctx.fechaIni) || "—"} / ${esc(ctx.fechaFin) || "—"}</span></div>
   <div class="kv"><b>Presupuesto:</b><span>S/ ${esc(f.presupuesto) || "—"}</span></div>

   <h2>Estudiantes ejecutores</h2>
   <table><tr><th>N°</th><th>Apellidos y Nombres</th><th>DNI</th><th>Código</th></tr>${estu}</table>
   <div class="kv"><b>Docente responsable / asesor:</b><span>${esc(f.docente) || "—"}</span></div>

   <h2>Estructura del proyecto</h2>
   ${sec("I. Título del proyecto", exp.titulo)}
   ${sec("II. Introducción (problema · ODS · justificación)", exp.resumen_formal + "\n\n" + ctx.ods + "\n\n" + ctx.justificacion)}
   ${sec("III. Descripción (lugar · población beneficiaria)", exp.distrito + ", " + exp.comunidad + " — " + exp.familias_afectadas + " familias")}
   ${sec("IV. Objetivo general", f.objetivoGen)}
   ${sec("IV. Objetivos específicos", f.objetivosEsp)}
   ${sec("V. Metas (cuantitativas)", f.metas)}
   ${sec("VI. Justificación", ctx.justificacion)}
   ${sec("VII. Metodología de trabajo", f.metodologia)}
   ${sec("VIII. Cronograma de trabajo", (ctx.fechaIni || "—") + " a " + (ctx.fechaFin || "—"))}
   ${sec("IX. Recursos (materiales · humanos · financieros)", f.recursos)}
   ${sec("X. Evaluación y monitoreo", f.evaluacion)}

   <div class="sign"><div>Firma · DPSEC de la Facultad</div><div>Dra. Nora E. Hilario Flores · DPSEC</div><div>Representante comunal</div></div>
   <div class="ft">Documento generado por PUNKU a partir de la necesidad registrada por la comunidad. Las firmas se completan al imprimir. Datos ciudadanos anonimizados.</div>
  </body></html>`;
}
