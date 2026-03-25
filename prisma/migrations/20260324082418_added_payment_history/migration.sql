-- CreateEnum
CREATE TYPE "PaymentChangeType" AS ENUM ('PAYMENT_RECORDED', 'PAYMENT_UPDATED', 'ALLOCATION_MODIFIED', 'STATUS_CHANGED', 'PAYMENT_VOIDED');

-- CreateTable
CREATE TABLE "payment_history" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "actorId" TEXT,
    "changeType" "PaymentChangeType" NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payment_history_paymentId_idx" ON "payment_history"("paymentId");

-- CreateIndex
CREATE INDEX "payment_history_paymentId_createdAt_idx" ON "payment_history"("paymentId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_history" ADD CONSTRAINT "payment_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
