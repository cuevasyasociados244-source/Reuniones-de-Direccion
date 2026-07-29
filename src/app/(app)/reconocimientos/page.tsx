import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { fechaCorta } from "@/lib/formato";
import ReconocimientosCliente, { type PostVM } from "./ReconocimientosCliente";

export default async function ReconocimientosPage() {
  const user = await requireSession();

  const reconocimientos = await prisma.recognition.findMany({
    include: {
      autor: { select: { nombre: true, iniciales: true } },
      likes: { select: { userId: true } },
      comentarios: {
        include: { autor: { select: { nombre: true, iniciales: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { fecha: "desc" },
  });

  const posts: PostVM[] = reconocimientos.map((r) => ({
    id: r.id,
    autorNombre: r.autor?.nombre ?? "—",
    autorIniciales: r.autor?.iniciales ?? "?",
    mensaje: r.mensaje,
    fecha: fechaCorta(r.fecha),
    likesCount: r.likes.length,
    liked: r.likes.some((l) => l.userId === user.id),
    comentarios: r.comentarios.map((c) => ({
      id: c.id,
      autorNombre: c.autor?.nombre ?? "—",
      autorIniciales: c.autor?.iniciales ?? "?",
      texto: c.texto,
    })),
  }));

  const recientes = reconocimientos.slice(0, 5).map((r) => ({
    id: r.id,
    autorNombre: r.autor?.nombre ?? "—",
    mensaje: r.mensaje,
    fecha: fechaCorta(r.fecha),
  }));

  return <ReconocimientosCliente posts={posts} recientes={recientes} />;
}
