/* ============================================================
   PUNKU — Cara interna / CRM (B1–B3)  · desktop
   Detalle guiado: stepper horizontal + 1 acción por estado
   ============================================================ */

const ESTADO_STYLE = {
  recibido:{bg:'#E8EEF6',fg:'#345A8C',dot:'#4A78B8'},
  revision:{bg:'#FBE6BC',fg:'#8A5A12',dot:'#E8A13C'},
  derivado:{bg:'#EBDFF5',fg:'#6A3E94',dot:'#8A5BB0'},
  atendido:{bg:'#DCEEE3',fg:'#2E6B4E',dot:'#357A58'},
  cerrado:{bg:'#E7EAEA',fg:'#56605F',dot:'#8A9594'},
};
function EstadoPill({ id, lang }){
  const s = ESTADO_STYLE[id]; const e = ESTADOS.find(x=>x.id===id);
  return <span className="pill" style={{background:s.bg,color:s.fg}}>
    <span style={{width:7,height:7,borderRadius:'50%',background:s.dot}}/> {e[lang==='qu'?'qu':'es']}
  </span>;
}
function UrgenciaTag({ u }){
  if(u==='alta') return <span className="utag alta"><I.alert s={12}/> Alta</span>;
  if(u==='media') return <span className="utag media">Media</span>;
  return <span className="utag baja">Baja</span>;
}
function catOf(id){ return CATEGORIES.find(c=>c.id===id); }
function calidadDe(exp){ return exp.calidad || 'rica'; }
function famTxt(exp){ return exp.familias ? exp.familias+' familias' : 'Por estimar'; }

/* Donut chart (SVG) para parts-of-whole */
function Donut({ data, size=156 }){
  const total = data.reduce((a,d)=>a+d.value,0)||1;
  const r=42, c=2*Math.PI*r; let acc=0;
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} style={{flex:'none'}}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="#EDF0F0" strokeWidth="15"/>
      {data.filter(d=>d.value>0).map((d,i)=>{
        const frac=d.value/total, len=c*frac, rot=-90+acc*360; acc+=frac;
        return <circle key={i} cx="60" cy="60" r={r} fill="none" stroke={d.color} strokeWidth="15"
          strokeDasharray={len+' '+(c-len)} transform={'rotate('+rot+' 60 60)'}/>;
      })}
      <text x="60" y="57" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="800" fontSize="30" fill="#1A211F">{total}</text>
      <text x="60" y="73" textAnchor="middle" fontFamily="Sora, sans-serif" fontWeight="700" fontSize="8.5" letterSpacing="1.5" fill="#9AA5A4">TOTAL</text>
    </svg>
  );
}

/* ---------- Rail ---------- */
function CrmRail({ view, setView }){
  const items = [
    {id:'bandeja', label:'Bandeja territorial', icon:<I.filter s={18}/>},
    {id:'tablero', label:'Tablero resumen', icon:<I.sparkle s={16}/>},
  ];
  return (
    <aside className="crm-rail">
      <div style={{padding:'4px 6px 18px'}}><PunkuLogo tone="crm"/></div>
      <nav style={{display:'flex',flexDirection:'column',gap:4}}>
        {items.map(it=>(
          <button key={it.id} onClick={()=>setView(it.id)} className={"rail-item"+((view===it.id||(it.id==='bandeja'&&(view==='detalle'||view==='solicitud')))?' active':'')}>
            {it.icon}<span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="rail-foot">
        <div className="rail-avatar">CE</div>
        <div style={{lineHeight:1.25}}>
          <div style={{fontSize:13,fontWeight:600,color:'var(--slate-700)'}}>Coordinador de enlace</div>
          <div style={{fontSize:11.5,color:'var(--slate-400)'}}>Proyección Social · UNCP</div>
        </div>
      </div>
    </aside>
  );
}

/* ---------- B1 Bandeja ---------- */
function Bandeja({ lang, onOpen, estados }){
  const [fEstado, setFEstado] = useState('todos');
  const [fUrg, setFUrg] = useState('todos');
  const [q, setQ] = useState('');
  const estOf = (e)=> (estados && estados[e.codigo]) || e.estado;
  let rows = EXPEDIENTES.filter(e=>
    (fEstado==='todos'||estOf(e)===fEstado) &&
    (fUrg==='todos'||e.urgencia===fUrg) &&
    (q===''||(e.comunidad+e.codigo+e.distrito).toLowerCase().includes(q.toLowerCase()))
  );
  rows = [...rows].sort((a,b)=> (a.urgencia==='alta'?-1:0) - (b.urgencia==='alta'?-1:0));

  return (
    <div className="crm-main">
      <div className="crm-head">
        <div>
          <h2 style={{fontSize:22,color:'var(--slate-900)'}}>Bandeja territorial</h2>
          <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:3}}>{EXPEDIENTES.length} solicitudes · todas en un solo lugar, con trazabilidad</p>
        </div>
        <div className="crm-search">
          <I.search s={16}/>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar comunidad o código…"/>
        </div>
      </div>

      <div className="crm-filters">
        <FilterGroup label="Estado" value={fEstado} set={setFEstado}
          opts={[['todos','Todos'],...ESTADOS.map(e=>[e.id,e.es])]}/>
        <FilterGroup label="Urgencia" value={fUrg} set={setFUrg}
          opts={[['todos','Todas'],['alta','Alta'],['media','Media'],['baja','Baja']]}/>
        <div style={{flex:1}}/>
        <button className="gbtn gbtn-ghost gbtn-sm"><I.arrowUR s={15}/> Exportar CSV</button>
      </div>

      <div className="crm-table">
        <div className="crm-tr crm-th">
          <span>Código</span><span>Comunidad · Distrito</span><span>Categoría</span>
          <span>Urgencia</span><span>Estado</span><span>Fecha</span>
        </div>
        {rows.map(e=>{
          const c = catOf(e.cat);
          const pobre = calidadDe(e)==='pobre';
          return (
            <button key={e.codigo} className={"crm-tr crm-row"+(e.urgencia==='alta'?' urgent':'')} onClick={()=>onOpen(e)}>
              <span className="mono">{e.codigo}</span>
              <span>
                <span style={{fontWeight:600,color:'var(--slate-800)',display:'block'}}>{e.comunidad}</span>
                <span style={{fontSize:12,color:'var(--slate-400)'}}>{e.distrito}</span>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                <span className="mini-cat" style={{background:c.tint}}><CatGlyph id={c.icon} size={18}/></span>
                <span style={{fontSize:12.5,color:'var(--slate-600)'}}>
                  {pobre ? <span className="senal-chip"><I.alert s={11}/> Por precisar</span> : c.es.split(' y ')[0]}
                </span>
              </span>
              <span><UrgenciaTag u={e.urgencia}/></span>
              <span><EstadoPill id={estOf(e)} lang={lang}/></span>
              <span style={{fontSize:12.5,color:'var(--slate-500)'}}>{e.fecha}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function FilterGroup({ label, value, set, opts }){
  return (
    <div className="fgroup">
      <span className="fgroup-label">{label}</span>
      <div className="fgroup-opts">
        {opts.map(([v,l])=>(
          <button key={v} onClick={()=>set(v)} className={"fchip"+(value===v?' on':'')}>{l}</button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   B2 · Detalle guiado del expediente
   ============================================================ */

/* Stepper horizontal — Recibido → … → Cerrado */
function StepperH({ estado }){
  const idx = ESTADOS.findIndex(e=>e.id===estado);
  return (
    <div className="stepper-h">
      {ESTADOS.map((s,i)=>(
        <div className="sh-cell" key={s.id}>
          {i>0 && <span className={"sh-line"+(i<=idx?' on':'')}/>}
          <div className={"sh-node "+(i<idx?'done':i===idx?'cur':'todo')}>
            <span className="sh-dot">{i<idx ? <I.check s={15}/> : <b>{i+1}</b>}</span>
            <span className="sh-lbl">{s.es}</span>
          </div>
          {i<ESTADOS.length-1 && <span className={"sh-line"+(i<idx?' on':'')}/>}
        </div>
      ))}
    </div>
  );
}

function Detalle({ lang, exp, estado, setEstado, prepared, hasDraft, initialToast, onBack, onArmar }){
  const [nota, setNota] = useState('');
  const [destino, setDestino] = useState(exp.facultades[0]||FACULTADES[0]);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState(initialToast||'');
  const [modal, setModal] = useState(false);
  useEffect(()=>{ if(initialToast){ const id=setTimeout(()=>setToast(''),3000); return ()=>clearTimeout(id); } },[]);
  const c = catOf(exp.cat);
  const pobre = calidadDe(exp)==='pobre';
  const idx = ESTADOS.findIndex(e=>e.id===estado);
  const flash=(m)=>{ setToast(m); setTimeout(()=>setToast(''),2600); };

  /* ----- Tarjeta PASO ACTUAL según estado ----- */
  function PasoActual(){
    if(estado==='recibido'){
      if(pobre){
        return (
          <div className="paso-card warn">
            <div className="paso-eyebrow warn"><I.alert s={15}/> PASO ACTUAL · RECIBIDO · SEÑAL BAJA</div>
            <h3 className="paso-title">Llegó con poca información</h3>
            <p className="paso-desc">La comunidad escribió poco o impreciso, así que PUNKU no pudo clasificar con confianza. <strong>No se rechaza ningún pedido:</strong> conviene contactarla para precisar antes de armar la solicitud. Ahí entra la co-construcción por WhatsApp.</p>
            <div className="paso-actions">
              <button className="gbtn gbtn-primary" onClick={()=>{setEstado('revision');flash('Pasó a “En revisión”. El ciudadano ya lo ve.');}}>
                <I.arrowR s={17}/> Empezar revisión y contactar
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="paso-card">
          <div className="paso-eyebrow"><I.sparkle s={15}/> PASO ACTUAL · RECIBIDO</div>
          <h3 className="paso-title">Recién llegó — revísalo</h3>
          <p className="paso-desc">PUNKU ya clasificó la necesidad. Revisa el resumen y pásalo a revisión para armar la solicitud oficial.</p>
          <div className="paso-actions">
            <button className="gbtn gbtn-primary" onClick={()=>{setEstado('revision');flash('Pasó a “En revisión”. El ciudadano ya lo ve.');}}>
              <I.arrowR s={17}/> Empezar revisión
            </button>
          </div>
        </div>
      );
    }
    if(estado==='revision'){
      if(!prepared){
        return (
          <div className="paso-card">
            <div className="paso-eyebrow"><I.sparkle s={15}/> PASO ACTUAL · EN REVISIÓN {hasDraft && <span className="draft-flag">· borrador guardado</span>}</div>
            <h3 className="paso-title">{hasDraft ? 'Continúa la solicitud' : 'Arma la solicitud oficial'}</h3>
            <p className="paso-desc">
              {hasDraft
                ? <>Tienes un <strong>borrador guardado</strong>. Retómalo donde lo dejaste; cuando esté listo, vuelve y deriva a la facultad.</>
                : pobre
                ? <>Con tan poca información, PUNKU pre-llenó muy poco. En la solicitud podrás <strong>co-construir por WhatsApp</strong>: la IA arma preguntas con opciones, la comunidad responde con números y se completa el formato.</>
                : <>PUNKU ya pre-llenó el formato UNCP con lo que sabe de la comunidad (≈70%). Completa lo académico y, al terminar, deriva a la facultad.</>}
            </p>
            <div className="paso-actions">
              <button className="gbtn gbtn-primary" onClick={onArmar}>
                <I.sparkle s={16}/> {hasDraft ? 'Continuar la solicitud' : 'Armar solicitud y derivar'} <I.arrowR s={16}/>
              </button>
            </div>
          </div>
        );
      }
      /* prepared → derivar */
      return (
        <div className="paso-card">
          <div className="paso-eyebrow"><I.send s={15}/> PASO ACTUAL · EN REVISIÓN</div>
          <h3 className="paso-title">Deriva a la facultad y notifica</h3>
          <p className="paso-desc">Al derivar se abre el correo a la facultad con el <strong>PDF (formato UNCP)</strong> y el <strong>CSV</strong> adjuntos, ya con lo que llenaste. Al confirmar el envío, el caso pasa a “Derivado”.</p>
          <div className="derive-line">
            <label className="derive-field">
              <span>Facultad destino</span>
              <select value={destino} onChange={e=>setDestino(e.target.value)} className="crm-select">
                {FACULTADES.map(f=><option key={f}>{f}</option>)}
              </select>
            </label>
            <button className="gbtn gbtn-primary" onClick={()=>setModal(true)}>
              <I.send s={16}/> Derivar a {destino} <I.arrowR s={15}/>
            </button>
          </div>
          <button className="paso-link" onClick={onArmar}><I.arrowL s={14}/> Volver a editar la solicitud (B4)</button>
        </div>
      );
    }
    if(estado==='derivado'){
      return (
        <div className="paso-card">
          <div className="paso-eyebrow"><I.sparkle s={15}/> PASO ACTUAL · DERIVADO</div>
          <h3 className="paso-title">Una facultad está atendiendo el caso</h3>
          <p className="paso-desc">Cuando la facultad tome el caso y empiece a trabajarlo en la comunidad, márcalo como atendido.</p>
          <div className="paso-actions">
            <button className="gbtn gbtn-primary" onClick={()=>{setEstado('atendido');flash('Estado actualizado a “Atendido”. El ciudadano ya lo ve.');}}>
              <I.arrowR s={17}/> Marcar como atendido
            </button>
          </div>
          <textarea value={nota} onChange={e=>setNota(e.target.value)} className="crm-ta" rows={2} placeholder="Nota opcional (queda en el historial)…"/>
        </div>
      );
    }
    if(estado==='atendido'){
      return (
        <div className="paso-card">
          <div className="paso-eyebrow"><I.sparkle s={15}/> PASO ACTUAL · ATENDIDO</div>
          <h3 className="paso-title">El caso fue atendido</h3>
          <p className="paso-desc">Si el caso ya concluyó, ciérralo. El ciudadano verá que su caso terminó.</p>
          <div className="paso-actions">
            <button className="gbtn gbtn-primary" onClick={()=>{setEstado('cerrado');flash('Caso cerrado. El ciudadano ya lo ve.');}}>
              <I.check s={17}/> Cerrar caso
            </button>
          </div>
          <textarea value={nota} onChange={e=>setNota(e.target.value)} className="crm-ta" rows={2} placeholder="Nota opcional (queda en el historial)…"/>
        </div>
      );
    }
    return (
      <div className="paso-card done">
        <div className="paso-eyebrow"><I.check s={15}/> RECORRIDO COMPLETO</div>
        <h3 className="paso-title">Caso cerrado</h3>
        <p className="paso-desc">El ciudadano ya lo ve en su consulta. No hay más acciones.</p>
      </div>
    );
  }

  return (
    <div className="crm-main">
      <button onClick={onBack} className="crm-back"><I.arrowL s={18}/> Volver a la bandeja</button>

      <div className="det-head">
        <div className="mini-cat lg" style={{background:c.tint}}><CatGlyph id={c.icon} size={30}/></div>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
            <span className="mono" style={{fontSize:13.5,fontWeight:700,color:'var(--slate-700)'}}>{exp.codigo}</span>
            <UrgenciaTag u={exp.urgencia}/>
            <EstadoPill id={estado} lang={lang}/>
            <span className="canal-tag">{exp.canal}</span>
          </div>
          <h2 style={{fontSize:21,marginTop:8,color:'var(--slate-900)',lineHeight:1.2}}>{exp.titulo}</h2>
          <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:4}}>{exp.comunidad} · {exp.distrito} · {exp.fecha}</p>
        </div>
      </div>

      <StepperH estado={estado}/>
      <div className="traza-note"><I.users s={14}/> Cada cambio de estado se refleja al instante en la consulta del ciudadano por su código.</div>

      <PasoActual/>

      {/* Expediente */}
      <div className="det-grid" style={{marginTop:18}}>
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-eyebrow"><I.sparkle s={15}/> Resumen formal · generado por IA</div>
            {pobre && (
              <div className="raw-quote">
                <span className="raw-label">Lo que escribió la comunidad</span>
                <span className="raw-text">“{exp.relato}”</span>
              </div>
            )}
            <p style={{margin:'10px 0 0',fontSize:14.5,lineHeight:1.55,color:'var(--slate-700)'}}>{exp.resumen}</p>
            <div className="conf">
              <span style={{fontSize:12,color:'var(--slate-500)',fontWeight:600}}>Confianza de la IA</span>
              <div className="conf-bar"><div style={{width:exp.confianza+'%',background:pobre?'linear-gradient(90deg,#E8A13C,#C56B3F)':undefined}}/></div>
              <span style={{fontSize:12.5,fontWeight:700,color:pobre?'var(--gold-600)':'var(--green-700)'}}>{exp.confianza}%</span>
            </div>
            <div className="ai-note">
              {pobre
                ? <><I.alert s={14}/> Señal baja: la IA clasificó con poca certeza. No se rechaza el pedido — se recomienda confirmar con la comunidad antes de derivar.</>
                : <><I.shield s={14}/> Clasificado sin datos personales. Si la IA falla, se usa la categoría del árbol.</>}
            </div>
          </div>

          <div className="card">
            <div className="card-eyebrow">Clasificación territorial</div>
            <div className="kv-grid">
              <KV label="Área sugerida" value={pobre ? <span className="kv-pend">Por confirmar</span> : <span style={{display:'flex',alignItems:'center',gap:7}}><span className="mini-cat" style={{background:c.tint,width:24,height:24}}><CatGlyph id={c.icon} size={15}/></span>{c.es}</span>}/>
              <KV label="Modalidad" value={exp.modalidad}/>
              <KV label="Familias afectadas" value={exp.familias ? <span style={{display:'flex',alignItems:'center',gap:6}}><I.users s={15}/>{exp.familias}</span> : <span className="kv-pend">Por estimar</span>}/>
              <KV label="Canal de origen" value={exp.canal}/>
            </div>
            <div style={{marginTop:14}}>
              <div className="kv-label">Facultades sugeridas</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:7}}>
                {exp.facultades.map(f=><span key={f} className="fac-chip">{f}</span>)}
              </div>
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card contact-card">
            <div className="card-eyebrow"><I.phone s={14}/> Datos de contacto</div>
            {revealed ? (
              <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
                <div style={{fontSize:14,color:'var(--slate-700)'}}><strong>Representante:</strong> María Q. (dato ficticio)</div>
                <div style={{fontSize:14,color:'var(--slate-700)'}}><strong>Teléfono:</strong> 9XX XXX XXX</div>
              </div>
            ):(
              <div style={{marginTop:10,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
                <span style={{fontSize:13,color:'var(--slate-500)'}}>Protegidos. Solo el coordinador puede verlos para llamar.</span>
                <button className="gbtn gbtn-ghost gbtn-sm" onClick={()=>setRevealed(true)}><I.shield s={14}/> Mostrar</button>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-eyebrow">Historial del caso</div>
            <div className="state-rail" style={{marginTop:12}}>
              {ESTADOS.map((s,i)=>(
                <div key={s.id} className={"sr-item "+(i<idx?'done':i===idx?'cur':'todo')}>
                  <span className="sr-dot">{i<idx?<I.check s={11}/>:null}</span>
                  <span className="sr-label">{s.es}</span>
                  {i===idx && <span className="sr-now">ahora</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de correo */}
      {modal && (
        <div className="modal-scrim" onClick={()=>setModal(false)}>
          <div className="mail-modal" onClick={e=>e.stopPropagation()}>
            <div className="mail-head">
              <span className="mail-ico"><I.send s={18}/></span>
              <div style={{flex:1}}>
                <h3 style={{fontSize:16,color:'var(--slate-900)'}}>Enviar a la facultad</h3>
                <p style={{fontSize:12.5,color:'var(--slate-500)',marginTop:2}}>Vista previa del correo · {exp.codigo}</p>
              </div>
              <button className="mail-x" onClick={()=>setModal(false)}>×</button>
            </div>
            <div className="mail-body">
              <div className="mail-to"><span className="mail-k">Para</span><span>Facultad de {destino} · Proyección Social</span></div>
              <div className="mail-to"><span className="mail-k">Asunto</span><span>Solicitud de proyección social — {exp.titulo} ({exp.codigo})</span></div>
              <div className="mail-summary">
                <div>Distrito: {exp.distrito}, Huancayo, Junín</div>
                <div>Familias afectadas: {exp.familias||'por estimar'}</div>
                <div>Categoría: {c.es}</div>
                <div>Urgencia: {exp.urgencia}</div>
                <div>Código de seguimiento: {exp.codigo}</div>
              </div>
              <div className="mail-att-label">Adjuntos</div>
              <div className="mail-att"><span className="att-ico pdf">PDF</span>solicitud-{exp.codigo}.pdf</div>
              <div className="mail-att"><span className="att-ico csv">CSV</span>expediente-{exp.codigo}.csv</div>
              <div className="mail-honest"><I.shield s={14}/> Vista previa del correo. En producción, con el dominio institucional de la UNCP, este correo se envía automáticamente con un clic, adjuntando el PDF en formato oficial y el CSV. En esta demo, los archivos son reales y descargables; el envío es una simulación.</div>
            </div>
            <div className="mail-foot">
              <button className="gbtn gbtn-ghost" onClick={()=>setModal(false)}>Cancelar</button>
              <button className="gbtn gbtn-primary" onClick={()=>{setModal(false);setEstado('derivado');flash('Derivado a '+destino+'. Correo enviado (simulación). El ciudadano ya lo ve.');}}>
                <I.send s={16}/> Derivar y enviar
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="crm-toast fade-in"><I.check s={16}/> {toast}</div>}
    </div>
  );
}
function KV({label,value}){ return <div><div className="kv-label">{label}</div><div className="kv-val">{value}</div></div>; }

/* ---------- B3 Tablero ---------- */
function Tablero({ lang }){
  const total = EXPEDIENTES.length;
  const byEstado = ESTADOS.map(s=>({...s, n:EXPEDIENTES.filter(e=>e.estado===s.id).length}));
  const atendidas = EXPEDIENTES.filter(e=>['atendido','cerrado','derivado'].includes(e.estado)).length;
  const byArea = CATEGORIES.map(c=>({...c, n:EXPEDIENTES.filter(e=>e.cat===c.id).length})).filter(c=>c.n>0).sort((a,b)=>b.n-a.n);
  const byDist = Object.entries(EXPEDIENTES.reduce((a,e)=>{a[e.distrito]=(a[e.distrito]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]);
  const maxArea = Math.max(...byArea.map(a=>a.n));

  return (
    <div className="crm-main">
      <div className="crm-head"><div>
        <h2 style={{fontSize:22,color:'var(--slate-900)'}}>Tablero resumen</h2>
        <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:3}}>Nada se pierde: lo que entra, lo que avanza y lo que se atiende.</p>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <button className="gbtn gbtn-ghost gbtn-sm"><I.arrowUR s={15}/> Exportar CSV</button>
        <button className="gbtn gbtn-secondary gbtn-sm"><I.copy s={15}/> Reporte del mes</button>
      </div>
      </div>

      <div className="dash-top">
        <div className="stat-card hero">
          <div className="stat-num">{total}</div>
          <div className="stat-lbl">Necesidades registradas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--green-700)'}}>{atendidas}</div>
          <div className="stat-lbl">Atendidas o derivadas</div>
          <div className="ring-bar"><div style={{width:(atendidas/total*100)+'%'}}/></div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--red-600)'}}>{EXPEDIENTES.filter(e=>e.urgencia==='alta').length}</div>
          <div className="stat-lbl">Emergencias activas</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{color:'var(--terra-600)'}}>{byDist.length}</div>
          <div className="stat-lbl">Distritos alcanzados</div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card-eyebrow">Por estado</div>
          <div className="donut-wrap">
            <Donut data={byEstado.map(s=>({label:s.es,value:s.n,color:ESTADO_STYLE[s.id].dot}))}/>
            <div className="donut-legend">
              {byEstado.map(s=>(
                <div key={s.id} className="dl-row">
                  <span className="dl-dot" style={{background:ESTADO_STYLE[s.id].dot}}/>
                  <span className="dl-label">{s.es}</span>
                  <span className="dl-val">{s.n}</span>
                  <span className="dl-pct">{total?Math.round(s.n/total*100):0}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-eyebrow">Por área</div>
          <div style={{display:'flex',flexDirection:'column',gap:10,marginTop:14}}>
            {byArea.map(a=>(
              <div key={a.id} style={{display:'flex',alignItems:'center',gap:10}}>
                <span className="mini-cat" style={{background:a.tint,width:26,height:26}}><CatGlyph id={a.icon} size={16}/></span>
                <span style={{flex:1,fontSize:13,color:'var(--slate-600)'}}>{a.es}</span>
                <div className="hbar" style={{width:90}}><div style={{width:(a.n/maxArea*100)+'%',background:a.color}}/></div>
                <span style={{fontSize:13,fontWeight:700,color:'var(--slate-700)',width:18,textAlign:'right'}}>{a.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CrmApp
   ============================================================ */
function CrmApp({ lang, view, setView }){
  const [sel, setSel] = useState(EXPEDIENTES[0]);
  const [estados, setEstados] = useState({});
  const [prepared, setPrepared] = useState({});
  const [drafts, setDrafts] = useState({});
  const [detToast, setDetToast] = useState('');
  const cod = sel ? sel.codigo : null;
  const curEstado = sel ? (estados[cod] || sel.estado) : null;
  const setCurEstado = (id)=> setEstados(p=>({...p,[cod]:id}));
  const closeSolicitud = (form, opts={})=>{
    setDrafts(p=>({...p,[cod]:form}));
    if(opts.markReady) setPrepared(p=>({...p,[cod]:true}));
    setDetToast(opts.msg||'');
    setView('detalle');
  };
  return (
    <div className="crm-shell">
      <CrmRail view={view} setView={(v)=>{setView(v);}}/>
      {view==='bandeja' && <Bandeja lang={lang} estados={estados} onOpen={(e)=>{setSel(e);setView('detalle');}}/>}
      {view==='detalle' && sel && <Detalle lang={lang} exp={sel} estado={curEstado} setEstado={setCurEstado}
          prepared={!!prepared[cod]} hasDraft={!!drafts[cod]} initialToast={detToast}
          onBack={()=>{setDetToast('');setView('bandeja');}} onArmar={()=>{setDetToast('');setView('solicitud');}}/>}
      {view==='solicitud' && sel && <Solicitud exp={sel} draft={drafts[cod]} onClose={closeSolicitud}/>}
      {view==='tablero' && <Tablero lang={lang}/>}
    </div>
  );
}

Object.assign(window, { CrmApp, EstadoPill, UrgenciaTag, catOf, KV, ESTADO_STYLE, calidadDe, famTxt });
