// src/app/(portal)/portal/account-officer/tasks/[id]/page.tsx
import { notFound } from 'next/navigation';
import { INITIAL_AO_TASKS } from '@/lib/mock-ao-data';
import { TaskDetailPage } from '@/components/account-officer/TaskDetailPage';

interface TaskDetailRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AOTaskDetailRoute({ params }: TaskDetailRouteProps) {
  const { id } = await params;
  const task = INITIAL_AO_TASKS.find(t => t.id === id);
  if (!task) notFound();
  return <TaskDetailPage task={task} />;
}
