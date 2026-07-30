"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { subirArchivo, borrarArchivo } from "@/lib/blob";

export type DocState = { error?: string; ok?: string };

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function subirDocumento(_prev: DocState, formData: FormData): Promise<DocState> {
  const user = await requireSession();

  const file = formData.get("archivo") as File | null;
  const nombre = String(formData.get("nombre") || "").trim();
  const area = String(formData.get("area") || "").trim();

  if (!file || file.size === 0) return { error: "Selecciona un archivo." };
  if (file.size > MAX_BYTES) return { error: "El archivo supera el límite de 15 MB." };

  const { url, pathname, contentType } = await subirArchivo("documentos", file);

  await prisma.documento.create({
    data: {
      nombre: nombre || file.name,
      url,
      pathname,
      contentType: contentType || file.type || "",
      tamano: file.size,
      area,
      subidoPorId: user.id,
    },
  });

  revalidatePath("/documentos");
  return { ok: "Documento subido." };
}

export async function eliminarDocumento(id: string): Promise<DocState> {
  const user = await requireSession();
  const doc = await prisma.documento.findUnique({ where: { id } });
  if (!doc) return { error: "Documento no encontrado." };
  // Solo el que lo subió o el Director General (global) puede eliminar.
  if (user.scope !== "global" && doc.subidoPorId !== user.id) {
    return { error: "No tienes permiso para eliminar este documento." };
  }

  await borrarArchivo(doc.url);
  await prisma.documento.delete({ where: { id } });
  revalidatePath("/documentos");
  return { ok: "Documento eliminado." };
}
