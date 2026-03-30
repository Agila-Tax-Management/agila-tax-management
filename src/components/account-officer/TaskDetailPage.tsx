// src/components/account-officer/TaskDetailPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SharedTaskDetailPage } from '@/components/task-management/SharedTaskDetailPage';
import type {
  ConversationEntry,
  TaskHistoryEntry,
  DeptWithStatuses,
} from '@/components/task-management/SharedTaskDetailPage';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { authClient } from '@/lib/auth-client';
import type { AOTask, AOTeamMember } from '@/lib/types';

interface EmployeeFromApi {
  id: number;
  firstName: string;
  lastName: string;
  employment?: { department?: { name: string } | null } | null;
}

interface TaskDetailPageProps {
  task: AOTask;
  taskId: number;
  initialConversations: ConversationEntry[];
  initialHistoryLogs: TaskHistoryEntry[];
}

export function TaskDetailPage({
  task,
  taskId,
  initialConversations,
  initialHistoryLogs,
}: TaskDetailPageProps): React.ReactNode {
  const { departments } = useTaskDepartments();
  const { data: session } = authClient.useSession();
  const [teamMembers, setTeamMembers] = useState<AOTeamMember[]>([]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching team members on mount */
  useEffect(() => {
    fetch('/api/hr/employees')
      .then(r => r.ok ? r.json() : null)
      .then((json: { data: EmployeeFromApi[] } | null) => {
        if (!json?.data) return;
        setTeamMembers(json.data.map(e => ({
          id: String(e.id),
          name: `${e.firstName} ${e.lastName}`,
          email: '',
          avatar: `${e.firstName[0] ?? ''}${e.lastName[0] ?? ''}`.toUpperCase(),
          department: e.employment?.department?.name ?? '',
        })));
      })
      .catch(() => undefined);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const aoDept =
    departments.find(d => /account.?officer/i.test(d.name)) ??
    departments.find(d => /client.?relation/i.test(d.name));

  const deptStatuses = aoDept?.statuses ?? [];

  const allDeptStatuses: DeptWithStatuses[] = departments.map(d => ({
    id: d.id,
    name: d.name,
    statuses: d.statuses.map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      isEntryStep: s.isEntryStep,
      isExitStep: s.isExitStep,
    })),
  }));

  const currentUser = session?.user
    ? { id: session.user.id, name: session.user.name }
    : { id: '', name: 'You' };

  return (
    <SharedTaskDetailPage
      task={task}
      taskId={taskId}
      teamMembers={teamMembers}
      currentUser={currentUser}
      accentColor="#25238e"
      deptStatuses={deptStatuses}
      allDeptStatuses={allDeptStatuses}
      initialConversations={initialConversations}
      initialHistoryLogs={initialHistoryLogs}
    />
  );
}
