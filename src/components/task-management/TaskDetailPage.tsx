// src/components/task-management/TaskDetailPage.tsx
'use client';

import { ALL_TEAM_MEMBERS, SOURCE_CONFIG } from '@/lib/mock-task-management-data';
import type { UnifiedTask } from '@/lib/mock-task-management-data';
import { SharedTaskDetailPage } from './SharedTaskDetailPage';

const CURRENT_USER = { id: 'tl-1', name: 'Team Lead' };

interface TaskDetailPageProps {
  task: UnifiedTask;
}

export function TaskDetailPage({ task }: TaskDetailPageProps) {
  return (
    <SharedTaskDetailPage
      task={task}
      teamMembers={ALL_TEAM_MEMBERS}
      currentUser={CURRENT_USER}
      accentColor="#0f766e"
      sourceInfo={SOURCE_CONFIG[task.source]}
    />
  );
}
