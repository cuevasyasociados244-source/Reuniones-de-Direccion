import { notFound } from "next/navigation";
import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import BotonReportePdf from "@/components/BotonReportePdf";
import { LOGO_PIONEROS } from "@/lib/logoPioneros";

const ESTADO_TEMA: Record<string, string> = { NO_INICIADO: "No iniciado", PROGRESO: "En progreso", COMPLETADO: "Completado" };
const ESTADO_COMP: Record<string, string> = { NO_INICIADO: "No iniciado", PROGRESO: "En progreso", COMPLETADO: "Completado", VENCIDO: "Vencido" };
const TIPO: Record<string, string> = { ORDINARIA: "Ordinaria", EXTRAORDINARIA: "Extraordinaria" };
const FREQ: Record<string, string> = { SEMANAL: "Semanal", MENSUAL: "Mensual", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual" };

export default async function ReunionPdfPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGlobal();
  const { id } = await params;
  const meetingId = Number(id);
  if (isNaN(meetingId)) notFound();

  const r = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      agenda: { orderBy: { orden: "asc" } },
      asistentes: { select: { nombre: true, puesto: true }, orderBy: { nombre: "asc" } },
      compromisos: { include: { responsable: true }, orderBy: { vence: "asc" } },
    },
  });
  if (!r) notFound();

  const completados = r.agenda.filter((a) => a.estado === "COMPLETADO").length;
  const pctAgenda = r.agenda.length ? Math.round((completados / r.agenda.length) * 100) : 0;

  const nombreArchivo = `Reunion-${fechaCorta(r.fecha)}-${r.titulo}`
    .replace(/[^\p{L}\p{N}\- ]/gu, "")
    .replace(/\s+/g, "-")
    .slice(0, 80);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white p-4 print:p-0">
      <BotonReportePdf nodeId="reporte-reunion" filename={nombreArchivo} />

      <div id="reporte-reunion" className="mx-auto max-w-4xl bg-white shadow print:shadow-none flex overflow-hidden rounded-xl print:rounded-none" style={{ minHeight: "60vh" }}>
        {/* Barra lateral oscura */}
        <aside className="w-64 shrink-0 bg-brand-sidebar text-white p-6" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
          <div className="mb-4 inline-block rounded-lg bg-white p-2" style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_PIONEROS} alt="Cremería Los Pioneros" style={{ width: 150, height: "auto", display: "block" }} />
          </div>
          <h1 className="text-lg font-bold leading-snug">{r.titulo}</h1>

          <dl className="mt-6 space-y-3 text-sm">
            <Dato label="Fecha" valor={fechaCorta(r.fecha)} />
            {r.hora && <Dato label="Hora" valor={r.hora} />}
            {r.lugar && <Dato label="Lugar" valor={r.lugar} />}
            <Dato label="Tipo" valor={TIPO[r.tipo] ?? r.tipo} />
            <Dato label="Frecuencia" valor={FREQ[r.frecuencia] ?? r.frecuencia} />
            <Dato label="Agenda completada" valor={`${pctAgenda}%`} />
          </dl>

          <div className="mt-6">
            <div className="text-[11px] uppercase tracking-wide text-white/60 mb-2">Asistentes ({r.asistentes.length})</div>
            <ul className="space-y-2">
              {r.asistentes.map((a, i) => (
                <li key={i} className="text-sm leading-tight">
                  <div className="font-semibold">{a.nombre}</div>
                  <div className="text-[11px] text-white/60">{a.puesto}</div>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Columna principal */}
        <main className="flex-1 p-8 text-gray-800 min-w-0">
          {r.objetivo && (
            <Seccion titulo="Objetivo">
              <p className="text-sm text-gray-600">{r.objetivo}</p>
            </Seccion>
          )}

          <Seccion titulo="Agenda">
            <ul className="space-y-1.5">
              {r.agenda.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-3 text-sm">
                  <span>{a.titulo}{a.duracion > 0 ? <span className="text-gray-400"> · {a.duracion} min</span> : null}</span>
                  <span className="text-xs text-gray-500 shrink-0">{ESTADO_TEMA[a.estado] ?? a.estado}</span>
                </li>
              ))}
              {r.agenda.length === 0 && <li className="text-sm text-gray-400">Sin temas.</li>}
            </ul>
          </Seccion>

          <Seccion titulo={`Compromisos generados (${r.compromisos.length})`}>
            {r.compromisos.length === 0 ? (
              <p className="text-sm text-gray-400">No se generaron compromisos.</p>
            ) : (
              <ul className="space-y-2">
                {r.compromisos.map((c) => (
                  <li key={c.id} className="text-sm">
                    <div className="font-medium">{c.titulo}</div>
                    <div className="text-xs text-gray-500">
                      {c.responsable?.nombre ?? "—"} · vence {fechaCorta(c.vence)} · {ESTADO_COMP[c.estado] ?? c.estado}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          <Seccion titulo="Notas de la reunión">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.notas || "—"}</p>
          </Seccion>

          <Seccion titulo="Riesgos y problemas">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.riesgos || "—"}</p>
          </Seccion>
        </main>
      </div>
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-white/50">{label}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-bold text-gray-900 border-b border-gray-200 pb-1 mb-3">{titulo}</h2>
      {children}
    </section>
  );
}
