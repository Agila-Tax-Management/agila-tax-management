// src/app/(dashboard)/dashboard/portals/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, ExternalLink, Megaphone, BarChart3, ShieldCheck,
  Building2, UserCheck, Briefcase, Target, Users, Zap, Monitor,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { getPortalFromRoute } from '@/lib/portal-mapping';
import type { AppPortal } from '@/generated/prisma/client';

/* ─── Portal definitions ────────────────────────────────────────── */

const ALL_PORTALS = [
  {
    id: 'sales',      statsKey: 'sales',
    title: 'Sales Portal',
    description: 'Manage leads, sales pipeline, service plans, client list, and team commissions.',
    href: '/portal/sales',
    icon: <Megaphone />,
    color: 'bg-rose-600',
    lightColor: 'bg-rose-50 text-rose-600 border-rose-200',
    stats: { label: 'Active Leads' },
    category: 'Revenue',
  },
  {
    id: 'accounting', statsKey: 'accounting',
    title: 'Accounting & Finance Portal',
    description: 'Handle bookkeeping, invoices, billing, payments, petty cash, and financial reports.',
    href: '/portal/accounting-and-finance',
    icon: <BarChart3 />,
    color: 'bg-blue-600',
    lightColor: 'bg-blue-50 text-blue-600 border-blue-200',
    stats: { label: 'Open Invoices' },
    category: 'Finance',
  },
  {
    id: 'compliance', statsKey: 'compliance',
    title: 'Compliance Portal',
    description: 'Track BIR filings, government permits, regulatory tasks, and client compliance cases.',
    href: '/portal/compliance',
    icon: <ShieldCheck />,
    color: 'bg-indigo-600',
    lightColor: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    stats: { label: 'Pending Filings' },
    category: 'Operations',
  },
  {
    id: 'liaison',    statsKey: 'liaison',
    title: 'Liaison Portal',
    description: 'Coordinate government agency tasks, field scheduling, and liaison activities.',
    href: '/portal/liaison',
    icon: <Building2 />,
    color: 'bg-amber-600',
    lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
    stats: { label: 'Active Tasks' },
    category: 'Operations',
  },
  {
    id: 'ao',         statsKey: 'ao',
    title: 'Account Officer Portal',
    description: 'Oversee client accounts, task management, discussions, and service delivery.',
    href: '/portal/account-officer',
    icon: <Briefcase />,
    color: 'bg-violet-600',
    lightColor: 'bg-violet-50 text-violet-600 border-violet-200',
    stats: { label: 'Clients Managed' },
    category: 'Operations',
  },
  {
    id: 'hr',         statsKey: 'hr',
    title: 'HR Portal',
    description: 'Manage employees, onboarding, attendance, payroll, leave, and government compliance.',
    href: '/portal/hr',
    icon: <UserCheck />,
    color: 'bg-teal-600',
    lightColor: 'bg-teal-50 text-teal-600 border-teal-200',
    stats: { label: 'Employees' },
    category: 'People',
  },
  {
    id: 'task-mgmt',  statsKey: 'task-mgmt',
    title: 'Task Management Portal',
    description: 'Unified task board across liaison and compliance departments.',
    href: '/portal/task-management',
    icon: <Target />,
    color: 'bg-teal-600',
    lightColor: 'bg-teal-50 text-teal-600 border-teal-200',
    stats: { label: 'Active Tasks' },
    category: 'Operations',
  },
  {
    id: 'operation',  statsKey: 'operation',
    title: 'Operations Portal',
    description: 'Manage active clients, operational requirements, and cross-department tasks.',
    href: '/portal/operation',
    icon: <Zap />,
    color: 'bg-amber-600',
    lightColor: 'bg-amber-50 text-amber-700 border-amber-200',
    stats: { label: 'Active Clients' },
    category: 'Operations',
  },
  {
    id: 'crm',        statsKey: 'crm',
    title: 'Client Gateway System',
    description: 'Client portal, self-service gateway, and external client access management.',
    href: '/portal/client-gateway',
    icon: <Users />,
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50 text-blue-600 border-blue-200',
    stats: { label: 'Active Clients' },
    category: 'Client-Facing',
  },
  {
    id: 'it',         statsKey: 'it',
    title: 'IT Portal',
    description: 'Manage IT support tickets, access requests, system status, and asset inventory.',
    href: '/portal/it',
    icon: <Monitor />,
    color: 'bg-cyan-700',
    lightColor: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    stats: { label: 'Open Tickets' },
    category: 'Operations',
  },
];

const CATEGORY_ORDER = ['Revenue', 'Finance', 'Operations', 'People', 'Client-Facing'];

/* ─── Page ──────────────────────────────────────────────────────── */

export default function AllPortalsPage(): React.ReactNode {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [accessiblePortals, setAccessiblePortals] = useState<Set<AppPortal>>(new Set());
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [portalStats, setPortalStats] = useState<Record<string, number | undefined>>({});
  const [filter, setFilter] = useState<string>('All');

  const displayName = session?.user?.name ?? '';

  useEffect(() => {
    void Promise.all([
      fetch('/api/auth/portal-access').then((r) => r.json()),
      fetch('/api/dashboard/portal-stats').then((r) => r.json()),
    ]).then(([access, stats]: [{ userRole: string; portals: { portal: AppPortal }[] }, { data?: Record<string, number> }]) => {
      setUserRole(access.userRole);
      setAccessiblePortals(new Set(access.portals.map((p) => p.portal)));
      if (stats?.data) setPortalStats(stats.data);
    }).catch(() => { /* no-op */ })
      .finally(() => setLoadingAccess(false));
  }, []);

  const visiblePortals = ALL_PORTALS.filter((portal) => {
    if (userRole === 'SUPER_ADMIN' || userRole === 'ADMIN') return true;
    const portalKey = getPortalFromRoute(portal.href);
    return portalKey && accessiblePortals.has(portalKey);
  });

  const categories = ['All', ...CATEGORY_ORDER.filter((c) => visiblePortals.some((p) => p.category === c))];
  const filtered = filter === 'All' ? visiblePortals : visiblePortals.filter((p) => p.category === filter);

  const handleOpen = (href: string) => router.push(href);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Enterprise Portals</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loadingAccess ? 'Loading access...' : `${visiblePortals.length} portal${visiblePortals.length !== 1 ? 's' : ''} available${displayName ? ` for ${displayName.split(' ')[0]}` : ''}`}
          </p>
        </div>
      </div>

      {/* Category filter tabs */}
      {!loadingAccess && categories.length > 1 && (
        <div className="flex items-center gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilter(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                filter === cat
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-border text-muted-foreground hover:border-blue-400 hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Portals list */}
      {loadingAccess ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <ExternalLink size={40} className="mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-foreground font-semibold">No portals available</p>
          <p className="text-sm text-muted-foreground mt-1">Contact your administrator to request portal access.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((portal) => (
            <button
              key={portal.id}
              type="button"
              onClick={() => handleOpen(portal.href)}
              className="group w-full text-left bg-card border border-border rounded-2xl px-6 py-5 flex items-center gap-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 active:scale-[0.99]"
            >
              {/* Icon */}
              <div className={`${portal.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                {React.cloneElement(portal.icon as React.ReactElement<{ size?: number }>, { size: 22 })}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground text-sm">{portal.title}</span>
                  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${portal.lightColor}`}>
                    {portal.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{portal.description}</p>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex flex-col items-end shrink-0 mr-2">
                <span className="text-lg font-extrabold text-foreground leading-none">
                  {portalStats[portal.statsKey] !== undefined
                    ? portalStats[portal.statsKey]
                    : <span className="inline-block w-8 h-4 rounded bg-muted animate-pulse" />}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{portal.stats.label}</span>
              </div>

              {/* Chevron */}
              <ChevronRight size={16} className="text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
