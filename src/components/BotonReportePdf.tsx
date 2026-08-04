"use client";

import { useState } from "react";
import { descargarNodoComoPdf } from "@/lib/pdf";

// Botón flotante para reportes imprimibles: descarga directa en PDF (1 clic),
// más opciones de Imprimir y Cerrar. Se oculta al imprimir.
export default function BotonReportePdf({ nodeId, filename }: { nodeId: string; filename: string }) {
  const [generando, setGenerando] = useState(false);

  async function descargar() {
    const node = document.getElementById(nodeId);
    if (!node) return;
    setGenerando(true);
    try {
      await descargarNodoComoPdf(node, filename);
    } catch (e) {
      console.error(e);
      alert("No se pudo generar el PDF. Intenta de nuevo o usa Imprimir.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="print:hidden fixed top-4 right-4 z-30 flex gap-2">
      <button
        onClick={descargar}
        disabled={generando}
        className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark shadow disabled:opacity-60"
      >
        {generando ? "Generando PDF…" : "Descargar PDF"}
      </button>
      <button
        onClick={() => window.print()}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow"
      >
        Imprimir
      </button>
      <button
        onClick={() => window.close()}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow"
      >
        Cerrar
      </button>
    </div>
  );
}
