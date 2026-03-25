-- CreateTable
CREATE TABLE "task_subtask_history" (
    "id" TEXT NOT NULL,
    "subtaskId" INTEGER NOT NULL,
    "actorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "task_subtask_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_subtask_history_subtaskId_idx" ON "task_subtask_history"("subtaskId");

-- CreateIndex
CREATE INDEX "task_subtask_history_subtaskId_createdAt_idx" ON "task_subtask_history"("subtaskId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "task_subtask_history" ADD CONSTRAINT "task_subtask_history_subtaskId_fkey" FOREIGN KEY ("subtaskId") REFERENCES "task_subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_subtask_history" ADD CONSTRAINT "task_subtask_history_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
