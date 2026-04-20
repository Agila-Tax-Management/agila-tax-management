'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Play, CheckCircle, PauseCircle, RotateCcw, Zap, Loader2, CalendarDays, Users, ChevronRight, AlertCircle, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

type SalaryFrequency = 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
type PeriodStatus = 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'CLOSED';

interface PayrollScheduleItem {
  id: string;
  name: string;
  frequency: SalaryFrequency;
  firstPeriodStartDay: number;
  firstPeriodEndDay: number;
  firstPayoutDay: number;
  secondPeriodStartDay: number | null;
  secondPeriodEndDay: number | null;
  secondPayoutDay: number | null;
  isActive: boolean;
}

interface PayrollPeriodRow {
  id: number;
  payrollScheduleId: string | null;
  payrollSchedule: { id: string; name: string; frequency: string } | null;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: PeriodStatus;
  employeeCount: number;
  grossPayTotal: number;
  netPayTotal: number;
  totalDeductionsSum: number;
}

interface GenerateCandidate {
  periodNumber: 1 | 2;
  year: number;
  month: number;
  startDay: number;
  endDay: number;
  label: string;
  monthLabel: string;
  dateRange: string;
  alreadyExists: boolean;
}

// ─── Date Helpers ─────────────────────────────────────────────────

/**
 * Resolves a configured day against the actual last day of the given month.
 * Handles EOM: 31 → 28/29 for February, 30 for April, etc.
 * month is 1-indexed (1 = January).
 */
function resolveEndDay(year: number, month: number, configuredDay: number): number {
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  return Math.min(configuredDay, lastDayOfMonth);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Builds all generate-able period candidates for a given schedule over the past N months.
 * Each candidate carries whether the period already exists in the generated list.
 */
function computeCandidates(
  schedule: PayrollScheduleItem,
  existingPeriods: { payrollScheduleId: string | null; startDate: string; endDate: string }[],
  today: Date,
  monthsBack = 5,
): GenerateCandidate[] {
  const candidates: GenerateCandidate[] = [];

  const periodConfigs: {
    number: 1 | 2;
    label: string;
    startDay: number | null;
    endDayCfg: number | null;
  }[] = [
    {
      number: 1,
      label: schedule.frequency === 'ONCE_A_MONTH' ? 'Full Month' : '1st Half',
      startDay: schedule.firstPeriodStartDay,
      endDayCfg: schedule.firstPeriodEndDay,
    },
  ];
  if (
    schedule.frequency === 'TWICE_A_MONTH' &&
    schedule.secondPeriodStartDay !== null &&
    schedule.secondPeriodEndDay !== null
  ) {
    periodConfigs.push({
      number: 2,
      label: '2nd Half',
      startDay: schedule.secondPeriodStartDay,
      endDayCfg: schedule.secondPeriodEndDay,
    });
  }

  for (let offset = monthsBack; offset >= 0; offset--) {
    const refDate = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const year = refDate.getFullYear();
    const month = refDate.getMonth() + 1; // 1-based

    for (const cfg of periodConfigs) {
      if (cfg.startDay === null || cfg.endDayCfg === null) continue;
      const resolvedEnd = resolveEndDay(year, month, cfg.endDayCfg);

      const alreadyExists = existingPeriods.some((p) => {
        if (p.payrollScheduleId !== schedule.id) return false;
        const ps = new Date(p.startDate);
        const pe = new Date(p.endDate);
        return (
          ps.getFullYear() === year &&
          ps.getMonth() === month - 1 &&
          ps.getDate() === cfg.startDay &&
          pe.getFullYear() === year &&
          pe.getMonth() === month - 1 &&
          pe.getDate() === resolvedEnd
        );
      });

      candidates.push({
        periodNumber: cfg.number,
        year,
        month,
        startDay: cfg.startDay,
        endDay: resolvedEnd,
        label: cfg.label,
        monthLabel: `${MONTH_NAMES[month - 1] ?? ''} ${year}`,
        dateRange: `${MONTH_SHORT[month - 1] ?? ''} ${cfg.startDay} – ${MONTH_SHORT[month - 1] ?? ''} ${resolvedEnd}, ${year}`,
        alreadyExists,
      });
    }
  }

  return candidates;
}

// ─── Status display config ────────────────────────────────────────

const STATUS_VARIANT: Record<PeriodStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  DRAFT: 'neutral',
  PROCESSING: 'info',
  APPROVED: 'success',
  PAID: 'success',
  CLOSED: 'neutral',
};

const STATUS_LABEL: Record<PeriodStatus, string> = {
  DRAFT: 'Draft',
  PROCESSING: 'Processing',
  APPROVED: 'Approved',
  PAID: 'Paid',
  CLOSED: 'Closed',
};

const fmt = (v: number) =>
  `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Component ────────────────────────────────────────────────────

export function PayrollCoordination() {
  const { success, error } = useToast();
  const router = useRouter();

  const [schedules, setSchedules] = useState<PayrollScheduleItem[]>([]);
  const [periods, setPeriods] = useState<PayrollPeriodRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [genScheduleId, setGenScheduleId] = useState('');
  const [genSelectedKey, setGenSelectedKey] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ periodId: number; label: string } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Confirmation modal for status transitions
  const [confirmModal, setConfirmModal] = useState<{
    periodId: number;
    targetStatus: PeriodStatus;
    title: string;
    message: string;
    btnClass: string;
    icon: React.ReactNode;
  } | null>(null);

  // ── Fetch schedules + periods ─────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schedRes, perRes] = await Promise.all([
        fetch('/api/hr/payroll-schedules'),
        fetch('/api/hr/payroll-periods'),
      ]);
      const schedJson: { data?: PayrollScheduleItem[] } = await schedRes.json();
      const perJson: { data?: PayrollPeriodRow[] } = await perRes.json();
      setSchedules(schedJson.data ?? []);
      setPeriods(perJson.data ?? []);
    } catch {
      error('Failed to load', 'Could not fetch payroll data');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Update period status ──────────────────────────────────────

  const updatePeriodStatus = async (periodId: number, newStatus: PeriodStatus) => {
    setUpdatingStatus(true);
    setConfirmModal(null);
    try {
      const res = await fetch(`/api/hr/payroll-periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to update', json.error ?? 'An error occurred');
        return;
      }
      success('Status updated', `Payroll period moved to ${STATUS_LABEL[newStatus]}.`);
      setPeriods((prev) =>
        prev.map((p) => (p.id === periodId ? { ...p, status: newStatus } : p)),
      );
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ── Delete period ──────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/payroll-periods/${deleteModal.periodId}`, { method: 'DELETE' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Delete failed', json.error ?? 'Could not delete payroll period');
        return;
      }
      success('Deleted', `Payroll period "${deleteModal.label}" has been deleted.`);
      setDeleteModal(null);
      setDeleteConfirmText('');
      setPeriods((prev) => prev.filter((p) => p.id !== deleteModal.periodId));
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setDeleting(false);
    }
  };

  // ── Generate payroll ──────────────────────────────────────────

  const handleGenerate = async (candidate: GenerateCandidate, schedule: PayrollScheduleItem) => {
    setGenerating(true);
    try {
      const res = await fetch('/api/hr/payroll-periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payrollScheduleId: schedule.id,
          periodNumber: candidate.periodNumber,
          year: candidate.year,
          month: candidate.month,
        }),
      });
      const json: { data?: PayrollPeriodRow; error?: string } = await res.json();
      if (!res.ok) {
        error('Generation failed', json.error ?? 'Could not generate payroll period');
        return;
      }
      success(
        'Payroll generated',
        `Draft payslips created for ${schedule.name} · ${candidate.dateRange}`,
      );
      setGenModalOpen(false);
      setGenScheduleId('');
      setGenSelectedKey(null);
      await fetchData();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setGenerating(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────

  const today = useMemo(() => new Date(), []);

  const genCandidates = useMemo(() => {
    if (!genScheduleId) return [] as GenerateCandidate[];
    const sched = schedules.find((s) => s.id === genScheduleId);
    if (!sched) return [] as GenerateCandidate[];
    return computeCandidates(sched, periods, today);
  }, [genScheduleId, schedules, periods, today]);

  const genCandidatesGrouped = useMemo(() => {
    const grouped = new Map<string, GenerateCandidate[]>();
    for (const c of [...genCandidates].reverse()) {
      const arr = grouped.get(c.monthLabel) ?? [];
      arr.push(c);
      grouped.set(c.monthLabel, arr);
    }
    return [...grouped.entries()];
  }, [genCandidates]);

  const filtered = useMemo(() => {
    return periods.filter((p) => {
      const matchSearch =
        search === '' ||
        (p.payrollSchedule?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        fmtDate(p.startDate).toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [periods, search, statusFilter]);

  const totalGross = filtered.reduce((s, p) => s + p.grossPayTotal, 0);
  const totalNet = filtered.reduce((s, p) => s + p.netPayTotal, 0);
  const totalDed = filtered.reduce((s, p) => s + p.totalDeductionsSum, 0);
  const paidCount = filtered.filter((p) => p.status === 'PAID').length;

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Payroll Coordination</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage payroll periods and employee compensation disbursements.
          </p>
        </div>
        <Button
          onClick={() => setGenModalOpen(true)}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shrink-0"
        >
          <Zap size={15} /> Generate Payroll
        </Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Gross Pay', value: fmt(totalGross), color: 'text-emerald-600' },
          { label: 'Total Net Pay', value: fmt(totalNet), color: 'text-blue-600' },
          { label: 'Total Deductions', value: fmt(totalDed), color: 'text-red-500' },
          { label: 'Paid Periods', value: `${paidCount}/${filtered.length}`, color: 'text-foreground' },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Filters ── */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by schedule or date…"
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PROCESSING">Processing</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </Card>

      {/* ── Table ── */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading payroll periods…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Schedule / Period
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                    Payout Date
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">
                    <Users size={13} className="inline mr-1" />
                    Employees
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">
                    Gross Pay
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-black text-foreground text-sm">
                        {fmtDate(p.startDate)} – {fmtDate(p.endDate)}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarDays size={11} />
                        {p.payrollSchedule?.name ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                      {fmtDate(p.payoutDate)}
                    </td>
                    <td className="px-4 py-3 text-center hidden sm:table-cell">
                      <span className="text-sm font-semibold text-foreground">{p.employeeCount}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-muted-foreground hidden lg:table-cell">
                      {fmt(p.grossPayTotal)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-foreground">
                      {fmt(p.netPayTotal)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[p.status]}>{STATUS_LABEL[p.status]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {p.status === 'DRAFT' && (
                          <>
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 gap-1.5 text-xs text-blue-600"
                              onClick={() => setConfirmModal({
                                periodId: p.id,
                                targetStatus: 'PROCESSING',
                                title: 'Start Processing',
                                message: `Move "${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}" to Processing? You will be able to review and edit individual payslips.`,
                                btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',
                                icon: <Play size={14} />,
                              })}
                              title="Start Processing"
                            >
                              <Play size={14} /> Process
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setDeleteConfirmText('');
                                setDeleteModal({ periodId: p.id, label: `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}` });
                              }}
                              title="Delete period"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </>
                        )}
                        {p.status === 'PROCESSING' && (
                          <>
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 gap-1.5 text-xs text-emerald-600"
                              onClick={() => setConfirmModal({
                                periodId: p.id,
                                targetStatus: 'APPROVED',
                                title: 'Approve All Payslips',
                                message: `Approve all payslips for "${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}"? Any unapproved payslips will be bulk-approved and released to employees for acknowledgment.`,
                                btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white',
                                icon: <CheckCircle size={14} />,
                              })}
                              title="Approve All"
                            >
                              <CheckCircle size={14} /> Approve All
                            </Button>
                            <Button
                              variant="ghost"
                              className="h-8 px-2.5 gap-1.5 text-xs text-amber-600"
                              onClick={() => setConfirmModal({
                                periodId: p.id,
                                targetStatus: 'DRAFT',
                                title: 'Revert to Draft',
                                message: `Revert "${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}" back to Draft? Employees will lose visibility of any approved payslips.`,
                                btnClass: 'bg-amber-600 hover:bg-amber-700 text-white',
                                icon: <PauseCircle size={14} />,
                              })}
                              title="Revert to Draft"
                            >
                              <PauseCircle size={14} /> Revert
                            </Button>
                          </>
                        )}
                        {p.status === 'APPROVED' && (
                          <Button
                            variant="ghost"
                            className="h-8 px-2.5 gap-1.5 text-xs text-emerald-700"
                            onClick={() => setConfirmModal({
                              periodId: p.id,
                              targetStatus: 'PAID',
                              title: 'Mark All as Paid',
                              message: `Mark all payslips as Paid for "${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}"? All employees must have acknowledged their payslips first.`,
                              btnClass: 'bg-emerald-700 hover:bg-emerald-800 text-white',
                              icon: <CheckCircle size={14} />,
                            })}
                            title="Mark All Paid"
                          >
                            <CheckCircle size={14} /> Mark Paid
                          </Button>
                        )}
                        {p.status === 'PAID' && (
                          <Button
                            variant="ghost"
                            className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground"
                            onClick={() => setConfirmModal({
                              periodId: p.id,
                              targetStatus: 'CLOSED',
                              title: 'Close Period',
                              message: `Close payroll period "${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}"? This will archive the period.`,
                              btnClass: 'bg-gray-600 hover:bg-gray-700 text-white',
                              icon: <RotateCcw size={14} />,
                            })}
                            title="Close Period"
                          >
                            <RotateCcw size={14} /> Close
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          className="h-10 w-10 p-0 ml-1"
                          onClick={() => router.push(`/portal/hr/payroll-coordination/${p.id}`)}
                          title="View Payslips"
                        >
                          <ChevronRight size={18} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-14 text-center text-muted-foreground text-sm">
                      {periods.length === 0
                        ? 'No payroll periods generated yet. Use the Generate button above to create one.'
                        : 'No periods match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        isOpen={deleteModal !== null}
        onClose={() => { setDeleteModal(null); setDeleteConfirmText(''); }}
        title="Delete Payroll Period"
        size="sm"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <Trash2 size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground mb-1">This action cannot be undone.</p>
              <p className="text-sm text-muted-foreground">
                All draft payslips for <span className="font-semibold text-foreground">{deleteModal?.label}</span> will be permanently removed.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Type <span className="text-red-500 font-mono">delete</span> to confirm
            </label>
            <input
              type="text"
              placeholder="delete"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => { setDeleteModal(null); setDeleteConfirmText(''); }}>
              Cancel
            </Button>
            <Button
              className="gap-2 bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteConfirmText !== 'delete' || deleting}
              onClick={() => { void handleDelete(); }}
            >
              {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete Period
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Generate Payroll Modal ── */}
      <Modal
        isOpen={genModalOpen}
        onClose={() => { setGenModalOpen(false); setGenScheduleId(''); setGenSelectedKey(null); }}
        title="Generate Payroll"
        size="md"
      >
        <div className="p-5 space-y-5">
          {/* Schedule selector */}
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Payroll Schedule
            </label>
            <select
              className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              value={genScheduleId}
              onChange={(e) => { setGenScheduleId(e.target.value); setGenSelectedKey(null); }}
            >
              <option value="">— Select a schedule —</option>
              {schedules.filter((s) => s.isActive).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Period candidates */}
          {genScheduleId && (
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">
                Select Period
              </label>
              {genCandidatesGrouped.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No periods available for this schedule.
                </p>
              ) : (
                <div className="space-y-4 max-h-64 overflow-y-auto pr-1">
                  {genCandidatesGrouped.map(([monthLabel, cands]) => (
                    <div key={monthLabel}>
                      <p className="text-xs font-bold text-foreground mb-2">{monthLabel}</p>
                      <div className={`grid gap-2 ${cands.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                        {cands.map((c) => {
                          const key = `${c.year}-${c.month}-${c.periodNumber}`;
                          const isSelected = genSelectedKey === key;
                          return (
                            <button
                              key={key}
                              type="button"
                              disabled={c.alreadyExists}
                              onClick={() => setGenSelectedKey(isSelected ? null : key)}
                              className={`text-left rounded-xl border p-3 transition-all ${
                                c.alreadyExists
                                  ? 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
                                  : isSelected
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20 cursor-pointer'
                                    : 'border-border hover:border-blue-300 hover:bg-muted/30 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-bold text-foreground">{c.label}</p>
                                {c.alreadyExists ? (
                                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                    ✓ Generated
                                  </span>
                                ) : isSelected ? (
                                  <CheckCircle size={14} className="text-blue-500 shrink-0" />
                                ) : null}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{c.dateRange}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button
              variant="outline"
              onClick={() => { setGenModalOpen(false); setGenScheduleId(''); setGenSelectedKey(null); }}
            >
              Cancel
            </Button>
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!genSelectedKey || generating}
              onClick={() => {
                if (!genSelectedKey) return;
                const candidate = genCandidates.find(
                  (c) => `${c.year}-${c.month}-${c.periodNumber}` === genSelectedKey,
                );
                const sched = schedules.find((s) => s.id === genScheduleId);
                if (!candidate || !sched) return;
                void handleGenerate(candidate, sched);
              }}
            >
              {generating ? (
                <><Loader2 size={14} className="animate-spin" /> Generating…</>
              ) : (
                <><Zap size={14} /> Generate Payroll</>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal
        isOpen={confirmModal !== null}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.title ?? ''}
        size="sm"
      >
        <div className="p-5 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{confirmModal?.message}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setConfirmModal(null)}>
              Cancel
            </Button>
            <Button
              className={`gap-2 ${confirmModal?.btnClass ?? ''}`}
              disabled={updatingStatus}
              onClick={() => {
                if (confirmModal) {
                  void updatePeriodStatus(confirmModal.periodId, confirmModal.targetStatus);
                }
              }}
            >
              {updatingStatus ? <Loader2 size={14} className="animate-spin" /> : confirmModal?.icon}
              Confirm
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
