// src/app/(portal)/portal/it/page.tsx
import { connection } from 'next/server';
import { ITDashboard } from '@/components/it/ITDashboard';

export default async function ITPortalPage() {
  await connection();
  return <ITDashboard />;
}
