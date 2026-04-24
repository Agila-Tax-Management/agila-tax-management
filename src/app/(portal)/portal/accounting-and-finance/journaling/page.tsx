// src/app/(portal)/portal/accounting-and-finance/journaling/page.tsx
import { connection } from 'next/server';
import { Journaling } from '@/components/accounting/Journaling';

export default async function JournalingPage() {
  await connection();
  return <Journaling />;
}
