// src/app/(dashboard)/dashboard/reports/page.tsx
import { DevGuard } from '@/components/UI/DevGuard';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <DevGuard featureName="Reports Engine">
      {/* Placeholder — replace with real Reports component when ready */}
      <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-3">
        <BarChart3 size={40} className="opacity-30" />
        <p className="text-sm font-medium">Reports Engine — coming soon</p>
      </div>
    </DevGuard>
  );
}
