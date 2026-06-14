/* ============================================================
   PUNKU — B4 · Completar la solicitud de proyección social
   + Módulo de co-construcción con el ciudadano por WhatsApp
   ============================================================ */

const ODS_MAP = {
  agro:'ODS 2 · Hambre cero', salud:'ODS 3 · Salud y bienestar',
  educ:'ODS 4 · Educación de calidad', agua:'ODS 6 · Agua limpia y saneamiento',
  cultura:'ODS 11 · Ciudades y comunidades sostenibles',
  infra:'ODS 9 · Industria, innovación e infraestructura',
};
const AREA_MAP = {
  agro:'Intervención Tecnológica', salud:'Extensión Universitaria', educ:'Extensión Universitaria',
  agua:'Intervención Tecnológica', cultura:'Imagen Institucional', infra:'Intervención Tecnológica',
};
function modalidadDe(exp){
  const reales = exp.facultades.filter(f=>!/otra entidad/i.test(f));
  return reales.length>1 ? 'poli' : 'mono';
}
function justificacionIA(exp, ods){
  return `Esta propuesta responde a una necesidad real identificada por ${exp.comunidad} (${exp.distrito}, Huancayo), que afecta a ${exp.familias||'varias'} familias. Atenderla fortalece la presencia territorial de la UNCP y contribuye al ${ods}.`;
}
const SUG = {
  objetivoGen:(exp,c)=>`Contribuir a que ${exp.comunidad} logre ${exp.aspiracion?('“'+exp.aspiracion.replace(/\.$/,'')+'”'):('mejorar su situación en '+c.es.toLowerCase())}, mediante el acompañamiento técnico y académico de la UNCP, en beneficio de ${exp.familias||'las'} familias del distrito de ${exp.distrito}.`,
  objetivosEsp:()=>`• Realizar un diagnóstico participativo de la situación junto a la comunidad.\n• Diseñar y ejecutar acciones pertinentes con los beneficiarios.\n• Fortalecer capacidades locales para dar sostenibilidad a los resultados.`,
  metodologia:()=>`Enfoque participativo en fases: (1) diagnóstico con la comunidad, (2) diseño técnico, (3) ejecución acompañada y (4) evaluación. Se prioriza la mano de obra y el conocimiento local.`,
  evaluacion:()=>`• N.° de familias participantes y beneficiadas.\n• % de avance respecto al cronograma.\n• Cumplimiento de metas por objetivo específico.\n• Nivel de satisfacción de la comunidad (encuesta breve).`,
};

/* ----- Banco de preguntas IA para co-construcción (por categoría) ----- */
const QUESTION_BANK = {
  infra:(exp)=>([
    { field:'objetivoGen', q:'¿Cuál es su meta principal?', options:[
      {label:'Tener un local comunal con buena electricidad', formal:'contar con un local comunal dotado de servicio eléctrico confiable, que funcione como centro de servicios e integración'},
      {label:'Mejorar la red eléctrica de las casas', formal:'mejorar y ampliar la red de distribución eléctrica domiciliaria de la comunidad'},
      {label:'Ambas cosas', formal:'mejorar el abastecimiento eléctrico y, a la vez, contar con un local comunal que concentre los servicios'},
    ]},
    { field:'metas', q:'¿En cuánto tiempo lo necesitan?', options:[
      {label:'Urgente, este mes', formal:'atención urgente en el plazo de 1 mes'},
      {label:'Este año', formal:'ejecución dentro del presente año (horizonte de 6 a 12 meses)'},
      {label:'Puede esperar al próximo año', formal:'ejecución planificada para el próximo periodo'},
    ]},
    { field:'recursos', q:'¿Cuántas personas de la comunidad ayudarían en la obra?', options:[
      {label:'Pocas (5–10)', formal:'aporte de mano de obra comunal de 5 a 10 personas'},
      {label:'Varias (10–30)', formal:'aporte de mano de obra comunal de 10 a 30 personas'},
      {label:'Muchas (30+)', formal:'aporte de mano de obra comunal de más de 30 personas'},
    ]},
    { field:'metodologia', q:'¿Con qué ya cuentan ustedes?', options:[
      {label:'Terreno para el local', formal:'la comunidad aporta el terreno saneado para la edificación'},
      {label:'Algunos materiales', formal:'la comunidad aporta parte de los materiales de construcción'},
      {label:'Solo mano de obra', formal:'la comunidad aporta principalmente mano de obra y organización'},
    ]},
  ]),
  _default:(exp,c)=>([
    { field:'objetivoGen', q:'¿Cuál es su meta principal?', options:[
      {label:'Resolver el problema de raíz', formal:'dar solución integral y sostenible a la necesidad planteada'},
      {label:'Una mejora rápida por ahora', formal:'lograr una mejora inmediata que alivie la situación'},
      {label:'Capacitarnos para hacerlo nosotros', formal:'fortalecer capacidades locales para sostener la solución en el tiempo'},
    ]},
    { field:'metas', q:'¿En cuánto tiempo lo necesitan?', options:[
      {label:'Urgente, este mes', formal:'atención urgente en el plazo de 1 mes'},
      {label:'Este año', formal:'ejecución dentro del presente año'},
      {label:'Puede esperar', formal:'ejecución planificada a mediano plazo'},
    ]},
    { field:'recursos', q:'¿Cuántas personas de la comunidad participarían?', options:[
      {label:'Pocas (5–10)', formal:'participación de 5 a 10 personas de la comunidad'},
      {label:'Varias (10–30)', formal:'participación de 10 a 30 personas de la comunidad'},
      {label:'Muchas (30+)', formal:'participación de más de 30 personas de la comunidad'},
    ]},
  ]),
};
function buildQuestions(exp, c){
  return (QUESTION_BANK[exp.cat] || QUESTION_BANK._default)(exp, c);
}

/* ----- PDF formato UNCP ----- */
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
   <div class="kv"><b>Población beneficiaria:</b><span>${exp.familias||'por estimar'} familias · ${exp.comunidad}</span></div>
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
   ${sec('III. Descripción (lugar · población beneficiaria)', exp.distrito+', '+exp.comunidad+' — '+(exp.familias||'?')+' familias')}
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

/* ===== Campos académicos (ámbar) — definen el progreso ===== */
const AMBER_FIELDS = [
  ['objetivoGen','Objetivo general'],
  ['objetivosEsp','Objetivos específicos'],
  ['metas','Metas'],
  ['metodologia','Metodología'],
  ['recursos','Recursos'],
  ['presupuesto','Presupuesto'],
  ['docente','Docente responsable'],
  ['estudiantes','Estudiantes'],
  ['evaluacion','Evaluación y monitoreo'],
];
function isFilled(key, f){
  if(key==='estudiantes') return (f.estudiantes||[]).some(e=>e.nombre&&e.nombre.trim());
  return f[key] && String(f[key]).trim().length>0;
}

/* ============================================================
   Solicitud (B4)
   ============================================================ */
function Solicitud({ exp, draft, onClose }){
  const c = catOf(exp.cat);
  const pobre = calidadDe(exp)==='pobre';
  const modal = modalidadDe(exp);
  const ods = pobre ? 'Por confirmar' : (ODS_MAP[exp.cat] || 'ODS 17 · Alianzas');
  const [area] = useState(pobre ? 'Por confirmar' : (AREA_MAP[exp.cat] || 'Intervención Tecnológica'));
  const justif = pobre ? 'Falta precisar con la comunidad antes de redactar la justificación.' : justificacionIA(exp, ods);
  const [f, setF] = useState(()=> draft || {
    objetivoGen:'', objetivosEsp:'', metas:'', metodologia:'',
    fechaIni:'2026-05-11', fechaFin:'2026-12-28', recursos:'', presupuesto:'',
    docente:'', evaluacion:'', estudiantes:[{nombre:'',dni:'',codigo:''}],
  });
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(''); // field being AI-generated
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  const flash=(m)=>{ setToast(m); setTimeout(()=>setToast(''),2600); };
  const setStu=(i,k,v)=>setF(p=>{const e=[...p.estudiantes];e[i]={...e[i],[k]:v};return{...p,estudiantes:e};});
  const addStu=()=>setF(p=>({...p,estudiantes:[...p.estudiantes,{nombre:'',dni:'',codigo:''}]}));
  const delStu=(i)=>setF(p=>({...p,estudiantes:p.estudiantes.filter((_,j)=>j!==i)}));

  /* progreso vivo */
  const base = pobre ? 26 : 70;
  const filledAmber = AMBER_FIELDS.filter(([k])=>isFilled(k,f)).length;
  const pct = Math.min(100, Math.round(base + (filledAmber/AMBER_FIELDS.length)*(100-base)));
  const faltan = AMBER_FIELDS.filter(([k])=>!isFilled(k,f)).map(([,l])=>l);

  /* IA sugerir un campo (spinner) */
  const aiSuggest=(key, fn)=>{
    setLoading(key);
    setTimeout(()=>{ set(key, fn()); setLoading(''); }, 750);
  };

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
  const RO = ({label, children, full, missing})=>(
    <div className={"ro-field"+(missing?' missing':'')}>
      <div className="ro-label">{label}</div>
      <div className="ro-val">{children}</div>
    </div>
  );

  return (
    <div className="crm-main b4-main">
      {/* Recorrido — no un escape suelto */}
      <div className="b4-crumb">
        <button onClick={()=>onClose(f,{})} className="crm-back" style={{margin:0}}><I.arrowL s={18}/> Volver al expediente</button>
        <span className="b4-crumb-sep">›</span>
        <span className="b4-crumb-step"><span className="b4-crumb-num">Paso 2 de 3 · En revisión</span> Armar la solicitud oficial</span>
      </div>

      <div className="b4-hero">
        <span className="armar-ico lg"><I.sparkle s={20}/></span>
        <div style={{flex:1}}>
          <h2 style={{fontSize:21,color:'var(--slate-900)'}}>Completar solicitud de proyección social</h2>
          <p style={{color:'var(--slate-500)',fontSize:13.5,marginTop:3,maxWidth:700}}>
            PUNKU pre-llena el formato oficial UNCP con lo que ya sabe de la comunidad (verde). La UNCP completa lo académico (ámbar) con apoyo de IA. Al terminar, vuelves al expediente para derivar.
          </p>
        </div>
        <div className="b4-meta">
          <span className="mono">{exp.codigo}</span>
          <span>{exp.comunidad} · {exp.distrito}</span>
        </div>
      </div>

      <div className="b4-legend">
        <span><i className="dot g"/> <strong>Lo que ya sabemos</strong> — pre-llenado por PUNKU</span>
        <span><i className="dot a"/> <strong>Completa para formalizar</strong> — lo redacta la UNCP con apoyo de IA</span>
      </div>

      {/* Progreso vivo */}
      <div className="b4-progress">
        <div className="b4-prog-top">
          <span>Formato oficial completo al <strong className={pct>=100?'full':''}>{pct}%</strong></span>
          <span className="b4-prog-hint">{pct>=100?'Listo para derivar':'Completa los campos ámbar para llegar al 100%'}</span>
        </div>
        <div className="b4-prog-track"><div className="b4-prog-fill" style={{width:pct+'%'}}/></div>
        {faltan.length>0
          ? <div className="b4-prog-faltan"><I.alert s={14}/> Faltan <strong>{faltan.length}</strong> campos: {faltan.join(', ')}.</div>
          : <div className="b4-prog-done"><I.check s={14}/> Todos los campos del formato están completos.</div>}
      </div>

      {/* === Co-construcción WhatsApp === */}
      <WhatsAppModule exp={exp} c={c} pobre={pobre}
        onFill={(updates, summary)=>{ setF(p=>({...p,...updates})); flash('IA interpretó la respuesta y completó '+summary.length+' campo(s).'); }}/>

      {/* Dos columnas */}
      <div className="b4-grid">
        {/* Verde — contexto */}
        <div className="b4-block pre">
          <div className="b4-bhead g"><I.check s={15}/> Lo que ya sabemos<span>contexto · solo lectura</span></div>
          <RO label="Título del proyecto (propuesta)" full>
            {exp.titulo} <span className={"word-chip"+(wc>15?' over':'')}>{wc}/15 palabras</span>
          </RO>
          <RO label="Lugar de ejecución">{exp.distrito}, {exp.comunidad} · Huancayo, Junín</RO>
          <RO label="Población beneficiaria" missing={!exp.familias}>
            {exp.familias
              ? <span style={{display:'inline-flex',alignItems:'center',gap:6}}><I.users s={14}/>{exp.familias} familias · {exp.comunidad}</span>
              : <span className="ro-missing"><I.alert s={13}/> La comunidad no precisó cuántas familias — confírmalo por WhatsApp</span>}
          </RO>
          <RO label="Descripción del problema / necesidad" full>{exp.resumen}</RO>
          <RO label="Resultado que espera la comunidad (en sus palabras)" full missing={!exp.aspiracion}>
            {exp.aspiracion
              ? <span style={{display:'inline-flex',alignItems:'flex-start',gap:7}}><span style={{color:'var(--green-600)',flex:'none',marginTop:2}}><I.sparkle s={15}/></span><em style={{fontStyle:'normal'}}>“{exp.aspiracion}”</em></span>
              : <span className="ro-missing"><I.alert s={13}/> No lo expresó — la co-construcción lo recoge</span>}
          </RO>
          <RO label="Área de proyección social">
            {pobre ? <span className="kv-pend">Por confirmar</span> : <><span className="ro-tag">{area}</span> <em className="sug-note">sugerida por IA</em></>}
          </RO>
          <RO label="Modalidad"><span className="ro-tag">{modal==='poli'?'Polivalente':'Monovalente'}</span> <em className="sug-note">{modal==='poli'?'inter/transdisciplinario':'una facultad'}</em></RO>
          <RO label="Facultad(es) sugerida(s)" full>
            <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{exp.facultades.map(fc=><span key={fc} className="fac-chip">{fc}</span>)}</div>
          </RO>
          <RO label="ODS sugerido">{pobre ? <span className="kv-pend">Por confirmar</span> : <span className="ods-badge">{ods}</span>}</RO>
          <RO label="Justificación inicial" full><em style={{color:'var(--slate-600)',fontStyle:'normal'}}>{justif}</em></RO>
        </div>

        {/* Ámbar — foco */}
        <div className="b4-block fill">
          <div className="b4-bhead a"><I.clock s={15}/> Completa para formalizar<span>la UNCP, con apoyo de IA</span></div>

          <EdField label="Objetivo general" done={isFilled('objetivoGen',f)} ai busy={loading==='objetivoGen'} onAi={()=>aiSuggest('objetivoGen',()=>SUG.objetivoGen(exp,c))}>
            <textarea className="ed-ta" rows={3} value={f.objetivoGen} onChange={e=>set('objetivoGen',e.target.value)} placeholder="¿Cuál es el propósito principal del proyecto?"/>
          </EdField>
          <EdField label="Objetivos específicos" done={isFilled('objetivosEsp',f)} ai busy={loading==='objetivosEsp'} onAi={()=>aiSuggest('objetivosEsp',()=>SUG.objetivosEsp())}>
            <textarea className="ed-ta" rows={3} value={f.objetivosEsp} onChange={e=>set('objetivosEsp',e.target.value)} placeholder="Metas concretas a alcanzar (una por línea)."/>
          </EdField>
          <EdField label="Metas (cuantitativas)" done={isFilled('metas',f)}>
            <textarea className="ed-ta" rows={2} value={f.metas} onChange={e=>set('metas',e.target.value)} placeholder="Ej.: 1 diagnóstico; 120 familias capacitadas; 1 plan comunal en 6 meses."/>
          </EdField>
          <EdField label="Metodología de trabajo" done={isFilled('metodologia',f)} ai busy={loading==='metodologia'} onAi={()=>aiSuggest('metodologia',()=>SUG.metodologia())}>
            <textarea className="ed-ta" rows={2} value={f.metodologia} onChange={e=>set('metodologia',e.target.value)} placeholder="Métodos y técnicas, diagnóstico, fases y participación de la comunidad."/>
          </EdField>
          <EdField label="Cronograma / periodo de ejecución" done>
            <div style={{display:'flex',gap:10}}>
              <label className="date-lbl">Inicio<input type="date" className="ed-input" value={f.fechaIni} onChange={e=>set('fechaIni',e.target.value)}/></label>
              <label className="date-lbl">Culminación<input type="date" className="ed-input" value={f.fechaFin} onChange={e=>set('fechaFin',e.target.value)}/></label>
            </div>
          </EdField>
          <EdField label="Recursos (materiales, humanos, financieros)" done={isFilled('recursos',f)}>
            <textarea className="ed-ta" rows={2} value={f.recursos} onChange={e=>set('recursos',e.target.value)} placeholder="Qué se necesita para ejecutar el proyecto."/>
          </EdField>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <EdField label="Presupuesto estimado (S/)" done={isFilled('presupuesto',f)}>
              <input type="number" className="ed-input" value={f.presupuesto} onChange={e=>set('presupuesto',e.target.value)} placeholder="0.00"/>
            </EdField>
            <EdField label="Docente responsable / asesor" done={isFilled('docente',f)}>
              <input className="ed-input" value={f.docente} onChange={e=>set('docente',e.target.value)} placeholder="Apellidos y nombres"/>
            </EdField>
          </div>
          <EdField label="Estudiantes participantes" done={isFilled('estudiantes',f)}>
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
          <EdField label="Evaluación y monitoreo (indicadores)" done={isFilled('evaluacion',f)} ai busy={loading==='evaluacion'} onAi={()=>aiSuggest('evaluacion',()=>SUG.evaluacion())}>
            <textarea className="ed-ta" rows={3} value={f.evaluacion} onChange={e=>set('evaluacion',e.target.value)} placeholder="Indicadores de éxito y herramientas de seguimiento."/>
          </EdField>
        </div>
      </div>

      {/* Barra de acciones fija */}
      <div className="b4-actionbar">
        <div className="firma-note"><I.shield s={15}/> Las firmas (Dir. de Proyección Social, Decano y representante comunal) se completan al imprimir — no se digitalizan.</div>
        <div className="b4-act-col">
          <div className="b4-actions">
            <button className="gbtn gbtn-ghost gbtn-sm" onClick={()=>onClose(f,{msg:'Borrador guardado. El expediente sigue en revisión.'})}><I.copy s={15}/> Guardar borrador y volver</button>
            <button className="gbtn gbtn-ghost gbtn-sm" onClick={generar} title="Opcional. El PDF se adjunta automáticamente al derivar."><I.download s={15}/> Descargar copia (PDF)</button>
            <span className="b4-act-div"/>
            <button className="gbtn gbtn-primary" onClick={()=>onClose(f,{markReady:true,msg:'Solicitud lista. Ahora puedes derivar a la facultad.'})}>Guardar y volver para derivar <I.arrowR s={16}/></button>
          </div>
          <span className="b4-act-hint"><I.shield s={12}/> El PDF (formato UNCP) se genera y adjunta solo al derivar. Aquí descargas una copia para revisar.</span>
        </div>
      </div>

      {toast && <div className="crm-toast fade-in"><I.check s={16}/> {toast}</div>}
    </div>
  );
}

function EdField({label, children, ai, onAi, busy, done}){
  return (
    <div className={"ed-field"+(done?' done':'')}>
      <div className="ed-top">
        <span className="ed-label">
          {done && <span className="ed-check"><I.check s={11}/></span>}
          {label} {!done && <span className="pend-pill">PENDIENTE</span>}
        </span>
        {ai && <button className={"ai-btn"+(busy?' busy':'')} onClick={onAi} disabled={busy}>
          {busy ? <><span className="ai-spin"/> Generando…</> : <><I.sparkle s={13}/> Sugerir con IA</>}
        </button>}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   Módulo de co-construcción con el ciudadano (WhatsApp)
   ============================================================ */
function WhatsAppModule({ exp, c, pobre, onFill }){
  const [open, setOpen] = useState(pobre); // abierto por defecto cuando hay poca info
  const [questions, setQuestions] = useState(null);
  const [genBusy, setGenBusy] = useState(false);
  const [resp, setResp] = useState('');
  const [interpBusy, setInterpBusy] = useState(false);
  const [result, setResult] = useState(null); // [{q, choiceLabel, field, formal}]

  const generate=()=>{
    setGenBusy(true); setResult(null);
    setTimeout(()=>{ setQuestions(buildQuestions(exp,c)); setGenBusy(false); }, 850);
  };

  const waText = ()=>{
    let m = `Hola, somos de la UNCP (PUNKU) sobre su pedido ${exp.codigo}. Para ayudarles mejor, responda con el número de su respuesta:\n\n`;
    (questions||[]).forEach((q,i)=>{
      m += `${i+1}. ${q.q}\n`;
      q.options.forEach((o,j)=> m += `   ${j+1}) ${o.label}\n`);
      m += `\n`;
    });
    m += `Puede responder así: "1 2 1 2". ¡Gracias!`;
    return m;
  };
  const waLink = ()=> 'https://wa.me/?text='+encodeURIComponent(waText());

  const interpret=()=>{
    if(!questions || !resp.trim()) return;
    setInterpBusy(true);
    setTimeout(()=>{
      const nums = (resp.match(/\d+/g)||[]).map(Number);
      const out = [];
      const updates = {};
      const byField = {};
      questions.forEach((q,i)=>{
        const n = nums[i];
        if(!n) return;
        let choice, extra='';
        if(n>=1 && n<=q.options.length){ choice = q.options[n-1]; }
        else { // cantidad libre (ej. "somos como 15")
          choice = q.options[q.options.length-1];
          extra = ' (la comunidad indicó '+n+')';
        }
        out.push({ q:q.q, choiceLabel: choice.label+ (extra?' · '+n:''), field:q.field });
        const phrase = choice.formal + extra;
        byField[q.field] = byField[q.field] ? byField[q.field]+'; '+phrase : phrase;
      });
      // Componer texto formal por campo
      Object.keys(byField).forEach(field=>{
        if(field==='objetivoGen'){
          updates.objetivoGen = `Contribuir a que ${exp.comunidad} logre ${byField.objetivoGen}, con el acompañamiento técnico y académico de la UNCP, en beneficio de ${exp.familias||'las'} familias de ${exp.distrito}.`;
        } else if(field==='metas'){
          updates.metas = `Plazo acordado con la comunidad: ${byField.metas}. Meta: atender a ${exp.familias||'las'} familias beneficiarias dentro de ese periodo.`;
        } else if(field==='recursos'){
          updates.recursos = `Aporte de la comunidad: ${byField.recursos}. La UNCP aporta asesoría técnica y acompañamiento de estudiantes y docente.`;
        } else if(field==='metodologia'){
          updates.metodologia = `Trabajo participativo por fases (diagnóstico, diseño, ejecución, evaluación). ${byField.metodologia.charAt(0).toUpperCase()+byField.metodologia.slice(1)}.`;
        } else {
          updates[field] = byField[field];
        }
      });
      setResult(out);
      setInterpBusy(false);
      if(out.length) onFill(updates, out);
    }, 950);
  };

  return (
    <div className={"wa-card"+(open?' open':'')}>
      <button className="wa-head" onClick={()=>setOpen(o=>!o)}>
        <span className="wa-ico"><I.whatsapp s={20}/></span>
        <div style={{flex:1,textAlign:'left'}}>
          <div className="wa-title">Co-construir con la comunidad por WhatsApp</div>
          <div className="wa-sub">{pobre
            ? 'Esta solicitud llegó con poca información. Pregúntale a la comunidad lo que falta — fácil, con opciones numeradas.'
            : 'Para los datos que solo la comunidad tiene (su meta real, plazos, aportes), pregúntale con opciones numeradas.'}</div>
        </div>
        <span className="wa-chev" style={{transform:open?'rotate(180deg)':'none'}}><I.chevron s={18}/></span>
      </button>

      {open && (
        <div className="wa-body">
          <div className="wa-steps">
            {/* Paso 1 */}
            <div className="wa-step">
              <div className="wa-step-h"><span className="wa-step-n">1</span> La IA arma las preguntas</div>
              <p className="wa-step-p">Genera 3–5 preguntas con opciones numeradas según lo que falta y el contexto del expediente.</p>
              <button className={"gbtn gbtn-secondary gbtn-sm"+(genBusy?' busy':'')} onClick={generate} disabled={genBusy}>
                {genBusy ? <><span className="ai-spin dark"/> Generando…</> : <><I.wand s={15}/> {questions?'Regenerar preguntas':'Generar preguntas para el ciudadano'}</>}
              </button>
              {questions && (
                <div className="wa-qbox">
                  {questions.map((q,i)=>(
                    <div className="wa-q" key={i}>
                      <div className="wa-q-t"><b>{i+1}.</b> {q.q}</div>
                      <div className="wa-q-opts">{q.options.map((o,j)=><span key={j} className="wa-opt"><b>{j+1})</b> {o.label}</span>)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paso 2 */}
            <div className={"wa-step"+(questions?'':' off')}>
              <div className="wa-step-h"><span className="wa-step-n">2</span> Envíalas por WhatsApp</div>
              <p className="wa-step-p">Se abre WhatsApp con las preguntas listas, sobre el teléfono real del contacto (server-side).</p>
              <a className={"gbtn gbtn-wa gbtn-sm"+(questions?'':' disabled')} href={questions?waLink():undefined} target="_blank" rel="noopener"
                 onClick={e=>{if(!questions)e.preventDefault();}}>
                <I.whatsapp s={16}/> Contactar por WhatsApp
              </a>
            </div>

            {/* Paso 3 */}
            <div className={"wa-step"+(questions?'':' off')}>
              <div className="wa-step-h"><span className="wa-step-n">3</span> Pega la respuesta e interprétala</div>
              <p className="wa-step-p">La IA mapea los números contra las preguntas y completa los campos del formulario.</p>
              <textarea className="wa-resp" rows={2} value={resp} onChange={e=>setResp(e.target.value)}
                placeholder={questions?'Ej.: "1 2 1 2"   ·   o "respondo 1, 2, y somos como 15"':'Primero genera las preguntas…'} disabled={!questions}/>
              <button className={"gbtn gbtn-primary gbtn-sm"+(interpBusy?' busy':'')} onClick={interpret} disabled={!questions||!resp.trim()||interpBusy}>
                {interpBusy ? <><span className="ai-spin"/> Interpretando…</> : <><I.sparkle s={14}/> Interpretar respuesta con IA</>}
              </button>
              {result && result.length>0 && (
                <div className="wa-result">
                  <div className="wa-result-h"><I.check s={14}/> Interpretado y volcado al formulario</div>
                  {result.map((r,i)=>(
                    <div className="wa-result-row" key={i}>
                      <span className="wa-r-q">{r.q}</span>
                      <span className="wa-r-arrow"><I.arrowR s={13}/></span>
                      <span className="wa-r-a">{r.choiceLabel}</span>
                      <span className="wa-r-field">→ {AMBER_FIELDS.find(a=>a[0]===r.field)?.[1]||r.field}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="wa-honest">
            <I.shield s={14}/> <strong>Demo:</strong> pega manualmente la respuesta del ciudadano y la IA la interpreta (esto sí es funcional). En producción, la respuesta llega <strong>automática por WhatsApp Business API</strong> y escribe en la base de datos sin intervención.
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Solicitud });
