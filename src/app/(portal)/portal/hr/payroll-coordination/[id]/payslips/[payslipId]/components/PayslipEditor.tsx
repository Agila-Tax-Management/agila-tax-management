// src/app/(portal)/portal/hr/payroll-coordination/[id]/payslips/[payslipId]/components/PayslipEditor.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Save, RotateCcw, CheckCircle, FileText,
  User, Calendar, CreditCard, Briefcase, Building2, DollarSign,
  Banknote, ThumbsUp, RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

type PeriodStatus = 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'CLOSED';

interface WorkScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  breakStart: string | null;
  breakEnd: string | null;
}

interface ActiveCompensation {
  baseRate: string;
  allowanceRate: string;
  payType: string;
  rateType: string;
  frequency: string;
  calculatedDailyRate: string;
  calculatedMonthlyRate: string;
  deductSss: boolean;
  deductPhilhealth: boolean;
  deductPagibig: boolean;
  pagibigType: string;
}

interface TimesheetRecord {
  id: string;
  date: string;
  status: string;
  timeIn: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  timeOut: string | null;
  lateMinutes: number;
  undertimeMinutes: number;
  regularHours: string;
  regOtHours: string;
  rdHours: string;
  rdOtHours: string;
  shHours: string;
  shOtHours: string;
  shRdHours: string;
  shRdOtHours: string;
  rhHours: string;
  rhOtHours: string;
  rhRdHours: string;
  rhRdOtHours: string;
  dailyGrossPay: string;
}

interface PayslipDetail {
  id: string;
  employeeId: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    employments: {
      hireDate: string | null;
      department: { name: string } | null;
      position: { title: string } | null;
      contracts: {
        schedule: {
          id: string;
          name: string;
          timezone: string | null;
          days: WorkScheduleDay[];
        } | null;
        compensations: ActiveCompensation[];
      }[];
    }[];
  };
  payrollPeriod: {
    id: number;
    startDate: string;
    endDate: string;
    payoutDate: string;
    status: PeriodStatus;
    payrollSchedule: { name: string; frequency: string } | null;
  };
  // Earnings
  basicPay: string;
  holidayPay: string;
  overtimePay: string;
  paidLeavePay: string;
  allowance: string;
  grossPay: string;
  // Deductions
  sssDeduction: string;
  philhealthDeduction: string;
  pagibigDeduction: string;
  withholdingTax: string;
  lateUndertimeDeduction: string;
  pagibigLoan: string;
  sssLoan: string;
  cashAdvanceRepayment: string;
  totalDeductions: string;
  netPay: string;
  disbursedStatus: string;
  // Audit
  preparedAt: string | null;
  approvedAt: string | null;
  acknowledgedAt: string | null;
  preparedBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  acknowledgedBy: { id: string; name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────

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

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const fmtTime = (dt: string | null): string => {
  if (!dt) return '—';
  const d = new Date(dt);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const fmtHours = (h: string | number): string => {
  const n = Number(h);
  return n === 0 ? '—' : n.toFixed(2);
};

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function computeRowPay(
  ts: TimesheetRecord,
  dailyRate: number,
  payType: string,
  scheduleDays: WorkScheduleDay[] | undefined,
  dayOfWeek: number,
) {
  const sd = scheduleDays?.find((d) => d.dayOfWeek === dayOfWeek) ?? null;
  const schedStart = sd ? toMin(sd.startTime) : 8 * 60;
  const schedEnd = sd ? toMin(sd.endTime) : 17 * 60;
  const brkStart = sd?.breakStart ? toMin(sd.breakStart) : null;
  const brkEnd = sd?.breakEnd ? toMin(sd.breakEnd) : null;
  const breakMin = brkStart !== null && brkEnd !== null ? Math.max(0, brkEnd - brkStart) : 60;
  const scheduledWorkMin = Math.max(1, schedEnd - schedStart - breakMin);
  const isVariable = payType === 'VARIABLE_PAY';
  const lateDeduct = isVariable
    ? parseFloat(((ts.lateMinutes / scheduledWorkMin) * dailyRate).toFixed(2))
    : 0;
  const undertimeDeduct = isVariable
    ? parseFloat(((ts.undertimeMinutes / scheduledWorkMin) * dailyRate).toFixed(2))
    : 0;
  return { lateDeduct, undertimeDeduct };
}

const SS_LABEL: Record<string, string> = {
  PRESENT: 'Present', ABSENT: 'Absent', INCOMPLETE: 'Half Day',
  PAID_LEAVE: 'Paid Leave', UNPAID_LEAVE: 'Unpaid Leave',
  DAY_OFF: 'Day Off', REGULAR_HOLIDAY: 'Regular Holiday', SPECIAL_HOLIDAY: 'Special Holiday',
};
const SS_COLOR: Record<string, string> = {
  PRESENT: 'text-emerald-600', ABSENT: 'text-red-500', INCOMPLETE: 'text-amber-500',
  PAID_LEAVE: 'text-blue-500', UNPAID_LEAVE: 'text-orange-500',
  DAY_OFF: 'text-muted-foreground', REGULAR_HOLIDAY: 'text-purple-600', SPECIAL_HOLIDAY: 'text-violet-500',
};
const DS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PAY_TYPE_LABEL: Record<string, string> = { FIXED_PAY: 'Fixed Pay', VARIABLE_PAY: 'Variable Pay' };
const RATE_TYPE_LABEL: Record<string, string> = { DAILY: 'Daily Rate', MONTHLY: 'Monthly Rate' };
const FREQ_LABEL: Record<string, string> = {
  ONCE_A_MONTH: 'Once a Month', TWICE_A_MONTH: 'Twice a Month', WEEKLY: 'Weekly',
};

function numInput(value: string, onChange: (v: string) => void, label: string) {
  return (
    <div>
      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
      />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────

export function PayslipEditor() {
  const { id: _periodId, payslipId } = useParams<{ id: string; payslipId: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acknowledging, setAcknowledging] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Editable deduction/earning fields
  const [basicPay, setBasicPay] = useState('0');
  const [holidayPay, setHolidayPay] = useState('0');
  const [overtimePay, setOvertimePay] = useState('0');
  const [paidLeavePay, setPaidLeavePay] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [sss, setSss] = useState('0');
  const [philhealth, setPhilhealth] = useState('0');
  const [pagibig, setPagibig] = useState('0');
  const [tax, setTax] = useState('0');
  const [lateUnder, setLateUnder] = useState('0');
  const [pagibigLoan, setPagibigLoan] = useState('0');
  const [sssLoan, setSssLoan] = useState('0');
  const [cashAdv, setCashAdv] = useState('0');

  const fetchPayslip = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslipId}`);
      const json: { data?: PayslipDetail; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        error('Failed to load', json.error ?? 'Could not load payslip');
        return;
      }
      const ps = json.data;
      setPayslip(ps);
      setBasicPay(ps.basicPay);
      setHolidayPay(ps.holidayPay);
      setOvertimePay(ps.overtimePay);
      setPaidLeavePay(ps.paidLeavePay);
      setAllowance(ps.allowance);
      setSss(ps.sssDeduction);
      setPhilhealth(ps.philhealthDeduction);
      setPagibig(ps.pagibigDeduction);
      setTax(ps.withholdingTax);
      setLateUnder(ps.lateUndertimeDeduction);
      setPagibigLoan(ps.pagibigLoan);
      setSssLoan(ps.sssLoan);
      setCashAdv(ps.cashAdvanceRepayment);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [payslipId, error]);

  useEffect(() => {
    void fetchPayslip();
  }, [fetchPayslip]);

  const fetchTimesheets = useCallback(async () => {
    setTimesheetsLoading(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslipId}/timesheet`);
      const json: { data?: TimesheetRecord[]; error?: string } = await res.json();
      if (res.ok && json.data) setTimesheets(json.data);
    } catch {
      // Non-critical; silently ignore
    } finally {
      setTimesheetsLoading(false);
    }
  }, [payslipId]);

  useEffect(() => {
    void fetchTimesheets();
  }, [fetchTimesheets]);

  // Live-computed display totals
  const liveGross =
    Number(basicPay) + Number(holidayPay) + Number(overtimePay) +
    Number(paidLeavePay) + Number(allowance);
  const liveDed =
    Number(sss) + Number(philhealth) + Number(pagibig) + Number(tax) +
    Number(lateUnder) + Number(pagibigLoan) + Number(sssLoan) + Number(cashAdv);
  const liveNet = Math.max(0, liveGross - liveDed);

  const canEdit =
    payslip !== null &&
    payslip.approvedAt === null &&
    (payslip.payrollPeriod.status === 'DRAFT' ||
      payslip.payrollPeriod.status === 'PROCESSING');

  const canPDF = payslip !== null;

  const handleSave = async () => {
    if (!payslip) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslip.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
    basicPay: Number(basicPay),
          holidayPay: Number(holidayPay),
          overtimePay: Number(overtimePay),
          paidLeavePay: Number(paidLeavePay),
          allowance: Number(allowance),
          sssDeduction: Number(sss),
          philhealthDeduction: Number(philhealth),
          pagibigDeduction: Number(pagibig),
          withholdingTax: Number(tax),
          lateUndertimeDeduction: Number(lateUnder),
          pagibigLoan: Number(pagibigLoan),
          sssLoan: Number(sssLoan),
          cashAdvanceRepayment: Number(cashAdv),
        }),
      });
      const json: { data?: PayslipDetail; error?: string } = await res.json();
      if (!res.ok) {
        error('Save failed', json.error ?? 'Could not save payslip changes');
        return;
      }
      success('Saved', 'Payslip has been updated successfully.');
      await fetchPayslip();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async () => {
    if (!payslip) return;
    setAcknowledging(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslip.id}/acknowledge`, {
        method: 'POST',
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed', json.error ?? 'Could not acknowledge payslip');
        return;
      }
      success('Acknowledged', 'Payslip has been acknowledged on behalf of the employee.');
      await fetchPayslip();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleRevert = async () => {
    if (!payslip) return;
    const res = await fetch(`/api/hr/payroll-periods/${payslip.payrollPeriod.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PROCESSING' }),
    });
    const json: { error?: string } = await res.json();
    if (!res.ok) {
      error('Failed', json.error ?? 'Could not revert period');
      return;
    }
    success('Reverted', 'Payroll period is now back in Processing.');
    await fetchPayslip();
  };

  const handleViewPDF = async () => {
    if (!payslip) return;
    setIsPrinting(true);
    try {
      const [{ pdf }, { PayslipPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/hr/PayslipPDF'),
      ]);
      const React = (await import('react')).default;
      const emp = payslip.employee.employments[0];
      const pdfPayslip = {
        id: payslip.id,
        employee: {
          firstName: payslip.employee.firstName,
          lastName: payslip.employee.lastName,
          employeeNo: payslip.employee.employeeNo,
          position: emp?.position?.title ? { title: emp.position.title } : null,
          department: emp?.department ?? null,
        },
        payrollPeriod: payslip.payrollPeriod,
        basicPay: payslip.basicPay,
        holidayPay: payslip.holidayPay,
        overtimePay: payslip.overtimePay,
        paidLeavePay: payslip.paidLeavePay,
        allowance: payslip.allowance,
        grossPay: payslip.grossPay,
        sssDeduction: payslip.sssDeduction,
        philhealthDeduction: payslip.philhealthDeduction,
        pagibigDeduction: payslip.pagibigDeduction,
        withholdingTax: payslip.withholdingTax,
        lateUndertimeDeduction: payslip.lateUndertimeDeduction,
        pagibigLoan: payslip.pagibigLoan,
        sssLoan: payslip.sssLoan,
        cashAdvanceRepayment: payslip.cashAdvanceRepayment,
        totalDeductions: payslip.totalDeductions,
        netPay: payslip.netPay,
        preparedAt: payslip.preparedAt,
        approvedAt: payslip.approvedAt,
        acknowledgedAt: payslip.acknowledgedAt,
        preparedBy: payslip.preparedBy,
        approvedBy: payslip.approvedBy,
        acknowledgedBy: payslip.acknowledgedBy,
      };
      const el = React.createElement(PayslipPDF, { payslip: pdfPayslip }) as Parameters<typeof pdf>[0];
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      error('PDF failed', 'Could not generate the payslip PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleApprove = async () => {
    if (!payslip) return;
    setApproving(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslip.id}/approve`, { method: 'POST' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to approve', json.error ?? 'Could not approve payslip');
        return;
      }
      success('Approved', 'Payslip approved — employee can now see and acknowledge it.');
      await fetchPayslip();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setApproving(false);
    }
  };

  const handleRefreshDeductions = async () => {
    setRefreshing(true);
    try {
      // Step 1: Run server-side recalculation (fixes timesheet rows, aggregates OT + leave)
      // Step 2: Re-fetch fresh payslip (for up-to-date employee/comp/audit data)
      const [recalcRes, psRes] = await Promise.all([
        fetch(`/api/hr/payslips/${payslipId}/recalculate`, { method: 'POST' }),
        fetch(`/api/hr/payslips/${payslipId}`),
      ]);

      interface RecalcResponse {
        data?: {
          timesheets: TimesheetRecord[];
          suggestions: {
            basicPay: number;
            allowance: number;
            overtimePay: number;
            paidLeavePay: number;
            sssDeduction: number;
            philhealthDeduction: number;
            pagibigDeduction: number;
          };
          meta: {
            recalcCount: number;
            recalcMessages: string[];
            otRequestCount: number;
            leaveRequestCount: number;
          };
        };
        error?: string;
      }

      const recalcJson: RecalcResponse = await recalcRes.json();
      const psJson: { data?: PayslipDetail; error?: string } = await psRes.json();

      if (!recalcRes.ok) {
        error('Recalculation failed', recalcJson.error ?? 'Server error during recalculation');
        return;
      }
      if (!psRes.ok || !psJson.data) {
        error('Failed to refresh', psJson.error ?? 'Could not load payslip');
        return;
      }

      const fresh = psJson.data;
      const { timesheets: freshTs, suggestions, meta } = recalcJson.data!;

      // Update UI state
      setPayslip(fresh);
      setTimesheets(freshTs);

      // Helper: if the DB-saved value is already non-zero, keep it;
      // otherwise fall back to the server's computed suggestion.
      // This preserves manually-entered or previously-refreshed values.
      const retainOrSuggest = (savedVal: string, suggestion: number): string =>
        Number(savedVal) > 0 ? savedVal : suggestion.toFixed(2);

      // ── Earnings ────────────────────────────────────────────────
      // basicPay is always recomputed (it directly tracks timesheet data)
      setBasicPay(suggestions.basicPay.toFixed(2));
      // allowance, overtimePay, paidLeavePay: keep saved value if already set
      setAllowance(retainOrSuggest(fresh.allowance, suggestions.allowance));
      setOvertimePay(retainOrSuggest(fresh.overtimePay, suggestions.overtimePay));
      setPaidLeavePay(retainOrSuggest(fresh.paidLeavePay, suggestions.paidLeavePay));
      // holidayPay is always purely manual — sync from saved DB value, never overwrite
      setHolidayPay(fresh.holidayPay);

      // ── Government contributions from server suggestions ───────
      // Always recompute these from current compensation config
      setSss(suggestions.sssDeduction.toFixed(2));
      setPhilhealth(suggestions.philhealthDeduction.toFixed(2));
      setPagibig(suggestions.pagibigDeduction.toFixed(2));

      // ── Other deductions — always sync from saved DB values ────
      setLateUnder(fresh.lateUndertimeDeduction);
      setPagibigLoan(fresh.pagibigLoan);
      setSssLoan(fresh.sssLoan);
      setCashAdv(fresh.cashAdvanceRepayment);
      setTax(fresh.withholdingTax);

      // Build summary message
      const parts: string[] = [];
      if (meta.recalcCount > 0)
        parts.push(`${meta.recalcCount} timesheet row${meta.recalcCount > 1 ? 's' : ''} recomputed`);
      if (meta.otRequestCount > 0)
        parts.push(`${meta.otRequestCount} approved OT request${meta.otRequestCount > 1 ? 's' : ''} applied`);
      if (meta.leaveRequestCount > 0)
        parts.push(`${meta.leaveRequestCount} paid leave request${meta.leaveRequestCount > 1 ? 's' : ''} applied`);
      if (parts.length === 0) parts.push('all values are up to date');

      success('Refreshed', parts.join(' · '));
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!payslip) return;
    setMarkingPaid(true);
    try {
      const res = await fetch(`/api/hr/payslips/${payslip.id}/paid`, { method: 'POST' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to mark paid', json.error ?? 'Could not mark payslip as paid');
        return;
      }
      success('Marked as Paid', 'Payslip disbursement recorded.');
      await fetchPayslip();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setMarkingPaid(false);
    }
  };

  const periodDays = useMemo(() => {
    if (!payslip) return [];
    const tsMap = new Map(timesheets.map((t) => [t.date.slice(0, 10), t]));
    const scheduleDays = payslip.employee.employments[0]?.contracts[0]?.schedule?.days ?? [];
    const workingDaySet = new Set(scheduleDays.filter((d) => d.isWorkingDay).map((d) => d.dayOfWeek));
    const days: { date: Date; ts: TimesheetRecord | null; derivedStatus: string }[] = [];
    const start = new Date(`${payslip.payrollPeriod.startDate.slice(0, 10)}T00:00:00`);
    const end = new Date(`${payslip.payrollPeriod.endDate.slice(0, 10)}T00:00:00`);
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = cursor.toISOString().slice(0, 10);
      const ts = tsMap.get(key) ?? null;
      const derivedStatus = ts ? ts.status : (workingDaySet.has(cursor.getDay()) ? 'ABSENT' : 'DAY_OFF');
      days.push({ date: new Date(cursor), ts, derivedStatus });
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }, [payslip, timesheets]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading payslip…</span>
      </div>
    );
  }

  if (!payslip) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Payslip not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const tableComp = payslip.employee.employments[0]?.contracts[0]?.compensations[0] ?? null;
  const tableSchedule = payslip.employee.employments[0]?.contracts[0]?.schedule ?? null;
  const tableDailyRate = Number(tableComp?.calculatedDailyRate ?? 0);
  const tablePayType = tableComp?.payType ?? 'FIXED_PAY';

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-0.5 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-foreground">
            {payslip.employee.firstName} {payslip.employee.lastName}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {payslip.payrollPeriod.payrollSchedule?.name ?? 'Payroll Period'}
            &nbsp;·&nbsp;
            {fmtDate(payslip.payrollPeriod.startDate)} – {fmtDate(payslip.payrollPeriod.endDate)}
            &nbsp;·&nbsp;Payout: {fmtDate(payslip.payrollPeriod.payoutDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 mt-1">
          <Button
            variant="outline"
            className="gap-1.5 text-xs h-8"
            disabled={refreshing || payslip.approvedAt !== null}
            onClick={() => { void handleRefreshDeductions(); }}
            title={payslip.approvedAt !== null ? 'Cannot refresh an approved payslip' : 'Refresh employee compensation & recompute government deductions'}
          >
            {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </Button>
          <Badge variant={STATUS_VARIANT[payslip.payrollPeriod.status]}>
            {STATUS_LABEL[payslip.payrollPeriod.status]}
          </Badge>
        </div>
      </div>

      {/* ── Employee Information ── */}
      {(() => {
        const activeEmp = payslip.employee.employments[0] ?? null;
        const activeCt = activeEmp?.contracts[0] ?? null;
        const hireDate = activeEmp?.hireDate ?? null;
        const activeSchedule = activeCt?.schedule ?? null;
        const activeComp = activeCt?.compensations[0] ?? null;
        return (
          <>
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
                <Briefcase size={15} className="text-muted-foreground" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Employee Information</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
                {/* Personal */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Personal</p>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Name</p>
                    <p className="font-semibold text-foreground">{payslip.employee.firstName} {payslip.employee.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Employee No.</p>
                    <p className="font-semibold text-foreground">{payslip.employee.employeeNo ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Hire Date</p>
                    <p className="font-semibold text-foreground">{hireDate ? fmtDate(hireDate) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Position</p>
                    <p className="font-semibold text-foreground">{activeEmp?.position?.title ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Department</p>
                    <p className="font-semibold text-foreground">{activeEmp?.department?.name ?? '—'}</p>
                  </div>
                </div>
                {/* Payroll */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Payroll</p>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Agreed Salary Rate</p>
                    <p className="font-semibold text-foreground">
                      {activeComp ? fmt(Number(activeComp.baseRate)) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Payslip Status</p>
                    <Badge variant={STATUS_VARIANT[payslip.payrollPeriod.status]} className="mt-0.5">
                      {STATUS_LABEL[payslip.payrollPeriod.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Pay Type</p>
                    <p className="font-semibold text-foreground">
                      {activeComp ? (PAY_TYPE_LABEL[activeComp.payType] ?? activeComp.payType) : '—'}
                    </p>
                  </div>
                </div>
                {/* Approval */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Approval</p>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Work Schedule</p>
                    <button
                      onClick={() => setShowScheduleModal(true)}
                      className="text-blue-600 underline text-sm font-semibold hover:text-blue-700"
                    >
                      {activeSchedule ? activeSchedule.name : 'View'}
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Compensation</p>
                    <button
                      onClick={() => setShowCompModal(true)}
                      className="text-blue-600 underline text-sm font-semibold hover:text-blue-700"
                    >
                      View
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Approved by</p>
                    <p className="font-semibold text-foreground">{payslip.approvedBy?.name ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Acknowledged by</p>
                    <p className="font-semibold text-foreground">{payslip.acknowledgedBy?.name ?? '—'}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Work Schedule Modal */}
            <Modal
              isOpen={showScheduleModal}
              onClose={() => setShowScheduleModal(false)}
              title="Work Schedule"
              size="lg"
            >
              {activeSchedule ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={14} className="text-muted-foreground" />
                    <p className="font-bold text-foreground">{activeSchedule.name}</p>
                    {activeSchedule.timezone && (
                      <span className="text-xs text-muted-foreground">({activeSchedule.timezone})</span>
                    )}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-b border-border">
                          {['Day', 'Start', 'End', 'Break Start', 'Break End', 'Working'].map((h) => (
                            <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {activeSchedule.days.map((day) => (
                          <tr key={day.dayOfWeek} className={day.isWorkingDay ? '' : 'opacity-50'}>
                            <td className="px-3 py-2 font-semibold text-foreground">{DOW[day.dayOfWeek] ?? day.dayOfWeek}</td>
                            <td className="px-3 py-2 text-muted-foreground">{day.isWorkingDay ? day.startTime : '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{day.isWorkingDay ? day.endTime : '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{day.breakStart ?? '—'}</td>
                            <td className="px-3 py-2 text-muted-foreground">{day.breakEnd ?? '—'}</td>
                            <td className="px-3 py-2">
                              <span className={day.isWorkingDay ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}>{
                                day.isWorkingDay ? 'Yes' : 'Rest'
                              }</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="p-5 text-sm text-muted-foreground">No work schedule assigned.</p>
              )}
            </Modal>

            {/* Compensation Modal */}
            <Modal
              isOpen={showCompModal}
              onClose={() => setShowCompModal(false)}
              title="Compensation Details"
              size="md"
            >
              {activeComp ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={14} className="text-muted-foreground" />
                    <p className="text-sm font-bold text-foreground">Active Compensation</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      ['Base Rate', fmt(Number(activeComp.baseRate))],
                      ['Allowance Rate', fmt(Number(activeComp.allowanceRate))],
                      ['Pay Type', PAY_TYPE_LABEL[activeComp.payType] ?? activeComp.payType],
                      ['Rate Type', RATE_TYPE_LABEL[activeComp.rateType] ?? activeComp.rateType],
                      ['Frequency', FREQ_LABEL[activeComp.frequency] ?? activeComp.frequency],
                      ['Daily Rate', fmt(Number(activeComp.calculatedDailyRate))],
                      ['Monthly Rate', fmt(Number(activeComp.calculatedMonthlyRate))],
                    ].map(([label, value]) => (
                      <div key={label} className="p-3 bg-muted/40 rounded-lg">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-semibold text-foreground mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="p-5 text-sm text-muted-foreground">No active compensation record found.</p>
              )}
            </Modal>
          </>
        );
      })()}

      {/* ── Daily Breakdown ── */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Calendar size={15} className="text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Daily Breakdown</h2>
          {timesheetsLoading && <Loader2 size={14} className="animate-spin text-muted-foreground ml-1" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                {['Date', 'Day', 'Time In', 'Lunch Start', 'Lunch End', 'Time Out', 'Status',
                  'Reg Pay', 'Reg OT', 'RD', 'RD OT', 'SH', 'SH OT', 'SH RD', 'SH RD OT',
                  'RH', 'RH OT', 'RH RD', 'RH RD OT', 'Late', 'Under', 'Gross'].map((h) => (
                  <th key={h} className="px-2 py-2 text-left font-bold text-muted-foreground uppercase tracking-wider text-[9px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {periodDays.map(({ date, ts, derivedStatus }) => {
                if (!ts) {
                  const noTsLabel = SS_LABEL[derivedStatus] ?? derivedStatus;
                  const noTsColor = SS_COLOR[derivedStatus] ?? 'text-muted-foreground';
                  return (
                    <tr key={date.toISOString()} className={`hover:bg-muted/30 ${derivedStatus === 'DAY_OFF' ? 'opacity-40' : 'opacity-60'}`}>
                      <td className="px-2 py-2 font-medium">{date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                      <td className="px-2 py-2 text-muted-foreground">{DS[date.getDay()]}</td>
                      <td className="px-2 py-2">—</td><td className="px-2 py-2">—</td>
                      <td className="px-2 py-2">—</td><td className="px-2 py-2">—</td>
                      <td className={`px-2 py-2 font-semibold ${noTsColor}`}>{noTsLabel}</td>
                      {Array.from({ length: 12 }, (_, i) => <td key={i} className="px-2 py-2 text-right">—</td>)}
                      <td className="px-2 py-2 text-right text-red-500">—</td>
                      <td className="px-2 py-2 text-right text-amber-500">—</td>
                      <td className="px-2 py-2 text-right font-bold text-emerald-600">—</td>
                    </tr>
                  );
                }
                const statusLabel = SS_LABEL[ts.status] ?? ts.status;
                const statusColor = SS_COLOR[ts.status] ?? 'text-muted-foreground';
                const { lateDeduct, undertimeDeduct } = computeRowPay(ts, tableDailyRate, tablePayType, tableSchedule?.days, date.getDay());
                return (
                  <tr key={ts.id} className="hover:bg-muted/30">
                    <td className="px-2 py-2 font-medium">{date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                    <td className="px-2 py-2 text-muted-foreground">{DS[date.getDay()]}</td>
                    <td className="px-2 py-2">{fmtTime(ts.timeIn)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.lunchStart)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.lunchEnd)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.timeOut)}</td>
                    <td className={`px-2 py-2 font-semibold ${statusColor}`}>{statusLabel}</td>
                    <td className="px-2 py-2 text-right">{Number(ts.dailyGrossPay) > 0 ? fmt(tableDailyRate) : '—'}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.regOtHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rdHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rdOtHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.shHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.shOtHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.shRdHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.shRdOtHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rhHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rhOtHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rhRdHours)}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.rhRdOtHours)}</td>
                    <td className="px-2 py-2 text-right text-red-500">
                      {lateDeduct > 0 ? `-${fmt(lateDeduct)}` : ts.lateMinutes > 0 ? `${ts.lateMinutes}m` : '—'}
                    </td>
                    <td className="px-2 py-2 text-right text-amber-500">
                      {undertimeDeduct > 0 ? `-${fmt(undertimeDeduct)}` : ts.undertimeMinutes > 0 ? `${ts.undertimeMinutes}m` : '—'}
                    </td>
                    <td className="px-2 py-2 text-right font-bold text-emerald-600">
                      {Number(ts.dailyGrossPay) > 0 ? `₱${Number(ts.dailyGrossPay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-muted/50 border-t-2 border-border font-bold">
                <td className="px-2 py-2 text-xs font-bold" colSpan={7}>TOTALS</td>
                <td className="px-2 py-2 text-right text-xs">
                  {(() => {
                    const total = periodDays.reduce((s, { ts: t }) => t && Number(t.dailyGrossPay) > 0 ? s + tableDailyRate : s, 0);
                    return total > 0 ? fmt(total) : '—';
                  })()}
                </td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.regOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rdHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rdOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.shHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.shOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.shRdHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.shRdOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rhHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rhOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rhRdHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.rhRdOtHours), 0)))}</td>
                <td className="px-2 py-2 text-right text-red-500">
                  {(() => {
                    if (tablePayType !== 'VARIABLE_PAY') {
                      const total = timesheets.reduce((s, t) => s + t.lateMinutes, 0);
                      return total > 0 ? `${total}m` : '—';
                    }
                    const total = periodDays.reduce((s, { ts: t, date: d }) => {
                      if (!t) return s;
                      const { lateDeduct: ld } = computeRowPay(t, tableDailyRate, tablePayType, tableSchedule?.days, d.getDay());
                      return s + ld;
                    }, 0);
                    return total > 0 ? `-${fmt(parseFloat(total.toFixed(2)))}` : '—';
                  })()}
                </td>
                <td className="px-2 py-2 text-right text-amber-500">
                  {(() => {
                    if (tablePayType !== 'VARIABLE_PAY') {
                      const total = timesheets.reduce((s, t) => s + t.undertimeMinutes, 0);
                      return total > 0 ? `${total}m` : '—';
                    }
                    const total = periodDays.reduce((s, { ts: t, date: d }) => {
                      if (!t) return s;
                      const { undertimeDeduct: ud } = computeRowPay(t, tableDailyRate, tablePayType, tableSchedule?.days, d.getDay());
                      return s + ud;
                    }, 0);
                    return total > 0 ? `-${fmt(parseFloat(total.toFixed(2)))}` : '—';
                  })()}
                </td>
                <td className="px-2 py-2 text-right text-emerald-600">
                  {(() => {
                    const total = timesheets.reduce((s, t) => s + Number(t.dailyGrossPay), 0);
                    return total > 0 ? `₱${total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—';
                  })()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Audit Trail ── */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-2">
            <User size={14} className="mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Prepared By</p>
              <p className="font-semibold text-foreground">{payslip.preparedBy?.name ?? '—'}</p>
              {payslip.preparedAt && (
                <p className="text-[11px] text-muted-foreground">{fmtDateTime(payslip.preparedAt)}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle size={14} className="mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Approved By</p>
              <p className="font-semibold text-foreground">{payslip.approvedBy?.name ?? '—'}</p>
              {payslip.approvedAt && (
                <p className="text-[11px] text-muted-foreground">{fmtDateTime(payslip.approvedAt)}</p>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar size={14} className="mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Acknowledged By</p>
              <p className="font-semibold text-foreground">{payslip.acknowledgedBy?.name ?? '—'}</p>
              {payslip.acknowledgedAt ? (
                <p className="text-[11px] text-muted-foreground">{fmtDateTime(payslip.acknowledgedAt)}</p>
              ) : (
                <p className="text-[11px] text-amber-500">Pending acknowledgment</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {!canEdit && payslip.payrollPeriod.status === 'APPROVED' && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 dark:border-amber-700 text-sm text-amber-800 dark:text-amber-200">
          <RotateCcw size={14} />
          <span>This payroll is <strong>Approved</strong>. To edit deductions, revert to Processing first.</span>
          <Button
            variant="outline"
            className="ml-auto gap-1.5 text-xs h-7"
            onClick={() => { void handleRevert(); }}
          >
            <RotateCcw size={12} /> Revert to Processing
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Earnings ── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Earnings</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {canEdit ? (
              <>
                {numInput(basicPay, setBasicPay, 'Basic Pay')}
                {numInput(holidayPay, setHolidayPay, 'Holiday Pay')}
                {numInput(overtimePay, setOvertimePay, 'Overtime Pay')}
                {numInput(paidLeavePay, setPaidLeavePay, 'Paid Leave Pay')}
                {numInput(allowance, setAllowance, 'Allowance')}
              </>
            ) : (
              <>
                {[
                  ['Basic Pay', basicPay],
                  ['Holiday Pay', holidayPay],
                  ['Overtime Pay', overtimePay],
                  ['Paid Leave Pay', paidLeavePay],
                  ['Allowance', allowance],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(Number(val))}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Gross Pay</span>
            <span className="text-base font-black text-emerald-600">{fmt(liveGross)}</span>
          </div>
        </Card>

        {/* ── Deductions ── */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <CreditCard size={15} className="text-red-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Deductions</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {canEdit ? (
              <>
                {numInput(sss, setSss, 'SSS')}
                {numInput(philhealth, setPhilhealth, 'PhilHealth')}
                {numInput(pagibig, setPagibig, 'Pag-IBIG')}
                {numInput(tax, setTax, 'Withholding Tax')}
                {numInput(lateUnder, setLateUnder, 'Late / Undertime')}
                {numInput(sssLoan, setSssLoan, 'SSS Loan')}
                {numInput(pagibigLoan, setPagibigLoan, 'Pag-IBIG Loan')}
                {numInput(cashAdv, setCashAdv, 'Cash Advance')}
              </>
            ) : (
              <>
                {[
                  ['SSS', sss],
                  ['PhilHealth', philhealth],
                  ['Pag-IBIG', pagibig],
                  ['Withholding Tax', tax],
                  ['Late / Undertime', lateUnder],
                  ['SSS Loan', sssLoan],
                  ['Pag-IBIG Loan', pagibigLoan],
                  ['Cash Advance', cashAdv],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                    <p className="text-sm font-semibold text-foreground">{fmt(Number(val))}</p>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="pt-3 border-t border-border flex justify-between items-center">
            <span className="text-xs font-bold text-muted-foreground uppercase">Total Deductions</span>
            <span className="text-base font-black text-red-500">{fmt(liveDed)}</span>
          </div>
        </Card>
      </div>

      {/* ── Net Pay ── */}
      <Card className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Net Pay</p>
          <p className="text-3xl font-black text-blue-600">{fmt(liveNet)}</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>Gross: {fmt(liveGross)}</p>
          <p>Deductions: {fmt(liveDed)}</p>
        </div>
      </Card>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3">
        {canEdit && (
          <Button
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={saving}
            onClick={() => { void handleSave(); }}
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            Save Changes
          </Button>
        )}

        {/* Approve individual payslip */}
        {!payslip.approvedAt && ['DRAFT', 'PROCESSING'].includes(payslip.payrollPeriod.status) && (
          <Button
            className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            disabled={approving}
            onClick={() => { void handleApprove(); }}
          >
            {approving ? <Loader2 size={15} className="animate-spin" /> : <ThumbsUp size={15} />}
            Approve Payslip
          </Button>
        )}
        {payslip.approvedAt && (
          <div className="flex items-center gap-1.5 text-sm text-blue-600 font-semibold">
            <ThumbsUp size={14} /> Approved {fmtDateTime(payslip.approvedAt)}
          </div>
        )}

        {/* Mark paid */}
        {payslip.approvedAt && payslip.acknowledgedAt && payslip.disbursedStatus !== 'COMPLETED' && (
          <Button
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
            disabled={markingPaid}
            onClick={() => { void handleMarkPaid(); }}
          >
            {markingPaid ? <Loader2 size={15} className="animate-spin" /> : <Banknote size={15} />}
            Mark as Paid
          </Button>
        )}
        {payslip.disbursedStatus === 'COMPLETED' && (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
            <Banknote size={14} /> Paid
          </div>
        )}

        {payslip.approvedAt !== null &&
          payslip.acknowledgedAt === null && (
            <Button
              variant="outline"
              className="gap-2"
              disabled={acknowledging}
              onClick={() => { void handleAcknowledge(); }}
              title="Manually acknowledge on behalf of the employee"
            >
              {acknowledging ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} className="text-emerald-500" />}
              Mark Acknowledged
            </Button>
          )}

        <Button
          variant="outline"
          className="gap-2 disabled:opacity-50"
          disabled={!canPDF || isPrinting}
          onClick={() => { void handleViewPDF(); }}
          title="View payslip PDF"
        >
          {isPrinting ? <Loader2 size={15} className="animate-spin" /> : <FileText size={15} />}
          View PDF
        </Button>
      </div>
    </div>
  );
}
