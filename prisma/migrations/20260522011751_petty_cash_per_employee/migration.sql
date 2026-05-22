-- DropForeignKey
ALTER TABLE "petty_cash" DROP CONSTRAINT "petty_cash_clientId_fkey";

-- AlterTable
ALTER TABLE "petty_cash" ALTER COLUMN "clientId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "petty_cash_item" ADD COLUMN     "clientFundBalanceSnapshot" DECIMAL(10,2),
ADD COLUMN     "clientId" INTEGER;

-- CreateIndex
CREATE INDEX "petty_cash_item_clientId_idx" ON "petty_cash_item"("clientId");

-- AddForeignKey
ALTER TABLE "petty_cash" ADD CONSTRAINT "petty_cash_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "petty_cash_item" ADD CONSTRAINT "petty_cash_item_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
