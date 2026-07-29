import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { whereKpisPorScope, whereCompromisosPorScope } from "@/lib/scope";
import { mesLabel } from "@/lib/periodo";
import { indicadoresAcuerdos } from "@/lib/indicadores";
import KpisCliente, { type KpisData, type KpiVM } from "./KpisCliente";

const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

export default async function KpisPage() {
  const user = await requireSession();
  const esGlobal = user.scope === "global";

  const [kpisRaw, periodo, snapshots, compromisos] = await Promise.all([
    prisma.kpi.findMany({
      where: { ...whereKpisPorScope(user), activo: true },
      include: { responsable: true },
      orderBy: { codigo: "asc" },
    }),
    prisma.periodo.findUnique({ where: { id: 1 } }),
    prisma.kpiSnapshot.findMany({
      include: { items: true },
      orderBy: [{ anio: "asc" }, { mes: "asc" }],
    }),
    prisma.commitment.findMany({
      where: whereCompromisosPorScope(user),
      select: { estado: true, vence: true, completadoEn: true, nuevaFecha: true },
    }),
  ]);

  const acuerdos = indicadoresAcuerdos(compromisos);

  const kpis: KpiVM[] = kpisRaw.map((k) => ({
    id: k.id,
    nombre: k.nombre,
    codigo: k.codigo,
    area: k.area,
    responsableNombre: k.responsable?.nombre ?? "—",
    frecuencia: k.frecuencia,
    unidadMedida: k.unidadMedida,
    tipoCalculo: k.tipoCalculo,
    meta: k.meta,
    sentido: k.sentido,
    valorActual: k.valorActual,
    pct: k.pct,
    estado: k.estado as KpiVM["estado"],
    fuenteDatos: k.fuenteDatos,
    metodoCaptura: k.metodoCaptura,
  }));

  // Códigos dentro del alcance, para filtrar los snapshots por scope.
  const misCodigos = new Set(kpis.map((k) => k.codigo));

  const total = kpis.length;
  const objetivo = kpis.filter((k) => k.estado === "OBJETIVO").length;
  const riesgo = kpis.filter((k) => k.estado === "RIESGO").length;
  const fuera = kpis.filter((k) => k.estado === "FUERA").length;
  const cumplimientoGeneral = total ? Math.round(kpis.reduce((s, k) => s + k.pct, 0) / total) : 0;

  // Cumplimiento promedio por área
  const areasMap = new Map<string, number[]>();
  for (const k of kpis) {
    if (!areasMap.has(k.area)) areasMap.set(k.area, []);
    areasMap.get(k.area)!.push(k.pct);
  }
  const porArea = [...areasMap.entries()]
    .map(([label, vals]) => ({ label, value: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const top5 = [...kpis].sort((a, b) => b.pct - a.pct).slice(0, 5).map((k) => ({ nombre: k.nombre, pct: k.pct }));

  // Tendencia: promedio de cumplimiento de los KPIs del alcance en cada cierre.
  const tendencia = snapshots
    .map((s) => {
      const items = s.items.filter((it) => misCodigos.has(it.codigo));
      if (items.length === 0) return null;
      return {
        label: `${MES_CORTO[(s.mes - 1 + 12) % 12]} ${String(s.anio).slice(2)}`,
        value: Math.round(items.reduce((sum, it) => sum + it.pct, 0) / items.length),
      };
    })
    .filter((x): x is { label: string; value: number } => x !== null);

  // Histórico: más reciente primero, filtrado por alcance.
  const historico = [...snapshots]
    .reverse()
    .map((s) => ({
      periodoLabel: mesLabel(s.mes, s.anio),
      items: s.items
        .filter((it) => misCodigos.has(it.codigo))
        .map((it) => ({
          codigo: it.codigo,
          nombre: it.nombre,
          area: it.area,
          meta: it.meta,
          valorActual: it.valorActual,
          pct: it.pct,
          estado: it.estado,
        })),
    }));

  const data: KpisData = {
    esGlobal,
    periodoLabel: periodo ? mesLabel(periodo.mes, periodo.anio) : "—",
    acuerdos: acuerdos.map((i) => ({ nombre: i.nombre, valor: i.valor, meta: i.meta, sentido: i.sentido, color: i.color, nivelTxt: i.nivelTxt })),
    stats: { cumplimientoGeneral, objetivo, riesgo, fuera, total },
    porArea,
    top5,
    tendencia,
    kpis,
    historico,
  };

  return <KpisCliente data={data} />;
}
