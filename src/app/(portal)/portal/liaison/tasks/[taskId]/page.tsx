'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { TaskDetailPage } from '@/components/liaison/TaskDetailPage';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import type { AOTask, AOTaskStatus, AOTaskPriority, AOTaskSubtask } from '@/lib/types';
import type {
  ConversationEntry,
  TaskHistoryEntry,
} from '@/components/task-management/SharedTaskDetailPage';

interface ApiSubtask {
  id: number;
  name: string;
  dueDate: string | null;
  isCompleted: boolean;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  department?: { id: number; name: string } | null;
}

interface ApiTask {
  id: number;
  name: string;
  description: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  client: { id: number; businessName: string } | null;
  status: { id: number; name: string; color: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  subtasks: ApiSubtask[];
  conversations: Array<{
    id: number;
    message: string;
    createdAt: string;
    author: { id: string; name: string; image: string | null };
  }>;
  historyLogs: Array<{
    id: number;
    changeType: string;
    oldValue: string | null;
    newValue: string | null;
    createdAt: string;
    actor: { id: string; name: string };
  }>;
}

const DB_PRIORITY_MAP: Record<string, AOTaskPriority> = {
  LOW: 'Low', NORMAL: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};

function mapApiToAOTask(t: ApiTask): AOTask {
  const subtasks: AOTaskSubtask[] = t.subtasks.map(s => ({
    id: String(s.id),
    title: s.name,
    completed: s.isCompleted,
    dueDate: s.dueDate ?? undefined,
    assigneeId: s.assignedTo ? String(s.assignedTo.id) : undefined,
    department: s.department ?? undefined,
    createdAt: new Date().toISOString(),
  }));

  return {
    id: String(t.id),
    title: t.name,
    description: t.description ?? '',
    status: (t.status?.name ?? 'To Do') as AOTaskStatus,
    priority: DB_PRIORITY_MAP[t.priority ?? 'NORMAL'] ?? 'Medium',
    clientId: String(t.client?.id ?? ''),
    assigneeId: String(t.assignedTo?.id ?? ''),
    dueDate: t.dueDate ?? new Date().toISOString(),
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    comments: [],
    tags: [],
    subtasks,
  };
}

function TaskDetailContent({ taskId }: { taskId: number }) {
  const [task, setTask] = useState<AOTask | null>(null);
  const [conversations, setConversations] = useState<ConversationEntry[]>([]);
  const [historyLogs, setHistoryLogs] = useState<TaskHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

   
  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/tasks/${taskId}`);
      if (!res.ok) { setNotFound(true); setIsLoading(false); return; }
      const json = await res.json() as { data: ApiTask };
      const t = json.data;
      setTask(mapApiToAOTask(t));
      setConversations(t.conversations.map(c => ({
        id: c.id,
        message: c.message,
        createdAt: c.createdAt,
        author: c.author,
      })));
      setHistoryLogs(t.historyLogs.map(h => ({
        id: String(h.id),
        changeType: h.changeType,
        oldValue: h.oldValue,
        newValue: h.newValue,
        createdAt: h.createdAt,
        actor: h.actor,
      })));
      setIsLoading(false);
    })();
  }, [taskId]);
   

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 size={32} className="animate-spin text-violet-600" />
      </div>
    );
  }

  if (notFound || !task) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">Task not found</h1>
          <p className="text-slate-600 mt-2">The task you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  return (
    <TaskDetailPage
      task={task}
      taskId={taskId}
      initialConversations={conversations}
      initialHistoryLogs={historyLogs}
    />
  );
}

export default function TaskDetailRoute() {
  const params = useParams();
  const taskId = Number(params.taskId);

  return (
    <TaskDepartmentsProvider>
      <TaskDetailContent taskId={taskId} />
    </TaskDepartmentsProvider>
  );
}
