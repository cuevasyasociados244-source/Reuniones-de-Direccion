import Link from "next/link";
import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NuevaReunionForm from "./NuevaReunionForm";

export default async function NuevaReunionPage() {
  await requireGlobal();

  const personas = await prisma.user.findMany({
    where: { activo: true },
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, puesto: true },
  });

  return (
    <div>
      <header className="mb-6">
        <Link href="/reuniones" className="text-xs text-gray-400 hover:text-gray-700">← Reuniones</Link>
        <h1 className="text-xl font-bold text-gray-900 mt-1">Nueva reunión</h1>
        <p className="text-sm text-gray-500">Planea la reunión: información, agenda y asistentes.</p>
      </header>
      <NuevaReunionForm personas={personas} />
    </div>
  );
}
