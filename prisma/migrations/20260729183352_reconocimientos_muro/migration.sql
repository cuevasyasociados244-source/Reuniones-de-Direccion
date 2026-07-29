-- AlterTable
ALTER TABLE "Recognition" ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'reconocimiento';

-- CreateTable
CREATE TABLE "RecognitionLike" (
    "id" TEXT NOT NULL,
    "recognitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecognitionLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecognitionComment" (
    "id" TEXT NOT NULL,
    "recognitionId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecognitionComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecognitionLike_recognitionId_idx" ON "RecognitionLike"("recognitionId");

-- CreateIndex
CREATE UNIQUE INDEX "RecognitionLike_recognitionId_userId_key" ON "RecognitionLike"("recognitionId", "userId");

-- CreateIndex
CREATE INDEX "RecognitionComment_recognitionId_idx" ON "RecognitionComment"("recognitionId");

-- AddForeignKey
ALTER TABLE "RecognitionLike" ADD CONSTRAINT "RecognitionLike_recognitionId_fkey" FOREIGN KEY ("recognitionId") REFERENCES "Recognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionLike" ADD CONSTRAINT "RecognitionLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionComment" ADD CONSTRAINT "RecognitionComment_recognitionId_fkey" FOREIGN KEY ("recognitionId") REFERENCES "Recognition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecognitionComment" ADD CONSTRAINT "RecognitionComment_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
