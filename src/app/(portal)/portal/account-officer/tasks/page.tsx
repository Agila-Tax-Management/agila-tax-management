// src/app/(portal)/portal/account-officer/tasks/page.tsx
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { TaskBoard } from '@/components/account-officer/TaskBoard';

export default function TasksPage() {
  return (
    <TaskDepartmentsProvider>
      <TaskBoard />
    </TaskDepartmentsProvider>
  );
}
