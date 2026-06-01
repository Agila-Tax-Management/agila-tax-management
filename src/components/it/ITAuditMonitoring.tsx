// src/components/it/ITAuditMonitoring.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/UI/button';
import {
  Loader2, Activity, Search, RefreshCw,
  ChevronLeft, ChevronRight, ShieldCheck,
} from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: string;
  isSystemAction: boolean;
  user: { id: string; name: string; email: string; role: string } | null;
  clientUser: { id: string; name: string; email: string } | null;
}

interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type PortalKey = 'all' | 'sales' | 'accounting' | 'compliance' | 'liaison' | 'hr' | 'it' | 'tasks' | 'admin' | 'client';

interface PortalTab {
  key: PortalKey;
  label: string;
  /** Applied to the tab button when active: border-color + text-color classes */
  activeCls: string;
  /** Applied to the active-portal badge in the summary row */
  badgeCls: string;
}

const PORTAL_TABS: PortalTab[] = [
  { key: 'all',        label: 'All Portals',   activeCls: 'border-slate-700 text-slate-900',      badgeCls: 'bg-slate-800 text-white' },
  { key: 'sales',      label: 'Sales',         activeCls: 'border-blue-600 text-blue-700',        badgeCls: 'bg-blue-600 text-white' },
  { key: 'accounting', label: 'Accounting',    activeCls: 'border-emerald-600 text-emerald-700',  badgeCls: 'bg-emerald-600 text-white' },
  { key: 'compliance', label: 'Compliance',    activeCls: 'border-violet-600 text-violet-700',    badgeCls: 'bg-violet-600 text-white' },
  { key: 'liaison',    label: 'Liaison',       activeCls: 'border-orange-500 text-orange-700',    badgeCls: 'bg-orange-500 text-white' },
  { key: 'hr',         label: 'HR',            activeCls: 'border-pink-600 text-pink-700',        badgeCls: 'bg-pink-600 text-white' },
  { key: 'it',         label: 'IT',            activeCls: 'border-cyan-700 text-cyan-800',        badgeCls: 'bg-cyan-700 text-white' },
  { key: 'tasks',      label: 'Task Mgmt',     activeCls: 'border-indigo-600 text-indigo-700',    badgeCls: 'bg-indigo-600 text-white' },
  { key: 'admin',      label: 'Admin',         activeCls: 'border-red-600 text-red-700',          badgeCls: 'bg-red-600 text-white' },
  { key: 'client',     label: 'Client Portal', activeCls: 'border-amber-500 text-amber-700',      badgeCls: 'bg-amber-500 text-white' },
];

/** Human-readable label for every entity name used in logActivity() calls. */
const ENTITY_LABELS: Record<string, string> = {
  // Sales
  Lead: 'Lead',
  TsaContract: 'TSA Contract',
  Service: 'Service',
  ServicePackage: 'Service Package',
  JobOrder: 'Job Order',
  Quote: 'Quote',
  City: 'City',
  GovernmentOffice: 'Government Office',
  SalesSetting: 'Sales Setting',
  LeadStatus: 'Lead Status',
  // Accounting
  Invoice: 'Invoice',
  GlAccount: 'GL Account',
  AccountType: 'Account Type',
  AccountDetailType: 'Account Detail Type',
  AccountingSetting: 'Accounting Setting',
  PaymentMethodEWallet: 'E-Wallet Method',
  PaymentMethodCash: 'Cash Method',
  PaymentMethodBank: 'Bank Method',
  PettyCash: 'Petty Cash',
  JournalEntry: 'Journal Entry',
  // Compliance
  ClientCompliance: 'Client Compliance',
  ComplianceRecord: 'Compliance Record',
  ComplianceSetting: 'Compliance Setting',
  ComplianceDocument: 'Compliance Document',
  ComplianceNote: 'Compliance Note',
  EwtItem: 'EWT Item',
  VatMonth: 'VAT Month',
  PercentageTaxMonth: 'Percentage Tax',
  SalesRecord: 'Sales Record',
  ExpenseRecord: 'Expense Record',
  Contact: 'Contact',
  // HR
  Employee: 'Employee',
  Department: 'Department',
  Position: 'Position',
  EmployeeTeam: 'Team',
  WorkSchedule: 'Work Schedule',
  HrSetting: 'HR Setting',
  EmployeeLevel: 'Employee Level',
  LeaveType: 'Leave Type',
  LeaveRequest: 'Leave Request',
  OvertimeRequest: 'Overtime Request',
  CoaRequest: 'COA Request',
  Timesheet: 'Timesheet',
  Payslip: 'Payslip',
  PayrollPeriod: 'Payroll Period',
  PayrollSchedule: 'Payroll Schedule',
  Holiday: 'Holiday',
  // IT
  ItTicket: 'Ticket',
  ItAsset: 'Asset',
  ItPortalAccessRequest: 'Access Request',
  ItSystemStatusEntry: 'System Status',
  EmployeeAppAccess: 'App Access',
  // Task Management
  Task: 'Task',
  TaskSubtask: 'Subtask',
  TaskTemplate: 'Task Template',
  DepartmentTaskStatus: 'Task Status',
  // Admin / System
  User: 'User',
  Client: 'Client',
  ClientUser: 'Client Portal User',
  ClientApiKey: 'API Key',
  Announcement: 'Announcement',
};

const ACTION_COLOR: Record<string, string> = {
  CREATED:           'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  UPDATED:           'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  DELETED:           'bg-red-50 text-red-700 ring-1 ring-red-200',
  STATUS_CHANGE:     'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  ASSIGNED:          'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  UNASSIGNED:        'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  APPROVED:          'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED:          'bg-red-50 text-red-700 ring-1 ring-red-200',
  PERMISSION_CHANGE: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200',
  ARCHIVED:          'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  RESTORED:          'bg-teal-50 text-teal-700 ring-1 ring-teal-200',
  SUBMITTED:         'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  CANCELLED:         'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
  IMPORTED:          'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  EXPORTED:          'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
  LOGIN:             'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  LOGOUT:            'bg-slate-50 text-slate-600 ring-1 ring-slate-200',
  VIEWED:            'bg-slate-50 text-slate-500 ring-1 ring-slate-100',
};

const ALL_ACTIONS = [
  'CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGE',
  'ASSIGNED', 'UNASSIGNED', 'APPROVED', 'REJECTED',
  'SUBMITTED', 'CANCELLED', 'PERMISSION_CHANGE',
  'ARCHIVED', 'RESTORED', 'IMPORTED', 'EXPORTED',
  'LOGIN', 'LOGOUT', 'VIEWED',
];

export function ITAuditMonitoring(): React.ReactNode {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [pagination, setPagination] = useState<AuditPagination>({
    page: 1, limit: 25, total: 0, totalPages: 0,
  });
  const [filterPortal, setFilterPortal] = useState<PortalKey>('all');
  const [filterAction, setFilterAction] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchLogs = useCallback(async (
    page: number, portal: string, action: string, search: string,
  ) => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (portal !== 'all') params.set('portal', portal);
      if (action) params.set('action', action);
      if (search) params.set('search', search);
      const res = await fetch(`/api/it/audit?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        setLogs(json.data ?? []);
        setPagination(json.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 });
      }
    } finally {
      setLogsLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- async data fetch triggered by filter change */
  useEffect(() => {
    void fetchLogs(1, filterPortal, filterAction, searchText);
  }, [filterPortal, filterAction, searchText, fetchLogs]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSearch() {
    setSearchText(searchInput);
    setPagination((p) => ({ ...p, page: 1 }));
  }

  function handlePageChange(newPage: number) {
    setPagination((p) => ({ ...p, page: newPage }));
    void fetchLogs(newPage, filterPortal, filterAction, searchText);
  }

  const activeTab = PORTAL_TABS.find((t) => t.key === filterPortal) ?? PORTAL_TABS[0]!;

  return (
    <div className="space-y-5">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 shrink-0">
            <ShieldCheck size={20} className="text-cyan-700" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Audit Log</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              System-wide activity trail across all portals
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
          <Button
            variant="outline"
            onClick={() => void fetchLogs(pagination.page, filterPortal, filterAction, searchText)}
            disabled={logsLoading}
            className="h-8 px-3 text-xs"
          >
            <RefreshCw size={13} className={`mr-1.5 ${logsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Portal tab bar ───────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <nav className="flex overflow-x-auto -mb-px" aria-label="Portal filter">
          {PORTAL_TABS.map((tab) => {
            const isActive = filterPortal === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setFilterPortal(tab.key);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={[
                  'px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors focus:outline-none',
                  isActive
                    ? `${tab.activeCls} font-semibold`
                    : 'border-transparent text-slate-500 font-medium hover:text-slate-700 hover:border-slate-300',
                ].join(' ')}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by description…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
            className="w-full pl-8 pr-3 h-8 rounded-lg border border-slate-200 text-sm bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:bg-white transition"
          />
        </div>
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
          className="h-8 px-3 rounded-lg border border-slate-200 text-sm bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-600"
        >
          <option value="">All Actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <Button
          onClick={handleSearch}
          className="h-8 bg-cyan-700 hover:bg-cyan-800 text-white text-xs px-4 shrink-0"
        >
          <Search size={12} className="mr-1.5" />
          Search
        </Button>
      </div>

      {/* ── Summary row ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 text-sm">
        <span className="text-slate-500">
          <span className="font-semibold text-slate-800">{pagination.total.toLocaleString()}</span>
          {' '}{pagination.total === 1 ? 'record' : 'records'}
        </span>
        {filterPortal !== 'all' && (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${activeTab.badgeCls}`}>
            {activeTab.label}
          </span>
        )}
        {filterAction && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            {filterAction.replace(/_/g, ' ')}
          </span>
        )}
        {searchText && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
            &ldquo;{searchText}&rdquo;
          </span>
        )}
      </div>

      {/* ── Log list ─────────────────────────────────────────────── */}
      {logsLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm">Loading activity logs…</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2.5 text-center">
          <Activity size={32} className="text-slate-300" />
          <p className="font-medium text-slate-500">No activity found</p>
          <p className="text-sm text-slate-400">
            {filterPortal !== 'all'
              ? `No events recorded for the ${activeTab.label} portal.`
              : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">

          {/* Column headers */}
          <div className="hidden sm:grid sm:grid-cols-[7rem_1fr_10rem_7rem] gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Action</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Activity</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Actor</span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">Time</span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {logs.map((log) => (
              <div
                key={log.id}
                className={[
                  'flex flex-col gap-2 px-4 py-3 hover:bg-slate-50/70 transition-colors',
                  'sm:grid sm:grid-cols-[7rem_1fr_10rem_7rem] sm:gap-3 sm:items-start',
                ].join(' ')}
              >
                {/* Action badge */}
                <div className="flex items-start">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${
                    ACTION_COLOR[log.action] ?? 'bg-slate-50 text-slate-600 ring-1 ring-slate-200'
                  }`}>
                    {log.action.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Description + entity */}
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 leading-snug wrap-break-word">
                    {log.description ?? '—'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {ENTITY_LABELS[log.entity] ?? log.entity}
                    {log.entityId ? (
                      <span className="font-mono"> · {log.entityId}</span>
                    ) : null}
                  </p>
                </div>

                {/* Actor */}
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {log.user?.name ?? log.clientUser?.name ?? 'System'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {log.user
                      ? log.user.role.replace(/_/g, ' ')
                      : log.clientUser
                        ? 'Client Portal'
                        : 'System'}
                  </p>
                  {log.ipAddress && (
                    <p className="text-[10px] font-mono text-slate-300 mt-0.5 truncate">
                      {log.ipAddress}
                    </p>
                  )}
                </div>

                {/* Time */}
                <time className="text-[11px] text-slate-400 whitespace-nowrap sm:text-right">
                  {new Date(log.createdAt).toLocaleString('en-PH', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </time>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────── */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-slate-500">
            Page{' '}
            <span className="font-semibold text-slate-700">{pagination.page}</span>
            {' '}of{' '}
            <span className="font-semibold text-slate-700">{pagination.totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={13} />
              Prev
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Next
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
