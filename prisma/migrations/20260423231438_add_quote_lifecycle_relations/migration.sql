-- AddColumn: quoteId to invoice (one invoice per quote, nullable, unique)
ALTER TABLE "invoice" ADD COLUMN "quoteId" TEXT;
CREATE UNIQUE INDEX "invoice_quoteId_key" ON "invoice"("quoteId");
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterColumn: make leadId nullable on job_order
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_leadId_fkey";
ALTER TABLE "job_order" ALTER COLUMN "leadId" DROP NOT NULL;
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddColumn: quoteId to job_order (nullable, can have multiple JOs per quote in theory)
ALTER TABLE "job_order" ADD COLUMN "quoteId" TEXT;
CREATE INDEX "job_order_quoteId_idx" ON "job_order"("quoteId");
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;
