/*
  Warnings:

  - You are about to drop the `App` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EmployeeAppAccess` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PortalRole" AS ENUM ('VIEWER', 'USER', 'ADMIN', 'SETTINGS');

-- DropForeignKey
ALTER TABLE "EmployeeAppAccess" DROP CONSTRAINT "EmployeeAppAccess_appId_fkey";

-- DropForeignKey
ALTER TABLE "EmployeeAppAccess" DROP CONSTRAINT "EmployeeAppAccess_employeeId_fkey";

-- DropTable
DROP TABLE "App";

-- DropTable
DROP TABLE "EmployeeAppAccess";

-- CreateTable
CREATE TABLE "app" (
    "id" TEXT NOT NULL,
    "name" "AppPortal" NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_app_access" (
    "id" TEXT NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "appId" TEXT NOT NULL,
    "role" "PortalRole" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_app_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_name_key" ON "app"("name");

-- CreateIndex
CREATE UNIQUE INDEX "employee_app_access_employeeId_appId_key" ON "employee_app_access"("employeeId", "appId");

-- AddForeignKey
ALTER TABLE "employee_app_access" ADD CONSTRAINT "employee_app_access_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_app_access" ADD CONSTRAINT "employee_app_access_appId_fkey" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE ON UPDATE CASCADE;
