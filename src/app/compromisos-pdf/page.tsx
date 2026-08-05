import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import BotonReportePdf from "@/components/BotonReportePdf";
import { LOGO_PIONEROS } from "@/lib/logoPioneros";

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

  // Agrupar por responsable (lista ya viene ordenada por estado/vence dentro de cada grupo).
  const grupos = new Map<string, typeof lista>();
  for (const c of lista) {
    const nombre = c.responsable?.nombre ?? "Sin responsable";
    if (!grupos.has(nombre)) grupos.set(nombre, []);
    grupos.get(nombre)!.push(c);
  }
  const gruposOrdenados = [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], "es"));

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
          <div className="mb-3 inline-block rounded-lg bg-white p-2" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PIONEROS} alt="Cremería Los Pioneros" style={{ width: 160, height: "auto", display: "block" }} />
          </div>
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

        {/* Secciones por responsable */}
        <div className="px-8 py-5 space-y-6">
          {lista.length === 0 ? (
            <p className="text-sm text-gray-400">No hay compromisos registrados.</p>
          ) : (
            gruposOrdenados.map(([nombre, items]) => {
              const prom = Math.round(items.reduce((s, c) => s + c.avance, 0) / items.length);
              return (
                <section key={nombre} style={{ pageBreakInside: "avoid" }}>
                  {/* Encabezado del responsable */}
                  <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-1.5 mb-2">
                    <h2 className="text-sm font-bold text-gray-900">{nombre}</h2>
                    <span className="text-[10px] font-bold text-white rounded-full px-2 py-0.5" style={{ background: "#2c1c72", printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
                      {items.length}
                    </span>
                    <span className="text-[11px] text-gray-400 ml-auto">Avance prom. {prom}%</span>
                  </div>

                  <div className="space-y-2.5">
                    {items.map((c) => {
                      const e = ESTADO[c.estado] ?? ESTADO.NO_INICIADO;
                      const p = PRIORIDAD[c.prioridad] ?? PRIORIDAD.MEDIA;
                      return (
                        <div key={c.id} className="border border-gray-100 rounded-lg px-3 py-2.5" style={{ pageBreakInside: "avoid" }}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-900 leading-snug">{c.titulo}</div>
                              {c.descripcion && <p className="text-xs text-gray-600 mt-1 leading-snug">{c.descripcion}</p>}
                            </div>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
                              style={{ background: e.bg, color: e.color, printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
                            >
                              {e.txt}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-gray-500 mt-1.5">
                            <span>{c.area || "Sin área"}</span>
                            <span>·</span>
                            <span>vence {fechaCorta(c.vence)}</span>
                            <span>·</span>
                            <span>prioridad <span style={{ color: p.color, fontWeight: 600 }}>{p.txt}</span></span>
                            {c.indicador && <><span>·</span><span>{c.indicador}</span></>}
                            <span className="ml-auto font-bold text-gray-700">{c.avance}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })
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
