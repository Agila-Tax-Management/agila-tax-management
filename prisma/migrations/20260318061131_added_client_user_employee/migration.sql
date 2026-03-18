/*
  Warnings:

  - You are about to drop the `client_employee` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[clientUserId]` on the table `Employee` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "client_employee" DROP CONSTRAINT "client_employee_clientId_fkey";

-- DropForeignKey
ALTER TABLE "client_employee" DROP CONSTRAINT "client_employee_clientUserId_fkey";

-- DropForeignKey
ALTER TABLE "client_employee" DROP CONSTRAINT "client_employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "client_employee" DROP CONSTRAINT "client_employee_teamId_fkey";

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "clientUserId" TEXT;

-- DropTable
DROP TABLE "client_employee";

-- CreateIndex
CREATE UNIQUE INDEX "Employee_clientUserId_key" ON "Employee"("clientUserId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
