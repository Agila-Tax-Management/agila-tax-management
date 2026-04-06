// src/components/accounting/Journaling.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus, ChevronLeft, ChevronRight, BookOpen,
  CheckCircle2, Clock, PenLine, FileText, CreditCard, Receipt, Download,
} from 'lucide-react';
import { JournalEntryForm, parseNum, formatPHP } from './JournalEntryForm';
import type { JournalEntry, TransactionType, JournalStatus } from './JournalEntryForm';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: JournalEntry[] = [
  // ── Invoices ───────────────────────────────────────────────────────────────
  {
    id: '1',
    transactionDate: '2026-03-02',
    referenceNo: 'INV-2026-0001',
    transactionType: 'Invoice',
    status: 'Posted',
    notes: 'Tax consultation services billed to Santos & Co.',
    attachments: ['invoice_santos_0001.pdf'],
    lines: [
      { id: '1a', account: 'Accounts Receivable', debit: '15000', credit: '',       description: 'Invoice #INV-2026-0001', name: 'Santos & Co.' },
      { id: '1b', account: 'Service Revenue',     debit: '',       credit: '15000', description: 'Tax consultation — Q1',  name: 'Santos & Co.' },
    ],
  },
  {
    id: '2',
    transactionDate: '2026-03-14',
    referenceNo: 'INV-2026-0002',
    transactionType: 'Invoice',
    status: 'Draft',
    notes: 'BIR filing services for Reyes Enterprises.',
    attachments: [],
    lines: [
      { id: '2a', account: 'Accounts Receivable', debit: '22500', credit: '',       description: 'Invoice #INV-2026-0002', name: 'Reyes Enterprises' },
      { id: '2b', account: 'Service Revenue',     debit: '',       credit: '22500', description: 'BIR filing — full year', name: 'Reyes Enterprises' },
    ],
  },
  // ── Payments ───────────────────────────────────────────────────────────────
  {
    id: '3',
    transactionDate: '2026-03-05',
    referenceNo: 'PMT-2026-0001',
    transactionType: 'Payment',
    status: 'Posted',
    notes: 'Santos & Co. partial payment received — GCash.',
    attachments: ['gcash_receipt_0305.jpg'],
    lines: [
      { id: '3a', account: 'Cash on Hand',        debit: '7500', credit: '',      description: 'Partial payment received', name: 'Santos & Co.' },
      { id: '3b', account: 'Accounts Receivable', debit: '',      credit: '7500', description: 'Applied to INV-2026-0001', name: 'Santos & Co.' },
    ],
  },
  {
    id: '4',
    transactionDate: '2026-03-20',
    referenceNo: 'PMT-2026-0002',
    transactionType: 'Payment',
    status: 'Posted',
    notes: 'Acme Corp full settlement — wire transfer.',
    attachments: ['bank_transfer_acme.pdf'],
    lines: [
      { id: '4a', account: 'Cash on Hand',        debit: '25000', credit: '',       description: 'Full payment — wire transfer', name: 'Acme Corp' },
      { id: '4b', account: 'Accounts Receivable', debit: '',       credit: '25000', description: 'Account settled',              name: 'Acme Corp' },
    ],
  },
  // ── Expenses ───────────────────────────────────────────────────────────────
  {
    id: '5',
    transactionDate: '2026-03-08',
    referenceNo: 'EXP-2026-0001',
    transactionType: 'Expense',
    status: 'Posted',
    notes: 'Office supplies — National Bookstore.',
    attachments: ['or_nbs_0308.jpg'],
    lines: [
      { id: '5a', account: 'Prepaid Expenses', debit: '3500', credit: '',      description: 'Office supplies & stationery', name: 'National Bookstore' },
      { id: '5b', account: 'Cash on Hand',     debit: '',      credit: '3500', description: 'Cash payment',                name: 'National Bookstore' },
    ],
  },
  {
    id: '6',
    transactionDate: '2026-03-28',
    referenceNo: 'EXP-2026-0002',
    transactionType: 'Expense',
    status: 'Posted',
    notes: 'March payroll disbursement.',
    attachments: ['payroll_march.xlsx'],
    lines: [
      { id: '6a', account: 'Drawing',      debit: '45000', credit: '',       description: 'March payroll',        name: 'All Employees' },
      { id: '6b', account: 'Cash on Hand', debit: '',       credit: '45000', description: 'Salary disbursement',  name: 'All Employees' },
    ],
  },
  // ── Receipts ───────────────────────────────────────────────────────────────
  {
    id: '7',
    transactionDate: '2026-03-10',
    referenceNo: 'REC-2026-0001',
    transactionType: 'Receipt',
    status: 'Posted',
    notes: 'Cash receipt from walk-in client.',
    attachments: ['receipt_walkin_0310.pdf'],
    lines: [
      { id: '7a', account: 'Cash on Hand',    debit: '5000', credit: '',      description: 'Walk-in tax advisory fee', name: 'Maria Dela Cruz' },
      { id: '7b', account: 'Service Revenue', debit: '',      credit: '5000', description: 'Single-session advisory',  name: 'Maria Dela Cruz' },
    ],
  },
  // ── Journal Entries ────────────────────────────────────────────────────────
  {
    id: '8',
    transactionDate: '2026-03-15',
    referenceNo: 'JE-2026-0001',
    transactionType: 'Journal Entry',
    status: 'Posted',
    notes: 'Owner capital contribution — March.',
    attachments: [],
    lines: [
      { id: '8a', account: 'Cash on Hand',    debit: '100000', credit: '',        description: 'Capital contribution', name: 'Owner' },
      { id: '8b', account: "Owner's Capital", debit: '',        credit: '100000', description: 'Initial capital',      name: 'Owner' },
    ],
  },
  {
    id: '9',
    transactionDate: '2026-03-31',
    referenceNo: 'JE-2026-0002',
    transactionType: 'Journal Entry',
    status: 'Draft',
    notes: 'Month-end adjusting entry — accrued income.',
    attachments: [],
    lines: [
      { id: '9a', account: 'Accounts Receivable', debit: '8000', credit: '',      description: 'Accrued service fee — March', name: 'Pending Clients' },
      { id: '9b', account: 'Service Revenue',     debit: '',      credit: '8000', description: 'Accrual adjustment',          name: 'Pending Clients' },
    ],
  },
  // ── April entries ──────────────────────────────────────────────────────────
  {
    id: '10',
    transactionDate: '2026-04-01',
    referenceNo: 'EXP-2026-0003',
    transactionType: 'Expense',
    status: 'Draft',
    notes: 'Petty cash replenishment for April.',
    attachments: [],
    lines: [
      { id: '10a', account: 'Petty Cash Fund', debit: '5000', credit: '',      description: 'Petty cash replenishment', name: 'Cashier' },
      { id: '10b', account: 'Cash on Hand',    debit: '',      credit: '5000', description: 'Fund transfer',            name: 'Cashier' },
    ],
  },
  {
    id: '11',
    transactionDate: '2026-04-05',
    referenceNo: 'PMT-2026-0003',
    transactionType: 'Payment',
    status: 'Posted',
    notes: 'Vendor payment — PLDT monthly billing.',
    attachments: ['or_pldt_april.pdf'],
    lines: [
      { id: '11a', account: 'Accounts Payable', debit: '2800', credit: '',      description: 'PLDT monthly internet bill', name: 'PLDT' },
      { id: '11b', account: 'Cash on Hand',     debit: '',      credit: '2800', description: 'Cash payment',               name: 'PLDT' },
    ],
  },
];

// ─── Constants & helpers ───────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric' });
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: JournalStatus }): React.ReactElement {
  return status === 'Posted' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <CheckCircle2 size={10} /> Posted
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide">
      <Clock size={10} /> Draft
    </span>
  );
}

// ─── Transaction type badge ───────────────────────────────────────────────────

function TransactionTypeBadge({ type }: { type: TransactionType }): React.ReactElement {
  const map: Record<TransactionType, { cls: string; icon: React.ReactNode; label: string }> = {
    'Journal Entry': { cls: 'bg-slate-100 text-slate-600',     icon: <PenLine size={10} />,    label: 'Journal Entry' },
    Invoice:         { cls: 'bg-blue-100 text-blue-700',       icon: <FileText size={10} />,   label: 'Invoice' },
    Payment:         { cls: 'bg-emerald-100 text-emerald-700', icon: <CreditCard size={10} />, label: 'Payment' },
    Expense:         { cls: 'bg-rose-100 text-rose-700',       icon: <Receipt size={10} />,    label: 'Expense' },
    Receipt:         { cls: 'bg-violet-100 text-violet-700',   icon: <Download size={10} />,   label: 'Receipt' },
  };
  const { cls, icon, label } = map[type] ?? map['Journal Entry'];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${cls}`}>
      {icon} {label}
    </span>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function Journaling(): React.ReactNode {
  const now = new Date();
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_ENTRIES);
  const [view, setView] = useState<'list' | 'new'>('list');
  const [filterMonth, setFilterMonth] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });

  function handleSave(entry: JournalEntry) {
    setEntries((prev) => [...prev, entry]);
  }

  function handleSaveNew(entry: JournalEntry) {
    setEntries((prev) => [...prev, entry]);
  }

  function prevMonth() {
    setFilterMonth((p) =>
      p.month === 1 ? { year: p.year - 1, month: 12 } : { year: p.year, month: p.month - 1 }
    );
  }

  function nextMonth() {
    setFilterMonth((p) =>
      p.month === 12 ? { year: p.year + 1, month: 1 } : { year: p.year, month: p.month + 1 }
    );
  }

  const filteredEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.transactionDate);
        return d.getFullYear() === filterMonth.year && d.getMonth() + 1 === filterMonth.month;
      }),
    [entries, filterMonth]
  );

  // Flatten each entry's lines into ledger rows
  const ledgerRows = useMemo(
    () =>
      filteredEntries.flatMap((e) =>
        e.lines.map((l) => ({
          entryId: e.id,
          transactionDate: e.transactionDate,
          referenceNo: e.referenceNo,
          transactionType: e.transactionType,
          status: e.status,
          name: l.name,
          description: l.description,
          account: l.account,
          debit: parseNum(l.debit),
          credit: parseNum(l.credit),
        }))
      ),
    [filteredEntries]
  );

  const totalDebit = ledgerRows.reduce((s, r) => s + r.debit, 0);
  const totalCredit = ledgerRows.reduce((s, r) => s + r.credit, 0);

  if (view === 'new') {
    return (
      <JournalEntryForm
        entries={entries}
        onSave={handleSave}
        onClose={() => setView('list')}
        onSaveNew={handleSaveNew}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Journal Entries</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Record and review all accounting transactions by month.
          </p>
        </div>
        <button
          onClick={() => setView('new')}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all shrink-0"
        >
          <Plus size={16} />
          New Journal Entry
        </button>
      </div>

      {/* Month filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
          <button
            onClick={prevMonth}
            className="flex items-center justify-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-r border-slate-200"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="px-5 py-2.5 text-sm font-bold text-slate-800 min-w-44 text-center">
            {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}
          </span>
          <button
            onClick={nextMonth}
            className="flex items-center justify-center px-3 py-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors border-l border-slate-200"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        {filteredEntries.length > 0 && (
          <span className="text-xs text-slate-500">
            {filteredEntries.length} entr{filteredEntries.length !== 1 ? 'ies' : 'y'} &bull; {ledgerRows.length} lines
          </span>
        )}
      </div>

      {/* Ledger table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        {ledgerRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen size={32} className="text-slate-300" />
            <p className="text-sm text-slate-400">
              No journal entries for {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}.
            </p>
            <button
              onClick={() => setView('new')}
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Create a new entry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ minWidth: '900px' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Transaction Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Reference No.</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Account</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Debit</th>
                  <th className="text-right px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Credit</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((row, idx) => (
                  <tr
                    key={`${row.entryId}-${idx}`}
                    className="border-b border-slate-100 hover:bg-amber-50/30 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                      {formatDate(row.transactionDate)}
                    </td>
                    <td className="px-4 py-3">
                      <TransactionTypeBadge type={row.transactionType} />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                      {row.referenceNo}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-700 whitespace-nowrap">
                      {row.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-48 truncate" title={row.description}>
                      {row.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-800 whitespace-nowrap">
                      {row.account || '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-slate-800">
                      {row.debit > 0 ? formatPHP(row.debit) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-xs font-semibold tabular-nums text-slate-800">
                      {row.credit > 0 ? formatPHP(row.credit) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-600 text-white">
                  <td colSpan={7} className="px-4 py-3">
                    <span className="text-xs font-black uppercase tracking-widest">
                      Total — {MONTH_NAMES[filterMonth.month - 1]} {filterMonth.year}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black tabular-nums">{formatPHP(totalDebit)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-black tabular-nums">{formatPHP(totalCredit)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
