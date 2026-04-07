-- CreateEnum
CREATE TYPE "FinancialStatementGroup" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "JournalTransactionType" AS ENUM ('JOURNAL_ENTRY', 'INVOICE', 'PAYMENT', 'EXPENSE', 'RECEIPT');

-- CreateEnum
CREATE TYPE "JournalEntryStatus" AS ENUM ('DRAFT', 'POSTED');

-- CreateTable
CREATE TABLE "account_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "group" "FinancialStatementGroup" NOT NULL,
    "normalBalance" "NormalBalance" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_detail_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "accountTypeId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_detail_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gl_account" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "accountCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "accountTypeId" INTEGER NOT NULL,
    "accountDetailTypeId" INTEGER NOT NULL,
    "parentId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBankAccount" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gl_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entry" (
    "id" TEXT NOT NULL,
    "referenceNo" TEXT NOT NULL,
    "transactionDate" DATE NOT NULL,
    "transactionType" "JournalTransactionType" NOT NULL DEFAULT 'JOURNAL_ENTRY',
    "status" "JournalEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "clientId" INTEGER,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_entry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_line" (
    "id" TEXT NOT NULL,
    "journalEntryId" TEXT NOT NULL,
    "glAccountId" TEXT NOT NULL,
    "debit" DECIMAL(15,2),
    "credit" DECIMAL(15,2),
    "description" TEXT,
    "name" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journal_line_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "account_type_name_key" ON "account_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "account_detail_type_accountTypeId_name_key" ON "account_detail_type"("accountTypeId", "name");

-- CreateIndex
CREATE INDEX "gl_account_clientId_idx" ON "gl_account"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "gl_account_clientId_accountCode_key" ON "gl_account"("clientId", "accountCode");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entry_referenceNo_key" ON "journal_entry"("referenceNo");

-- CreateIndex
CREATE INDEX "journal_entry_transactionDate_idx" ON "journal_entry"("transactionDate");

-- CreateIndex
CREATE INDEX "journal_entry_clientId_idx" ON "journal_entry"("clientId");

-- CreateIndex
CREATE INDEX "journal_entry_status_idx" ON "journal_entry"("status");

-- CreateIndex
CREATE INDEX "journal_line_journalEntryId_idx" ON "journal_line"("journalEntryId");

-- CreateIndex
CREATE INDEX "journal_line_glAccountId_idx" ON "journal_line"("glAccountId");

-- AddForeignKey
ALTER TABLE "account_detail_type" ADD CONSTRAINT "account_detail_type_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "account_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_accountTypeId_fkey" FOREIGN KEY ("accountTypeId") REFERENCES "account_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_accountDetailTypeId_fkey" FOREIGN KEY ("accountDetailTypeId") REFERENCES "account_detail_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gl_account" ADD CONSTRAINT "gl_account_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "gl_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_line" ADD CONSTRAINT "journal_line_glAccountId_fkey" FOREIGN KEY ("glAccountId") REFERENCES "gl_account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
