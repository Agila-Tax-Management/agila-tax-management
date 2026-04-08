/*
  Warnings:

  - You are about to drop the column `isActive` on the `service_package` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "service_package" DROP COLUMN "isActive",
ADD COLUMN     "status" "PackageStatus" NOT NULL DEFAULT 'ACTIVE';
