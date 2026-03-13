/*
  Warnings:

  - You are about to drop the column `employeeLevel` on the `employee_employment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employee_employment" DROP COLUMN "employeeLevel",
ADD COLUMN     "employeeLevelId" INTEGER;

-- DropEnum
DROP TYPE "EmployeeLevel";

-- CreateTable
CREATE TABLE "employee_level" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "employee_level_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_name_key" ON "employee_level"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_level_position_key" ON "employee_level"("position");

-- AddForeignKey
ALTER TABLE "employee_employment" ADD CONSTRAINT "employee_employment_employeeLevelId_fkey" FOREIGN KEY ("employeeLevelId") REFERENCES "employee_level"("id") ON DELETE SET NULL ON UPDATE CASCADE;
