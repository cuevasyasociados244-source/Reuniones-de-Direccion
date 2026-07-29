import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generarToken(): string {
  return randomBytes(32).toString("hex");
}

export const COOKIE_SESION = "integra_rca_sesion";
export const DIAS_SESION = 7;
