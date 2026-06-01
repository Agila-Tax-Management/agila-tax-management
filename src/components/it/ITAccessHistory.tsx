// src/components/it/ITAccessHistory.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/UI/button';
import {
  History, Search, RefreshCw, Loader2, User,
  CheckCircle2, XCircle, Clock,
} from 'lucide-react';

interface AccessRequest {
  id: number;
  requestedPortal: string;
  requestedRole: string;
  status: string;
  reason: string;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  requestedBy: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
  };
  reviewedBy: { id: string; name: string } | null;
}

const PORTAL_LABELS: Record<string, string> = {
  SALES: 'Sales', COMPLIANCE: 'Compliance', LIAISON: 'Liaison',
  ACCOUNTING: 'Accounting', OPERATIONS_MANAGEMENT: 'Operations',
  HR: 'HR', TASK_MANAGEMENT: 'Task Mgmt',
  CLIENT_RELATIONS: 'Client Relations', IT_MANAGEMENT: 'IT',
};

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; cls: string; label: string }> = {
  APPROVED: { icon: CheckCircle2, cls: 'text-emerald-600', label: 'Approved' },
  REJECTED: { icon: XCircle, cls: 'text-red-500', label: 'Rejected' },
  PENDING:  { icon: Clock, cls: 'text-amber-500', label: 'Pending' },
};

export function ITAccessHistory(): React.ReactNode {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [portalFilter, setPortalFilter] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchHistory = useCallback(async (status: string, portal: string, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      const res = await fetch(`/api/it/access-requests?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        let all: AccessRequest[] = json.data ?? [];
        if (portal) all = all.filter((r) => r.requestedPortal === portal);
        if (q) {
          const lq = q.toLowerCase();
          all = all.filter((r) =>
            `${r.requestedBy.firstName} ${r.requestedBy.lastName}`.toLowerCase().includes(lq),
          );
        }
        setRequests(all);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetch on filter change */
  useEffect(() => {
    void fetchHistory(statusFilter, portalFilter, search);
  }, [fetchHistory, statusFilter, portalFilter, search]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const portalKeys = Object.keys(PORTAL_LABELS);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 shrink-0">
            <History size={20} className="text-cyan-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Access History</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Full log of all portal access requests and decisions
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void fetchHistory(statusFilter, portalFilter, search)}
          disabled={loading}
          className="h-8 px-3 text-xs shrink-0"
        >
          <RefreshCw size={13} className={`mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by employee name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput); }}
            className="w-full pl-8 pr-3 h-8 rounded-lg border border-slate-200 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white transition"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
        >
          <option value="">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="PENDING">Pending</option>
        </select>
        <select
          value={portalFilter}
          onChange={(e) => setPortalFilter(e.target.value)}
          className="h-8 px-3 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
        >
          <option value="">All Portals</option>
          {portalKeys.map((k) => (
            <option key={k} value={k}>{PORTAL_LABELS[k]}</option>
          ))}
        </select>
        <Button
          onClick={() => setSearch(searchInput)}
          className="h-8 bg-cyan-700 hover:bg-cyan-800 text-white text-xs px-4 shrink-0"
        >
          <Search size={12} className="mr-1.5" />
          Search
        </Button>
      </div>

      {/* Summary */}
      <p className="text-sm text-slate-500">
        <span className="font-semibold text-slate-800">{requests.length.toLocaleString()}</span>
        {' '}{requests.length === 1 ? 'request' : 'requests'}
      </p>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading history…</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2.5 text-center">
          <History size={32} className="text-slate-300" />
          <p className="font-medium text-slate-500">No access requests found</p>
          <p className="text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[2rem_1fr_9rem_1fr_8rem] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
            <span />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Employee</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Portal · Role</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Reviewed by</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">Date</span>
          </div>

          <div className="divide-y divide-slate-100">
            {requests.map((req) => {
              const cfg = STATUS_CONFIG[req.status] ?? STATUS_CONFIG['PENDING']!;
              const StatusIcon = cfg.icon;
              return (
                <div
                  key={req.id}
                  className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50/60 transition-colors sm:grid sm:grid-cols-[2rem_1fr_9rem_1fr_8rem] sm:gap-3 sm:items-start"
                >
                  {/* Status icon */}
                  <div className="hidden sm:flex items-start pt-0.5">
                    <StatusIcon size={15} className={cfg.cls} />
                  </div>

                  {/* Employee + reason */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusIcon size={13} className={`sm:hidden ${cfg.cls}`} />
                      <span className="text-sm font-medium text-slate-800">
                        {req.requestedBy.firstName} {req.requestedBy.lastName}
                      </span>
                      {req.requestedBy.employeeNo && (
                        <span className="text-[11px] text-slate-400">({req.requestedBy.employeeNo})</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{req.reason}</p>
                    {req.reviewNote && (
                      <p className="text-[11px] text-slate-400 mt-0.5 italic line-clamp-1">
                        &ldquo;{req.reviewNote}&rdquo;
                      </p>
                    )}
                  </div>

                  {/* Portal · Role */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-slate-700">
                      {PORTAL_LABELS[req.requestedPortal] ?? req.requestedPortal.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">{req.requestedRole}</span>
                  </div>

                  {/* Reviewed by */}
                  <div>
                    {req.reviewedBy ? (
                      <div className="flex items-center gap-1 text-xs text-slate-600">
                        <User size={11} className="text-slate-400 shrink-0" />
                        {req.reviewedBy.name}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Awaiting review</span>
                    )}
                    {req.reviewedAt && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(req.reviewedAt).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>

                  {/* Submitted date */}
                  <time className="text-[11px] text-slate-400 sm:text-right">
                    {new Date(req.createdAt).toLocaleDateString('en-PH', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </time>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
