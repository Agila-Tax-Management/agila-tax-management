-- CreateEnum
CREATE TYPE "ClientFundTransactionType" AS ENUM ('INVOICE_PAYMENT', 'PETTY_CASH_DEBIT', 'MANUAL_CREDIT', 'MANUAL_DEBIT', 'REFUND');

-- CreateEnum
CREATE TYPE "PettyCashStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'DISBURSED', 'LIQUIDATED', 'REJECTED', 'VOID');

-- CreateEnum
CREATE TYPE "PettyCashItemCategory" AS ENUM ('EMPLOYEE_EXPENSE', 'CLIENT_FUND');

-- AlterEnum
ALTER TYPE "InvoiceItemCategory" ADD VALUE 'CLIENT_FUND_DEPOSIT';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "JournalTransactionType" ADD VALUE 'PETTY_CASH';
ALTER TYPE "JournalTransactionType" ADD VALUE 'CLIENT_FUND';

-- AlterTable
ALTER TABLE "invoice" ADD COLUMN     "isJournalized" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "isJournalized" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "journalEntryId" TEXT;

-- CreateTable
CREATE TABLE "accounting_setting" (
    "id" TEXT NOT NULL,
    "invoiceEmail" TEXT,
    "invoicePhoneNumber" TEXT,
    "defaultCustodianId" TEXT,
    "defaultAccountingManagerId" TEXT,
    "pcfNumberPrefix" TEXT NOT NULL DEFAULT 'PCF',
    "cftNumberPrefix" TEXT NOT NULL DEFAULT 'CFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounting_setting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_bank" (
    "id" SERIAL NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_bank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_ewallet" (
    "id" SERIAL NOT NULL,
    "eWalletName" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_ewallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method_cash" (
    "id" SERIAL NOT NULL,
    "payableTo" TEXT NOT NULL,
    "instructions" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_cash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_fund_transaction" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "ClientFundTransactionType" NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "pettyCashId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "runningBalance" DECIMAL(10,2) NOT NULL,
    "processedById" TEXT,
    "notes" TEXT,
    "journalEntryId" TEXT,
    "isJournalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_fund_transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash" (
    "id" TEXT NOT NULL,
    "pcfNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" INTEGER NOT NULL,
    "purpose" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "custodianId" TEXT,
    "custodianApprovedAt" TIMESTAMP(3),
    "accountingManagerId" TEXT,
    "accountingManagerApprovedAt" TIMESTAMP(3),
    "status" "PettyCashStatus" NOT NULL DEFAULT 'DRAFT',
    "totalRequestedAmount" DECIMAL(10,2) NOT NULL,
    "totalEmployeeExpenses" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalClientFundUsed" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "clientFundBalanceSnapshot" DECIMAL(10,2),
    "custodianNotes" TEXT,
    "managerNotes" TEXT,
    "rejectionReason" TEXT,
    "journalEntryId" TEXT,
    "isJournalized" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petty_cash_item" (
    "id" SERIAL NOT NULL,
    "pettyCashId" TEXT NOT NULL,
    "category" "PettyCashItemCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "receiptNumber" TEXT,
    "receiptUrl" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "petty_cash_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_fund_transaction_transactionNo_key" ON "client_fund_transaction"("transactionNo");

-- CreateIndex
CREATE INDEX "client_fund_transaction_clientId_idx" ON "client_fund_transaction"("clientId");

-- CreateIndex
CREATE INDEX "client_fund_transaction_clientId_date_idx" ON "client_fund_transaction"("clientId", "date" DESC);

-- CreateIndex
CREATE INDEX "client_fund_transaction_type_idx" ON "client_fund_transaction"("type");

-- CreateIndex
CREATE INDEX "client_fund_transaction_isJournalized_idx" ON "client_fund_transaction"("isJournalized");

-- CreateIndex
CREATE INDEX "client_fund_transaction_journalEntryId_idx" ON "client_fund_transaction"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "petty_cash_pcfNo_key" ON "petty_cash"("pcfNo");

-- CreateIndex
CREATE INDEX "petty_cash_clientId_idx" ON "petty_cash"("clientId");

-- CreateIndex
CREATE INDEX "petty_cash_status_idx" ON "petty_cash"("status");

-- CreateIndex
CREATE INDEX "petty_cash_requestedById_idx" ON "petty_cash"("requestedById");

-- CreateIndex
CREATE INDEX "petty_cash_isJournalized_idx" ON "petty_cash"("isJournalized");

-- CreateIndex
CREATE INDEX "petty_cash_journalEntryId_idx" ON "petty_cash"("journalEntryId");

-- CreateIndex
CREATE INDEX "petty_cash_item_pettyCashId_idx" ON "petty_cash_item"("pettyCashId");

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_pettyCashId_fkey" FOREIGN KEY ("pettyCashId") REFERENCES "petty_cash"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment" ADD CONSTRAINT "payment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_custodianId_fkey" FOREIGN KEY ("custodianId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_accountingManagerId_fkey" FOREIGN KEY ("accountingManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_item" ADD CONSTRAINT "petty_cash_item_pettyCashId_fkey" FOREIGN KEY ("pettyCashId") REFERENCES "petty_cash"("id") ON DELETE CASCADE ON UPDATE CASCADE;
