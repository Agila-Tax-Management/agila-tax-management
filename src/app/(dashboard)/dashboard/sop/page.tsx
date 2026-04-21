// src/app/(dashboard)/dashboard/sop/page.tsx
import { connection } from 'next/server';
import { Sop } from '@/components/quick-links/Sop';

export default async function SopPage() {
  await connection();
  return <Sop />;
}




