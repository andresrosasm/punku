// Diagnóstico de cambiarEstado contra producción.
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
const CODE = process.argv[3] || "PUNKU-2026-008"; // seed en estado 'recibido'
const j = (r) => r.json();

async function main() {
  console.log("== Diag cambiarEstado:", BASE, CODE, "==");

  // estado actual
  const before = await fetch(`${BASE}/api/expedientes/${CODE}`).then(j);
  console.log("ANTES  -> estado:", before.expediente?.estado, "| historial:", before.historial?.length);

  // login
  const login = await fetch(`${BASE}/api/panel/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }) });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  console.log("login:", login.status, "| cookie:", cookie ? cookie.slice(0, 20) + "..." : "NONE");

  // PATCH a 'revision' y log del cuerpo COMPLETO
  const patch = await fetch(`${BASE}/api/expedientes/${CODE}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "revision", nota: "diag" }) });
  const patchBody = await patch.json().catch(() => ({}));
  console.log("PATCH  ->", patch.status, "| cuerpo.estado:", patchBody.expediente?.estado, "| error:", patchBody.error || "-");

  // re-GET inmediato
  const after = await fetch(`${BASE}/api/expedientes/${CODE}`).then(j);
  console.log("DESPUÉS-> estado:", after.expediente?.estado, "| historial:", after.historial?.length);

  // consulta pública
  const pub = await fetch(`${BASE}/api/estado?codigo=${CODE}`).then(j);
  console.log("PÚBLICA-> estado:", pub.estado, "| historial:", pub.historial?.length);
}
main().catch((e) => console.error("ERROR:", e));
