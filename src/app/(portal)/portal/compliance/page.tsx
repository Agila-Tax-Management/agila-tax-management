import { connection } from 'next/server';
import { ComplianceDashboard } from '@/components/compliance/ComplianceDashboard';

export default async function ComplianceDashboardPage() {
  await connection();
  return <ComplianceDashboard />;
}
