/*
  Warnings:

  - The values [GOODS_FOR_SALE,GOODS_NOT_FOR_SALE,SERVICES,CAPITAL_GOODS,OTHER_INPUT_VAT,NON_VAT_PURCHASE] on the enum `BirExpenseCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `capitalGoodsLife` on the `expense_record` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "BirExpenseCategory_new" AS ENUM ('CAPITAL_GOODS_EXCEEDING_1M', 'CAPITAL_GOODS_NOT_EXCEEDING_1M', 'DOMESTIC_GOODS', 'IMPORTED_GOODS', 'DOMESTIC_SERVICES', 'NONRESIDENT_SERVICES', 'NON_QUALIFIED');
ALTER TABLE "expense_record" ALTER COLUMN "birCategory" TYPE "BirExpenseCategory_new" USING ("birCategory"::text::"BirExpenseCategory_new");
ALTER TYPE "BirExpenseCategory" RENAME TO "BirExpenseCategory_old";
ALTER TYPE "BirExpenseCategory_new" RENAME TO "BirExpenseCategory";
DROP TYPE "public"."BirExpenseCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "compliance_record" ADD COLUMN     "excessInputTaxCarryForward" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "payableVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalInputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalOutputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "expense_record" DROP COLUMN "capitalGoodsLife",
ADD COLUMN     "journalEntryId" TEXT;

-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "journalEntryId" TEXT;

-- AlterTable
ALTER TABLE "sales_record" ADD COLUMN     "journalEntryId" TEXT;

-- CreateTable
CREATE TABLE "vat_month" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "coverageMonth" DATE NOT NULL,
    "outputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "inputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vat_month_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vat_month_complianceRecordId_idx" ON "vat_month"("complianceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "vat_month_complianceRecordId_coverageMonth_key" ON "vat_month"("complianceRecordId", "coverageMonth");

-- CreateIndex
CREATE INDEX "expense_record_journalEntryId_idx" ON "expense_record"("journalEntryId");

-- CreateIndex
CREATE INDEX "invoice_journalEntryId_idx" ON "invoice"("journalEntryId");

-- CreateIndex
CREATE INDEX "sales_record_journalEntryId_idx" ON "sales_record"("journalEntryId");

-- AddForeignKey
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_record" ADD CONSTRAINT "expense_record_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_record" ADD CONSTRAINT "sales_record_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vat_month" ADD CONSTRAINT "vat_month_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;
