/*
  Warnings:

  - The `clientId` column on the `ClientUser` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Client` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `clientId` on the `atms_professional` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `clientId` on the `atms_sole_proprietorship` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'CORPORATION', 'COOPERATIVE');

-- DropForeignKey
ALTER TABLE "ClientUser" DROP CONSTRAINT "ClientUser_clientId_fkey";

-- DropForeignKey
ALTER TABLE "atms_professional" DROP CONSTRAINT "atms_professional_clientId_fkey";

-- DropForeignKey
ALTER TABLE "atms_sole_proprietorship" DROP CONSTRAINT "atms_sole_proprietorship_clientId_fkey";

-- AlterTable
ALTER TABLE "ClientUser" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER;

-- AlterTable
ALTER TABLE "atms_professional" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "atms_sole_proprietorship" DROP COLUMN "clientId",
ADD COLUMN     "clientId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Client";

-- CreateTable
CREATE TABLE "atms_clients" (
    "id" SERIAL NOT NULL,
    "companyCode" TEXT,
    "clientNo" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "businessType" "BusinessType",
    "businessCategoryId" INTEGER,
    "portalName" TEXT,
    "businessName" TEXT,
    "branchType" TEXT,
    "mainBranchId" INTEGER,
    "logo" TEXT,
    "clientIpAddress" TEXT,
    "dayResetTime" TIME,
    "workingDayStarts" TIME,
    "timezone" TEXT DEFAULT 'Asia/Manila',
    "created_at" TIMESTAMP(3),

    CONSTRAINT "atms_clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessCategory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BusinessCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "atms_clients_companyCode_key" ON "atms_clients"("companyCode");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessCategory_name_key" ON "BusinessCategory"("name");

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_businessCategoryId_fkey" FOREIGN KEY ("businessCategoryId") REFERENCES "BusinessCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_clients" ADD CONSTRAINT "atms_clients_mainBranchId_fkey" FOREIGN KEY ("mainBranchId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClientUser" ADD CONSTRAINT "ClientUser_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_professional" ADD CONSTRAINT "atms_professional_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atms_sole_proprietorship" ADD CONSTRAINT "atms_sole_proprietorship_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
