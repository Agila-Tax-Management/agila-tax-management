'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  Search, DollarSign, AlertTriangle, CheckCircle2,
  Clock, TrendingUp, Eye, Filter, CreditCard, Download,
  Receipt, Users, CalendarDays,
} from 'lucide-react';
import {
  INITIAL_PAYMENTS,
  type PaymentRecord,
  type PaymentStatus,
} from '@/lib/mock-accounting-data';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';

// ─── Subscription billing types ───────────────────────────────────────────────

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

type SubStatus = 'Paid' | 'Partial' | 'Pending' | 'Overdue';

interface SubscriptionRow {
  clientId:      string;
  clientNo:      string;
  businessName:  string;
  authorizedRep: string;
  plan:          string;
  monthlyRate:   number;
  amountPaid:    number;
  status:        SubStatus;
  dueDate:       string;
  referenceNo:   string | null;
}

// ─── Deterministic per-month billing status ─────────────────────────────────

function charSum(id: string): number {
  return id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
}

function buildSubscriptionRows(year: number, month: number): SubscriptionRow[] {
  const now    = new Date();
  const isPast = year < now.getFullYear() ||
    (year === now.getFullYear() && month < now.getMonth() + 1);
  const pool: SubStatus[] = ['Paid','Paid','Paid','Paid','Partial','Pending','Pending','Overdue'];
  const mm = String(month).padStart(2, '0');
  return MOCK_COMPLIANCE_CLIENTS
    .filter(c => c.planDetails !== null && c.finalAmount > 0)
    .map(c => {
      const seed = (charSum(c.id) + year * 13 + month * 7) % pool.length;
      let status: SubStatus = pool[seed]!;
      if (isPast && status === 'Pending') status = 'Overdue';
      const rate = c.finalAmount;
      const paid = status === 'Paid' ? rate : status === 'Partial' ? Math.floor(rate / 2) : 0;
      return {
        clientId:      c.id,
        clientNo:      c.clientNo,
        businessName:  c.businessName,
        authorizedRep: c.authorizedRep,
        plan:          c.planDetails!.displayName,
        monthlyRate:   rate,
        amountPaid:    paid,
        status,
        dueDate:       `${year}-${mm}-05`,
        referenceNo:   status === 'Paid' ? `BT-${year}-${mm}-${c.clientNo.replace(/^\d+-/, '')}` : null,
      };
    });
}

// ─── Status configs ────────────────────────────────────────────────────────────

const SUB_STATUS_CONFIG: Record<SubStatus, { variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; icon: React.ReactNode }> = {
  Paid:    { variant: 'success', icon: <CheckCircle2 size={12} /> },
  Partial: { variant: 'info',    icon: <TrendingUp size={12} />   },
  Pending: { variant: 'warning', icon: <Clock size={12} />        },
  Overdue: { variant: 'danger',  icon: <AlertTriangle size={12} />},
};

const TXN_STATUS_CONFIG: Record<PaymentStatus, { variant: 'neutral' | 'info' | 'warning' | 'success' | 'danger'; icon: React.ReactNode }> = {
  Pending:          { variant: 'warning', icon: <Clock size={12} />        },
  Confirmed:        { variant: 'success', icon: <CheckCircle2 size={12} /> },
  Overdue:          { variant: 'danger',  icon: <AlertTriangle size={12} />},
  'Partially Paid': { variant: 'info',    icon: <TrendingUp size={12} />   },
  Refunded:         { variant: 'neutral', icon: <DollarSign size={12} />   },
};

const formatPHP = (n: number): string =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n);

const formatDate = (d: string | null): string => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
};

function exportSubscriptionCSV(rows: SubscriptionRow[], label: string): void {
  const header = 'Client No,Business Name,Authorized Rep,Plan,Monthly Rate,Amount Paid,Balance,Status,Due Date,Reference No';
  const body = rows.map(r => [
    r.clientNo,
    `"${r.businessName}"`,
    `"${r.authorizedRep}"`,
    r.monthlyRate,
    r.amountPaid,
    r.monthlyRate - r.amountPaid,
    r.status,
    r.dueDate,
    r.referenceNo ?? '',
  ].join(','));
  const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Subscription Fees - ${label}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportTransactionsCSV(data: PaymentRecord[]): void {
  const header = 'Client No,Client Name,Description,Amount,Amount Paid,Balance,Status,Source,Payment Method,Due Date,Paid Date,Reference No,Notes';
  const rows = data.map(p => [
    p.clientNo,
    `"${p.clientName}"`,
    `"${p.description}"`,
    p.amount,
    p.amountPaid,
    p.amount - p.amountPaid,
    p.status,
    p.source,
    p.method ?? '',
    p.dueDate,
    p.paidDate ?? '',
    p.referenceNo ?? '',
    `"${p.notes.replace(/"/g, '""')}"`,
  ].join(','));
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Payment Transactions - April 2026.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function PaymentMonitoring(): React.ReactNode {
  // ── Subscription state ──────────────────────────────────────────────────────
  const [selectedMonth,   setSelectedMonth]   = useState(() => new Date().getMonth() + 1);
  const [selectedYear,    setSelectedYear]    = useState(() => new Date().getFullYear());
  const [subSearch,       setSubSearch]       = useState('');
  const [subStatusFilter, setSubStatusFilter] = useState<string>('All');
  const [selectedSub,     setSelectedSub]     = useState<SubscriptionRow | null>(null);

  const subscriptionRows = useMemo(
    () => buildSubscriptionRows(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const subStats = useMemo(() => ({
    totalBillable:  subscriptionRows.reduce((s, r) => s + r.monthlyRate, 0),
    totalCollected: subscriptionRows.reduce((s, r) => s + r.amountPaid,  0),
    get outstanding() { return this.totalBillable - this.totalCollected; },
    overdueCount:   subscriptionRows.filter(r => r.status === 'Overdue').length,
  }), [subscriptionRows]);

  const monthLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  // ── Transaction state ───────────────────────────────────────────────────────
  const [payments]          = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [txnSearch,          setTxnSearch]          = useState('');
  const [txnStatusFilter,    setTxnStatusFilter]    = useState<string>('All');
  const [txnSourceFilter,    setTxnSourceFilter]    = useState<string>('All');
  const [selectedPayment,    setSelectedPayment]    = useState<PaymentRecord | null>(null);

  // ── Filtered rows ───────────────────────────────────────────────────────────
  const filteredSubs = useMemo(() =>
    subscriptionRows.filter(r => {
      const matchSearch  = subSearch === '' ||
        r.businessName.toLowerCase().includes(subSearch.toLowerCase()) ||
        r.clientNo.toLowerCase().includes(subSearch.toLowerCase());
      const matchStatus  = subStatusFilter === 'All' || r.status === subStatusFilter;
      return matchSearch && matchStatus;
    }),
  [subscriptionRows, subSearch, subStatusFilter]);

  const filteredTxns = useMemo(() =>
    payments.filter(p => {
      const matchSearch = txnSearch === '' ||
        p.clientName.toLowerCase().includes(txnSearch.toLowerCase()) ||
        p.clientNo.toLowerCase().includes(txnSearch.toLowerCase()) ||
        p.description.toLowerCase().includes(txnSearch.toLowerCase());
      const matchStatus = txnStatusFilter === 'All' || p.status === txnStatusFilter;
      const matchSource = txnSourceFilter === 'All' || p.source === txnSourceFilter;
      return matchSearch && matchStatus && matchSource;
    }),
  [payments, txnSearch, txnStatusFilter, txnSourceFilter]);

  // ── Stat cards ──────────────────────────────────────────────────────────────
  const shortMonth = MONTHS[selectedMonth - 1]!.slice(0, 3);
  const statCards = [
    { label: 'Subscribed Clients',           value: String(subscriptionRows.length),    icon: Users,         color: 'bg-blue-600',    textColor: 'text-blue-700'    },
    { label: `Collected (${shortMonth})`,    value: formatPHP(subStats.totalCollected), icon: CheckCircle2,  color: 'bg-emerald-600', textColor: 'text-emerald-700' },
    { label: `Outstanding (${shortMonth})`,  value: formatPHP(subStats.outstanding),    icon: TrendingUp,    color: 'bg-amber-600',   textColor: 'text-amber-700'   },
    { label: 'Overdue',                      value: String(subStats.overdueCount),      icon: AlertTriangle, color: 'bg-red-600',     textColor: 'text-red-700'     },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Payment Monitoring</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Track subscription fees and payment transactions across all enrolled clients.
        </p>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <Card key={card.label} className="p-4 border-slate-200">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${card.color} rounded-xl flex items-center justify-center shrink-0`}>
                <card.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{card.label}</p>
                <p className={`text-base font-black mt-1 ${card.textColor}`}>{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1 — SUBSCRIPTION FEES
      ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <Receipt size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Subscription Fees</h3>
              <p className="text-xs text-slate-400">{monthLabel} · Monthly billing cycle</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <select
                className="h-8 bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-3 text-xs font-medium appearance-none cursor-pointer"
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
              >
                {MONTHS.map((m, i) => (
                  <option key={m} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <select
              className="h-8 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-medium appearance-none cursor-pointer"
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <Button
              variant="outline"
              className="text-xs h-8 gap-1.5 shrink-0"
              onClick={() => exportSubscriptionCSV(filteredSubs, monthLabel)}
            >
              <Download size={13} /> Export
            </Button>
          </div>
        </div>

        {/* Subscription filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
              placeholder="Search by client name or number..."
              value={subSearch}
              onChange={e => setSubSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
            <select
              className="h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 text-sm font-medium appearance-none cursor-pointer"
              value={subStatusFilter}
              onChange={e => setSubStatusFilter(e.target.value)}
            >
              <option>All</option>
              <option>Paid</option>
              <option>Partial</option>
              <option>Pending</option>
              <option>Overdue</option>
            </select>
          </div>
        </div>

        {/* Subscription table */}
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '620px' }}>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Monthly Rate</th>
                  <th className="px-4 py-3">Amount Paid</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubs.length > 0 ? filteredSubs.map(row => {
                  const config   = SUB_STATUS_CONFIG[row.status];
                  const isOverdue = row.status === 'Overdue';
                  return (
                    <tr
                      key={row.clientId}
                      className={`hover:bg-slate-50/60 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-slate-900">{row.businessName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{row.clientNo}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {row.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-slate-900">{formatPHP(row.monthlyRate)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`text-sm font-bold ${
                          row.amountPaid >= row.monthlyRate ? 'text-emerald-600' :
                          row.amountPaid > 0              ? 'text-amber-600'    :
                                                            'text-slate-400'
                        }`}>
                          {row.amountPaid > 0 ? formatPHP(row.amountPaid) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {formatDate(row.dueDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={config.variant} className="text-xs gap-1">
                          {config.icon} {row.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedSub(row)}>
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-slate-400 italic text-sm">
                      No subscription records match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SECTION 2 — PAYMENT TRANSACTIONS
      ══════════════════════════════════════════════════════════════ */}
      <div className="space-y-4">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard size={16} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">Payment Transactions</h3>
              <p className="text-xs text-slate-400">All received and pending payment records</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="text-xs h-8 gap-1.5 shrink-0"
            onClick={() => exportTransactionsCSV(filteredTxns)}
          >
            <Download size={13} /> Export
          </Button>
        </div>

        {/* Transaction filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input
              className="pl-9 h-9 bg-slate-50 border-slate-200 rounded-xl text-sm"
              placeholder="Search by client, description..."
              value={txnSearch}
              onChange={e => setTxnSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <select
                className="h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 text-sm font-medium appearance-none cursor-pointer"
                value={txnStatusFilter}
                onChange={e => setTxnStatusFilter(e.target.value)}
              >
                <option>All</option>
                <option>Pending</option>
                <option>Confirmed</option>
                <option>Overdue</option>
                <option>Partially Paid</option>
                <option>Refunded</option>
              </select>
            </div>
            <div className="relative">
              <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={13} />
              <select
                className="h-9 bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 text-sm font-medium appearance-none cursor-pointer"
                value={txnSourceFilter}
                onChange={e => setTxnSourceFilter(e.target.value)}
              >
                <option>All</option>
                <option>Sales</option>
                <option>Account Officer</option>
                <option>Compliance</option>
                <option>Liaison</option>
                <option>Direct</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction table */}
        <Card className="border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left" style={{ minWidth: '720px' }}>
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Paid</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTxns.length > 0 ? filteredTxns.map(payment => {
                  const config   = TXN_STATUS_CONFIG[payment.status];
                  const isOverdue = payment.status === 'Overdue';
                  return (
                    <tr
                      key={payment.id}
                      className={`hover:bg-slate-50/60 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}
                    >
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-slate-900">{payment.clientName}</p>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{payment.clientNo}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-700 max-w-48 truncate">{payment.description}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-bold text-slate-900">{formatPHP(payment.amount)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`text-sm font-bold ${payment.amountPaid >= payment.amount ? 'text-emerald-600' : 'text-slate-600'}`}>
                          {formatPHP(payment.amountPaid)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className={`text-sm ${isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}`}>
                          {formatDate(payment.dueDate)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={config.variant} className="text-xs gap-1">
                          {config.icon} {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="neutral" className="text-[10px]">{payment.source}</Badge>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedPayment(payment)}>
                          <Eye size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={8} className="p-10 text-center text-slate-400 italic text-sm">
                      No transactions match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── Subscription Detail Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        title="Subscription Fee Details"
        size="lg"
      >
        {selectedSub && (
          <div className="space-y-5 p-6">
            <Card className="p-5 border-slate-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                  <Receipt size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Client</h3>
                  <p className="text-sm text-slate-600">{selectedSub.businessName}</p>
                  <p className="text-xs text-slate-400 font-mono">{selectedSub.clientNo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</p>
                  <p className="text-sm text-slate-900 mt-1">{selectedSub.plan}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billing Period</p>
                  <p className="text-sm text-slate-900 mt-1">{monthLabel}</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Payment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Monthly Rate</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{formatPHP(selectedSub.monthlyRate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount Paid</p>
                  <p className={`text-lg font-black mt-1 ${
                    selectedSub.amountPaid >= selectedSub.monthlyRate ? 'text-emerald-600' :
                    selectedSub.amountPaid > 0                        ? 'text-amber-600'    :
                                                                        'text-slate-400'
                  }`}>
                    {selectedSub.amountPaid > 0 ? formatPHP(selectedSub.amountPaid) : '—'}
                  </p>
                </div>
                {selectedSub.monthlyRate - selectedSub.amountPaid > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</p>
                    <p className="text-lg font-black text-red-600 mt-1">
                      {formatPHP(selectedSub.monthlyRate - selectedSub.amountPaid)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status</p>
                  <Badge variant={SUB_STATUS_CONFIG[selectedSub.status].variant} className="mt-1 text-xs gap-1">
                    {SUB_STATUS_CONFIG[selectedSub.status].icon} {selectedSub.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Due Date</p>
                  <p className="text-sm text-slate-900 mt-1">{formatDate(selectedSub.dueDate)}</p>
                </div>
                {selectedSub.referenceNo && (
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Reference No.</p>
                    <p className="text-sm font-mono text-slate-900 mt-1">{selectedSub.referenceNo}</p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex gap-3 pt-2 border-t border-slate-200">
              <Button variant="outline" className="flex-1" onClick={() => setSelectedSub(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Transaction Detail Modal ──────────────────────────────────────────── */}
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
                  <Badge variant={TXN_STATUS_CONFIG[selectedPayment.status].variant} className="mt-1 text-xs gap-1">
                    {TXN_STATUS_CONFIG[selectedPayment.status].icon} {selectedPayment.status}
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
              <Button variant="outline" className="flex-1" onClick={() => setSelectedPayment(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}