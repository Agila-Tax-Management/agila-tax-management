import { connection } from 'next/server';
import { CommissionTracking } from '@/components/sales/CommissionTracking';

export default async function CommissionsPage() {
  await connection();
  return <CommissionTracking />;
}
