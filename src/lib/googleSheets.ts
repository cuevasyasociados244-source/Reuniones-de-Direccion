import "server-only";

// Lee una hoja pública de Google Sheets (formato: Codigo | ... | Valor Actual | % Cumplimiento)
// vía el export CSV, sin credenciales. La hoja debe estar como "Cualquiera con el enlace: Lector".

export function extraerIdHoja(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9\-_]+)/);
  return m ? m[1] : null;
}

// Parser CSV mínimo que respeta comillas y comas internas.
function parseCSV(texto: string): string[][] {
  const filas: string[][] = [];
  let campo = "";
  let fila: string[] = [];
  let enComillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (enComillas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++; }
        else enComillas = false;
      } else campo += c;
    } else {
      if (c === '"') enComillas = true;
      else if (c === ",") { fila.push(campo); campo = ""; }
      else if (c === "\n") { fila.push(campo); filas.push(fila); fila = []; campo = ""; }
      else if (c === "\r") { /* ignorar */ }
      else campo += c;
    }
  }
  if (campo !== "" || fila.length) { fila.push(campo); filas.push(fila); }
  return filas;
}

function norm(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").trim();
}

function aNumero(s: string): number {
  const n = parseFloat(String(s).replace(/[%$\s]/g, "").replace(/,/g, ""));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export type ValorHoja = { valorActual: string; pct: number };

// Devuelve un mapa codigo -> { valorActual, pct } leído de la hoja.
export async function leerHojaKpis(url: string): Promise<Map<string, ValorHoja>> {
  const id = extraerIdHoja(url);
  if (!id) throw new Error("Enlace de Google Sheets no válido.");

  const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
  const r = await fetch(csvUrl, { cache: "no-store" });
  if (!r.ok) throw new Error(`No se pudo leer la hoja (HTTP ${r.status}). ¿Está pública como "Cualquiera con el enlace"?`);
  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("csv")) throw new Error('La hoja no es pública. Compártela como "Cualquiera con el enlace: Lector".');

  const filas = parseCSV(await r.text());
  if (filas.length < 2) return new Map();

  const encabezados = filas[0].map(norm);
  const iCodigo = encabezados.findIndex((h) => h.includes("codigo"));
  const iValor = encabezados.findIndex((h) => h.includes("valor"));
  const iPct = encabezados.findIndex((h) => h.includes("cumplimiento"));
  if (iCodigo < 0 || iPct < 0) {
    throw new Error('La hoja debe tener columnas "Codigo" y "% Cumplimiento".');
  }

  const mapa = new Map<string, ValorHoja>();
  for (let f = 1; f < filas.length; f++) {
    const fila = filas[f];
    const codigo = (fila[iCodigo] || "").trim().toUpperCase();
    if (!codigo) continue;
    mapa.set(codigo, {
      valorActual: iValor >= 0 ? (fila[iValor] || "").trim() : "",
      pct: aNumero(fila[iPct] || "0"),
    });
  }
  return mapa;
}
