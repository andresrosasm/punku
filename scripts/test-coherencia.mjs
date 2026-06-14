// Valida el nuevo enfoque: fricción cero (siempre crea) + flag datos_incompletos
// como aviso interno, y los botones /api/sugerir.
const B = process.argv[2] || "http://localhost:3004";
const post = (url, body, cookie) => fetch(B + url, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });
const get = (url, cookie) => fetch(B + url, { headers: cookie ? { Cookie: cookie } : {}, cache: "no-store" });

async function main() {
  console.log("== Enfoque sin bloqueo contra:", B, "==");
  const login = await post("/api/panel/login", { user: "coordinador", pass: "demo2026" });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";

  // 1) INCOHERENTE -> SIEMPRE crea (201), pero el detalle marca datos_incompletos.
  const inc = await post("/api/expedientes", { catId: "agua", area: "Medio ambiente y agua", quePasa: "Otra cosa", distrito: "Sapallanga", familias: 30, aspiracion: "", urgenciaCiudadana: "anio", relato: "asdf jkl qwe zxc ffas ddaa", emergencia: false, mode: "self", contacto: { nombre: "Test Inc", comunidad: "CC Inc", distrito: "Sapallanga", tel: "987654321" } });
  const incB = await inc.json();
  console.log("1) INCOHERENTE -> status:", inc.status, "(debe ser 201) | codigo:", incB.codigo);
  if (incB.codigo) {
    const d = await get(`/api/expedientes/${incB.codigo}`).then((r) => r.json());
    console.log("   detalle datos_incompletos:", d.expediente?.datos_incompletos, "(debe ser true)");
  }

  // 2) COHERENTE -> 201, datos_incompletos false.
  const ok = await post("/api/expedientes", { catId: "agua", area: "Medio ambiente y agua", quePasa: "Nuestra agua esta contaminada", distrito: "Sapallanga", familias: 80, aspiracion: "Recuperar nuestra agua", urgenciaCiudadana: "alta", relato: "El pozo huele mal y los ninos se enferman del estomago", emergencia: false, mode: "self", contacto: { nombre: "Rosa Nahui", comunidad: "CC Real", distrito: "Sapallanga", tel: "987111222" } });
  const okB = await ok.json();
  console.log("2) COHERENTE   -> status:", ok.status, "| codigo:", okB.codigo, "| clasificado_por:", okB.clasificado_por);
  if (okB.codigo) {
    const d = await get(`/api/expedientes/${okB.codigo}`).then((r) => r.json());
    console.log("   detalle datos_incompletos:", d.expediente?.datos_incompletos, "(debe ser false)");
  }

  // 3) /api/sugerir 4 campos (con sesión).
  for (const campo of ["objetivoGen", "objetivosEsp", "metas", "evaluacion"]) {
    const s = await post("/api/sugerir", { codigo: okB.codigo || "PUNKU-2026-013", campo }, cookie);
    const sb = await s.json();
    console.log(`3) sugerir ${campo} -> coherente:`, sb.coherente, "| por:", sb.generado_por, "|", (sb.texto || sb.motivo || "").slice(0, 45).replace(/\n/g, " "));
  }

  // 4) contacto (telefono real para el wa.me) con sesión.
  if (okB.codigo) {
    const cc = await get(`/api/expedientes/${okB.codigo}/contacto`, cookie).then((r) => r.json());
    console.log("4) contacto (para WhatsApp) -> tel:", cc.contacto?.telefono, "| nombre:", cc.contacto?.nombre_representante);
  }
}
main().catch((e) => console.error("ERROR:", e));
