-- CreateTable
CREATE TABLE "MeetingImage" (
    "id" TEXT NOT NULL,
    "meetingId" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MeetingImage_meetingId_idx" ON "MeetingImage"("meetingId");

-- AddForeignKey
ALTER TABLE "MeetingImage" ADD CONSTRAINT "MeetingImage_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
