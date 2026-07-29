"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export type ReconoceState = { error?: string; ok?: string };

// Publicar un reconocimiento en el muro. Cualquier usuario autenticado puede publicar.
export async function publicarReconocimiento(
  mensaje: string,
  tipo: string = "reconocimiento"
): Promise<ReconoceState> {
  const user = await requireSession();
  const texto = mensaje.trim();
  if (!texto) return { error: "Escribe el reconocimiento." };

  await prisma.recognition.create({
    data: { autorId: user.id, mensaje: texto, tipo, fecha: new Date() },
  });
  revalidatePath("/reconocimientos");
  revalidatePath("/");
  return { ok: "Reconocimiento publicado." };
}

// Alternar "me gusta" (dar / quitar).
export async function toggleLike(recognitionId: string): Promise<ReconoceState> {
  const user = await requireSession();
  const existe = await prisma.recognitionLike.findUnique({
    where: { recognitionId_userId: { recognitionId, userId: user.id } },
  });
  if (existe) {
    await prisma.recognitionLike.delete({ where: { id: existe.id } });
  } else {
    await prisma.recognitionLike.create({ data: { recognitionId, userId: user.id } });
  }
  revalidatePath("/reconocimientos");
  return { ok: "ok" };
}

// Comentar un reconocimiento.
export async function comentar(recognitionId: string, texto: string): Promise<ReconoceState> {
  const user = await requireSession();
  const t = texto.trim();
  if (!t) return { error: "Escribe un comentario." };

  await prisma.recognitionComment.create({
    data: { recognitionId, autorId: user.id, texto: t },
  });
  revalidatePath("/reconocimientos");
  return { ok: "Comentario publicado." };
}
