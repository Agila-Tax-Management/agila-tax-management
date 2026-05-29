// src/components/UI/DevGuard.tsx
'use client';

/**
 * DevGuard — Role-aware development gate.
 *
 * - EMPLOYEE  → Full "under development" replacement page (no WIP content exposed).
 * - ADMIN / SUPER_ADMIN → The actual content is rendered with an amber development
 *   banner pinned above it so administrators can preview work-in-progress.
 *
 * Usage:
 *   <DevGuard featureName="Incident Report">
 *     <IncidentReport />
 *   </DevGuard>
 */

import React from 'react';
import Image from 'next/image';
import { Wrench } from 'lucide-react';
import { authClient } from '@/lib/auth-client';

interface DevGuardProps {
  /** Human-readable name shown in both the banner and the employee-facing page. */
  featureName: string;
  children: React.ReactNode;
}

export function DevGuard({ featureName, children }: DevGuardProps): React.ReactNode {
  const { data: session } = authClient.useSession();

  // While session is loading, render nothing to avoid a flash of the wrong view.
  if (!session) return null;

  const role = (session.user as { role?: string }).role ?? 'EMPLOYEE';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

  if (isAdmin) {
    return (
      <>
        {/* Dev banner — always pinned above WIP content for admins */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 shadow-sm mb-6">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
            <Wrench size={18} />
          </div>
          <div>
            <p className="font-bold text-amber-800 text-sm">
              Work in Progress — {featureName}
            </p>
            <p className="text-amber-700 text-xs mt-0.5 leading-relaxed">
              This feature is currently under active development. The content below is a preview
              visible only to administrators. It may be incomplete, unstable, or subject to change.
            </p>
          </div>
        </div>
        {children}
      </>
    );
  }

  // EMPLOYEE — friendly under-development replacement
  return (
    <div className="flex flex-col items-center justify-center min-h-96 py-20 text-center px-6">
      <div className="mb-6">
        <Image
          src="/images/undraw_under-construction_hdrn.svg"
          alt="Under construction"
          width={620}
          height={460}
          priority
        />
      </div>
      <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
        {featureName}
      </h1>
      <p className="text-muted-foreground text-sm mt-3 max-w-sm leading-relaxed">
        We&apos;re currently building this feature and putting a lot of care into getting it right.
        It will be available to you very soon — thank you for your patience and continued support.
      </p>
      <p className="text-xs text-muted-foreground mt-4 font-medium">
        If you have an urgent need, please reach out to your System Administrator.
      </p>
    </div>
  );
}
