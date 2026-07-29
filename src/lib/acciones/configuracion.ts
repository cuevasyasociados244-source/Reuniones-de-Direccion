"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireGlobal } from "@/lib/session";
import { Frequency, KpiSense, CaptureMethod, KpiStatus } from "@prisma/client";

export type ConfigState = { error?: string; ok?: string };

function enumOr<T extends Record<string, string>>(e: T, v: string, def: T[keyof T]): T[keyof T] {
  return (Object.values(e) as string[]).includes(v) ? (v as T[keyof T]) : def;
}

function kpiEstado(pct: number): KpiStatus {
  if (pct >= 80) return KpiStatus.OBJETIVO;
  if (pct >= 50) return KpiStatus.RIESGO;
  return KpiStatus.FUERA;
}

// ---------------- Departamentos ----------------
export async function crearDepartamento(nombre: string): Promise<ConfigState> {
  await requireGlobal();
  const n = nombre.trim();
  if (!n) return { error: "Escribe un nombre de departamento." };

  const existe = await prisma.department.findFirst({ where: { nombre: { equals: n, mode: "insensitive" } } });
  if (existe) {
    if (!existe.activo) {
      await prisma.department.update({ where: { id: existe.id }, data: { activo: true } });
      revalidatePath("/configuracion");
      return { ok: `Departamento "${n}" reactivado.` };
    }
    return { error: "Ese departamento ya existe." };
  }

  await prisma.department.create({ data: { nombre: n } });
  revalidatePath("/configuracion");
  return { ok: `Departamento "${n}" agregado.` };
}

// Baja lógica: quitar un departamento NO cambia el área de quien ya lo tenía.
export async function quitarDepartamento(id: string): Promise<ConfigState> {
  await requireGlobal();
  await prisma.department.update({ where: { id }, data: { activo: false } });
  revalidatePath("/configuracion");
  return { ok: "Departamento eliminado." };
}

// ---------------- KPIs ----------------
export type KpiInput = {
  nombre: string;
  codigo: string;
  area: string;
  responsableId: string;
  frecuencia: string;
  unidadMedida: string;
  tipoCalculo: string;
  meta: string;
  sentido: string;
  valorActual: string;
  pct: number;
  fuenteDatos: string;
  metodoCaptura: string;
  activo: boolean;
};

function normalizaKpi(data: KpiInput) {
  const pct = Math.max(0, Math.min(100, Math.round(Number(data.pct) || 0)));
  return {
    nombre: data.nombre.trim(),
    codigo: data.codigo.trim().toUpperCase(),
    area: data.area.trim(),
    responsableId: data.responsableId || null,
    frecuencia: enumOr(Frequency, data.frecuencia, Frequency.MENSUAL),
    unidadMedida: data.unidadMedida.trim(),
    tipoCalculo: data.tipoCalculo.trim(),
    meta: data.meta.trim(),
    sentido: enumOr(KpiSense, data.sentido, KpiSense.MAYOR),
    valorActual: data.valorActual.trim(),
    pct,
    estado: kpiEstado(pct),
    fuenteDatos: data.fuenteDatos.trim(),
    metodoCaptura: enumOr(CaptureMethod, data.metodoCaptura, CaptureMethod.MANUAL),
    activo: !!data.activo,
  };
}

export async function crearKpi(data: KpiInput): Promise<ConfigState> {
  await requireGlobal();
  const d = normalizaKpi(data);
  if (!d.nombre || !d.codigo || !d.area) return { error: "Nombre, código y área son obligatorios." };

  const existe = await prisma.kpi.findUnique({ where: { codigo: d.codigo } });
  if (existe) return { error: `Ya existe un KPI con el código ${d.codigo}.` };

  await prisma.kpi.create({ data: d });
  revalidatePath("/configuracion");
  revalidatePath("/kpis");
  return { ok: `KPI "${d.nombre}" creado.` };
}

export async function actualizarKpi(id: number, data: KpiInput): Promise<ConfigState> {
  await requireGlobal();
  const d = normalizaKpi(data);
  if (!d.nombre || !d.codigo || !d.area) return { error: "Nombre, código y área son obligatorios." };

  const otro = await prisma.kpi.findFirst({ where: { codigo: d.codigo, id: { not: id } } });
  if (otro) return { error: `El código ${d.codigo} ya lo usa otro KPI.` };

  await prisma.kpi.update({ where: { id }, data: d });
  revalidatePath("/configuracion");
  revalidatePath("/kpis");
  return { ok: `KPI "${d.nombre}" actualizado.` };
}

export async function eliminarKpi(id: number): Promise<ConfigState> {
  await requireGlobal();
  await prisma.kpi.delete({ where: { id } });
  revalidatePath("/configuracion");
  revalidatePath("/kpis");
  return { ok: "KPI eliminado." };
}

// Stub de sincronización: marca la última sincronización de los KPIs con método
// Google Sheets. La integración real (API de Google Sheets / ERP) queda pendiente.
export async function sincronizarKpis(): Promise<ConfigState> {
  await requireGlobal();
  const r = await prisma.kpi.updateMany({
    where: { metodoCaptura: CaptureMethod.GOOGLE_SHEETS, activo: true },
    data: { ultimaSync: new Date() },
  });
  revalidatePath("/configuracion");
  revalidatePath("/kpis");
  return { ok: `Sincronización registrada para ${r.count} KPI(s) vinculados. (Integración real pendiente.)` };
}
