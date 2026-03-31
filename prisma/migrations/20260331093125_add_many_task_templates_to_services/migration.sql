-- AlterTable: drop single taskTemplateId FK from service_plan
ALTER TABLE "service_plan" DROP COLUMN IF EXISTS "taskTemplateId";

-- AlterTable: drop single taskTemplateId FK from service_one_time
ALTER TABLE "service_one_time" DROP COLUMN IF EXISTS "taskTemplateId";

-- CreateTable: service_plan <-> task_template join table
CREATE TABLE "service_plan_task_template" (
    "servicePlanId" INTEGER NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,

    CONSTRAINT "service_plan_task_template_pkey" PRIMARY KEY ("servicePlanId","taskTemplateId")
);

-- CreateTable: service_one_time <-> task_template join table
CREATE TABLE "service_one_time_task_template" (
    "serviceOneTimeId" INTEGER NOT NULL,
    "taskTemplateId" INTEGER NOT NULL,

    CONSTRAINT "service_one_time_task_template_pkey" PRIMARY KEY ("serviceOneTimeId","taskTemplateId")
);

-- CreateIndex
CREATE INDEX "service_plan_task_template_taskTemplateId_idx" ON "service_plan_task_template"("taskTemplateId");

-- CreateIndex
CREATE INDEX "service_one_time_task_template_taskTemplateId_idx" ON "service_one_time_task_template"("taskTemplateId");

-- AddForeignKey
ALTER TABLE "service_plan_task_template" ADD CONSTRAINT "service_plan_task_template_servicePlanId_fkey" FOREIGN KEY ("servicePlanId") REFERENCES "service_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_plan_task_template" ADD CONSTRAINT "service_plan_task_template_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_one_time_task_template" ADD CONSTRAINT "service_one_time_task_template_serviceOneTimeId_fkey" FOREIGN KEY ("serviceOneTimeId") REFERENCES "service_one_time"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_one_time_task_template" ADD CONSTRAINT "service_one_time_task_template_taskTemplateId_fkey" FOREIGN KEY ("taskTemplateId") REFERENCES "task_template"("id") ON DELETE CASCADE ON UPDATE CASCADE;
