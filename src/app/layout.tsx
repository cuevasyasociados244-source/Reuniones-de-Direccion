import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Integra One RCA",
  description:
    "Rendición de Cuentas Aplicada — compromisos, indicadores y reuniones de dirección.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
