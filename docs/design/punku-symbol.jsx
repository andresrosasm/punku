/* ============================================================
   PUNKU — Símbolo: montaña (apu) con puerta integrada
   variant: 'mark' (logo), 'hero' (bienvenida), 'open' (momento mágico)
   ============================================================ */
const { useRef } = React;

function MountainDoor({ size = 120, variant = 'mark', open = false, className = '' }){
  const uid = useRef('md' + Math.random().toString(36).slice(2, 8)).current;
  const isOpen = variant === 'open' && open;
  const showHalo = variant !== 'mark';

  return (
    <svg width={size} height={size} viewBox="0 0 120 120"
         className={'mtn ' + (isOpen ? 'mtn-open ' : '') + className}
         role="img" aria-label="PUNKU — la montaña que abre su puerta">
      <defs>
        <linearGradient id={uid+'-main'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3F8A63" />
          <stop offset="1" stopColor="#2A5E45" />
        </linearGradient>
        <linearGradient id={uid+'-back'} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C56B3F" />
          <stop offset="1" stopColor="#9A4A2C" />
        </linearGradient>
        <linearGradient id={uid+'-gold'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBE6BC" />
          <stop offset="0.5" stopColor="#F4B954" />
          <stop offset="1" stopColor="#E8A13C" />
        </linearGradient>
        <radialGradient id={uid+'-glow'} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" />
          <stop offset="0.55" stopColor="#F4B954" stopOpacity="0.55" />
          <stop offset="1" stopColor="#F4B954" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Halo cálido */}
      {showHalo && (
        <circle className="mtn-halo" cx="60" cy="58" r="54" fill={`url(#${uid}-glow)`} opacity={isOpen ? 1 : 0.6} />
      )}

      {/* Apu secundario (terracota, detrás) */}
      <path d="M6 100 L40 46 L74 100 Z" fill={`url(#${uid}-back)`} opacity="0.92" />
      {/* Cap del apu secundario */}
      <path d="M40 46 L31 60 L49 60 Z" fill="#F6E2D5" opacity="0.8" />

      {/* Montaña principal (apu, verde) */}
      <path d="M30 100 L74 20 L118 100 Z" fill={`url(#${uid}-main)`} />
      {/* Cara iluminada (sutil) */}
      <path d="M74 20 L118 100 L74 100 Z" fill="#fff" opacity="0.07" />
      {/* Nevado */}
      <path d="M74 20 L60 46 L67 44 L72 52 L78 43 L85 47 Z" fill="#F4F7F2" opacity="0.92" />

      {/* Resplandor que escapa por la puerta */}
      <circle className="mtn-spill" cx="74" cy="80" r="30" fill={`url(#${uid}-glow)`}
              opacity={isOpen ? 1 : 0} />

      {/* Marco de la puerta (en la base de la montaña) */}
      <path d="M60 100 L60 74 Q60 62 74 62 Q88 62 88 74 L88 100 Z"
            fill="#23201A" opacity="0.18" />
      <path d="M62 100 L62 75 Q62 64 74 64 Q86 64 86 75 L86 100 Z"
            fill={`url(#${uid}-gold)`} />
      {/* Luz interior de la puerta */}
      <path d="M65 100 L65 76 Q65 67 74 67 Q83 67 83 76 L83 100 Z"
            fill="#FFF3D2" opacity={isOpen ? 0.95 : 0.7} />

      {/* Hoja de la puerta (se abre en el momento mágico) */}
      <g className="mtn-leaf" style={{ transformOrigin: '65px 82px' }}>
        <path d="M65 100 L65 76 Q65 67 74 67 L74 100 Z" fill="#D08E2A" />
        <circle cx="71" cy="84" r="1.6" fill="#5a3d0c" opacity="0.7" />
      </g>

      {/* Rayos de luz al abrir */}
      {variant === 'open' && (
        <g className="mtn-rays" opacity={isOpen ? 1 : 0}>
          <path d="M74 80 L70 116 L78 116 Z" fill={`url(#${uid}-gold)`} opacity="0.5" />
          <path d="M74 80 L58 112 L66 114 Z" fill={`url(#${uid}-gold)`} opacity="0.35" />
          <path d="M74 80 L90 112 L82 114 Z" fill={`url(#${uid}-gold)`} opacity="0.35" />
        </g>
      )}
    </svg>
  );
}

/* Marca horizontal para cabeceras */
function PunkuLogo({ onClick, tone = 'light' }){
  return (
    <div className="brand" onClick={onClick} style={{cursor:onClick?'pointer':'default'}}>
      <MountainDoor size={34} variant="mark" />
      <div style={{lineHeight:1}}>
        <div className="brand-name"><span className="k">PUN</span>KU</div>
        <div className="brand-tag">{tone==='crm' ? 'Bandeja territorial' : 'UNCP · Huancayo'}</div>
      </div>
    </div>
  );
}

const symbolStyle = document.createElement('style');
symbolStyle.textContent = `
.mtn .mtn-leaf{ transition: transform 1.1s cubic-bezier(.22,1,.36,1); }
.mtn .mtn-spill, .mtn .mtn-rays, .mtn .mtn-halo{ transition: opacity 1s ease; }
.mtn-open .mtn-leaf{ transform: perspective(180px) rotateY(-78deg); }
@media (prefers-reduced-motion: reduce){
  .mtn .mtn-leaf{ transition:none; }
}
`;
document.head.appendChild(symbolStyle);

Object.assign(window, { MountainDoor, PunkuLogo });
