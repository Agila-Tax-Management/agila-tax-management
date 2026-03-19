-- CreateEnum
CREATE TYPE "ClientUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- AlterTable
ALTER TABLE "client_user" ADD COLUMN     "status" "ClientUserStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "client_user_assignment" (
    "id" SERIAL NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_user_assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_user_assignment_clientUserId_clientId_key" ON "client_user_assignment"("clientUserId", "clientId");

-- AddForeignKey
ALTER TABLE "client_user_assignment" ADD CONSTRAINT "client_user_assignment_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_user_assignment" ADD CONSTRAINT "client_user_assignment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
