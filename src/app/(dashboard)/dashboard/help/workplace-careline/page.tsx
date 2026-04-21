// src/app/(dashboard)/dashboard/help/workplace-careline/page.tsx
import { connection } from 'next/server';
import { WorkplaceCareline } from '@/components/help/WorkplaceCareline';

export default async function WorkplaceCarelinePage() {
  await connection();
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <WorkplaceCareline />
    </div>
  );
}
