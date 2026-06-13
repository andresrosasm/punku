/* ============================================================
   PUNKU — Datos (100% FICTICIOS) + i18n
   Portado del prototipo de diseño (docs/design/punku-data.jsx).
   La copy y los datos de esta capa son fuente de verdad VISUAL (README de Design).
   Declaración jurada del concurso: todos los datos son ficticios.
   ============================================================ */

export type Lang = "es" | "qu";
export type CatId = "agro" | "salud" | "educ" | "agua" | "cultura" | "infra";
export type EstadoId = "recibido" | "revision" | "derivado" | "atendido" | "cerrado";
export type Urgencia = "alta" | "media" | "baja";

export interface Categoria {
  id: CatId;
  icon: CatId;
  color: string;
  tint: string;
  es: string;
  qu: string;
}

/* ---------- Categorías (mapean a las áreas de la UNCP) ---------- */
export const CATEGORIES: Categoria[] = [
  { id: "agro", icon: "agro", color: "#357A58", tint: "#DCEEE3", es: "Agricultura y ganadería", qu: "Chakra luray, uywakuna" },
  { id: "salud", icon: "salud", color: "#B23A2E", tint: "#F6DAD4", es: "Salud", qu: "Hampikuy" },
  { id: "educ", icon: "educ", color: "#C56B3F", tint: "#F6E2D5", es: "Educación", qu: "Yachay" },
  { id: "agua", icon: "agua", color: "#2F7E9C", tint: "#D8ECF2", es: "Medio ambiente y agua", qu: "Pacha mama, yaku" },
  { id: "cultura", icon: "cultura", color: "#8A5BB0", tint: "#EBDFF5", es: "Cultura y sociedad", qu: "Kawsay, ayllu" },
  { id: "infra", icon: "infra", color: "#C99A2E", tint: "#FBE6BC", es: "Infraestructura y servicios", qu: "Llamkay wasikuna" },
];

export interface Problem {
  id: string;
  ic: string;
  es: string;
  qu: string;
}

/* ---------- Paso B: qué está pasando (por categoría) ---------- */
export const PROBLEMS: Record<CatId, Problem[]> = {
  agro: [
    { id: "animales", ic: "🐄", es: "Mis animales se enferman", qu: "Uywaykuna unquchkan" },
    { id: "cultivos", ic: "🌾", es: "Mis cultivos rinden poco", qu: "Tarpusqaykuna pisita puqun" },
    { id: "vender", ic: "💰", es: "No vendo bien mi producto", qu: "Mana allinta lantikuu" },
    { id: "asistencia", ic: "🔧", es: "Necesito asistencia técnica", qu: "Yanapakuyta munaa" },
    { id: "otro_agro", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
  salud: [
    { id: "campana", ic: "📣", es: "Queremos una campaña de salud", qu: "Hampikuy raymita munanchik" },
    { id: "agua_salud", ic: "💧", es: "El agua nos enferma", qu: "Yaku unquchiwanchik" },
    { id: "lejos", ic: "🏥", es: "La posta está muy lejos", qu: "Hampina wasi kalupi" },
    { id: "capacitacion", ic: "🩹", es: "Queremos aprender primeros auxilios", qu: "Yanapakuyta yachayta munanchik" },
    { id: "otro_salud", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
  educ: [
    { id: "refuerzo", ic: "📚", es: "Los niños necesitan refuerzo escolar", qu: "Wawakuna yachayta munan" },
    { id: "capacita", ic: "👩‍🏫", es: "Queremos capacitación para adultos", qu: "Hatun nunakunapaq yachachiy" },
    { id: "tecnica", ic: "🛠️", es: "Queremos formación técnica", qu: "Luray yachayta munanchik" },
    { id: "becas", ic: "🎓", es: "Queremos saber sobre becas", qu: "Becakunamanta yachayta munanchik" },
    { id: "otro_educ", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
  agua: [
    { id: "contamina", ic: "🚱", es: "Nuestra agua está contaminada", qu: "Yakunchik qellichasqa" },
    { id: "rio", ic: "🗑️", es: "El río arrastra basura o relave", qu: "Mayu qellita apan" },
    { id: "residuos", ic: "♻️", es: "No sabemos qué hacer con la basura", qu: "Qellita mana imanaytapas yachanchikchu" },
    { id: "forestal", ic: "🌳", es: "Queremos reforestar nuestra zona", qu: "Sachata tarpuyta munanchik" },
    { id: "otro_agua", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
  cultura: [
    { id: "jovenes", ic: "🚶", es: "Los jóvenes se van de la comunidad", qu: "Waynakuna sipaskuna lipunku" },
    { id: "tradicion", ic: "🎭", es: "Queremos rescatar nuestras tradiciones", qu: "Ñawpa kawsayta hataliyta munanchik" },
    { id: "organiza", ic: "🤝", es: "Queremos organizarnos mejor", qu: "Allinta umalliyta munanchik" },
    { id: "violencia", ic: "⚖️", es: "Hay problemas de convivencia", qu: "Tiyanakuypi sasachakuy kan" },
    { id: "otro_cult", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
  infra: [
    { id: "camino", ic: "🛣️", es: "Nuestro camino está en mal estado", qu: "Ñanninchik mana allinchu" },
    { id: "riego", ic: "🚜", es: "Falta riego para las chacras", qu: "Chakrapaq qalpay pisin" },
    { id: "luz", ic: "💡", es: "No tenemos buena electricidad", qu: "Mana allin kanchaykuna kanchu" },
    { id: "local", ic: "🏛️", es: "Necesitamos un local comunal", qu: "Ayllu wasita munanchik" },
    { id: "otro_infra", ic: "➕", es: "Otra cosa", qu: "Huk imapas" },
  ],
};

/* ---------- Distritos de la provincia de Huancayo ---------- */
export const DISTRITOS = [
  "Huancayo", "El Tambo", "Chilca", "Pilcomayo", "San Agustín de Cajas", "Sapallanga",
  "Sicaya", "Quilcas", "Chupuro", "Pucará", "Huancán", "Hualhuas", "Ingenio", "Colca",
  "Chacapampa", "Cullhuas", "Carhuacallanga", "Chicche", "Huasicancha", "Pariahuanca",
];

export interface Estado {
  id: EstadoId;
  es: string;
  qu: string;
  czEs: string;
  czQu: string;
}

/* ---------- Estados del expediente (lenguaje ciudadano) ---------- */
export const ESTADOS: Estado[] = [
  { id: "recibido", es: "Recibido", qu: "Chaskisqa", czEs: "Recibimos tu necesidad. Ya está en PUNKU.", czQu: "Necesidadniykita chaskiykunña." },
  { id: "revision", es: "En revisión", qu: "Qawachkan", czEs: "La universidad está viendo a qué facultad le corresponde.", czQu: "Universidadqa mayqin facultadtam qawachkan." },
  { id: "derivado", es: "Derivado", qu: "Kachasqa", czEs: "Tu caso ya llegó al equipo que puede ayudarte.", czQu: "Caseykiqa yanapaq llamkaqkunaman chayan." },
  { id: "atendido", es: "Atendido", qu: "Yanapasqa", czEs: "Hay un equipo trabajando contigo en tu comunidad.", czQu: "Huk llamkaqkuna aylluykipi llamkachkan." },
  { id: "cerrado", es: "Cerrado", qu: "Tukusqa", czEs: "El caso terminó. Gracias por confiar en PUNKU.", czQu: "Caseyki tukurun. Yusulpayki." },
];

/* ---------- Facultades UNCP (para derivar) ---------- */
export const FACULTADES = [
  "Ingeniería Ambiental", "Agronomía", "Zootecnia", "Medicina Humana", "Enfermería",
  "Ciencias de la Educación", "Ingeniería Civil", "Ingeniería de Sistemas",
  "Antropología", "Trabajo Social", "Economía", "Otra entidad (ONG / Gob. regional)",
];

/* ---------- Estilos de estado (CRM) ---------- */
export const ESTADO_STYLE: Record<EstadoId, { bg: string; fg: string; dot: string }> = {
  recibido: { bg: "#E8EEF6", fg: "#345A8C", dot: "#4A78B8" },
  revision: { bg: "#FBE6BC", fg: "#8A5A12", dot: "#E8A13C" },
  derivado: { bg: "#EBDFF5", fg: "#6A3E94", dot: "#8A5BB0" },
  atendido: { bg: "#DCEEE3", fg: "#2E6B4E", dot: "#357A58" },
  cerrado: { bg: "#E7EAEA", fg: "#56605F", dot: "#8A9594" },
};

/* ---------- Mapeo ODS y Área de proyección social (por categoría) ---------- */
export const ODS_MAP: Record<CatId, string> = {
  agro: "ODS 2 · Hambre cero",
  salud: "ODS 3 · Salud y bienestar",
  educ: "ODS 4 · Educación de calidad",
  agua: "ODS 6 · Agua limpia y saneamiento",
  cultura: "ODS 11 · Ciudades y comunidades sostenibles",
  infra: "ODS 9 · Industria, innovación e infraestructura",
};
export const AREA_MAP: Record<CatId, string> = {
  agro: "Intervención Tecnológica",
  salud: "Extensión Universitaria",
  educ: "Extensión Universitaria",
  agua: "Intervención Tecnológica",
  cultura: "Imagen Institucional",
  infra: "Intervención Tecnológica",
};
export const AREAS_PS = ["Extensión Universitaria", "Intervención Tecnológica", "Imagen Institucional"];

/* ---------- Facultades sugeridas por categoría (para el fallback por reglas, spec 03) ---------- */
export const FAC_POR_CAT: Record<CatId, string[]> = {
  agro: ["Agronomía", "Zootecnia"],
  salud: ["Enfermería", "Medicina Humana"],
  educ: ["Ciencias de la Educación"],
  agua: ["Ingeniería Ambiental"],
  cultura: ["Antropología", "Trabajo Social"],
  infra: ["Ingeniería Civil"],
};

export interface ExpedienteSeed {
  codigo: string;
  comunidad: string;
  distrito: string;
  cat: CatId;
  urgencia: Urgencia;
  estado: EstadoId;
  fecha: string;
  familias: number;
  canal: string;
  confianza: number;
  facultades: string[];
  modalidad: string;
  representante: string;
  telefono: string;
  aspiracion: string;
  titulo: string;
  resumen: string;
}

/* ---------- Expedientes ficticios (CRM) ---------- */
export const EXPEDIENTES: ExpedienteSeed[] = [
  { codigo: "PUNKU-2026-014", comunidad: "CC Alto Mantaro", distrito: "Pariahuanca", cat: "agua", urgencia: "alta", estado: "recibido", fecha: "13 jun 2026", familias: 120, canal: "PUNKU Emergencias", confianza: 94, facultades: ["Ingeniería Ambiental", "Zootecnia"], modalidad: "Proyecto de proyección social", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Que el río vuelva a estar limpio y podamos criar truchas otra vez.", titulo: "Posible contaminación del río afecta truchas y consumo", resumen: "La comunidad reporta que el agua del río presenta coloración y olor extraños; mueren truchas de criaderos familiares y temen por el agua de consumo. Solicitan evaluación de calidad del agua y orientación técnica urgente." },
  { codigo: "PUNKU-2026-013", comunidad: "CC Sumac Pampa", distrito: "Sapallanga", cat: "agro", urgencia: "media", estado: "revision", fecha: "12 jun 2026", familias: 48, canal: "PUNKU", confianza: 88, facultades: ["Zootecnia", "Agronomía"], modalidad: "Asistencia técnica", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Que nuestros animales estén sanos y podamos vender mejor.", titulo: "Enfermedad en el ganado ovino reduce ingresos familiares", resumen: "Animales presentan síntomas de enfermedad recurrente que reduce la producción. La comunidad pide una campaña veterinaria y capacitación en manejo sanitario del ganado." },
  { codigo: "PUNKU-2026-012", comunidad: "CC Suelos Vivos", distrito: "Quilcas", cat: "agua", urgencia: "media", estado: "derivado", fecha: "11 jun 2026", familias: 75, canal: "PUNKU", confianza: 91, facultades: ["Ingeniería Ambiental"], modalidad: "Proyecto de proyección social", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Tener nuestra comunidad limpia y ordenada.", titulo: "Manejo de residuos sólidos en la comunidad", resumen: "No cuentan con manejo de residuos; solicitan acompañamiento para implementar un plan comunal de segregación y compostaje." },
  { codigo: "PUNKU-2026-011", comunidad: "Barrio La Esperanza", distrito: "El Tambo", cat: "educ", urgencia: "baja", estado: "atendido", fecha: "10 jun 2026", familias: 60, canal: "PUNKU", confianza: 85, facultades: ["Ciencias de la Educación"], modalidad: "Voluntariado universitario", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Que nuestros niños aprendan mejor y tengan más oportunidades.", titulo: "Refuerzo escolar para niños de primaria", resumen: "Solicitan apoyo de estudiantes para reforzamiento en lectura y matemática de niños de primaria." },
  { codigo: "PUNKU-2026-010", comunidad: "CC Tres Esquinas", distrito: "Chilca", cat: "infra", urgencia: "media", estado: "revision", fecha: "09 jun 2026", familias: 90, canal: "PUNKU", confianza: 79, facultades: ["Ingeniería Civil"], modalidad: "Estudio técnico", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Tener agua suficiente para que las chacras produzcan bien.", titulo: "Sistema de riego deteriorado afecta las chacras", resumen: "El canal de riego está deteriorado y reduce el agua para cultivos. Piden un estudio y propuesta de mejora." },
  { codigo: "PUNKU-2026-009", comunidad: "CC Wari Marca", distrito: "Sicaya", cat: "salud", urgencia: "baja", estado: "cerrado", fecha: "06 jun 2026", familias: 140, canal: "PUNKU", confianza: 90, facultades: ["Enfermería", "Medicina Humana"], modalidad: "Campaña de salud", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Que las familias estén sanas y sepan cuidarse.", titulo: "Campaña de salud preventiva realizada", resumen: "Se solicitó y ejecutó una campaña de salud preventiva para la comunidad." },
  { codigo: "PUNKU-2026-008", comunidad: "CC Kuntur Wasi", distrito: "Pucará", cat: "cultura", urgencia: "baja", estado: "recibido", fecha: "05 jun 2026", familias: 35, canal: "PUNKU", confianza: 72, facultades: ["Antropología", "Trabajo Social"], modalidad: "Proyecto de proyección social", representante: "(reservado)", telefono: "(reservado)", aspiracion: "Que los jóvenes se queden y valoren nuestras costumbres.", titulo: "Jóvenes migran: rescate de identidad y oportunidades", resumen: "La comunidad busca actividades que arraiguen a los jóvenes y rescaten tradiciones locales." },
];

/* ---------- Aspiraciones (paso E) por categoría ---------- */
export const GOAL_OPTS: Record<CatId, { ic: string; es: string; qu: string }[]> = {
  agro: [{ ic: "🐄", es: "Animales sanos", qu: "Allin uywakuna" }, { ic: "🌾", es: "Mejores cosechas", qu: "Allin tarpuy" }, { ic: "💰", es: "Vender mejor", qu: "Allin lantikuy" }],
  salud: [{ ic: "❤️", es: "Comunidad sana", qu: "Allin ayllu" }, { ic: "💧", es: "Agua segura", qu: "Allin yaku" }, { ic: "🏥", es: "Atención más cerca", qu: "Qaylla hampikuy" }],
  educ: [{ ic: "📚", es: "Niños que aprenden más", qu: "Wawakuna yachanku" }, { ic: "🎓", es: "Más oportunidades", qu: "Aswan ñankuna" }, { ic: "🛠️", es: "Aprender un oficio", qu: "Ruray yachay" }],
  agua: [{ ic: "💧", es: "Recuperar nuestra agua", qu: "Yakunchikta kutichiy" }, { ic: "🌳", es: "Proteger nuestra tierra", qu: "Pachanchikta waqaychay" }, { ic: "🧹", es: "Limpiar nuestra zona", qu: "Llaqtanchikta pichay" }],
  cultura: [{ ic: "🎭", es: "Rescatar tradiciones", qu: "Kawsayta hataliy" }, { ic: "🤝", es: "Comunidad más unida", qu: "Huñasqa ayllu" }, { ic: "🌟", es: "Que los jóvenes se queden", qu: "Waynakuna qhipakuy" }],
  infra: [{ ic: "🛣️", es: "Mejor camino", qu: "Allin ñan" }, { ic: "🚜", es: "Riego para las chacras", qu: "Chakrapaq qalpay" }, { ic: "🏛️", es: "Un local comunal", qu: "Ayllu wasi" }],
};

export const PH_GOALS: Record<CatId, { es: string; qu: string }> = {
  agro: { es: "Por ejemplo: que mis animales estén sanos y pueda vender mejor mi cosecha…", qu: "Hina: uywaykuna allin kachunku, allinta lantikusaq…" },
  salud: { es: "Por ejemplo: que las familias tengan salud cerca y aprendamos a cuidarnos…", qu: "Hina: ayllukuna qayllapi hampikuyniyuq kachunku…" },
  educ: { es: "Por ejemplo: que nuestros niños aprendan mejor y tengan más oportunidades…", qu: "Hina: wawakuna aswan allinta yachachunku…" },
  agua: { es: "Por ejemplo: que el río vuelva a estar limpio y podamos criar truchas otra vez…", qu: "Hina: mayu yapa llumpaq kachun, truchakunata yapa uywasunman…" },
  cultura: { es: "Por ejemplo: que los jóvenes se queden y valoremos nuestras costumbres…", qu: "Hina: waynakuna qhipakuchunku, kawsayninchikta valorasunman…" },
  infra: { es: "Por ejemplo: que tengamos un mejor camino y un local para reunirnos…", qu: "Hina: aswan allin ñanniyuq kasunman, hukñapaq wasiyuq…" },
};

/* ---------- i18n ---------- */
export const STR: Record<Lang, Record<string, string>> = {
  es: {
    tag_ciudadano: "Puerta de la comunidad",
    nav_ciudadano: "Ciudadano", nav_crm: "Universidad · CRM",
    w_eyebrow: "Bienvenido a PUNKU",
    w_title: "Cuéntanos qué está pasando en tu comunidad.",
    w_sub: "La UNCP quiere escucharte. Sin viajar, sin trámites difíciles.",
    w_mode_self: "Registro mi comunidad", w_mode_other: "Ayudo a registrar a otra",
    w_start: "Empezar", w_emerg: "PUNKU Emergencias",
    w_emerg_hint: "Para casos urgentes: contaminación, desastre, salud.",
    w_consultar: "Ya tengo un código",
    step_of: "Paso {a} de {b}",
    stepA_q: "¿De qué se trata?", stepA_hint: "Toca lo que más se parece a tu necesidad.",
    stepB_q: "¿Qué está pasando?", stepB_hint: "Elige lo que más se parece.",
    stepC_q: "¿Dónde y a quiénes afecta?", stepC_hint: "Esto nos ayuda a entender el tamaño.",
    stepC_distrito: "Distrito", stepC_familias: "¿Cuántas familias, más o menos?",
    stepD_q: "¿Quieres contarnos más?", stepD_hint: "Es opcional. Cuéntalo con tus palabras.",
    stepD_ph: "Por ejemplo: desde hace dos semanas el agua del río bajó turbia y con mal olor…",
    stepD_audio: "O cuéntalo hablando",
    contact_title: "¿Cómo te ubicamos?", contact_hint: "Solo para poder llamarte sobre tu caso.",
    c_nombre: "Tu nombre", c_comunidad: "Tu comunidad", c_distrito: "Distrito", c_tel: "Número de contacto",
    privacy: "Tus datos personales se guardan de forma segura y no se comparten. No los usamos para la inteligencia que clasifica tu caso.",
    finish: "Enviar mi caso", back: "Atrás", next: "Continuar", skip: "Prefiero no contar más",
    proc_title: "PUNKU está entendiendo tu caso…", proc_sub: "Estamos preparando todo para ti.",
    rec_title: "Tu comunidad ya fue escuchada",
    rec_sub: "Te abrimos la puerta. Tu necesidad ya entró a la UNCP.",
    rec_code: "Tu código", rec_area: "Área sugerida", rec_estado: "Estado",
    rec_need: "Tu necesidad", rec_help: "A quiénes ayuda", rec_next: "Próximo paso",
    rec_families: "{n} familias", rec_nextstep: "Clasificación institucional",
    rec_copy: "Copiar código", rec_copied: "¡Copiado!", rec_track: "Consultar mi caso",
    rec_save: "Guarda tu código para seguir tu caso cuando quieras.",
    track_title: "Consulta tu caso", track_hint: "Escribe el código que te dimos.",
    track_ph: "PUNKU-2026-001", track_btn: "Ver mi caso", track_lost: "Perdí mi código",
    track_now: "Ahora", track_back: "Hacer otra consulta", track_notfound: "No encontramos ese código. Revísalo e intenta de nuevo.",
    emerg_title: "PUNKU Emergencias", emerg_sub: "Cuéntanos rápido. Vamos a priorizar tu caso.",
    emerg_q1: "¿Qué pasó?", emerg_q1ph: "Describe la emergencia con pocas palabras…",
    emerg_q2: "¿Dónde?", emerg_q3: "¿A quiénes afecta?", emerg_contact: "¿Cómo te llamamos?",
    emerg_photo: "Agregar una foto (opcional)", emerg_send: "Enviar emergencia",
    urgent_badge: "URGENTE",
    goal_q: "¿Qué quieres lograr?",
    goal_sub: "Cuéntanos qué sueñas para tu comunidad. No hay respuestas incorrectas.",
    goal_urg: "¿Es urgente?",
    goal_words: "o cuéntalo con tus palabras", goal_talk: "hablando",
    urg_high: "Sí, urgente", urg_year: "Este año", urg_wait: "Puede esperar",
    goal_skip: "Prefiero no responder esto",
  },
  qu: {
    tag_ciudadano: "Ayllup punkun",
    nav_ciudadano: "Nuna", nav_crm: "Universidad · CRM",
    w_eyebrow: "Allinllachu — PUNKU",
    w_title: "Willakuway imam aylluykipi kan.",
    w_sub: "UNCP uyaliyta munasunki. Mana pulispa, mana sasa trámitewan.",
    w_mode_self: "Aylluuta qillqaa", w_mode_other: "Huk aylluta yanapaa",
    w_start: "Qallaliy", w_emerg: "PUNKU Utqay",
    w_emerg_hint: "Utqay kaqpaq: qellichay, llakikuy, hampikuy.",
    w_consultar: "Códigoo kanñam",
    step_of: "{a} / {b} thatkiy",
    stepA_q: "¿Imamantam kan?", stepA_hint: "Llamiy imam necesidadniykiman likchakuq.",
    stepB_q: "¿Imam kan?", stepB_hint: "Akllay aswan likchakuqta.",
    stepC_q: "¿Maypi, pikunatam llakichin?", stepC_hint: "Kaywanmi hayka hatun kasqanta yachanchik.",
    stepC_distrito: "Distrito", stepC_familias: "¿Hayka ayllukuna, yaqalla?",
    stepD_q: "¿Astawan willayta munankichu?", stepD_hint: "Munaspallayki. Qampa shimiykiwan willay.",
    stepD_ph: "Hina: iskay simanañam mayup yakun qellilla, asnaqlla ulaykamun…",
    stepD_audio: "Utaq limaspa willay",
    contact_title: "¿Imaynam taliykiman?", contact_hint: "Caseykimanta waqyanaypaqlla.",
    c_nombre: "Sutiyki", c_comunidad: "Aylluyki", c_distrito: "Distrito", c_tel: "Waqyana yupay",
    privacy: "Datoykikunaqa allinta waqaychasqa, mana willakunchu. Manam IA-paq apaykachanchikchu.",
    finish: "Caseyta apachiy", back: "Kutiy", next: "Qatiy", skip: "Manaña willasaqchu",
    proc_title: "PUNKU caseykita hapichkan…", proc_sub: "Llapanta qampaq wakichichkanchik.",
    rec_title: "Aylluyki uyalisqaña",
    rec_sub: "Punkuta kichaykuyki. Necesidadniyki UNCP-man yaykunña.",
    rec_code: "Códigooyki", rec_area: "Área akllasqa", rec_estado: "Estado",
    rec_need: "Necesidadniyki", rec_help: "Pikunatam yanapan", rec_next: "Shamuq thatkiy",
    rec_families: "{n} ayllukuna", rec_nextstep: "Institución akllaynin",
    rec_copy: "Códigota copiay", rec_copied: "¡Copiasqaña!", rec_track: "Caseyta qaway",
    rec_save: "Códigooykita waqaychay, caseykita qawanaykipaq.",
    track_title: "Caseykita maskay", track_hint: "Códigota qillqay.",
    track_ph: "PUNKU-2026-001", track_btn: "Caseyta qaway", track_lost: "Códigooyta chinkachii",
    track_now: "Kunan", track_back: "Huktawan maskay", track_notfound: "Manam chay códigota tarinchikchu. Qawariy, huktawan ruray.",
    emerg_title: "PUNKU Utqay", emerg_sub: "Utqaylla willaway. Caseykita ñawpaqman churasaq.",
    emerg_q1: "¿Imam kasqa?", emerg_q1ph: "Pisi shimiwan utqay willay…",
    emerg_q2: "¿Maypi?", emerg_q3: "¿Pikunatam llakichin?", emerg_contact: "¿Imaynam waqyaykiman?",
    emerg_photo: "Fotota yapay (munaspa)", emerg_send: "Utqayta apachiy",
    urgent_badge: "UTQAY",
    goal_q: "¿Imatam munanki?",
    goal_sub: "Willakuway imatam aylluykipaq musqunki.",
    goal_urg: "¿Utqaychu?",
    goal_words: "utaq shimiykiwan willay", goal_talk: "rimaspa",
    urg_high: "Arí, utqaymi", urg_year: "Kay watapi", urg_wait: "Suyananchikman",
    goal_skip: "Manaña kutichiyta munanichu",
  },
};

export function t(key: string, lang: Lang, vars?: Record<string, string | number>): string {
  let s = (STR[lang] && STR[lang][key]) || STR.es[key] || key;
  if (vars) Object.keys(vars).forEach((k) => (s = s.replace("{" + k + "}", String(vars[k]))));
  return s;
}
export function catLabel(cat: Categoria, lang: Lang): string {
  return lang === "qu" ? cat.qu : cat.es;
}
export function catOf(id: CatId): Categoria | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
