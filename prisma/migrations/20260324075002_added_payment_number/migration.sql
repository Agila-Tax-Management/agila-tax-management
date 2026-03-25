/*
  Warnings:

  - A unique constraint covering the columns `[paymentNumber]` on the table `payment` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymentNumber` to the `payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "payment" ADD COLUMN     "paymentNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payment_paymentNumber_key" ON "payment"("paymentNumber");
