// src/app/(portal)/portal/it/task-board/page.tsx
import { connection } from 'next/server';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';

export default async function ITTaskBoardPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <TaskManagementBoard
        defaultDepartmentName="IT"
        taskHrefBase="/portal/it/task-board"
        accentColor="#0e7490"
        hideTemplate
      />
    </TaskDepartmentsProvider>
  );
}
