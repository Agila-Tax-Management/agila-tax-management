// src/app/(portal)/portal/operation/all-task/page.tsx
'use client';

import React from 'react';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';

export default function OperationAllTaskPage() {
  return (
    <TaskDepartmentsProvider>
      <TaskManagementBoard />
    </TaskDepartmentsProvider>
  );
}
