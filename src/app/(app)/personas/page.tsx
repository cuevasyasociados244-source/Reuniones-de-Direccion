import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import PersonasCliente, { type PersonaVM } from "./PersonasCliente";

export default async function PersonasPage() {
  const yo = await requireGlobal(); // exclusivo del Director General (alcance global)

  const [usuarios, departamentos] = await Promise.all([
    prisma.user.findMany({ orderBy: [{ activo: "desc" }, { nombre: "asc" }] }),
    prisma.department.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
  ]);

  const map = (u: (typeof usuarios)[number]): PersonaVM => ({
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    puesto: u.puesto,
    area: u.area,
    iniciales: u.iniciales,
    fotoUrl: u.fotoUrl,
    activo: u.activo,
  });

  const activos = usuarios.filter((u) => u.activo).map(map);
  const inactivos = usuarios.filter((u) => !u.activo).map(map);

  return (
    <PersonasCliente
      activos={activos}
      inactivos={inactivos}
      departamentos={departamentos.map((d) => d.nombre)}
      currentUserId={yo.id}
    />
  );
}
