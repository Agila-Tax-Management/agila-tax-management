// src/app/(portal)/portal/task-management/tasks/[id]/page.tsx
import { notFound } from 'next/navigation';
import prisma from '@/lib/db';
import { TaskDetailPage } from '@/components/task-management/TaskDetailPage';
import type { UnifiedTask, TaskSource } from '@/lib/mock-task-management-data';
import type { AOTaskStatus, AOTaskPriority } from '@/lib/types';
import type { ConversationEntry, TaskHistoryEntry } from '@/components/task-management/SharedTaskDetailPage';

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};

const DEPT_SOURCE_ALIASES: Array<{ aliases: string[]; source: TaskSource }> = [
  { aliases: ['operations', 'operations manager', 'om'], source: 'om' },
  { aliases: ['client relations', 'client-relations'],   source: 'client-relations' },
  { aliases: ['liaison'],                                source: 'liaison' },
  { aliases: ['compliance'],                             source: 'compliance' },
  { aliases: ['admin', 'administration', 'administrator'], source: 'admin' },
  { aliases: ['accounting', 'accounts'],                 source: 'accounting' },
  { aliases: ['human resources', 'hr', 'human resource'], source: 'hr' },
  { aliases: ['it', 'information technology', 'it department'], source: 'it' },
];

function deptToSource(name: string): TaskSource {
  const lower = name.toLowerCase().trim();
  return DEPT_SOURCE_ALIASES.find(e => e.aliases.includes(lower))?.source ?? 'om';
}

export default async function TaskDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskId = Number(id);
  if (isNaN(taskId)) notFound();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      department: { select: { id: true, name: true } },
      status: { select: { id: true, name: true } },
      jobOrder: { select: { id: true, jobOrderNumber: true } },
      subtasks: {
        orderBy: { order: 'asc' as const },
        include: {
          assignedTo: { select: { id: true, firstName: true, lastName: true } },
          department: { select: { id: true, name: true } },
        },
      },
      conversations: {
        orderBy: { createdAt: 'asc' as const },
        include: { author: { select: { id: true, name: true, image: true } } },
      },
      historyLogs: {
        orderBy: { createdAt: 'asc' as const },
        take: 100,
        include: { actor: { select: { id: true, name: true } } },
      },
    },
  });

  if (!task) notFound();

  const unified: UnifiedTask = {
    id: String(task.id),
    title: task.name,
    description: task.description ?? '',
    status: (task.status?.name ?? 'To Do') as AOTaskStatus,
    priority: DB_PRIORITY_MAP[task.priority] ?? 'Medium',
    source: deptToSource(task.department?.name ?? ''),
    clientId: String(task.clientId ?? ''),
    assigneeId: String(task.assignedToId ?? ''),
    dueDate: task.dueDate?.toISOString() ?? new Date().toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    comments: [],
    tags: [],
    subtasks: task.subtasks.map(s => ({
      id: String(s.id),
      title: s.name,
      completed: s.isCompleted,
      notes: s.description ?? undefined,
      assigneeId: s.assignedTo ? String(s.assignedTo.id) : undefined,
      assigneeName: s.assignedTo ? `${s.assignedTo.firstName} ${s.assignedTo.lastName}` : undefined,
      department: s.department ?? undefined,
      priority: DB_PRIORITY_MAP[s.priority] ?? 'Medium',
      dueDate: s.dueDate?.toISOString() ?? undefined,
      createdAt: new Date().toISOString(),
    })),
  };

  const initialConversations: ConversationEntry[] = task.conversations.map(c => ({
    id: c.id,
    message: c.message,
    createdAt: c.createdAt.toISOString(),
    author: { id: c.author.id, name: c.author.name, image: c.author.image },
  }));

  const initialHistoryLogs: TaskHistoryEntry[] = task.historyLogs.map(h => ({
    id: h.id,
    changeType: h.changeType,
    oldValue: h.oldValue,
    newValue: h.newValue,
    createdAt: h.createdAt.toISOString(),
    actor: { id: h.actor.id, name: h.actor.name },
  }));

  const jobOrder = task.jobOrder ?? null;
  return (
    <TaskDetailPage
      task={unified}
      taskId={taskId}
      initialConversations={initialConversations}
      initialHistoryLogs={initialHistoryLogs}
      jobOrder={jobOrder}
    />
  );
}
