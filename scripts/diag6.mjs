// Cuenta códigos duplicados en la bandeja (revela seeding duplicado por carrera).
const BASE = process.argv[2] || "https://punku-kappa.vercel.app";
async function main() {
  const { expedientes } = await fetch(`${BASE}/api/expedientes`).then((r) => r.json());
  console.log("Total filas en bandeja:", expedientes.length);
  const counts = {};
  for (const e of expedientes) counts[e.codigo] = (counts[e.codigo] || 0) + 1;
  const dups = Object.entries(counts).filter(([, n]) => n > 1);
  if (dups.length === 0) console.log("Sin duplicados. Códigos únicos:", Object.keys(counts).length);
  else { console.log("DUPLICADOS detectados:"); for (const [c, n] of dups) console.log(`  ${c}: ${n} filas`); }
}
main().catch((e) => console.error("ERROR:", e));
