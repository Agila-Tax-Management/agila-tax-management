import { connection } from 'next/server';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';

export default async function ComplianceTasksPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <TaskManagementBoard
        defaultDepartmentName="Compliance"
        taskHrefBase="/portal/compliance/tasks"
      />
    </TaskDepartmentsProvider>
  );
}
