'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft, ChevronRight, Building2, CheckCircle2,
  Clock, AlertCircle, Calendar, Users,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';
import { SubscriptionDetail } from './SubscriptionDetail';
import { EWTDetail } from './EWTDetail';
import { CWTDetail } from './CWTDetail';
import { SalesBookDetail } from './SalesBookDetail';
import { ExpensesBookDetail } from './ExpensesBookDetail';

// ─── Types ─────────────────────────────────────────────────────────────────────

type DashboardView  = 'overview' | 'compliance-clients' | 'detail';
type FilingStatus   = 'Filed' | 'In Progress' | 'Not Filed';
type ProcessStatus  = 'Preparing' | 'For Verification' | 'For Payment' | 'For Approval' | 'Completed';
type DeadlineUrgency = 'overdue' | 'critical' | 'soon' | 'upcoming';

interface ComplianceDef {
  id:           string;
  name:         string;
  department:   string;
  vatOnly:      boolean;
  nonVatOnly:   boolean;
  secRequired:  boolean;
  minLevel:     number;
  period:       string;
  deadline:     string;  // ISO "YYYY-MM-DD"
  periodType:   'monthly' | 'quarterly' | 'annual';
}

// ─── Compliance schedule (Philippine regulatory calendar) ─────────────────────

const COMPLIANCE_DEFS: ComplianceDef[] = [
  { id: 'ewt',            name: 'Expanded Withholding Tax',                 department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-10', periodType: 'monthly'   },
  { id: 'hdmf',           name: 'Pag-IBIG Fund',                           department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-10', periodType: 'monthly'   },
  { id: 'cwt',            name: 'Compensation Withholding Tax',             department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-15', periodType: 'monthly'   },
  { id: 'income-tax',     name: 'Income Tax',                               department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 3, period: 'Year 2025',   deadline: '2026-04-15', periodType: 'annual'    },
  { id: 'sales-book',     name: 'Sales Book',                               department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-20', periodType: 'monthly'   },
  { id: 'expense-book',   name: 'Expenses Book',                            department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-20', periodType: 'monthly'   },
  { id: 'percentage-tax', name: 'Percentage Tax',                           department: 'BIR',           vatOnly: false, nonVatOnly: true,  secRequired: false, minLevel: 2, period: 'Q1 2026',     deadline: '2026-04-25', periodType: 'quarterly' },
  { id: 'vat',            name: 'Value-Added Tax',                          department: 'BIR',           vatOnly: true,  nonVatOnly: false, secRequired: false, minLevel: 2, period: 'Q1 2026',     deadline: '2026-04-25', periodType: 'quarterly' },
  { id: 'sss',            name: 'Social Security System',                   department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-30', periodType: 'monthly'   },
  { id: 'phic',           name: 'PhilHealth',                               department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2, period: 'March 2026',  deadline: '2026-04-30', periodType: 'monthly'   },
  { id: 'sec-afs',        name: 'SEC AFS Submission',                       department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3, period: 'Year 2025',   deadline: '2026-05-15', periodType: 'annual'    },
  { id: 'gis',            name: 'General Information Sheet',                department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3, period: 'Year 2026',   deadline: '2026-05-30', periodType: 'annual'    },
];

// ─── Plan helpers ──────────────────────────────────────────────────────────────

function isVatPlan(basePlan: string): boolean {
  if (basePlan === 'vip') return true;
  return basePlan.includes('vat') && !basePlan.includes('non-vat');
}

function getPlanLevel(basePlan: string): number {
  if (basePlan === 'vip') return 4;
  if (basePlan.includes('agila360')) return 3;
  if (basePlan.includes('essentials')) return 2;
  return 1;
}

function isComplianceActive(def: ComplianceDef, client: MockClientWithCompliance): boolean {
  const basePlan = client.planDetails?.basePlan ?? 'starter';
  const level    = getPlanLevel(basePlan);
  const isVat    = isVatPlan(basePlan);
  if (level < def.minLevel)           return false;
  if (def.vatOnly    && !isVat)       return false;
  if (def.nonVatOnly &&  isVat)       return false;
  if (def.secRequired && !client.isBusinessRegistered) return false;
  return true;
}

// ─── Mock filing / process statuses (deterministic seed) ─────────────────────

function charSum(s: string): number {
  return s.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
}

const FILING_POOL: FilingStatus[]  = ['Filed', 'Filed', 'Filed', 'Filed', 'In Progress', 'In Progress', 'In Progress', 'Not Filed', 'Not Filed', 'Not Filed'];
const PROCESS_POOL: ProcessStatus[] = ['Preparing', 'For Verification', 'For Payment', 'For Approval', 'Completed'];

function getMockFilingStatus(clientId: string, complianceId: string): FilingStatus {
  return FILING_POOL[(charSum(clientId) + charSum(complianceId)) % 10];
}

function getMockProcessStatus(clientId: string, complianceId: string): ProcessStatus {
  return PROCESS_POOL[(charSum(clientId) * 3 + charSum(complianceId) * 7) % 5];
}

// ─── Deadline utilities ────────────────────────────────────────────────────────

// Stable reference date — computed once per module load, not on every render
const REF_DATE = new Date();

function getUrgency(deadlineIso: string): DeadlineUrgency {
  const days = (new Date(deadlineIso).getTime() - REF_DATE.getTime()) / (1000 * 60 * 60 * 24);
  if (days < 0)   return 'overdue';
  if (days <= 3)  return 'critical';
  if (days <= 10) return 'soon';
  return 'upcoming';
}

function daysUntil(deadlineIso: string): number {
  return Math.ceil((new Date(deadlineIso).getTime() - REF_DATE.getTime()) / (1000 * 60 * 60 * 24));
}

function fmtDeadline(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

// ─── Urgency styling map ───────────────────────────────────────────────────────

const URGENCY_STYLE: Record<DeadlineUrgency, { iconBg: string; iconText: string; text: string }> = {
  overdue:  { iconBg: 'bg-red-100',    iconText: 'text-red-600',    text: 'text-red-600'    },
  critical: { iconBg: 'bg-orange-100', iconText: 'text-orange-600', text: 'text-orange-600' },
  soon:     { iconBg: 'bg-amber-100',  iconText: 'text-amber-600',  text: 'text-amber-600'  },
  upcoming: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600',text: 'text-slate-700'  },
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function UrgencyPill({ urgency, days, compact = false }: {
  urgency: DeadlineUrgency;
  days:    number;
  compact?: boolean;
}): React.ReactElement {
  const map: Record<DeadlineUrgency, { cls: string; label: string }> = {
    overdue:  { cls: 'bg-red-100 text-red-700',        label: compact ? 'Overdue'   : `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`   },
    critical: { cls: 'bg-orange-100 text-orange-700',  label: compact ? 'Critical'  : `Due in ${days} day${days !== 1 ? 's' : ''}`                         },
    soon:     { cls: 'bg-amber-100 text-amber-700',    label: compact ? 'Due Soon'  : `Due in ${days} days`                                                 },
    upcoming: { cls: 'bg-slate-100 text-slate-600',    label: compact ? 'Upcoming'  : `${days} days away`                                                   },
  };
  const { cls, label } = map[urgency];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wide whitespace-nowrap ${cls}`}>
      {urgency === 'overdue'  && <AlertCircle size={9} />}
      {urgency === 'critical' && <AlertCircle size={9} />}
      {urgency === 'soon'     && <Clock size={9} />}
      {urgency === 'upcoming' && <Calendar size={9} />}
      {label}
    </span>
  );
}

function FilingBadge({ status }: { status: FilingStatus }): React.ReactElement {
  if (status === 'Filed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        <CheckCircle2 size={9} /> Filed
      </span>
    );
  }
  if (status === 'In Progress') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        <Clock size={9} /> In Progress
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 text-rose-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <AlertCircle size={9} /> Not Filed
    </span>
  );
}

const PROCESS_STEP: Record<ProcessStatus, number> = {
  'Preparing':        1,
  'For Verification': 2,
  'For Payment':      3,
  'For Approval':     4,
  'Completed':        5,
};
const PROCESS_CLS: Record<ProcessStatus, string> = {
  'Preparing':        'bg-slate-100 text-slate-600',
  'For Verification': 'bg-blue-100 text-blue-700',
  'For Payment':      'bg-violet-100 text-violet-700',
  'For Approval':     'bg-amber-100 text-amber-700',
  'Completed':        'bg-emerald-100 text-emerald-700',
};

function ProcessBadge({ status }: { status: ProcessStatus }): React.ReactElement {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${PROCESS_CLS[status]}`}>
      {PROCESS_STEP[status]}/5 · {status}
    </span>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ pct, size = 'md' }: { pct: number; size?: 'sm' | 'md' }): React.ReactElement {
  const barColor = pct === 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className={`rounded-full bg-slate-100 overflow-hidden ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ComplianceDashboard(): React.ReactNode {
  const clients = MOCK_COMPLIANCE_CLIENTS;

  const [view,           setView]           = useState<DashboardView>('overview');
  const [selectedDef,    setSelectedDef]    = useState<ComplianceDef | null>(null);
  const [selectedClient, setSelectedClient] = useState<MockClientWithCompliance | null>(null);
  const [selectedYear,   setSelectedYear]   = useState(2026);

  // Pre-compute per-compliance metrics
  const complianceData = useMemo(() =>
    COMPLIANCE_DEFS.map((def) => {
      const active    = clients.filter((c) => isComplianceActive(def, c));
      const filed     = active.filter((c) => getMockFilingStatus(c.id, def.id) === 'Filed').length;
      const pct       = active.length > 0 ? Math.round((filed / active.length) * 100) : 0;
      const urgency   = getUrgency(def.deadline);
      const days      = daysUntil(def.deadline);
      return { def, active, filed, pct, urgency, days };
    }),
  [clients]);

  // Summary counts
  const totalOverdue  = complianceData.filter((d) => d.urgency === 'overdue').length;
  const totalCritical = complianceData.filter((d) => d.urgency === 'critical' || d.urgency === 'soon').length;
  const avgPct        = Math.round(complianceData.reduce((s, d) => s + d.pct, 0) / complianceData.length);

  // ─── Detail view (a specific client's specific compliance) ──────────────────

  if (view === 'detail' && selectedDef && selectedClient) {
    const goBack = () => setView('compliance-clients');

    if (selectedDef.id === 'subscription') return <SubscriptionDetail client={selectedClient} year={selectedYear} onYearChange={setSelectedYear}/>;
    if (selectedDef.id === 'ewt')          return <EWTDetail          client={selectedClient} year={selectedYear} onYearChange={setSelectedYear}/>;
    if (selectedDef.id === 'cwt')          return <CWTDetail          client={selectedClient} year={selectedYear} onYearChange={setSelectedYear}/>;
    if (selectedDef.id === 'sales-book')   return <SalesBookDetail    client={selectedClient} year={selectedYear} onYearChange={setSelectedYear}/>;
    if (selectedDef.id === 'expense-book') return <ExpensesBookDetail client={selectedClient} year={selectedYear} onYearChange={setSelectedYear}/>;

    // Placeholder for compliance types without a detail component yet
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to Client List
        </button>
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">{selectedClient.businessName} · {selectedDef.name}</p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedDef.period}</h1>
            </div>
          </div>
        </Card>
        <Card className="p-16 text-center border-dashed border-slate-200">
          <p className="text-sm text-slate-400">Detail view for <strong>{selectedDef.name}</strong> is coming soon.</p>
        </Card>
      </div>
    );
  }

  // ─── Compliance clients view ─────────────────────────────────────────────────

  if (view === 'compliance-clients' && selectedDef) {
    const data   = complianceData.find((d) => d.def.id === selectedDef.id)!;
    const rows   = data.active.map((c) => ({
      client:  c,
      filing:  getMockFilingStatus(c.id, selectedDef.id),
      process: getMockProcessStatus(c.id, selectedDef.id),
    }));
    const filed      = rows.filter((r) => r.filing === 'Filed').length;
    const inProgress = rows.filter((r) => r.filing === 'In Progress').length;
    const notFiled   = rows.filter((r) => r.filing === 'Not Filed').length;
    const style      = URGENCY_STYLE[data.urgency];

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button onClick={() => setView('overview')} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={16} /> Back to Dashboard
        </button>

        {/* Compliance header card */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                <Calendar size={22} className={style.iconText} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{selectedDef.department}</p>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedDef.name}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  Period: <span className="font-semibold text-slate-700">{selectedDef.period}</span>
                  <span className="mx-2 text-slate-300">·</span>
                  Deadline: <span className={`font-semibold ${style.text}`}>{fmtDeadline(selectedDef.deadline)}</span>
                </p>
              </div>
            </div>
            <UrgencyPill urgency={data.urgency} days={data.days} />
          </div>

          {/* Progress bar */}
          <div className="mt-5 pt-5 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filing Progress</span>
              <span className="text-sm font-black text-slate-800">{data.filed} / {data.active.length} clients  ·  {data.pct}%</span>
            </div>
            <ProgressBar pct={data.pct} />
            <div className="flex items-center gap-5 text-[10px] font-semibold uppercase tracking-wide pt-0.5">
              <span className="text-emerald-600">{filed} Filed</span>
              <span className="text-amber-600">{inProgress} In Progress</span>
              <span className="text-rose-600">{notFiled} Not Filed</span>
            </div>
          </div>
        </Card>

        {/* Client table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Clients — {data.active.length} enrolled
            </p>
          </div>

          {rows.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-3">
              <Users size={28} className="text-slate-300" />
              <p className="text-sm text-slate-400">No clients enrolled for this compliance.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: '560px' }}>
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Client</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Plan</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Filing Status</th>
                    <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Process Status</th>
                    <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ client, filing, process }) => (
                    <tr
                      key={client.id}
                      className="border-b border-slate-100 hover:bg-emerald-50/40 transition-colors cursor-pointer group"
                      onClick={() => { setSelectedClient(client); setView('detail'); }}
                    >
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{client.businessName}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">{client.clientNo}</p>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">{client.planDetails?.displayName ?? '—'}</td>
                      <td className="px-5 py-3.5"><FilingBadge status={filing} /></td>
                      <td className="px-5 py-3.5"><ProcessBadge status={process} /></td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedClient(client); setView('detail'); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
                        >
                          Working Paper <ChevronRight size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ─── Overview: compliance deadline cards ─────────────────────────────────────

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Upcoming compliance deadlines and filing progress across all clients.</p>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Compliances',   value: COMPLIANCE_DEFS.length,      color: 'text-slate-800',    iconBg: 'bg-slate-100',    icon: <Calendar size={18} />     },
          { label: 'Overdue',             value: totalOverdue,                 color: 'text-red-700',      iconBg: 'bg-red-50',       icon: <AlertCircle size={18} />  },
          { label: 'Due Within 10 Days',  value: totalCritical,                color: 'text-amber-700',    iconBg: 'bg-amber-50',     icon: <Clock size={18} />        },
          { label: 'Avg. Completion',     value: `${avgPct}%`,                 color: 'text-emerald-700',  iconBg: 'bg-emerald-50',   icon: <CheckCircle2 size={18} /> },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.iconBg} ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">{s.label}</p>
              <p className={`text-xl font-black mt-1 ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Compliance cards: split into urgent (≤30 days / overdue) and later ── */}
      {(() => {
        const urgent  = complianceData.filter(({ days }) => days <= 30);
        const later   = complianceData.filter(({ days }) => days >  30);

        const ComplianceCard = ({ def, active, filed, pct, urgency, days }: typeof complianceData[number]) => {
          const style = URGENCY_STYLE[urgency];
          return (
            <button
              key={def.id}
              onClick={() => { setSelectedDef(def); setView('compliance-clients'); }}
              className="text-left bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group"
            >
              {/* Card header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${style.iconBg}`}>
                    <Calendar size={16} className={style.iconText} />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400">{def.department}</span>
                    <span className="block text-sm font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">{def.name}</span>
                  </div>
                </div>
                <UrgencyPill urgency={urgency} days={days} compact />
              </div>

              {/* Period + deadline */}
              <div className="space-y-1 mb-4 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Period</span>
                  <span className="font-semibold text-slate-700">{def.period}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Deadline</span>
                  <span className={`font-semibold ${style.text}`}>{fmtDeadline(def.deadline)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Enrolled Clients</span>
                  <span className="font-semibold text-slate-700">{active.length}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-black uppercase tracking-widest text-slate-400">Filing Progress</span>
                  <span className="font-black text-slate-700">{filed}/{active.length} · {pct}%</span>
                </div>
                <ProgressBar pct={pct} size="sm" />
              </div>

              {/* Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {active.length > 0 ? `${active.length - filed} pending` : 'No clients'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 group-hover:gap-1.5 transition-all">
                  View Clients <ChevronRight size={11} />
                </span>
              </div>
            </button>
          );
        };

        return (
          <>
            {urgent.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={15} className="text-red-500 shrink-0" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-red-600">
                      Urgent
                    </h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-black">
                    {urgent.length}
                  </span>
                  <div className="flex-1 h-px bg-red-100" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {urgent.map((d) => <ComplianceCard key={d.def.id} {...d} />)}
                </div>
              </div>
            )}

            {later.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={15} className="text-slate-400 shrink-0" />
                    <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                      Upcoming — More Than 1 Month Away
                    </h3>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 px-2 py-0.5 text-[10px] font-black">
                    {later.length}
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {later.map((d) => <ComplianceCard key={d.def.id} {...d} />)}
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
