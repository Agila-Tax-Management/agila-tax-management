// src/components/compliance/PercentageTaxDetail.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Building2, FilePlus2, Copy, Check, Lock, ExternalLink,
  ChevronRight, FileText, Receipt, ClipboardList,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const YEAR_OPTIONS = [2024, 2025, 2026];

const QUARTER_LABELS = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];

const QUARTER_MONTHS = [
  [0, 1, 2],   // Q1: Jan, Feb, Mar
  [3, 4, 5],   // Q2: Apr, May, Jun
  [6, 7, 8],   // Q3: Jul, Aug, Sep
  [9, 10, 11], // Q4: Oct, Nov, Dec
];

const PT_RATE = 0.03;

const DOC_REQUIREMENT_LABELS = [
  'Filer Form (BIR 2551Q)',
  'Email Confirmation',
  'Payment Confirmation',
  'Bank Statement',
  'Email Submission',
  'Email Validation',
];

const PROCESS_STEP_DEFS = [
  { id: 'prepare',         role: 'Compliance Officer', label: 'Prepared By' },
  { id: 'verify',          role: 'Compliance TL',       label: 'Verified By' },
  { id: 'payment_process', role: 'Finance Officer',     label: 'Payment Process By' },
  { id: 'payment_approve', role: 'Finance Manager',     label: 'Payment Approved By' },
  { id: 'final_approve',   role: 'Executive / Admin',   label: 'Final Approval By' },
];

const FILING_EMAIL = 'records@agilacebu.com';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SalesRecord {
  id: string;
  receiptNo: string;
  invoiceType: string;
  date: string;
  customerName: string;
  account: string;
  grossSales: number;
  taxDue: number;
  documentUrl: string;
}

interface DocRequirement {
  id: string;
  label: string;
  url: string;
}

interface ProcessStep {
  id: string;
  role: string;
  label: string;
  acknowledgedBy: string;
  acknowledgedAt: string;
}

interface QuarterRecord {
  id: string;
  year: number;
  quarterIdx: number;
  quarterLabel: string;
  months: MonthRow[];
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  isAmended: boolean;
  paidByClient: number;
  zeroFiling: boolean;
  taxInfo: TaxInfo;
  docRequirements: DocRequirement[];
  processSteps: ProcessStep[];
}

interface MonthRow {
  monthIdx: number;
  monthName: string;
  grossSales: number;
  taxDue: number;
  salesFinalized: boolean;
  salesRecords: SalesRecord[];
}

interface TaxInfo {
  tin: string;
  rdo: string;
  lineOfBusiness: string;
  contactNumber: string;
  registeredAddress: string;
  zipCode: string;
  forYear: string;
  quarter: string;
  shortPeriodReturn: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  const abs = Math.abs(val);
  const formatted = abs.toLocaleString('en-PH', { minimumFractionDigits: 2 });
  return val < 0 ? `-₱${formatted}` : `₱${formatted}`;
}

function ordinalQuarter(idx: number): string {
  return ['1st', '2nd', '3rd', '4th'][idx] ?? `${idx + 1}th`;
}

// ─── Mock data builders ─────────────────────────────────────────────────────────

function buildMockSalesRecords(year: number, monthIdx: number): SalesRecord[] {
  const customers = [
    'Juan Dela Cruz',
    'Maria Santos',
    'Pedro Reyes',
    'Ana Gonzales',
    'Roberto Tan',
  ];
  const accounts = [
    'Professional Fees',
    'Service Revenue',
    'Consultation Fees',
    'Management Fees',
    'Commission Income',
  ];
  const types = ['Official Receipt', 'Service Invoice', 'Invoice'];
  const result: SalesRecord[] = [];
  for (let i = 0; i < 5; i++) {
    const gross = Math.round((8000 + i * 7200 + monthIdx * 900) * 100) / 100;
    const tax   = Math.round(gross * PT_RATE * 100) / 100;
    result.push({
      id:           `ptr-${year}-${monthIdx}-${i}`,
      receiptNo:    `OR-${year}-${String(monthIdx + 1).padStart(2, '0')}${String(i + 1).padStart(3, '0')}`,
      invoiceType:  types[i % 3]!,
      date:         `${String(monthIdx + 1).padStart(2, '0')}/${String(i * 5 + 3).padStart(2, '0')}/${year}`,
      customerName: customers[i % customers.length]!,
      account:      accounts[i % accounts.length]!,
      grossSales:   gross,
      taxDue:       tax,
      documentUrl:  i % 2 === 0 ? 'https://drive.google.com/file/example' : '',
    });
  }
  return result;
}

const MONTH_OVERRIDES_2026: Record<number, { salesMultiplier: number; salesFinalized: boolean }> = {
  0: { salesMultiplier: 1.0,  salesFinalized: true  },
  1: { salesMultiplier: 0.9,  salesFinalized: true  },
  2: { salesMultiplier: 0.85, salesFinalized: false },
  3: { salesMultiplier: 1.0,  salesFinalized: false },
};

function buildQuarterRecords(year: number, client: MockClientWithCompliance): QuarterRecord[] {
  const today    = new Date();
  const maxMonth = year < today.getFullYear() ? 12 : today.getMonth() + 1;

  return QUARTER_MONTHS.map((monthIndices, qi) => {
    const months: MonthRow[] = monthIndices
      .filter(mi => mi < maxMonth)
      .map(mi => {
        const isOld    = year < today.getFullYear() || mi < today.getMonth();
        const isCurrent = mi === today.getMonth() && year === today.getFullYear();
        const hasData  = isOld || isCurrent;

        const salesRecords = hasData ? buildMockSalesRecords(year, mi) : [];
        const override     = year === today.getFullYear() ? MONTH_OVERRIDES_2026[mi] : undefined;
        const multiplier   = override?.salesMultiplier ?? 1.0;

        const grossSales = Math.round(
          salesRecords.reduce((s, r) => s + r.grossSales, 0) * multiplier * 100,
        ) / 100;
        const taxDue = Math.round(grossSales * PT_RATE * 100) / 100;

        const defaultFinalized = year < today.getFullYear() ? true : isOld;
        const salesFinalized   = override ? override.salesFinalized : defaultFinalized;

        return {
          monthIdx: mi,
          monthName: MONTH_NAMES[mi]!,
          grossSales,
          taxDue,
          salesFinalized,
          salesRecords,
        };
      });

    const totalSales  = months.reduce((s, m) => s + m.grossSales, 0);
    const totalTaxDue = Math.round(totalSales * PT_RATE * 100) / 100;
    const isOld  = year < today.getFullYear() || monthIndices[2]! < today.getMonth();
    const isPaid = isOld && qi < 2;

    const docReqs = DOC_REQUIREMENT_LABELS.map((label, di) => ({
      id:    `pt-doc-${year}-q${qi}-${di}`,
      label,
      url:   isPaid ? `https://drive.google.com/file/pt-q${qi + 1}-${di}` : '',
    }));

    const processSteps = PROCESS_STEP_DEFS.map((def, si) => ({
      id:             `pt-step-${year}-q${qi}-${si}`,
      role:           def.role,
      label:          def.label,
      acknowledgedBy: isPaid
        ? ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Gonzales', 'CEO Office'][si]!
        : '',
      acknowledgedAt: isPaid
        ? `${year}-${String(monthIndices[2]! + 1).padStart(2, '0')}-20`
        : '',
    }));

    return {
      id:            `pt-${year}-q${qi + 1}`,
      year,
      quarterIdx:    qi,
      quarterLabel:  QUARTER_LABELS[qi]!,
      months,
      paymentStatus: isPaid ? 'Paid' : 'Unpaid',
      isAmended:     false,
      paidByClient:  isPaid ? totalTaxDue : 0,
      zeroFiling:    totalTaxDue === 0,
      taxInfo: {
        tin:               '123-456-789-000',
        rdo:               '082',
        lineOfBusiness:    client.businessName,
        contactNumber:     '(032) 123-4567',
        registeredAddress: client.businessAddress || 'Cebu City, Cebu',
        zipCode:           '6000',
        forYear:           String(year),
        quarter:           ordinalQuarter(qi),
        shortPeriodReturn: 'No',
      },
      docRequirements: docReqs,
      processSteps,
    };
  });
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'default' }: { pct: number; color?: 'default' | 'blue' }): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, pct));
  const bg    = color === 'blue' ? 'bg-blue-500'   : 'bg-slate-600';
  const track = color === 'blue' ? 'bg-blue-100'   : 'bg-slate-200';
  const text  = color === 'blue' ? 'text-blue-700' : 'text-slate-600';
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 h-1.5 rounded-full ${track} overflow-hidden`}>
        <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${clamped}%` }} />
      </div>
      <span className={`text-[10px] font-black tabular-nums ${text}`}>{clamped}%</span>
    </div>
  );
}

function CopyField({ label, value, copyable = true }: { label: string; value: string; copyable?: boolean }): React.ReactElement {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }
  return (
    <div className="flex items-start justify-between gap-2 py-2.5 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value || '—'}</p>
      </div>
      {copyable && value && (
        <button
          onClick={handleCopy}
          className="shrink-0 mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          title="Copy"
        >
          {copied ? <Check size={13} className="text-slate-700" /> : <Copy size={13} />}
        </button>
      )}
    </div>
  );
}

function DocUrlInput({ docId, recordId, onSave }: {
  docId: string;
  recordId: string;
  onSave: (recordId: string, docId: string, url: string) => void;
}): React.ReactElement {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Paste file URL..."
        className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 min-w-0"
      />
      <button
        disabled={!value.trim()}
        onClick={() => onSave(recordId, docId, value.trim())}
        className="shrink-0 h-8 px-3 rounded-lg bg-slate-800 text-xs font-bold text-white hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Save
      </button>
    </div>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────────

interface PercentageTaxDetailProps {
  client: MockClientWithCompliance;
  year: number;
  onYearChange: (y: number) => void;
}

export function PercentageTaxDetail({ client, year, onYearChange }: PercentageTaxDetailProps): React.ReactNode {
  // ── Quarter records ────────────────────────────────────────────────────────
  const initialQuarters = useMemo(() => buildQuarterRecords(year, client), [year, client]);
  const [quarters, setQuarters] = useState<QuarterRecord[]>(initialQuarters);

  // Sync when year changes
  const [prevYear, setPrevYear] = useState(year);
  if (prevYear !== year) {
    setPrevYear(year);
    setQuarters(buildQuarterRecords(year, client));
  }

  // ── Sales Receipt Modal ────────────────────────────────────────────────────
  const [salesModalOpen, setSalesModalOpen]   = useState(false);
  const [salesModalMonth, setSalesModalMonth] = useState<MonthRow | null>(null);

  // ── PT Process Modal ───────────────────────────────────────────────────────
  const [ptModalOpen, setPtModalOpen]           = useState(false);
  const [selectedQuarter, setSelectedQuarter]   = useState<QuarterRecord | null>(null);

  // ── Open Case Modal ────────────────────────────────────────────────────────
  const [openCaseOpen, setOpenCaseOpen] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────
  function getFilingPct(q: QuarterRecord): number {
    const total = q.docRequirements.length;
    if (total === 0) return 0;
    return Math.round((q.docRequirements.filter(d => d.url.trim() !== '').length / total) * 100);
  }

  function getProcessPct(q: QuarterRecord): number {
    const total = q.processSteps.length;
    if (total === 0) return 0;
    return Math.round((q.processSteps.filter(s => s.acknowledgedBy !== '').length / total) * 100);
  }

  function openSalesModal(month: MonthRow) {
    setSalesModalMonth(month);
    setSalesModalOpen(true);
  }

  function openPTModal(q: QuarterRecord) {
    setSelectedQuarter(q);
    setPtModalOpen(true);
  }

  function saveDocUrl(quarterId: string, docId: string, url: string) {
    setQuarters(prev => prev.map(q => {
      if (q.id !== quarterId) return q;
      const updated = { ...q, docRequirements: q.docRequirements.map(d => d.id === docId ? { ...d, url } : d) };
      if (selectedQuarter?.id === quarterId) setSelectedQuarter(updated);
      return updated;
    }));
  }

  function acknowledgeStep(quarterId: string, stepId: string) {
    setQuarters(prev => prev.map(q => {
      if (q.id !== quarterId) return q;
      if (getFilingPct(q) < 100) return q;
      const updated = {
        ...q,
        processSteps: q.processSteps.map(s =>
          s.id === stepId
            ? { ...s, acknowledgedBy: 'Current User', acknowledgedAt: new Date().toISOString().slice(0, 10) }
            : s,
        ),
      };
      if (selectedQuarter?.id === quarterId) setSelectedQuarter(updated);
      return updated;
    }));
  }

  function toggleAmended(quarterId: string) {
    setQuarters(prev => prev.map(q =>
      q.id === quarterId ? { ...q, isAmended: !q.isAmended } : q,
    ));
    if (selectedQuarter?.id === quarterId) {
      setSelectedQuarter(prev => prev ? { ...prev, isAmended: !prev.isAmended } : prev);
    }
  }

  function toggleZeroFiling(quarterId: string) {
    setQuarters(prev => prev.map(q =>
      q.id === quarterId ? { ...q, zeroFiling: !q.zeroFiling } : q,
    ));
    if (selectedQuarter?.id === quarterId) {
      setSelectedQuarter(prev => prev ? { ...prev, zeroFiling: !prev.zeroFiling } : prev);
    }
  }

  function cyclePaymentStatus(quarterId: string) {
    const cycle: QuarterRecord['paymentStatus'][] = ['Unpaid', 'Partial', 'Paid'];
    setQuarters(prev => prev.map(q => {
      if (q.id !== quarterId) return q;
      const next    = cycle[(cycle.indexOf(q.paymentStatus) + 1) % cycle.length]!;
      const updated = { ...q, paymentStatus: next };
      if (selectedQuarter?.id === quarterId) setSelectedQuarter(updated);
      return updated;
    }));
  }

  // ── Grand totals ───────────────────────────────────────────────────────────
  const grandSales  = quarters.reduce((s, q) => s + q.months.reduce((ms, m) => ms + m.grossSales, 0), 0);
  const grandTaxDue = quarters.reduce((s, q) => s + q.months.reduce((ms, m) => ms + m.taxDue,     0), 0);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* ── Header card ── */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">
                {client.businessName} ({client.clientNo})
              </p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Percentage Tax</h1>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={year}
              onChange={e => onYearChange(Number(e.target.value))}
              className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400"
            >
              {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setOpenCaseOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
            >
              <FilePlus2 size={15} /> File Open Case
            </button>
          </div>
        </div>
      </Card>

      {/* ── Quarterly Table ── */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Percentage Tax Working Paper — {year}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '800px' }}>
            <thead>
              <tr className="border-b border-slate-200 bg-white">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-40">Coverage</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Sales</th>
                <th className="text-right px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Tax Due (3%)</th>
                <th className="text-center px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-36">Sales Finalized</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-40">Filing Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-40">Process Status</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q, qi) => {
                const qSales  = q.months.reduce((s, m) => s + m.grossSales, 0);
                const qTaxDue = q.months.reduce((s, m) => s + m.taxDue,     0);

                const filingPct  = getFilingPct(q);
                const processPct = getProcessPct(q);

                if (q.months.length === 0) return null;

                return (
                  <React.Fragment key={q.id}>
                    {/* Month rows */}
                    {q.months.map((month, mi) => (
                      <tr
                        key={`${q.id}-m${month.monthIdx}`}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {month.monthName}
                        </td>
                        {/* Sales — clickable */}
                        <td className="px-5 py-3.5 text-right">
                          {month.grossSales > 0 ? (
                            <button
                              onClick={() => openSalesModal(month)}
                              className="group inline-flex items-center gap-1.5 font-mono text-sm font-semibold text-slate-800 hover:text-slate-900 underline underline-offset-2 decoration-dotted transition-colors"
                            >
                              {fmtPHP(month.grossSales)}
                              <Receipt size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          ) : (
                            <span className="font-mono text-sm text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-sm font-semibold text-slate-800">
                          {month.taxDue > 0 ? fmtPHP(month.taxDue) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            month.salesFinalized
                              ? 'bg-slate-800 text-white'
                              : month.grossSales > 0
                              ? 'bg-slate-200 text-slate-600'
                              : 'bg-slate-100 text-slate-400'
                          }`}>
                            {month.salesFinalized ? 'Finalized' : month.grossSales > 0 ? 'Pending' : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 w-40">
                          {mi === 0 && <ProgressBar pct={filingPct} color="default" />}
                        </td>
                        <td className="px-5 py-3.5 w-40">
                          {mi === 0 && (
                            <button
                              onClick={() => openPTModal(q)}
                              className="w-full group"
                            >
                              <div className="flex items-center gap-1">
                                <div className="flex-1">
                                  <ProgressBar pct={processPct} color="blue" />
                                </div>
                                <ChevronRight size={12} className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                              </div>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}

                    {/* Quarter Subtotal row */}
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <td className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {q.quarterLabel} Total
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs font-black text-slate-800">
                        {fmtPHP(qSales)}
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono text-xs font-black text-slate-800">
                        {fmtPHP(qTaxDue)}
                      </td>
                      <td colSpan={3} />
                    </tr>

                    {/* Total Payable Tax row */}
                    <tr className="border-b-2 border-slate-300 bg-slate-800">
                      <td className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-200">
                        Total Payable Tax
                      </td>
                      <td />
                      <td className="px-5 py-3 text-right font-mono text-sm font-black text-white">
                        {fmtPHP(qTaxDue)}
                      </td>
                      <td colSpan={3} />
                    </tr>

                    {/* Spacer between quarters */}
                    {qi < quarters.length - 1 && quarters[qi + 1]!.months.length > 0 && (
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <td colSpan={6} className="h-3" />
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Grand Totals */}
              <tr className="bg-slate-900 border-t-2 border-slate-400">
                <td className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-300">
                  Grand Total
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm font-black text-white">
                  {fmtPHP(grandSales)}
                </td>
                <td className="px-5 py-3.5 text-right font-mono text-sm font-black text-white">
                  {fmtPHP(grandTaxDue)}
                </td>
                <td colSpan={3} />
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1 — Sales Receipt Detail
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={salesModalOpen}
        onClose={() => setSalesModalOpen(false)}
        title=""
        size="3xl"
      >
        {salesModalMonth && (
          <div className="overflow-y-auto max-h-[80vh]">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Receipt size={18} className="text-slate-500" />
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Sales Receipts — {salesModalMonth.monthName} {year}
                </h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                Official receipts that make up the gross sales for this month.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm" style={{ minWidth: '800px' }}>
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {['Receipt #', 'Invoice Type', 'Date', 'Customer Name', 'Account', 'Gross Sales', 'Tax Due (3%)', 'Document'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesModalMonth.salesRecords.map(rec => (
                    <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{rec.receiptNo}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{rec.invoiceType}</td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{rec.date}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800 whitespace-nowrap">{rec.customerName}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{rec.account}</td>
                      <td className="px-4 py-3 font-mono text-sm font-semibold text-slate-800 text-right whitespace-nowrap">{fmtPHP(rec.grossSales)}</td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-right whitespace-nowrap text-slate-800">{fmtPHP(rec.taxDue)}</td>
                      <td className="px-4 py-3">
                        {rec.documentUrl ? (
                          <a
                            href={rec.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                          >
                            <ExternalLink size={11} /> Open
                          </a>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-400">
                            <FileText size={11} /> No File
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300">
                    <td colSpan={5} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-600">Total</td>
                    <td className="px-4 py-3 font-mono text-sm font-black text-slate-900 text-right">
                      {fmtPHP(salesModalMonth.salesRecords.reduce((s, r) => s + r.grossSales, 0))}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm font-black text-slate-900 text-right">
                      {fmtPHP(salesModalMonth.taxDue)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
              <Button variant="outline" onClick={() => setSalesModalOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2 — Percentage Tax Process Modal
      ══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={ptModalOpen}
        onClose={() => setPtModalOpen(false)}
        title=""
        size="3xl"
      >
        {selectedQuarter && (() => {
          const filingPct      = getFilingPct(selectedQuarter);
          const processPct     = getProcessPct(selectedQuarter);
          const filingDone     = filingPct === 100;
          const completedSteps = selectedQuarter.processSteps.filter(s => s.acknowledgedBy !== '').length;
          const nextStepIdx    = completedSteps < selectedQuarter.processSteps.length ? completedSteps : -1;

          const qTaxDue = selectedQuarter.months.reduce((s, m) => s + m.taxDue, 0);

          return (
            <div className="overflow-y-auto max-h-[80vh]">
              {/* Modal sub-header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Percentage Tax</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  For the <strong className="text-slate-800">{ordinalQuarter(selectedQuarter.quarterIdx)} Quarter</strong> of{' '}
                  <strong className="text-slate-800">{selectedQuarter.year}</strong>
                </p>
              </div>

              <div className="px-6 py-4 space-y-5">

                {/* ── Summary row ── */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Tax Due</p>
                    <p className="text-lg font-black text-slate-900">{fmtPHP(qTaxDue)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Gross Sales × 3%</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-400 mb-1">Paid by Client</p>
                    <p className="text-lg font-black text-slate-800">{fmtPHP(selectedQuarter.paidByClient)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Zero Filing</p>
                      <button
                        onClick={() => toggleZeroFiling(selectedQuarter.id)}
                        className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                          selectedQuarter.zeroFiling
                            ? 'bg-slate-700 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {selectedQuarter.zeroFiling ? 'Yes' : 'No'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Payment Status</p>
                      <button
                        onClick={() => cyclePaymentStatus(selectedQuarter.id)}
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide cursor-pointer transition-colors ${
                          selectedQuarter.paymentStatus === 'Paid'
                            ? 'bg-slate-800 text-white hover:bg-slate-900'
                            : selectedQuarter.paymentStatus === 'Partial'
                            ? 'bg-slate-400 text-white hover:bg-slate-500'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                      >
                        {selectedQuarter.paymentStatus}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── Filing Information ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Filing Information</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amended Return:</span>
                      <button
                        onClick={() => toggleAmended(selectedQuarter.id)}
                        className={`text-[10px] font-black uppercase tracking-wide px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                          selectedQuarter.isAmended
                            ? 'bg-slate-700 text-white hover:bg-slate-800'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {selectedQuarter.isAmended ? 'YES' : 'No'}
                      </button>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
                    <CopyField label="For the Year Ended" value={`December 31, ${selectedQuarter.taxInfo.forYear}`} copyable={false} />
                    <CopyField label="Quarter" value={selectedQuarter.taxInfo.quarter} copyable={false} />
                    <CopyField label="Amended Return" value={selectedQuarter.isAmended ? 'Yes' : 'No'} copyable={false} />
                    <CopyField label="Short Period Return" value={selectedQuarter.taxInfo.shortPeriodReturn} copyable={false} />
                    <CopyField label="Tax Identification Number (TIN)" value={selectedQuarter.taxInfo.tin} copyable={false} />
                    <CopyField label="RDO" value={selectedQuarter.taxInfo.rdo} />
                    <CopyField label="Line of Business" value={selectedQuarter.taxInfo.lineOfBusiness} />
                    <CopyField label="Contact Number" value={selectedQuarter.taxInfo.contactNumber} />
                    <CopyField label="Registered Address" value={selectedQuarter.taxInfo.registeredAddress} />
                    <CopyField label="Zip Code" value={selectedQuarter.taxInfo.zipCode} />
                    <CopyField label="Filing Email Address" value={FILING_EMAIL} />
                  </div>
                </div>

                {/* ── Documentary Requirements ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Documentary Requirements</p>
                    <ProgressBar pct={filingPct} color="default" />
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Requirement</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-500">File / URL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedQuarter.docRequirements.map(doc => (
                          <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-700 text-sm">{doc.label}</td>
                            <td className="px-4 py-3">
                              {doc.url ? (
                                <a
                                  href={doc.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
                                >
                                  <ExternalLink size={11} /> Open File
                                </a>
                              ) : (
                                <DocUrlInput
                                  docId={doc.id}
                                  recordId={selectedQuarter.id}
                                  onSave={saveDocUrl}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Process Flow ── */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Process Flow</p>
                    <ProgressBar pct={processPct} color="blue" />
                  </div>
                  {!filingDone && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-slate-100 border border-slate-300 px-4 py-2.5">
                      <Lock size={13} className="text-slate-500 shrink-0" />
                      <p className="text-xs font-semibold text-slate-600">
                        Complete all documentary requirements (Filing Status 100%) before acknowledging process steps.
                      </p>
                    </div>
                  )}
                  <div className="space-y-0">
                    {selectedQuarter.processSteps.map((step, idx) => {
                      const done     = step.acknowledgedBy !== '';
                      const isNext   = idx === nextStepIdx;
                      const isLocked = !done && !isNext;
                      return (
                        <div key={step.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                              done
                                ? 'bg-blue-600 border-blue-600'
                                : isNext && filingDone
                                ? 'bg-white border-blue-400'
                                : 'bg-white border-slate-200'
                            }`}>
                              {done
                                ? <Check size={14} className="text-white" />
                                : <span className={`text-xs font-black ${isNext && filingDone ? 'text-blue-500' : 'text-slate-300'}`}>{idx + 1}</span>
                              }
                            </div>
                            {idx < selectedQuarter.processSteps.length - 1 && (
                              <div className={`w-0.5 flex-1 min-h-7 ${done ? 'bg-blue-300' : 'bg-slate-200'}`} />
                            )}
                          </div>
                          <div className={`flex-1 pb-5 ${idx === selectedQuarter.processSteps.length - 1 ? 'pb-0' : ''}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`text-xs font-black uppercase tracking-wide ${done ? 'text-blue-700' : isNext && filingDone ? 'text-slate-700' : 'text-slate-300'}`}>
                                  {step.label}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${done ? 'text-slate-500' : isNext && filingDone ? 'text-slate-400' : 'text-slate-300'}`}>
                                  {step.role}
                                </p>
                                {done && (
                                  <p className="text-[10px] text-blue-600 font-semibold mt-1">
                                    {step.acknowledgedBy} · {step.acknowledgedAt}
                                  </p>
                                )}
                              </div>
                              {isNext && (
                                <button
                                  disabled={!filingDone}
                                  onClick={() => acknowledgeStep(selectedQuarter.id, step.id)}
                                  className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                >
                                  <ClipboardList size={11} /> Acknowledge
                                </button>
                              )}
                              {isLocked && (
                                <span className="shrink-0 inline-flex items-center gap-1 text-[10px] text-slate-300 font-semibold">
                                  <Lock size={10} /> Locked
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 3 — File Open Case
      ══════════════════════════════════════════════════════════════ */}
      <Modal isOpen={openCaseOpen} onClose={() => setOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — Percentage Tax.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option>BIR — Deficiency Percentage Tax</option>
                <option>BIR — Late Filing</option>
                <option>BIR — Non-Remittance</option>
                <option>BIR — Assessment</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Quarter</label>
            <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400">
              {QUARTER_LABELS.map(ql => <option key={ql}>{ql}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Notes</label>
            <textarea
              rows={3}
              placeholder="Describe the case..."
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setOpenCaseOpen(false)}>Cancel</Button>
            <button
              className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
              onClick={() => setOpenCaseOpen(false)}
            >
              File Case
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
