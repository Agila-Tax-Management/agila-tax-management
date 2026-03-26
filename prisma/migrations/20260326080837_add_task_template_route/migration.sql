/*
  Warnings:

  - You are about to drop the column `departmentId` on the `task_template` table. All the data in the column will be lost.
  - You are about to drop the column `templateId` on the `task_template_subtask` table. All the data in the column will be lost.
  - Added the required column `routeId` to the `task_template_subtask` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task_template" DROP CONSTRAINT "task_template_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_subtask" DROP CONSTRAINT "task_template_subtask_templateId_fkey";

-- DropIndex
DROP INDEX "task_template_departmentId_idx";

-- DropIndex
DROP INDEX "task_template_subtask_templateId_idx";

-- AlterTable
ALTER TABLE "task_template" DROP COLUMN "departmentId";

-- AlterTable
ALTER TABLE "task_template_subtask" DROP COLUMN "templateId",
ADD COLUMN     "routeId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "task_template_route" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "departmentId" INTEGER NOT NULL,
    "routeOrder" INTEGER NOT NULL DEFAULT 1,
    "daysDue" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_template_route_templateId_idx" ON "task_template_route"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "task_template_route_templateId_departmentId_key" ON "task_template_route"("templateId", "departmentId");

-- CreateIndex
CREATE INDEX "task_template_subtask_routeId_idx" ON "task_template_subtask"("routeId");

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_route" ADD CONSTRAINT "task_template_route_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "task_template_route"("id") ON DELETE CASCADE ON UPDATE CASCADE;
