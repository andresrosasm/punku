/* ============================================================
   PUNKU — La PUERTA (app/page.tsx)  ·  URL única de entrega
   ------------------------------------------------------------
   La raíz NO es la cara ciudadana: es una pantalla-puerta que enruta por rol.
   Refuerza el nombre (PUNKU = "puerta"): símbolo montaña-puerta, una línea de
   concepto y dos accesos. La puerta solo enruta; no toca datos ni lógica.
   (HANDOFF §1, §4.0)
   ============================================================ */
import Link from "next/link";
import { MountainDoor } from "@/components/MountainDoor";
import { CatGlyph, I } from "@/components/icons";

export default function Door() {
  return (
    <main className="door">
      <MountainDoor size={120} variant="hero" />
      <div className="door-eyebrow">PUNKU · UNCP · Huancayo</div>
      <h1 className="door-title">La puerta que escucha al territorio</h1>
      <p className="door-concept">
        Una comunidad cuenta lo que necesita; la Universidad Nacional del Centro del Perú la escucha y le da seguimiento. Sin viajar, sin burocracia.
      </p>

      <div className="door-cards">
        <Link href="/comunidad" className="door-card citizen">
          <span className="door-ico"><CatGlyph id="cultura" size={32} /></span>
          <span className="door-txt">
            <strong>Soy líder de comunidad</strong>
            <span>Cuéntanos qué pasa en tu comunidad y recibe un código para seguir tu caso.</span>
          </span>
          <span className="door-arrow"><I.arrowR s={20} /></span>
        </Link>

        <Link href="/panel" className="door-card panel">
          <span className="door-ico"><I.filter s={26} /></span>
          <span className="door-txt">
            <strong>Soy de la UNCP</strong>
            <span>Bandeja territorial: ver, clasificar y dar seguimiento a las solicitudes.</span>
          </span>
          <span className="door-arrow"><I.arrowR s={20} /></span>
        </Link>
      </div>

      <p className="door-foot">
        Prototipo de hackatón · Desafío 3 — UNCP · Datos 100% ficticios (declaración jurada).
        La trazabilidad es la misma para ambas caras: comparten el mismo expediente.
      </p>
    </main>
  );
}
