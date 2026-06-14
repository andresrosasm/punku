/* ============================================================
   PUNKU — Íconos. Portado de docs/design/punku-icons.jsx.
   CatGlyph: ilustración de categoría a color. I.*: íconos de UI (trazo).
   ============================================================ */
import type { CSSProperties } from "react";
import type { CatId } from "@/lib/punku-data";

export function CatGlyph({ id, size = 48 }: { id: CatId; size?: number }) {
  const s: CSSProperties = { width: size, height: size, display: "block" };
  switch (id) {
    case "agro":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M10 50 Q32 44 54 50" stroke="#9A4A2C" strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.55" />
          <path d="M32 50 L32 26" stroke="#2E6B4E" strokeWidth="5" strokeLinecap="round" />
          <path d="M32 34 C22 34 17 27 18 19 C28 19 33 25 32 34 Z" fill="#357A58" />
          <path d="M32 30 C42 30 47 23 46 15 C36 15 31 21 32 30 Z" fill="#4A9B72" />
        </svg>
      );
    case "salud":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M32 52 C12 38 14 20 26 20 C31 20 32 24 32 24 C32 24 33 20 38 20 C50 20 52 38 32 52 Z" fill="#B23A2E" />
          <rect x="29" y="28" width="6" height="16" rx="3" fill="#fff" />
          <rect x="24" y="33" width="16" height="6" rx="3" fill="#fff" />
        </svg>
      );
    case "educ":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M32 22 C26 18 18 18 13 20 L13 46 C18 44 26 44 32 48 Z" fill="#C56B3F" />
          <path d="M32 22 C38 18 46 18 51 20 L51 46 C46 44 38 44 32 48 Z" fill="#E7AC8A" />
          <path d="M32 24 L32 48" stroke="#9A4A2C" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    case "agua":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M32 14 C32 14 18 32 18 41 A14 14 0 0 0 46 41 C46 32 32 14 32 14 Z" fill="#2F7E9C" />
          <path d="M28 40 a4 6 0 0 0 4 6" stroke="#CFEAF2" strokeWidth="3" strokeLinecap="round" fill="none" />
        </svg>
      );
    case "cultura":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <circle cx="23" cy="24" r="7" fill="#8A5BB0" />
          <path d="M11 48 C11 38 17 34 23 34 C29 34 35 38 35 48 Z" fill="#8A5BB0" />
          <circle cx="42" cy="27" r="6" fill="#B58BD6" />
          <path d="M31 48 C31 40 36 36 42 36 C48 36 53 40 53 48 Z" fill="#B58BD6" />
        </svg>
      );
    case "infra":
      return (
        <svg viewBox="0 0 64 64" style={s}>
          <path d="M16 28 L32 16 L48 28 Z" fill="#C99A2E" />
          <rect x="19" y="28" width="26" height="22" rx="3" fill="#E8C25E" />
          <rect x="28" y="38" width="8" height="12" rx="2" fill="#9A6F12" />
          <rect x="22" y="32" width="6" height="5" rx="1.5" fill="#fff" opacity="0.85" />
          <rect x="36" y="32" width="6" height="5" rx="1.5" fill="#fff" opacity="0.85" />
        </svg>
      );
    default:
      return null;
  }
}

/* ---- UI icons (trazo) ---- */
type IP = { s?: number };
export const I = {
  arrowR: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>),
  arrowL: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>),
  check: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>),
  copy: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2.5" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>),
  phone: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" /></svg>),
  pin: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>),
  clock: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  users: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg>),
  shield: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M9 12l2 2 4-4" /></svg>),
  alert: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 3.2 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.2a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>),
  camera: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4l1.5 2.5h3A2 2 0 0 1 21 8.5v9A2 2 0 0 1 19 19.5H5A2 2 0 0 1 3 17.5v-9A2 2 0 0 1 5 6.5h3L9.5 4Z" /><circle cx="12" cy="13" r="3.5" /></svg>),
  mic: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>),
  search: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>),
  chevron: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>),
  filter: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 16} height={p?.s || 16} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4-2v-4Z" /></svg>),
  sparkle: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 20} height={p?.s || 20} fill="currentColor"><path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8Z" /><path d="M19 14l.9 2.6L22 17l-2.1.4L19 20l-.9-2.6L16 17l2.1-.4Z" /></svg>),
  arrowUR: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 16} height={p?.s || 16} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9" /></svg>),
  send: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" /></svg>),
  download: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>),
  wand: (p?: IP) => (<svg viewBox="0 0 24 24" width={p?.s || 18} height={p?.s || 18} fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2M15 10V8M11 6H9M21 6h-2M18 9l-1.5-1.5M18 3l-1.5 1.5M4 20l10-10-2-2L2 18Z" /></svg>),
};
