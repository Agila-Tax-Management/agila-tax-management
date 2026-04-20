// src/app/(portal)/portal/task-management/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TaskSettingsTabs } from '@/components/task-management/TaskSettingsTabs';
import { Loader2 } from 'lucide-react';

export default function TaskSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    // Check if user has SETTINGS role for TASK_MANAGEMENT portal or is a SUPER_ADMIN
    fetch('/api/auth/portal-access?portal=TASK_MANAGEMENT')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { role: string | null; userRole: string } | null) => {
        if (json && (json.role === 'SETTINGS' || json.userRole === 'SUPER_ADMIN')) {
          setHasAccess(true);
        } else {
          // Redirect to dashboard if no SETTINGS access and not SUPER_ADMIN
          router.push('/portal/task-management');
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/portal/task-management');
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-teal-700" />
      </div>
    );
  }

  if (!hasAccess) {
    return null; // Will redirect
  }

  return <TaskSettingsTabs />;
}
