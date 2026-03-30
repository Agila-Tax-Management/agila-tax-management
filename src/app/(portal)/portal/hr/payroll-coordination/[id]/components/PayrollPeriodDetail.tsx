// src/app/(portal)/portal/hr/payroll-coordination/[id]/components/PayrollPeriodDetail.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Play, CheckCircle, PauseCircle, RotateCcw,
  Loader2, Users, CheckCheck, Edit, ChevronRight, Banknote, ThumbsUp,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

type PeriodStatus = 'DRAFT' | 'PROCESSING' | 'APPROVED' | 'PAID' | 'CLOSED';

interface PayslipRow {
  id: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
  };
  basicPay: string;
  allowance: string;
  grossPay: string;
  totalDeductions: string;
  netPay: string;
  approvedAt: string | null;
  approvedBy: { id: string; name: string } | null;
  acknowledgedAt: string | null;
  acknowledgedBy: { id: string; name: string } | null;
  disbursedStatus: string;
  preparedBy: { id: string; name: string } | null;
}

interface PeriodDetail {
  id: number;
  startDate: string;
  endDate: string;
  payoutDate: string;
  status: PeriodStatus;
  payrollSchedule: { id: string; name: string; frequency: string } | null;
  payslips: PayslipRow[];
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

// ─── Component ────────────────────────────────────────────────────

export function PayrollPeriodDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error } = useToast();

  const [period, setPeriod] = useState<PeriodDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [approvingPayslip, setApprovingPayslip] = useState<string | null>(null);
  const [payingPayslip, setPayingPayslip] = useState<string | null>(null);

  const fetchPeriod = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hr/payroll-periods/${id}`);
      const json: { data?: PeriodDetail; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        error('Failed to load', json.error ?? 'Could not load period details');
        return;
      }
      setPeriod(json.data);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [id, error]);

  useEffect(() => {
    void fetchPeriod();
  }, [fetchPeriod]);

  const updateStatus = async (newStatus: PeriodStatus) => {
    if (!period) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/hr/payroll-periods/${period.id}`, {
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
      await fetchPeriod();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const approvePayslip = async (payslipId: string) => {
    setApprovingPayslip(payslipId);
    try {
      const res = await fetch(`/api/hr/payslips/${payslipId}/approve`, { method: 'POST' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to approve', json.error ?? 'Could not approve payslip');
        return;
      }
      success('Approved', 'Payslip approved — employee can now see and acknowledge it.');
      await fetchPeriod();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setApprovingPayslip(null);
    }
  };

  const markPayslipPaid = async (payslipId: string) => {
    setPayingPayslip(payslipId);
    try {
      const res = await fetch(`/api/hr/payslips/${payslipId}/paid`, { method: 'POST' });
      const json: { error?: string } = await res.json();
      if (!res.ok) {
        error('Failed to mark paid', json.error ?? 'Could not mark payslip as paid');
        return;
      }
      success('Marked as Paid', 'Payslip disbursement recorded.');
      await fetchPeriod();
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setPayingPayslip(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading payroll period…</span>
      </div>
    );
  }

  if (!period) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-sm">Payroll period not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  const acknowledged = period.payslips.filter((ps) => ps.acknowledgedAt !== null).length;
  const approved = period.payslips.filter((ps) => ps.approvedAt !== null).length;
  const total = period.payslips.length;
  const allAcknowledged = total > 0 && acknowledged === total;
  const ackPercent = total > 0 ? Math.round((acknowledged / total) * 100) : 0;
  const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;

  const grossTotal = period.payslips.reduce((s, ps) => s + Number(ps.grossPay), 0);
  const netTotal = period.payslips.reduce((s, ps) => s + Number(ps.netPay), 0);
  const dedTotal = period.payslips.reduce((s, ps) => s + Number(ps.totalDeductions), 0);

  // Determine "Prepared by" from any payslip (they all share the same preparer)
  const preparedBy = period.payslips[0]?.preparedBy ?? null;

  return (
    <div className="space-y-6">
      {/* ── Back + Title ── */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="mt-0.5 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-foreground">
            {period.payrollSchedule?.name ?? 'Payroll Period'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {fmtDate(period.startDate)} – {fmtDate(period.endDate)}
            &nbsp;·&nbsp;Payout: {fmtDate(period.payoutDate)}
            {preparedBy && <>&nbsp;·&nbsp;Prepared by: <span className="font-medium text-foreground">{preparedBy.name}</span></>}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[period.status]} className="flex-shrink-0 mt-1">
          {STATUS_LABEL[period.status]}
        </Badge>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Gross Pay', value: fmt(grossTotal), color: 'text-emerald-600' },
          { label: 'Net Pay', value: fmt(netTotal), color: 'text-blue-600' },
          { label: 'Deductions', value: fmt(dedTotal), color: 'text-red-500' },
          { label: 'Employees', value: String(total), color: 'text-foreground' },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ── Acknowledgment Progress ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ThumbsUp size={15} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Approval Progress</span>
            </div>
            <span className="text-sm font-bold text-foreground">{approved}/{total}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-blue-500" style={{ width: `${approvedPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {approved === total && total > 0 ? 'All payslips approved.' : `${total - approved} payslip${total - approved !== 1 ? 's' : ''} pending approval.`}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CheckCheck size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold text-foreground">Employee Acknowledgment</span>
            </div>
            <span className="text-sm font-bold text-foreground">{acknowledged}/{total}</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500 bg-emerald-500" style={{ width: `${ackPercent}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {allAcknowledged ? 'All employees have acknowledged their payslips.' : `${total - acknowledged} employee${total - acknowledged !== 1 ? 's have' : ' has'} not yet acknowledged.`}
          </p>
        </Card>
      </div>

      {/* ── Status Actions ── */}
      {period.status !== 'CLOSED' && (
        <div className="flex flex-wrap gap-2">
          {period.status === 'DRAFT' && (
            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={updatingStatus}
              onClick={() => { void updateStatus('PROCESSING'); }}
            >
              {updatingStatus ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              Start Processing
            </Button>
          )}
          {period.status === 'PROCESSING' && (
            <>
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={updatingStatus}
                onClick={() => { void updateStatus('APPROVED'); }}
              >
                {updatingStatus ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Approve All
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={updatingStatus}
                onClick={() => { void updateStatus('DRAFT'); }}
              >
                <PauseCircle size={15} /> Back to Draft
              </Button>
            </>
          )}
          {period.status === 'APPROVED' && (
            <>
              <Button
                className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-50"
                disabled={updatingStatus || !allAcknowledged}
                onClick={() => { void updateStatus('PAID'); }}
                title={allAcknowledged ? 'Mark as Paid' : 'All employees must acknowledge first'}
              >
                {updatingStatus ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />}
                Mark as Paid
                {!allAcknowledged && (
                  <span className="text-xs opacity-80 ml-1">({acknowledged}/{total} acked)</span>
                )}
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                disabled={updatingStatus}
                onClick={() => { void updateStatus('PROCESSING'); }}
              >
                <RotateCcw size={15} /> Revert to Processing
              </Button>
            </>
          )}
          {period.status === 'PAID' && (
            <Button
              variant="outline"
              className="gap-2"
              disabled={updatingStatus}
              onClick={() => { void updateStatus('CLOSED'); }}
            >
              <RotateCcw size={15} /> Close Period
            </Button>
          )}
        </div>
      )}

      {/* ── Payslips Table ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <Users size={16} className="text-muted-foreground" />
          <span className="text-sm font-bold text-foreground">Employee Payslips</span>
        </div>
        {period.payslips.length === 0 ? (
          <div className="py-14 text-center text-sm text-muted-foreground">
            No payslips in this period.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                    Gross Pay
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">
                    Deductions
                  </th>
                  <th className="text-right px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Approved
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Acknowledged
                  </th>
                  <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {period.payslips.map((ps) => (
                  <tr key={ps.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-foreground">
                        {ps.employee.firstName} {ps.employee.lastName}
                      </p>
                      {ps.employee.employeeNo && (
                        <p className="text-[11px] text-muted-foreground">{ps.employee.employeeNo}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden md:table-cell">
                      {fmt(Number(ps.grossPay))}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 hidden md:table-cell">
                      {fmt(Number(ps.totalDeductions))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-foreground">
                      {fmt(Number(ps.netPay))}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ps.approvedAt ? (
                        <span className="inline-flex items-center gap-1 text-blue-600 font-semibold text-xs">
                          <ThumbsUp size={12} /> Approved
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ps.acknowledgedAt ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-xs">
                            <CheckCircle size={13} />
                            Acknowledged
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {fmtDateTime(ps.acknowledgedAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {/* Approve individual payslip */}
                        {!ps.approvedAt && ['DRAFT', 'PROCESSING'].includes(period.status) && (
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1 text-blue-600"
                            disabled={approvingPayslip === ps.id}
                            onClick={() => { void approvePayslip(ps.id); }}
                          >
                            {approvingPayslip === ps.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <ThumbsUp size={11} />}
                            Approve
                          </Button>
                        )}
                        {/* Mark individual payslip paid */}
                        {ps.approvedAt && ps.acknowledgedAt && ps.disbursedStatus !== 'COMPLETED' && (
                          <Button
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1 text-emerald-700"
                            disabled={payingPayslip === ps.id}
                            onClick={() => { void markPayslipPaid(ps.id); }}
                          >
                            {payingPayslip === ps.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <Banknote size={11} />}
                            Mark Paid
                          </Button>
                        )}
                        {ps.disbursedStatus === 'COMPLETED' && (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <Banknote size={11} /> Paid
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          className="h-7 px-2 text-xs gap-1"
                          onClick={() =>
                            router.push(
                              `/portal/hr/payroll-coordination/${period.id}/payslips/${ps.id}`,
                            )
                          }
                        >
                          <Edit size={12} />
                          View
                          <ChevronRight size={12} className="text-muted-foreground" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-muted/30">
                  <td className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase">
                    {total} employees
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-muted-foreground hidden md:table-cell">
                    {fmt(grossTotal)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-bold text-red-500 hidden md:table-cell">
                    {fmt(dedTotal)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-black text-foreground">
                    {fmt(netTotal)}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {approved}/{total} approved
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                    {acknowledged}/{total} acked
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
