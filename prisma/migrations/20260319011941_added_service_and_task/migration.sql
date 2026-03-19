-- CreateEnum
CREATE TYPE "ServiceRecurring" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "PromoFor" AS ENUM ('SERVICE_PLAN', 'SERVICE_ONE_TIME', 'BOTH');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateTable
CREATE TABLE "government_office" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "government_office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "province" TEXT,
    "region" TEXT,
    "zipCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_inclusion" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_inclusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_plan" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "recurring" "ServiceRecurring" NOT NULL DEFAULT 'MONTHLY',
    "serviceRate" DECIMAL(10,2) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "taskTemplateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_one_time" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "serviceRate" DECIMAL(10,2) NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'ACTIVE',
    "taskTemplateId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_one_time_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "code" TEXT,
    "promoFor" "PromoFor" NOT NULL DEFAULT 'BOTH',
    "discountType" "DiscountType" NOT NULL,
    "discountRate" DECIMAL(10,2) NOT NULL,
    "minimumRate" DECIMAL(10,2),
    "maxUsage" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "daysDue" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_subtask" (
    "id" SERIAL NOT NULL,
    "parentTaskId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assignedToId" INTEGER,
    "dueDate" TIMESTAMP(3),
    "daysDue" INTEGER,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_conversation" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "departmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template_item" (
    "id" SERIAL NOT NULL,
    "templateId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "assignedToDepartmentId" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_template_subtask" (
    "id" SERIAL NOT NULL,
    "templateItemId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "assignedToDepartmentId" INTEGER,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_template_subtask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ServicePlanGovOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanGovOffices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeGovOffices" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeGovOffices_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanCities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeCities" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeCities_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanInclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanInclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimeInclusions" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimeInclusions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServicePlanPromos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServicePlanPromos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ServiceOneTimePromos" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ServiceOneTimePromos_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "government_office_code_key" ON "government_office"("code");

-- CreateIndex
CREATE UNIQUE INDEX "service_inclusion_name_key" ON "service_inclusion"("name");

-- CreateIndex
CREATE UNIQUE INDEX "promo_code_key" ON "promo"("code");

-- CreateIndex
CREATE INDEX "task_clientId_idx" ON "task"("clientId");

-- CreateIndex
CREATE INDEX "task_status_idx" ON "task"("status");

-- CreateIndex
CREATE INDEX "task_subtask_parentTaskId_idx" ON "task_subtask"("parentTaskId");

-- CreateIndex
CREATE INDEX "task_conversation_taskId_idx" ON "task_conversation"("taskId");

-- CreateIndex
CREATE INDEX "task_template_item_templateId_idx" ON "task_template_item"("templateId");

-- CreateIndex
CREATE INDEX "task_template_subtask_templateItemId_idx" ON "task_template_subtask"("templateItemId");

-- CreateIndex
CREATE INDEX "_ServicePlanGovOffices_B_index" ON "_ServicePlanGovOffices"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeGovOffices_B_index" ON "_ServiceOneTimeGovOffices"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanCities_B_index" ON "_ServicePlanCities"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeCities_B_index" ON "_ServiceOneTimeCities"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanInclusions_B_index" ON "_ServicePlanInclusions"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimeInclusions_B_index" ON "_ServiceOneTimeInclusions"("B");

-- CreateIndex
CREATE INDEX "_ServicePlanPromos_B_index" ON "_ServicePlanPromos"("B");

-- CreateIndex
CREATE INDEX "_ServiceOneTimePromos_B_index" ON "_ServiceOneTimePromos"("B");

-- AddForeignKey
ALTER TABLE "service_plan" ADD CONSTRAINT "service_plan_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_one_time" ADD CONSTRAINT "service_one_time_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "atms_clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask" ADD CONSTRAINT "task_subtask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_conversation" ADD CONSTRAINT "task_conversation_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template" ADD CONSTRAINT "task_template_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_item" ADD CONSTRAINT "task_template_item_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_item" ADD CONSTRAINT "task_template_item_assignedToDepartmentId_fkey" FOREIGN KEY ("assignedToDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_templateItemId_fkey" FOREIGN KEY ("templateItemId") REFERENCES "task_template_item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_template_subtask" ADD CONSTRAINT "task_template_subtask_assignedToDepartmentId_fkey" FOREIGN KEY ("assignedToDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanGovOffices" ADD CONSTRAINT "_ServicePlanGovOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "government_office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanGovOffices" ADD CONSTRAINT "_ServicePlanGovOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeGovOffices" ADD CONSTRAINT "_ServiceOneTimeGovOffices_A_fkey" FOREIGN KEY ("A") REFERENCES "government_office"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeGovOffices" ADD CONSTRAINT "_ServiceOneTimeGovOffices_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanCities" ADD CONSTRAINT "_ServicePlanCities_A_fkey" FOREIGN KEY ("A") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanCities" ADD CONSTRAINT "_ServicePlanCities_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeCities" ADD CONSTRAINT "_ServiceOneTimeCities_A_fkey" FOREIGN KEY ("A") REFERENCES "city"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeCities" ADD CONSTRAINT "_ServiceOneTimeCities_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanInclusions" ADD CONSTRAINT "_ServicePlanInclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "service_inclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanInclusions" ADD CONSTRAINT "_ServicePlanInclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeInclusions" ADD CONSTRAINT "_ServiceOneTimeInclusions_A_fkey" FOREIGN KEY ("A") REFERENCES "service_inclusion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimeInclusions" ADD CONSTRAINT "_ServiceOneTimeInclusions_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanPromos" ADD CONSTRAINT "_ServicePlanPromos_A_fkey" FOREIGN KEY ("A") REFERENCES "promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServicePlanPromos" ADD CONSTRAINT "_ServicePlanPromos_B_fkey" FOREIGN KEY ("B") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimePromos" ADD CONSTRAINT "_ServiceOneTimePromos_A_fkey" FOREIGN KEY ("A") REFERENCES "promo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ServiceOneTimePromos" ADD CONSTRAINT "_ServiceOneTimePromos_B_fkey" FOREIGN KEY ("B") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;
