-- AlterTable
ALTER TABLE "quote" ADD COLUMN     "clientId" INTEGER,
ALTER COLUMN "leadId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "quote_leadId_idx" ON "quote"("leadId");

-- CreateIndex
CREATE INDEX "quote_clientId_idx" ON "quote"("clientId");

-- AddForeignKey
ALTER TABLE "quote" ADD CONSTRAINT "quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
