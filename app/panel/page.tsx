/* ============================================================
   PUNKU — Cara interna / CRM (/panel)  ·  spec 04
   Bandeja + Detalle + B4 (solicitud UNCP) + Tablero. Login simbólico (spec 06).
   Portado de docs/design/punku-crm.jsx y cableado a las API routes reales.
   El cambio de estado aquí se refleja al instante en la consulta ciudadana (A5).
   ============================================================ */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PunkuLogo } from "@/components/MountainDoor";
import { CatGlyph, I } from "@/components/icons";
import {
  CATEGORIES, ESTADOS, ESTADO_STYLE, FACULTADES, ODS_MAP, AREA_MAP, AREAS_PS,
  catOf, type Lang, type CatId, type EstadoId,
} from "@/lib/punku-data";
import type { Expediente } from "@/lib/types";
import { modalidadDe, justificacionIA, uncpPrintHtml, type B4Form } from "@/lib/uncp-doc";

/* ---------- helpers de presentación ---------- */
function canalLabel(c: string): string {
  if (c === "emergencias") return "PUNKU Emergencias";
  if (c === "asistido") return "PUNKU (asistido)";
  return "PUNKU";
}

/* Ícono de WhatsApp (marca) */
function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
      <path d="M.06 24l1.68-6.13A11.86 11.86 0 0 1 .16 11.9C.16 5.34 5.5.01 12.06.01a11.82 11.82 0 0 1 8.41 3.49 11.8 11.8 0 0 1 3.48 8.4c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.68-1.45L.06 24zM6.6 20.2c1.68.99 3.28 1.58 5.45 1.58 5.45 0 9.9-4.43 9.9-9.88 0-5.46-4.43-9.9-9.89-9.9-5.46 0-9.89 4.44-9.89 9.9 0 2.28.67 3.99 1.79 5.78l-.99 3.62 3.62-1.1zM17.9 14.7c-.07-.12-.27-.2-.57-.35-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.69.25-1.28.17-1.41z" />
    </svg>
  );
}

/* Enlace wa.me con mensaje pre-redactado (Perú: prefijo 51 si es móvil de 9 dígitos). */
function waLink(exp: Expediente, contacto: { nombre_representante: string; telefono: string }): string {
  const tel = (contacto.telefono || "").replace(/\D/g, "");
  const numero = tel.length === 9 && tel.startsWith("9") ? "51" + tel : tel;
  const nombre = (contacto.nombre_representante || "").replace(/\s*\(.*\)\s*/, "").trim() || "estimado(a)";
  const tema = exp.titulo || (catOf(exp.categoria)?.es || "su necesidad");
  const msg =
    `Hola ${nombre}, le escribo de la UNCP sobre su solicitud ${exp.codigo} de ${exp.comunidad}. ` +
    `Para avanzar con su proyecto de proyección social necesitamos completar algunos datos. ` +
    `¿Podría ayudarnos con más información sobre ${tema}?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
}
function EstadoPill({ id, lang }: { id: EstadoId; lang: Lang }) {
  const s = ESTADO_STYLE[id];
  const e = ESTADOS.find((x) => x.id === id)!;
  return <span className="pill" style={{ background: s.bg, color: s.fg }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot }} /> {e[lang === "qu" ? "qu" : "es"]}</span>;
}
function UrgenciaTag({ u }: { u: string }) {
  if (u === "alta") return <span className="utag alta"><I.alert s={12} /> Alta</span>;
  if (u === "media") return <span className="utag media">Media</span>;
  return <span className="utag baja">Baja</span>;
}

/* ---------- Donut (SVG) ---------- */
function Donut({ data, size = 156 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = 42, c = 2 * Math.PI * r;
  let acc = 0;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{ flex: "none" }}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EDF0F0" strokeWidth="15" />
      {data.filter((d) => d.value > 0).map((d, i) => {
        const frac = d.value / total, len = c * frac, rot = -90 + acc * 360; acc += frac;
        return <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={d.color} strokeWidth="15" strokeDasharray={len + " " + (c - len)} transform={"rotate(" + rot + " 60 60)"} />;
      })}
      <text x="60" y="57" textAnchor="middle" fontFamily="var(--font-head)" fontWeight="800" fontSize="30" fill="#1A211F">{total}</text>
      <text x="60" y="73" textAnchor="middle" fontFamily="var(--font-head)" fontWeight="700" fontSize="8.5" letterSpacing="1.5" fill="#9AA5A4">TOTAL</text>
    </svg>
  );
}

/* ---------- Rail ---------- */
function CrmRail({ view, setView, onLogout }: { view: string; setView: (v: string) => void; onLogout: () => void }) {
  const items = [
    { id: "bandeja", label: "Bandeja territorial", icon: <I.filter s={18} /> },
    { id: "tablero", label: "Tablero resumen", icon: <I.sparkle s={16} /> },
  ];
  return (
    <aside className="crm-rail">
      <div style={{ padding: "4px 6px 18px" }}><PunkuLogo tone="crm" /></div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {items.map((it) => (
          <button key={it.id} onClick={() => setView(it.id)} className={"rail-item" + ((view === it.id || (it.id === "bandeja" && (view === "detalle" || view === "solicitud"))) ? " active" : "")}>
            {it.icon}<span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-foot">
        <div className="rail-foot-user">
          <div className="rail-avatar">CE</div>
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--slate-700)" }}>Coordinador de enlace</div>
            <div style={{ fontSize: 11.5, color: "var(--slate-400)" }}>Proyección Social · UNCP</div>
          </div>
        </div>
        <Link href="/" className="rail-home"><I.arrowL s={13} /> Volver a la puerta</Link>
        <button className="rail-logout" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}

/* ---------- B1 Bandeja ---------- */
function FilterGroup({ label, value, set, opts }: any) {
  return (
    <div className="fgroup">
      <span className="fgroup-label">{label}</span>
      <div className="fgroup-opts">
        {opts.map(([v, l]: [string, string]) => (
          <button key={v} onClick={() => set(v)} className={"fchip" + (value === v ? " on" : "")}>{l}</button>
        ))}
      </div>
    </div>
  );
}
function Bandeja({ lang, rows, onOpen }: { lang: Lang; rows: Expediente[]; onOpen: (e: Expediente) => void }) {
  const [fEstado, setFEstado] = useState("todos");
  const [fUrg, setFUrg] = useState("todos");
  const [q, setQ] = useState("");
  let list = rows.filter((e) =>
    (fEstado === "todos" || e.estado === fEstado) &&
    (fUrg === "todos" || e.urgencia === fUrg) &&
    (q === "" || (e.comunidad + e.codigo + e.distrito).toLowerCase().includes(q.toLowerCase()))
  );
  list = [...list].sort((a, b) => (a.urgencia === "alta" ? -1 : 0) - (b.urgencia === "alta" ? -1 : 0));

  const exportCsv = () => {
    const head = ["Código", "Comunidad", "Distrito", "Categoría", "Urgencia", "Estado", "Fecha", "Familias"];
    const lines = list.map((e) => [e.codigo, e.comunidad, e.distrito, catOf(e.categoria)?.es || e.categoria, e.urgencia, e.estado, e.creado_en, e.familias_afectadas].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [head.join(","), ...lines].join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "punku-bandeja.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="crm-main">
      <div className="crm-head">
        <div>
          <h2 style={{ fontSize: 22, color: "var(--slate-900)" }}>Bandeja territorial</h2>
          <p style={{ color: "var(--slate-500)", fontSize: 13.5, marginTop: 3 }}>{rows.length} solicitudes · todas en un solo lugar, con trazabilidad</p>
        </div>
        <div className="crm-search">
          <I.search s={16} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar comunidad o código…" />
        </div>
      </div>

      <div className="crm-filters">
        <FilterGroup label="Estado" value={fEstado} set={setFEstado} opts={[["todos", "Todos"], ...ESTADOS.map((e) => [e.id, e.es])]} />
        <FilterGroup label="Urgencia" value={fUrg} set={setFUrg} opts={[["todos", "Todas"], ["alta", "Alta"], ["media", "Media"], ["baja", "Baja"]]} />
        <div style={{ flex: 1 }} />
        <button className="csv-btn" onClick={exportCsv}><I.arrowUR s={15} /> Exportar CSV</button>
      </div>

      <div className="crm-table">
        <div className="crm-tr crm-th">
          <span>Código</span><span>Comunidad · Distrito</span><span className="col-hide">Categoría</span>
          <span className="col-hide">Urgencia</span><span>Estado</span><span className="col-hide">Fecha</span>
        </div>
        {list.map((e) => {
          const c = catOf(e.categoria)!;
          return (
            <button key={e.codigo} className={"crm-tr crm-row" + (e.urgencia === "alta" ? " urgent" : "")} onClick={() => onOpen(e)}>
              <span className="mono">{e.codigo}</span>
              <span>
                <span style={{ fontWeight: 600, color: "var(--slate-800)", display: "block" }}>{e.comunidad}</span>
                <span style={{ fontSize: 12, color: "var(--slate-400)" }}>{e.distrito}</span>
              </span>
              <span className="col-hide" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className="mini-cat" style={{ background: c.tint }}><CatGlyph id={c.icon} size={18} /></span>
                <span style={{ fontSize: 12.5, color: "var(--slate-600)" }}>{c.es.split(" y ")[0]}</span>
              </span>
              <span className="col-hide"><UrgenciaTag u={e.urgencia} /></span>
              <span><EstadoPill id={e.estado} lang={lang} /></span>
              <span className="col-hide" style={{ fontSize: 12.5, color: "var(--slate-500)" }}>{e.creado_en}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Utilidades de exportación / correo (B2) ---------- */
// CSV de UN solo expediente (reutiliza la lógica del export de la bandeja, filtrada).
function exportExpedienteCsv(exp: Expediente) {
  const head = ["Código", "Comunidad", "Distrito", "Categoría", "Urgencia", "Estado", "Fecha", "Familias", "Facultades sugeridas", "ODS", "Resumen formal"];
  const row = [exp.codigo, exp.comunidad, exp.distrito, catOf(exp.categoria)?.es || exp.categoria, exp.urgencia, exp.estado, exp.creado_en, exp.familias_afectadas, exp.facultades_sugeridas.join(" | "), exp.ods_sugerido, exp.resumen_formal];
  const csv = [head.join(","), row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `expediente-${exp.codigo}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// PDF del expediente en formato oficial UNCP (pre-llenado; campos académicos vacíos).
function generarPdfExpediente(exp: Expediente) {
  const modal = modalidadDe(exp);
  const ods = ODS_MAP[exp.categoria] || "ODS 17 · Alianzas";
  const form: B4Form = { objetivoGen: "", objetivosEsp: "", metas: "", metodologia: "", fechaIni: "2026-05-11", fechaFin: "2026-12-28", recursos: "", presupuesto: "", docente: "", evaluacion: "", estudiantes: [{ nombre: "", dni: "", codigo: "" }] };
  const ctx = { area: AREA_MAP[exp.categoria] || "Intervención Tecnológica", modal, ods, justificacion: justificacionIA(exp, ods), fechaIni: form.fechaIni, fechaFin: form.fechaFin, form };
  try {
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    w.document.write(uncpPrintHtml(exp, ctx)); w.document.close(); w.focus();
    setTimeout(() => { try { w.print(); } catch {} }, 500);
  } catch {}
}

/* ---------- Modal: Enviar a la facultad (simulación de correo, frontend puro) ---------- */
function EnviarFacultadModal({ exp, onClose, onEnviado }: { exp: Expediente; onClose: () => void; onEnviado: () => void }) {
  const facultad = exp.facultades_sugeridas.find((f) => !/otra entidad/i.test(f)) || "la facultad correspondiente";
  const asunto = `Solicitud de proyección social — ${exp.comunidad} — deriva a ${facultad}`;
  const cuerpo =
    `${exp.resumen_formal}\n\n` +
    `— Datos del caso —\n` +
    `Comunidad: ${exp.comunidad}\n` +
    `Distrito: ${exp.distrito}, Huancayo, Junín\n` +
    `Familias afectadas: ${exp.familias_afectadas}\n` +
    `Categoría: ${catOf(exp.categoria)?.es}\n` +
    `Urgencia: ${exp.urgencia}\n` +
    `Código de seguimiento: ${exp.codigo}`;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span className="armar-ico lg" style={{ width: 40, height: 40 }}><I.send s={18} /></span>
            <div>
              <h2 style={{ fontSize: 16, color: "var(--slate-900)" }}>Enviar a la facultad</h2>
              <div style={{ fontSize: 12, color: "var(--slate-500)" }}>Vista previa del correo · {exp.codigo}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="modal-body">
          <div className="mail-row"><span className="ml">Para</span><span className="mv mail-placeholder">[correo de la oficina de proyección social de {facultad}]</span></div>
          <div className="mail-row"><span className="ml">Asunto</span><span className="mv">{asunto}</span></div>
          <div className="mail-row" style={{ borderBottom: "none", flexDirection: "column", gap: 4 }}>
            <span className="ml">Cuerpo</span>
            <div className="mail-body-box">{cuerpo}</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--slate-400)", textTransform: "uppercase", letterSpacing: ".04em", marginTop: 14, marginBottom: 8 }}>Adjuntos</div>
          <div className="mail-attachments">
            <button className="attach-chip" onClick={() => generarPdfExpediente(exp)} title="Descargar / imprimir el PDF en formato UNCP"><span className="att-ico pdf">PDF</span> solicitud-{exp.codigo}.pdf</button>
            <button className="attach-chip" onClick={() => exportExpedienteCsv(exp)} title="Descargar el CSV del expediente"><span className="att-ico csv">CSV</span> expediente-{exp.codigo}.csv</button>
          </div>
          <div className="mail-note">
            <I.shield s={15} />
            <span>Vista previa del correo. En producción, con el dominio institucional de la UNCP, este correo se envía automáticamente con un clic, adjuntando el PDF en formato oficial y el CSV. En esta demo, los archivos son reales y descargables; el envío es una simulación.</span>
          </div>
        </div>
        <div className="modal-foot">
          <button className="draft-btn ghost" onClick={onClose}>Cancelar</button>
          <button className="mail-send-btn" onClick={() => { onEnviado(); onClose(); }}><I.send s={16} /> Enviar</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- B2 Detalle ---------- */
function KV({ label, value }: any) { return <div><div className="kv-label">{label}</div><div className="kv-val">{value}</div></div>; }
function Detalle({ lang, exp, onBack, onArmar, onEstado }: {
  lang: Lang; exp: Expediente; onBack: () => void; onArmar: () => void;
  onEstado: (codigo: string, estado: EstadoId, nota: string) => Promise<void>;
}) {
  const [estado, setEstado] = useState<EstadoId>(exp.estado);
  const [nota, setNota] = useState("");
  const [destino, setDestino] = useState(exp.facultades_sugeridas[0] || FACULTADES[0]);
  const [contacto, setContacto] = useState<{ nombre_representante: string; telefono: string } | null>(null);
  const [toast, setToast] = useState("");
  const [showCorreo, setShowCorreo] = useState(false);
  const c = catOf(exp.categoria)!;
  const idx = ESTADOS.findIndex((e) => e.id === estado);
  const next = ESTADOS[idx + 1];
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2400); };

  const avanzar = async () => {
    if (!next) return;
    await onEstado(exp.codigo, next.id, nota);
    setEstado(next.id);
    flash(`Estado actualizado a “${next.es}”. El ciudadano ya lo ve.`);
  };
  const derivar = async () => {
    await onEstado(exp.codigo, "derivado", `Derivado a ${destino}`);
    setEstado("derivado");
    flash(`Derivado a ${destino}.`);
  };
  const revelar = async () => {
    try {
      const res = await fetch(`/api/expedientes/${exp.codigo}/contacto`, { cache: "no-store" });
      if (res.ok) { const d = await res.json(); setContacto(d.contacto); }
      else flash("No se pudo acceder al contacto.");
    } catch { flash("No se pudo acceder al contacto."); }
  };

  return (
    <div className="crm-main">
      <button onClick={onBack} className="crm-back"><I.arrowL s={18} /> Volver a la bandeja</button>

      <div className="det-head">
        <div className="mini-cat lg" style={{ background: c.tint }}><CatGlyph id={c.icon} size={30} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 700, color: "var(--slate-700)" }}>{exp.codigo}</span>
            <UrgenciaTag u={exp.urgencia} />
            <EstadoPill id={estado} lang={lang} />
            <span className="canal-tag">{canalLabel(exp.canal_origen)}</span>
            {exp.datos_incompletos && <span className="incompleto-tag"><I.alert s={12} /> Datos incompletos</span>}
          </div>
          <h2 style={{ fontSize: 20, marginTop: 8, color: "var(--slate-900)", lineHeight: 1.2 }}>{exp.titulo}</h2>
          <p style={{ color: "var(--slate-500)", fontSize: 13.5, marginTop: 4 }}>{exp.comunidad} · {exp.distrito} · {exp.creado_en}</p>
        </div>
      </div>

      {exp.datos_incompletos && (
        <div className="incompleto-banner">
          <I.alert s={18} />
          <span>La clasificación detectó <strong>datos incompletos o poco claros</strong>. El expediente se registró igual (fricción cero para el ciudadano). Conviene <strong>contactar al ciudadano</strong> para completar la información antes de formalizar — usa "Mostrar" → "Contactar por WhatsApp".</span>
        </div>
      )}

      <div className="det-grid">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="card">
            <div className="card-eyebrow"><I.sparkle s={15} /> Resumen formal · {exp.clasificado_por === "ia" ? "generado por IA" : "clasificado por reglas"}</div>
            <p style={{ margin: "10px 0 0", fontSize: 14.5, lineHeight: 1.55, color: "var(--slate-700)" }}>{exp.resumen_formal}</p>
            <div className="conf">
              <span style={{ fontSize: 12, color: "var(--slate-500)", fontWeight: 600 }}>Confianza de la IA</span>
              <div className="conf-bar"><div style={{ width: Math.round(exp.confianza * 100) + "%" }} /></div>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--green-700)" }}>{Math.round(exp.confianza * 100)}%</span>
            </div>
            <div className="ai-note"><I.shield s={14} /> Clasificado sin datos personales. Si la IA falla, se usa la categoría del árbol.</div>
          </div>

          <div className="card">
            <div className="card-eyebrow">Clasificación territorial</div>
            <div className="kv-grid">
              <KV label="Área sugerida" value={<span style={{ display: "flex", alignItems: "center", gap: 7 }}><span className="mini-cat" style={{ background: c.tint, width: 24, height: 24 }}><CatGlyph id={c.icon} size={15} /></span>{c.es}</span>} />
              <KV label="Modalidad" value={exp.modalidad} />
              <KV label="Familias afectadas" value={<span style={{ display: "flex", alignItems: "center", gap: 6 }}><I.users s={15} />{exp.familias_afectadas}</span>} />
              <KV label="Canal de origen" value={canalLabel(exp.canal_origen)} />
            </div>
            <div style={{ marginTop: 14 }}>
              <div className="kv-label">Facultades sugeridas</div>
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 7 }}>
                {exp.facultades_sugeridas.map((f) => <span key={f} className="fac-chip">{f}</span>)}
              </div>
            </div>
          </div>

          <div className="card contact-card">
            <div className="card-eyebrow"><I.phone s={14} /> Datos de contacto</div>
            {contacto ? (
              <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 14, color: "var(--slate-700)" }}><strong>Representante:</strong> {contacto.nombre_representante}</div>
                <div style={{ fontSize: 14, color: "var(--slate-700)" }}><strong>Teléfono:</strong> {contacto.telefono}</div>
                <a className="wa-btn" href={waLink(exp, contacto)} target="_blank" rel="noopener noreferrer">
                  <WaIcon /> Contactar por WhatsApp
                </a>
              </div>
            ) : (
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <span style={{ fontSize: 13, color: "var(--slate-500)" }}>Protegidos. Solo el coordinador puede verlos para llamar.</span>
                <button className="reveal-btn" onClick={revelar}><I.shield s={14} /> Mostrar</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button className="armar-card" onClick={onArmar}>
            <span className="armar-ico"><I.sparkle s={18} /></span>
            <span className="armar-txt">
              <strong>Armar solicitud de proyección social</strong>
              <em>PUNKU pre-llena el formato oficial UNCP. Solo completas lo académico.</em>
            </span>
            <I.arrowR s={18} />
          </button>

          <div className="card">
            <div className="card-eyebrow">Estado del caso</div>
            <div className="state-rail">
              {ESTADOS.map((s, i) => (
                <div key={s.id} className={"sr-item " + (i < idx ? "done" : i === idx ? "cur" : "todo")}>
                  <span className="sr-dot">{i < idx ? <I.check s={11} /> : null}</span>
                  <span className="sr-label">{s.es}</span>
                </div>
              ))}
            </div>
            {next ? (
              <button className="advance-btn" onClick={avanzar}><I.arrowR s={17} /> Avanzar a “{next.es}”</button>
            ) : (
              <div className="closed-note"><I.check s={15} /> Caso cerrado</div>
            )}
            <textarea value={nota} onChange={(e) => setNota(e.target.value)} className="crm-ta" rows={2} placeholder="Nota opcional (queda en el historial)…" />
          </div>

          <div className="card">
            <div className="card-eyebrow">Derivar</div>
            <p style={{ fontSize: 12.5, color: "var(--slate-500)", margin: "6px 0 10px" }}>Elige el destino. Queda registrado en el timeline.</p>
            <select value={destino} onChange={(e) => setDestino(e.target.value)} className="crm-select">
              {FACULTADES.map((f) => <option key={f}>{f}</option>)}
            </select>
            <button className="derive-btn" onClick={derivar}><I.arrowUR s={15} /> Derivar a este destino</button>
          </div>

          <button className="enviar-fac-btn" onClick={() => setShowCorreo(true)}>
            <I.send s={16} /> Enviar a la facultad
          </button>

          <div className="impact-note"><I.users s={16} /> Cada cambio aquí se refleja al instante en la consulta del ciudadano por su código.</div>
        </div>
      </div>

      {toast && <div className="crm-toast fade-in"><I.check s={16} /> {toast}</div>}
      {showCorreo && <EnviarFacultadModal exp={exp} onClose={() => setShowCorreo(false)} onEnviado={() => flash("Correo preparado para la facultad ✓ (simulación)")} />}
    </div>
  );
}

/* ---------- B4 Completar solicitud (formato UNCP) ---------- */
function EdField({ label, children, ai, onAi, loading, pending }: any) {
  return (
    <div className={"ed-field" + (pending ? " pending" : "")}>
      <div className="ed-top">
        <span className="ed-label">{label}{pending && <span className="pend-pill">Pendiente</span>}</span>
        {ai && (
          <button className="ai-btn" onClick={onAi} disabled={loading}>
            {loading ? <><span className="ai-spin" /> Generando…</> : <><I.sparkle s={13} /> Sugerir con IA</>}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
function Solicitud({ exp, onBack }: { exp: Expediente; onBack: () => void }) {
  const c = catOf(exp.categoria)!;
  const modal = modalidadDe(exp);
  const ods = ODS_MAP[exp.categoria] || "ODS 17 · Alianzas";
  const [area, setArea] = useState(AREA_MAP[exp.categoria] || "Intervención Tecnológica");
  const justif = justificacionIA(exp, ods);
  const [f, setF] = useState<B4Form>({
    objetivoGen: "", objetivosEsp: "", metas: "", metodologia: "",
    fechaIni: "2026-05-11", fechaFin: "2026-12-28", recursos: "", presupuesto: "",
    docente: "", evaluacion: "", estudiantes: [{ nombre: "", dni: "", codigo: "" }],
  });
  const [toast, setToast] = useState("");
  const set = (k: keyof B4Form, v: any) => setF((p) => ({ ...p, [k]: v }));
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const setStu = (i: number, k: string, v: string) => setF((p) => { const e = [...p.estudiantes]; e[i] = { ...e[i], [k]: v }; return { ...p, estudiantes: e }; });
  const addStu = () => setF((p) => ({ ...p, estudiantes: [...p.estudiantes, { nombre: "", dni: "", codigo: "" }] }));
  const delStu = (i: number) => setF((p) => ({ ...p, estudiantes: p.estudiantes.filter((_, j) => j !== i) }));
  const wc = exp.titulo.trim().split(/\s+/).length;

  // Progreso del formato oficial: el bloque pre-llenado por PUNKU es la base (~70%);
  // los campos académicos editables suben el resto hasta 100%. Cada campo lleva su
  // etiqueta para resaltar los pendientes y resumir cuáles faltan.
  const CAMPOS_B4 = [
    { key: "objetivoGen", label: "Objetivo general", filled: !!f.objetivoGen.trim() },
    { key: "objetivosEsp", label: "Objetivos específicos", filled: !!f.objetivosEsp.trim() },
    { key: "metas", label: "Metas", filled: !!f.metas.trim() },
    { key: "metodologia", label: "Metodología", filled: !!f.metodologia.trim() },
    { key: "cronograma", label: "Cronograma", filled: !!(f.fechaIni && f.fechaFin) },
    { key: "recursos", label: "Recursos", filled: !!f.recursos.trim() },
    { key: "presupuesto", label: "Presupuesto", filled: !!String(f.presupuesto).trim() },
    { key: "docente", label: "Docente responsable", filled: !!f.docente.trim() },
    { key: "estudiantes", label: "Estudiantes", filled: f.estudiantes.some((e) => e.nombre.trim()) },
    { key: "evaluacion", label: "Evaluación y monitoreo", filled: !!f.evaluacion.trim() },
  ];
  const pendientes = CAMPOS_B4.filter((x) => !x.filled);
  const pct = Math.round(70 + ((CAMPOS_B4.length - pendientes.length) / CAMPOS_B4.length) * 30);

  // "Sugerir con IA": llama al motor real (/api/sugerir). Si la IA no está
  // disponible cae a plantilla; si el expediente no es coherente, avisa y no rellena.
  const [sugiriendo, setSugiriendo] = useState("");
  const sugerir = async (campo: "objetivoGen" | "objetivosEsp" | "metas" | "evaluacion") => {
    if (sugiriendo) return;
    setSugiriendo(campo);
    try {
      const res = await fetch("/api/sugerir", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo: exp.codigo, campo }),
      });
      const d = await res.json();
      if (d.coherente && d.texto) set(campo, d.texto);
      else if (d.coherente === false) flash(d.motivo || "No hay información suficiente para sugerir este campo.");
      else flash("No se pudo generar la sugerencia.");
    } catch { flash("No se pudo generar la sugerencia."); }
    setSugiriendo("");
  };

  const generar = () => {
    const ctx = { area, modal, ods, justificacion: justif, fechaIni: f.fechaIni, fechaFin: f.fechaFin, form: f };
    try {
      const w = window.open("", "_blank", "width=900,height=1100");
      if (!w) { flash("Habilita pop-ups para generar el PDF."); return; }
      w.document.write(uncpPrintHtml(exp, ctx)); w.document.close(); w.focus();
      setTimeout(() => { try { w.print(); } catch {} }, 500);
    } catch { flash("No se pudo abrir el PDF."); }
  };

  const RO = ({ label, children, full }: any) => (
    <div className={"ro-field" + (full ? " full" : "")}>
      <div className="ro-label">{label}</div>
      <div className="ro-val">{children}</div>
    </div>
  );

  return (
    <div className="crm-main">
      <button onClick={onBack} className="crm-back"><I.arrowL s={18} /> Volver al expediente</button>

      <div className="b4-hero">
        <span className="armar-ico lg"><I.sparkle s={20} /></span>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 21, color: "var(--slate-900)" }}>Completar solicitud de proyección social</h2>
          <p style={{ color: "var(--slate-500)", fontSize: 13.5, marginTop: 3, maxWidth: 680 }}>
            PUNKU también traduce para la universidad: en vez de un papel en blanco, te da el formato oficial UNCP semi-llenado con lo que ya sabemos de la comunidad. Tú solo completas lo académico.
          </p>
        </div>
        <div className="b4-meta">
          <span className="mono">{exp.codigo}</span>
          <span>{exp.comunidad} · {exp.distrito}</span>
        </div>
      </div>

      <div className="b4-legend">
        <span><i className="dot g" /> Lo que ya sabemos — pre-llenado por PUNKU</span>
        <span><i className="dot a" /> Completa para formalizar — lo escribe la UNCP</span>
      </div>

      {exp.datos_incompletos && (
        <div className="incompleto-banner" style={{ marginBottom: 14 }}>
          <I.alert s={18} />
          <span>Este expediente entró con <strong>datos incompletos o poco claros</strong>. Revisa lo pre-llenado y, si hace falta, contacta al ciudadano por WhatsApp (en el detalle) antes de formalizar.</span>
        </div>
      )}

      <div className="b4-progress">
        <div className="b4-progress-top">
          <span>Formato oficial completo al <strong>{pct}%</strong></span>
          <span className="b4-progress-hint">{pct >= 100 ? "Listo para generar el PDF" : "Completa los campos resaltados para llegar al 100%"}</span>
        </div>
        <div className="b4-progress-track"><div className="b4-progress-fill" style={{ width: pct + "%" }} /></div>
        {pendientes.length > 0 ? (
          <div className="b4-pending-summary">
            <I.alert s={14} /> Faltan <strong>{pendientes.length}</strong> {pendientes.length === 1 ? "campo" : "campos"} para llegar al 100%: {pendientes.map((p) => p.label).join(", ")}.
          </div>
        ) : (
          <div className="b4-pending-summary done"><I.check s={14} /> Formato completo. Listo para generar el PDF.</div>
        )}
      </div>

      <div className="b4-grid">
        <div className="b4-block pre">
          <div className="b4-bhead g"><I.check s={15} /> Lo que ya sabemos<span>solo lectura</span></div>
          <RO label="Título del proyecto (propuesta)" full>{exp.titulo} <span className={"word-chip" + (wc > 15 ? " over" : "")}>{wc}/15 palabras</span></RO>
          <RO label="Lugar de ejecución">{exp.distrito}, {exp.comunidad} · Huancayo, Junín</RO>
          <RO label="Población beneficiaria"><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><I.users s={14} />{exp.familias_afectadas} familias · {exp.comunidad}</span></RO>
          <RO label="Descripción del problema / necesidad" full>{exp.resumen_formal}</RO>
          <RO label="Resultado que espera la comunidad (en sus palabras)" full>
            <span style={{ display: "inline-flex", alignItems: "flex-start", gap: 7 }}><span style={{ color: "var(--green-600)", flex: "none", marginTop: 2 }}><I.sparkle s={15} /></span><em style={{ fontStyle: "normal" }}>“{exp.resultado_deseado || "—"}”</em></span>
          </RO>
          <RO label="Área de proyección social"><span className="ro-tag">{area}</span> <em className="sug-note">sugerida por IA</em></RO>
          <RO label="Modalidad"><span className="ro-tag">{modal === "poli" ? "Polivalente" : "Monovalente"}</span> <em className="sug-note">{modal === "poli" ? "inter/transdisciplinario" : "una facultad"}</em></RO>
          <RO label="Facultad(es) sugerida(s)" full>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>{exp.facultades_sugeridas.map((fc) => <span key={fc} className="fac-chip">{fc}</span>)}</div>
          </RO>
          <RO label="ODS sugerido"><span className="ods-badge">{ods}</span></RO>
          <RO label="Justificación inicial" full><em style={{ color: "var(--slate-600)", fontStyle: "normal" }}>{justif}</em></RO>
        </div>

        <div className="b4-block fill">
          <div className="b4-bhead a"><I.clock s={15} /> Completa para formalizar<span>la UNCP escribe aquí</span></div>
          <EdField label="Objetivo general" pending={!f.objetivoGen.trim()} ai loading={sugiriendo === "objetivoGen"} onAi={() => sugerir("objetivoGen")}>
            <textarea className="ed-ta" rows={3} value={f.objetivoGen} onChange={(e) => set("objetivoGen", e.target.value)} placeholder="¿Cuál es el propósito principal del proyecto?" />
          </EdField>
          <EdField label="Objetivos específicos" pending={!f.objetivosEsp.trim()} ai loading={sugiriendo === "objetivosEsp"} onAi={() => sugerir("objetivosEsp")}>
            <textarea className="ed-ta" rows={3} value={f.objetivosEsp} onChange={(e) => set("objetivosEsp", e.target.value)} placeholder="Metas concretas a alcanzar (una por línea)." />
          </EdField>
          <EdField label="Metas (cuantitativas)" pending={!f.metas.trim()} ai loading={sugiriendo === "metas"} onAi={() => sugerir("metas")}>
            <textarea className="ed-ta" rows={2} value={f.metas} onChange={(e) => set("metas", e.target.value)} placeholder="Ej.: 1 diagnóstico; 120 familias capacitadas; 1 plan comunal en 6 meses." />
          </EdField>
          <EdField label="Metodología de trabajo" pending={!f.metodologia.trim()}>
            <textarea className="ed-ta" rows={2} value={f.metodologia} onChange={(e) => set("metodologia", e.target.value)} placeholder="Métodos y técnicas, diagnóstico, fases y participación de la comunidad." />
          </EdField>
          <EdField label="Cronograma / periodo de ejecución" pending={!(f.fechaIni && f.fechaFin)}>
            <div style={{ display: "flex", gap: 10 }}>
              <label className="date-lbl">Inicio<input type="date" className="ed-input" value={f.fechaIni} onChange={(e) => set("fechaIni", e.target.value)} /></label>
              <label className="date-lbl">Culminación<input type="date" className="ed-input" value={f.fechaFin} onChange={(e) => set("fechaFin", e.target.value)} /></label>
            </div>
          </EdField>
          <EdField label="Recursos (materiales, humanos, financieros)" pending={!f.recursos.trim()}>
            <textarea className="ed-ta" rows={2} value={f.recursos} onChange={(e) => set("recursos", e.target.value)} placeholder="Qué se necesita para ejecutar el proyecto." />
          </EdField>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <EdField label="Presupuesto estimado (S/)" pending={!String(f.presupuesto).trim()}>
              <input type="number" className="ed-input" value={f.presupuesto} onChange={(e) => set("presupuesto", e.target.value)} placeholder="0.00" />
            </EdField>
            <EdField label="Docente responsable / asesor" pending={!f.docente.trim()}>
              <input className="ed-input" value={f.docente} onChange={(e) => set("docente", e.target.value)} placeholder="Apellidos y nombres" />
            </EdField>
          </div>
          <EdField label="Estudiantes participantes" pending={!f.estudiantes.some((e) => e.nombre.trim())}>
            <div className="stu-list">
              <div className="stu-row head"><span>Apellidos y nombres</span><span>DNI</span><span>Código</span><span /></div>
              {f.estudiantes.map((e, i) => (
                <div className="stu-row" key={i}>
                  <input className="ed-input sm" value={e.nombre} onChange={(ev) => setStu(i, "nombre", ev.target.value)} placeholder="Nombre" />
                  <input className="ed-input sm" value={e.dni} onChange={(ev) => setStu(i, "dni", ev.target.value)} placeholder="DNI" />
                  <input className="ed-input sm" value={e.codigo} onChange={(ev) => setStu(i, "codigo", ev.target.value)} placeholder="Código" />
                  <button className="stu-del" onClick={() => delStu(i)} title="Quitar">×</button>
                </div>
              ))}
              <button className="stu-add" onClick={addStu}>+ Agregar estudiante</button>
            </div>
          </EdField>
          <EdField label="Evaluación y monitoreo (indicadores)" pending={!f.evaluacion.trim()} ai loading={sugiriendo === "evaluacion"} onAi={() => sugerir("evaluacion")}>
            <textarea className="ed-ta" rows={3} value={f.evaluacion} onChange={(e) => set("evaluacion", e.target.value)} placeholder="Indicadores de éxito y herramientas de seguimiento." />
          </EdField>
        </div>
      </div>

      <div className="b4-foot">
        <div className="firma-note"><I.shield s={15} /> Las firmas (Dir. de Proyección Social, Decano y representante comunal) se completan al imprimir el documento — no se digitalizan.</div>
        <div className="b4-actions">
          <button className="draft-btn ghost" onClick={() => flash("Borrador guardado.")}><I.copy s={15} /> Guardar borrador</button>
          <button className="b4-generate" onClick={generar}><I.arrowUR s={16} /> Generar solicitud completa (PDF formato UNCP)</button>
        </div>
      </div>

      {toast && <div className="crm-toast fade-in"><I.check s={16} /> {toast}</div>}
    </div>
  );
}

/* ---------- B3 Tablero ---------- */
function Tablero({ rows }: { rows: Expediente[] }) {
  const total = rows.length;
  const byEstado = ESTADOS.map((s) => ({ ...s, n: rows.filter((e) => e.estado === s.id).length }));
  const atendidas = rows.filter((e) => ["atendido", "cerrado", "derivado"].includes(e.estado)).length;
  const byArea = CATEGORIES.map((c) => ({ ...c, n: rows.filter((e) => e.categoria === c.id).length })).filter((c) => c.n > 0).sort((a, b) => b.n - a.n);
  const byDist = Object.entries(rows.reduce((a: Record<string, number>, e) => { a[e.distrito] = (a[e.distrito] || 0) + 1; return a; }, {})).sort((a, b) => b[1] - a[1]);
  const maxArea = Math.max(1, ...byArea.map((a) => a.n));

  return (
    <div className="crm-main">
      <div className="crm-head"><div>
        <h2 style={{ fontSize: 22, color: "var(--slate-900)" }}>Tablero resumen</h2>
        <p style={{ color: "var(--slate-500)", fontSize: 13.5, marginTop: 3 }}>Nada se pierde: lo que entra, lo que avanza y lo que se atiende.</p>
      </div></div>

      <div className="dash-top">
        <div className="stat-card hero"><div className="stat-num">{total}</div><div className="stat-lbl">Necesidades registradas</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--green-700)" }}>{atendidas}</div><div className="stat-lbl">Atendidas o derivadas</div><div className="ring-bar"><div style={{ width: (total ? atendidas / total * 100 : 0) + "%" }} /></div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--red-600)" }}>{rows.filter((e) => e.urgencia === "alta").length}</div><div className="stat-lbl">Emergencias activas</div></div>
        <div className="stat-card"><div className="stat-num" style={{ color: "var(--terra-600)" }}>{byDist.length}</div><div className="stat-lbl">Distritos alcanzados</div></div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-eyebrow">Por estado</div>
          <div className="donut-wrap">
            <Donut data={byEstado.map((s) => ({ label: s.es, value: s.n, color: ESTADO_STYLE[s.id].dot }))} />
            <div className="donut-legend">
              {byEstado.map((s) => (
                <div key={s.id} className="dl-row">
                  <span className="dl-dot" style={{ background: ESTADO_STYLE[s.id].dot }} />
                  <span className="dl-label">{s.es}</span>
                  <span className="dl-val">{s.n}</span>
                  <span className="dl-pct">{total ? Math.round(s.n / total * 100) : 0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-eyebrow">Por área</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
            {byArea.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span className="mini-cat" style={{ background: a.tint, width: 26, height: 26 }}><CatGlyph id={a.icon} size={16} /></span>
                <span style={{ flex: 1, fontSize: 13, color: "var(--slate-600)" }}>{a.es}</span>
                <div className="hbar" style={{ width: 90 }}><div style={{ width: (a.n / maxArea * 100) + "%", background: a.color }} /></div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--slate-700)", width: 18, textAlign: "right" }}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Login simbólico ---------- */
function Login({ onOk }: { onOk: () => void }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr("");
    try {
      const res = await fetch("/api/panel/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user, pass }) });
      if (res.ok) onOk();
      else setErr("Usuario o clave incorrectos.");
    } catch { setErr("No se pudo iniciar sesión."); }
    setLoading(false);
  };
  return (
    <div className="login-shell">
      <div className="login-card">
        <PunkuLogo tone="crm" />
        <h2 style={{ fontSize: 19, marginTop: 16, color: "var(--slate-900)" }}>Vista institucional — UNCP</h2>
        <p style={{ fontSize: 13, color: "var(--slate-500)", marginTop: 4, lineHeight: 1.5 }}>
          Acceso del Coordinador de enlace territorial. Protege los datos de contacto (sensibles) de la cara pública.
        </p>
        <input className="login-input" placeholder="Usuario" value={user} onChange={(e) => setUser(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        <input className="login-input" placeholder="Clave" type="password" value={pass} onChange={(e) => setPass(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <div className="login-err">{err}</div>}
        <button className="login-btn" onClick={submit} disabled={loading}>{loading ? "…" : "Entrar al panel"}</button>
        <div className="login-demo">Demo: usuario <strong>coordinador</strong> · clave <strong>demo2026</strong></div>
      </div>
    </div>
  );
}

/* ============================================================
   Panel (controlador + gate de login)
   ============================================================ */
export default function PanelPage() {
  const lang: Lang = "es";
  const [auth, setAuth] = useState<boolean | null>(null);
  const [view, setView] = useState("bandeja");
  const [rows, setRows] = useState<Expediente[]>([]);
  const [sel, setSel] = useState<Expediente | null>(null);

  const cargar = async () => {
    try {
      const res = await fetch("/api/expedientes", { cache: "no-store" });
      const d = await res.json();
      setRows(d.expedientes || []);
    } catch { setRows([]); }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/panel/login", { cache: "no-store" });
        const d = await res.json();
        setAuth(!!d.auth);
        if (d.auth) cargar();
      } catch { setAuth(false); }
    })();
  }, []);

  const onLoginOk = () => { setAuth(true); cargar(); };
  const onLogout = async () => { try { await fetch("/api/panel/login", { method: "DELETE" }); } catch {} setAuth(false); setView("bandeja"); };

  const onEstado = async (codigo: string, estado: EstadoId, nota: string) => {
    try {
      await fetch(`/api/expedientes/${codigo}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado, nota }) });
      await cargar();
      setSel((prev) => (prev && prev.codigo === codigo ? { ...prev, estado } : prev));
    } catch {}
  };

  if (auth === null) {
    return <div className="login-shell"><div style={{ color: "var(--slate-400)", fontFamily: "var(--font-head)" }}>Cargando…</div></div>;
  }
  if (!auth) return <Login onOk={onLoginOk} />;

  return (
    <div className="crm-shell">
      <CrmRail view={view} setView={(v) => setView(v)} onLogout={onLogout} />
      {view === "bandeja" && <Bandeja lang={lang} rows={rows} onOpen={(e) => { setSel(e); setView("detalle"); }} />}
      {view === "detalle" && sel && <Detalle lang={lang} exp={sel} onBack={() => { setView("bandeja"); cargar(); }} onArmar={() => setView("solicitud")} onEstado={onEstado} />}
      {view === "solicitud" && sel && <Solicitud exp={sel} onBack={() => setView("detalle")} />}
      {view === "tablero" && <Tablero rows={rows} />}
    </div>
  );
}
