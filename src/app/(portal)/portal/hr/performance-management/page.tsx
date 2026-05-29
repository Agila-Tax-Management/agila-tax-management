// src/app/(portal)/portal/hr/performance-management/page.tsx
'use client';

import { PerformanceManagement } from '@/components/hr/PerformanceManagement';
import { DevGuard } from '@/components/UI/DevGuard';

export default function PerformanceManagementPage() {
  return (
    <DevGuard featureName="Performance Management">
      <PerformanceManagement />
    </DevGuard>
  );
}
