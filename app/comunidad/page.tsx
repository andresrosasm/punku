/* ============================================================
   PUNKU — Cara ciudadana (/comunidad)  ·  specs 01, 03, 05
   Flujo end-to-end: necesidad -> IA -> expediente -> código -> tarjeta -> consulta.
   Portado de docs/design/punku-citizen.jsx y cableado a las API routes reales.
   ============================================================ */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { MountainDoor } from "@/components/MountainDoor";
import { CatGlyph, I } from "@/components/icons";
import {
  CATEGORIES, PROBLEMS, DISTRITOS, ESTADOS, GOAL_OPTS, PH_GOALS,
  t, catLabel, catOf, type Lang, type Categoria, type Problem, type CatId, type EstadoId,
} from "@/lib/punku-data";
import type { TarjetaReconocimiento, ConsultaPublica } from "@/lib/types";

type Screen =
  | "welcome" | "stepA" | "stepB" | "stepC" | "stepD" | "goal"
  | "contact" | "processing" | "recognition" | "track" | "emergency";

interface Contacto { nombre?: string; comunidad?: string; distrito?: string; tel?: string }
interface Payload {
  catId: CatId; area: string; quePasa: string; distrito: string; familias: number;
  aspiracion: string; urgenciaCiudadana: string; relato: string; emergencia: boolean;
  mode: string; contacto: Contacto;
}

/* ---------- mini top bar (idioma + acceso discreto al panel para la demo) ---------- */
function CzBar({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="cz-bar">
      <Link href="/" className="brand" style={{ textDecoration: "none" }}>
        <MountainDoor size={32} variant="mark" />
        <div style={{ lineHeight: 1 }}>
          <div className="brand-name"><span className="k">PUN</span>KU</div>
          <div className="brand-tag">UNCP · Huancayo</div>
        </div>
      </Link>
      <div style={{ flex: 1 }} />
      <div className="lang">
        {(["es", "qu"] as Lang[]).map((l) => (
          <button key={l} className={lang === l ? "active" : ""} onClick={() => setLang(l)}>{l.toUpperCase()}</button>
        ))}
      </div>
      {/* El ciudadano NO tiene acceso al panel interno: se quitó el atajo "UNCP".
          El logo PUNKU ya regresa a la puerta (/). */}
    </div>
  );
}

/* ---------- Toast ligero de la cara ciudadana (mensajes de roadmap fase 2) ----------
   Host montado una vez; cualquier componente llama czNotify() sin pasar props. */
let _czNotify: ((msg: string) => void) | null = null;
function czNotify(msg: string) { _czNotify?.(msg); }
function CzToastHost() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    _czNotify = (m) => { setMsg(m); window.setTimeout(() => setMsg(""), 3800); };
    return () => { _czNotify = null; };
  }, []);
  if (!msg) return null;
  return (
    <div className="cz-toast fade-in" role="status">
      <I.clock s={16} /> <span>{msg}</span>
    </div>
  );
}

/* ---------- A0 Bienvenida ---------- */
function Welcome({ lang, mode, setMode, onStart, onEmergency, onTrack }: any) {
  return (
    <div className="cz fade-in" style={{ paddingTop: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 4, marginTop: 6 }}>
        <MountainDoor size={132} variant="hero" />
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 13, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--terra-600)", marginTop: 4 }}>
          {t("w_eyebrow", lang)}
        </div>
      </div>
      <h1 style={{ textAlign: "center", marginTop: 14, fontSize: 25, color: "var(--ink)" }}>{t("w_title", lang)}</h1>
      <p style={{ textAlign: "center", color: "var(--ink-70)", fontSize: 15.5, marginTop: 10, maxWidth: 300, marginInline: "auto" }}>{t("w_sub", lang)}</p>

      <div style={{ background: "#fff", borderRadius: 16, padding: 5, marginTop: 22, display: "flex", gap: 4, boxShadow: "var(--shadow-sm)", border: "1px solid rgba(35,32,26,.07)" }}>
        {([["self", t("w_mode_self", lang)], ["other", t("w_mode_other", lang)]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setMode(k)}
            style={{
              flex: 1, padding: "11px 8px", borderRadius: 12, fontSize: 13, fontWeight: 600, fontFamily: "var(--font-head)", lineHeight: 1.2,
              background: mode === k ? "var(--green-50)" : "transparent",
              color: mode === k ? "var(--green-800)" : "var(--ink-50)",
              boxShadow: mode === k ? "inset 0 0 0 1.5px var(--green-300)" : "none",
            }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
        <button className="btn btn-lg btn-green" onClick={onStart}>{t("w_start", lang)} <I.arrowR s={22} /></button>
        <button className="btn btn-lg btn-red" onClick={onEmergency} style={{ fontSize: 17 }}><I.alert s={20} /> {t("w_emerg", lang)}</button>
        <div style={{ textAlign: "center", fontSize: 12.5, color: "var(--ink-50)", marginTop: -2 }}>{t("w_emerg_hint", lang)}</div>
      </div>

      <button onClick={onTrack} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "20px auto 0", color: "var(--green-700)", fontWeight: 600, fontSize: 14.5, fontFamily: "var(--font-head)" }}>
        <I.search s={17} /> {t("w_consultar", lang)}
      </button>
    </div>
  );
}

/* ---------- Progress + step shell ---------- */
function StepShell({ step, total, onBack, lang, children }: any) {
  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div className="progress-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          {onBack && <button onClick={onBack} style={{ color: "var(--ink-70)", display: "flex" }}><I.arrowL s={22} /></button>}
          <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: (step / total * 100) + "%" }} /></div>
        </div>
        <div className="progress-label"><I.sparkle s={14} /> {t("step_of", lang, { a: step, b: total })}</div>
      </div>
      <div className="cz" style={{ flex: 1, paddingTop: 14 }}>{children}</div>
    </div>
  );
}

function StepA({ lang, onPick, onBack }: any) {
  return (
    <StepShell step={1} total={5} onBack={onBack} lang={lang}>
      <h1>{t("stepA_q", lang)}</h1>
      <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("stepA_hint", lang)}</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} className="cat-card" style={{ ["--cc" as any]: c.color, ["--ct" as any]: c.tint }}>
            <div className="cat-ico" style={{ background: c.tint }}><CatGlyph id={c.icon} size={40} /></div>
            <span>{catLabel(c, lang)}</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

function StepB({ lang, cat, onPick, onBack }: any) {
  const list: Problem[] = PROBLEMS[cat.id as CatId] || [];
  return (
    <StepShell step={2} total={5} onBack={onBack} lang={lang}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <div className="cat-ico sm" style={{ background: cat.tint }}><CatGlyph id={cat.icon} size={26} /></div>
        <span style={{ fontSize: 13, fontWeight: 600, color: cat.color, fontFamily: "var(--font-head)" }}>{catLabel(cat, lang)}</span>
      </div>
      <h1>{t("stepB_q", lang)}</h1>
      <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("stepB_hint", lang)}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {list.map((p) => (
          <button key={p.id} onClick={() => onPick(p)} className="opt-row" style={{ ["--cc" as any]: cat.color }}>
            <span className="opt-emoji">{p.ic}</span>
            <span className="opt-label">{lang === "qu" ? p.qu : p.es}</span>
            <I.arrowR s={18} />
          </button>
        ))}
      </div>
    </StepShell>
  );
}

function StepC({ lang, distrito, setDistrito, familias, setFamilias, onNext, onBack }: any) {
  const presets = [10, 30, 60, 120, 200];
  return (
    <StepShell step={3} total={5} onBack={onBack} lang={lang}>
      <h1>{t("stepC_q", lang)}</h1>
      <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("stepC_hint", lang)}</p>

      <label className="fld-label">{t("stepC_distrito", lang)}</label>
      <div className="fld" style={{ padding: 0 }}>
        <span style={{ paddingLeft: 14, color: "var(--green-700)", display: "flex" }}><I.pin s={20} /></span>
        <select value={distrito} onChange={(e) => setDistrito(e.target.value)}
          style={{ flex: 1, border: "none", background: "transparent", padding: "15px 12px", fontSize: 16, color: "var(--ink)", outline: "none", appearance: "none" }}>
          <option value="">Elige tu distrito…</option>
          {DISTRITOS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{ paddingRight: 14, color: "var(--ink-50)", display: "flex" }}><I.chevron s={20} /></span>
      </div>

      <label className="fld-label" style={{ marginTop: 20 }}>{t("stepC_familias", lang)}</label>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 6 }}>
        <button onClick={() => setFamilias(Math.max(1, familias - 10))} className="stepper-btn">–</button>
        <div style={{ textAlign: "center", minWidth: 90 }}>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 42, color: "var(--green-800)", lineHeight: 1 }}>{familias}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-50)", display: "flex", alignItems: "center", gap: 5, justifyContent: "center", marginTop: 4 }}><I.users s={14} /> familias</div>
        </div>
        <button onClick={() => setFamilias(familias + 10)} className="stepper-btn">+</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
        {presets.map((n) => (
          <button key={n} onClick={() => setFamilias(n)} className="chip" style={{ background: familias === n ? "var(--green-700)" : "#fff", color: familias === n ? "#fff" : "var(--ink-70)" }}>{n}</button>
        ))}
      </div>

      <button className="btn btn-lg btn-green" style={{ marginTop: 26 }} disabled={!distrito} onClick={onNext}>{t("next", lang)} <I.arrowR s={20} /></button>
    </StepShell>
  );
}

function StepD({ lang, detalle, setDetalle, onNext, onBack }: any) {
  return (
    <StepShell step={4} total={5} onBack={onBack} lang={lang}>
      <h1>{t("stepD_q", lang)}</h1>
      <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("stepD_hint", lang)}</p>
      <textarea value={detalle} onChange={(e) => setDetalle(e.target.value)} className="ta" rows={5} placeholder={t("stepD_ph", lang)} />
      <button className="audio-btn" onClick={() => czNotify(t("roadmap_audio", lang))}><I.mic s={20} /> {t("stepD_audio", lang)}</button>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
        <button className="btn btn-lg btn-green" onClick={onNext}>{t("next", lang)} <I.arrowR s={20} /></button>
        <button onClick={onNext} style={{ textAlign: "center", color: "var(--ink-50)", fontSize: 14, fontWeight: 600, padding: 6 }}>{t("skip", lang)}</button>
      </div>
    </StepShell>
  );
}

function StepGoal({ lang, cat, aspiracion, setAspiracion, urgencia, setUrgencia, onNext, onBack }: any) {
  const L = lang === "qu" ? "qu" : "es";
  const opts = GOAL_OPTS[(cat?.id as CatId)] || GOAL_OPTS.agua;
  const ph = (PH_GOALS[(cat?.id as CatId)] || PH_GOALS.agua)[L as "es" | "qu"];
  const [showText, setShowText] = useState(false);
  const urg: [string, string, string, string, string][] = [
    ["alta", "🔴", t("urg_high", lang), "var(--red-600)", "var(--red-50)"],
    ["anio", "🟡", t("urg_year", lang), "var(--gold-500)", "var(--gold-100)"],
    ["espera", "🟢", t("urg_wait", lang), "var(--green-600)", "var(--green-50)"],
  ];
  const isChip = opts.some((o) => (o as any)[L] === aspiracion);
  return (
    <StepShell step={5} total={5} onBack={onBack} lang={lang}>
      <h1>{t("goal_q", lang)}</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
        {opts.map((o) => {
          const val = (o as any)[L];
          const sel = aspiracion === val;
          return (
            <button key={o.ic + o.es} className={"goal-opt" + (sel ? " on" : "")} style={{ ["--cc" as any]: cat.color }} onClick={() => { setAspiracion(val); setShowText(false); }}>
              <span className="goal-emoji">{o.ic}</span>
              <span className="goal-label">{val}</span>
              {sel && <span className="goal-check"><I.check s={15} /></span>}
            </button>
          );
        })}
      </div>

      <div className="goal-alt">
        <button onClick={() => setShowText((s) => !s)} className={showText ? "on" : ""}>✏️ {t("goal_words", lang)}</button>
        <button onClick={() => czNotify(t("roadmap_audio", lang))}><I.mic s={14} /> {t("goal_talk", lang)}</button>
      </div>
      {showText && (
        <textarea autoFocus value={isChip ? "" : aspiracion} onChange={(e) => setAspiracion(e.target.value)} className="ta" rows={3} placeholder={ph} style={{ marginTop: 4 }} />
      )}

      <div className="goal-urg-q">{t("goal_urg", lang)}</div>
      <div style={{ display: "flex", gap: 9 }}>
        {urg.map(([id, em, lab, col, bg]) => (
          <button key={id} className={"urg-opt" + (urgencia === id ? " on" : "")} style={{ ["--uc" as any]: col, ["--ub" as any]: bg }} onClick={() => setUrgencia(id)}>
            <span className="urg-emoji">{em}</span>
            <span className="urg-lab">{lab}</span>
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
        <button className="btn btn-lg btn-green" onClick={onNext}>{t("next", lang)} <I.arrowR s={20} /></button>
        <button onClick={onNext} style={{ textAlign: "center", color: "var(--ink-50)", fontSize: 14, fontWeight: 600, padding: 6 }}>{t("goal_skip", lang)}</button>
      </div>
    </StepShell>
  );
}

// IMPORTANTE: a nivel de MÓDULO, no dentro de Contact. Si se define dentro, React
// recrea el componente en cada render y el input pierde el foco tras cada tecla
// (solo se escribía la primera letra). Aquí su identidad es estable.
function ContactField({ data, set, k, label, ph, icon, type }: any) {
  return (
    <>
      <label className="fld-label">{label}</label>
      <div className="fld">
        <span style={{ color: "var(--green-700)", display: "flex" }}>{icon}</span>
        <input value={data[k] || ""} onChange={(e) => set(k, e.target.value)} placeholder={ph} type={type || "text"}
          style={{ flex: 1, border: "none", background: "transparent", padding: "15px 10px", fontSize: 16, color: "var(--ink)", outline: "none" }} />
      </div>
    </>
  );
}

function Contact({ lang, data, set, onFinish, onBack }: any) {
  const ok = data.nombre && data.comunidad && data.distrito && data.tel;
  return (
    <div className="fade-in">
      <div className="progress-wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <button onClick={onBack} style={{ color: "var(--ink-70)", display: "flex" }}><I.arrowL s={22} /></button>
          <div className="progress-track" style={{ flex: 1 }}><div className="progress-fill" style={{ width: "100%" }} /></div>
        </div>
        <div className="progress-label"><I.check s={14} /> {lang === "qu" ? "Ñalla tukurunchik" : "Casi terminamos"}</div>
      </div>
      <div className="cz" style={{ paddingTop: 12 }}>
        <h1>{t("contact_title", lang)}</h1>
        <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("contact_hint", lang)}</p>
        <div style={{ marginTop: 8 }}>
          <ContactField data={data} set={set} k="nombre" label={t("c_nombre", lang)} ph="Ej. María Quispe" icon={<I.users s={20} />} />
          <ContactField data={data} set={set} k="comunidad" label={t("c_comunidad", lang)} ph="Ej. CC Sumac Pampa" icon={<I.pin s={20} />} />
          <ContactField data={data} set={set} k="distrito" label={t("c_distrito", lang)} ph="Ej. Sapallanga" icon={<I.pin s={20} />} />
          <ContactField data={data} set={set} k="tel" label={t("c_tel", lang)} ph="Ej. 9xx xxx xxx" icon={<I.phone s={20} />} type="tel" />
        </div>
        <div className="privacy-note">
          <span style={{ color: "var(--green-700)", flex: "none", marginTop: 1 }}><I.shield s={20} /></span>
          <span>{t("privacy", lang)}</span>
        </div>
        <button className="btn btn-lg btn-gold" style={{ marginTop: 18 }} disabled={!ok} onClick={onFinish}>
          <I.sparkle s={20} /> {t("finish", lang)}
        </button>
      </div>
    </div>
  );
}

/* ---------- A3 Procesando (momento IA: llama a la API real) ---------- */
function Processing({ lang, payload, onDone }: { lang: Lang; payload: Payload; onDone: (t: TarjetaReconocimiento) => void }) {
  const steps = lang === "qu"
    ? ["Caseykita ñawinchachkan…", "Área maskachkan…", "Códigoykita wakichichkan…"]
    : ["Leyendo tu caso…", "Buscando el área que te ayuda…", "Preparando tu código…"];
  const [i, setI] = useState(0);

  useEffect(() => {
    const a = setTimeout(() => setI(1), 1100);
    const b = setTimeout(() => setI(2), 2200);
    let done = false;
    const started = Date.now();

    // Llamada real al servidor (con fallback a reglas adentro). Mínimo 3.3s de animación.
    (async () => {
      let tarjeta: TarjetaReconocimiento;
      try {
        const res = await fetch("/api/expedientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        tarjeta = await res.json();
        if (!res.ok || !tarjeta?.codigo) throw new Error("bad");
      } catch {
        // Red caída: la demo no se cae — tarjeta local de respaldo.
        tarjeta = {
          codigo: "PUNKU-2026-000", area: payload.area, categoria: payload.catId,
          familias: payload.familias, resumen: payload.relato || payload.quePasa,
          urgente: payload.emergencia, clasificado_por: "reglas",
        };
      }
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 3300 - elapsed);
      setTimeout(() => { if (!done) { done = true; onDone(tarjeta); } }, wait);
    })();

    return () => { done = true; clearTimeout(a); clearTimeout(b); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "70vh", padding: "0 30px", textAlign: "center" }}>
      <div className="proc-orb"><MountainDoor size={120} variant="hero" /></div>
      <h1 style={{ marginTop: 26, fontSize: 23 }}>{t("proc_title", lang)}</h1>
      <p style={{ color: "var(--ink-70)", marginTop: 8, fontSize: 15 }}>{t("proc_sub", lang)}</p>
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 11, alignItems: "flex-start" }}>
        {steps.map((s, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10, opacity: idx <= i ? 1 : 0.35, transition: "opacity .4s" }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: idx < i ? "var(--green-700)" : (idx === i ? "var(--gold-400)" : "var(--sand-200)"), color: "#fff", flex: "none" }}>
              {idx < i ? <I.check s={14} /> : <span className="mini-spin" style={{ display: idx === i ? "block" : "none" }} />}
            </span>
            <span style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink-70)" }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- A4 Tarjeta de Reconocimiento ---------- */
function Recognition({ lang, tarjeta, onTrack }: { lang: Lang; tarjeta: TarjetaReconocimiento; onTrack: () => void }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { const tmr = setTimeout(() => setOpen(true), 350); return () => clearTimeout(tmr); }, []);
  const copy = () => {
    try { navigator.clipboard && navigator.clipboard.writeText(tarjeta.codigo); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className={"fade-in rec-bg" + (open ? " lit" : "")} style={{ minHeight: "100%", padding: "30px 22px 36px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <MountainDoor size={140} variant="open" open={open} />
        {tarjeta.urgente && <span className="urgent-pill" style={{ marginTop: 6 }}><I.alert s={14} /> {t("urgent_badge", lang)}</span>}
        <h1 style={{ fontSize: 27, marginTop: 12, color: "var(--green-800)", lineHeight: 1.12 }}>{t("rec_title", lang)}</h1>
        <p style={{ color: "var(--terra-700)", fontSize: 15, marginTop: 10, maxWidth: 290, fontWeight: 500 }}>{t("rec_sub", lang)}</p>
      </div>

      <div className="rec-code-card">
        <div style={{ fontSize: 11.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--gold-600)", fontWeight: 700, fontFamily: "var(--font-head)" }}>{t("rec_code", lang)}</div>
        <div style={{ fontFamily: "var(--font-head)", fontWeight: 800, fontSize: 27, color: "var(--ink)", letterSpacing: ".02em", marginTop: 3 }}>{tarjeta.codigo}</div>
        <button className="copy-btn" onClick={copy}>
          {copied ? <><I.check s={16} /> {t("rec_copied", lang)}</> : <><I.copy s={16} /> {t("rec_copy", lang)}</>}
        </button>
      </div>

      <div className="rec-rows">
        <Row icon={<CatGlyph id={tarjeta.categoria} size={22} />} label={t("rec_area", lang)} value={tarjeta.area} accent />
        <Row icon={<I.sparkle s={16} />} label={t("rec_estado", lang)} value={<span className="status-dot"><span /> {ESTADOS[0][lang === "qu" ? "qu" : "es"]}</span>} />
        <Row icon={<I.users s={16} />} label={t("rec_help", lang)} value={t("rec_families", lang, { n: tarjeta.familias })} />
        <Row icon={<I.arrowR s={16} />} label={t("rec_next", lang)} value={t("rec_nextstep", lang)} />
      </div>

      <div className="rec-need">
        <div style={{ fontSize: 11.5, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-50)", fontWeight: 700, fontFamily: "var(--font-head)" }}>{t("rec_need", lang)}</div>
        <p style={{ margin: "6px 0 0", fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>“{tarjeta.resumen}”</p>
      </div>

      <p style={{ textAlign: "center", fontSize: 13, color: "var(--ink-50)", margin: "16px 0 0", display: "flex", gap: 7, alignItems: "center", justifyContent: "center" }}><I.shield s={15} /> {t("rec_save", lang)}</p>
      <button className="btn btn-lg btn-green" style={{ marginTop: 14 }} onClick={onTrack}><I.search s={20} /> {t("rec_track", lang)}</button>
    </div>
  );
}
function Row({ icon, label, value, accent }: any) {
  return (
    <div className="rec-row">
      <span className="rec-row-ico" style={accent ? { background: "var(--green-50)", color: "var(--green-700)" } : {}}>{icon}</span>
      <span className="rec-row-label">{label}</span>
      <span className="rec-row-val" style={accent ? { color: "var(--green-800)", fontWeight: 700 } : {}}>{value}</span>
    </div>
  );
}

/* ---------- A5 Consulta de estado (API real) ---------- */
function Track({ lang, presetCode, onBack }: { lang: Lang; presetCode?: string; onBack: () => void }) {
  const [code, setCode] = useState(presetCode || "");
  const [data, setData] = useState<ConsultaPublica | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const buscar = async (c: string) => {
    if (!c.trim()) return;
    setLoading(true); setNotFound(false); setData(null);
    try {
      const res = await fetch(`/api/estado?codigo=${encodeURIComponent(c.trim())}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
      else setNotFound(true);
    } catch { setNotFound(true); }
    setLoading(false);
  };
  useEffect(() => { if (presetCode) buscar(presetCode); /* eslint-disable-next-line */ }, []);

  const cat = data ? catOf(data.categoria) : null;
  const curEstadoIdx = data ? ESTADOS.findIndex((e) => e.id === data.estado) : -1;

  return (
    <div className="fade-in">
      <div className="cz" style={{ paddingTop: 24 }}>
        <button onClick={onBack} style={{ color: "var(--ink-70)", display: "flex", marginBottom: 14 }}><I.arrowL s={22} /></button>
        <h1>{t("track_title", lang)}</h1>
        <p style={{ color: "var(--ink-70)", fontSize: 14.5, marginTop: 8 }}>{t("track_hint", lang)}</p>
        <div className="fld" style={{ marginTop: 14 }}>
          <span style={{ color: "var(--green-700)", display: "flex" }}><I.search s={20} /></span>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder={t("track_ph", lang)}
            onKeyDown={(e) => { if (e.key === "Enter") buscar(code); }}
            style={{ flex: 1, border: "none", background: "transparent", padding: "15px 10px", fontSize: 16, letterSpacing: ".04em", color: "var(--ink)", outline: "none" }} />
        </div>
        <button className="btn btn-lg btn-green" style={{ marginTop: 12 }} onClick={() => buscar(code)} disabled={!code || loading}>
          {loading ? "…" : t("track_btn", lang)}
        </button>
        <button onClick={() => czNotify(t("roadmap_codigo", lang))} style={{ display: "block", margin: "14px auto 0", color: "var(--ink-50)", fontSize: 13.5, fontWeight: 600 }}>{t("track_lost", lang)}</button>

        {notFound && (
          <p style={{ marginTop: 18, textAlign: "center", color: "var(--terra-700)", fontSize: 14 }}>{t("track_notfound", lang)}</p>
        )}

        {data && cat && (
          <div className="fade-in" style={{ marginTop: 26 }}>
            <div className="track-head">
              <div className="cat-ico sm" style={{ background: "var(--green-100)" }}><CatGlyph id={data.categoria} size={26} /></div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 15 }}>{data.codigo}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-50)" }}>{data.comunidad} · {data.distrito}</div>
              </div>
            </div>
            <div className="timeline">
              {ESTADOS.map((s, idx) => {
                const done = idx < curEstadoIdx, cur = idx === curEstadoIdx;
                return (
                  <div key={s.id} className={"tl-item " + (done ? "done" : cur ? "cur" : "todo")}>
                    <div className="tl-rail">
                      <span className="tl-dot">{done ? <I.check s={13} /> : cur ? <span className="pulse-dot" /> : null}</span>
                      {idx < ESTADOS.length - 1 && <span className="tl-line" />}
                    </div>
                    <div className="tl-body">
                      <div className="tl-title">{lang === "qu" ? s.qu : s.es}{cur && <span className="tl-now">{t("track_now", lang)}</span>}</div>
                      <div className="tl-desc">{lang === "qu" ? s.czQu : s.czEs}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- A6 Emergencias ---------- */
function Emergency({ lang, onFinish, onBack }: { lang: Lang; onFinish: (p: Payload) => void; onBack: () => void }) {
  const [f, setF] = useState({ que: "", donde: "", quienes: "", contacto: "" });
  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));
  const ok = f.que && f.donde && f.contacto;
  const submit = () => {
    const numFam = parseInt((f.quienes.match(/\d+/) || ["50"])[0], 10) || 50;
    onFinish({
      catId: "agua", area: "Medio ambiente y agua", quePasa: f.que, distrito: f.donde,
      familias: numFam, aspiracion: "", urgenciaCiudadana: "alta", relato: f.que,
      emergencia: true, mode: "self",
      contacto: { nombre: f.contacto, comunidad: f.donde, distrito: f.donde, tel: f.contacto },
    });
  };
  return (
    <div className="fade-in emerg-screen">
      <div className="emerg-top">
        <button onClick={onBack} style={{ color: "#fff", display: "flex", opacity: 0.9 }}><I.arrowL s={22} /></button>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <I.alert s={22} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 17 }}>{t("emerg_title", lang)}</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{t("emerg_sub", lang)}</div>
          </div>
        </div>
      </div>
      <div className="cz" style={{ paddingTop: 20 }}>
        <label className="fld-label">{t("emerg_q1", lang)}</label>
        <textarea value={f.que} onChange={(e) => set("que", e.target.value)} className="ta" rows={3} placeholder={t("emerg_q1ph", lang)} />
        <label className="fld-label" style={{ marginTop: 16 }}>{t("emerg_q2", lang)}</label>
        <div className="fld"><span style={{ color: "var(--red-600)", display: "flex" }}><I.pin s={20} /></span>
          <input value={f.donde} onChange={(e) => set("donde", e.target.value)} placeholder="Ej. orilla del río, sector bajo" style={{ flex: 1, border: "none", background: "transparent", padding: "15px 10px", fontSize: 16, outline: "none" }} /></div>
        <label className="fld-label" style={{ marginTop: 16 }}>{t("emerg_q3", lang)}</label>
        <div className="fld"><span style={{ color: "var(--red-600)", display: "flex" }}><I.users s={20} /></span>
          <input value={f.quienes} onChange={(e) => set("quienes", e.target.value)} placeholder="Ej. unas 120 familias" style={{ flex: 1, border: "none", background: "transparent", padding: "15px 10px", fontSize: 16, outline: "none" }} /></div>
        <label className="fld-label" style={{ marginTop: 16 }}>{t("emerg_contact", lang)}</label>
        <div className="fld"><span style={{ color: "var(--red-600)", display: "flex" }}><I.phone s={20} /></span>
          <input value={f.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre y número" style={{ flex: 1, border: "none", background: "transparent", padding: "15px 10px", fontSize: 16, outline: "none" }} /></div>
        <button className="photo-btn" onClick={() => czNotify(t("roadmap_foto", lang))}><I.camera s={20} /> {t("emerg_photo", lang)}</button>
        <button className="btn btn-lg btn-red" style={{ marginTop: 18 }} disabled={!ok} onClick={submit}><I.send s={18} /> {t("emerg_send", lang)}</button>
      </div>
    </div>
  );
}

/* ============================================================
   Controlador de flujo
   ============================================================ */
export default function ComunidadPage() {
  const [lang, setLang] = useState<Lang>("es");
  const [screen, setScreen] = useState<Screen>("welcome");
  const [mode, setMode] = useState("self");
  const [cat, setCat] = useState<Categoria>(CATEGORIES[3]); // agua (default seguro)
  const [problem, setProblem] = useState<Problem | null>(null);
  const [distrito, setDistrito] = useState("");
  const [familias, setFamilias] = useState(60);
  const [detalle, setDetalle] = useState("");
  const [aspiracion, setAspiracion] = useState("");
  const [aspUrg, setAspUrg] = useState("");
  const [contact, setContact] = useState<Contacto>({});
  const [payload, setPayload] = useState<Payload | null>(null);
  const [tarjeta, setTarjeta] = useState<TarjetaReconocimiento | null>(null);
  const setC = (k: string, v: string) => setContact((p) => ({ ...p, [k]: v }));

  const buildPayload = (): Payload => ({
    catId: cat.id, area: cat.es, quePasa: problem ? problem.es : "",
    distrito: contact.distrito || distrito, familias, aspiracion,
    urgenciaCiudadana: aspUrg, relato: detalle, emergencia: false, mode,
    contacto: { nombre: contact.nombre, comunidad: contact.comunidad, distrito: contact.distrito, tel: contact.tel },
  });

  const goProcessing = (p: Payload) => { setPayload(p); setScreen("processing"); };

  let content: React.ReactNode;
  switch (screen) {
    case "welcome": content = <Welcome lang={lang} mode={mode} setMode={setMode} onStart={() => setScreen("stepA")} onEmergency={() => setScreen("emergency")} onTrack={() => setScreen("track")} />; break;
    case "stepA": content = <StepA lang={lang} onBack={() => setScreen("welcome")} onPick={(c: Categoria) => { setCat(c); setProblem(null); setScreen("stepB"); }} />; break;
    case "stepB": content = <StepB lang={lang} cat={cat} onBack={() => setScreen("stepA")} onPick={(p: Problem) => { setProblem(p); setScreen("stepC"); }} />; break;
    case "stepC": content = <StepC lang={lang} distrito={distrito} setDistrito={setDistrito} familias={familias} setFamilias={setFamilias} onBack={() => setScreen("stepB")} onNext={() => setScreen("stepD")} />; break;
    case "stepD": content = <StepD lang={lang} detalle={detalle} setDetalle={setDetalle} onBack={() => setScreen("stepC")} onNext={() => setScreen("goal")} />; break;
    case "goal": content = <StepGoal lang={lang} cat={cat} aspiracion={aspiracion} setAspiracion={setAspiracion} urgencia={aspUrg} setUrgencia={setAspUrg} onBack={() => setScreen("stepD")} onNext={() => setScreen("contact")} />; break;
    case "contact": content = <Contact lang={lang} data={contact} set={setC} onBack={() => setScreen("goal")} onFinish={() => goProcessing(buildPayload())} />; break;
    case "emergency": content = <Emergency lang={lang} onBack={() => setScreen("welcome")} onFinish={(p) => goProcessing(p)} />; break;
    case "processing": content = payload ? <Processing lang={lang} payload={payload} onDone={(tj) => { setTarjeta(tj); setScreen("recognition"); }} /> : null; break;
    case "recognition": content = tarjeta ? <Recognition lang={lang} tarjeta={tarjeta} onTrack={() => setScreen("track")} /> : null; break;
    case "track": content = <Track lang={lang} presetCode={tarjeta?.codigo && tarjeta.codigo !== "PUNKU-2026-000" ? tarjeta.codigo : ""} onBack={() => setScreen("welcome")} />; break;
  }

  // El paso-puerta y la barra superior no aparecen en pantallas inmersivas (emergencia/proc/recog).
  const showBar = !["emergency", "processing", "recognition"].includes(screen);

  return (
    <main className="cz-shell">
      {showBar && <CzBar lang={lang} setLang={setLang} />}
      <div className="cz-screen">{content}</div>
      <CzToastHost />
    </main>
  );
}
