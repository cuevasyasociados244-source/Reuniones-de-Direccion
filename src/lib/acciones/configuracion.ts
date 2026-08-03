"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireGlobal } from "@/lib/session";
import { Frequency, KpiSense, CaptureMethod, KpiStatus } from "@prisma/client";
import { leerHojaKpis } from "@/lib/googleSheets";

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
  hojaUrl: string;
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
    hojaUrl: data.hojaUrl.trim(),
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

// Sincroniza los KPIs con método "Google Sheets": lee cada hoja pública, empareja
// por código y actualiza valor actual, % de cumplimiento y estado.
export async function sincronizarKpis(): Promise<ConfigState> {
  await requireGlobal();
  const kpis = await prisma.kpi.findMany({
    where: { metodoCaptura: CaptureMethod.GOOGLE_SHEETS, activo: true },
  });
  if (kpis.length === 0) return { error: 'No hay KPIs activos con método "Google Sheets".' };

  const cache = new Map<string, Awaited<ReturnType<typeof leerHojaKpis>>>();
  let actualizados = 0;
  const noEncontrados: string[] = [];
  const errores: string[] = [];

  for (const k of kpis) {
    if (!k.hojaUrl) { errores.push(`${k.codigo}: falta el enlace de la hoja`); continue; }
    try {
      let mapa = cache.get(k.hojaUrl);
      if (!mapa) { mapa = await leerHojaKpis(k.hojaUrl); cache.set(k.hojaUrl, mapa); }
      const fila = mapa.get(k.codigo.toUpperCase());
      if (!fila) { noEncontrados.push(k.codigo); continue; }
      await prisma.kpi.update({
        where: { id: k.id },
        data: {
          valorActual: fila.valorActual || k.valorActual,
          pct: fila.pct,
          estado: kpiEstado(fila.pct),
          ultimaSync: new Date(),
        },
      });
      actualizados++;
    } catch (e) {
      errores.push(`${k.codigo}: ${(e as Error).message}`);
    }
  }

  revalidatePath("/configuracion");
  revalidatePath("/kpis");
  revalidatePath("/");

  const partes = [`${actualizados} KPI(s) actualizados desde Google Sheets`];
  if (noEncontrados.length) partes.push(`sin fila coincidente: ${noEncontrados.join(", ")}`);
  if (errores.length) return { error: `${partes.join(" · ")}. Problemas: ${errores.join(" | ")}` };
  return { ok: partes.join(" · ") + "." };
}
