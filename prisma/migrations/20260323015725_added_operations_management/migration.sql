/*
  Warnings:

  - The values [ACCOUNT_OFFICER] on the enum `AppPortal` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AppPortal_new" AS ENUM ('SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'OPERATIONS_MANAGEMENT', 'HR', 'TASK_MANAGEMENT', 'CLIENT_RELATIONS');
ALTER TABLE "App" ALTER COLUMN "name" TYPE "AppPortal_new" USING ("name"::text::"AppPortal_new");
ALTER TYPE "AppPortal" RENAME TO "AppPortal_old";
ALTER TYPE "AppPortal_new" RENAME TO "AppPortal";
DROP TYPE "public"."AppPortal_old";
COMMIT;

-- AlterTable
ALTER TABLE "atms_clients" ADD COLUMN     "clientRelationOfficerId" TEXT,
ADD COLUMN     "operationsManagerId" TEXT;

-- AlterTable
ALTER TABLE "client_user_assignment" ALTER COLUMN "role" SET DEFAULT 'OWNER';

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_clientRelationOfficerId_fkey" FOREIGN KEY ("clientRelationOfficerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_operationsManagerId_fkey" FOREIGN KEY ("operationsManagerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
