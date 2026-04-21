// src/app/(portal)/portal/sales/job-orders/page.tsx
import { connection } from 'next/server';
import { JobOrders } from './components/JobOrders';

export default async function JobOrdersPage() {
  await connection();
  return <JobOrders />;
}
