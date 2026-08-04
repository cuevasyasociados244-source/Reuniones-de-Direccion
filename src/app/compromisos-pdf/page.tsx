import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import BotonReportePdf from "@/components/BotonReportePdf";

const ESTADO: Record<string, { txt: string; bg: string; color: string }> = {
  NO_INICIADO: { txt: "No iniciado", bg: "#f1f5f9", color: "#64748b" },
  PROGRESO: { txt: "En progreso", bg: "#e6edfd", color: "#2563eb" },
  COMPLETADO: { txt: "Completado", bg: "#e7f6ec", color: "#16a34a" },
  VENCIDO: { txt: "Vencido", bg: "#fde9e9", color: "#dc2626" },
};
const PRIORIDAD: Record<string, { txt: string; color: string }> = {
  ALTA: { txt: "Alta", color: "#dc2626" },
  MEDIA: { txt: "Media", color: "#d97706" },
  BAJA: { txt: "Baja", color: "#16a34a" },
};
// Orden de presentación: primero lo que requiere atención.
const ORDEN: Record<string, number> = { VENCIDO: 0, PROGRESO: 1, NO_INICIADO: 2, COMPLETADO: 3 };

export default async function CompromisosPdfPage() {
  await requireGlobal();

  const compromisos = await prisma.commitment.findMany({
    include: { responsable: true },
    orderBy: { vence: "asc" },
  });

  const lista = [...compromisos].sort(
    (a, b) => (ORDEN[a.estado] ?? 9) - (ORDEN[b.estado] ?? 9) || a.vence.getTime() - b.vence.getTime()
  );

  const total = lista.length;
  const cuenta = (e: string) => lista.filter((c) => c.estado === e).length;
  const avancePromedio = total ? Math.round(lista.reduce((s, c) => s + c.avance, 0) / total) : 0;

  const hoy = new Date();
  const generado = fechaCorta(hoy);

  const nombreArchivo = `Tablero-Maestro-Compromisos-${generado}`
    .replace(/[^\p{L}\p{N}\- ]/gu, "")
    .replace(/\s+/g, "-");

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-4 print:p-0">
      <BotonReportePdf nodeId="reporte-tablero" filename={nombreArchivo} />

      <div id="reporte-tablero" className="mx-auto max-w-5xl bg-white shadow print:shadow-none rounded-xl print:rounded-none overflow-hidden">
        {/* Encabezado */}
        <div
          className="px-8 py-6 text-white"
          style={{
            backgroundImage: "linear-gradient(160deg, #0d0e2b 0%, #2c1c72 45%, #6d3ff0 100%)",
            printColorAdjust: "exact",
            WebkitPrintColorAdjust: "exact",
          }}
        >
          <div className="text-[11px] uppercase tracking-wide text-white/60 mb-1">Integra One RCA</div>
          <h1 className="text-2xl font-bold">Tablero Maestro de Compromisos</h1>
          <p className="text-sm text-white/70 mt-1">Generado el {generado} · {total} compromisos en total</p>
        </div>

        {/* Resumen */}
        <div className="px-8 py-5 grid grid-cols-2 sm:grid-cols-5 gap-3 border-b border-gray-100">
          <Resumen etiqueta="Total" valor={total} color="#0f172a" />
          <Resumen etiqueta="En progreso" valor={cuenta("PROGRESO")} color="#2563eb" />
          <Resumen etiqueta="No iniciados" valor={cuenta("NO_INICIADO")} color="#64748b" />
          <Resumen etiqueta="Vencidos" valor={cuenta("VENCIDO")} color="#dc2626" />
          <Resumen etiqueta="Avance prom." valor={`${avancePromedio}%`} color="#16a34a" />
        </div>

        {/* Tabla */}
        <div className="px-8 py-5">
          {lista.length === 0 ? (
            <p className="text-sm text-gray-400">No hay compromisos registrados.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  <th className="py-2 pr-2 w-6">#</th>
                  <th className="py-2 pr-3">Compromiso</th>
                  <th className="py-2 pr-3">Responsable</th>
                  <th className="py-2 pr-3">Área</th>
                  <th className="py-2 pr-3">Prioridad</th>
                  <th className="py-2 pr-3">Vence</th>
                  <th className="py-2 pr-3">Estado</th>
                  <th className="py-2 pr-2 text-right">Avance</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((c, i) => {
                  const e = ESTADO[c.estado] ?? ESTADO.NO_INICIADO;
                  const p = PRIORIDAD[c.prioridad] ?? PRIORIDAD.MEDIA;
                  return (
                    <tr key={c.id} className="border-b border-gray-100 align-top" style={{ pageBreakInside: "avoid" }}>
                      <td className="py-2.5 pr-2 text-xs text-gray-400">{i + 1}</td>
                      <td className="py-2.5 pr-3">
                        <div className="text-sm font-medium text-gray-900 leading-snug">{c.titulo}</div>
                        {c.indicador && <div className="text-[11px] text-gray-400 mt-0.5">{c.indicador}</div>}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600">{c.responsable?.nombre ?? "—"}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600">{c.area || "—"}</td>
                      <td className="py-2.5 pr-3 text-xs font-semibold" style={{ color: p.color }}>{p.txt}</td>
                      <td className="py-2.5 pr-3 text-xs text-gray-600 whitespace-nowrap">{fechaCorta(c.vence)}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                          style={{ background: e.bg, color: e.color, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
                        >
                          {e.txt}
                        </span>
                      </td>
                      <td className="py-2.5 pr-2 text-right text-xs font-bold text-gray-700">{c.avance}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Resumen({ etiqueta, valor, color }: { etiqueta: string; valor: number | string; color: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
      <div className="text-[10px] uppercase tracking-wide text-gray-400">{etiqueta}</div>
      <div className="text-xl font-extrabold" style={{ color }}>{valor}</div>
    </div>
  );
}
