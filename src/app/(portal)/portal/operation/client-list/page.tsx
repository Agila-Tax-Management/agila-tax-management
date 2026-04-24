// src/app/(portal)/portal/operation/client-list/page.tsx
import { connection } from 'next/server';
import { OperationClientList } from '@/components/operation/OperationClientList';

export default async function OperationClientListPage() {
  await connection();
  return <OperationClientList />;
}
