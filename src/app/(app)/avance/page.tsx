import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { whereCompromisosPorScope } from "@/lib/scope";
import { fechaCorta } from "@/lib/formato";
import AvanceCliente, { type AvanceVM, type PersonaMin } from "./AvanceCliente";

export default async function AvancePage() {
  const user = await requireSession();
  const esGlobal = user.scope === "global";

  const compromisosRaw = await prisma.commitment.findMany({
    where: whereCompromisosPorScope(user),
    include: { responsable: true },
    orderBy: { vence: "asc" },
  });

  const compromisos: AvanceVM[] = compromisosRaw.map((c) => ({
    id: c.id,
    titulo: c.titulo,
    responsableId: c.responsableId,
    responsableNombre: c.responsable?.nombre ?? "—",
    vence: fechaCorta(c.vence),
    avance: c.avance,
    estado: c.estado as AvanceVM["estado"],
  }));

  // Candidatos del filtro: responsables presentes en el alcance (solo si hay más de uno).
  const map = new Map<string, PersonaMin>();
  for (const c of compromisosRaw) {
    if (c.responsable) map.set(c.responsable.id, { id: c.responsable.id, nombre: c.responsable.nombre });
  }
  const candidatos = map.size > 1 ? [...map.values()].sort((a, b) => a.nombre.localeCompare(b.nombre)) : [];

  return <AvanceCliente esGlobal={esGlobal} compromisos={compromisos} candidatos={candidatos} />;
}
