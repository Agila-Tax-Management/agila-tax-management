-- CreateEnum
CREATE TYPE "ClientPortalRole" AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE', 'VIEWER');

-- AlterTable
ALTER TABLE "client_user_assignment" ADD COLUMN     "role" "ClientPortalRole" NOT NULL DEFAULT 'EMPLOYEE';

-- CreateTable
CREATE TABLE "client_employee" (
    "id" SERIAL NOT NULL,
    "clientUserId" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "positionTitle" TEXT,
    "departmentId" INTEGER,
    "teamId" INTEGER,
    "employmentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_employee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_employee_clientUserId_clientId_key" ON "client_employee"("clientUserId", "clientId");

-- AddForeignKey
ALTER TABLE "client_employee" ADD CONSTRAINT "client_employee_clientUserId_fkey" FOREIGN KEY ("clientUserId") REFERENCES "client_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_employee" ADD CONSTRAINT "client_employee_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_employee" ADD CONSTRAINT "client_employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_employee" ADD CONSTRAINT "client_employee_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "EmployeeTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;
