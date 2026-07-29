// ------------------------------------------------------------------
// Pilar central del sistema: ALCANCE (scope) y PERMISOS.
// El alcance se DERIVA del puesto. Todas las decisiones de permiso
// pasan por aquí; el filtrado real de datos se aplica en el servidor
// (ver whereCompromisosPorScope / whereKpisPorScope), no solo ocultando UI.
// Fuente: §3 y §6 del brief.
// ------------------------------------------------------------------

export type Scope = "global" | "area" | "propio";

export function getScope(puesto: string): Scope {
  const p = (puesto || "").toLowerCase();
  if (p.includes("director general")) return "global";
  if (p.includes("director")) return "area";
  return "propio";
}

// Usuario mínimo que necesitan los helpers de permiso.
export type ScopedUser = {
  id: string;
  puesto: string;
  area: string;
};

export function scopeOf(user: ScopedUser): Scope {
  return getScope(user.puesto);
}

// ---------------- Módulos del menú lateral ----------------
export type ModuleKey =
  | "inicio"
  | "compromisos"
  | "reuniones"
  | "avance"
  | "reconocimientos"
  | "kpis"
  | "personas"
  | "documentos"
  | "configuracion";

// Módulos exclusivos de alcance global (§3).
const SOLO_GLOBAL: ModuleKey[] = ["reuniones", "personas", "configuracion"];

export function puedeVerModulo(user: ScopedUser, mod: ModuleKey): boolean {
  if (SOLO_GLOBAL.includes(mod)) return scopeOf(user) === "global";
  return true;
}

// ---------------- Acciones (matriz §3) ----------------
export function puedeCrearCompromiso(user: ScopedUser): boolean {
  return scopeOf(user) === "global";
}

export function puedeVerTablero(user: ScopedUser): boolean {
  return scopeOf(user) === "global";
}

export function puedeCerrarMes(user: ScopedUser): boolean {
  return scopeOf(user) === "global";
}

// El responsable (y solo él) captura el avance, si el compromiso no está vencido.
export function puedeCapturarAvance(
  user: ScopedUser,
  compromiso: { responsableId: string; estado: string }
): boolean {
  return compromiso.responsableId === user.id && compromiso.estado !== "VENCIDO";
}

// "Registrar resultado": en Avance de Compromisos solo lo ve alcance global;
// en Inicio lo ven todos MENOS alcance global (rareza validada en §3).
export function puedeRegistrarResultadoEnAvance(user: ScopedUser): boolean {
  return scopeOf(user) === "global";
}
export function puedeRegistrarResultadoEnInicio(user: ScopedUser): boolean {
  return scopeOf(user) !== "global";
}

// ---------------- Filtros de datos por scope (Prisma where) ----------------
// Compromisos: global ve todo; área ve los de su área MÁS los asignados a él
// de otras áreas; propio ve solo los suyos.
export function whereCompromisosPorScope(user: ScopedUser) {
  const scope = scopeOf(user);
  if (scope === "global") return {};
  if (scope === "area") {
    return { OR: [{ area: user.area }, { responsableId: user.id }] };
  }
  return { responsableId: user.id };
}

// KPIs: global ve todos; área ve los de su área; propio ve los de los que es responsable.
export function whereKpisPorScope(user: ScopedUser) {
  const scope = scopeOf(user);
  if (scope === "global") return {};
  if (scope === "area") return { area: user.area };
  return { responsableId: user.id };
}
