import { connection } from 'next/server';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { MyTask } from '@/components/liaison/MyTask';

export default async function MyTaskPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <MyTask />
    </TaskDepartmentsProvider>
  );
}
