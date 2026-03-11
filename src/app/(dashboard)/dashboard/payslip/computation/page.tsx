'use client';

import { Suspense } from 'react';
import { PayrollComputation } from '@/components/dashboard/PayrollComputation';

export default function PayrollComputationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><p className="text-slate-400 text-sm">Loading computation…</p></div>}>
      <PayrollComputation />
    </Suspense>
  );
}
