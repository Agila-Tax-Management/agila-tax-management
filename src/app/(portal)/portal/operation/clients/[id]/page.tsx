// src/app/(portal)/portal/operation/clients/[id]/page.tsx
import { connection } from 'next/server';
import { OperationClientDetailPage } from './components/OperationClientDetailPage';

type Props = { params: Promise<{ id: string }> };

export default async function OperationClientDetailRoute({
  params }: Props) {
  await connection();
  const { id } = await params;
  return <OperationClientDetailPage clientId={parseInt(id, 10)} />;
}
