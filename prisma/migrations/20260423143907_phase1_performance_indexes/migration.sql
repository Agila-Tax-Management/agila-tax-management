-- CreateIndex
CREATE INDEX "atms_clients_active_idx" ON "atms_clients"("active");

-- CreateIndex
CREATE INDEX "atms_clients_mainBranchId_idx" ON "atms_clients"("mainBranchId");

-- CreateIndex
CREATE INDEX "atms_clients_businessName_idx" ON "atms_clients"("businessName");

-- CreateIndex
CREATE INDEX "employee_active_softDelete_idx" ON "employee"("active", "softDelete");

-- CreateIndex
CREATE INDEX "lead_assignedAgentId_idx" ON "lead"("assignedAgentId");

-- CreateIndex
CREATE INDEX "lead_createdAt_idx" ON "lead"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "user_role_idx" ON "user"("role");

-- CreateIndex
CREATE INDEX "user_active_idx" ON "user"("active");

-- RenameIndex
ALTER INDEX "idx_task_assigned_to_id" RENAME TO "task_assignedToId_idx";
