const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

// Formatea una fecha como "30 ago 2026" (estilo del prototipo). Usa UTC para
// evitar desfases por zona horaria (las fechas se guardan a medianoche UTC).
export function fechaCorta(d: Date): string {
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}
