-- AlterTable
ALTER TABLE "work_schedule_day" ADD COLUMN     "isFlexible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locationType" TEXT NOT NULL DEFAULT 'OFFICE',
ADD COLUMN     "requiredHours" INTEGER,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "endTime" DROP NOT NULL;
