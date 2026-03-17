/*
  Warnings:

  - You are about to drop the column `bankDetails` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `disbursedMethod` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyRate` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `payType` on the `employee_employment` table. All the data in the column will be lost.
  - You are about to drop the column `weeklyRate` on the `employee_employment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('PROBATIONARY', 'REGULAR', 'CONTRACTUAL', 'PROJECT_BASED', 'CONSULTANT', 'INTERN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'ACTIVE', 'EXPIRED', 'TERMINATED');

-- AlterTable
ALTER TABLE "employee_employment" DROP COLUMN "bankDetails",
DROP COLUMN "dailyRate",
DROP COLUMN "disbursedMethod",
DROP COLUMN "hourlyRate",
DROP COLUMN "monthlyRate",
DROP COLUMN "payType",
DROP COLUMN "weeklyRate";

-- CreateTable
CREATE TABLE "employee_contract" (
    "id" SERIAL NOT NULL,
    "employmentId" INTEGER NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "status" "ContractStatus" NOT NULL,
    "contractStart" TIMESTAMP(3) NOT NULL,
    "contractEnd" TIMESTAMP(3),
    "monthlyRate" DECIMAL(10,2),
    "weeklyRate" DECIMAL(10,2),
    "dailyRate" DECIMAL(10,2),
    "hourlyRate" DECIMAL(10,2),
    "disbursedMethod" "DisbursedMethod",
    "payType" TEXT DEFAULT 'Variable Pay',
    "bankDetails" TEXT,
    "scheduleId" INTEGER,
    "workingHoursPerWeek" INTEGER,
    "signedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Manila',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_schedule_day" (
    "id" SERIAL NOT NULL,
    "scheduleId" INTEGER NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakStart" TEXT,
    "breakEnd" TEXT,
    "isWorkingDay" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_schedule_day_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_contract_employmentId_idx" ON "employee_contract"("employmentId");

-- AddForeignKey
ALTER TABLE "employee_contract" ADD CONSTRAINT "employee_contract_employmentId_fkey" FOREIGN KEY ("employmentId") REFERENCES "employee_employment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_contract" ADD CONSTRAINT "employee_contract_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_schedule_day" ADD CONSTRAINT "work_schedule_day_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "work_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
