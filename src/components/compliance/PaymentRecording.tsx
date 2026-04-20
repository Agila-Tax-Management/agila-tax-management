// src/components/compliance/PaymentRecording.tsx
'use client';

import React, { useState, useRef, useId } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import {
  CalendarDays, ChevronDown, Upload, FileText, X, Plus, Save,
} from 'lucide-react';

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAYMENT_METHODS = [
  'Cash',
  'GCash',
  'Maya',
  'Bank Transfer',
  'Check',
  'Credit Card',
] as const;

const PAYMENT_CATEGORIES = [
  'Subscription Fee',
  'Expanded Withholding Tax',
  'Compensation Withholding Tax',
  'Income Tax',
  'Percentage Tax',
  'Value-Added Tax',
  'SSS',
  'PhilHealth',
  'Pag-IBIG',
  'Annual Registration Fee',
  'Other',
] as const;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BreakdownRow {
  id:       string;
  category: string;
  month:    string;
  year:     number;
  amount:   string; // raw input string
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function parsePeso(raw: string): number {
  const n = parseFloat(raw.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function fmtPHP(n: number): string {
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let rowCounter = 0;
function newRowId(): string {
  rowCounter += 1;
  return `row-${rowCounter}`;
}

function newRow(): BreakdownRow {
  const today = new Date();
  return {
    id:       newRowId(),
    category: PAYMENT_CATEGORIES[0],
    month:    MONTHS[today.getMonth()],
    year:     CURRENT_YEAR,
    amount:   '',
  };
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function PaymentRecording(): React.ReactNode {
  const dateId   = useId();
  const methodId = useId();

  // Box 1 state
  const [payDate,   setPayDate]   = useState('');
  const [method,    setMethod]    = useState('');
  const [totalAmt,  setTotalAmt]  = useState('');
  const [receipt,   setReceipt]   = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Box 2 state
  const [rows, setRows] = useState<BreakdownRow[]>([newRow()]);

  // ── Derived values ────────────────────────────────────────────────────────────
  const totalPaid       = parsePeso(totalAmt);
  const breakdownTotal  = rows.reduce((s, r) => s + parsePeso(r.amount), 0);
  const variance        = totalPaid - breakdownTotal;
  const isBalanced      = totalPaid > 0 && Math.abs(variance) < 0.005;

  // ── Handlers ──────────────────────────────────────────────────────────────────

  function handleAmountInput(raw: string): void {
    // Allow digits, single decimal point only
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setTotalAmt(cleaned);
  }

  function handleRowAmountInput(id: string, raw: string): void {
    const cleaned = raw.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
    setRows(prev => prev.map(r => r.id === id ? { ...r, amount: cleaned } : r));
  }

  function handleRowField(id: string, field: keyof BreakdownRow, value: string | number): void {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  }

  function addRow(): void {
    setRows(prev => [...prev, newRow()]);
  }

  function removeRow(id: string): void {
    setRows(prev => prev.filter(r => r.id !== id));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const file = e.target.files?.[0] ?? null;
    setReceipt(file);
    // Reset input so same file can be re-selected if removed
    e.target.value = '';
  }

  function handleSave(): void {
    // Front-end only — log to console until API is wired
    console.log('Payment Recording Saved', {
      date:      payDate,
      method,
      totalAmt:  totalPaid,
      receipt:   receipt?.name ?? null,
      breakdown: rows.map(r => ({
        category: r.category,
        period:   `${r.month} ${r.year}`,
        amount:   parsePeso(r.amount),
      })),
    });
    // Reset form
    setPayDate('');
    setMethod('');
    setTotalAmt('');
    setReceipt(null);
    setRows([newRow()]);
  }

  // ── Variance display ──────────────────────────────────────────────────────────

  const varianceDisplay = (() => {
    if (totalPaid === 0 && breakdownTotal === 0) return { text: '—', color: 'text-slate-400' };
    if (isBalanced) return { text: `₱${fmtPHP(0)}`, color: 'text-emerald-600' };
    const sign = variance > 0 ? '+' : '';
    return { text: `${sign}₱${fmtPHP(variance)}`, color: 'text-red-600' };
  })();

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          Payment Recording System
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Record client payments and allocate amounts across billing categories.
        </p>
      </div>

      {/* ── Box 1: Payment Details ──────────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Payment Details
          </h3>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">

          {/* Date of Payment */}
          <div className="space-y-1.5">
            <label htmlFor={dateId} className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Date of Payment
            </label>
            <div className="relative">
              <CalendarDays
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                id={dateId}
                type="date"
                className="w-full h-10 pl-9 pr-3 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                value={payDate}
                onChange={e => setPayDate(e.target.value)}
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label htmlFor={methodId} className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="relative">
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <select
                id={methodId}
                className="w-full h-10 pl-3 pr-8 border border-slate-200 rounded-xl bg-slate-50 text-sm text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option value="">Select method...</option>
                {PAYMENT_METHODS.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Payment Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500 select-none">
                ₱
              </span>
              <Input
                className="pl-7 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm"
                placeholder="0.00"
                inputMode="decimal"
                value={totalAmt}
                onChange={e => handleAmountInput(e.target.value)}
              />
            </div>
            {/* Variance */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Variance:
              </span>
              <span className={`text-sm font-black ${varianceDisplay.color}`}>
                {varianceDisplay.text}
              </span>
            </div>
          </div>

          {/* Payment Confirmation (Receipt Upload) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Payment Confirmation
            </label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-10 flex items-center justify-center gap-2 border border-dashed border-slate-300 rounded-xl bg-slate-50 text-sm text-slate-500 font-medium hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-700 transition-colors"
            >
              <Upload size={14} />
              Upload Receipt
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            {/* File label */}
            <div className="flex items-center gap-2 min-h-5">
              {receipt ? (
                <>
                  <FileText size={12} className="text-emerald-600 shrink-0" />
                  <span className="text-xs text-slate-700 truncate flex-1">{receipt.name}</span>
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                    aria-label="Remove file"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <span className="text-[11px] text-slate-400 italic">No uploaded file</span>
              )}
            </div>
          </div>

        </div>
      </Card>

      {/* ── Box 2: Breakdown ────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            Breakdown
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ minWidth: '560px' }}>
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Payment Category
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Applicable Month
                </th>
                <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Payment Amount
                </th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.id} className="border-b border-slate-50 last:border-0">

                  {/* Category */}
                  <td className="px-4 py-2.5">
                    <div className="relative">
                      <ChevronDown
                        size={12}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <select
                        aria-label={`Category row ${idx + 1}`}
                        className="w-full h-9 pl-3 pr-7 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                        value={row.category}
                        onChange={e => handleRowField(row.id, 'category', e.target.value)}
                      >
                        {PAYMENT_CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  {/* Applicable Month */}
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1.5">
                      {/* Month */}
                      <div className="relative flex-1">
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <select
                          aria-label={`Month row ${idx + 1}`}
                          className="w-full h-9 pl-3 pr-6 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          value={row.month}
                          onChange={e => handleRowField(row.id, 'month', e.target.value)}
                        >
                          {MONTHS.map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                      {/* Year */}
                      <div className="relative w-24">
                        <ChevronDown
                          size={12}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                        />
                        <select
                          aria-label={`Year row ${idx + 1}`}
                          className="w-full h-9 pl-3 pr-6 border border-slate-200 rounded-lg bg-white text-sm text-slate-800 appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                          value={row.year}
                          onChange={e => handleRowField(row.id, 'year', Number(e.target.value))}
                        >
                          {YEAR_OPTIONS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-2.5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 select-none">
                        ₱
                      </span>
                      <Input
                        className="pl-6 h-9 border-slate-200 rounded-lg text-sm"
                        placeholder="0.00"
                        inputMode="decimal"
                        value={row.amount}
                        onChange={e => handleRowAmountInput(row.id, e.target.value)}
                      />
                    </div>
                  </td>

                  {/* Remove row */}
                  <td className="px-2 py-2.5 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        aria-label="Remove row"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer: Add Category + Save */}
        <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
          <Button
            variant="outline"
            className="h-9 text-xs gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            onClick={addRow}
          >
            <Plus size={13} /> Add Category
          </Button>

          <div className="flex items-center gap-4">
            {/* Totals summary */}
            <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
              <span>
                Total: <span className="font-black text-slate-800">₱{fmtPHP(breakdownTotal)}</span>
              </span>
              <span className={`font-black ${isBalanced ? 'text-emerald-600' : 'text-red-500'}`}>
                {isBalanced ? '✓ Balanced' : `Variance: ₱${fmtPHP(Math.abs(variance))}`}
              </span>
            </div>

            <Button
              className={`h-9 text-xs gap-1.5 ${
                isBalanced
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              disabled={!isBalanced}
              onClick={isBalanced ? handleSave : undefined}
            >
              <Save size={13} /> Save
            </Button>
          </div>
        </div>
      </Card>

    </div>
  );
}
