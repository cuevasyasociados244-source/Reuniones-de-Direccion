import Link from "next/link";
import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import ReunionesCliente from "./ReunionesCliente";

export default async function ReunionesPage() {
  await requireGlobal();

  const [reuniones, templates, minutas] = await Promise.all([
    prisma.meeting.findMany({
      include: { _count: { select: { agenda: true, asistentes: true, compromisos: true } } },
      orderBy: { fecha: "desc" },
    }),
    prisma.agendaTemplateItem.findMany({ orderBy: { orden: "asc" } }),
    prisma.minute.findMany({ include: { meeting: { select: { titulo: true } } }, orderBy: { createdAt: "desc" } }),
  ]);

  const proximas = reuniones
    .filter((r) => r.estado !== "REALIZADA")
    .map((r) => ({ id: r.id, titulo: r.titulo, fecha: fechaCorta(r.fecha), hora: r.hora, agendaCount: r._count.agenda, asistentesCount: r._count.asistentes, estado: r.estado }));

  const historial = reuniones
    .filter((r) => r.estado === "REALIZADA")
    .map((r) => ({ id: r.id, titulo: r.titulo, fecha: fechaCorta(r.fecha), compromisosCount: r._count.compromisos, asistentesCount: r._count.asistentes }));

  const templatesVM = templates.map((t) => ({ id: t.id, titulo: t.titulo, frecuencia: t.frecuencia }));
  const minutasVM = minutas.map((m) => ({ id: m.id, meetingTitulo: m.meeting.titulo, fecha: fechaCorta(m.createdAt), notas: m.notas, riesgos: m.riesgos }));

  return (
    <div>
      <header className="mb-6 flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Reuniones de Dirección</h1>
          <p className="text-sm text-gray-500">Agenda, minutas y compromisos de las reuniones directivas.</p>
        </div>
        <Link href="/reuniones/nueva" className="rounded-lg bg-info px-4 py-2 text-sm font-semibold text-white hover:bg-info-dark transition">
          + Nueva reunión
        </Link>
      </header>

      <ReunionesCliente proximas={proximas} historial={historial} templates={templatesVM} minutas={minutasVM} />
    </div>
  );
}
