// src/app/(portal)/portal/it/access-requests/page.tsx
import { connection } from 'next/server';
import { ITAccessRequests } from '@/components/it/ITAccessRequests';

export default async function ITAccessRequestsPage() {
  await connection();
  return <ITAccessRequests />;
}
