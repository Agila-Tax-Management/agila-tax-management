/*
  Warnings:

  - You are about to drop the column `currentDepartmentId` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `currentRouteOrder` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `currentStatusId` on the `task` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `task_subtask` table. All the data in the column will be lost.
  - You are about to drop the column `routeId` on the `task_template_subtask` table. All the data in the column will be lost.
  - You are about to drop the `task_template_route` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `departmentId` to the `task_template` table without a default value. This is not possible if the table is not empty.
  - Added the required column `templateId` to the `task_template_subtask` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_currentDepartmentId_fkey";

-- DropForeignKey
ALTER TABLE "task" DROP CONSTRAINT "task_currentStatusId_fkey";

-- DropForeignKey
ALTER TABLE "task_subtask" DROP CONSTRAINT "task_subtask_statusId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_route" DROP CONSTRAINT "task_template_route_departmentId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_route" DROP CONSTRAINT "task_template_route_templateId_fkey";

-- DropForeignKey
ALTER TABLE "task_template_subtask" DROP CONSTRAINT "task_template_subtask_routeId_fkey";

-- DropIndex
DROP INDEX "task_currentDepartmentId_currentStatusId_idx";

-- DropIndex
DROP INDEX "task_subtask_departmentId_idx";

-- DropIndex
DROP INDEX "task_template_subtask_routeId_idx";

-- AlterTable
ALTER TABLE "task" DROP COLUMN "currentDepartmentId",
DROP COLUMN "currentRouteOrder",
DROP COLUMN "currentStatusId",
ADD COLUMN     "departmentId" INTEGER,
ADD COLUMN     "statusId" INTEGER;

-- AlterTable
ALTER TABLE "task_subtask" DROP COLUMN "statusId",
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "task_template" ADD COLUMN     "departmentId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "task_template_subtask" DROP COLUMN "routeId",
ADD COLUMN     "templateId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "task_template_route";

-- CreateIndex
CREATE INDEX "task_departmentId_statusId_idx" ON "task"("departmentId", "statusId");

-- CreateIndex
CREATE INDEX "task_template_departmentId_idx" ON "task_template"("departmentId");

-- CreateIndex
CREATE INDEX "task_template_subtask_templateId_idx" ON "task_template_subtask"("templateId");

-- AddForeignKey
ALTER TABLE "task_template" ADD CONSTRAINT "task_template_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "department_task_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
