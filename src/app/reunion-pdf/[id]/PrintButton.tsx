"use client";

export default function PrintButton() {
  return (
    <div className="print:hidden fixed top-4 right-4 flex gap-2">
      <button
        onClick={() => window.print()}
        className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark shadow"
      >
        Descargar / Imprimir PDF
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
