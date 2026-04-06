import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';

export default function ComplianceTasksPage() {
  return (
    <TaskDepartmentsProvider>
      <TaskManagementBoard
        defaultDepartmentName="Compliance"
        taskHrefBase="/portal/compliance/tasks"
      />
    </TaskDepartmentsProvider>
  );
}
