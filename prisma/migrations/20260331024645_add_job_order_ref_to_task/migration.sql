-- AlterTable
ALTER TABLE "task" ADD COLUMN     "jobOrderId" TEXT;

-- CreateIndex
CREATE INDEX "task_jobOrderId_idx" ON "task"("jobOrderId");

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "job_order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
