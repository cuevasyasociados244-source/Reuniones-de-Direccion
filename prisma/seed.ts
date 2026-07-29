import { PrismaClient, Priority, CommitmentStatus, KpiSense, CaptureMethod, Frequency, MeetingType, MeetingStatus, AgendaItemStatus, KpiStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Estado de KPI SIEMPRE derivado del % de cumplimiento (regla de negocio).
function kpiEstado(pct: number): KpiStatus {
  if (pct >= 80) return KpiStatus.OBJETIVO;
  if (pct >= 50) return KpiStatus.RIESGO;
  return KpiStatus.FUERA;
}

// Ajusta un avance libre al valor permitido más cercano (0/25/50/75/100).
function snapAvance(v: number): number {
  const permitidos = [0, 25, 50, 75, 100];
  return permitidos.reduce((a, b) => (Math.abs(b - v) < Math.abs(a - v) ? b : a), 0);
}

const DEPARTAMENTOS = [
  "Dirección General",
  "Ventas",
  "Operaciones",
  "Administración",
  "Finanzas",
  "Recursos Humanos",
];

// usuario (login) = slug del prototipo
const PERSONAS = [
  { usuario: "guillermo", nombre: "Guillermo Fitch", puesto: "Director General", area: "Dirección General", iniciales: "GF", password: "Directorio#2026" },
  { usuario: "maria", nombre: "María González", puesto: "Directora de Operaciones", area: "Operaciones", iniciales: "MG", password: "Operaciones#25" },
  { usuario: "jose", nombre: "José Ramírez", puesto: "Director Administrativo", area: "Administración", iniciales: "JR", password: "Admin#2025" },
  { usuario: "ana", nombre: "Ana López", puesto: "Líder de Proyectos", area: "Operaciones", iniciales: "AL", password: "Proyectos#25" },
  { usuario: "luis", nombre: "Luis Martínez", puesto: "Director Comercial", area: "Ventas", iniciales: "LM", password: "Ventas#2025" },
];

const COMPROMISOS = [
  { titulo: "Reducir inventario obsoleto en un 15%", descripcion: "Implementar acciones para analizar y depurar inventario obsoleto en todas las sucursales.", area: "Operaciones", responsable: "maria", vence: "2026-08-30", avance: 65, estado: CommitmentStatus.PROGRESO, indicador: "% de reducción en inventario obsoleto", prioridad: Priority.ALTA },
  { titulo: "Mejorar tiempo de respuesta a clientes", descripcion: "Reducir el tiempo promedio de respuesta al cliente en todos los canales.", area: "Ventas", responsable: "luis", vence: "2026-08-25", avance: 40, estado: CommitmentStatus.PROGRESO, indicador: "Tiempo promedio de respuesta (hrs)", prioridad: Priority.MEDIA },
  { titulo: "Implementar reportes semanales de ventas", descripcion: "Diseñar y automatizar el envío de reportes semanales de ventas por sucursal.", area: "Ventas", responsable: "jose", vence: "2026-08-15", avance: 0, estado: CommitmentStatus.NO_INICIADO, indicador: "Reportes entregados a tiempo", prioridad: Priority.MEDIA },
  { titulo: "Capacitar al equipo de atención al cliente", descripcion: "Programa de capacitación en atención y resolución de quejas.", area: "Operaciones", responsable: "ana", vence: "2026-09-05", avance: 70, estado: CommitmentStatus.PROGRESO, indicador: "% de personal capacitado", prioridad: Priority.ALTA },
  { titulo: "Disminuir quejas de clientes en un 20%", descripcion: "Plan de acción para reducir quejas recurrentes por canal.", area: "Ventas", responsable: "luis", vence: "2026-06-03", avance: 100, estado: CommitmentStatus.VENCIDO, indicador: "Número de quejas mensuales", prioridad: Priority.ALTA },
];

const KPIS = [
  { nombre: "% Cumplimiento de ventas", codigo: "KPI-VEN-01", area: "Ventas", responsable: "luis", unidadMedida: "%", tipoCalculo: "Promedio del periodo", meta: "100%", valorActual: "85%", pct: 85, sentido: KpiSense.MAYOR, fuenteDatos: "Ventas_Diario — Google Sheets", metodoCaptura: CaptureMethod.GOOGLE_SHEETS },
  { nombre: "Días de inventario promedio", codigo: "KPI-OPE-01", area: "Operaciones", responsable: "maria", unidadMedida: "días", tipoCalculo: "Última captura", meta: "30 días", valorActual: "36 días", pct: 60, sentido: KpiSense.MENOR, fuenteDatos: "", metodoCaptura: CaptureMethod.MANUAL },
  { nombre: "Gastos operativos / Ventas", codigo: "KPI-ADM-01", area: "Administración", responsable: "jose", unidadMedida: "%", tipoCalculo: "Fórmula personalizada", meta: "≤ 20%", valorActual: "22%", pct: 45, sentido: KpiSense.MENOR, fuenteDatos: "ERP Contable", metodoCaptura: CaptureMethod.ERP },
  { nombre: "Flujo de caja operativo", codigo: "KPI-FIN-01", area: "Finanzas", responsable: "jose", unidadMedida: "$", tipoCalculo: "Suma acumulada", meta: "> 0", valorActual: "$125,000", pct: 100, sentido: KpiSense.MAYOR, fuenteDatos: "Banco — Estado de cuenta", metodoCaptura: CaptureMethod.MANUAL },
  { nombre: "Ausentismo", codigo: "KPI-RH-01", area: "Recursos Humanos", responsable: "maria", unidadMedida: "%", tipoCalculo: "Promedio del periodo", meta: "≤ 3%", valorActual: "2.8%", pct: 93, sentido: KpiSense.MENOR, fuenteDatos: "Asistencia_RH — Google Sheets", metodoCaptura: CaptureMethod.GOOGLE_SHEETS },
];

const AGENDA_DEFAULT = [
  { titulo: "Revisión de compromisos anteriores", descripcion: "Análisis del avance de los compromisos de la reunión anterior.", duracion: 20 },
  { titulo: "Resultados por área", descripcion: "Presentación de KPIs y resultados principales por cada área.", duracion: 25 },
  { titulo: "Proyectos estratégicos", descripcion: "Revisión del avance de proyectos prioritarios.", duracion: 20 },
  { titulo: "Riesgos y problemas críticos", descripcion: "Identificación y análisis de riesgos y problemas actuales.", duracion: 15 },
  { titulo: "Nuevos compromisos", descripcion: "Definición de nuevos compromisos y responsables.", duracion: 15 },
  { titulo: "Asuntos generales", descripcion: "Temas varios y acuerdos adicionales.", duracion: 10 },
];

async function main() {
  console.log("Sembrando Integra One RCA...");

  // Departamentos
  for (const nombre of DEPARTAMENTOS) {
    await prisma.department.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  // Personas
  const usuariosPorSlug: Record<string, string> = {};
  for (const p of PERSONAS) {
    const hash = await bcrypt.hash(p.password, 10);
    const u = await prisma.user.upsert({
      where: { usuario: p.usuario },
      update: { nombre: p.nombre, puesto: p.puesto, area: p.area, iniciales: p.iniciales },
      create: { usuario: p.usuario, nombre: p.nombre, puesto: p.puesto, area: p.area, iniciales: p.iniciales, password: hash },
    });
    usuariosPorSlug[p.usuario] = u.id;
  }

  // Plantilla de agenda recurrente
  await prisma.agendaTemplateItem.deleteMany();
  await prisma.agendaTemplateItem.createMany({
    data: AGENDA_DEFAULT.map((a, i) => ({ titulo: a.titulo, frecuencia: Frequency.MENSUAL, orden: i })),
  });

  // Compromisos (recreados de forma idempotente)
  await prisma.commitment.deleteMany();
  for (const c of COMPROMISOS) {
    await prisma.commitment.create({
      data: {
        titulo: c.titulo,
        descripcion: c.descripcion,
        area: c.area,
        responsableId: usuariosPorSlug[c.responsable],
        vence: new Date(c.vence + "T00:00:00Z"),
        avance: snapAvance(c.avance),
        estado: c.estado,
        indicador: c.indicador,
        prioridad: c.prioridad,
      },
    });
  }

  // KPIs
  for (const k of KPIS) {
    await prisma.kpi.upsert({
      where: { codigo: k.codigo },
      update: {},
      create: {
        nombre: k.nombre,
        codigo: k.codigo,
        area: k.area,
        responsableId: usuariosPorSlug[k.responsable],
        frecuencia: Frequency.MENSUAL,
        unidadMedida: k.unidadMedida,
        tipoCalculo: k.tipoCalculo,
        meta: k.meta,
        sentido: k.sentido,
        valorActual: k.valorActual,
        pct: k.pct,
        estado: kpiEstado(k.pct),
        fuenteDatos: k.fuenteDatos,
        metodoCaptura: k.metodoCaptura,
      },
    });
  }

  // Periodo actual del tablero de KPIs (se restablece a julio 2026, sin cierres históricos)
  await prisma.kpiSnapshot.deleteMany();
  await prisma.periodo.upsert({
    where: { id: 1 },
    update: { mes: 7, anio: 2026 },
    create: { id: 1, mes: 7, anio: 2026 },
  });

  // Reunión de dirección de ejemplo (14 mayo 2025)
  await prisma.meeting.deleteMany();
  const todos = Object.values(usuariosPorSlug);
  await prisma.meeting.create({
    data: {
      titulo: "Reunión de Dirección — Mayo 2025",
      fecha: new Date("2025-05-14T00:00:00Z"),
      hora: "09:00",
      lugar: "Sala de Dirección",
      tipo: MeetingType.ORDINARIA,
      frecuencia: Frequency.MENSUAL,
      estado: MeetingStatus.REALIZADA,
      objetivo: "Revisar avance de compromisos y resultados por área.",
      asistentes: { connect: todos.map((id) => ({ id })) },
      agenda: {
        create: AGENDA_DEFAULT.map((a, i) => ({
          titulo: a.titulo,
          descripcion: a.descripcion,
          duracion: a.duracion,
          orden: i,
          estado: AgendaItemStatus.COMPLETADO,
        })),
      },
    },
  });

  // Reconocimientos (muro): posts con likes y comentarios
  await prisma.recognition.deleteMany();
  const post1 = await prisma.recognition.create({
    data: {
      autorId: usuariosPorSlug["guillermo"],
      mensaje: "Quiero reconocer a todo el equipo de Operaciones por su compromiso y resultados este mes. ¡Sigamos así!",
      tipo: "reconocimiento",
      fecha: new Date("2026-07-20T00:00:00Z"),
      likes: { create: [{ userId: usuariosPorSlug["maria"] }, { userId: usuariosPorSlug["ana"] }] },
      comentarios: { create: [{ autorId: usuariosPorSlug["maria"], texto: "¡Gracias Guillermo! Equipo increíble." }] },
    },
  });
  void post1;
  await prisma.recognition.create({ data: { autorId: usuariosPorSlug["ana"], mensaje: "¡Felicidades al equipo! Cumplimos al 100% los compromisos del mes.", fecha: new Date("2026-07-15T00:00:00Z") } });
  await prisma.recognition.create({ data: { autorId: usuariosPorSlug["jose"], mensaje: "Gran trabajo en la implementación de los reportes semanales.", fecha: new Date("2026-07-10T00:00:00Z") } });

  console.log("Listo. Usuarios de acceso (usuario / contraseña):");
  for (const p of PERSONAS) console.log(`  ${p.usuario} / ${p.password}  (${p.puesto})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
