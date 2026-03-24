// src/components/liaison/TaskDetailPage.tsx
'use client';

import React from 'react';
import { LIAISON_TEAM, CURRENT_LIAISON } from '@/lib/mock-liaison-data';
import type { AOTask } from '@/lib/types';
import { SharedTaskDetailPage } from '@/components/task-management/SharedTaskDetailPage';

interface TaskDetailPageProps {
  task: AOTask;
  onUpdate: (updated: AOTask) => void;
}

export function TaskDetailPage({ task, onUpdate }: TaskDetailPageProps): React.ReactNode {
  return (
    <SharedTaskDetailPage
      task={task}
      teamMembers={LIAISON_TEAM}
      currentUser={CURRENT_LIAISON}
      accentColor="#7c3aed"
      onUpdate={onUpdate}
    />
  );
}
