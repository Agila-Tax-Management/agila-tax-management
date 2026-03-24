-- AlterTable
ALTER TABLE "lead" ADD COLUMN     "promoId" INTEGER;

-- AddForeignKey
ALTER TABLE "lead" ADD CONSTRAINT "lead_promoId_fkey" FOREIGN KEY ("promoId") REFERENCES "promo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
