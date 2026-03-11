'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Search, CreditCard, Clock, CheckCircle2,
  AlertTriangle, Eye,
  ArrowUpRight, ArrowDownRight, CircleDot,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  type PaymentRecord,
  type PaymentStatus,
  type PaymentMethod,
} from '@/lib/mock-accounting-data';

const STATUS_CONFIG: Record<PaymentStatus, { badge: 'info' | 'success' | 'danger' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
  Pending:        { badge: 'warning', icon: <Clock size={14} /> },
  Confirmed:      { badge: 'success', icon: <CheckCircle2 size={14} /> },
  Overdue:        { badge: 'danger',  icon: <AlertTriangle size={14} /> },
  'Partially Paid': { badge: 'info', icon: <CircleDot size={14} /> },
  Refunded:       { badge: 'neutral', icon: <ArrowDownRight size={14} /> },
};

const PAYMENT_METHODS: PaymentMethod[] = ['Bank Transfer', 'GCash', 'Maya', 'Cash', 'Check', 'Credit Card'];

export function PaymentCenter() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [confirmModal, setConfirmModal] = useState<PaymentRecord | null>(null);
  const [confirmMethod, setConfirmMethod] = useState<PaymentMethod>('Bank Transfer');
  const [confirmRef, setConfirmRef] = useState('');

  const filtered = useMemo(() => {
    return payments.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (sourceFilter !== 'all' && p.source !== sourceFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.clientName.toLowerCase().includes(q)
          || p.clientNo.includes(q)
          || p.description.toLowerCase().includes(q)
          || (p.referenceNo && p.referenceNo.toLowerCase().includes(q));
      }
      return true;
    });
  }, [payments, search, statusFilter, sourceFilter]);

  const stats = useMemo(() => {
    const pending = payments.filter(p => p.status === 'Pending');
    const overdue = payments.filter(p => p.status === 'Overdue');
    const confirmed = payments.filter(p => p.status === 'Confirmed');
    const totalCollected = confirmed.reduce((s, p) => s + p.amountPaid, 0);
    const totalOutstanding = payments.filter(p => p.status !== 'Confirmed' && p.status !== 'Refunded')
      .reduce((s, p) => s + (p.amount - p.amountPaid), 0);
    return { pending: pending.length, overdue: overdue.length, totalCollected, totalOutstanding };
  }, [payments]);

  const handleConfirmPayment = () => {
    if (!confirmModal || !confirmRef.trim()) return;
    setPayments(prev => prev.map(p =>
      p.id === confirmModal.id
        ? { ...p, status: 'Confirmed' as PaymentStatus, method: confirmMethod, amountPaid: p.amount, paidDate: '2026-03-11', referenceNo: confirmRef }
        : p
    ));
    setConfirmModal(null);
    setConfirmMethod('Bank Transfer');
    setConfirmRef('');
  };

  const fmt = (n: number) => '₱' + n.toLocaleString('en-PH');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Center</h2>
          <p className="text-sm text-slate-500 font-medium">Centralized payment tracking across all portals.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-amber-50 p-3 rounded-xl text-amber-600"><CreditCard size={18} /></div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600"><ArrowUpRight size={12} /> Active</div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Total Collected</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalCollected)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-50 p-3 rounded-xl text-red-600"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Outstanding</p>
          <p className="text-2xl font-black text-slate-900">{fmt(stats.totalOutstanding)}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-yellow-50 p-3 rounded-xl text-yellow-600"><Clock size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Pending</p>
          <p className="text-2xl font-black text-slate-900">{stats.pending}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="bg-red-50 p-3 rounded-xl text-red-600"><AlertTriangle size={18} /></div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-2xl font-black text-red-600">{stats.overdue}</p>
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
              placeholder="Search payments..."
              className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none">
            <option value="all">All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none">
            <option value="all">All Sources</option>
            {['Sales', 'Account Officer', 'Compliance', 'Liaison', 'Direct'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      {/* Payment List */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</th>
                <th className="text-left px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400">No payments found.</td></tr>
              ) : filtered.map(payment => {
                const cfg = STATUS_CONFIG[payment.status];
                return (
                  <tr key={payment.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center text-amber-700 text-[10px] font-black">
                          {payment.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{payment.clientName}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{payment.clientNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-slate-700 text-sm truncate max-w-60">{payment.description}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-black text-slate-900">{fmt(payment.amount)}</p>
                      {payment.amountPaid > 0 && payment.amountPaid < payment.amount && (
                        <p className="text-[10px] text-emerald-600 font-bold">Paid: {fmt(payment.amountPaid)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="neutral" className="text-[9px] uppercase">{payment.source}</Badge>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{payment.dueDate}</td>
                    <td className="px-5 py-4">
                      <Badge variant={cfg.badge} className="text-[9px] uppercase flex items-center gap-1 w-fit">
                        {cfg.icon} {payment.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedPayment(payment)}>
                          <Eye size={14} />
                        </Button>
                        {(payment.status === 'Pending' || payment.status === 'Overdue' || payment.status === 'Partially Paid') && (
                          <Button
                            className="h-8 px-3 text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={() => setConfirmModal(payment)}
                          >
                            Confirm
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedPayment} onClose={() => setSelectedPayment(null)} title="Payment Details" size="md">
        {selectedPayment && (() => {
          const cfg = STATUS_CONFIG[selectedPayment.status];
          return (
            <div className="p-6 space-y-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700 font-black text-sm">
                  {selectedPayment.clientName.split(' ').map(w => w[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900">{selectedPayment.clientName}</h3>
                  <p className="text-xs text-slate-500">{selectedPayment.clientNo}</p>
                </div>
                <Badge variant={cfg.badge} className="text-[9px] uppercase">{selectedPayment.status}</Badge>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Description</span>
                  <span className="font-bold text-slate-800 text-right max-w-[60%]">{selectedPayment.description}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount</span>
                  <span className="font-black text-slate-900">{fmt(selectedPayment.amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Paid</span>
                  <span className="font-bold text-emerald-600">{fmt(selectedPayment.amountPaid)}</span>
                </div>
                {selectedPayment.amountPaid < selectedPayment.amount && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Balance</span>
                    <span className="font-bold text-red-600">{fmt(selectedPayment.amount - selectedPayment.amountPaid)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Source</span>
                  <span className="font-bold text-slate-800">{selectedPayment.source}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Due Date</span>
                  <span className="font-bold text-slate-800">{selectedPayment.dueDate}</span>
                </div>
                {selectedPayment.method && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Method</span>
                    <span className="font-bold text-slate-800">{selectedPayment.method}</span>
                  </div>
                )}
                {selectedPayment.referenceNo && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Reference</span>
                    <span className="font-bold text-slate-800">{selectedPayment.referenceNo}</span>
                  </div>
                )}
                {selectedPayment.paidDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Paid On</span>
                    <span className="font-bold text-emerald-600">{selectedPayment.paidDate}</span>
                  </div>
                )}
              </div>

              {selectedPayment.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1.5">Notes</p>
                  <p className="text-sm text-slate-600">{selectedPayment.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedPayment(null)}>Close</Button>
                {(selectedPayment.status === 'Pending' || selectedPayment.status === 'Overdue' || selectedPayment.status === 'Partially Paid') && (
                  <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" onClick={() => { setSelectedPayment(null); setConfirmModal(selectedPayment); }}>
                    Confirm Payment
                  </Button>
                )}
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* Confirm Payment Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)} title="Confirm Payment" size="sm">
        {confirmModal && (
          <div className="p-6 space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
              <p className="text-sm font-bold text-slate-800">{confirmModal.clientName}</p>
              <p className="text-xs text-slate-500 mt-1">{confirmModal.description}</p>
              <p className="text-lg font-black text-amber-700 mt-2">{fmt(confirmModal.amount)}</p>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Payment Method *</label>
              <select
                value={confirmMethod}
                onChange={e => setConfirmMethod(e.target.value as PaymentMethod)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Reference No. *</label>
              <Input
                value={confirmRef}
                onChange={e => setConfirmRef(e.target.value)}
                placeholder="e.g. BT-2026-0311-001"
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmModal(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleConfirmPayment}
                disabled={!confirmRef.trim()}
              >
                <CheckCircle2 size={14} /> Confirm
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
