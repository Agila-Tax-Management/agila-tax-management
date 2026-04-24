import { connection } from 'next/server';
import { TaskManagementBoard } from '@/components/task-management/TaskManagementBoard';

export default async function AllTasksPage() {
  await connection();
  return <TaskManagementBoard />;
}
