// Indicadores de acuerdos para las reuniones de Dirección (según el doc del cliente
// "indicadores de desempeño"). Se calculan automáticamente desde los compromisos.
// Semáforo ejecutivo de 4 niveles: 🟢 95–100 · 🟡 90–94 · 🟠 80–89 · 🔴 <80.

export type Nivel = "VERDE" | "AMARILLO" | "NARANJA" | "ROJO";

export function nivelSemaforo(score: number): { nivel: Nivel; color: string; txt: string } {
  if (score >= 95) return { nivel: "VERDE", color: "#16a34a", txt: "Excelente" };
  if (score >= 90) return { nivel: "AMARILLO", color: "#eab308", txt: "Aceptable" };
  if (score >= 80) return { nivel: "NARANJA", color: "#ea580c", txt: "Riesgo" };
  return { nivel: "ROJO", color: "#dc2626", txt: "Acción inmediata" };
}

export type CommitmentLite = {
  estado: string;
  vence: Date;
  completadoEn: Date | null;
  nuevaFecha: Date | null;
};

export type IndicadorAcuerdo = {
  clave: string;
  nombre: string;
  valor: number; // valor crudo del indicador (%)
  valorTxt: string; // "85%" o "—" cuando no hay datos
  meta: string;
  sentido: "mayor" | "menor";
  score: number; // 0–100, mayor = mejor (para el semáforo)
  nivel: Nivel;
  color: string;
  nivelTxt: string;
  sinDatos: boolean;
};

// "en tiempo": concluido a más tardar el mismo día de su fecha compromiso.
function aTiempo(c: CommitmentLite): boolean {
  if (!c.completadoEn) return false;
  const finDelDia = c.vence.getTime() + 24 * 60 * 60 * 1000 - 1;
  return c.completadoEn.getTime() <= finDelDia;
}

export function indicadoresAcuerdos(cs: CommitmentLite[]): IndicadorAcuerdo[] {
  const total = cs.length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const completados = cs.filter((c) => c.estado === "COMPLETADO");
  const completadosATiempo = completados.filter(aTiempo).length;
  const vencidos = cs.filter((c) => c.estado === "VENCIDO").length;
  const reprogramados = cs.filter((c) => c.nuevaFecha != null).length;

  const vCumplimiento = pct(completados.length);
  const vEnTiempo = pct(completadosATiempo);
  const vVencidos = pct(vencidos);
  const vReprog = pct(reprogramados);

  const sinDatos = total === 0;
  const build = (
    clave: string,
    nombre: string,
    valor: number,
    meta: string,
    sentido: "mayor" | "menor",
    score: number
  ): IndicadorAcuerdo => {
    if (sinDatos) {
      return { clave, nombre, valor: 0, valorTxt: "—", meta, sentido, score: 0, nivel: "VERDE", color: "#94a3b8", nivelTxt: "Sin datos", sinDatos: true };
    }
    const s = nivelSemaforo(score);
    return { clave, nombre, valor, valorTxt: `${valor}%`, meta, sentido, score, nivel: s.nivel, color: s.color, nivelTxt: s.txt, sinDatos: false };
  };

  return [
    build("cumplimiento", "Cumplimiento de acuerdos", vCumplimiento, "≥ 95%", "mayor", vCumplimiento),
    build("en-tiempo", "Cumplimiento en tiempo", vEnTiempo, "≥ 90%", "mayor", vEnTiempo),
    // "menor es mejor": el score invierte el valor (menos vencidos/reprogramados → mejor).
    build("vencidos", "Acuerdos vencidos", vVencidos, "≤ 5%", "menor", 100 - vVencidos),
    build("reprogramados", "Acuerdos reprogramados", vReprog, "≤ 10%", "menor", 100 - vReprog),
  ];
}
