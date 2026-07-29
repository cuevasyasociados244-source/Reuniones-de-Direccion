import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { whereCompromisosPorScope, whereKpisPorScope } from "@/lib/scope";
import { fechaCorta } from "@/lib/formato";
import { indicadoresAcuerdos } from "@/lib/indicadores";
import InicioCliente, { type InicioData, type FilaVM } from "./InicioCliente";

const MES_CORTO = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const UMBRAL_PROXIMO_DIAS = 30;

function diasDesdeHoy(vence: Date, hoy: Date): number {
  const ms = Date.UTC(vence.getUTCFullYear(), vence.getUTCMonth(), vence.getUTCDate()) -
    Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), hoy.getUTCDate());
  return Math.round(ms / 86400000);
}

export default async function InicioPage() {
  const user = await requireSession();
  const esGlobal = user.scope === "global";
  const hoy = new Date();

  const [compromisos, kpis, snapshots, reconocimientos] = await Promise.all([
    prisma.commitment.findMany({
      where: whereCompromisosPorScope(user),
      include: { responsable: true },
      orderBy: { vence: "asc" },
    }),
    prisma.kpi.findMany({ where: { ...whereKpisPorScope(user), activo: true } }),
    prisma.kpiSnapshot.findMany({ include: { items: true }, orderBy: [{ anio: "asc" }, { mes: "asc" }] }),
    prisma.recognition.findMany({ include: { autor: true } }),
  ]);

  const fila = (c: (typeof compromisos)[number]): FilaVM => ({
    id: c.id,
    titulo: c.titulo,
    responsableNombre: c.responsable?.nombre ?? "—",
    vence: fechaCorta(c.vence),
    avance: c.avance,
  });

  // Categorización por fecha (umbral 30 días), igual que el prototipo.
  const enCurso = compromisos.filter((c) => c.estado === "PROGRESO" || c.estado === "NO_INICIADO");
  const enTiempo = enCurso.filter((c) => diasDesdeHoy(c.vence, hoy) > UMBRAL_PROXIMO_DIAS).map(fila);
  const proximos = enCurso.filter((c) => diasDesdeHoy(c.vence, hoy) <= UMBRAL_PROXIMO_DIAS).map(fila);
  const vencidos = compromisos.filter((c) => c.estado === "VENCIDO").map(fila);

  // Cumplimiento por área (desde KPIs en alcance)
  const areasMap = new Map<string, number[]>();
  for (const k of kpis) {
    if (!areasMap.has(k.area)) areasMap.set(k.area, []);
    areasMap.get(k.area)!.push(k.pct);
  }
  const porArea = [...areasMap.entries()]
    .map(([label, vals]) => ({ label, value: Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const misCodigos = new Set(kpis.map((k) => k.codigo));
  const tendencia = snapshots
    .map((s) => {
      const items = s.items.filter((it) => misCodigos.has(it.codigo));
      if (items.length === 0) return null;
      return { label: `${MES_CORTO[(s.mes - 1 + 12) % 12]} ${String(s.anio).slice(2)}`, value: Math.round(items.reduce((sum, it) => sum + it.pct, 0) / items.length) };
    })
    .filter((x): x is { label: string; value: number } => x !== null);

  // Reconocimientos en alcance
  const misRecon = reconocimientos.filter((r) =>
    esGlobal ? true : user.scope === "area" ? r.autor.area === user.area : r.autorId === user.id
  );

  // Indicadores de acuerdos (doc del cliente), calculados desde los compromisos en alcance.
  void misRecon;
  const indicadores = indicadoresAcuerdos(
    compromisos.map((c) => ({ estado: c.estado, vence: c.vence, completadoEn: c.completadoEn, nuevaFecha: c.nuevaFecha }))
  ).map((i) => ({ nombre: i.nombre, valor: i.valor, meta: i.meta, color: i.color, nivelTxt: i.nivelTxt }));

  const fechaHoy = `${hoy.getUTCDate()} de ${MES_LARGO[hoy.getUTCMonth()]} de ${hoy.getUTCFullYear()}`;
  const scopeLabel = user.scope === "global" ? "global" : user.scope === "area" ? `área (${user.area})` : "personal";

  const data: InicioData = {
    nombre: user.nombre,
    esGlobal,
    scopeLabel,
    area: user.area,
    fechaHoy,
    indicadores,
    porArea,
    tendencia,
    enTiempo,
    proximos,
    vencidos,
  };

  return <InicioCliente data={data} />;
}
