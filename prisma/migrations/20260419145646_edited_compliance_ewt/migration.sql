/*
  Warnings:

  - You are about to drop the column `emailConfirmUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `emailSubmissionUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `emailValidationUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `filedFormUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `paymentConfirmUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the column `qapExcelUrl` on the `compliance_record` table. All the data in the column will be lost.
  - You are about to drop the `ewt_rental_line_item` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clientSubscriptionId]` on the table `compliance_record` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientComplianceId,coverageDate,amendmentVersion]` on the table `compliance_record` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "InvoiceItemCategory" AS ENUM ('SERVICE_FEE', 'TAX_REIMBURSEMENT', 'GOV_FEE_REIMBURSEMENT', 'OUT_OF_POCKET');

-- CreateEnum
CREATE TYPE "ComplianceType" AS ENUM ('NONE', 'EWT', 'COMPENSATION', 'PERCENTAGE', 'VAT', 'INCOME_TAX', 'SSS', 'PHILHEALTH', 'PAGIBIG', 'LGU_RENEWAL');

-- DropForeignKey
ALTER TABLE "ewt_rental_line_item" DROP CONSTRAINT "ewt_rental_line_item_complianceRecordId_fkey";

-- DropIndex
DROP INDEX "compliance_record_clientComplianceId_coverageDate_key";

-- AlterTable
ALTER TABLE "client_subscription" ADD COLUMN     "clientComplianceId" TEXT;

-- AlterTable
ALTER TABLE "compliance_record" DROP COLUMN "emailConfirmUrl",
DROP COLUMN "emailSubmissionUrl",
DROP COLUMN "emailValidationUrl",
DROP COLUMN "filedFormUrl",
DROP COLUMN "paymentConfirmUrl",
DROP COLUMN "qapExcelUrl",
ADD COLUMN     "amendmentVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "clientSubscriptionId" INTEGER,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "originalRecordId" TEXT,
ADD COLUMN     "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "invoice_item" ADD COLUMN     "category" "InvoiceItemCategory" NOT NULL DEFAULT 'SERVICE_FEE',
ALTER COLUMN "isVatable" SET DEFAULT false;

-- AlterTable
ALTER TABLE "service" ADD COLUMN     "complianceType" "ComplianceType" NOT NULL DEFAULT 'NONE';

-- DropTable
DROP TABLE "ewt_rental_line_item";

-- CreateTable
CREATE TABLE "compliance_document" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "invoiceItemId" INTEGER,
    "name" TEXT NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "vatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netOfVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "expandedTaxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "effectiveMonth" TEXT NOT NULL,
    "fileUrls" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ewt_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item_history" (
    "id" TEXT NOT NULL,
    "ewtItemId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "changeNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ewt_item_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "compliance_document_complianceRecordId_idx" ON "compliance_document"("complianceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ewt_item_invoiceItemId_key" ON "ewt_item"("invoiceItemId");

-- CreateIndex
CREATE INDEX "ewt_item_complianceRecordId_idx" ON "ewt_item"("complianceRecordId");

-- CreateIndex
CREATE INDEX "ewt_item_history_ewtItemId_idx" ON "ewt_item_history"("ewtItemId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_record_clientSubscriptionId_key" ON "compliance_record"("clientSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_record_clientComplianceId_coverageDate_amendment_key" ON "compliance_record"("clientComplianceId", "coverageDate", "amendmentVersion");

-- AddForeignKey
ALTER TABLE "client_subscription" ADD CONSTRAINT "client_subscription_clientComplianceId_fkey" FOREIGN KEY ("clientComplianceId") REFERENCES "client_compliance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_originalRecordId_fkey" FOREIGN KEY ("originalRecordId") REFERENCES "compliance_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_clientSubscriptionId_fkey" FOREIGN KEY ("clientSubscriptionId") REFERENCES "client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_document" ADD CONSTRAINT "compliance_document_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item" ADD CONSTRAINT "ewt_item_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item" ADD CONSTRAINT "ewt_item_invoiceItemId_fkey" FOREIGN KEY ("invoiceItemId") REFERENCES "invoice_item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_history" ADD CONSTRAINT "ewt_item_history_ewtItemId_fkey" FOREIGN KEY ("ewtItemId") REFERENCES "ewt_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_history" ADD CONSTRAINT "ewt_item_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
