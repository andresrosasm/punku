// Valida la lógica de coherencia (422 vs 201) y el endpoint /api/sugerir.
const B = process.argv[2] || "http://localhost:3002";
const post = (url, body, cookie) => fetch(B + url, { method: "POST", headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body) });

async function main() {
  console.log("== Coherencia contra:", B, "==");

  // 1) INCOHERENTE: sin selección real ("Otra cosa") + texto gibberish.
  const inc = await post("/api/expedientes", { catId: "agua", area: "Medio ambiente y agua", quePasa: "Otra cosa", distrito: "Sapallanga", familias: 30, aspiracion: "", urgenciaCiudadana: "anio", relato: "asdf jkl qwe zxc ffas ddaa", emergencia: false, mode: "self", contacto: { nombre: "ffas", comunidad: "ddaa", distrito: "Sapallanga", tel: "900" } });
  const incBody = await inc.json();
  console.log("1) INCOHERENTE -> status:", inc.status, "| incoherente:", incBody.incoherente, "| msg:", (incBody.mensaje || "").slice(0, 70));

  // 2) COHERENTE: selección real -> debe crear (201).
  const ok = await post("/api/expedientes", { catId: "agua", area: "Medio ambiente y agua", quePasa: "Nuestra agua esta contaminada", distrito: "Sapallanga", familias: 80, aspiracion: "Recuperar nuestra agua", urgenciaCiudadana: "alta", relato: "El pozo huele mal y los ninos se enferman", emergencia: false, mode: "self", contacto: { nombre: "Rosa", comunidad: "CC Real", distrito: "Sapallanga", tel: "987" } });
  const okBody = await ok.json();
  console.log("2) COHERENTE   -> status:", ok.status, "| codigo:", okBody.codigo, "| clasificado_por:", okBody.clasificado_por);

  // 3) /api/sugerir con sesión coordinador, sobre un seed coherente.
  const login = await post("/api/panel/login", { user: "coordinador", pass: "demo2026" });
  const cookie = login.headers.get("set-cookie")?.split(";")[0] || "";
  for (const campo of ["objetivoGen", "objetivosEsp", "metas", "evaluacion"]) {
    const s = await post("/api/sugerir", { codigo: "PUNKU-2026-013", campo }, cookie);
    const sb = await s.json();
    console.log(`3) sugerir ${campo} -> coherente:`, sb.coherente, "| por:", sb.generado_por, "| texto:", (sb.texto || sb.motivo || "").slice(0, 50).replace(/\n/g, " "));
  }

  // 3b) /api/sugerir SIN sesión -> 401
  const noauth = await post("/api/sugerir", { codigo: "PUNKU-2026-013", campo: "metas" });
  console.log("3b) sugerir sin sesion ->", noauth.status, noauth.status === 401 ? "(OK bloqueado)" : "(FALLO)");
}
main().catch((e) => console.error("ERROR:", e));
