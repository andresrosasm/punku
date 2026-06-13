import type { Metadata, Viewport } from "next";
import { Sora, Inter } from "next/font/google";
import "./globals.css";

// Sora: titulares, números, etiquetas, botones. Inter: cuerpo. (README §5)
const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PUNKU — la puerta que escucha al territorio",
  description:
    "Plataforma ciudadana para que comunidades de Huancayo planteen necesidades a la UNCP, sin viajar ni entender la burocracia. Desafío 3 — Hackatón GovTech 2026.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2E6B4E",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sora.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
