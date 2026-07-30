import Link from "next/link";
import { notFound } from "next/navigation";
import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import ReunionDetalle, { type ReunionVM } from "./ReunionDetalle";

export default async function ReunionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireGlobal();
  const { id } = await params;
  const meetingId = Number(id);
  if (isNaN(meetingId)) notFound();

  const [reunion, personas, departamentos] = await Promise.all([
    prisma.meeting.findUnique({
      where: { id: meetingId },
      include: {
        agenda: { orderBy: { orden: "asc" } },
        asistentes: { select: { id: true } },
        compromisos: { include: { responsable: true }, orderBy: { vence: "asc" } },
        imagenes: { orderBy: { createdAt: "asc" } },
        _count: { select: { minutas: true } },
      },
    }),
    prisma.user.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true, puesto: true } }),
    prisma.department.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { nombre: true } }),
  ]);

  if (!reunion) notFound();

  const vm: ReunionVM = {
    id: reunion.id,
    titulo: reunion.titulo,
    fecha: fechaCorta(reunion.fecha),
    hora: reunion.hora,
    lugar: reunion.lugar,
    tipo: reunion.tipo,
    frecuencia: reunion.frecuencia,
    estado: reunion.estado,
    objetivo: reunion.objetivo,
    notas: reunion.notas,
    riesgos: reunion.riesgos,
    minutasCount: reunion._count.minutas,
    agenda: reunion.agenda.map((a) => ({
      id: a.id,
      titulo: a.titulo,
      descripcion: a.descripcion,
      duracion: a.duracion,
      estado: a.estado,
    })),
    asistentesIds: reunion.asistentes.map((a) => a.id),
    imagenes: reunion.imagenes.map((i) => ({ id: i.id, url: i.url })),
    compromisos: reunion.compromisos.map((c) => ({
      id: c.id,
      titulo: c.titulo,
      responsableNombre: c.responsable?.nombre ?? "—",
      vence: fechaCorta(c.vence),
      estado: c.estado,
    })),
  };

  return (
    <div>
      <Link href="/reuniones" className="text-xs text-gray-400 hover:text-gray-700">← Reuniones</Link>
      <ReunionDetalle reunion={vm} personas={personas} departamentos={departamentos.map((d) => d.nombre)} />
    </div>
  );
}
