/*
  Warnings:

  - You are about to drop the column `bankDetails` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `disbursedMethod` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employmentType` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `hierarchy` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyRate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `pagibig` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `payType` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `pcfRole` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `philhealth` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `positionId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `sss` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `teamId` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `tokenExpiry` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyRate` on the `Employee` table. All the data in the column will be lost.
  - You are about to drop the column `employeeId` on the `EmployeeTeam` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[clientId,name]` on the table `Department` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[clientId,name]` on the table `EmployeeTeam` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `clientId` to the `Department` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clientId` to the `EmployeeTeam` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('ACTIVE', 'RESIGNED', 'TERMINATED', 'ON_LEAVE', 'SUSPENDED', 'RETIRED');

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_positionId_fkey";

-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT "Employee_teamId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeTeam" DROP CONSTRAINT "EmployeeTeam_employeeId_fkey";

-- DropIndex
DROP INDEX "Department_name_key";

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "clientId" INTEGER NOT NULL,
ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "Employee" DROP COLUMN "bankDetails",
DROP COLUMN "dailyRate",
DROP COLUMN "departmentId",
DROP COLUMN "disbursedMethod",
DROP COLUMN "employmentType",
DROP COLUMN "hierarchy",
DROP COLUMN "hourlyRate",
DROP COLUMN "monthlyRate",
DROP COLUMN "pagibig",
DROP COLUMN "payType",
DROP COLUMN "pcfRole",
DROP COLUMN "philhealth",
DROP COLUMN "positionId",
DROP COLUMN "resetToken",
DROP COLUMN "sss",
DROP COLUMN "startDate",
DROP COLUMN "teamId",
DROP COLUMN "tokenExpiry",
DROP COLUMN "weeklyRate";

-- AlterTable
ALTER TABLE "EmployeeTeam" DROP COLUMN "employeeId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "employee_government_ids" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "sss" TEXT,
    "pagibig" TEXT,
    "philhealth" TEXT,
    "tin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_government_ids_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_employment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "departmentId" INTEGER,
    "positionId" INTEGER,
    "teamId" INTEGER,
    "employmentType" "EmploymentType",
    "employmentStatus" "EmploymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "employeeLevel" "EmployeeLevel",
    "hireDate" TIMESTAMP(3),
    "regularizationDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "reportingManagerId" INTEGER,
    "monthlyRate" DECIMAL(10,2),
    "weeklyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "hourlyRate" DECIMAL(10,2),
    "disbursedMethod" "DisbursedMethod",
    "payType" TEXT DEFAULT 'Variable Pay',
    "bankDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_employment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_government_ids_employeeId_key" ON "employee_government_ids"("employeeId");

-- CreateIndex
CREATE INDEX "employee_employment_employeeId_employmentStatus_idx" ON "employee_employment"("employeeId", "employmentStatus");

-- CreateIndex
CREATE INDEX "employee_employment_clientId_idx" ON "employee_employment"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Department_clientId_name_key" ON "Department"("clientId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeTeam_clientId_name_key" ON "EmployeeTeam"("clientId", "name");

-- AddForeignKey
ALTER TABLE "employee_government_ids" ADD CONSTRAINT "employee_government_ids_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeTeam" ADD CONSTRAINT "EmployeeTeam_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
