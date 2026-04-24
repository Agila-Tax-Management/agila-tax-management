// src/app/(portal)/portal/account-officer/tasks/page.tsx
import { connection } from 'next/server';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { TaskBoard } from '@/components/account-officer/TaskBoard';

export default async function TasksPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <TaskBoard />
    </TaskDepartmentsProvider>
  );
}
