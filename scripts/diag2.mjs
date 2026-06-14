// Replica exacta: crear -> PATCH del nuevo código -> leer. Con logging completo.
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
const j = (r) => r.json();

async function main() {
  console.log("== Diag2 create+patch:", BASE, "==");
  const create = await fetch(`${BASE}/api/expedientes`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ catId: "educ", area: "Educación", quePasa: "Los niños necesitan refuerzo escolar", distrito: "El Tambo", familias: 30, aspiracion: "Más oportunidades", urgenciaCiudadana: "anio", relato: "", emergencia: false, mode: "self", contacto: { nombre: "Test Diag", comunidad: "CC Test", distrito: "El Tambo", tel: "900000000" } }),
  }).then(j);
  const code = create.codigo;
  console.log("CREATE -> code:", code, "| clasificado_por:", create.clasificado_por);

  // detalle inmediato
  const d1 = await fetch(`${BASE}/api/expedientes/${code}`).then(j);
  console.log("GET1   -> estado:", d1.expediente?.estado, "| historial:", d1.historial?.length, "| existe:", !!d1.expediente);

  const login = await fetch(`${BASE}/api/panel/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }) });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

  const patch = await fetch(`${BASE}/api/expedientes/${code}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "revision", nota: "diag2" }) });
  const pb = await patch.json().catch(() => ({}));
  console.log("PATCH  ->", patch.status, "| cuerpo.estado:", pb.expediente?.estado, "| error:", pb.error || "-");

  // pequeña espera por si hay lag
  await new Promise((r) => setTimeout(r, 1500));

  const d2 = await fetch(`${BASE}/api/expedientes/${code}`).then(j);
  console.log("GET2   -> estado:", d2.expediente?.estado, "| historial:", d2.historial?.length);
  const pub = await fetch(`${BASE}/api/estado?codigo=${code}`).then(j);
  console.log("PÚBLICA-> estado:", pub.estado, "| historial:", pub.historial?.length);
}
main().catch((e) => console.error("ERROR:", e));
