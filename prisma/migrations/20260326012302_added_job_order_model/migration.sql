-- CreateEnum
CREATE TYPE "JobOrderStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobOrderItemType" AS ENUM ('SUBSCRIPTION', 'ONE_TIME');

-- CreateTable
CREATE TABLE "job_order" (
    "id" TEXT NOT NULL,
    "jobOrderNumber" TEXT NOT NULL,
    "leadId" INTEGER NOT NULL,
    "clientId" INTEGER,
    "date" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "JobOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "preparedById" TEXT,
    "datePrepared" TIMESTAMP(3),
    "accountManagerId" TEXT,
    "dateAccountManagerAck" TIMESTAMP(3),
    "operationsManagerId" TEXT,
    "dateOperationsManagerAck" TIMESTAMP(3),
    "executiveId" TEXT,
    "dateExecutiveAck" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_order_item" (
    "id" TEXT NOT NULL,
    "jobOrderId" TEXT NOT NULL,
    "itemType" "JobOrderItemType" NOT NULL,
    "serviceName" TEXT NOT NULL,
    "rate" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total" DECIMAL(10,2) NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_order_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_order_jobOrderNumber_key" ON "job_order"("jobOrderNumber");

-- CreateIndex
CREATE INDEX "job_order_leadId_idx" ON "job_order"("leadId");

-- CreateIndex
CREATE INDEX "job_order_clientId_idx" ON "job_order"("clientId");

-- CreateIndex
CREATE INDEX "job_order_item_jobOrderId_idx" ON "job_order_item"("jobOrderId");

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_preparedById_fkey" FOREIGN KEY ("preparedById") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_accountManagerId_fkey" FOREIGN KEY ("accountManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_operationsManagerId_fkey" FOREIGN KEY ("operationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_executiveId_fkey" FOREIGN KEY ("executiveId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order_item" ADD CONSTRAINT "job_order_item_jobOrderId_fkey" FOREIGN KEY ("jobOrderId") REFERENCES "job_order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
