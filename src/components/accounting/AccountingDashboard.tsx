'use client';

import React, { useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useRouter } from 'next/navigation';
import {
  DollarSign, CreditCard, FileText, Receipt,
  TrendingUp, ArrowUpRight, ArrowRight,
  AlertTriangle, Clock, CheckCircle2, Users,
  BarChart3, CircleDot,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_BILLING,
  type PaymentStatus,
} from '@/lib/mock-accounting-data';

const STATUS_BADGE: Record<PaymentStatus, 'info' | 'success' | 'danger' | 'warning' | 'neutral'> = {
  Pending: 'warning',
  Confirmed: 'success',
  Overdue: 'danger',
  'Partially Paid': 'info',
  Refunded: 'neutral',
};

export function AccountingDashboard() {
  const router = useRouter();

  const stats = useMemo(() => {
    const confirmed = INITIAL_PAYMENTS.filter(p => p.status === 'Confirmed');
    const totalCollected = confirmed.reduce((s, p) => s + p.amountPaid, 0);
    const totalOutstanding = INITIAL_PAYMENTS
      .filter(p => p.status !== 'Confirmed' && p.status !== 'Refunded')
      .reduce((s, p) => s + (p.amount - p.amountPaid), 0);
    const pendingCount = INITIAL_PAYMENTS.filter(p => p.status === 'Pending').length;
    const overdueCount = INITIAL_PAYMENTS.filter(p => p.status === 'Overdue').length;
    const activeClients = INITIAL_BILLING.filter(b => b.status === 'Active').length;
    const mrr = INITIAL_BILLING.filter(b => b.status === 'Active').reduce((s, b) => s + b.amount, 0);
    const totalInvoiced = INITIAL_INVOICES.reduce((s, i) => s + i.total, 0);
    const paidInvoices = INITIAL_INVOICES.filter(i => i.status === 'Paid').length;
    const collectionRate = INITIAL_BILLING.length > 0
      ? Math.round((INITIAL_BILLING.reduce((s, b) => s + b.totalPaid, 0) / Math.max(1, INITIAL_BILLING.reduce((s, b) => s + b.totalBilled, 0))) * 100)
      : 0;

    return { totalCollected, totalOutstanding, pendingCount, overdueCount, activeClients, mrr, totalInvoiced, paidInvoices, collectionRate };
  }, []);

  // Urgent: pending + overdue payments
  const urgentPayments = useMemo(() =>
    INITIAL_PAYMENTS.filter(p => p.status === 'Pending' || p.status === 'Overdue' || p.status === 'Partially Paid')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  , []);

  // Recent confirmed payments
  const recentConfirmed = useMemo(() =>
    INITIAL_PAYMENTS.filter(p => p.status === 'Confirmed')
      .sort((a, b) => (b.paidDate ?? '').localeCompare(a.paidDate ?? ''))
      .slice(0, 5)
  , []);

  // Revenue by source
  const revenueBySource = useMemo(() => {
    const map: Record<string, number> = {};
    INITIAL_PAYMENTS.forEach(p => {
      map[p.source] = (map[p.source] || 0) + p.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);
  const totalRevBySource = revenueBySource.reduce((s, [, v]) => s + v, 0);

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Accounting Dashboard</h2>
        <p className="text-sm text-slate-500 font-medium">Centralized financial overview across all portals.</p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><DollarSign size={18} /></div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ArrowUpRight size={12} /> +12%</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalCollected)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-50 p-3 rounded-xl text-red-600"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-black text-red-600">{fmt(stats.totalOutstanding)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><TrendingUp size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Monthly Recurring</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(stats.mrr)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Active Clients</p>
          <p className="text-2xl font-black text-slate-900">{stats.activeClients}</p>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-yellow-50 p-2.5 rounded-lg text-yellow-600"><Clock size={16} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Pending</p>
            <p className="text-lg font-black text-slate-900">{stats.pendingCount}</p>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-red-50 p-2.5 rounded-lg text-red-600"><AlertTriangle size={16} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Overdue</p>
            <p className="text-lg font-black text-red-600">{stats.overdueCount}</p>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-violet-50 p-2.5 rounded-lg text-violet-600"><FileText size={16} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Invoices Paid</p>
            <p className="text-lg font-black text-slate-900">{stats.paidInvoices}/{INITIAL_INVOICES.length}</p>
          </div>
        </Card>
        <Card className="p-4 border-slate-200 shadow-sm flex items-center gap-3">
          <div className="bg-emerald-50 p-2.5 rounded-lg text-emerald-600"><CheckCircle2 size={16} /></div>
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase">Collection Rate</p>
            <p className="text-lg font-black text-emerald-600">{stats.collectionRate}%</p>
          </div>
        </Card>
      </div>

      {/* Action Required + Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Payments */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Action Required</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Payments awaiting confirmation</p>
            </div>
            <Button variant="ghost" className="text-xs text-amber-600 font-bold" onClick={() => router.push('/portal/accounting/payments')}>
              View All <ArrowRight size={12} />
            </Button>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentPayments.map(pay => (
              <div key={pay.id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-[10px] font-black shrink-0">
                  {pay.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{pay.clientName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{pay.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-slate-900">{fmt(pay.amount)}</p>
                  <Badge variant={STATUS_BADGE[pay.status]} className="text-[8px] uppercase mt-0.5">{pay.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Confirmed */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Recent Payments</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Latest confirmed payments</p>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentConfirmed.map(pay => (
              <div key={pay.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-700 text-[10px] font-black shrink-0">
                  {pay.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{pay.clientName}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{pay.method}</span>
                    <span>·</span>
                    <span>{pay.referenceNo}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-emerald-600">{fmt(pay.amountPaid)}</p>
                  <p className="text-[10px] text-slate-400">{pay.paidDate}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Revenue by Source */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-black text-slate-800">Revenue by Source</h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Where payments originate from</p>
          </div>
          <BarChart3 size={18} className="text-slate-300" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {revenueBySource.map(([source, amount]) => {
            const pct = totalRevBySource > 0 ? Math.round((amount / totalRevBySource) * 100) : 0;
            return (
              <div key={source} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <Badge variant="neutral" className="text-[8px] uppercase mb-2">{source}</Badge>
                <p className="text-lg font-black text-slate-900">{fmt(amount)}</p>
                <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
