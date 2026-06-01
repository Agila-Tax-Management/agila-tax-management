// src/app/(portal)/portal/it/settings/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ITSettings } from '@/components/it/ITSettings';
import { Loader2 } from 'lucide-react';

export default function ITSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    fetch('/api/auth/portal-access?portal=IT_MANAGEMENT')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { role: string | null; userRole: string } | null) => {
        if (json && (json.userRole === 'SUPER_ADMIN' || json.userRole === 'ADMIN')) {
          setHasAccess(true);
        } else {
          router.replace('/portal/it');
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace('/portal/it');
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-cyan-700" />
      </div>
    );
  }

  if (!hasAccess) return null;

  return <ITSettings />;
}
