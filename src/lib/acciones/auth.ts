"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword, generarToken, COOKIE_SESION, DIAS_SESION } from "@/lib/auth";

export type LoginState = { error?: string };

export async function iniciarSesion(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const usuario = String(formData.get("usuario") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!usuario || !password) {
    return { error: "Escribe tu usuario y contraseña." };
  }

  const user = await prisma.user.findUnique({ where: { usuario } });
  if (!user || !user.activo) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const ok = await verifyPassword(password, user.password);
  if (!ok) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const token = generarToken();
  const expiraEn = new Date(Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId: user.id, expiraEn } });

  const store = await cookies();
  store.set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiraEn,
  });

  redirect("/");
}

export async function cerrarSesion() {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
    store.delete(COOKIE_SESION);
  }
  redirect("/login");
}
