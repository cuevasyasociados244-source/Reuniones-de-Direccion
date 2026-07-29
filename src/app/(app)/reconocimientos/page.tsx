import Placeholder from "@/components/Placeholder";
import { requireSession } from "@/lib/session";

export default async function ReconocimientosPage() {
  await requireSession();
  return (
    <Placeholder
      titulo="Reconocimientos"
      descripcion="Muro de reconocimientos del equipo."
      fase="Fase 7 (posterior a la v1)"
    />
  );
}
