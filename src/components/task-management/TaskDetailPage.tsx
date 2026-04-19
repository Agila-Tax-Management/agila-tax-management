// src/components/task-management/TaskDetailPage.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { SOURCE_CONFIG } from '@/lib/mock-task-management-data';
import type { UnifiedTask, TaskSource } from '@/lib/mock-task-management-data';
import type { AOTeamMember } from '@/lib/types';
import { SharedTaskDetailPage } from './SharedTaskDetailPage';
import type { ConversationEntry, TaskHistoryEntry, DeptWithStatuses } from './SharedTaskDetailPage';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { useTaskManagementRole } from '@/context/TaskManagementRoleContext';
import { authClient } from '@/lib/auth-client';

const SOURCE_TO_DEPT_NAME: Record<TaskSource, string> = {
  'om':               'Operations',
  'client-relations': 'Client Relations',
  'liaison':          'Liaison',
  'compliance':       'Compliance',
  'admin':            'Administration',
  'accounting':       'Accounting',
  'hr':               'Human Resources',
  'it':               'IT',
};

interface EmployeeFromApi {
  id: number;
  firstName: string;
  lastName: string;
  department?: { name: string } | null;
}

interface TaskDetailPageProps {
  task: UnifiedTask;
  taskId: number;
  initialConversations: ConversationEntry[];
  initialHistoryLogs: TaskHistoryEntry[];
  jobOrder?: { id: string; jobOrderNumber: string } | null;
}

export function TaskDetailPage({ task, taskId, initialConversations, initialHistoryLogs, jobOrder }: TaskDetailPageProps) {
  const { departments } = useTaskDepartments();
  const { canEdit } = useTaskManagementRole();
  const { data: session } = authClient.useSession();
  const [teamMembers, setTeamMembers] = useState<AOTeamMember[]>([]);

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
          department: e.department?.name ?? '',
        })));
      })
      .catch(() => undefined);
  }, []);

  const deptName = SOURCE_TO_DEPT_NAME[task.source as TaskSource];
  const dept = departments.find(d => d.name === deptName);
  const deptStatuses = dept?.statuses ?? [];

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
      accentColor="#0f766e"
      sourceInfo={SOURCE_CONFIG[task.source as TaskSource]}
      deptStatuses={deptStatuses}
      allDeptStatuses={allDeptStatuses}
      initialConversations={initialConversations}
      initialHistoryLogs={initialHistoryLogs}
      canEdit={canEdit}
      jobOrder={jobOrder ?? null}
    />
  );
}