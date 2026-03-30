import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { MyTask } from '@/components/liaison/MyTask';

export default function MyTaskPage() {
  return (
    <TaskDepartmentsProvider>
      <MyTask />
    </TaskDepartmentsProvider>
  );
}
