-- CreateEnum
CREATE TYPE "FinancialStatementGroup" AS ENUM ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE');

-- CreateEnum
CREATE TYPE "NormalBalance" AS ENUM ('DEBIT', 'CREDIT');

-- AlterTable
ALTER TABLE "invoice_item" ADD COLUMN     "subscriptionId" INTEGER;

-- AlterTable
ALTER TABLE "quote_line_item" ADD COLUMN     "billingCycle" "BillingCycle",
ADD COLUMN     "commitmentMonths" INTEGER DEFAULT 6;

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

-- CreateIndex
CREATE UNIQUE INDEX "account_type_name_key" ON "account_type"("name");

-- CreateIndex
CREATE UNIQUE INDEX "account_detail_type_accountTypeId_name_key" ON "account_detail_type"("accountTypeId", "name");

-- CreateIndex
CREATE INDEX "gl_account_clientId_idx" ON "gl_account"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "gl_account_clientId_accountCode_key" ON "gl_account"("clientId", "accountCode");

-- CreateIndex
CREATE INDEX "invoice_item_subscriptionId_idx" ON "invoice_item"("subscriptionId");

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
ALTER TABLE "invoice_item" ADD CONSTRAINT "invoice_item_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "client_subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
