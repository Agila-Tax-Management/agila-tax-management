// src/components/compliance/SubscriptionDetail.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, FilePlus2, Building2, Plus } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SubRemarks = 'Legacy' | 'Migrated' | 'Upgrade' | 'New';

interface SubRow {
  id: string;
  dateAdded: string;
  plan: string;
  rate: number;
  discount: number;
  effectiveMonth: string;
  remarks: SubRemarks;
}

interface LedgerRow {
  id: string;
  coverageMonth: string;
  charges: number;
  payment: number;
  endingBalance: number;
  status: 'Paid' | 'Partial' | 'Pending';
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PLAN_MAP: Record<string, { label: string; rate: number }> = {
  'essentials-non-vat': { label: 'Essentials - Non VAT', rate: 2500 },
  'essentials-vat':     { label: 'Essentials - VAT',     rate: 4500 },
  'agila360-non-vat':   { label: 'Agila360 - Non VAT',   rate: 5000 },
  'agila360-vat':       { label: 'Agila360 - VAT',       rate: 6500 },
  'vip':                { label: 'Professionals',         rate: 1500 },
  'starter':            { label: 'Essentials - Non VAT',  rate: 2500 },
};

const REMARKS_OPTIONS: SubRemarks[] = ['New', 'Legacy', 'Migrated', 'Upgrade'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const YEAR_OPTIONS = [2024, 2025, 2026];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function seedNum(clientId: string, m: number): number {
  const base = clientId.charCodeAt(clientId.length - 1);
  return (base * 31 + m * 7) % 10;
}

function buildSubRows(client: MockClientWithCompliance): SubRow[] {
  const basePlan = client.planDetails?.basePlan ?? 'starter';
  const planInfo = PLAN_MAP[basePlan] ?? PLAN_MAP['starter'];
  const createdYear = new Date(client.createdAt).getFullYear();
  const rows: SubRow[] = [];

  if (createdYear < 2025) {
    rows.push({
      id: `${client.id}-sub-0`,
      dateAdded: `${createdYear}-03-01`,
      plan: 'Essentials - Non VAT',
      rate: 2500,
      discount: 0,
      effectiveMonth: `March ${createdYear}`,
      remarks: 'Legacy',
    });
  }

  rows.push({
    id: `${client.id}-sub-1`,
    dateAdded: client.createdAt.slice(0, 10),
    plan: planInfo.label,
    rate: planInfo.rate,
    discount: 0,
    effectiveMonth: `January ${Math.max(createdYear, 2026)}`,
    remarks: createdYear < 2025 ? 'Upgrade' : 'New',
  });

  return rows;
}

function buildLedgerRows(clientId: string, year: number, finalRate: number): LedgerRow[] {
  if (finalRate <= 0) return [];

  const today = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;

  const rows: LedgerRow[] = [];
  let running = 0;

  for (let m = 1; m <= maxMonth; m++) {
    const charges = finalRate;
    const isCurrentMonth = year === today.getFullYear() && m === maxMonth;

    let payment: number;
    let status: LedgerRow['status'];

    if (isCurrentMonth) {
      payment = 0;
      status = 'Pending';
    } else {
      const seed = seedNum(clientId, m);
      if (seed < 7)      { payment = charges;                    status = 'Paid';    }
      else if (seed < 9) { payment = 0;                          status = 'Pending'; }
      else               { payment = Math.floor(charges / 2);    status = 'Partial'; }
    }

    running = running + charges - payment;

    rows.push({
      id: `${clientId}-ledger-${year}-${m}`,
      coverageMonth: `${MONTH_NAMES[m - 1]} ${year}`,
      charges,
      payment,
      endingBalance: running,
      status,
    });
  }

  return rows;
}

// ─── Props ─────────────────────────────────────────────────────────────────────

interface SubscriptionDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function SubscriptionDetail({ client, year, onYearChange}: SubscriptionDetailProps): React.ReactNode {
  const [subRows, setSubRows] = useState<SubRow[]>(() => buildSubRows(client));
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  // Add payment form
  const [payMonth, setPayMonth] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [payRef, setPayRef] = useState('');
  const [payRemarks, setPayRemarks] = useState('');

  // Derive active rate from last subscription row
  const activeSub = subRows[subRows.length - 1];
  const activeRate = activeSub ? activeSub.rate - activeSub.discount : 0;

  const clientId = client.id;
  const ledgerRows = useMemo(
    () => buildLedgerRows(clientId, year, activeRate),
    [clientId, year, activeRate]
  );

  const currentBalance = ledgerRows.length > 0 ? ledgerRows[ledgerRows.length - 1].endingBalance : 0;
  const totalCharges   = ledgerRows.reduce((s, r) => s + r.charges, 0);
  const totalPayments  = ledgerRows.reduce((s, r) => s + r.payment, 0);

  function updateDiscount(id: string, val: number) {
    setSubRows(prev =>
      prev.map(r => r.id === id ? { ...r, discount: Math.max(0, Math.min(r.rate, val)) } : r)
    );
  }

  function updateRemarks(id: string, val: SubRemarks) {
    setSubRows(prev => prev.map(r => r.id === id ? { ...r, remarks: val } : r));
  }

  function handleAddPayment() {
    // TODO: wire to real API when available
    setIsAddPaymentOpen(false);
    setPayMonth(''); setPayAmount(''); setPayRef(''); setPayRemarks('');
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">
                {client.businessName} ({client.clientNo})
              </p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Subscription Fee</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setIsOpenCaseOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
            >
              <FilePlus2 size={15} /> File Open Case
            </button>
          </div>
        </div>
      </Card>

      {/* Subscription plan table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Subscription Plans</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '860px' }}>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Date Added</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Subscription Plan</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Rate</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Discount</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Final Rate</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Effective Month</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {subRows.map(row => {
                const finalRate = row.rate - row.discount;
                return (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{fmtDate(row.dateAdded)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800">{row.plan}</td>
                    <td className="px-5 py-3.5 text-right text-xs font-mono text-slate-600">{fmtPHP(row.rate)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-xs text-slate-400 shrink-0">₱</span>
                        <input
                          type="number"
                          min={0}
                          max={row.rate}
                          value={row.discount}
                          onChange={e => updateDiscount(row.id, Number(e.target.value))}
                          className="w-24 text-right rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right text-xs font-mono font-black text-emerald-700">{fmtPHP(finalRate)}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">{row.effectiveMonth}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={row.remarks}
                        onChange={e => updateRemarks(row.id, e.target.value as SubRemarks)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      >
                        {REMARKS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Outstanding balance + ledger */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {currentBalance > 0 ? (
            <p className="text-sm font-semibold text-slate-700">
              Your Outstanding Balance as of today is{' '}
              <span className="font-black text-red-600">{fmtPHP(currentBalance)}</span>
            </p>
          ) : (
            <p className="text-sm font-bold text-emerald-600">All dues have been paid.</p>
          )}
          <button
            onClick={() => setIsAddPaymentOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shrink-0"
          >
            <Plus size={14} /> Add Payment
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '640px' }}>
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Coverage (Month)</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Current Charges</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Ending Balance</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-400">
                    No records for {year}.
                  </td>
                </tr>
              ) : ledgerRows.map(row => (
                <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-xs font-semibold text-slate-700 whitespace-nowrap">{row.coverageMonth}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-mono text-slate-700">{fmtPHP(row.charges)}</td>
                  <td className="px-5 py-3.5 text-right text-xs font-mono text-emerald-700">
                    {row.payment > 0 ? fmtPHP(row.payment) : '—'}
                  </td>
                  <td className={`px-5 py-3.5 text-right text-xs font-mono font-bold ${row.endingBalance > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmtPHP(row.endingBalance)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full ${
                      row.status === 'Paid'    ? 'bg-emerald-50 text-emerald-700' :
                      row.status === 'Partial' ? 'bg-amber-50 text-amber-700' :
                                                 'bg-red-50 text-red-700'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {ledgerRows.length > 0 && (
              <tfoot>
                <tr className="bg-slate-800 text-white">
                  <td className="px-5 py-3 text-xs font-black uppercase tracking-wide">Total</td>
                  <td className="px-5 py-3 text-right text-xs font-black font-mono">{fmtPHP(totalCharges)}</td>
                  <td className="px-5 py-3 text-right text-xs font-black font-mono">{fmtPHP(totalPayments)}</td>
                  <td className={`px-5 py-3 text-right text-xs font-black font-mono ${currentBalance > 0 ? 'text-red-300' : 'text-emerald-300'}`}>
                    {fmtPHP(currentBalance)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>

      {/* File Open Case Modal */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>Subscription — Overdue Balance</option>
                <option>BIR — Deficiency Tax</option>
                <option>SEC — Late Filing</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea rows={3} placeholder="Describe the case..." className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsOpenCaseOpen(false)}>Cancel</Button>
            <button className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all" onClick={() => setIsOpenCaseOpen(false)}>
              File Case
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal isOpen={isAddPaymentOpen} onClose={() => setIsAddPaymentOpen(false)} title="Add Payment" size="md">
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Coverage Month</label>
              <input
                type="month"
                value={payMonth}
                onChange={e => setPayMonth(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₱</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white pl-6 pr-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Payment Method</label>
              <select
                value={payMethod}
                onChange={e => setPayMethod(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option>Cash</option>
                <option>GCash</option>
                <option>Bank Transfer</option>
                <option>Check</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Reference #</label>
              <input
                type="text"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="GCash ref, OR number..."
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Remarks</label>
            <input
              type="text"
              value={payRemarks}
              onChange={e => setPayRemarks(e.target.value)}
              placeholder="Optional notes..."
              className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
            <button
              className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-all"
              onClick={handleAddPayment}
            >
              Record Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
