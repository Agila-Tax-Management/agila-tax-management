/*
  Warnings:

  - The values [SUBMITTED,ACKNOWLEDGED] on the enum `JobOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `accountManagerId` on the `job_order` table. All the data in the column will be lost.
  - You are about to drop the column `executiveId` on the `job_order` table. All the data in the column will be lost.
  - You are about to drop the column `operationsManagerId` on the `job_order` table. All the data in the column will be lost.
  - You are about to drop the column `approvedById` on the `tsa_contract` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JobOrderStatus_new" AS ENUM ('DRAFT', 'PENDING_ACCOUNT_ACK', 'PENDING_OPERATIONS_ACK', 'PENDING_EXECUTIVE_ACK', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."job_order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "job_order" ALTER COLUMN "status" TYPE "JobOrderStatus_new" USING ("status"::text::"JobOrderStatus_new");
ALTER TYPE "JobOrderStatus" RENAME TO "JobOrderStatus_old";
ALTER TYPE "JobOrderStatus_new" RENAME TO "JobOrderStatus";
DROP TYPE "public"."JobOrderStatus_old";
ALTER TABLE "job_order" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_accountManagerId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_executiveId_fkey";

-- DropForeignKey
ALTER TABLE "job_order" DROP CONSTRAINT "job_order_operationsManagerId_fkey";

-- DropForeignKey
ALTER TABLE "tsa_contract" DROP CONSTRAINT "tsa_contract_approvedById_fkey";

-- AlterTable
ALTER TABLE "job_order" DROP COLUMN "accountManagerId",
DROP COLUMN "executiveId",
DROP COLUMN "operationsManagerId",
ADD COLUMN     "actualAccountManagerId" TEXT,
ADD COLUMN     "actualExecutiveId" TEXT,
ADD COLUMN     "actualOperationsManagerId" TEXT,
ADD COLUMN     "assignedAccountManagerId" TEXT,
ADD COLUMN     "assignedExecutiveId" TEXT,
ADD COLUMN     "assignedOperationsManagerId" TEXT;

-- AlterTable
ALTER TABLE "job_order_item" ADD COLUMN     "serviceId" INTEGER;

-- AlterTable
ALTER TABLE "tsa_contract" DROP COLUMN "approvedById",
ADD COLUMN     "actualApproverId" TEXT,
ADD COLUMN     "assignedApproverId" TEXT;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedAccountManagerId_fkey" FOREIGN KEY ("assignedAccountManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualAccountManagerId_fkey" FOREIGN KEY ("actualAccountManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedOperationsManagerId_fkey" FOREIGN KEY ("assignedOperationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualOperationsManagerId_fkey" FOREIGN KEY ("actualOperationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_assignedExecutiveId_fkey" FOREIGN KEY ("assignedExecutiveId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order" ADD CONSTRAINT "job_order_actualExecutiveId_fkey" FOREIGN KEY ("actualExecutiveId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_order_item" ADD CONSTRAINT "job_order_item_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_assignedApproverId_fkey" FOREIGN KEY ("assignedApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tsa_contract" ADD CONSTRAINT "tsa_contract_actualApproverId_fkey" FOREIGN KEY ("actualApproverId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
