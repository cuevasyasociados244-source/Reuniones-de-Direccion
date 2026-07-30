-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT '',
    "tamano" INTEGER NOT NULL DEFAULT 0,
    "area" TEXT NOT NULL DEFAULT '',
    "subidoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Documento_createdAt_idx" ON "Documento"("createdAt");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
