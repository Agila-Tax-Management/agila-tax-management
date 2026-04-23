// src/app/(portal)/portal/sales/quotations/page.tsx
import { connection } from 'next/server';
import { QuotationsPage } from './components/QuotationsPage';

export default async function QuotationsPageRoute() {
  await connection();
  return <QuotationsPage />;
}
