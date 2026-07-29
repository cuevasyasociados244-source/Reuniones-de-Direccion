-- CreateEnum
CREATE TYPE "CommitmentStatus" AS ENUM ('NO_INICIADO', 'PROGRESO', 'COMPLETADO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('ALTA', 'MEDIA', 'BAJA');

-- CreateEnum
CREATE TYPE "CommitmentResult" AS ENUM ('SI', 'PARCIALMENTE', 'NO');

-- CreateEnum
CREATE TYPE "KpiStatus" AS ENUM ('OBJETIVO', 'RIESGO', 'FUERA');

-- CreateEnum
CREATE TYPE "KpiSense" AS ENUM ('MAYOR', 'MENOR');

-- CreateEnum
CREATE TYPE "CaptureMethod" AS ENUM ('MANUAL', 'GOOGLE_SHEETS', 'ERP');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('SEMANAL', 'MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('NO_INICIADA', 'PROGRESO', 'REALIZADA');

-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ORDINARIA', 'EXTRAORDINARIA');

-- CreateEnum
CREATE TYPE "AgendaItemStatus" AS ENUM ('NO_INICIADO', 'PROGRESO', 'COMPLETADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "puesto" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "iniciales" TEXT NOT NULL,
    "fotoUrl" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commitment" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "area" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "vence" TIMESTAMP(3) NOT NULL,
    "avance" INTEGER NOT NULL DEFAULT 0,
    "estado" "CommitmentStatus" NOT NULL DEFAULT 'NO_INICIADO',
    "indicador" TEXT NOT NULL DEFAULT '',
    "prioridad" "Priority" NOT NULL DEFAULT 'MEDIA',
    "resultado" "CommitmentResult",
    "causa" TEXT,
    "accionCorrectiva" TEXT,
    "nuevaFecha" TIMESTAMP(3),
    "meetingId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commitment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kpi" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "responsableId" TEXT,
    "frecuencia" "Frequency" NOT NULL DEFAULT 'MENSUAL',
    "unidadMedida" TEXT NOT NULL DEFAULT '',
    "tipoCalculo" TEXT NOT NULL DEFAULT '',
    "meta" TEXT NOT NULL DEFAULT '',
    "sentido" "KpiSense" NOT NULL DEFAULT 'MAYOR',
    "valorActual" TEXT NOT NULL DEFAULT '',
    "pct" INTEGER NOT NULL DEFAULT 0,
    "estado" "KpiStatus" NOT NULL DEFAULT 'FUERA',
    "fuenteDatos" TEXT NOT NULL DEFAULT '',
    "metodoCaptura" "CaptureMethod" NOT NULL DEFAULT 'MANUAL',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimaSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kpi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshot" (
    "id" TEXT NOT NULL,
    "mes" INTEGER NOT NULL,
    "anio" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KpiSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KpiSnapshotItem" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "meta" TEXT NOT NULL,
    "valorActual" TEXT NOT NULL,
    "pct" INTEGER NOT NULL,
    "estado" "KpiStatus" NOT NULL,

    CONSTRAINT "KpiSnapshotItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "hora" TEXT NOT NULL DEFAULT '',
    "lugar" TEXT NOT NULL DEFAULT '',
    "tipo" "MeetingType" NOT NULL DEFAULT 'ORDINARIA',
    "frecuencia" "Frequency" NOT NULL DEFAULT 'MENSUAL',
    "estado" "MeetingStatus" NOT NULL DEFAULT 'NO_INICIADA',
    "objetivo" TEXT NOT NULL DEFAULT '',
    "notas" TEXT NOT NULL DEFAULT '',
    "riesgos" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaItem" (
    "id" SERIAL NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "duracion" INTEGER NOT NULL DEFAULT 0,
    "estado" "AgendaItemStatus" NOT NULL DEFAULT 'NO_INICIADO',
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgendaItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Minute" (
    "id" TEXT NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',
    "riesgos" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Minute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinuteImage" (
    "id" TEXT NOT NULL,
    "minuteId" TEXT NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "MinuteImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgendaTemplateItem" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "frecuencia" "Frequency" NOT NULL DEFAULT 'MENSUAL',
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AgendaTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recognition" (
    "id" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recognition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MeetingAttendees" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MeetingAttendees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_usuario_key" ON "User"("usuario");

-- CreateIndex
CREATE INDEX "User_area_idx" ON "User"("area");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_nombre_key" ON "Department"("nombre");

-- CreateIndex
CREATE INDEX "Commitment_responsableId_idx" ON "Commitment"("responsableId");

-- CreateIndex
CREATE INDEX "Commitment_area_idx" ON "Commitment"("area");

-- CreateIndex
CREATE INDEX "Commitment_meetingId_idx" ON "Commitment"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_codigo_key" ON "Kpi"("codigo");

-- CreateIndex
CREATE INDEX "Kpi_area_idx" ON "Kpi"("area");

-- CreateIndex
CREATE INDEX "Kpi_responsableId_idx" ON "Kpi"("responsableId");

-- CreateIndex
CREATE UNIQUE INDEX "KpiSnapshot_mes_anio_key" ON "KpiSnapshot"("mes", "anio");

-- CreateIndex
CREATE INDEX "KpiSnapshotItem_snapshotId_idx" ON "KpiSnapshotItem"("snapshotId");

-- CreateIndex
CREATE INDEX "Meeting_fecha_idx" ON "Meeting"("fecha");

-- CreateIndex
CREATE INDEX "AgendaItem_meetingId_idx" ON "AgendaItem"("meetingId");

-- CreateIndex
CREATE INDEX "Minute_meetingId_idx" ON "Minute"("meetingId");

-- CreateIndex
CREATE INDEX "MinuteImage_minuteId_idx" ON "MinuteImage"("minuteId");

-- CreateIndex
CREATE INDEX "Recognition_autorId_idx" ON "Recognition"("autorId");

-- CreateIndex
CREATE INDEX "_MeetingAttendees_B_index" ON "_MeetingAttendees"("B");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commitment" ADD CONSTRAINT "Commitment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KpiSnapshotItem" ADD CONSTRAINT "KpiSnapshotItem_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "KpiSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgendaItem" ADD CONSTRAINT "AgendaItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Minute" ADD CONSTRAINT "Minute_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinuteImage" ADD CONSTRAINT "MinuteImage_minuteId_fkey" FOREIGN KEY ("minuteId") REFERENCES "Minute"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recognition" ADD CONSTRAINT "Recognition_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingAttendees" ADD CONSTRAINT "_MeetingAttendees_A_fkey" FOREIGN KEY ("A") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MeetingAttendees" ADD CONSTRAINT "_MeetingAttendees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
