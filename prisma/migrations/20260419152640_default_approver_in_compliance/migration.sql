/*
  Warnings:

  - You are about to drop the column `finalApproverId` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `paymentApproverId` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `paymentProcessorId` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `processorId` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `verifierId` on the `compliance_record` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_finalApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_paymentApproverId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_paymentProcessorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_processorId_fkey";

-- DropForeignKey
ALTER TABLE "compliance_record" DROP CONSTRAINT "compliance_record_verifierId_fkey";

-- AlterTable
ALTER TABLE "compliance_record" DROP COLUMN "finalApproverId",
DROP COLUMN "paymentApproverId",
DROP COLUMN "paymentProcessorId",
DROP COLUMN "processorId",
DROP COLUMN "verifierId",
ADD COLUMN     "actualFinalApproverId" TEXT,
ADD COLUMN     "actualPaymentApproverId" TEXT,
ADD COLUMN     "actualPaymentProcessorId" TEXT,
ADD COLUMN     "actualProcessorId" TEXT,
ADD COLUMN     "actualVerifierId" TEXT,
ADD COLUMN     "assignedFinalApproverId" TEXT,
ADD COLUMN     "assignedPaymentApproverId" TEXT,
ADD COLUMN     "assignedPaymentProcessorId" TEXT,
ADD COLUMN     "assignedProcessorId" TEXT,
ADD COLUMN     "assignedVerifierId" TEXT;

-- CreateTable
CREATE TABLE "compliance_setting" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "defaultProcessorId" TEXT,
    "defaultVerifierId" TEXT,
    "defaultPaymentProcessorId" TEXT,
    "defaultPaymentApproverId" TEXT,
    "defaultFinalApproverId" TEXT,
    "defaultSalesOfficerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compliance_setting_clientId_key" ON "compliance_setting"("clientId");

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedProcessorId_fkey" FOREIGN KEY ("assignedProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualProcessorId_fkey" FOREIGN KEY ("actualProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedVerifierId_fkey" FOREIGN KEY ("assignedVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualVerifierId_fkey" FOREIGN KEY ("actualVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedPaymentProcessorId_fkey" FOREIGN KEY ("assignedPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualPaymentProcessorId_fkey" FOREIGN KEY ("actualPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedPaymentApproverId_fkey" FOREIGN KEY ("assignedPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualPaymentApproverId_fkey" FOREIGN KEY ("actualPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_assignedFinalApproverId_fkey" FOREIGN KEY ("assignedFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_actualFinalApproverId_fkey" FOREIGN KEY ("actualFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultProcessorId_fkey" FOREIGN KEY ("defaultProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultVerifierId_fkey" FOREIGN KEY ("defaultVerifierId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultPaymentProcessorId_fkey" FOREIGN KEY ("defaultPaymentProcessorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultPaymentApproverId_fkey" FOREIGN KEY ("defaultPaymentApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultFinalApproverId_fkey" FOREIGN KEY ("defaultFinalApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_setting" ADD CONSTRAINT "compliance_setting_defaultSalesOfficerId_fkey" FOREIGN KEY ("defaultSalesOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
