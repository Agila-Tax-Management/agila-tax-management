import { connection } from 'next/server';
import { ComplianceReports } from '@/components/compliance/ComplianceReports';

export default async function ReportsPage() {
  await connection();
  return <ComplianceReports />;
}
