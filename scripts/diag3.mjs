// Discrimina: ¿caching de respuesta (CDN) o lag de DB?
// Crea, PATCH, y lee inmediatamente: (a) URL normal, (b) URL con cache-buster.
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
const j = (r) => r.json();

async function main() {
  const create = await fetch(`${BASE}/api/expedientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catId: "salud", area: "Salud", quePasa: "Campaña de salud", distrito: "Sicaya", familias: 40, aspiracion: "Comunidad sana", urgenciaCiudadana: "anio", relato: "", emergencia: false, mode: "self", contacto: { nombre: "Diag3", comunidad: "CC D3", distrito: "Sicaya", tel: "900000003" } }) }).then(j);
  const code = create.codigo;
  console.log("CREATE -> code:", code);

  const login = await fetch(`${BASE}/api/panel/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }) });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

  const patch = await fetch(`${BASE}/api/expedientes/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "revision", nota: "d3" }) });
  const pb = await patch.json().catch(() => ({}));
  console.log("PATCH  ->", patch.status, "| cuerpo.estado:", pb.expediente?.estado);

  // Inmediato, sin delay: normal vs cache-buster
  const plain = await fetch(`${BASE}/api/estado?codigo=${code}`);
  const plainAge = plain.headers.get("age");
  const plainCache = plain.headers.get("x-vercel-cache") || plain.headers.get("cf-cache-status") || "-";
  const plainBody = await plain.json();
  console.log("GET plain        -> estado:", plainBody.estado, "| x-cache:", plainCache, "| age:", plainAge || "-");

  const buster = await fetch(`${BASE}/api/estado?codigo=${code}&_=${Date.now()}`);
  const busterBody = await buster.json();
  console.log("GET cache-buster -> estado:", busterBody.estado, "| x-cache:", buster.headers.get("x-vercel-cache") || "-");

  // store=no-cache forzado en cliente
  const nc = await fetch(`${BASE}/api/estado?codigo=${code}`, { cache: "no-store" });
  const ncBody = await nc.json();
  console.log("GET no-store     -> estado:", ncBody.estado);
}
main().catch((e) => console.error("ERROR:", e));
