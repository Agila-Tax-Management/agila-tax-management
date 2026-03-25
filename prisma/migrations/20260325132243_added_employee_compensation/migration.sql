/*
  Warnings:

  - You are about to drop the column `allowanceRate` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `bankDetails` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `dailyRate` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `deductPagibig` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `deductPhilhealth` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `deductSss` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `deductTax` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `disbursedMethod` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `hourlyRate` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyRate` on the `employee_contract` table. All the data in the column will be lost.
  - You are about to drop the column `payType` on the `employee_contract` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SalaryRateType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "SalaryFrequency" AS ENUM ('ONCE_A_MONTH', 'TWICE_A_MONTH', 'WEEKLY');

-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('FIXED_PAY', 'VARIABLE_PAY');

-- CreateEnum
CREATE TYPE "DisbursementType" AS ENUM ('CASH', 'BANK_TRANSFER', 'CHEQUE', 'E_WALLET');

-- AlterTable
ALTER TABLE "employee_contract" DROP COLUMN "allowanceRate",
DROP COLUMN "bankDetails",
DROP COLUMN "dailyRate",
DROP COLUMN "deductPagibig",
DROP COLUMN "deductPhilhealth",
DROP COLUMN "deductSss",
DROP COLUMN "deductTax",
DROP COLUMN "disbursedMethod",
DROP COLUMN "hourlyRate",
DROP COLUMN "monthlyRate",
DROP COLUMN "payType";

-- CreateTable
CREATE TABLE "employee_compensation" (
    "id" TEXT NOT NULL,
    "contractId" INTEGER NOT NULL,
    "baseRate" DECIMAL(10,2) NOT NULL,
    "allowanceRate" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "rateType" "SalaryRateType" NOT NULL DEFAULT 'DAILY',
    "frequency" "SalaryFrequency" NOT NULL DEFAULT 'TWICE_A_MONTH',
    "payType" "PayType" NOT NULL DEFAULT 'VARIABLE_PAY',
    "disbursementType" "DisbursementType" NOT NULL DEFAULT 'CASH',
    "bankDetails" TEXT,
    "isPaidRestDays" BOOLEAN NOT NULL DEFAULT false,
    "restDaysPerWeek" INTEGER NOT NULL DEFAULT 1,
    "doleFactor" DECIMAL(5,2) NOT NULL,
    "deductSss" BOOLEAN NOT NULL DEFAULT false,
    "deductPhilhealth" BOOLEAN NOT NULL DEFAULT false,
    "deductPagibig" BOOLEAN NOT NULL DEFAULT false,
    "deductTax" BOOLEAN NOT NULL DEFAULT false,
    "calculatedDailyRate" DECIMAL(10,2) NOT NULL,
    "calculatedMonthlyRate" DECIMAL(10,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_compensation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_compensation_contractId_isActive_idx" ON "employee_compensation"("contractId", "isActive");

-- AddForeignKey
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "employee_contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;
