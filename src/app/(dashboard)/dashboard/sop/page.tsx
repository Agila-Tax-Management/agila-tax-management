// src/app/(dashboard)/dashboard/sop/page.tsx
import { connection } from 'next/server';
import { Sop } from '@/components/quick-links/Sop';
import { DevGuard } from '@/components/UI/DevGuard';

export default async function SopPage() {
  await connection();
  return (
    <DevGuard featureName="Standard Operating Procedures">
      <Sop />
    </DevGuard>
  );
}




