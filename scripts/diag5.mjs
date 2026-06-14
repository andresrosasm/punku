// Confirma caching: misma URL consultada antes y después de un cambio de estado.
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
const CODE = process.argv[3] || "PUNKU-2026-008";
const j = (r) => r.json();

async function main() {
  const cookie = (await fetch(`${BASE}/api/panel/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user: "coordinador", pass: "demo2026" }) })).headers.get("set-cookie")?.split(";")[0] || "";

  // 1) consulta (cachea la URL)
  const a = await fetch(`${BASE}/api/estado?codigo=${CODE}`);
  console.log("GET1 ->", (await a.json()).estado, "| x-cache:", a.headers.get("x-vercel-cache") || "-");

  // 2) cambia a 'derivado'
  const p = await fetch(`${BASE}/api/expedientes/${CODE}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ estado: "derivado" }) });
  console.log("PATCH ->", p.status, "| body.estado:", (await p.json()).expediente?.estado);

  // 3) MISMA URL otra vez
  const b = await fetch(`${BASE}/api/estado?codigo=${CODE}`);
  console.log("GET2 (misma URL) ->", (await b.json()).estado, "| x-cache:", b.headers.get("x-vercel-cache") || "-");

  // 4) URL con cache-buster
  const c = await fetch(`${BASE}/api/estado?codigo=${CODE}&_=${Date.now()}`);
  console.log("GET3 (cache-buster) ->", (await c.json()).estado, "| x-cache:", c.headers.get("x-vercel-cache") || "-");
}
main().catch((e) => console.error("ERROR:", e));
