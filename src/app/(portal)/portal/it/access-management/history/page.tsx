// src/app/(portal)/portal/it/access-management/history/page.tsx
import { connection } from 'next/server';
import { ITAccessHistory } from '@/components/it/ITAccessHistory';

export default async function ITAccessHistoryPage() {
  await connection();
  return <ITAccessHistory />;
}
