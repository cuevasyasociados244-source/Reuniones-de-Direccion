import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import DocumentosCliente, { type DocVM } from "./DocumentosCliente";

function tamano(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DocumentosPage() {
  const user = await requireSession();

  const [documentosRaw, departamentos] = await Promise.all([
    prisma.documento.findMany({ include: { subidoPor: { select: { nombre: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.department.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { nombre: true } }),
  ]);

  const documentos: DocVM[] = documentosRaw.map((d) => ({
    id: d.id,
    nombre: d.nombre,
    area: d.area,
    tamanoTxt: tamano(d.tamano),
    subidoPorNombre: d.subidoPor?.nombre ?? "—",
    fecha: fechaCorta(d.createdAt),
    url: d.url,
    esMio: user.scope === "global" || d.subidoPorId === user.id,
  }));

  return <DocumentosCliente documentos={documentos} departamentos={departamentos.map((d) => d.nombre)} />;
}
