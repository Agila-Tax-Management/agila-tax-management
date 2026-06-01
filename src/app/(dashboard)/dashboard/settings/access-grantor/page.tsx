// src/app/(dashboard)/dashboard/settings/access-grantor/page.tsx
import { connection } from 'next/server';
import { ITAccessRequests } from '@/components/it/ITAccessRequests';

export default async function AccessGrantorPage() {
  await connection();
  return <ITAccessRequests />;
}
