'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  Search, Receipt, Eye, Users, CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  INITIAL_BILLING,
  type BillingRecord,
  type BillingStatus,
} from '@/lib/mock-accounting-data';

const STATUS_CONFIG: Record<BillingStatus, { badge: 'info' | 'success' | 'danger' | 'warning' | 'neutral'; color: string }> = {
  Active:    { badge: 'success', color: 'bg-emerald-500' },
  Overdue:   { badge: 'danger',  color: 'bg-red-500' },
  Paused:    { badge: 'warning', color: 'bg-yellow-500' },
  Cancelled: { badge: 'neutral', color: 'bg-slate-400' },
};

export function BillingOverview() {
  const [billing] = useState<BillingRecord[]>(INITIAL_BILLING);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<BillingRecord | null>(null);

  const filtered = useMemo(() => {
    return billing.filter(b => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return b.clientName.toLowerCase().includes(q) || b.clientNo.includes(q) || b.planName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [billing, search, statusFilter]);

  const stats = useMemo(() => {
    const active = billing.filter(b => b.status === 'Active').length;
    const mrr = billing.filter(b => b.status === 'Active').reduce((s, b) => s + b.amount, 0);
    const totalBilled = billing.reduce((s, b) => s + b.totalBilled, 0);
    const totalPaid = billing.reduce((s, b) => s + b.totalPaid, 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;
    return { active, mrr, totalBilled, collectionRate };
  }, [billing]);

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Billing Overview</h2>
        <p className="text-sm text-slate-500 font-medium">Client subscriptions, billing cycles, and collection tracking.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 mb-3 w-fit"><Users size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Active Clients</p>
          <p className="text-2xl font-black text-slate-900">{stats.active}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mb-3 w-fit"><TrendingUp size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Monthly Recurring</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(stats.mrr)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 mb-3 w-fit"><Receipt size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Billed (All Time)</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalBilled)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-violet-50 p-3 rounded-xl text-violet-600 mb-3 w-fit"><CheckCircle2 size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Collection Rate</p>
          <p className="text-2xl font-black text-slate-900">{stats.collectionRate}%</p>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-50">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search billing records..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none">
            <option value="all">All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* Billing Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cycle</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Next Billing</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lifetime</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No billing records found.</td></tr>
              ) : filtered.map(bill => {
                const cfg = STATUS_CONFIG[bill.status];
                const unpaid = bill.totalBilled - bill.totalPaid;
                return (
                  <tr key={bill.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-[10px] font-black">
                          {bill.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{bill.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{bill.clientNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-sm text-slate-700 font-medium">{bill.planName}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{bill.billingCycle}</td>
                    <td className="px-5 py-4 text-right font-black text-slate-900">{bill.amount > 0 ? fmt(bill.amount) : '—'}</td>
                    <td className="px-5 py-4 text-slate-600 text-sm">{bill.nextBillingDate}</td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.badge} className="text-[9px] uppercase">{bill.status}</Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <p className="font-bold text-slate-900 text-sm">{fmt(bill.totalPaid)}</p>
                      {unpaid > 0 && <p className="text-[10px] text-red-500 font-bold">Due: {fmt(unpaid)}</p>}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelected(bill)}>
                        <Eye size={14} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title="Billing Details" size="md">
        {selected && (() => {
          const cfg = STATUS_CONFIG[selected.status];
          const unpaid = selected.totalBilled - selected.totalPaid;
          return (
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-black text-sm">
                  {selected.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900">{selected.clientName}</h3>
                  <p className="text-xs text-slate-500">{selected.clientNo}</p>
                </div>
                <Badge variant={cfg.badge} className="text-[9px] uppercase">{selected.status}</Badge>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-bold text-slate-800">{selected.planName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Billing Cycle</span>
                  <span className="font-bold text-slate-800">{selected.billingCycle}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Monthly Amount</span>
                  <span className="font-black text-slate-900">{selected.amount > 0 ? fmt(selected.amount) : '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start Date</span>
                  <span className="font-bold text-slate-800">{selected.startDate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Next Billing</span>
                  <span className="font-bold text-slate-800">{selected.nextBillingDate}</span>
                </div>
                {selected.lastPaymentDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Last Payment</span>
                    <span className="font-bold text-emerald-600">{selected.lastPaymentDate}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1">Total Billed</p>
                  <p className="text-lg font-black text-blue-700">{fmt(selected.totalBilled)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Total Paid</p>
                  <p className="text-lg font-black text-emerald-700">{fmt(selected.totalPaid)}</p>
                </div>
                <div className={`rounded-xl p-4 border text-center ${unpaid > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                  <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${unpaid > 0 ? 'text-red-500' : 'text-slate-400'}`}>Balance</p>
                  <p className={`text-lg font-black ${unpaid > 0 ? 'text-red-700' : 'text-slate-400'}`}>{fmt(unpaid)}</p>
                </div>
              </div>

              <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>Close</Button>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
