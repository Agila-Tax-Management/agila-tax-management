/*
  Warnings:

  - A unique constraint covering the columns `[clientId,name]` on the table `employee_level` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,position]` on the table `employee_level` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,name]` on the table `work_schedule` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `employee_level` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `work_schedule` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "employee_level_name_key";

-- DropIndex
DROP INDEX "employee_level_position_key";

-- AlterTable: add as nullable first so existing rows don't fail
ALTER TABLE "employee_level" ADD COLUMN "clientId" INTEGER;

-- Backfill: assign all existing employee_level rows to the ATMS client
UPDATE "employee_level"
SET "clientId" = (SELECT "id" FROM "atms_clients" WHERE "companyCode" = 'atms' LIMIT 1)
WHERE "clientId" IS NULL;

-- Now enforce NOT NULL
ALTER TABLE "employee_level" ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable: work_schedule has no rows so can go straight to NOT NULL
ALTER TABLE "work_schedule" ADD COLUMN "clientId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "employee_level_clientId_idx" ON "employee_level"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_clientId_name_key" ON "employee_level"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_clientId_position_key" ON "employee_level"("clientId", "position");

-- CreateIndex
CREATE INDEX "work_schedule_clientId_idx" ON "work_schedule"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedule_clientId_name_key" ON "work_schedule"("clientId", "name");

-- AddForeignKey
ALTER TABLE "work_schedule" ADD CONSTRAINT "work_schedule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_level" ADD CONSTRAINT "employee_level_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
