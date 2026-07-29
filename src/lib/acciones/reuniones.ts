"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireGlobal } from "@/lib/session";
import {
  MeetingType,
  MeetingStatus,
  Frequency,
  AgendaItemStatus,
  Priority,
} from "@prisma/client";

export type ReunionState = { error?: string; ok?: string; id?: number };

function enumOr<T extends Record<string, string>>(e: T, v: string, def: T[keyof T]): T[keyof T] {
  return (Object.values(e) as string[]).includes(v) ? (v as T[keyof T]) : def;
}

// Crear una reunión real (con agenda y asistentes). Solo alcance global.
export async function crearReunion(data: {
  titulo: string;
  fecha: string;
  hora: string;
  lugar: string;
  tipo: string;
  frecuencia: string;
  objetivo: string;
  agenda: { titulo: string; descripcion: string; duracion: number }[];
  asistentes: string[];
}): Promise<ReunionState> {
  await requireGlobal();

  const titulo = data.titulo.trim();
  if (!titulo || !data.fecha) {
    return { error: "El título y la fecha son obligatorios." };
  }
  const fecha = new Date(data.fecha + "T00:00:00Z");
  if (isNaN(fecha.getTime())) return { error: "Fecha inválida." };

  const agenda = data.agenda.filter((a) => a.titulo.trim());

  const reunion = await prisma.meeting.create({
    data: {
      titulo,
      fecha,
      hora: data.hora.trim(),
      lugar: data.lugar.trim(),
      tipo: enumOr(MeetingType, data.tipo, MeetingType.ORDINARIA),
      frecuencia: enumOr(Frequency, data.frecuencia, Frequency.MENSUAL),
      objetivo: data.objetivo.trim(),
      estado: MeetingStatus.NO_INICIADA,
      agenda: {
        create: agenda.map((a, i) => ({
          titulo: a.titulo.trim(),
          descripcion: a.descripcion.trim(),
          duracion: Number(a.duracion) || 0,
          orden: i,
          estado: AgendaItemStatus.NO_INICIADO,
        })),
      },
      asistentes: { connect: data.asistentes.map((id) => ({ id })) },
    },
  });

  revalidatePath("/reuniones");
  return { ok: "Reunión creada.", id: reunion.id };
}

export async function cancelarReunion(id: number): Promise<ReunionState> {
  await requireGlobal();
  const r = await prisma.meeting.findUnique({ where: { id } });
  if (!r) return { error: "Reunión no encontrada." };
  if (r.estado === MeetingStatus.REALIZADA) {
    return { error: "No se puede cancelar una reunión ya realizada." };
  }
  await prisma.meeting.delete({ where: { id } });
  revalidatePath("/reuniones");
  return { ok: "Reunión cancelada." };
}

export async function actualizarEstadoTema(
  agendaItemId: number,
  estado: string
): Promise<ReunionState> {
  await requireGlobal();
  await prisma.agendaItem.update({
    where: { id: agendaItemId },
    data: { estado: enumOr(AgendaItemStatus, estado, AgendaItemStatus.NO_INICIADO) },
  });
  const item = await prisma.agendaItem.findUnique({ where: { id: agendaItemId } });
  if (item) revalidatePath(`/reuniones/${item.meetingId}`);
  return { ok: "Estado actualizado." };
}

export async function guardarMinutaTrabajo(
  meetingId: number,
  notas: string,
  riesgos: string
): Promise<ReunionState> {
  await requireGlobal();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { notas, riesgos },
  });
  revalidatePath(`/reuniones/${meetingId}`);
  return { ok: "Minuta guardada." };
}

// "Guardar minuta": archiva una copia de la minuta actual en el historial de minutas.
export async function archivarMinuta(meetingId: number): Promise<ReunionState> {
  await requireGlobal();
  const r = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!r) return { error: "Reunión no encontrada." };
  await prisma.minute.create({
    data: { meetingId, notas: r.notas, riesgos: r.riesgos },
  });
  revalidatePath(`/reuniones/${meetingId}`);
  return { ok: "Minuta archivada en el historial." };
}

// "Guardar en historial": marca la reunión como realizada.
export async function guardarEnHistorial(meetingId: number): Promise<ReunionState> {
  await requireGlobal();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { estado: MeetingStatus.REALIZADA },
  });
  revalidatePath("/reuniones");
  revalidatePath(`/reuniones/${meetingId}`);
  return { ok: "Reunión guardada en el historial." };
}

export async function actualizarEstadoReunion(
  meetingId: number,
  estado: string
): Promise<ReunionState> {
  await requireGlobal();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { estado: enumOr(MeetingStatus, estado, MeetingStatus.NO_INICIADA) },
  });
  revalidatePath("/reuniones");
  revalidatePath(`/reuniones/${meetingId}`);
  return { ok: "Estado de la reunión actualizado." };
}

export async function toggleAsistente(
  meetingId: number,
  userId: string,
  agregar: boolean
): Promise<ReunionState> {
  await requireGlobal();
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { asistentes: agregar ? { connect: { id: userId } } : { disconnect: { id: userId } } },
  });
  revalidatePath(`/reuniones/${meetingId}`);
  return { ok: "Asistentes actualizados." };
}

// ---- Temas recurrentes de la agenda (pestaña Calendario) ----
export async function agregarTemaRecurrente(titulo: string, frecuencia: string): Promise<ReunionState> {
  await requireGlobal();
  const t = titulo.trim();
  if (!t) return { error: "Escribe el título del tema." };
  const count = await prisma.agendaTemplateItem.count();
  await prisma.agendaTemplateItem.create({
    data: { titulo: t, frecuencia: enumOr(Frequency, frecuencia, Frequency.MENSUAL), orden: count },
  });
  revalidatePath("/reuniones");
  return { ok: "Tema recurrente agregado." };
}

export async function quitarTemaRecurrente(id: string): Promise<ReunionState> {
  await requireGlobal();
  await prisma.agendaTemplateItem.delete({ where: { id } });
  revalidatePath("/reuniones");
  return { ok: "Tema eliminado." };
}

export async function actualizarFrecuenciaTemaRecurrente(id: string, frecuencia: string): Promise<ReunionState> {
  await requireGlobal();
  await prisma.agendaTemplateItem.update({
    where: { id },
    data: { frecuencia: enumOr(Frequency, frecuencia, Frequency.MENSUAL) },
  });
  revalidatePath("/reuniones");
  return { ok: "Frecuencia actualizada." };
}

// Crear un compromiso directamente desde una reunión (queda vinculado a ella).
export async function crearCompromisoEnReunion(
  meetingId: number,
  data: {
    titulo: string;
    descripcion: string;
    area: string;
    responsableId: string;
    vence: string;
    indicador: string;
    prioridad: string;
  }
): Promise<ReunionState> {
  await requireGlobal();

  const titulo = data.titulo.trim();
  if (!titulo || !data.area || !data.responsableId || !data.vence) {
    return { error: "Título, área, responsable y fecha son obligatorios." };
  }
  const vence = new Date(data.vence + "T00:00:00Z");
  if (isNaN(vence.getTime())) return { error: "Fecha inválida." };

  await prisma.commitment.create({
    data: {
      titulo,
      descripcion: data.descripcion.trim(),
      area: data.area,
      responsableId: data.responsableId,
      vence,
      indicador: data.indicador.trim(),
      prioridad: enumOr(Priority, data.prioridad, Priority.MEDIA),
      avance: 0,
      estado: "NO_INICIADO",
      meetingId,
    },
  });

  revalidatePath(`/reuniones/${meetingId}`);
  revalidatePath("/compromisos");
  return { ok: "Compromiso creado y vinculado a la reunión." };
}
