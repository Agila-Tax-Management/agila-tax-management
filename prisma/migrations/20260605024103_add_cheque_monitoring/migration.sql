-- CreateEnum
CREATE TYPE "ChequeStatus" AS ENUM ('FOR_CLEARING', 'CLEARED', 'BOUNCED');

-- AlterEnum
ALTER TYPE "ClientFundTransactionType" ADD VALUE 'CHEQUE_CLEARING';

-- AlterTable
ALTER TABLE "client_fund_transaction" ADD COLUMN     "chequeMonitoringId" TEXT;

-- CreateTable
CREATE TABLE "cheque_monitoring" (
    "id" TEXT NOT NULL,
    "chequeNo" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "clientId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "invoiceId" TEXT,
    "paymentId" TEXT,
    "status" "ChequeStatus" NOT NULL DEFAULT 'FOR_CLEARING',
    "clearedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "receivedById" TEXT,
    "processedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cheque_monitoring_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cheque_monitoring_clientId_idx" ON "cheque_monitoring"("clientId");

-- CreateIndex
CREATE INDEX "cheque_monitoring_status_idx" ON "cheque_monitoring"("status");

-- CreateIndex
CREATE INDEX "cheque_monitoring_chequeDate_idx" ON "cheque_monitoring"("chequeDate");

-- AddForeignKey
ALTER TABLE "client_fund_transaction" ADD CONSTRAINT "client_fund_transaction_chequeMonitoringId_fkey" FOREIGN KEY ("chequeMonitoringId") REFERENCES "cheque_monitoring"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_monitoring" ADD CONSTRAINT "cheque_monitoring_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_monitoring" ADD CONSTRAINT "cheque_monitoring_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_monitoring" ADD CONSTRAINT "cheque_monitoring_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_monitoring" ADD CONSTRAINT "cheque_monitoring_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cheque_monitoring" ADD CONSTRAINT "cheque_monitoring_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
