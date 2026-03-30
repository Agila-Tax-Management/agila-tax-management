// src/app/(dashboard)/dashboard/payslips/[id]/components/PayslipDetailPage.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, CheckCircle, FileText,
  User, Calendar, CreditCard, Briefcase, Building2, DollarSign,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

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
    status: string;
    payrollSchedule: { name: string; frequency: string } | null;
  };
  basicPay: string;
  holidayPay: string;
  overtimePay: string;
  paidLeavePay: string;
  allowance: string;
  grossPay: string;
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
  acknowledgedAt: string | null;
  preparedBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  acknowledgedBy: { id: string; name: string } | null;
}

// ─── Helpers ──────────────────────────────────────────────────────

const fmt = (v: string | number | null | undefined) =>
  `₱${(Number(v) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const fmtHours = (h: string | number): string => {
  const n = Number(h);
  return n === 0 ? '—' : n.toFixed(2);
};

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

// ─── Component ────────────────────────────────────────────────────

export function PayslipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [payslip, setPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [acknowledging, setAcknowledging] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showCompModal, setShowCompModal] = useState(false);
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [timesheetsLoading, setTimesheetsLoading] = useState(false);

  const fetchPayslip = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/payslips/${id}`);
      const json: { data?: PayslipDetail; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        error('Failed to load', json.error ?? 'Could not load payslip');
        return;
      }
      setPayslip(json.data);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    void fetchPayslip();
  }, [fetchPayslip]);

  const fetchTimesheets = useCallback(async () => {
    setTimesheetsLoading(true);
    try {
      const res = await fetch(`/api/employee/payslips/${id}/timesheet`);
      const json: { data?: TimesheetRecord[]; error?: string } = await res.json();
      if (res.ok && json.data) setTimesheets(json.data);
    } catch {
      // Non-critical; silently ignore
    } finally {
      setTimesheetsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchTimesheets();
  }, [fetchTimesheets]);

  const handleAcknowledge = async () => {
    if (!payslip) return;
    setAcknowledging(true);
    try {
      const res = await fetch(`/api/employee/payslips/${payslip.id}/acknowledge`, {
        method: 'POST',
      });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed', json.error ?? 'Could not acknowledge payslip');
        return;
      }
      success('Acknowledged', 'You have acknowledged your payslip.');
      setPayslip((prev) => prev ? { ...prev, acknowledgedAt: new Date().toISOString() } : prev);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setAcknowledging(false);
    }
  };

  const handleViewPDF = async () => {
    if (!payslip) return;
    setIsPrinting(true);
    try {
      const [{ pdf }, { PayslipPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/hr/PayslipPDF'),
      ]);
      const ReactModule = await import('react');
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
        acknowledgedAt: payslip.acknowledgedAt,
        preparedBy: payslip.preparedBy,
        approvedBy: payslip.approvedBy,
        acknowledgedBy: payslip.acknowledgedBy,
      };
      const el = ReactModule.default.createElement(PayslipPDF, { payslip: pdfPayslip }) as Parameters<typeof pdf>[0];
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      error('PDF failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setIsPrinting(false);
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
        <p className="text-sm">Payslip not found or not yet released.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const activeEmp = payslip.employee.employments[0] ?? null;
  const activeCt = activeEmp?.contracts[0] ?? null;
  const hireDate = activeEmp?.hireDate ?? null;
  const activeSchedule = activeCt?.schedule ?? null;
  const activeComp = activeCt?.compensations[0] ?? null;
  const canDownload = true;

  const earningsRows = [
    { label: 'Basic Pay', value: payslip.basicPay },
    { label: 'Holiday Pay', value: payslip.holidayPay },
    { label: 'Overtime Pay', value: payslip.overtimePay },
    { label: 'Paid Leave Pay', value: payslip.paidLeavePay },
    { label: 'Allowance', value: payslip.allowance },
  ].filter((r) => (Number(r.value) || 0) !== 0);

  const deductionRows = [
    { label: 'SSS', value: payslip.sssDeduction },
    { label: 'PhilHealth', value: payslip.philhealthDeduction },
    { label: 'Pag-IBIG', value: payslip.pagibigDeduction },
    { label: 'Withholding Tax', value: payslip.withholdingTax },
    { label: 'Late / Undertime', value: payslip.lateUndertimeDeduction },
    { label: 'SSS Loan', value: payslip.sssLoan },
    { label: 'Pag-IBIG Loan', value: payslip.pagibigLoan },
    { label: 'Cash Advance', value: payslip.cashAdvanceRepayment },
  ].filter((r) => (Number(r.value) || 0) !== 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-0.5 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-foreground">Payslip Details</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {payslip.payrollPeriod.payrollSchedule?.name ?? 'Payroll Period'}
            &nbsp;·&nbsp;
            {fmtDate(payslip.payrollPeriod.startDate)} – {fmtDate(payslip.payrollPeriod.endDate)}
            &nbsp;·&nbsp;Payout: {fmtDate(payslip.payrollPeriod.payoutDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {payslip.acknowledgedAt === null ? (
            <Button
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={acknowledging}
              onClick={() => { void handleAcknowledge(); }}
            >
              {acknowledging ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Acknowledge
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold">
              <CheckCircle size={14} />
              Acknowledged
            </div>
          )}
          <Button
            variant="outline"
            className="gap-2 disabled:opacity-50"
            disabled={!canDownload || isPrinting}
            title="View payslip PDF"
            onClick={() => { void handleViewPDF(); }}
          >
            {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            View PDF
          </Button>
        </div>
      </div>

      {/* ── Employee Information ── */}
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
                {activeComp ? fmt(activeComp.baseRate) : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Payslip Status</p>
              <Badge variant="success" className="mt-0.5">{payslip.payrollPeriod.status}</Badge>
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
                View
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
      <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} title="Work Schedule" size="lg">
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
                        <span className={day.isWorkingDay ? 'text-emerald-600 font-semibold' : 'text-muted-foreground'}>
                          {day.isWorkingDay ? 'Yes' : 'Rest'}
                        </span>
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
      <Modal isOpen={showCompModal} onClose={() => setShowCompModal(false)} title="Compensation Details" size="md">
        {activeComp ? (
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign size={14} className="text-muted-foreground" />
              <p className="text-sm font-bold text-foreground">Active Compensation</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Base Rate', fmt(activeComp.baseRate)],
                ['Allowance Rate', fmt(activeComp.allowanceRate)],
                ['Pay Type', PAY_TYPE_LABEL[activeComp.payType] ?? activeComp.payType],
                ['Rate Type', RATE_TYPE_LABEL[activeComp.rateType] ?? activeComp.rateType],
                ['Frequency', FREQ_LABEL[activeComp.frequency] ?? activeComp.frequency],
                ['Daily Rate', fmt(activeComp.calculatedDailyRate)],
                ['Monthly Rate', fmt(activeComp.calculatedMonthlyRate)],
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
                return (
                  <tr key={ts.id} className="hover:bg-muted/30">
                    <td className="px-2 py-2 font-medium">{date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}</td>
                    <td className="px-2 py-2 text-muted-foreground">{DS[date.getDay()]}</td>
                    <td className="px-2 py-2">{fmtTime(ts.timeIn)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.lunchStart)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.lunchEnd)}</td>
                    <td className="px-2 py-2">{fmtTime(ts.timeOut)}</td>
                    <td className={`px-2 py-2 font-semibold ${statusColor}`}>{statusLabel}</td>
                    <td className="px-2 py-2 text-right">{fmtHours(ts.regularHours)}</td>
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
                    <td className="px-2 py-2 text-right text-red-500">{ts.lateMinutes > 0 ? ts.lateMinutes : '—'}</td>
                    <td className="px-2 py-2 text-right text-amber-500">{ts.undertimeMinutes > 0 ? ts.undertimeMinutes : '—'}</td>
                    <td className="px-2 py-2 text-right font-bold text-emerald-600">
                      {Number(ts.dailyGrossPay) > 0 ? `₱${Number(ts.dailyGrossPay).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-muted/50 border-t-2 border-border font-bold">
                <td className="px-2 py-2 text-xs font-bold" colSpan={7}>TOTALS</td>
                <td className="px-2 py-2 text-right text-xs">{fmtHours(String(timesheets.reduce((s, t) => s + Number(t.regularHours), 0)))}</td>
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
                <td className="px-2 py-2 text-right text-red-500">{timesheets.reduce((s, t) => s + t.lateMinutes, 0) || '—'}</td>
                <td className="px-2 py-2 text-right text-amber-500">{timesheets.reduce((s, t) => s + t.undertimeMinutes, 0) || '—'}</td>
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
          {[
            { icon: User, label: 'Prepared By', name: payslip.preparedBy?.name },
            { icon: CheckCircle, label: 'Approved By', name: payslip.approvedBy?.name },
            { icon: Calendar, label: 'Acknowledged By', name: payslip.acknowledgedBy?.name,
              sub: payslip.acknowledgedAt ? fmtDateTime(payslip.acknowledgedAt) : undefined,
              pending: payslip.acknowledgedAt === null },
          ].map(({ icon: Icon, label, name, sub, pending }) => (
            <div key={label} className="flex items-start gap-2">
              <Icon size={14} className="mt-0.5 text-muted-foreground flex-shrink-0" />
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="font-semibold text-foreground">{name ?? '—'}</p>
                {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
                {pending && <p className="text-[11px] text-amber-500">Pending acknowledgment</p>}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Earnings + Deductions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Earnings</h2>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {earningsRows.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No earnings recorded.</p>
            ) : (
              earningsRows.map((r) => (
                <div key={r.label} className="flex justify-between px-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className="text-xs font-semibold text-foreground">{fmt(r.value)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30">
              <span className="text-xs font-bold text-emerald-700">Gross Pay</span>
              <span className="text-xs font-black text-emerald-700">{fmt(payslip.grossPay)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard size={15} className="text-red-400" />
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Deductions</h2>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            {deductionRows.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">No deductions recorded.</p>
            ) : (
              deductionRows.map((r) => (
                <div key={r.label} className="flex justify-between px-3 py-2 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{r.label}</span>
                  <span className="text-xs font-semibold text-foreground">{fmt(r.value)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between px-3 py-2 bg-red-50 dark:bg-red-950/30">
              <span className="text-xs font-bold text-red-700">Total Deductions</span>
              <span className="text-xs font-black text-red-700">{fmt(payslip.totalDeductions)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Net Pay ── */}
      <div className="flex items-center justify-between p-5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700">
        <span className="text-sm font-bold text-blue-800 dark:text-blue-200 uppercase tracking-wide">Net Pay</span>
        <span className="text-3xl font-black text-blue-700 dark:text-blue-300">{fmt(payslip.netPay)}</span>
      </div>
    </div>
  );
}
