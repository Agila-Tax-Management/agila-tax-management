// src/app/(portal)/portal/operation/all-task/page.tsx
import { connection } from 'next/server';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';

export default async function OperationAllTaskPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <TaskManagementBoard
        taskHrefBase="/portal/operation/all-task"
        allowedDepartmentNames={['Operations', 'Account Officer', 'Client Relations', 'Liaison', 'Compliance']}
      />
    </TaskDepartmentsProvider>
  );
}
