// src/app/(portal)/portal/accounting-and-finance/client-funds/[clientId]/page.tsx
import { connection } from 'next/server';
import { ClientFundDetail } from '@/components/accounting/ClientFundDetail';

export default async function ClientFundDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  await connection();
  const { clientId } = await params;
  return <ClientFundDetail clientId={clientId} />;
}
