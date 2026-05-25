// src/app/(portal)/portal/accounting-and-finance/client-funds/page.tsx
import { connection } from 'next/server';
import { ClientFunds } from '@/components/accounting/ClientFunds';

export default async function ClientFundsPage() {
  await connection();
  return <ClientFunds />;
}
