'use client';

import { Suspense } from 'react';
import { WorkSchedule } from '@/components/dashboard/WorkSchedule';

export default function WorkSchedulePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-slate-400 text-sm">Loading schedule…</p></div>}>
      <WorkSchedule />
    </Suspense>
  );
}
