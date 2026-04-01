// src/components/accounting/Journaling.tsx
'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Plus, Trash2, ChevronLeft, ChevronRight,
  Upload, X, AlertTriangle, CheckCircle2,
  Eraser, ArrowLeft, PenLine, BookOpen, FileText, Clock,
  CreditCard, Receipt, Download,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TransactionType = 'Journal Entry' | 'Invoice' | 'Payment' | 'Expense' | 'Receipt';

type JournalStatus = 'Posted' | 'Draft';

interface JournalLine {
  id: string;
  account: string;
  debit: string;
  credit: string;
  description: string;
  name: string;
}

interface JournalEntry {
  id: string;
  transactionDate: string;
  referenceNo: string;
  transactionType: TransactionType;
  status: JournalStatus;
  lines: JournalLine[];
  notes: string;
  attachments: string[];
}

// ─── Account options (mirrors Chart of Accounts seed) ──────────────────────────

const ACCOUNT_OPTIONS = [
  'Cash on Hand',
  'Petty Cash Fund',
  'Accounts Receivable',
  'Prepaid Expenses',
  'Inventory',
  'Loans to Owner',
  'Vehicles',
  'Properties',
  'Office Equipment',
  'Accounts Payable',
  'Client Funds',
  'Loans Payable',
  'Mortgage Payable',
  "Owner's Capital",
  'Drawing',
  'Adjustments',
  'Service Revenue',
  'Sales - Retail',
  'Sales - Wholesale',
  'Other Income',
];

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

function emptyLine(): JournalLine {
  return { id: crypto.randomUUID(), account: '', debit: '', credit: '', description: '', name: '' };
}

function defaultLines(): JournalLine[] {
  return Array.from({ length: 5 }, emptyLine);
}

function parseNum(s: string): number {
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function formatPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function generateRefNo(entries: JournalEntry[]): string {
  const year = new Date().getFullYear();
  return `JE-${year}-${String(entries.length + 1).padStart(4, '0')}`;
}

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

// ─── Journal Entry Form ────────────────────────────────────────────────────────

interface JournalEntryFormProps {
  entries: JournalEntry[];
  onSave: (entry: JournalEntry) => void;
  onClose: () => void;
  onSaveNew: (entry: JournalEntry) => void;
}

function JournalEntryForm({ entries, onSave, onClose, onSaveNew }: JournalEntryFormProps): React.ReactNode {
  const today = new Date().toISOString().split('T')[0];
  const [transactionDate, setTransactionDate] = useState(today);
  const [status, setStatus] = useState<JournalStatus>('Draft');
  const [lines, setLines] = useState<JournalLine[]>(defaultLines);
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const refNo = generateRefNo(entries);
  const totalDebit = lines.reduce((s, l) => s + parseNum(l.debit), 0);
  const totalCredit = lines.reduce((s, l) => s + parseNum(l.credit), 0);
  const hasBalance = totalDebit > 0 || totalCredit > 0;
  const isBalanced = hasBalance && totalDebit === totalCredit;

  function updateLine(id: string, field: keyof JournalLine, value: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }

  function deleteLine(id: string) {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  function buildEntry(): JournalEntry {
    return {
      id: crypto.randomUUID(),
      transactionDate,
      referenceNo: refNo,
      transactionType: 'Journal Entry',
      status,
      lines: lines.filter((l) => l.account),
      notes,
      attachments,
    };
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).map((f) => f.name);
    setAttachments((prev) => [...prev, ...files]);
    if (fileRef.current) fileRef.current.value = '';
  }

  function resetForm() {
    setTransactionDate(today);
    setStatus('Draft');
    setLines(defaultLines());
    setNotes('');
    setAttachments([]);
  }

  function handleSave() {
    onSave(buildEntry());
  }

  function handleSaveClose() {
    onSave(buildEntry());
    onClose();
  }

  function handleSaveNew() {
    onSaveNew(buildEntry());
    resetForm();
  }

  const INPUT_CLS =
    'w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors';

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Journal
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg select-all">
            {refNo}
          </span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as JournalStatus)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          >
            <option value="Draft">Draft</option>
            <option value="Posted">Posted</option>
          </select>
        </div>
      </div>

      {/* Title + Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
            <PenLine size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Journal Entry</h2>
            <p className="text-xs text-slate-500">New entry — {refNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-600 uppercase tracking-wide whitespace-nowrap">
            Transaction Date
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
          />
        </div>
      </div>

      {/* Lines table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '760px' }}>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-center px-3 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-8">#</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-48">Account</th>
                <th className="text-right px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-32">Debit</th>
                <th className="text-right px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-32">Credit</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Description</th>
                <th className="text-left px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500 w-36">Name</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lines.map((line, idx) => (
                <tr key={line.id} className="hover:bg-amber-50/30 transition-colors">
                  <td className="px-3 py-1.5 text-xs text-center text-slate-400 tabular-nums">{idx + 1}</td>
                  <td className="px-1 py-1.5">
                    <select
                      value={line.account}
                      onChange={(e) => updateLine(line.id, 'account', e.target.value)}
                      className={INPUT_CLS}
                    >
                      <option value="">— Select —</option>
                      {ACCOUNT_OPTIONS.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) => updateLine(line.id, 'debit', e.target.value)}
                        placeholder="0.00"
                        className={`${INPUT_CLS} pl-5 text-right`}
                      />
                    </div>
                  </td>
                  <td className="px-1 py-1.5">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 pointer-events-none">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) => updateLine(line.id, 'credit', e.target.value)}
                        placeholder="0.00"
                        className={`${INPUT_CLS} pl-5 text-right`}
                      />
                    </div>
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder="Description..."
                      className={INPUT_CLS}
                    />
                  </td>
                  <td className="px-1 py-1.5">
                    <input
                      type="text"
                      value={line.name}
                      onChange={(e) => updateLine(line.id, 'name', e.target.value)}
                      placeholder="Name..."
                      className={INPUT_CLS}
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <button
                      type="button"
                      onClick={() => deleteLine(line.id)}
                      disabled={lines.length <= 1}
                      className="w-7 h-7 rounded flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                {/* Buttons */}
                <td colSpan={2} className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setLines((p) => [...p, emptyLine()])}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                    >
                      <Plus size={13} /> Add Row
                    </button>
                    <span className="text-slate-300 select-none">|</span>
                    <button
                      type="button"
                      onClick={() => setLines(defaultLines())}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-600 transition-colors"
                    >
                      <Eraser size={13} /> Clear All Lines
                    </button>
                  </div>
                </td>
                {/* Debit total */}
                <td className="px-3 py-3 text-right">
                  <span className="block text-xs font-black text-slate-800 tabular-nums">{formatPHP(totalDebit)}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Debit</span>
                </td>
                {/* Credit total */}
                <td className="px-3 py-3 text-right">
                  <span className="block text-xs font-black text-slate-800 tabular-nums">{formatPHP(totalCredit)}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wide">Total Credit</span>
                </td>
                {/* Balance indicator */}
                <td colSpan={3} className="px-3 py-3">
                  {hasBalance && (
                    isBalanced ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                        <CheckCircle2 size={13} /> Balanced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
                        <AlertTriangle size={13} />
                        Unbalanced — Diff: {formatPHP(Math.abs(totalDebit - totalCredit))}
                      </span>
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Notes + Attachments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Additional notes or memo..."
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Attachments</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-amber-400 hover:bg-amber-50/30 transition-colors text-center"
          >
            <Upload size={20} className="text-slate-400 mx-auto mb-1.5" />
            <p className="text-xs text-slate-500 font-medium">Drop files or click to upload</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Receipts, invoices, PDF, images</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/*,.pdf,.xlsx,.xls,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          {attachments.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {attachments.map((file, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                >
                  <FileText size={11} className="text-slate-400 shrink-0" />
                  <span className="max-w-32 truncate">{file}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleSaveClose}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 active:scale-95 transition-all"
        >
          Save &amp; Close
        </button>
        <button
          type="button"
          onClick={handleSaveNew}
          className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
        >
          Save &amp; New
        </button>
      </div>
    </div>
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
