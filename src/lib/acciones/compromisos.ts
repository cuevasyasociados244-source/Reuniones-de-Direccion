"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession, requireGlobal } from "@/lib/session";
import { Priority, CommitmentResult, type CommitmentStatus } from "@prisma/client";
import { scopeOf } from "@/lib/scope";

export type CompromisoState = { error?: string; ok?: string };

const AVANCES_VALIDOS = [25, 50, 75, 100];

// Captura manual del avance. Reglas de negocio (§6):
//  - Solo el responsable del compromiso.
//  - Solo valores fijos 25/50/75/100.
//  - Un compromiso "vencido" no admite captura.
//  - Al primer avance > 0, "no-iniciado" pasa automáticamente a "progreso".
//  - NO se auto-completa al 100% (el estado "completado" se fija al registrar resultado).
export async function capturarAvance(
  id: number,
  avance: number
): Promise<CompromisoState> {
  const user = await requireSession();

  if (!AVANCES_VALIDOS.includes(avance)) {
    return { error: "Valor de avance no permitido." };
  }

  const c = await prisma.commitment.findUnique({ where: { id } });
  if (!c) return { error: "Compromiso no encontrado." };
  // La Dirección (alcance global) puede capturar el avance de cualquier compromiso;
  // los demás solo el de los que son responsables.
  if (c.responsableId !== user.id && user.scope !== "global") {
    return { error: "Solo la Dirección o el responsable puede capturar el avance." };
  }
  if (c.estado === "VENCIDO") {
    return { error: "Un compromiso vencido no admite captura de avance." };
  }

  const nuevoEstado =
    c.estado === "NO_INICIADO" && avance > 0 ? "PROGRESO" : c.estado;

  await prisma.commitment.update({
    where: { id },
    data: { avance, estado: nuevoEstado },
  });

  revalidatePath("/compromisos");
  revalidatePath("/");
  revalidatePath("/avance");
  return { ok: "Avance actualizado." };
}

// Registrar resultado de un compromiso (pilar Consecuencias).
// Permitido a quien puede VER el compromiso dentro de su alcance:
//  - global: cualquier compromiso; área: los de su área o asignados a él; propio: los suyos.
// Efectos:
//  - "SI"  → estado COMPLETADO, avance 100.
//  - "PARCIALMENTE"/"NO" con nueva fecha → se reprograma (vence = nueva fecha, vuelve a progreso/no-iniciado).
//  - "PARCIALMENTE"/"NO" sin nueva fecha → conserva el estado (p. ej. sigue vencido).
export async function registrarResultado(
  id: number,
  datos: {
    resultado: "SI" | "PARCIALMENTE" | "NO";
    causa: string;
    accionCorrectiva: string;
    nuevaFecha?: string;
  }
): Promise<CompromisoState> {
  const user = await requireSession();

  if (!(["SI", "PARCIALMENTE", "NO"] as const).includes(datos.resultado)) {
    return { error: "Resultado inválido." };
  }

  const c = await prisma.commitment.findUnique({ where: { id } });
  if (!c) return { error: "Compromiso no encontrado." };

  // ¿Está dentro del alcance del usuario?
  const scope = scopeOf(user);
  const puedeVer =
    scope === "global" ||
    (scope === "area" && (c.area === user.area || c.responsableId === user.id)) ||
    (scope === "propio" && c.responsableId === user.id);
  if (!puedeVer) {
    return { error: "No tienes permiso sobre este compromiso." };
  }

  const nuevaFecha =
    datos.nuevaFecha && datos.nuevaFecha.trim()
      ? new Date(datos.nuevaFecha + "T00:00:00Z")
      : null;
  if (nuevaFecha && isNaN(nuevaFecha.getTime())) {
    return { error: "Nueva fecha inválida." };
  }

  const data: {
    resultado: CommitmentResult;
    causa: string;
    accionCorrectiva: string;
    nuevaFecha: Date | null;
    estado?: CommitmentStatus;
    avance?: number;
    vence?: Date;
    completadoEn?: Date | null;
  } = {
    resultado: datos.resultado as CommitmentResult,
    causa: datos.causa.trim(),
    accionCorrectiva: datos.accionCorrectiva.trim(),
    nuevaFecha,
  };

  if (datos.resultado === "SI") {
    data.estado = "COMPLETADO";
    data.avance = 100;
    data.completadoEn = new Date();
  } else if (nuevaFecha) {
    data.vence = nuevaFecha;
    data.estado = c.avance > 0 ? "PROGRESO" : "NO_INICIADO";
  }

  await prisma.commitment.update({ where: { id }, data });

  revalidatePath("/compromisos");
  revalidatePath("/");
  revalidatePath("/avance");
  return { ok: "Resultado registrado." };
}

// Crear compromiso — solo alcance global (§3).
export async function crearCompromiso(
  _prev: CompromisoState,
  formData: FormData
): Promise<CompromisoState> {
  await requireGlobal();

  const titulo = String(formData.get("titulo") || "").trim();
  const descripcion = String(formData.get("descripcion") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const responsableId = String(formData.get("responsableId") || "");
  const venceRaw = String(formData.get("vence") || "");
  const indicador = String(formData.get("indicador") || "").trim();
  const prioridadRaw = String(formData.get("prioridad") || "MEDIA");

  if (!titulo || !area || !responsableId || !venceRaw) {
    return { error: "Título, área, responsable y fecha de vencimiento son obligatorios." };
  }

  const vence = new Date(venceRaw + "T00:00:00Z");
  if (isNaN(vence.getTime())) {
    return { error: "Fecha de vencimiento inválida." };
  }

  const prioridad = (["ALTA", "MEDIA", "BAJA"] as const).includes(
    prioridadRaw as Priority
  )
    ? (prioridadRaw as Priority)
    : Priority.MEDIA;

  const responsable = await prisma.user.findUnique({ where: { id: responsableId } });
  if (!responsable || !responsable.activo) {
    return { error: "El responsable no es válido." };
  }

  await prisma.commitment.create({
    data: {
      titulo,
      descripcion,
      area,
      responsableId,
      vence,
      indicador,
      prioridad,
      avance: 0,
      estado: "NO_INICIADO",
    },
  });

  revalidatePath("/compromisos");
  revalidatePath("/");
  return { ok: `Compromiso "${titulo}" creado.` };
}
