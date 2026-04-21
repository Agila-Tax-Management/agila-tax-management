import { connection } from 'next/server';
import { ASPDashboard } from '@/components/sales/ASPDashboard';

export default async function SalesPortalPage() {
  await connection();
  return <ASPDashboard />;
}