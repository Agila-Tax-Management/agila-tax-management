// src/app/(portal)/portal/sales/services/one-time/update-service/[id]/page.tsx
import { connection } from 'next/server';
import { EditOneTimeServiceForm } from './components/EditOneTimeServiceForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditOneTimeServicePage({
  params }: Props) {
  await connection();
  const { id } = await params;
  return <EditOneTimeServiceForm serviceId={parseInt(id, 10)} />;
}
