// src/app/(portal)/portal/it/system-status/page.tsx
import { connection } from 'next/server';
import { ITSystemStatus } from '@/components/it/ITSystemStatus';

export default async function ITSystemStatusPage() {
  await connection();
  return <ITSystemStatus />;
}
