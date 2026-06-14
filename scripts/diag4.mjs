// Cuantifica la flakiness: N ciclos de crear -> patch -> consulta inmediata (0ms).
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
const N = parseInt(process.argv[3] || "6", 10);
const j = (r) => r.json();

async function login() {
  const r = await fetch(`${BASE}/api/panel/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }) });
  return r.headers.get("set-cookie")?.split(";")[0] || "";
}

async function cycle(i, cookie) {
  const create = await fetch(`${BASE}/api/expedientes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ catId: "agro", area: "Agricultura y ganadería", quePasa: "Mis animales se enferman", distrito: "Sicaya", familias: 20, aspiracion: "Animales sanos", urgenciaCiudadana: "anio", relato: "", emergencia: false, mode: "self", contacto: { nombre: "H" + i, comunidad: "CC H" + i, distrito: "Sicaya", tel: "900" } }) }).then(j);
  const code = create.codigo;
  const patch = await fetch(`${BASE}/api/expedientes/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "revision" }) });
  const pb = await patch.json().catch(() => ({}));
  const pub = await fetch(`${BASE}/api/estado?codigo=${code}`).then(j); // 0ms después
  const ok = pub.estado === "revision";
  console.log(`#${i} ${code} | PATCH.body=${pb.expediente?.estado} | consulta=${pub.estado} | ${ok ? "OK" : "STALE"}`);
  return ok;
}

async function main() {
  console.log("== Hammer", N, "ciclos:", BASE, "==");
  const cookie = await login();
  let ok = 0;
  for (let i = 1; i <= N; i++) { if (await cycle(i, cookie)) ok++; }
  console.log(`\nResultado: ${ok}/${N} consultas inmediatas reflejaron el cambio (${Math.round(ok / N * 100)}%)`);
}
main().catch((e) => console.error("ERROR:", e));
