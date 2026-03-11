/*
  Warnings:

  - You are about to drop the column `canCreate` on the `EmployeeAppAccess` table. All the data in the column will be lost.
  - You are about to drop the column `canView` on the `EmployeeAppAccess` table. All the data in the column will be lost.
  - Changed the type of `name` on the `App` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AppPortal" AS ENUM ('SALES', 'COMPLIANCE', 'LIAISON', 'ACCOUNTING', 'ACCOUNT_OFFICER', 'HR');

-- AlterTable
ALTER TABLE "App" DROP COLUMN "name",
ADD COLUMN     "name" "AppPortal" NOT NULL;

-- AlterTable
ALTER TABLE "EmployeeAppAccess" DROP COLUMN "canCreate",
DROP COLUMN "canView",
ADD COLUMN     "canRead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canWrite" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "App_name_key" ON "App"("name");
