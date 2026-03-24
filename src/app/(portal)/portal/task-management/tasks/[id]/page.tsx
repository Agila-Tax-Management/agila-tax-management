// src/app/(portal)/portal/task-management/tasks/[id]/page.tsx
import { notFound } from 'next/navigation';
import { ALL_TASKS } from '@/lib/mock-task-management-data';
import { TaskDetailPage } from '@/components/task-management/TaskDetailPage';

export default async function TaskDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const task = ALL_TASKS.find(t => t.id === id) ?? null;
  if (!task) notFound();
  return <TaskDetailPage task={task} />;
}
