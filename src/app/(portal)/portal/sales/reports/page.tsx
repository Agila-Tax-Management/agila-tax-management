import { connection } from 'next/server';
import { Reports } from '@/components/sales/Reports';

export default async function ReportsPage() {
  await connection();
  return <Reports />;
}
