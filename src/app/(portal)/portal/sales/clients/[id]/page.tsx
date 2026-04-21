// src/app/(portal)/portal/sales/clients/[id]/page.tsx
import { connection } from 'next/server';
import { ClientDetailPage } from '@/app/(portal)/portal/client-gateway/clients/[id]/components/ClientDetailPage';

type Props = { params: Promise<{ id: string }> };

export default async function SalesClientDetailPage({
  params }: Props) {
  await connection();
  const { id } = await params;
  return <ClientDetailPage clientId={parseInt(id, 10)} />;
}
