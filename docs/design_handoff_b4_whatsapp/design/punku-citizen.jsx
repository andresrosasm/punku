/* ============================================================
   PUNKU — Cara ciudadana (A0–A6)
   ============================================================ */
const { useState, useEffect } = React;

/* ---------- helpers ---------- */
function resumenFor(catId, problem, detalle, lang){
  const map = {
    contamina:'El agua de la comunidad podría estar contaminada y preocupa para el consumo y la crianza.',
    rio:'El río arrastra basura o relave y afecta el agua de la comunidad.',
    animales:'Los animales de la comunidad se enferman y bajan los ingresos de las familias.',
    cultivos:'Los cultivos están rindiendo poco y se necesita apoyo técnico.',
    refuerzo:'Los niños necesitan refuerzo escolar y acompañamiento.',
    camino:'El camino de la comunidad está en mal estado y dificulta el traslado.',
    riego:'Falta riego para las chacras y eso afecta la producción.',
    campana:'La comunidad solicita una campaña de salud preventiva.',
  };
  if (detalle && detalle.trim().length > 8) return detalle.trim();
  if (problem && map[problem.id]) return map[problem.id];
  return problem ? problem.es : 'La comunidad necesita orientación y apoyo de la UNCP.';
}

/* ---------- A0 Bienvenida ---------- */
function Welcome({ lang, mode, setMode, onStart, onEmergency, onTrack }){
  return (
    <div className="cz fade-in" style={{paddingTop:18}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:4,marginTop:6}}>
        <MountainDoor size={132} variant="hero" />
        <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:13,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--terra-600)',marginTop:4}}>
          {t('w_eyebrow', lang)}
        </div>
      </div>
      <h1 style={{textAlign:'center',marginTop:14,fontSize:25,color:'var(--ink)'}}>{t('w_title', lang)}</h1>
      <p style={{textAlign:'center',color:'var(--ink-70)',fontSize:15.5,marginTop:10,maxWidth:300,marginInline:'auto'}}>{t('w_sub', lang)}</p>

      {/* Toggle facilitador */}
      <div style={{background:'#fff',borderRadius:16,padding:5,marginTop:22,display:'flex',gap:4,boxShadow:'var(--shadow-sm)',border:'1px solid rgba(35,32,26,.07)'}}>
        {[['self',t('w_mode_self',lang)],['other',t('w_mode_other',lang)]].map(([k,label])=>(
          <button key={k} onClick={()=>setMode(k)}
            style={{flex:1,padding:'11px 8px',borderRadius:12,fontSize:13,fontWeight:600,fontFamily:'var(--font-head)',lineHeight:1.2,
              background: mode===k ? 'var(--green-50)':'transparent',
              color: mode===k ? 'var(--green-800)':'var(--ink-50)',
              boxShadow: mode===k ? 'inset 0 0 0 1.5px var(--green-300)':'none'}}>
            {label}
          </button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:12,marginTop:22}}>
        <button className="btn btn-lg btn-green" onClick={onStart}>
          {t('w_start', lang)} <I.arrowR s={22}/>
        </button>
        <button className="btn btn-lg btn-red" onClick={onEmergency} style={{fontSize:17}}>
          <I.alert s={20}/> {t('w_emerg', lang)}
        </button>
        <div style={{textAlign:'center',fontSize:12.5,color:'var(--ink-50)',marginTop:-2}}>{t('w_emerg_hint', lang)}</div>
      </div>

      <button onClick={onTrack} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,margin:'20px auto 0',
        color:'var(--green-700)',fontWeight:600,fontSize:14.5,fontFamily:'var(--font-head)'}}>
        <I.search s={17}/> {t('w_consultar', lang)}
      </button>
    </div>
  );
}

/* ---------- Progress + step shell ---------- */
function StepShell({ step, total, onBack, lang, children }){
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',minHeight:'100%'}}>
      <div className="progress-wrap">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          {onBack && <button onClick={onBack} style={{color:'var(--ink-70)',display:'flex'}}><I.arrowL s={22}/></button>}
          <div className="progress-track" style={{flex:1}}>
            <div className="progress-fill" style={{width:(step/total*100)+'%'}}/>
          </div>
        </div>
        <div className="progress-label">
          <I.sparkle s={14}/> {t('step_of', lang, {a:step, b:total})}
        </div>
      </div>
      <div className="cz" style={{flex:1,paddingTop:14}}>{children}</div>
    </div>
  );
}

/* ---------- A1·A Categoría ---------- */
function StepA({ lang, onPick, onBack }){
  return (
    <StepShell step={1} total={5} onBack={onBack} lang={lang}>
      <h1>{t('stepA_q', lang)}</h1>
      <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('stepA_hint', lang)}</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginTop:18}}>
        {CATEGORIES.map(c=>(
          <button key={c.id} onClick={()=>onPick(c)} className="cat-card"
            style={{'--cc':c.color,'--ct':c.tint}}>
            <div className="cat-ico" style={{background:c.tint}}><CatGlyph id={c.icon} size={40}/></div>
            <span>{catLabel(c, lang)}</span>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

/* ---------- A1·B Qué pasa ---------- */
function StepB({ lang, cat, onPick, onBack }){
  const list = PROBLEMS[cat.id] || [];
  return (
    <StepShell step={2} total={5} onBack={onBack} lang={lang}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
        <div className="cat-ico sm" style={{background:cat.tint}}><CatGlyph id={cat.icon} size={26}/></div>
        <span style={{fontSize:13,fontWeight:600,color:cat.color,fontFamily:'var(--font-head)'}}>{catLabel(cat,lang)}</span>
      </div>
      <h1>{t('stepB_q', lang)}</h1>
      <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('stepB_hint', lang)}</p>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
        {list.map(p=>(
          <button key={p.id} onClick={()=>onPick(p)} className="opt-row" style={{'--cc':cat.color}}>
            <span className="opt-emoji">{p.ic}</span>
            <span className="opt-label">{lang==='qu'?p.qu:p.es}</span>
            <I.arrowR s={18}/>
          </button>
        ))}
      </div>
    </StepShell>
  );
}

/* ---------- A1·C Dónde y a quiénes ---------- */
function StepC({ lang, distrito, setDistrito, familias, setFamilias, onNext, onBack }){
  const presets = [10,30,60,120,200];
  return (
    <StepShell step={3} total={5} onBack={onBack} lang={lang}>
      <h1>{t('stepC_q', lang)}</h1>
      <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('stepC_hint', lang)}</p>

      <label className="fld-label">{t('stepC_distrito', lang)}</label>
      <div className="fld" style={{padding:0}}>
        <span style={{paddingLeft:14,color:'var(--green-700)',display:'flex'}}><I.pin s={20}/></span>
        <select value={distrito} onChange={e=>setDistrito(e.target.value)}
          style={{flex:1,border:'none',background:'transparent',padding:'15px 12px',fontSize:16,color:'var(--ink)',outline:'none',appearance:'none'}}>
          <option value="">Elige tu distrito…</option>
          {DISTRITOS.map(d=><option key={d} value={d}>{d}</option>)}
        </select>
        <span style={{paddingRight:14,color:'var(--ink-50)',display:'flex'}}><I.chevron s={20}/></span>
      </div>

      <label className="fld-label" style={{marginTop:20}}>{t('stepC_familias', lang)}</label>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:18,marginTop:6}}>
        <button onClick={()=>setFamilias(Math.max(1,familias-10))} className="stepper-btn">–</button>
        <div style={{textAlign:'center',minWidth:90}}>
          <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:42,color:'var(--green-800)',lineHeight:1}}>{familias}</div>
          <div style={{fontSize:12.5,color:'var(--ink-50)',display:'flex',alignItems:'center',gap:5,justifyContent:'center',marginTop:4}}><I.users s={14}/> familias</div>
        </div>
        <button onClick={()=>setFamilias(familias+10)} className="stepper-btn">+</button>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',justifyContent:'center',marginTop:16}}>
        {presets.map(n=>(
          <button key={n} onClick={()=>setFamilias(n)} className="chip" style={{background: familias===n?'var(--green-700)':'#fff',color:familias===n?'#fff':'var(--ink-70)'}}>{n}</button>
        ))}
      </div>

      <button className="btn btn-lg btn-green" style={{marginTop:26}} disabled={!distrito} onClick={onNext}>
        {t('next', lang)} <I.arrowR s={20}/>
      </button>
    </StepShell>
  );
}

/* ---------- A1·D Cuéntanos más ---------- */
function StepD({ lang, detalle, setDetalle, onNext, onBack }){
  return (
    <StepShell step={4} total={5} onBack={onBack} lang={lang}>
      <h1>{t('stepD_q', lang)}</h1>
      <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('stepD_hint', lang)}</p>
      <textarea value={detalle} onChange={e=>setDetalle(e.target.value)} className="ta" rows={5}
        placeholder={t('stepD_ph', lang)} />
      <button className="audio-btn"><I.mic s={20}/> {t('stepD_audio', lang)}</button>

      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:22}}>
        <button className="btn btn-lg btn-green" onClick={onNext}>{t('next', lang)} <I.arrowR s={20}/></button>
        <button onClick={onNext} style={{textAlign:'center',color:'var(--ink-50)',fontSize:14,fontWeight:600,padding:6}}>{t('skip', lang)}</button>
      </div>
    </StepShell>
  );
}

/* ---------- A1·Aspiración ¿Qué te gustaría lograr? ---------- */
const PH_GOALS = {
  agro:{es:'Por ejemplo: que mis animales estén sanos y pueda vender mejor mi cosecha…', qu:'Hina: uywaykuna allin kachunku, allinta lantikusaq…'},
  salud:{es:'Por ejemplo: que las familias tengan salud cerca y aprendamos a cuidarnos…', qu:'Hina: ayllukuna qayllapi hampikuyniyuq kachunku…'},
  educ:{es:'Por ejemplo: que nuestros niños aprendan mejor y tengan más oportunidades…', qu:'Hina: wawakuna aswan allinta yachachunku…'},
  agua:{es:'Por ejemplo: que el río vuelva a estar limpio y podamos criar truchas otra vez…', qu:'Hina: mayu yapa llumpaq kachun, truchakunata yapa uywasunman…'},
  cultura:{es:'Por ejemplo: que los jóvenes se queden y valoremos nuestras costumbres…', qu:'Hina: waynakuna qhipakuchunku, kawsayninchikta valorasunman…'},
  infra:{es:'Por ejemplo: que tengamos un mejor camino y un local para reunirnos…', qu:'Hina: aswan allin ñanniyuq kasunman, hukñapaq wasiyuq…'},
};
const GOAL_OPTS = {
  agro:[{ic:'🐄',es:'Animales sanos',qu:'Allin uywakuna'},{ic:'🌾',es:'Mejores cosechas',qu:'Allin tarpuy'},{ic:'💰',es:'Vender mejor',qu:'Allin lantikuy'}],
  salud:[{ic:'❤️',es:'Comunidad sana',qu:'Allin ayllu'},{ic:'💧',es:'Agua segura',qu:'Allin yaku'},{ic:'🏥',es:'Atención más cerca',qu:'Qaylla hampikuy'}],
  educ:[{ic:'📚',es:'Niños que aprenden más',qu:'Wawakuna yachanku'},{ic:'🎓',es:'Más oportunidades',qu:'Aswan ñankuna'},{ic:'🛠️',es:'Aprender un oficio',qu:'Ruray yachay'}],
  agua:[{ic:'💧',es:'Recuperar nuestra agua',qu:'Yakunchikta kutichiy'},{ic:'🌳',es:'Proteger nuestra tierra',qu:'Pachanchikta waqaychay'},{ic:'🧹',es:'Limpiar nuestra zona',qu:'Llaqtanchikta pichay'}],
  cultura:[{ic:'🎭',es:'Rescatar tradiciones',qu:'Kawsayta hataliy'},{ic:'🤝',es:'Comunidad más unida',qu:'Huñasqa ayllu'},{ic:'🌟',es:'Que los jóvenes se queden',qu:'Waynakuna qhipakuy'}],
  infra:[{ic:'🛣️',es:'Mejor camino',qu:'Allin ñan'},{ic:'🚜',es:'Riego para las chacras',qu:'Chakrapaq qalpay'},{ic:'🏛️',es:'Un local comunal',qu:'Ayllu wasi'}],
};
function StepGoal({ lang, cat, aspiracion, setAspiracion, urgencia, setUrgencia, onNext, onBack }){
  const L = lang==='qu'?'qu':'es';
  const opts = (GOAL_OPTS[cat?.id]||GOAL_OPTS.agua);
  const ph = (PH_GOALS[cat?.id]||PH_GOALS.agua)[L];
  const [showText, setShowText] = useState(false);
  const urg = [
    ['alta','🔴',t('urg_high',lang),'var(--red-600)','var(--red-50)'],
    ['anio','🟡',t('urg_year',lang),'var(--gold-500)','var(--gold-100)'],
    ['espera','🟢',t('urg_wait',lang),'var(--green-600)','var(--green-50)'],
  ];
  const isChip = opts.some(o=>o[L]===aspiracion);
  return (
    <StepShell step={5} total={5} onBack={onBack} lang={lang}>
      <h1>{t('goal_q', lang)}</h1>
      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:16}}>
        {opts.map(o=>{
          const sel = aspiracion===o[L];
          return (
            <button key={o.ic+o.es} className={"goal-opt"+(sel?' on':'')} style={{'--cc':cat.color}} onClick={()=>{setAspiracion(o[L]);setShowText(false);}}>
              <span className="goal-emoji">{o.ic}</span>
              <span className="goal-label">{o[L]}</span>
              {sel && <span className="goal-check"><I.check s={15}/></span>}
            </button>
          );
        })}
      </div>

      <div className="goal-alt">
        <button onClick={()=>setShowText(s=>!s)} className={showText?'on':''}>✏️ {t('goal_words', lang)}</button>
        <button><I.mic s={14}/> {t('goal_talk', lang)}</button>
      </div>
      {showText && (
        <textarea autoFocus value={isChip?'':aspiracion} onChange={e=>setAspiracion(e.target.value)} className="ta" rows={3} placeholder={ph} style={{marginTop:4}}/>
      )}

      <div className="goal-urg-q">{t('goal_urg', lang)}</div>
      <div style={{display:'flex',gap:9}}>
        {urg.map(([id,em,lab,col,bg])=>(
          <button key={id} className={"urg-opt"+(urgencia===id?' on':'')} style={{'--uc':col,'--ub':bg}} onClick={()=>setUrgencia(id)}>
            <span className="urg-emoji">{em}</span>
            <span className="urg-lab">{lab}</span>
          </button>
        ))}
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:24}}>
        <button className="btn btn-lg btn-green" onClick={onNext}>{t('next', lang)} <I.arrowR s={20}/></button>
        <button onClick={onNext} style={{textAlign:'center',color:'var(--ink-50)',fontSize:14,fontWeight:600,padding:6}}>{t('goal_skip', lang)}</button>
      </div>
    </StepShell>
  );
}

/* ---------- A2 Contacto ---------- */
function Contact({ lang, data, set, onFinish, onBack }){
  const ok = data.nombre && data.comunidad && data.distrito && data.tel;
  const F = ({k,label,ph,icon,type})=>(
    <>
      <label className="fld-label">{label}</label>
      <div className="fld">
        <span style={{color:'var(--green-700)',display:'flex'}}>{icon}</span>
        <input value={data[k]||''} onChange={e=>set(k,e.target.value)} placeholder={ph} type={type||'text'}
          style={{flex:1,border:'none',background:'transparent',padding:'15px 10px',fontSize:16,color:'var(--ink)',outline:'none'}}/>
      </div>
    </>
  );
  return (
    <div className="fade-in">
      <div className="progress-wrap">
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
          <button onClick={onBack} style={{color:'var(--ink-70)',display:'flex'}}><I.arrowL s={22}/></button>
          <div className="progress-track" style={{flex:1}}><div className="progress-fill" style={{width:'100%'}}/></div>
        </div>
        <div className="progress-label"><I.check s={14}/> {lang==='qu'?'Ñalla tukurunchik':'Casi terminamos'}</div>
      </div>
      <div className="cz" style={{paddingTop:12}}>
        <h1>{t('contact_title', lang)}</h1>
        <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('contact_hint', lang)}</p>
        <div style={{marginTop:8}}>
          <F k="nombre" label={t('c_nombre',lang)} ph="Ej. María Quispe" icon={<I.users s={20}/>}/>
          <F k="comunidad" label={t('c_comunidad',lang)} ph="Ej. CC Sumac Pampa" icon={<I.pin s={20}/>}/>
          <F k="distrito" label={t('c_distrito',lang)} ph="Ej. Sapallanga" icon={<I.pin s={20}/>}/>
          <F k="tel" label={t('c_tel',lang)} ph="Ej. 9xx xxx xxx" icon={<I.phone s={20}/>} type="tel"/>
        </div>
        <div className="privacy-note">
          <span style={{color:'var(--green-700)',flex:'none',marginTop:1}}><I.shield s={20}/></span>
          <span>{t('privacy', lang)}</span>
        </div>
        <button className="btn btn-lg btn-gold" style={{marginTop:18}} disabled={!ok} onClick={onFinish}>
          <I.sparkle s={20}/> {t('finish', lang)}
        </button>
      </div>
    </div>
  );
}

/* ---------- A3 Procesando ---------- */
function Processing({ lang, onDone }){
  const steps = lang==='qu'
    ? ['Caseykita ñawinchachkan…','Área maskachkan…','Códigoykita wakichichkan…']
    : ['Leyendo tu caso…','Buscando el área que te ayuda…','Preparando tu código…'];
  const [i, setI] = useState(0);
  useEffect(()=>{
    const a = setTimeout(()=>setI(1), 1100);
    const b = setTimeout(()=>setI(2), 2200);
    const c = setTimeout(onDone, 3300);
    return ()=>{ clearTimeout(a);clearTimeout(b);clearTimeout(c); };
  },[]);
  return (
    <div className="fade-in" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'100%',padding:'0 30px',textAlign:'center'}}>
      <div className="proc-orb"><MountainDoor size={120} variant="hero"/></div>
      <h1 style={{marginTop:26,fontSize:23}}>{t('proc_title', lang)}</h1>
      <p style={{color:'var(--ink-70)',marginTop:8,fontSize:15}}>{t('proc_sub', lang)}</p>
      <div style={{marginTop:24,display:'flex',flexDirection:'column',gap:11,alignItems:'flex-start'}}>
        {steps.map((s,idx)=>(
          <div key={idx} style={{display:'flex',alignItems:'center',gap:10,opacity: idx<=i?1:0.35,transition:'opacity .4s'}}>
            <span style={{width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
              background: idx<i?'var(--green-700)':(idx===i?'var(--gold-400)':'var(--sand-200)'),color:'#fff',flex:'none'}}>
              {idx<i ? <I.check s={14}/> : <span className="mini-spin" style={{display: idx===i?'block':'none'}}/>}
            </span>
            <span style={{fontSize:14.5,fontWeight:500,color:'var(--ink-70)'}}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- A4 Tarjeta de Reconocimiento (momento mágico) ---------- */
function Recognition({ lang, data, onTrack, urgent }){
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(()=>{ const tmr=setTimeout(()=>setOpen(true), 350); return ()=>clearTimeout(tmr); },[]);
  const copy = ()=>{
    try{ navigator.clipboard && navigator.clipboard.writeText(data.codigo); }catch(e){}
    setCopied(true); setTimeout(()=>setCopied(false), 1800);
  };
  return (
    <div className={"fade-in rec-bg" + (open?' lit':'')} style={{minHeight:'100%',padding:'30px 22px 36px'}}>
      <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}}>
        <MountainDoor size={140} variant="open" open={open}/>
        {urgent && <span className="urgent-pill" style={{marginTop:6}}><I.alert s={14}/> {t('urgent_badge', lang)}</span>}
        <h1 style={{fontSize:27,marginTop:12,color:'var(--green-800)',lineHeight:1.12}}>{t('rec_title', lang)}</h1>
        <p style={{color:'var(--terra-700)',fontSize:15,marginTop:10,maxWidth:290,fontWeight:500}}>{t('rec_sub', lang)}</p>
      </div>

      {/* Código destacado */}
      <div className="rec-code-card">
        <div style={{fontSize:11.5,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--gold-600)',fontWeight:700,fontFamily:'var(--font-head)'}}>{t('rec_code', lang)}</div>
        <div style={{fontFamily:'var(--font-head)',fontWeight:800,fontSize:27,color:'var(--ink)',letterSpacing:'.02em',marginTop:3}}>{data.codigo}</div>
        <button className="copy-btn" onClick={copy}>
          {copied ? <><I.check s={16}/> {t('rec_copied', lang)}</> : <><I.copy s={16}/> {t('rec_copy', lang)}</>}
        </button>
      </div>

      {/* Detalle */}
      <div className="rec-rows">
        <Row icon={<CatGlyph id={data.icon} size={22}/>} label={t('rec_area', lang)} value={data.area} accent/>
        <Row icon={<I.sparkle s={16}/>} label={t('rec_estado', lang)} value={<span className="status-dot"><span/> {ESTADOS[0][lang==='qu'?'qu':'es']}</span>}/>
        <Row icon={<I.users s={16}/>} label={t('rec_help', lang)} value={t('rec_families', lang, {n:data.familias})}/>
        <Row icon={<I.arrowR s={16}/>} label={t('rec_next', lang)} value={t('rec_nextstep', lang)}/>
      </div>

      <div className="rec-need">
        <div style={{fontSize:11.5,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--ink-50)',fontWeight:700,fontFamily:'var(--font-head)'}}>{t('rec_need', lang)}</div>
        <p style={{margin:'6px 0 0',fontSize:14.5,color:'var(--ink)',lineHeight:1.5}}>“{data.resumen}”</p>
      </div>

      <p style={{textAlign:'center',fontSize:13,color:'var(--ink-50)',margin:'16px 0 0',display:'flex',gap:7,alignItems:'center',justifyContent:'center'}}><I.shield s={15}/> {t('rec_save', lang)}</p>
      <button className="btn btn-lg btn-green" style={{marginTop:14}} onClick={onTrack}>
        <I.search s={20}/> {t('rec_track', lang)}
      </button>
    </div>
  );
}
function Row({icon,label,value,accent}){
  return (
    <div className="rec-row">
      <span className="rec-row-ico" style={accent?{background:'var(--green-50)',color:'var(--green-700)'}:{}}>{icon}</span>
      <span className="rec-row-label">{label}</span>
      <span className="rec-row-val" style={accent?{color:'var(--green-800)',fontWeight:700}:{}}>{value}</span>
    </div>
  );
}

/* ---------- A5 Consulta de estado ---------- */
function Track({ lang, presetCode, onBack }){
  const [code, setCode] = useState(presetCode||'');
  const [active, setActive] = useState(!!presetCode);
  const curIdx = 1; // demo: "En revisión"
  const found = EXPEDIENTES.find(e=>e.codigo===code) || { comunidad:'CC Sumac Pampa', distrito:'Sapallanga', familias:48, estado:'revision', cat:'agro' };
  const curEstadoIdx = ESTADOS.findIndex(e=>e.id===found.estado);
  return (
    <div className="fade-in">
      <div className="cz" style={{paddingTop:24}}>
        <button onClick={onBack} style={{color:'var(--ink-70)',display:'flex',marginBottom:14}}><I.arrowL s={22}/></button>
        <h1>{t('track_title', lang)}</h1>
        <p style={{color:'var(--ink-70)',fontSize:14.5,marginTop:8}}>{t('track_hint', lang)}</p>
        <div className="fld" style={{marginTop:14}}>
          <span style={{color:'var(--green-700)',display:'flex'}}><I.search s={20}/></span>
          <input value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder={t('track_ph', lang)}
            style={{flex:1,border:'none',background:'transparent',padding:'15px 10px',fontSize:16,letterSpacing:'.04em',color:'var(--ink)',outline:'none'}}/>
        </div>
        <button className="btn btn-lg btn-green" style={{marginTop:12}} onClick={()=>setActive(true)} disabled={!code}>
          {t('track_btn', lang)}
        </button>
        <button style={{display:'block',margin:'14px auto 0',color:'var(--ink-50)',fontSize:13.5,fontWeight:600}}>{t('track_lost', lang)}</button>

        {active && (
          <div className="fade-in" style={{marginTop:26}}>
            <div className="track-head">
              <div className="cat-ico sm" style={{background:'var(--green-100)'}}><CatGlyph id={found.cat} size={26}/></div>
              <div>
                <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:15}}>{code}</div>
                <div style={{fontSize:12.5,color:'var(--ink-50)'}}>{found.comunidad} · {found.distrito}</div>
              </div>
            </div>
            <div className="timeline">
              {ESTADOS.map((s,idx)=>{
                const done = idx < curEstadoIdx, cur = idx===curEstadoIdx;
                return (
                  <div key={s.id} className={"tl-item "+(done?'done':cur?'cur':'todo')}>
                    <div className="tl-rail">
                      <span className="tl-dot">{done?<I.check s={13}/>:cur?<span className="pulse-dot"/>:null}</span>
                      {idx<ESTADOS.length-1 && <span className="tl-line"/>}
                    </div>
                    <div className="tl-body">
                      <div className="tl-title">{lang==='qu'?s.qu:s.es}{cur && <span className="tl-now">{t('track_now', lang)}</span>}</div>
                      <div className="tl-desc">{lang==='qu'?s.czQu:s.czEs}</div>
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
function Emergency({ lang, onFinish, onBack }){
  const [f, setF] = useState({ que:'', donde:'', quienes:'', contacto:'' });
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const ok = f.que && f.donde && f.contacto;
  return (
    <div className="fade-in emerg-screen">
      <div className="emerg-top">
        <button onClick={onBack} style={{color:'#fff',display:'flex',opacity:.9}}><I.arrowL s={22}/></button>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <I.alert s={22}/>
          <div>
            <div style={{fontFamily:'var(--font-head)',fontWeight:700,fontSize:17}}>{t('emerg_title', lang)}</div>
            <div style={{fontSize:12,opacity:.85}}>{t('emerg_sub', lang)}</div>
          </div>
        </div>
      </div>
      <div className="cz" style={{paddingTop:20}}>
        <label className="fld-label">{t('emerg_q1', lang)}</label>
        <textarea value={f.que} onChange={e=>set('que',e.target.value)} className="ta" rows={3} placeholder={t('emerg_q1ph', lang)}/>
        <label className="fld-label" style={{marginTop:16}}>{t('emerg_q2', lang)}</label>
        <div className="fld"><span style={{color:'var(--red-600)',display:'flex'}}><I.pin s={20}/></span>
          <input value={f.donde} onChange={e=>set('donde',e.target.value)} placeholder="Ej. orilla del río, sector bajo" style={{flex:1,border:'none',background:'transparent',padding:'15px 10px',fontSize:16,outline:'none'}}/></div>
        <label className="fld-label" style={{marginTop:16}}>{t('emerg_q3', lang)}</label>
        <div className="fld"><span style={{color:'var(--red-600)',display:'flex'}}><I.users s={20}/></span>
          <input value={f.quienes} onChange={e=>set('quienes',e.target.value)} placeholder="Ej. unas 120 familias" style={{flex:1,border:'none',background:'transparent',padding:'15px 10px',fontSize:16,outline:'none'}}/></div>
        <label className="fld-label" style={{marginTop:16}}>{t('emerg_contact', lang)}</label>
        <div className="fld"><span style={{color:'var(--red-600)',display:'flex'}}><I.phone s={20}/></span>
          <input value={f.contacto} onChange={e=>set('contacto',e.target.value)} placeholder="Nombre y número" style={{flex:1,border:'none',background:'transparent',padding:'15px 10px',fontSize:16,outline:'none'}}/></div>
        <button className="photo-btn"><I.camera s={20}/> {t('emerg_photo', lang)}</button>
        <button className="btn btn-lg btn-red" style={{marginTop:18}} disabled={!ok} onClick={onFinish}>
          <I.send s={18}/> {t('emerg_send', lang)}
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   CitizenApp — controlador de flujo
   ============================================================ */
function CitizenApp({ lang, screen, setScreen }){
  const [mode, setMode] = useState('self');
  const [cat, setCat] = useState(CATEGORIES[3]); // agua (default seguro para saltos directos)
  const [problem, setProblem] = useState(PROBLEMS.agua[0]);
  const [distrito, setDistrito] = useState('');
  const [familias, setFamilias] = useState(60);
  const [detalle, setDetalle] = useState('');
  const [aspiracion, setAspiracion] = useState('');
  const [aspUrg, setAspUrg] = useState('');
  const [contact, setContact] = useState({});
  const [urgent, setUrgent] = useState(false);
  const setC=(k,v)=>setContact(p=>({...p,[k]:v}));

  const recData = ()=>({
    codigo: urgent ? 'PUNKU-2026-015' : 'PUNKU-2026-001',
    area: cat ? catLabel(cat, lang) : t('cat_agua', lang),
    icon: cat ? cat.icon : 'agua',
    familias: familias,
    resumen: resumenFor(cat?.id, problem, detalle, lang),
  });

  switch(screen){
    case 'welcome': return <Welcome lang={lang} mode={mode} setMode={setMode}
      onStart={()=>{setUrgent(false);setScreen('stepA');}}
      onEmergency={()=>{setUrgent(true);setScreen('emergency');}}
      onTrack={()=>setScreen('track')}/>;
    case 'stepA': return <StepA lang={lang} onBack={()=>setScreen('welcome')} onPick={(c)=>{setCat(c);setProblem(null);setScreen('stepB');}}/>;
    case 'stepB': return <StepB lang={lang} cat={cat} onBack={()=>setScreen('stepA')} onPick={(p)=>{setProblem(p);setScreen('stepC');}}/>;
    case 'stepC': return <StepC lang={lang} distrito={distrito} setDistrito={setDistrito} familias={familias} setFamilias={setFamilias}
      onBack={()=>setScreen('stepB')} onNext={()=>setScreen('stepD')}/>;
    case 'stepD': return <StepD lang={lang} detalle={detalle} setDetalle={setDetalle} onBack={()=>setScreen('stepC')} onNext={()=>setScreen('goal')}/>;
    case 'goal': return <StepGoal lang={lang} cat={cat} aspiracion={aspiracion} setAspiracion={setAspiracion} urgencia={aspUrg} setUrgencia={setAspUrg} onBack={()=>setScreen('stepD')} onNext={()=>setScreen('contact')}/>;
    case 'contact': return <Contact lang={lang} data={contact} set={setC} onBack={()=>setScreen('goal')} onFinish={()=>setScreen('processing')}/>;
    case 'processing': return <Processing lang={lang} onDone={()=>setScreen('recognition')}/>;
    case 'recognition': return <Recognition lang={lang} data={recData()} urgent={urgent} onTrack={()=>setScreen('track')}/>;
    case 'track': return <Track lang={lang} presetCode={''} onBack={()=>setScreen('welcome')}/>;
    case 'emergency': return <Emergency lang={lang} onBack={()=>setScreen('welcome')} onFinish={()=>setScreen('processing')}/>;
    default: return <Welcome lang={lang} mode={mode} setMode={setMode} onStart={()=>setScreen('stepA')} onEmergency={()=>{setUrgent(true);setScreen('emergency');}} onTrack={()=>setScreen('track')}/>;
  }
}

Object.assign(window, { CitizenApp });
