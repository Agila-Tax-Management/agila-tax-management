'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  BarChart3, TrendingUp, TrendingDown, ArrowUpRight,
  DollarSign, Users, PieChart,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  INITIAL_INVOICES,
  INITIAL_BILLING,
} from '@/lib/mock-accounting-data';

// ── Revenue by Plan ─────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  Starter: 'bg-blue-500',
  'Essentials (Non-VAT)': 'bg-emerald-500',
  'Essentials (VAT)': 'bg-teal-500',
  'Agila360 (Non-VAT)': 'bg-purple-500',
  'Agila360 (VAT)': 'bg-violet-500',
  VIP: 'bg-amber-500',
  '—': 'bg-slate-300',
};

export function AccountingReports() {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');

  // Revenue metrics
  const revenueByPlan = useMemo(() => {
    const map: Record<string, number> = {};
    INITIAL_BILLING.forEach(b => {
      if (b.status === 'Active' || b.status === 'Overdue') {
        map[b.planName] = (map[b.planName] || 0) + b.amount;
      }
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, []);
  const totalMRR = revenueByPlan.reduce((s, [, v]) => s + v, 0);

  // Collection metrics
  const collectionStats = useMemo(() => {
    const confirmed = INITIAL_PAYMENTS.filter(p => p.status === 'Confirmed');
    const pending = INITIAL_PAYMENTS.filter(p => p.status === 'Pending');
    const overdue = INITIAL_PAYMENTS.filter(p => p.status === 'Overdue');
    const partial = INITIAL_PAYMENTS.filter(p => p.status === 'Partially Paid');

    const totalCollected = confirmed.reduce((s, p) => s + p.amountPaid, 0);
    const totalPending = pending.reduce((s, p) => s + (p.amount - p.amountPaid), 0);
    const totalOverdue = overdue.reduce((s, p) => s + (p.amount - p.amountPaid), 0);
    const totalPartial = partial.reduce((s, p) => s + (p.amount - p.amountPaid), 0);

    return { totalCollected, totalPending, totalOverdue, totalPartial, confirmedCount: confirmed.length, pendingCount: pending.length, overdueCount: overdue.length };
  }, []);

  // Payment method breakdown
  const methodBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    INITIAL_PAYMENTS.filter(p => p.method).forEach(p => {
      const m = p.method!;
      if (!map[m]) map[m] = { count: 0, amount: 0 };
      map[m].count++;
      map[m].amount += p.amountPaid;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, []);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const map: Record<string, { count: number; amount: number }> = {};
    INITIAL_PAYMENTS.forEach(p => {
      if (!map[p.source]) map[p.source] = { count: 0, amount: 0 };
      map[p.source].count++;
      map[p.source].amount += p.amount;
    });
    return Object.entries(map).sort((a, b) => b[1].amount - a[1].amount);
  }, []);

  // Invoice status breakdown
  const invoiceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    INITIAL_INVOICES.forEach(inv => {
      map[inv.status] = (map[inv.status] || 0) + 1;
    });
    return Object.entries(map);
  }, []);

  // Client billing health
  const billingHealth = useMemo(() => {
    const active = INITIAL_BILLING.filter(b => b.status === 'Active' && b.totalPaid >= b.totalBilled).length;
    const partial = INITIAL_BILLING.filter(b => b.status === 'Active' && b.totalPaid < b.totalBilled).length;
    const overdue = INITIAL_BILLING.filter(b => b.status === 'Overdue').length;
    const paused = INITIAL_BILLING.filter(b => b.status === 'Paused' || b.status === 'Cancelled').length;
    return { active, partial, overdue, paused };
  }, []);

  // Monthly revenue trend (simulated)
  const monthlyTrend = [
    { month: 'Oct', revenue: 38500 },
    { month: 'Nov', revenue: 41000 },
    { month: 'Dec', revenue: 42500 },
    { month: 'Jan', revenue: 44000 },
    { month: 'Feb', revenue: 45500 },
    { month: 'Mar', revenue: 47000 },
  ];
  const maxRevenue = Math.max(...monthlyTrend.map(m => m.revenue));

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH');

  const INV_STATUS_BADGE: Record<string, 'success' | 'info' | 'danger' | 'warning' | 'neutral'> = {
    Paid: 'success', Sent: 'info', Overdue: 'danger', 'Partially Paid': 'warning', Draft: 'neutral', Cancelled: 'neutral',
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Financial Reports</h2>
          <p className="text-sm text-slate-500 font-medium">Revenue analytics, collection performance, and financial insights.</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          {(['monthly', 'quarterly', 'yearly'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold capitalize transition ${period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><DollarSign size={18} /></div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600"><ArrowUpRight size={12} /> +12%</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Monthly Recurring Revenue</p>
          <p className="text-2xl font-black text-slate-900">{fmt(totalMRR)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600"><TrendingUp size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Collected (Mar)</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(collectionStats.totalCollected)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-50 p-3 rounded-xl text-red-600"><TrendingDown size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Outstanding</p>
          <p className="text-2xl font-black text-red-600">{fmt(collectionStats.totalOverdue + collectionStats.totalPending + collectionStats.totalPartial)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><Users size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Active Subscriptions</p>
          <p className="text-2xl font-black text-slate-900">{INITIAL_BILLING.filter(b => b.status === 'Active').length}</p>
        </Card>
      </div>

      {/* Revenue Trend + Revenue by Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800">Revenue Trend</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Last 6 months</p>
            </div>
            <BarChart3 size={18} className="text-slate-300" />
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyTrend.map(m => {
              const h = (m.revenue / maxRevenue) * 100;
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
                  <p className="text-[9px] font-black text-slate-500">{fmt(m.revenue)}</p>
                  <div className="w-full rounded-t-lg bg-amber-500/80 hover:bg-amber-500 transition-colors" style={{ height: `${h}%` }} />
                  <p className="text-[10px] font-bold text-slate-500">{m.month}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Revenue by Plan */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-black text-slate-800">Revenue by Plan</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">Monthly recurring revenue breakdown</p>
            </div>
            <PieChart size={18} className="text-slate-300" />
          </div>
          <div className="space-y-4">
            {revenueByPlan.map(([plan, amount]) => {
              const pct = totalMRR > 0 ? Math.round((amount / totalMRR) * 100) : 0;
              const color = PLAN_COLORS[plan] || 'bg-slate-400';
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${color}`} />
                      <span className="font-bold text-slate-700">{plan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500 text-xs">{pct}%</span>
                      <span className="font-black text-slate-900 text-sm">{fmt(amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Collection Performance + Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collection Performance */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-6">Collection Performance</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Confirmed</p>
              <p className="text-xl font-black text-emerald-700">{collectionStats.confirmedCount}</p>
              <p className="text-xs text-emerald-600 mt-1 font-bold">{fmt(collectionStats.totalCollected)}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
              <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-xl font-black text-yellow-700">{collectionStats.pendingCount}</p>
              <p className="text-xs text-yellow-600 mt-1 font-bold">{fmt(collectionStats.totalPending)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mb-1">Overdue</p>
              <p className="text-xl font-black text-red-700">{collectionStats.overdueCount}</p>
              <p className="text-xs text-red-600 mt-1 font-bold">{fmt(collectionStats.totalOverdue)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
              <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Partial</p>
              <p className="text-xl font-black text-blue-700">1</p>
              <p className="text-xs text-blue-600 mt-1 font-bold">{fmt(collectionStats.totalPartial)}</p>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-6">Payment Methods</h3>
          <div className="space-y-4">
            {methodBreakdown.map(([method, data]) => {
              const totalMethodAmount = methodBreakdown.reduce((s, [, d]) => s + d.amount, 0);
              const pct = totalMethodAmount > 0 ? Math.round((data.amount / totalMethodAmount) * 100) : 0;
              return (
                <div key={method}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-bold text-slate-700">{method}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">{data.count} txns</span>
                      <span className="font-black text-slate-900">{fmt(data.amount)}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Source Breakdown + Invoice Status + Client Billing Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Breakdown */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">Payment by Source</h3>
          <div className="space-y-3">
            {sourceBreakdown.map(([source, data]) => (
              <div key={source} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" className="text-[8px] uppercase">{source}</Badge>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900 text-sm">{fmt(data.amount)}</p>
                  <p className="text-[10px] text-slate-400">{data.count} payments</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Invoice Status */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">Invoice Status</h3>
          <div className="space-y-3">
            {invoiceBreakdown.map(([status, count]) => (
              <div key={status} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <Badge variant={INV_STATUS_BADGE[status] || 'neutral'} className="text-[9px] uppercase">{status}</Badge>
                <p className="font-black text-slate-900 text-lg">{count}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Client Billing Health */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-4">Client Billing Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Fully Paid
              </span>
              <p className="font-black text-slate-900">{billingHealth.active}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Partial Balance
              </span>
              <p className="font-black text-slate-900">{billingHealth.partial}</p>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Overdue
              </span>
              <p className="font-black text-red-600">{billingHealth.overdue}</p>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Paused/Cancelled
              </span>
              <p className="font-black text-slate-900">{billingHealth.paused}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
