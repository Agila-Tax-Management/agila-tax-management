'use client';

import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { LiaisonTaskBoard } from '@/components/liaison/LiaisonTaskBoard';

export default function TasksDashboardPage() {
  return (
    <TaskDepartmentsProvider>
      <LiaisonTaskBoard />
    </TaskDepartmentsProvider>
  );
}
