// Smoke test del flujo end-to-end de PUNKU (no se commitea como prueba formal).
const BASE = "http://localhost:3000";
const j = (r) => r.json();

async function main() {
  // 1) Crear expediente (flujo ciudadano). Sin ANTHROPIC_API_KEY -> fallback a reglas.
  const create = await fetch(`${BASE}/api/expedientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      catId: "agua", area: "Medio ambiente y agua", quePasa: "Nuestra agua esta contaminada",
      distrito: "Sapallanga", familias: 120, aspiracion: "Recuperar nuestra agua",
      urgenciaCiudadana: "alta", relato: "El rio bajo turbio y con mal olor hace dos semanas",
      emergencia: false, mode: "self",
      contacto: { nombre: "Maria Quispe", comunidad: "CC Sumac Pampa", distrito: "Sapallanga", tel: "999111222" },
    }),
  }).then(j);
  console.log("1) Tarjeta creada:", JSON.stringify(create));
  const code = create.codigo;

  // 2) Consulta pública por código (NO debe exponer contacto).
  const pub = await fetch(`${BASE}/api/estado?codigo=${code}`).then(j);
  const pubStr = JSON.stringify(pub);
  console.log("2) Consulta publica:", pubStr.slice(0, 200), "...");
  const fuga = /Maria|999111222|nombre_repr|telefono/i.test(pubStr);
  console.log("   -> Estado:", pub.estado, "| Historial:", pub.historial?.length, "entradas");
  console.log("   -> FUGA DE CONTACTO:", fuga ? "SI (FALLO)" : "NO (OK)");

  // 3) Sin sesion, PATCH de estado debe ser 401.
  const noAuth = await fetch(`${BASE}/api/expedientes/${code}`, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ estado: "revision" }),
  });
  console.log("3) PATCH sin sesion ->", noAuth.status, noAuth.status === 401 ? "(OK, bloqueado)" : "(FALLO)");

  // 3b) Contacto sin sesion debe ser 401.
  const cNoAuth = await fetch(`${BASE}/api/expedientes/${code}/contacto`);
  console.log("3b) GET contacto sin sesion ->", cNoAuth.status, cNoAuth.status === 401 ? "(OK, bloqueado)" : "(FALLO)");

  // 4) Login coordinador.
  const login = await fetch(`${BASE}/api/panel/login`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }),
  });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  console.log("4) Login coordinador ->", login.status, "| cookie:", cookie ? "set" : "none");

  // 5) Con sesion: cambiar estado a 'revision'.
  const patch = await fetch(`${BASE}/api/expedientes/${code}`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "revision", nota: "Clasificando" }),
  });
  console.log("5) PATCH con sesion ->", patch.status, patch.status === 200 ? "(OK)" : "(FALLO)");

  // 6) La consulta ciudadana refleja el nuevo estado (puente del dolor #2).
  const pub2 = await fetch(`${BASE}/api/estado?codigo=${code}`).then(j);
  console.log("6) Consulta tras cambio -> estado:", pub2.estado, "| historial:", pub2.historial?.length, pub2.estado === "revision" ? "(OK refleja CRM)" : "(FALLO)");

  // 7) Con sesion: revelar contacto (rol coordinador).
  const cAuth = await fetch(`${BASE}/api/expedientes/${code}/contacto`, { headers: { Cookie: cookie } }).then((r) => r.json());
  console.log("7) Contacto con sesion ->", JSON.stringify(cAuth.contacto));

  // 8) Lista CRM (bandeja) incluye el nuevo + los 7 ficticios.
  const list = await fetch(`${BASE}/api/expedientes`).then(j);
  console.log("8) Bandeja: ", list.expedientes.length, "expedientes");
}
main().catch((e) => { console.error("ERROR:", e); process.exit(1); });
