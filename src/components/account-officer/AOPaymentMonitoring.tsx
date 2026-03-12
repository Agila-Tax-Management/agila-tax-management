'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Search, DollarSign, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Eye, Filter, CreditCard, Users,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  type PaymentRecord,
  type PaymentStatus,
} from '@/lib/mock-accounting-data';
import { INITIAL_AO_TASKS } from '@/lib/mock-ao-data';

const STATUS_CONFIG: Record<PaymentStatus, { variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; icon: React.ReactNode }> = {
  Pending:        { variant: 'warning', icon: <Clock size={12} /> },
  Confirmed:      { variant: 'success', icon: <CheckCircle2 size={12} /> },
  Overdue:        { variant: 'danger',  icon: <AlertTriangle size={12} /> },
  'Partially Paid': { variant: 'info', icon: <TrendingUp size={12} /> },
  Refunded:       { variant: 'neutral', icon: <DollarSign size={12} /> },
};

const formatPHP = (amount: number): string =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

export function AOPaymentMonitoring() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);

  // Get client IDs assigned to the current AO (ao-1 is Camille Reyes, the current AO)
  const assignedClientIds = useMemo(() => {
    const ids = new Set<string>();
    INITIAL_AO_TASKS.forEach(task => {
      ids.add(task.clientId);
    });
    return ids;
  }, []);

  // Filter payments to only show those for assigned clients
  const myPayments = useMemo(() => {
    return INITIAL_PAYMENTS.filter(p => assignedClientIds.has(p.clientId));
  }, [assignedClientIds]);

  const filtered = useMemo(() => {
    return myPayments.filter(p => {
      const matchSearch =
        search === '' ||
        p.clientName.toLowerCase().includes(search.toLowerCase()) ||
        p.clientNo.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [myPayments, search, statusFilter]);

  const stats = useMemo(() => {
    const totalBilled = myPayments.reduce((s, p) => s + p.amount, 0);
    const totalCollected = myPayments.reduce((s, p) => s + p.amountPaid, 0);
    const outstanding = totalBilled - totalCollected;
    const overdueCount = myPayments.filter(p => p.status === 'Overdue').length;
    return { totalBilled, totalCollected, outstanding, overdueCount, clientCount: assignedClientIds.size };
  }, [myPayments, assignedClientIds]);

  const statCards = [
    { label: 'Assigned Clients', value: String(stats.clientCount), icon: Users, color: 'bg-indigo-600', textColor: 'text-indigo-600' },
    { label: 'Total Billed', value: formatPHP(stats.totalBilled), icon: DollarSign, color: 'bg-blue-600', textColor: 'text-blue-600' },
    { label: 'Collected', value: formatPHP(stats.totalCollected), icon: CheckCircle2, color: 'bg-emerald-600', textColor: 'text-emerald-600' },
    { label: 'Outstanding', value: formatPHP(stats.outstanding), icon: TrendingUp, color: 'bg-amber-600', textColor: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Payment Monitoring</h2>
        <p className="text-sm text-slate-500 font-medium">Track payments for your assigned clients.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="p-4 border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{card.label}</p>
                <p className={`text-lg font-black ${card.textColor}`}>{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4 border-slate-200">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm"
              placeholder="Search by client name, number, or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
            <select
              className="h-10 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 text-sm font-medium appearance-none cursor-pointer"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Pending</option>
              <option>Confirmed</option>
              <option>Overdue</option>
              <option>Partially Paid</option>
              <option>Refunded</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Payment Table */}
      <Card className="border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Client</th>
                <th className="p-4">Description</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Due Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Method</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map(payment => {
                  const config = STATUS_CONFIG[payment.status];
                  const isOverdue = payment.status === 'Overdue';
                  return (
                    <tr key={payment.id} className={`hover:bg-slate-50/50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4">
                        <p className="text-sm font-bold text-slate-900">{payment.clientName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{payment.clientNo}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-700 max-w-50 truncate">{payment.description}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-slate-900">{formatPHP(payment.amount)}</p>
                      </td>
                      <td className="p-4">
                        <p className={`text-sm font-bold ${payment.amountPaid >= payment.amount ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {formatPHP(payment.amountPaid)}
                        </p>
                      </td>
                      <td className="p-4">
                        <p className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {formatDate(payment.dueDate)}
                        </p>
                      </td>
                      <td className="p-4">
                        <Badge variant={config.variant} className="text-xs gap-1">
                          {config.icon} {payment.status}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <span className="text-xs text-slate-500">{payment.method ?? '—'}</span>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedPayment(payment)}
                        >
                          <Eye size={15} />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400 italic">
                    No payments match your filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Detail Modal */}
      <Modal
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title="Payment Details"
        size="lg"
      >
        {selectedPayment && (
          <div className="space-y-5 p-6">
            <Card className="p-5 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Client</h3>
                  <p className="text-sm text-slate-600">{selectedPayment.clientName} ({selectedPayment.clientNo})</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</p>
                  <p className="text-sm text-slate-900 mt-1">{selectedPayment.description}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source</p>
                  <Badge variant="neutral" className="mt-1 text-xs">{selectedPayment.source}</Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Financial Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Due</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{formatPHP(selectedPayment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</p>
                  <p className={`text-lg font-black mt-1 ${selectedPayment.amountPaid >= selectedPayment.amount ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {formatPHP(selectedPayment.amountPaid)}
                  </p>
                </div>
                {selectedPayment.amount - selectedPayment.amountPaid > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</p>
                    <p className="text-lg font-black text-red-600 mt-1">
                      {formatPHP(selectedPayment.amount - selectedPayment.amountPaid)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</p>
                  <Badge variant={STATUS_CONFIG[selectedPayment.status].variant} className="mt-1 text-xs gap-1">
                    {STATUS_CONFIG[selectedPayment.status].icon} {selectedPayment.status}
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Payment Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</p>
                  <p className="text-sm text-slate-900 mt-1">{formatDate(selectedPayment.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Date</p>
                  <p className="text-sm text-slate-900 mt-1">{formatDate(selectedPayment.paidDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</p>
                  <p className="text-sm text-slate-900 mt-1">{selectedPayment.method ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference No.</p>
                  <p className="text-sm text-slate-900 mt-1 font-mono">{selectedPayment.referenceNo ?? '—'}</p>
                </div>
              </div>
            </Card>

            {selectedPayment.notes && (
              <Card className="p-5 border-slate-200">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Notes</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedPayment.notes}</p>
              </Card>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setSelectedPayment(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
