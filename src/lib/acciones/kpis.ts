"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireGlobal } from "@/lib/session";
import { siguientePeriodo } from "@/lib/periodo";

export type KpiState = { error?: string; ok?: string };

// "Cerrar mes" (solo alcance global): congela una copia de todos los KPIs activos
// en el periodo actual como registro histórico, y avanza el periodo al siguiente mes.
export async function cerrarMes(): Promise<KpiState> {
  await requireGlobal();

  const periodo = await prisma.periodo.findUnique({ where: { id: 1 } });
  if (!periodo) return { error: "No hay periodo configurado." };

  // Evita duplicar un snapshot del mismo periodo.
  const yaExiste = await prisma.kpiSnapshot.findUnique({
    where: { mes_anio: { mes: periodo.mes, anio: periodo.anio } },
  });
  if (yaExiste) {
    return { error: "Ese periodo ya fue cerrado." };
  }

  const kpis = await prisma.kpi.findMany({ where: { activo: true } });

  await prisma.kpiSnapshot.create({
    data: {
      mes: periodo.mes,
      anio: periodo.anio,
      items: {
        create: kpis.map((k) => ({
          codigo: k.codigo,
          nombre: k.nombre,
          area: k.area,
          meta: k.meta,
          valorActual: k.valorActual,
          pct: k.pct,
          estado: k.estado,
        })),
      },
    },
  });

  const sig = siguientePeriodo(periodo.mes, periodo.anio);
  await prisma.periodo.update({ where: { id: 1 }, data: sig });

  revalidatePath("/kpis");
  return { ok: `Mes cerrado. El tablero avanzó al siguiente periodo.` };
}
