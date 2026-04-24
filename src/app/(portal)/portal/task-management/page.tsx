import { connection } from 'next/server';
import { TaskManagementDashboard } from '@/components/task-management/TaskManagementDashboard';

export default async function TaskManagementPage() {
  await connection();
  return <TaskManagementDashboard />;
}
