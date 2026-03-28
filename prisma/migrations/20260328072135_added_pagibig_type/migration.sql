-- CreateEnum
CREATE TYPE "PagibigContributionType" AS ENUM ('REGULAR', 'MINIMUM');

-- AlterTable
ALTER TABLE "employee_compensation" ADD COLUMN     "pagibigType" "PagibigContributionType" NOT NULL DEFAULT 'REGULAR';
