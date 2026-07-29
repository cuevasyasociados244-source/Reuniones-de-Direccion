import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { COOKIE_SESION } from "./auth";
import { getScope, type Scope } from "./scope";

export type UsuarioSesion = {
  id: string;
  usuario: string;
  nombre: string;
  puesto: string;
  area: string;
  iniciales: string;
  fotoUrl: string | null;
  scope: Scope;
};

// Lee la cookie, valida la sesión en BD y devuelve el usuario (con su scope) o null.
export async function getSessionUser(): Promise<UsuarioSesion | null> {
  const store = await cookies();
  const token = store.get(COOKIE_SESION)?.value;
  if (!token) return null;

  const sesion = await prisma.session.findUnique({
    where: { token },
    include: { usuario: true },
  });

  if (!sesion) return null;
  if (sesion.expiraEn < new Date()) {
    await prisma.session.delete({ where: { id: sesion.id } }).catch(() => {});
    return null;
  }
  if (!sesion.usuario.activo) return null;

  const u = sesion.usuario;
  return {
    id: u.id,
    usuario: u.usuario,
    nombre: u.nombre,
    puesto: u.puesto,
    area: u.area,
    iniciales: u.iniciales,
    fotoUrl: u.fotoUrl,
    scope: getScope(u.puesto),
  };
}

// Igual que getSessionUser pero redirige a /login si no hay sesión válida.
export async function requireSession(): Promise<UsuarioSesion> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

// Exige alcance global; si no, redirige al inicio.
export async function requireGlobal(): Promise<UsuarioSesion> {
  const user = await requireSession();
  if (user.scope !== "global") redirect("/");
  return user;
}
