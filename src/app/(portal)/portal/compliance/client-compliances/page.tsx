import { connection } from 'next/server';
import { ClientCompliancesList } from '@/components/compliance/ClientCompliancesList';

export default async function ClientCompliancesPage() {
  await connection();
  return <ClientCompliancesList />;
}
