/*
  Warnings:

  - A unique constraint covering the columns `[clientComplianceId,coverageDate,amendmentVersion,filingFrequency]` on the table `compliance_record` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `compliance_record` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FilingFrequency" AS ENUM ('MONTHLY', 'QUARTERLY', 'ANNUAL');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('CUSTOMER', 'SUPPLIER', 'BOTH');

-- CreateEnum
CREATE TYPE "BirExpenseCategory" AS ENUM ('GOODS_FOR_SALE', 'GOODS_NOT_FOR_SALE', 'SERVICES', 'CAPITAL_GOODS', 'OTHER_INPUT_VAT', 'NON_VAT_PURCHASE');

-- CreateEnum
CREATE TYPE "BirInvoiceType" AS ENUM ('OFFICIAL_RECEIPT', 'SALES_INVOICE', 'CASH_INVOICE', 'CHARGE_INVOICE', 'SERVICE_INVOICE', 'BILLING_INVOICE', 'MISCELLANEOUS_INVOICE', 'CREDIT_MEMO', 'DEBIT_MEMO');

-- DropIndex
DROP INDEX "compliance_record_clientComplianceId_coverageDate_amendment_key";

-- AlterTable
ALTER TABLE "client_compliance" ADD COLUMN     "autoGenerateRecords" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "compliance_record" ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "filingFrequency" "FilingFrequency" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "parentRecordId" TEXT,
ADD COLUMN     "totalTaxWithheld" DECIMAL(12,2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE "ewt_item" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "contact" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "tin" TEXT,
    "isVatRegistered" BOOLEAN NOT NULL DEFAULT false,
    "type" "ContactType" NOT NULL DEFAULT 'BOTH',
    "address" TEXT,
    "contactNumber" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item_template" (
    "id" TEXT NOT NULL,
    "clientComplianceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isVatable" BOOLEAN NOT NULL DEFAULT true,
    "defaultGrossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ewt_item_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ewt_item_template_history" (
    "id" TEXT NOT NULL,
    "ewtItemTemplateId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "changeNotes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ewt_item_template_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_record" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "receiptUrls" TEXT[],
    "documentType" "BirInvoiceType" NOT NULL,
    "transactionDate" DATE NOT NULL,
    "contactId" INTEGER,
    "contactName" TEXT,
    "contactTin" TEXT,
    "contactIsVat" BOOLEAN NOT NULL DEFAULT false,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "inputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netOfVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "birCategory" "BirExpenseCategory" NOT NULL,
    "isCapitalGoods" BOOLEAN NOT NULL DEFAULT false,
    "capitalGoodsLife" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expense_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "percentage_tax_month" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "coverageMonth" DATE NOT NULL,
    "pt010Sales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pt010TaxDue" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pt150Sales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "pt150TaxDue" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalSales" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "totalTaxDue" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "isFinalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "percentage_tax_month_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_invoice_counter" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "invoiceType" "BirInvoiceType" NOT NULL,
    "prefix" TEXT NOT NULL DEFAULT '',
    "startingNumber" INTEGER NOT NULL DEFAULT 1,
    "currentNumber" INTEGER NOT NULL DEFAULT 1,
    "digitPadding" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_invoice_counter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_record" (
    "id" TEXT NOT NULL,
    "complianceRecordId" TEXT NOT NULL,
    "serialNo" TEXT NOT NULL,
    "documentType" "BirInvoiceType" NOT NULL,
    "transactionDate" DATE NOT NULL,
    "contactId" INTEGER,
    "contactName" TEXT,
    "contactTin" TEXT,
    "contactIsVat" BOOLEAN NOT NULL DEFAULT false,
    "account" TEXT,
    "grossAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "outputVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "netOfVat" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "isPt010" BOOLEAN NOT NULL DEFAULT false,
    "isPt150" BOOLEAN NOT NULL DEFAULT false,
    "nonVatAmount" DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_record_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_clientId_idx" ON "contact"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "contact_clientId_tin_key" ON "contact"("clientId", "tin");

-- CreateIndex
CREATE INDEX "ewt_item_template_clientComplianceId_idx" ON "ewt_item_template"("clientComplianceId");

-- CreateIndex
CREATE INDEX "ewt_item_template_history_ewtItemTemplateId_idx" ON "ewt_item_template_history"("ewtItemTemplateId");

-- CreateIndex
CREATE INDEX "expense_record_complianceRecordId_idx" ON "expense_record"("complianceRecordId");

-- CreateIndex
CREATE INDEX "expense_record_transactionDate_idx" ON "expense_record"("transactionDate");

-- CreateIndex
CREATE INDEX "percentage_tax_month_complianceRecordId_idx" ON "percentage_tax_month"("complianceRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "percentage_tax_month_complianceRecordId_coverageMonth_key" ON "percentage_tax_month"("complianceRecordId", "coverageMonth");

-- CreateIndex
CREATE INDEX "sales_invoice_counter_clientId_idx" ON "sales_invoice_counter"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_invoice_counter_clientId_invoiceType_key" ON "sales_invoice_counter"("clientId", "invoiceType");

-- CreateIndex
CREATE INDEX "sales_record_complianceRecordId_idx" ON "sales_record"("complianceRecordId");

-- CreateIndex
CREATE INDEX "sales_record_transactionDate_idx" ON "sales_record"("transactionDate");

-- CreateIndex
CREATE INDEX "compliance_record_clientId_idx" ON "compliance_record"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "compliance_record_clientComplianceId_coverageDate_amendment_key" ON "compliance_record"("clientComplianceId", "coverageDate", "amendmentVersion", "filingFrequency");

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compliance_record" ADD CONSTRAINT "compliance_record_parentRecordId_fkey" FOREIGN KEY ("parentRecordId") REFERENCES "compliance_record"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact" ADD CONSTRAINT "contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item" ADD CONSTRAINT "ewt_item_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ewt_item_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_template" ADD CONSTRAINT "ewt_item_template_clientComplianceId_fkey" FOREIGN KEY ("clientComplianceId") REFERENCES "client_compliance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_template_history" ADD CONSTRAINT "ewt_item_template_history_ewtItemTemplateId_fkey" FOREIGN KEY ("ewtItemTemplateId") REFERENCES "ewt_item_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ewt_item_template_history" ADD CONSTRAINT "ewt_item_template_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_record" ADD CONSTRAINT "expense_record_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_record" ADD CONSTRAINT "expense_record_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "percentage_tax_month" ADD CONSTRAINT "percentage_tax_month_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_invoice_counter" ADD CONSTRAINT "sales_invoice_counter_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_record" ADD CONSTRAINT "sales_record_complianceRecordId_fkey" FOREIGN KEY ("complianceRecordId") REFERENCES "compliance_record"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_record" ADD CONSTRAINT "sales_record_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
