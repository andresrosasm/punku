/* ============================================================
   PUNKU — Cara interna / CRM (B1–B3)  · desktop
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
function Bandeja({ lang, onOpen }){
  const [fEstado, setFEstado] = useState('todos');
  const [fUrg, setFUrg] = useState('todos');
  const [q, setQ] = useState('');
  let rows = EXPEDIENTES.filter(e=>
    (fEstado==='todos'||e.estado===fEstado) &&
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
        <button className="csv-btn"><I.arrowUR s={15}/> Exportar CSV</button>
      </div>

      <div className="crm-table">
        <div className="crm-tr crm-th">
          <span>Código</span><span>Comunidad · Distrito</span><span>Categoría</span>
          <span>Urgencia</span><span>Estado</span><span>Fecha</span>
        </div>
        {rows.map(e=>{
          const c = catOf(e.cat);
          return (
            <button key={e.codigo} className={"crm-tr crm-row"+(e.urgencia==='alta'?' urgent':'')} onClick={()=>onOpen(e)}>
              <span className="mono">{e.codigo}</span>
              <span>
                <span style={{fontWeight:600,color:'var(--slate-800)',display:'block'}}>{e.comunidad}</span>
                <span style={{fontSize:12,color:'var(--slate-400)'}}>{e.distrito}</span>
              </span>
              <span style={{display:'flex',alignItems:'center',gap:8}}>
                <span className="mini-cat" style={{background:c.tint}}><CatGlyph id={c.icon} size={18}/></span>
                <span style={{fontSize:12.5,color:'var(--slate-600)'}}>{c.es.split(' y ')[0]}</span>
              </span>
              <span><UrgenciaTag u={e.urgencia}/></span>
              <span><EstadoPill id={e.estado} lang={lang}/></span>
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

/* ---------- B2 Detalle ---------- */
function Detalle({ lang, exp, onBack, onArmar }){
  const [estado, setEstado] = useState(exp.estado);
  const [nota, setNota] = useState('');
  const [destino, setDestino] = useState(exp.facultades[0]||'');
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState('');
  const c = catOf(exp.cat);
  const idx = ESTADOS.findIndex(e=>e.id===estado);
  const next = ESTADOS[idx+1];
  const flash=(m)=>{ setToast(m); setTimeout(()=>setToast(''),2000); };

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
          <h2 style={{fontSize:20,marginTop:8,color:'var(--slate-900)',lineHeight:1.2}}>{exp.titulo}</h2>
          <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:4}}>{exp.comunidad} · {exp.distrito} · {exp.fecha}</p>
        </div>
      </div>

      <div className="det-grid">
        {/* Izquierda: expediente IA */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="card">
            <div className="card-eyebrow"><I.sparkle s={15}/> Resumen formal · generado por IA</div>
            <p style={{margin:'10px 0 0',fontSize:14.5,lineHeight:1.55,color:'var(--slate-700)'}}>{exp.resumen}</p>
            <div className="conf">
              <span style={{fontSize:12,color:'var(--slate-500)',fontWeight:600}}>Confianza de la IA</span>
              <div className="conf-bar"><div style={{width:exp.confianza+'%'}}/></div>
              <span style={{fontSize:12.5,fontWeight:700,color:'var(--green-700)'}}>{exp.confianza}%</span>
            </div>
            <div className="ai-note"><I.shield s={14}/> Clasificado sin datos personales. Si la IA falla, se usa la categoría del árbol.</div>
          </div>

          <div className="card">
            <div className="card-eyebrow">Clasificación territorial</div>
            <div className="kv-grid">
              <KV label="Área sugerida" value={<span style={{display:'flex',alignItems:'center',gap:7}}><span className="mini-cat" style={{background:c.tint,width:24,height:24}}><CatGlyph id={c.icon} size={15}/></span>{c.es}</span>}/>
              <KV label="Modalidad" value={exp.modalidad}/>
              <KV label="Familias afectadas" value={<span style={{display:'flex',alignItems:'center',gap:6}}><I.users s={15}/>{exp.familias}</span>}/>
              <KV label="Canal de origen" value={exp.canal}/>
            </div>
            <div style={{marginTop:14}}>
              <div className="kv-label">Facultades sugeridas</div>
              <div style={{display:'flex',gap:7,flexWrap:'wrap',marginTop:7}}>
                {exp.facultades.map(f=><span key={f} className="fac-chip">{f}</span>)}
              </div>
            </div>
          </div>

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
                <button className="reveal-btn" onClick={()=>setRevealed(true)}><I.shield s={14}/> Mostrar</button>
              </div>
            )}
          </div>
        </div>

        {/* Derecha: acciones */}
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <button className="armar-card" onClick={()=>onArmar(exp)}>
            <span className="armar-ico"><I.sparkle s={18}/></span>
            <span className="armar-txt">
              <strong>Armar solicitud de proyección social</strong>
              <em>PUNKU pre-llena el formato oficial UNCP. Solo completas lo académico.</em>
            </span>
            <I.arrowR s={18}/>
          </button>

          <div className="card">
            <div className="card-eyebrow">Estado del caso</div>
            <div className="state-rail">
              {ESTADOS.map((s,i)=>(
                <div key={s.id} className={"sr-item "+(i<idx?'done':i===idx?'cur':'todo')}>
                  <span className="sr-dot">{i<idx?<I.check s={11}/>:null}</span>
                  <span className="sr-label">{s.es}</span>
                </div>
              ))}
            </div>
            {next ? (
              <button className="advance-btn" onClick={()=>{setEstado(next.id);flash('Estado actualizado a “'+next.es+'”. El ciudadano ya lo ve.');}}>
                <I.arrowR s={17}/> Avanzar a “{next.es}”
              </button>
            ):(
              <div className="closed-note"><I.check s={15}/> Caso cerrado</div>
            )}
            <textarea value={nota} onChange={e=>setNota(e.target.value)} className="crm-ta" rows={2} placeholder="Nota opcional (queda en el historial)…"/>
          </div>

          <div className="card">
            <div className="card-eyebrow">Derivar</div>
            <p style={{fontSize:12.5,color:'var(--slate-500)',margin:'6px 0 10px'}}>Elige el destino. Queda registrado en el timeline.</p>
            <select value={destino} onChange={e=>setDestino(e.target.value)} className="crm-select">
              {FACULTADES.map(f=><option key={f}>{f}</option>)}
            </select>
            <button className="derive-btn" onClick={()=>{setEstado('derivado');flash('Derivado a '+destino+'.');}}>
              <I.arrowUR s={15}/> Derivar a este destino
            </button>
          </div>

          <div className="impact-note"><I.users s={16}/> Cada cambio aquí se refleja al instante en la consulta del ciudadano por su código.</div>
        </div>
      </div>

      {toast && <div className="crm-toast fade-in"><I.check s={16}/> {toast}</div>}
    </div>
  );
}
function KV({label,value}){ return <div><div className="kv-label">{label}</div><div className="kv-val">{value}</div></div>; }

/* ---------- B2 · Borrador de solicitud de proyección social ---------- */
function modalidadDe(exp){
  const reales = exp.facultades.filter(f=>!/otra entidad/i.test(f));
  return reales.length>1 ? 'poli' : 'mono';
}
const PENDIENTES = [
  ['Objetivo general y objetivos específicos','Definir el alcance académico del proyecto.'],
  ['Docente responsable / asesor','Asignar por la facultad ejecutora.'],
  ['Estudiantes participantes','Según convocatoria o voluntariado.'],
  ['Presupuesto estimado y partida','Costeo y fuente de financiamiento.'],
  ['Cronograma / periodo de ejecución','Fechas de inicio y fin, hitos.'],
  ['Resultados esperados e indicadores','Metas verificables.'],
  ['Firmas','Dir. Responsabilidad Social · Decano(a) · Representante comunal.'],
];
function draftPrellenado(exp, c, modal){
  return [
    ['Denominación del proyecto (propuesta)', exp.titulo],
    ['Resumen de la necesidad', exp.resumen],
    ['Línea / área de proyección social', c.es],
    ['Modalidad', modal==='poli' ? 'Polivalente · varias facultades' : 'Monovalente · una facultad'],
    ['Facultad(es) ejecutora(s) sugerida(s)', exp.facultades.join(' · ')],
    ['Beneficiarios', exp.familias + ' familias · ' + exp.comunidad],
    ['Localización', exp.distrito + ', Huancayo, Junín'],
    ['Origen de la solicitud', exp.codigo + ' · ' + exp.canal + ' · ' + exp.fecha],
  ];
}
function draftTexto(exp, c, modal){
  const pre = draftPrellenado(exp,c,modal).map(([k,v])=>k+': '+v).join('\n');
  const pen = PENDIENTES.map(([k])=>k+': ____________').join('\n');
  return 'SOLICITUD DE PROYECTO DE PROYECCIÓN SOCIAL — UNCP (BORRADOR)\n'+
    'Pre-llenado por PUNKU desde la necesidad de la comunidad · '+exp.codigo+'\n\n'+
    '— PRE-LLENADO POR PUNKU —\n'+pre+'\n\n'+
    '— POR COMPLETAR EN LA UNCP —\n'+pen+'\n';
}
function draftPrintHtml(exp, c, modal){
  const pre = draftPrellenado(exp,c,modal).map(([k,v])=>
    `<tr><td class="l">${k}</td><td class="v">${v}</td></tr>`).join('');
  const pen = PENDIENTES.map(([k,h])=>
    `<tr><td class="l">${k}</td><td class="v pend"><span class="line"></span><em>${h}</em></td></tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>Borrador ${exp.codigo}</title>
  <style>
   *{box-sizing:border-box;font-family:'Inter',system-ui,sans-serif;}
   body{margin:0;padding:46px 54px;color:#23201A;}
   .hd{display:flex;align-items:center;gap:12px;border-bottom:3px solid #2E6B4E;padding-bottom:14px;}
   .hd .m{width:34px;height:34px;background:#2E6B4E;border-radius:8px;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;}
   h1{font-size:18px;margin:0;letter-spacing:-.01em;}
   .sub{font-size:12px;color:#8B8275;margin-top:2px;}
   .badge{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:5px 11px;border-radius:99px;margin:22px 0 8px;}
   .b1{background:#DCEEE3;color:#2E6B4E;} .b2{background:#FBE6BC;color:#8A5A12;}
   table{width:100%;border-collapse:collapse;}
   td{padding:9px 8px;vertical-align:top;border-bottom:1px solid #EEE7DA;font-size:12.5px;}
   td.l{width:230px;color:#5C5347;font-weight:600;}
   td.v{color:#23201A;}
   td.v.pend{color:#B98A2E;}
   .line{display:inline-block;width:60%;border-bottom:1.5px dashed #C9B58A;height:13px;vertical-align:middle;margin-right:8px;}
   em{color:#A99877;font-style:normal;font-size:11px;}
   .ft{margin-top:28px;font-size:11px;color:#A99877;}
  </style></head><body>
   <div class="hd"><div class="m">P</div><div><h1>Solicitud de proyecto de proyección social — UNCP</h1>
   <div class="sub">Borrador generado por PUNKU · ${exp.codigo} · ${exp.fecha}</div></div></div>
   <div class="badge b1">Pre-llenado por PUNKU · desde la comunidad</div>
   <table>${pre}</table>
   <div class="badge b2">Por completar en la UNCP</div>
   <table>${pen}</table>
   <div class="ft">Documento de trabajo. No reemplaza el procedimiento formal de aprobación de la UNCP. Datos de la cara ciudadana anonimizados.</div>
  </body></html>`;
}

/* ===== B4 · Mapeo al formato oficial UNCP ===== */
const ODS_MAP = {
  agro:'ODS 2 · Hambre cero', salud:'ODS 3 · Salud y bienestar',
  educ:'ODS 4 · Educación de calidad', agua:'ODS 6 · Agua limpia y saneamiento',
  cultura:'ODS 11 · Ciudades y comunidades sostenibles', infra:'ODS 9 · Industria, innovación e infraestructura',
};
const AREA_MAP = {
  agro:'Intervención Tecnológica', salud:'Extensión Universitaria', educ:'Extensión Universitaria',
  agua:'Intervención Tecnológica', cultura:'Imagen Institucional', infra:'Intervención Tecnológica',
};
const AREAS_PS = ['Extensión Universitaria','Intervención Tecnológica','Imagen Institucional'];
function justificacionIA(exp, ods){
  return `Esta propuesta responde a una necesidad real identificada por ${exp.comunidad} (${exp.distrito}, Huancayo), que afecta a ${exp.familias} familias. Atenderla fortalece la presencia territorial de la UNCP y contribuye al ${ods}.`;
}
const SUG = {
  objetivoGen:(exp,c)=>`Contribuir a que ${exp.comunidad} logre ${exp.aspiracion?('“'+exp.aspiracion.replace(/\.$/,'')+'”'):('mejorar su situación en '+c.es.toLowerCase())}, mediante el acompañamiento técnico y académico de la UNCP, en beneficio de ${exp.familias} familias del distrito de ${exp.distrito}.`,
  objetivosEsp:()=>`• Realizar un diagnóstico participativo de la situación junto a la comunidad.\n• Diseñar y ejecutar acciones pertinentes con los beneficiarios.\n• Fortalecer capacidades locales para dar sostenibilidad a los resultados.`,
  evaluacion:()=>`• N.° de familias participantes y beneficiadas.\n• % de avance respecto al cronograma.\n• Cumplimiento de metas por objetivo específico.\n• Nivel de satisfacción de la comunidad (encuesta breve).`,
};
function uncpPrintHtml(exp, c, ctx){
  const f = ctx.form;
  const estu = (f.estudiantes||[]).filter(e=>e.nombre||e.dni).map((e,i)=>
    `<tr><td>${i+1}</td><td>${e.nombre||'—'}</td><td>${e.dni||'—'}</td><td>${e.codigo||'—'}</td></tr>`).join('') || '<tr><td>1</td><td>—</td><td>—</td><td>—</td></tr>';
  const sec=(t,b)=>`<h3>${t}</h3><div class="bx">${b||'<i>Por completar</i>'}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Solicitud ${exp.codigo} — UNCP</title>
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
   <div>Dirección de Proyección Social y Extensión Cultural · Facultad de ${exp.facultades[0]||'…'}</div>
   <div>PROYECTO DE PROYECCIÓN SOCIAL · ${exp.codigo} · Periodo 2026</div></div>

   <div class="kv"><b>Título del proyecto:</b><span>${exp.titulo}</span></div>
   <div class="kv"><b>Lugar de ejecución:</b><span>${exp.distrito}, ${exp.comunidad}, Huancayo, Junín</span></div>
   <div class="kv"><b>Población beneficiaria:</b><span>${exp.familias} familias · ${exp.comunidad}</span></div>
   <div class="kv"><b>Modalidad:</b><span>${ctx.modal==='poli'?'Polivalente':'Monovalente'}</span></div>
   <div class="kv"><b>Área:</b><span>${ctx.area}</span></div>
   <div class="kv"><b>ODS:</b><span>${ctx.ods}</span></div>
   <div class="kv"><b>Facultad(es):</b><span>${exp.facultades.join(', ')}</span></div>
   <div class="kv"><b>Fecha inicio / culminación:</b><span>${ctx.fechaIni||'—'} / ${ctx.fechaFin||'—'}</span></div>
   <div class="kv"><b>Presupuesto:</b><span>S/ ${f.presupuesto||'—'}</span></div>

   <h2>Estudiantes ejecutores</h2>
   <table><tr><th>N°</th><th>Apellidos y Nombres</th><th>DNI</th><th>Código</th></tr>${estu}</table>
   <div class="kv"><b>Docente responsable / asesor:</b><span>${f.docente||'—'}</span></div>

   <h2>Estructura del proyecto</h2>
   ${sec('I. Título del proyecto', exp.titulo)}
   ${sec('II. Introducción (problema · ODS · justificación)', exp.resumen+'<br><br>'+ctx.ods+'<br><br>'+ctx.justificacion)}
   ${sec('III. Descripción (lugar · población beneficiaria)', exp.distrito+', '+exp.comunidad+' — '+exp.familias+' familias')}
   ${sec('IV. Objetivo general', f.objetivoGen)}
   ${sec('IV. Objetivos específicos', f.objetivosEsp)}
   ${sec('V. Metas (cuantitativas)', f.metas)}
   ${sec('VI. Justificación', ctx.justificacion)}
   ${sec('VII. Metodología de trabajo', f.metodologia)}
   ${sec('VIII. Cronograma de trabajo', (ctx.fechaIni||'—')+' a '+(ctx.fechaFin||'—'))}
   ${sec('IX. Recursos (materiales · humanos · financieros)', f.recursos)}
   ${sec('X. Evaluación y monitoreo', f.evaluacion)}

   <div class="sign"><div>Firma · DPSEC de la Facultad</div><div>Dra. Nora E. Hilario Flores · DPSEC</div><div>Representante comunal</div></div>
   <div class="ft">Documento generado por PUNKU a partir de la necesidad registrada por la comunidad. Las firmas se completan al imprimir. Datos ciudadanos anonimizados.</div>
  </body></html>`;
}

/* ---------- B4 Completar solicitud de proyección social ---------- */
function Solicitud({ exp, onBack }){
  const c = catOf(exp.cat);
  const modal = modalidadDe(exp);
  const ods = ODS_MAP[exp.cat] || 'ODS 17 · Alianzas';
  const [area, setArea] = useState(AREA_MAP[exp.cat] || 'Intervención Tecnológica');
  const justif = justificacionIA(exp, ods);
  const [f, setF] = useState({
    objetivoGen:'', objetivosEsp:'', metas:'', metodologia:'',
    fechaIni:'2026-05-11', fechaFin:'2026-12-28', recursos:'', presupuesto:'',
    docente:'', evaluacion:'', estudiantes:[{nombre:'',dni:'',codigo:''}],
  });
  const [toast, setToast] = useState('');
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const flash=(m)=>{ setToast(m); setTimeout(()=>setToast(''),2200); };
  const setStu=(i,k,v)=>setF(p=>{const e=[...p.estudiantes];e[i]={...e[i],[k]:v};return{...p,estudiantes:e};});
  const addStu=()=>setF(p=>({...p,estudiantes:[...p.estudiantes,{nombre:'',dni:'',codigo:''}]}));
  const delStu=(i)=>setF(p=>({...p,estudiantes:p.estudiantes.filter((_,j)=>j!==i)}));

  const generar=()=>{
    const ctx = { area, modal, ods, justificacion:justif, fechaIni:f.fechaIni, fechaFin:f.fechaFin, form:f };
    try{
      const w = window.open('', '_blank', 'width=900,height=1100');
      if(!w){ flash('Habilita pop-ups para generar el PDF.'); return; }
      w.document.write(uncpPrintHtml(exp, c, ctx)); w.document.close(); w.focus();
      setTimeout(()=>{ try{ w.print(); }catch(e){} }, 500);
    }catch(e){ flash('No se pudo abrir el PDF.'); }
  };
  const wc = exp.titulo.trim().split(/\s+/).length;

  const RO = ({label, children, full})=>(
    <div className={"ro-field"+(full?' full':'')}>
      <div className="ro-label">{label}</div>
      <div className="ro-val">{children}</div>
    </div>
  );

  return (
    <div className="crm-main">
      <button onClick={onBack} className="crm-back"><I.arrowL s={18}/> Volver al expediente</button>

      <div className="b4-hero">
        <span className="armar-ico lg"><I.sparkle s={20}/></span>
        <div style={{flex:1}}>
          <h2 style={{fontSize:21,color:'var(--slate-900)'}}>Completar solicitud de proyección social</h2>
          <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:3,maxWidth:680}}>
            PUNKU también traduce para la universidad: en vez de un papel en blanco, te da el formato oficial UNCP semi-llenado con lo que ya sabemos de la comunidad. Tú solo completas lo académico.
          </p>
        </div>
        <div className="b4-meta">
          <span className="mono">{exp.codigo}</span>
          <span>{exp.comunidad} · {exp.distrito}</span>
        </div>
      </div>

      <div className="b4-legend">
        <span><i className="dot g"/> Lo que ya sabemos — pre-llenado por PUNKU</span>
        <span><i className="dot a"/> Completa para formalizar — lo escribe la UNCP</span>
      </div>

      <div className="b4-grid">
        {/* IZQUIERDA — pre-llenado */}
        <div className="b4-block pre">
          <div className="b4-bhead g"><I.check s={15}/> Lo que ya sabemos<span>solo lectura</span></div>

          <RO label="Título del proyecto (propuesta)" full>
            {exp.titulo} <span className={"word-chip"+(wc>15?' over':'')}>{wc}/15 palabras</span>
          </RO>
          <RO label="Lugar de ejecución">{exp.distrito}, {exp.comunidad} · Huancayo, Junín</RO>
          <RO label="Población beneficiaria"><span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.users s={14}/>{exp.familias} familias · {exp.comunidad}</span></RO>
          <RO label="Descripción del problema / necesidad" full>{exp.resumen}</RO>
          <RO label="Resultado que espera la comunidad (en sus palabras)" full>
            <span style={{display:'inline-flex',alignItems:'flex-start',gap:7}}><span style={{color:'var(--green-600)',flex:'none',marginTop:2}}><I.sparkle s={15}/></span><em style={{fontStyle:'normal'}}>“{exp.aspiracion||'—'}”</em></span>
          </RO>
          <RO label="Área de proyección social"><span className="ro-tag">{area}</span> <em className="sug-note">sugerida por IA</em></RO>
          <RO label="Modalidad"><span className="ro-tag">{modal==='poli'?'Polivalente':'Monovalente'}</span> <em className="sug-note">{modal==='poli'?'inter/transdisciplinario':'una facultad'}</em></RO>
          <RO label="Facultad(es) sugerida(s)" full>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{exp.facultades.map(fc=><span key={fc} className="fac-chip">{fc}</span>)}</div>
          </RO>
          <RO label="ODS sugerido"><span className="ods-badge">{ods}</span></RO>
          <RO label="Justificación inicial" full><em style={{color:'var(--slate-600)',fontStyle:'normal'}}>{justif}</em></RO>
        </div>

        {/* DERECHA — editable */}
        <div className="b4-block fill">
          <div className="b4-bhead a"><I.clock s={15}/> Completa para formalizar<span>la UNCP escribe aquí</span></div>

          <EdField label="Objetivo general" ai onAi={()=>set('objetivoGen', SUG.objetivoGen(exp,c))}>
            <textarea className="ed-ta" rows={3} value={f.objetivoGen} onChange={e=>set('objetivoGen',e.target.value)} placeholder="¿Cuál es el propósito principal del proyecto?"/>
          </EdField>
          <EdField label="Objetivos específicos" ai onAi={()=>set('objetivosEsp', SUG.objetivosEsp())}>
            <textarea className="ed-ta" rows={3} value={f.objetivosEsp} onChange={e=>set('objetivosEsp',e.target.value)} placeholder="Metas concretas a alcanzar (una por línea)."/>
          </EdField>
          <EdField label="Metas (cuantitativas)">
            <textarea className="ed-ta" rows={2} value={f.metas} onChange={e=>set('metas',e.target.value)} placeholder="Ej.: 1 diagnóstico; 120 familias capacitadas; 1 plan comunal en 6 meses."/>
          </EdField>
          <EdField label="Metodología de trabajo">
            <textarea className="ed-ta" rows={2} value={f.metodologia} onChange={e=>set('metodologia',e.target.value)} placeholder="Métodos y técnicas, diagnóstico, fases y participación de la comunidad."/>
          </EdField>
          <EdField label="Cronograma / periodo de ejecución">
            <div style={{display:'flex',gap:10}}>
              <label className="date-lbl">Inicio<input type="date" className="ed-input" value={f.fechaIni} onChange={e=>set('fechaIni',e.target.value)}/></label>
              <label className="date-lbl">Culminación<input type="date" className="ed-input" value={f.fechaFin} onChange={e=>set('fechaFin',e.target.value)}/></label>
            </div>
          </EdField>
          <EdField label="Recursos (materiales, humanos, financieros)">
            <textarea className="ed-ta" rows={2} value={f.recursos} onChange={e=>set('recursos',e.target.value)} placeholder="Qué se necesita para ejecutar el proyecto."/>
          </EdField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <EdField label="Presupuesto estimado (S/)">
              <input type="number" className="ed-input" value={f.presupuesto} onChange={e=>set('presupuesto',e.target.value)} placeholder="0.00"/>
            </EdField>
            <EdField label="Docente responsable / asesor">
              <input className="ed-input" value={f.docente} onChange={e=>set('docente',e.target.value)} placeholder="Apellidos y nombres"/>
            </EdField>
          </div>
          <EdField label="Estudiantes participantes">
            <div className="stu-list">
              <div className="stu-row head"><span>Apellidos y nombres</span><span>DNI</span><span>Código</span><span/></div>
              {f.estudiantes.map((e,i)=>(
                <div className="stu-row" key={i}>
                  <input className="ed-input sm" value={e.nombre} onChange={ev=>setStu(i,'nombre',ev.target.value)} placeholder="Nombre"/>
                  <input className="ed-input sm" value={e.dni} onChange={ev=>setStu(i,'dni',ev.target.value)} placeholder="DNI"/>
                  <input className="ed-input sm" value={e.codigo} onChange={ev=>setStu(i,'codigo',ev.target.value)} placeholder="Código"/>
                  <button className="stu-del" onClick={()=>delStu(i)} title="Quitar">×</button>
                </div>
              ))}
              <button className="stu-add" onClick={addStu}>+ Agregar estudiante</button>
            </div>
          </EdField>
          <EdField label="Evaluación y monitoreo (indicadores)" ai onAi={()=>set('evaluacion', SUG.evaluacion())}>
            <textarea className="ed-ta" rows={3} value={f.evaluacion} onChange={e=>set('evaluacion',e.target.value)} placeholder="Indicadores de éxito y herramientas de seguimiento."/>
          </EdField>
        </div>
      </div>

      <div className="b4-foot">
        <div className="firma-note"><I.shield s={15}/> Las firmas (Dir. de Proyección Social, Decano y representante comunal) se completan al imprimir el documento — no se digitalizan.</div>
        <div className="b4-actions">
          <button className="draft-btn ghost" onClick={()=>flash('Borrador guardado.')}><I.copy s={15}/> Guardar borrador</button>
          <button className="b4-generate" onClick={generar}><I.arrowUR s={16}/> Generar solicitud completa (PDF formato UNCP)</button>
        </div>
      </div>

      {toast && <div className="crm-toast fade-in"><I.check s={16}/> {toast}</div>}
    </div>
  );
}
function EdField({label, children, ai, onAi}){
  return (
    <div className="ed-field">
      <div className="ed-top">
        <span className="ed-label">{label}</span>
        {ai && <button className="ai-btn" onClick={onAi}><I.sparkle s={13}/> Sugerir con IA</button>}
      </div>
      {children}
    </div>
  );
}

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
      </div></div>

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
  return (
    <div className="crm-shell">
      <CrmRail view={view} setView={(v)=>{setView(v);}}/>
      {view==='bandeja' && <Bandeja lang={lang} onOpen={(e)=>{setSel(e);setView('detalle');}}/>}
      {view==='detalle' && sel && <Detalle lang={lang} exp={sel} onBack={()=>setView('bandeja')} onArmar={()=>setView('solicitud')}/>}
      {view==='solicitud' && sel && <Solicitud exp={sel} onBack={()=>setView('detalle')}/>}
      {view==='tablero' && <Tablero lang={lang}/>}
    </div>
  );
}

Object.assign(window, { CrmApp });
