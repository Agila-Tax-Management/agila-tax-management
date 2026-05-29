// src/app/(dashboard)/dashboard/help/incident-report/page.tsx
import { connection } from 'next/server';
import { IncidentReport } from '@/components/help/IncidentReport';
import { DevGuard } from '@/components/UI/DevGuard';

export default async function IncidentReportPage() {
  await connection();
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <DevGuard featureName="Incident Report">
        <IncidentReport />
      </DevGuard>
    </div>
  );
}
