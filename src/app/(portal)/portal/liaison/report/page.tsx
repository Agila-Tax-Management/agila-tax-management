import { TaskDepartmentsProvider } from '@/context/TaskDepartmentsContext';
import { LiaisonReports } from '@/components/liaison/LiaisonReports';

export default function LiaisonReportPage() {
  return (
    <TaskDepartmentsProvider>
      <LiaisonReports />
    </TaskDepartmentsProvider>
  );
}
