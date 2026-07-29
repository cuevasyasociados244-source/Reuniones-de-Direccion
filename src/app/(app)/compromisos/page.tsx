import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { whereCompromisosPorScope } from "@/lib/scope";
import { fechaCorta } from "@/lib/formato";
import CompromisosCliente, { type CompromisoVM } from "./CompromisosCliente";

export default async function CompromisosPage() {
  const user = await requireSession();
  const esGlobal = user.scope === "global";

  // Tablero (solo global) ve todos; los demás solo trabajan en "Mis compromisos".
  const [todosRaw, miosRaw, personas, departamentos] = await Promise.all([
    esGlobal
      ? prisma.commitment.findMany({
          where: whereCompromisosPorScope(user),
          include: { responsable: true },
          orderBy: { vence: "asc" },
        })
      : Promise.resolve([]),
    prisma.commitment.findMany({
      where: { responsableId: user.id },
      include: { responsable: true },
      orderBy: { vence: "asc" },
    }),
    esGlobal
      ? prisma.user.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } })
      : Promise.resolve([]),
    esGlobal
      ? prisma.department.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { nombre: true } })
      : Promise.resolve([]),
  ]);

  const map = (c: {
    id: number; titulo: string; descripcion: string; area: string;
    responsableId: string; responsable: { nombre: string }; vence: Date;
    avance: number; estado: string; indicador: string; prioridad: string;
  }): CompromisoVM => ({
    id: c.id,
    titulo: c.titulo,
    descripcion: c.descripcion,
    area: c.area,
    responsableId: c.responsableId,
    responsableNombre: c.responsable?.nombre ?? "—",
    vence: fechaCorta(c.vence),
    avance: c.avance,
    estado: c.estado as CompromisoVM["estado"],
    indicador: c.indicador,
    prioridad: c.prioridad as CompromisoVM["prioridad"],
  });

  return (
    <CompromisosCliente
      esGlobal={esGlobal}
      currentUserId={user.id}
      todos={todosRaw.map(map)}
      mios={miosRaw.map(map)}
      personas={personas}
      departamentos={departamentos.map((d) => d.nombre)}
    />
  );
}
