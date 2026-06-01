// src/components/it/ITDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import {
  Ticket, ShieldCheck, HardDrive,
  AlertTriangle, CheckCircle2, Clock, ArrowRight, Loader2,
} from 'lucide-react';

interface DashboardData {
  openTickets: number;
  pendingAccessRequests: number;
  totalAssets: number;
  urgentTickets: number;
  resolvedThisWeek: number;
}

const EMPTY: DashboardData = {
  openTickets: 0,
  pendingAccessRequests: 0,
  totalAssets: 0,
  urgentTickets: 0,
  resolvedThisWeek: 0,
};

export function ITDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void Promise.all([
      fetch('/api/it/tickets', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/it/assets', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/it/access-requests?status=PENDING', { cache: 'no-store' }).then((r) => r.json()),
    ])
      .then(([tickets, assets, accessReqs]) => {
        const ticketList: Array<{ status: string; priority: string; resolvedAt: string | null; updatedAt: string }> = tickets?.data ?? [];
        const assetList: Array<unknown> = assets?.data ?? [];
        const accessList: Array<unknown> = accessReqs?.data ?? [];

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        setData({
          openTickets: ticketList.filter((t) => ['OPEN', 'IN_PROGRESS', 'PENDING_INFO'].includes(t.status)).length,
          urgentTickets: ticketList.filter((t) => t.priority === 'URGENT' && t.status !== 'CLOSED' && t.status !== 'RESOLVED').length,
          resolvedThisWeek: ticketList.filter((t) => (t.status === 'RESOLVED' || t.status === 'CLOSED') && t.resolvedAt && new Date(t.resolvedAt) >= weekAgo).length,
          totalAssets: assetList.length,
          pendingAccessRequests: accessList.length,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-cyan-700" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">IT Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of IT operations, tickets, and system health.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/it/tickets')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Open Tickets</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{data.openTickets}</p>
              {data.urgentTickets > 0 && (
                <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
                  <AlertTriangle size={12} /> {data.urgentTickets} urgent
                </p>
              )}
            </div>
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <Ticket size={20} className="text-cyan-700" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-cyan-700 font-medium">
            View tickets <ArrowRight size={12} />
          </div>
        </Card>

        <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/it/access-requests')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pending Access Requests</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{data.pendingAccessRequests}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting review</p>
            </div>
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <ShieldCheck size={20} className="text-cyan-700" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-cyan-700 font-medium">
            Review requests <ArrowRight size={12} />
          </div>
        </Card>

        <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/it/assets')}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Assets</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{data.totalAssets}</p>
              <p className="text-xs text-slate-400 mt-1">Registered devices</p>
            </div>
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center">
              <HardDrive size={20} className="text-cyan-700" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-cyan-700 font-medium">
            Manage assets <ArrowRight size={12} />
          </div>
        </Card>

      </div>

      {/* Resolved this week */}
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">{data.resolvedThisWeek} ticket{data.resolvedThisWeek !== 1 ? 's' : ''} resolved this week</p>
            <p className="text-xs text-slate-500">Closed or resolved in the last 7 days</p>
          </div>
          <div className="ml-auto">
            <Clock size={16} className="text-slate-300" />
          </div>
        </div>
      </Card>
    </div>
  );
}
