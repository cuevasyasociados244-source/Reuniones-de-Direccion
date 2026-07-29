const MESES_LARGO = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function mesLabel(mes: number, anio: number): string {
  const m = MESES_LARGO[(mes - 1 + 12) % 12] ?? "";
  return `${m.charAt(0).toUpperCase() + m.slice(1)} ${anio}`;
}

export function siguientePeriodo(mes: number, anio: number): { mes: number; anio: number } {
  return mes >= 12 ? { mes: 1, anio: anio + 1 } : { mes: mes + 1, anio };
}
