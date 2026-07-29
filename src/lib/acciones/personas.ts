"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { requireGlobal, getSessionUser } from "@/lib/session";

export type PersonaState = { error?: string; ok?: string };

// Calcula las iniciales (avatar por defecto) a partir del nombre.
function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

function slugUsuario(v: string): string {
  return v
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quita acentos
    .replace(/[^a-z0-9._-]/g, "");
}

export async function crearPersona(
  _prev: PersonaState,
  formData: FormData
): Promise<PersonaState> {
  await requireGlobal();

  const nombre = String(formData.get("nombre") || "").trim();
  const usuario = slugUsuario(String(formData.get("usuario") || ""));
  const puesto = String(formData.get("puesto") || "").trim();
  const area = String(formData.get("area") || "").trim();
  const password = String(formData.get("password") || "");

  if (!nombre || !usuario || !puesto || !area || !password) {
    return { error: "Todos los campos son obligatorios." };
  }
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const existe = await prisma.user.findUnique({ where: { usuario } });
  if (existe) {
    return { error: `El usuario "${usuario}" ya existe. Elige otro.` };
  }

  const hash = await hashPassword(password);
  await prisma.user.create({
    data: {
      usuario,
      nombre,
      puesto,
      area,
      password: hash,
      iniciales: calcularIniciales(nombre),
    },
  });

  revalidatePath("/personas");
  return { ok: `Persona "${nombre}" agregada.` };
}

export async function restablecerPassword(
  _prev: PersonaState,
  formData: FormData
): Promise<PersonaState> {
  await requireGlobal();

  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");
  if (!id || !password) return { error: "Falta la nueva contraseña." };
  if (password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres." };
  }

  const hash = await hashPassword(password);
  await prisma.user.update({ where: { id }, data: { password: hash } });

  // Invalida las sesiones abiertas de esa persona.
  await prisma.session.deleteMany({ where: { userId: id } });

  revalidatePath("/personas");
  return { ok: "Contraseña restablecida." };
}

// Baja lógica: nunca se borra el registro.
export async function darDeBaja(formData: FormData): Promise<void> {
  await requireGlobal();
  const id = String(formData.get("id") || "");
  const yo = await getSessionUser();
  if (yo && yo.id === id) return; // no permitir desactivarse a sí mismo
  if (!id) return;

  await prisma.user.update({ where: { id }, data: { activo: false } });
  await prisma.session.deleteMany({ where: { userId: id } });
  revalidatePath("/personas");
}

export async function reactivar(formData: FormData): Promise<void> {
  await requireGlobal();
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.user.update({ where: { id }, data: { activo: true } });
  revalidatePath("/personas");
}
