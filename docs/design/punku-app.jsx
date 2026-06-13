/* ============================================================
   PUNKU — Shell / navegación
   ============================================================ */

const CZ_SCREENS = [
  ['welcome','A0','Bienvenida'],
  ['stepA','A1','¿De qué se trata?'],
  ['stepB','A1','¿Qué está pasando?'],
  ['stepC','A1','¿Dónde y a quiénes?'],
  ['stepD','A1','Cuéntanos más'],
  ['goal','A1','¿Qué te gustaría lograr?'],
  ['contact','A2','Datos de contacto'],
  ['processing','A3','Procesando (IA)'],
  ['recognition','A4','Reconocimiento ✨'],
  ['track','A5','Consultar mi caso'],
  ['emergency','A6','PUNKU Emergencias'],
];
const CRM_SCREENS = [
  ['bandeja','B1','Bandeja territorial'],
  ['detalle','B2','Detalle del expediente'],
  ['solicitud','B4','Completar solicitud'],
  ['tablero','B3','Tablero resumen'],
];

function Phone({ children }){
  return (
    <div className="phone-wrap">
      <div className="phone">
        <div className="phone-screen">
          <div className="notch"/>
          <div className="statusbar">
            <span>9:41</span>
            <span className="dots">
              <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
              <svg width="22" height="11" viewBox="0 0 22 11" fill="none"><rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="13" height="7" rx="1.2" fill="currentColor"/><rect x="20" y="3.5" width="1.5" height="4" rx="0.7" fill="currentColor" opacity="0.5"/></svg>
            </span>
          </div>
          <div className="screen-scroll">{children}</div>
        </div>
      </div>
      <div className="phone-caption">Cara ciudadana · móvil</div>
    </div>
  );
}

function BrowserCRM({ children }){
  return (
    <div className="browser">
      <div className="browser-bar">
        <div className="lights"><i style={{background:'#E5685C'}}/><i style={{background:'#F1BE4F'}}/><i style={{background:'#61C554'}}/></div>
        <div className="browser-url"><I.shield s={13}/> punku.uncp.edu.pe/coordinacion</div>
        <div style={{flex:1}}/>
      </div>
      <div className="browser-body">{children}</div>
    </div>
  );
}

function App(){
  const [face, setFace] = useState('ciudadano');
  const [lang, setLang] = useState('es');
  const [czScreen, setCzScreen] = useState('welcome');
  const [crmView, setCrmView] = useState('bandeja');
  const [menu, setMenu] = useState(false);

  useEffect(()=>{
    const close = ()=>setMenu(false);
    if(menu){ window.addEventListener('click', close); return ()=>window.removeEventListener('click', close); }
  },[menu]);

  const jump = (f, key)=>{
    setFace(f);
    if(f==='ciudadano') setCzScreen(key); else setCrmView(key);
    setMenu(false);
  };

  return (
    <div className="stage">
      <header className="topbar">
        <PunkuLogo onClick={()=>jump('ciudadano','welcome')} tone={face==='crm'?'crm':'light'}/>
        <div className="seg" style={{marginLeft:8}}>
          <button className={face==='ciudadano'?'active':''} onClick={()=>setFace('ciudadano')}>
            <I.users s={16}/> {t('nav_ciudadano', lang)}
          </button>
          <button className={face==='crm'?'active':''} onClick={()=>setFace('crm')}>
            <I.filter s={15}/> {t('nav_crm', lang)}
          </button>
        </div>
        <div className="spacer"/>
        <div className="lang">
          <button className={lang==='es'?'active':''} onClick={()=>setLang('es')}>ES</button>
          <button className={lang==='qu'?'active':''} onClick={()=>setLang('qu')}>QU</button>
        </div>
        <div className="jump" onClick={e=>e.stopPropagation()}>
          <button className="jump-btn" onClick={()=>setMenu(m=>!m)}>
            <span style={{display:'flex'}}><I.filter s={15}/></span> Pantallas <I.chevron s={15}/>
          </button>
          {menu && (
            <div className="jump-menu">
              <div className="grp">Cara ciudadana</div>
              {CZ_SCREENS.map(([k,n,label])=>(
                <button key={k} className={face==='ciudadano'&&czScreen===k?'cur':''} onClick={()=>jump('ciudadano',k)}>
                  <span className="num">{n}</span> {label}
                </button>
              ))}
              <div className="grp">Cara interna · CRM</div>
              {CRM_SCREENS.map(([k,n,label])=>(
                <button key={k} className={face==='crm'&&crmView===k?'cur':''} onClick={()=>jump('crm',k)}>
                  <span className="num">{n}</span> {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="stage-body" style={face==='crm'?{alignItems:'flex-start'}:{}}>
        {face==='ciudadano'
          ? <Phone><CitizenApp lang={lang} screen={czScreen} setScreen={setCzScreen}/></Phone>
          : <BrowserCRM><CrmApp lang={lang} view={crmView} setView={setCrmView}/></BrowserCRM>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
