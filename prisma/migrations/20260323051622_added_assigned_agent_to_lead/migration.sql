-- AlterTable
ALTER TABLE "lead" ADD COLUMN     "assignedAgentId" TEXT;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
