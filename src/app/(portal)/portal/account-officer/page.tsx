import { connection } from 'next/server';
import { AODashboard } from '@/components/account-officer/AODashboard';

export default async function AccountOfficerPage() {
  await connection();
  return <AODashboard />;
}
