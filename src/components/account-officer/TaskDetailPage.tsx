// src/components/account-officer/TaskDetailPage.tsx
'use client';

import { AO_TEAM_MEMBERS, CURRENT_AO } from '@/lib/mock-ao-data';
import type { AOTask } from '@/lib/types';
import { SharedTaskDetailPage } from '@/components/task-management/SharedTaskDetailPage';

interface TaskDetailPageProps {
  task: AOTask;
}

export function TaskDetailPage({ task }: TaskDetailPageProps) {
  return (
    <SharedTaskDetailPage
      task={task}
      teamMembers={AO_TEAM_MEMBERS}
      currentUser={CURRENT_AO}
      accentColor="#25238e"
    />
  );
}
