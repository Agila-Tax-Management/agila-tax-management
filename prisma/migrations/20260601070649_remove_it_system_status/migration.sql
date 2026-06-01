/*
  Warnings:

  - You are about to drop the `it_system_status_entry` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "it_system_status_entry" DROP CONSTRAINT "it_system_status_entry_clientId_fkey";

-- DropForeignKey
ALTER TABLE "it_system_status_entry" DROP CONSTRAINT "it_system_status_entry_updatedById_fkey";

-- DropTable
DROP TABLE "it_system_status_entry";

-- DropEnum
DROP TYPE "ItSystemStatus";
