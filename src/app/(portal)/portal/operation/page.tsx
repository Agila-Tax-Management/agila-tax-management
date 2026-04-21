// src/app/(portal)/portal/operation/page.tsx
import { connection } from 'next/server';
import { OperationDashboard } from '@/components/operation/OperationDashboard';

export default async function OperationDashboardPage() {
  await connection();
  return <OperationDashboard />;
}
