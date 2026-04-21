// src/app/(portal)/portal/client-gateway/clients/[id]/page.tsx
import { connection } from 'next/server';
import { ClientDetailPage } from './components/ClientDetailPage';

type Props = { params: Promise<{ id: string }> };

export default async function ClientDetailPageRoute({
  params }: Props) {
  await connection();
  const { id } = await params;
  return <ClientDetailPage clientId={parseInt(id, 10)} />;
}
