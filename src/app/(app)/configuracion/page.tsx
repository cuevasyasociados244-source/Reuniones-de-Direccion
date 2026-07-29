import { requireGlobal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ConfiguracionCliente, { type KpiRowVM } from "./ConfiguracionCliente";

export default async function ConfiguracionPage() {
  await requireGlobal();

  const [departamentos, kpisRaw, personas] = await Promise.all([
    prisma.department.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
    prisma.kpi.findMany({ include: { responsable: true }, orderBy: { codigo: "asc" } }),
    prisma.user.findMany({ where: { activo: true }, orderBy: { nombre: "asc" }, select: { id: true, nombre: true } }),
  ]);

  const kpis: KpiRowVM[] = kpisRaw.map((k) => ({
    id: k.id,
    nombre: k.nombre,
    codigo: k.codigo,
    area: k.area,
    responsableId: k.responsableId ?? "",
    responsableNombre: k.responsable?.nombre ?? "—",
    frecuencia: k.frecuencia,
    unidadMedida: k.unidadMedida,
    tipoCalculo: k.tipoCalculo,
    meta: k.meta,
    sentido: k.sentido,
    valorActual: k.valorActual,
    pct: k.pct,
    estado: k.estado,
    fuenteDatos: k.fuenteDatos,
    metodoCaptura: k.metodoCaptura,
    activo: k.activo,
  }));

  const googleSheetsCount = kpisRaw.filter((k) => k.metodoCaptura === "GOOGLE_SHEETS" && k.activo).length;

  return (
    <ConfiguracionCliente
      departamentos={departamentos}
      departamentosNombres={departamentos.map((d) => d.nombre)}
      kpis={kpis}
      personas={personas}
      googleSheetsCount={googleSheetsCount}
    />
  );
}
