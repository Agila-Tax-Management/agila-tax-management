// src/components/it/ITActiveAccess.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/UI/button';
import { Users, Search, RefreshCw, Loader2, ShieldOff } from 'lucide-react';

interface AccessRecord {
  id: number;
  role: string;
  createdAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    user: { id: string; name: string; email: string; image: string | null } | null;
  };
  app: { id: number; name: string };
}

const PORTAL_LABELS: Record<string, string> = {
  SALES: 'Sales',
  COMPLIANCE: 'Compliance',
  LIAISON: 'Liaison',
  ACCOUNTING: 'Accounting',
  OPERATIONS_MANAGEMENT: 'Operations',
  HR: 'HR',
  TASK_MANAGEMENT: 'Task Mgmt',
  CLIENT_RELATIONS: 'Client Relations',
  IT_MANAGEMENT: 'IT',
};

const PORTAL_COLOR: Record<string, string> = {
  SALES: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  COMPLIANCE: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  LIAISON: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  ACCOUNTING: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  OPERATIONS_MANAGEMENT: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  HR: 'bg-pink-50 text-pink-700 ring-1 ring-pink-200',
  TASK_MANAGEMENT: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  CLIENT_RELATIONS: 'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  IT_MANAGEMENT: 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200',
};

const ROLE_COLOR: Record<string, string> = {
  VIEWER: 'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  USER: 'bg-blue-50 text-blue-600 ring-1 ring-blue-200',
  ADMIN: 'bg-red-50 text-red-600 ring-1 ring-red-200',
  SETTINGS: 'bg-orange-50 text-orange-600 ring-1 ring-orange-200',
};

export function ITActiveAccess(): React.ReactNode {
  const [records, setRecords] = useState<AccessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [portalFilter, setPortalFilter] = useState('');

  const fetchRecords = useCallback(async (q: string, portal: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('search', q);
      if (portal) params.set('portal', portal);
      const res = await fetch(`/api/it/access-management/active?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetch on filter change */
  useEffect(() => {
    void fetchRecords(search, portalFilter);
  }, [fetchRecords, search, portalFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Group records by portal
  const grouped = records.reduce<Record<string, AccessRecord[]>>((acc, r) => {
    const key = r.app.name;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(r);
    return acc;
  }, {});

  const portalKeys = Object.keys(PORTAL_LABELS);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 shrink-0">
            <Users size={20} className="text-cyan-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Active Access</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              All employees with portal access grants
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => void fetchRecords(search, portalFilter)}
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
        <span className="font-semibold text-slate-800">{records.length.toLocaleString()}</span>
        {' '}{records.length === 1 ? 'access grant' : 'access grants'}
        {portalFilter && (
          <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${PORTAL_COLOR[portalFilter] ?? 'bg-slate-100 text-slate-700'}`}>
            {PORTAL_LABELS[portalFilter] ?? portalFilter}
          </span>
        )}
      </p>

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading access records…</span>
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2.5 text-center">
          <ShieldOff size={32} className="text-slate-300" />
          <p className="font-medium text-slate-500">No active access grants found</p>
          <p className="text-sm text-slate-400">Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([portalName, rows]) => (
            <div key={portalName} className="bg-white rounded-xl border border-slate-200 overflow-hidden">

              {/* Portal header */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${PORTAL_COLOR[portalName] ?? 'bg-slate-100 text-slate-700'}`}>
                  {PORTAL_LABELS[portalName] ?? portalName.replace(/_/g, ' ')}
                </span>
                <span className="text-[11px] text-slate-400">{rows.length} {rows.length === 1 ? 'user' : 'users'}</span>
              </div>

              {/* Column headers */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_6rem_10rem_6rem] gap-3 px-4 py-2 border-b border-slate-100">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Employee</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Role</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Implied Permissions</span>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">Since</span>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-100">
                {rows.map((record) => (
                  <div
                    key={record.id}
                    className="flex flex-col gap-2 px-4 py-3 hover:bg-slate-50/60 transition-colors sm:grid sm:grid-cols-[1fr_6rem_10rem_6rem] sm:gap-3 sm:items-center"
                  >
                    {/* Employee */}
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {record.employee.firstName} {record.employee.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {record.employee.employeeNo ?? record.employee.user?.email ?? '—'}
                      </p>
                    </div>

                    {/* Role */}
                    <div>
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${
                        ROLE_COLOR[record.role] ?? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                      }`}>
                        {record.role}
                      </span>
                    </div>

                    {/* Permissions derived from role */}
                    <div className="flex gap-1 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-slate-100 text-slate-600">Read</span>
                      {(record.role === 'USER' || record.role === 'ADMIN' || record.role === 'SETTINGS') && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-sky-100 text-sky-700">Write</span>
                      )}
                      {(record.role === 'ADMIN' || record.role === 'SETTINGS') && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-100 text-amber-700">Edit</span>
                      )}
                      {record.role === 'SETTINGS' && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-red-100 text-red-700">Delete</span>
                      )}
                    </div>

                    {/* Since */}
                    <time className="text-[11px] text-slate-400 sm:text-right">
                      {new Date(record.createdAt).toLocaleDateString('en-PH', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </time>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
