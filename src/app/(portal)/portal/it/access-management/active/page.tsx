// src/app/(portal)/portal/it/access-management/active/page.tsx
import { connection } from 'next/server';
import { ITActiveAccess } from '@/components/it/ITActiveAccess';

export default async function ITActiveAccessPage() {
  await connection();
  return <ITActiveAccess />;
}
