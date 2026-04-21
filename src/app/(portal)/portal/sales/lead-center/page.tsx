import { connection } from 'next/server';
import { LeadCenter } from '@/components/sales/LeadCenter';

export default async function LeadCenterPage() {
  await connection();
  return <LeadCenter />;
}
