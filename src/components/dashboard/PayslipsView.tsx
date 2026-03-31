'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  Eye, Search, FileText, Loader2, CheckCircle,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// ─── Types ────────────────────────────────────────────────────────

interface PayslipListItem {
  id: string;
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
  preparedBy: { name: string } | null;
  approvedBy: { name: string } | null;
  acknowledgedBy: { name: string } | null;
  employee: {
    firstName: string;
    lastName: string;
    employeeNo: string | null;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

const fmt = (v: string | number | null | undefined) =>
  `₱${(Number(v) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

// ─── Main Component ───────────────────────────────────────────────

export function PayslipsView() {
  const { error } = useToast();
  const router = useRouter();
  const [payslips, setPayslips] = useState<PayslipListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/employee/payslips');
      const json: { data?: PayslipListItem[]; error?: string } = await res.json();
      if (!res.ok || !json.data) {
        error('Failed to load', json.error ?? 'Could not load payslips');
        return;
      }
      setPayslips(json.data);
    } catch {
      error('Network error', 'Could not reach the server');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchPayslips();
  }, [fetchPayslips]);

  const filtered = payslips.filter((ps) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (ps.payrollPeriod.payrollSchedule?.name ?? '').toLowerCase().includes(q) ||
      fmtDate(ps.payrollPeriod.startDate).toLowerCase().includes(q) ||
      fmtDate(ps.payrollPeriod.payoutDate).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">My Payslips</h1>
          <p className="text-sm text-muted-foreground mt-1">View and download your salary statements</p>
        </div>
        <Badge variant="info" className="bg-amber-50 text-amber-700 font-black px-4 py-2">
          <FileText size={14} className="mr-2" />
          {payslips.length} Records
        </Badge>
      </div>

      {/* Payslips Table */}
      <Card className="p-4 sm:p-8 border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="font-black text-foreground uppercase tracking-tight">Earnings History</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Filter by schedule or date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 h-10 bg-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading payslips…</span>
          </div>
        ) : (
          <div className="overflow-x-auto sm:-mx-8">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-y border-border">
                  <th className="p-6">Schedule / Period</th>
                  <th className="p-6">Payout Date</th>
                  <th className="p-6">Net Pay</th>
                  <th className="p-6 text-center">Acknowledged</th>
                  <th className="p-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((slip) => (
                  <tr key={slip.id} className="hover:bg-muted/50 transition-colors group">
                    <td className="p-6">
                      <p className="font-black text-foreground text-sm">
                        {slip.payrollPeriod.payrollSchedule?.name ?? '—'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDate(slip.payrollPeriod.startDate)} – {fmtDate(slip.payrollPeriod.endDate)}
                      </p>
                    </td>
                    <td className="p-6 text-muted-foreground text-sm">
                      {fmtDate(slip.payrollPeriod.payoutDate)}
                    </td>
                    <td className="p-6 font-black text-amber-600 text-base">
                      {fmt(slip.netPay)}
                    </td>
                    <td className="p-6 text-center">
                      {slip.acknowledgedAt ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle size={12} /> Acknowledged
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500 font-medium">Pending</span>
                      )}
                    </td>
                    <td className="p-6">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          className="rounded-xl group-hover:border-amber-300 group-hover:bg-amber-50 transition-all"
                          onClick={() => router.push(`/dashboard/payslips/${slip.id}`)}
                        >
                          <Eye size={14} className="mr-2" /> View
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground">
                      {payslips.length === 0
                        ? 'No payslips available yet.'
                        : 'No payslips match your filter.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

