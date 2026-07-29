import Placeholder from "@/components/Placeholder";
import { requireSession } from "@/lib/session";

export default async function DocumentosPage() {
  await requireSession();
  return (
    <Placeholder
      titulo="Documentos"
      descripcion="Repositorio de documentos."
      fase="Fase 7 (posterior a la v1)"
    />
  );
}
