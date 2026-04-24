import { connection } from 'next/server';
import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { LiaisonReports } from '@/components/liaison/LiaisonReports';

export default async function LiaisonReportPage() {
  await connection();
  return (
    <TaskDepartmentsProvider>
      <LiaisonReports />
    </TaskDepartmentsProvider>
  );
}
