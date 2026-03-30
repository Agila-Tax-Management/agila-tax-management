/*
  Warnings:

  - Added the required column `payoutDate` to the `payroll_period` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employee_compensation" ADD COLUMN     "payrollScheduleId" TEXT;

-- AlterTable
ALTER TABLE "payroll_period" ADD COLUMN     "payoutDate" DATE NOT NULL,
ADD COLUMN     "payrollScheduleId" TEXT;

-- AlterTable
ALTER TABLE "payslip" ADD COLUMN     "totalHolidayHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalLateMins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalNightDiffHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalOvertimeHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalRegularDays" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalRegularHours" DECIMAL(7,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "totalUndertimeMins" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "payroll_schedule" (
    "id" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" "SalaryFrequency" NOT NULL DEFAULT 'TWICE_A_MONTH',
    "firstPeriodStartDay" INTEGER NOT NULL,
    "firstPeriodEndDay" INTEGER NOT NULL,
    "firstPayoutDay" INTEGER NOT NULL,
    "secondPeriodStartDay" INTEGER,
    "secondPeriodEndDay" INTEGER,
    "secondPayoutDay" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_schedule_clientId_idx" ON "payroll_schedule"("clientId");

-- CreateIndex
CREATE INDEX "payroll_period_payrollScheduleId_idx" ON "payroll_period"("payrollScheduleId");

-- AddForeignKey
ALTER TABLE "employee_compensation" ADD CONSTRAINT "employee_compensation_payrollScheduleId_fkey" FOREIGN KEY ("payrollScheduleId") REFERENCES "payroll_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_period" ADD CONSTRAINT "payroll_period_payrollScheduleId_fkey" FOREIGN KEY ("payrollScheduleId") REFERENCES "payroll_schedule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payroll_schedule" ADD CONSTRAINT "payroll_schedule_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
