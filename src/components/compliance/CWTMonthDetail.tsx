// src/components/compliance/CWTMonthDetail.tsx
'use client';

import React, { useState, useRef } from 'react';
import {
  ArrowLeft, FilePlus2, Building2, Upload, Copy, Check,
  ExternalLink, Lock, ClipboardList, ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PayrollRow {
  id: string;
  date: string;
  basicPay: number;
  overtime: number;
  late: number;
  grossPay: number;
  sss: number;
  phic: number;
  hdmf: number;
  netPay: number;
  taxableIncome: number;
  wht: number;
  period: string;
  status: 'Processed' | 'Pending';
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

interface EmployeeRecord {
  id: string;
  name: string;
  position: string;
  grossPay: number;
  withholding: number;
  payrollRows: PayrollRow[];
  docRequirements: DocRequirement[];
  processSteps: ProcessStep[];
  paidAmount: number;
  zeroFiling: boolean;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
}

interface TaxInfo {
  tin: string;
  rdoCode: string;
  withholdingAgentName: string;
  registeredAddress: string;
  zipCode: string;
  contactNumber: string;
  category: string;
  filingEmail: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const FILING_DOC_LABELS = [
  'Filed Form (1601-C)',
  'Email Confirmation',
  'Payment Confirmation',
];

const PROCESS_STEP_DEFS = [
  { id: 'prepare',         role: 'Compliance Officer', label: 'Prepared By' },
  { id: 'verify',          role: 'Compliance TL',      label: 'Verified By' },
  { id: 'payment_proceed', role: 'Finance Officer',    label: 'Payment Processed By' },
  { id: 'payment_approve', role: 'Finance TL',         label: 'Payment Approved By' },
  { id: 'final_approve',   role: 'Executive / Admin',  label: 'Final Approved By' },
];

// ─── Monthly Tax Table ─────────────────────────────────────────────────────────
// Based on BIR monthly withholding tax table

interface TaxBracket {
  min: number;
  max: number;
  exempt: number;
  rate: number;
  fixed: number;
}

const TAX_TABLE: TaxBracket[] = [
  { min: 0,          max: 20833.33,  exempt: 0,         rate: 0,    fixed: 0 },
  { min: 20833.33,   max: 33333.33,  exempt: 20833.33,  rate: 0.15, fixed: 0 },
  { min: 33333.33,   max: 66666.67,  exempt: 33333.33,  rate: 0.20, fixed: 1875.00 },
  { min: 66666.67,   max: 166666.67, exempt: 66666.67,  rate: 0.25, fixed: 8541.67 },
  { min: 166666.67,  max: 666666.67, exempt: 166666.67, rate: 0.30, fixed: 33541.67 },
  { min: 666666.67,  max: Infinity,  exempt: 666666.67, rate: 0.35, fixed: 183541.67 },
];

function computeMonthlyTax(taxableIncome: number): { bracket: TaxBracket; finalTaxable: number; taxDue: number } {
  const bracket = TAX_TABLE.find(b => taxableIncome > b.min && taxableIncome <= b.max)
    ?? TAX_TABLE[0];
  const finalTaxable = Math.max(0, taxableIncome - bracket.exempt);
  const taxDue = finalTaxable * bracket.rate + bracket.fixed;
  return { bracket, finalTaxable, taxDue };
}

// ─── Mock data helpers ─────────────────────────────────────────────────────────

const MONTH_LIST = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// Returns all weekday (Mon–Fri) Date objects for the given year/month (0-indexed).
function getWorkdays(year: number, monthIdx: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, monthIdx, d);
    const dow = date.getDay();
    if (dow !== 0 && dow !== 6) days.push(date);
  }
  return days;
}

// Completion levels per employee index (0 = all done, 1 = payroll done / filing partial,
// 2 = payroll partial / filing minimal, 3 = nothing started yet)
const ACK_NAMES = ['Juan Dela Cruz', 'Maria Santos', 'Pedro Reyes', 'Ana Gonzales', 'CEO Office'];

function buildMockEmployees(coverageMonth: string, isOldMonth: boolean): EmployeeRecord[] {
  const BASE_EMPLOYEES = [
    { id: 'emp-1', name: 'Juan Dela Cruz',  position: 'Operations Manager', basicPay: 35000 },
    { id: 'emp-2', name: 'Maria Santos',    position: 'Compliance Officer', basicPay: 28000 },
    { id: 'emp-3', name: 'Pedro Reyes',     position: 'Finance Officer',    basicPay: 25000 },
    { id: 'emp-4', name: 'Ana Gonzales',    position: 'Admin Assistant',    basicPay: 20000 },
  ];

  const [monthName, yearStr] = coverageMonth.split(' ');
  const mIdx  = MONTH_LIST.indexOf(monthName ?? '');
  const yr    = parseInt(yearStr ?? '2026', 10);
  const mStr  = String(mIdx + 1).padStart(2, '0');

  const allWorkdays  = getWorkdays(yr, mIdx);
  const firstHalf    = allWorkdays.filter(d => d.getDate() <= 15);
  const secondHalf   = allWorkdays.filter(d => d.getDate() > 15);

  return BASE_EMPLOYEES.map((emp, empIdx) => {
    const sss  = Math.min(emp.basicPay * 0.045, 1125);
    const phic = parseFloat((emp.basicPay * 0.05 / 2).toFixed(2));
    const hdmf = Math.min(emp.basicPay * 0.02, 200);
    const grossPay    = emp.basicPay;
    const taxableBase = grossPay - sss - phic - hdmf;
    const { taxDue }  = computeMonthlyTax(taxableBase);

    // Old months: everyone is fully complete.
    // Current / future months: stagger completion by employee index.
    const level = isOldMonth ? 0 : empIdx;
    //  0 → fully complete  (Juan)   payroll 100% · docs 3/3 · steps 5/5
    //  1 → payroll done    (Maria)  payroll 100% · docs 2/3 · steps 2/5
    //  2 → payroll partial (Pedro)  payroll  50% · docs 1/3 · steps 0/5
    //  3 → not started     (Ana)    payroll   0% · docs 0/3 · steps 0/5

    const totalWorkdays = allWorkdays.length || 1;
    const dailyPay = parseFloat((emp.basicPay / totalWorkdays).toFixed(2));

    // Builds one PayrollRow per working day.
    // Deductions (SSS/PHIC/HDMF) land only on the last day of each half so
    // the computation boxes still sum up to the correct monthly totals.
    function buildDailyRows(
      days: Date[],
      half: '1st Half' | '2nd Half',
      halfSss: number,
      halfPhic: number,
      halfHdmf: number,
      rowStatus: 'Processed' | 'Pending',
    ): PayrollRow[] {
      return days.map((date, di) => {
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateLabel = `${mStr}-${dayStr}`;
        const isLast   = di === days.length - 1;
        // Occasional overtime on Fridays (varies by employee so not every row looks the same)
        const isFriday = date.getDay() === 5;
        const overtime = isFriday && date.getDate() % (empIdx + 2) === 0 ? 250 : 0;
        // Occasional late on non-Fridays
        const late     = !isFriday && date.getDate() % (empIdx + 4) === 1 ? 50 : 0;
        const gross    = parseFloat((dailyPay + overtime - late).toFixed(2));
        const rowSss   = isLast ? halfSss  : 0;
        const rowPhic  = isLast ? halfPhic : 0;
        const rowHdmf  = isLast ? halfHdmf : 0;
        return {
          id: `${emp.id}-${half.replace(' ', '')}-${di}`,
          date: dateLabel,
          basicPay: dailyPay,
          overtime,
          late,
          grossPay: gross,
          sss:  rowSss,
          phic: rowPhic,
          hdmf: rowHdmf,
          netPay: parseFloat((gross - rowSss - rowPhic - rowHdmf).toFixed(2)),
          taxableIncome: 0,
          wht: 0,
          period: half,
          status: rowStatus,
        };
      });
    }

    // ── Payroll rows ──────────────────────────────────────────────────────
    let payrollRows: PayrollRow[] = [];

    if (level === 0 || level === 1) {
      payrollRows = [
        ...buildDailyRows(firstHalf,  '1st Half', sss / 2, phic / 2, hdmf / 2, 'Processed'),
        ...buildDailyRows(secondHalf, '2nd Half', sss / 2, phic / 2, hdmf / 2, 'Processed'),
      ];
    } else if (level === 2) {
      payrollRows = [
        ...buildDailyRows(firstHalf,  '1st Half', sss / 2, phic / 2, hdmf / 2, 'Processed'),
        ...buildDailyRows(secondHalf, '2nd Half', 0, 0, 0,                      'Pending'),
      ];
    }
    // level 3 → no rows

    // ── Documentary requirements ──────────────────────────────────────────
    const docsCount = level === 0 ? 3 : level === 1 ? 2 : level === 2 ? 1 : 0;
    const docRequirements = FILING_DOC_LABELS.map((label, di) => ({
      id: `doc-${emp.id}-${di}`,
      label,
      url: di < docsCount
        ? `https://drive.google.com/file/cwt-filing-${emp.id}-${di}`
        : '',
    }));

    // ── Process steps ─────────────────────────────────────────────────────
    const stepsCount = level === 0 ? 5 : level === 1 ? 2 : 0;
    const processSteps = PROCESS_STEP_DEFS.map((def, si) => ({
      id: `step-${emp.id}-${si}`,
      role: def.role,
      label: def.label,
      acknowledgedBy: si < stepsCount ? (ACK_NAMES[si] ?? '') : '',
      acknowledgedAt: si < stepsCount ? `${yr}-03-15` : '',
    }));

    const fullyDone = level === 0;
    return {
      id: emp.id,
      name: emp.name,
      position: emp.position,
      grossPay,
      withholding: parseFloat(taxDue.toFixed(2)),
      payrollRows,
      docRequirements,
      processSteps,
      paidAmount: fullyDone ? parseFloat(taxDue.toFixed(2)) : 0,
      zeroFiling: taxDue === 0,
      paymentStatus: fullyDone ? 'Paid' : 'Unpaid',
    };
  });
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function fmtPHP(val: number): string {
  return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;
}

function getPayrollPct(emp: EmployeeRecord): number {
  if (emp.payrollRows.length === 0) return 0;
  const processed = emp.payrollRows.filter(r => r.status === 'Processed').length;
  return Math.round((processed / emp.payrollRows.length) * 100);
}

function getFilingDocPct(emp: EmployeeRecord): number {
  const total = emp.docRequirements.length;
  if (total === 0) return 0;
  return Math.round((emp.docRequirements.filter(d => d.url.trim() !== '').length / total) * 100);
}

function getFilingProcessPct(emp: EmployeeRecord): number {
  const total = emp.processSteps.length;
  if (total === 0) return 0;
  return Math.round((emp.processSteps.filter(s => s.acknowledgedBy !== '').length / total) * 100);
}

// Filing status = 100 only when all docs are filled AND all steps acknowledged
function getFilingPct(emp: EmployeeRecord): number {
  const docPct  = getFilingDocPct(emp);
  const procPct = getFilingProcessPct(emp);
  return Math.round((docPct + procPct) / 2);
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = 'emerald' }: { pct: number; color?: 'emerald' | 'blue' | 'violet' }): React.ReactElement {
  const clamped = Math.min(100, Math.max(0, pct));
  const bg    = color === 'blue' ? 'bg-blue-500' : color === 'violet' ? 'bg-violet-500' : 'bg-emerald-500';
  const track = color === 'blue' ? 'bg-blue-100' : color === 'violet' ? 'bg-violet-100' : 'bg-emerald-100';
  const text  = color === 'blue' ? 'text-blue-700' : color === 'violet' ? 'text-violet-700' : 'text-emerald-700';
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
    <div className="flex items-start justify-between gap-2 py-3 px-4 border-b border-slate-100 last:border-0">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-800 mt-0.5 break-all">{value || '—'}</p>
      </div>
      {copyable && value && (
        <button
          onClick={handleCopy}
          className="shrink-0 mt-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Copy"
        >
          {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
        </button>
      )}
    </div>
  );
}

function DocUrlInput({ docId, recordId, onSave }: { docId: string; recordId: string; onSave: (rid: string, did: string, url: string) => void }): React.ReactElement {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <input
        type="url"
        value={value}
        onChange={e => setValue(e.target.value)}
        placeholder="Paste file URL..."
        className="flex-1 h-8 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-0"
      />
      <button
        disabled={!value.trim()}
        onClick={() => onSave(recordId, docId, value.trim())}
        className="shrink-0 h-8 px-3 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Save
      </button>
    </div>
  );
}

// ─── Payroll computation box ────────────────────────────────────────────────────

function PayrollComputationBoxes({ rows }: { rows: PayrollRow[] }): React.ReactElement {
  const totalBasicPay  = rows.reduce((s, r) => s + r.basicPay, 0);
  const totalSss       = rows.reduce((s, r) => s + r.sss, 0);
  const totalPhic      = rows.reduce((s, r) => s + r.phic, 0);
  const totalHdmf      = rows.reduce((s, r) => s + Math.min(r.hdmf, 100), 0); // max 200/mo split
  const totalOT        = rows.reduce((s, r) => s + r.overtime, 0);
  const totalLate      = rows.reduce((s, r) => s + r.late, 0);
  const totalGross     = rows.reduce((s, r) => s + r.grossPay, 0);
  const totalNetPay    = rows.reduce((s, r) => s + r.netPay, 0);

  // Box 2 — taxable income
  const pagibigCapped  = Math.min(totalHdmf * 2, 200); // ensure monthly max 200
  const taxableIncome  = totalBasicPay - totalSss - totalPhic - pagibigCapped;

  // Box 3 — tax due
  const { bracket, finalTaxable, taxDue } = computeMonthlyTax(taxableIncome);

  // Box 1 — net pay
  const netPay = totalGross - totalSss - totalPhic - pagibigCapped;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
      {/* Box 1 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Deductions</p>
        <div className="flex justify-between"><span className="text-slate-600">SSS Contribution</span><span className="font-mono font-semibold text-slate-800">{fmtPHP(totalSss)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">SSS Loan</span><span className="font-mono font-semibold text-slate-400">{fmtPHP(0)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">PhilHealth Contribution</span><span className="font-mono font-semibold text-slate-800">{fmtPHP(totalPhic)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Pag-IBIG Contribution</span><span className="font-mono font-semibold text-slate-800">{fmtPHP(pagibigCapped)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Pag-IBIG Loan</span><span className="font-mono font-semibold text-slate-400">{fmtPHP(0)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">Cash Advance</span><span className="font-mono font-semibold text-slate-400">{fmtPHP(0)}</span></div>
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="font-black text-slate-900 uppercase text-[11px] tracking-wide">Net Pay</span>
          <span className="font-black font-mono text-emerald-700">{fmtPHP(netPay)}</span>
        </div>
      </div>

      {/* Box 2 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Taxable Income</p>
        <div className="flex justify-between"><span className="font-semibold text-slate-700">Base Pay</span><span className="font-mono font-semibold text-slate-800">{fmtPHP(totalBasicPay)}</span></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-1">Less:</p>
        <div className="flex justify-between"><span className="text-slate-600">SSS Contribution</span><span className="font-mono text-slate-700">{fmtPHP(totalSss)}</span></div>
        <div className="flex justify-between"><span className="text-slate-600">PhilHealth Contribution</span><span className="font-mono text-slate-700">{fmtPHP(totalPhic)}</span></div>
        <div className="flex justify-between">
          <span className="text-slate-600">Pag-IBIG Contribution</span>
          <span className="font-mono text-slate-700">{fmtPHP(pagibigCapped)}<span className="text-[9px] text-slate-400 ml-1">(max ₱200)</span></span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="font-black text-slate-900 uppercase text-[11px] tracking-wide">Taxable Income</span>
          <span className="font-black font-mono text-slate-900">{fmtPHP(Math.max(0, taxableIncome))}</span>
        </div>
      </div>

      {/* Box 3 */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1.5 text-sm">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Tax Due</p>
        <div className="flex justify-between"><span className="font-semibold text-slate-700">Taxable Income</span><span className="font-mono font-semibold text-slate-800">{fmtPHP(Math.max(0, taxableIncome))}</span></div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-1">Less:</p>
        <div className="flex justify-between"><span className="text-slate-600">Tax Exempt</span><span className="font-mono text-slate-700">{fmtPHP(bracket.exempt)}</span></div>
        <div className="flex justify-between pt-1">
          <span className="font-semibold text-slate-700">Final Taxable Income</span>
          <span className="font-mono font-semibold text-slate-800">{fmtPHP(finalTaxable)}</span>
        </div>
        <div className="flex justify-between text-slate-600"><span>Tax Rate</span><span className="font-mono">{(bracket.rate * 100).toFixed(0)}%</span></div>
        <div className="flex justify-between text-slate-600"><span>Fixed Tax</span><span className="font-mono">{fmtPHP(bracket.fixed)}</span></div>
        <div className="border-t border-slate-200 pt-2 flex justify-between">
          <span className="font-black text-slate-900 uppercase text-[11px] tracking-wide">Tax Due</span>
          <span className="font-black font-mono text-red-700">{fmtPHP(taxDue)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ───────────────────────────────────────────────────────────────

export interface CWTMonthDetailProps {
  client: MockClientWithCompliance;
  coverageMonth: string;   // e.g. "April 2026"
  onEmployeeChange?: (employees: EmployeeRecord[]) => void;
}

export function CWTMonthDetail({ client, coverageMonth, onEmployeeChange }: CWTMonthDetailProps): React.ReactNode {
  const today = new Date();
  const [monthName, yearStr] = coverageMonth.split(' ');
  const monthIdx = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(monthName);
  const yearNum = parseInt(yearStr, 10);
  const isOldMonth = yearNum < today.getFullYear() || (yearNum === today.getFullYear() && monthIdx < today.getMonth());

  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => buildMockEmployees(coverageMonth, isOldMonth));

  // Payroll modal
  const [payrollEmployee, setPayrollEmployee] = useState<EmployeeRecord | null>(null);
  const [isPayrollOpen, setIsPayrollOpen] = useState(false);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Filing modal
  const [filingEmployee, setFilingEmployee] = useState<EmployeeRecord | null>(null);
  const [isFilingOpen, setIsFilingOpen] = useState(false);

  // Open Case modal
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);

  // Tax info shared for the month
  const [taxInfo] = useState<TaxInfo>({
    tin: '123-456-789-000',
    rdoCode: '082',
    withholdingAgentName: client.businessName,
    registeredAddress: 'Cebu City, Cebu',
    zipCode: '6000',
    contactNumber: '(032) 123-4567',
    category: 'Medium Taxpayer',
    filingEmail: 'tax@' + client.businessName.toLowerCase().replace(/\s+/g, '') + '.com',
  });

  // ── Employee updater helper ───────────────────────────────────────────────
  function updateEmployee(empId: string, updater: (e: EmployeeRecord) => EmployeeRecord) {
    setEmployees(prev => prev.map(e => e.id === empId ? updater(e) : e));
    setFilingEmployee(prev => prev?.id === empId ? updater(prev) : prev);
    setPayrollEmployee(prev => prev?.id === empId ? updater(prev) : prev);
  }

  // ── Payroll CSV import ────────────────────────────────────────────────────
  function handleCSVImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !payrollEmployee) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const newRows: PayrollRow[] = lines.slice(1).map((line, idx) => {
        const cols = line.split(',').map(c => c.trim());
        const basicPay  = parseFloat(cols[1] ?? '0') || 0;
        const overtime  = parseFloat(cols[2] ?? '0') || 0;
        const late      = parseFloat(cols[3] ?? '0') || 0;
        const grossPay  = basicPay + overtime - late;
        const sss       = Math.min(basicPay * 0.045, 1125);
        const phic      = parseFloat((basicPay * 0.05 / 2).toFixed(2));
        const hdmf      = Math.min(basicPay * 0.02, 100);
        const pagibig   = Math.min(hdmf, 100);
        const taxable   = basicPay - sss - phic - pagibig;
        const { taxDue } = computeMonthlyTax(taxable);
        const netPay    = grossPay - sss - phic - pagibig;
        return {
          id: `csv-${idx}`,
          date: cols[0] ?? '',
          basicPay, overtime, late, grossPay,
          sss, phic, hdmf,
          netPay,
          taxableIncome: Math.max(0, taxable),
          wht: parseFloat(taxDue.toFixed(2)),
          period: cols[11] ?? '',
          status: 'Processed' as const,
        };
      });
      updateEmployee(payrollEmployee.id, e => ({ ...e, payrollRows: newRows }));
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // ── Doc URL save ──────────────────────────────────────────────────────────
  function saveDocUrl(empId: string, docId: string, url: string) {
    updateEmployee(empId, e => ({
      ...e,
      docRequirements: e.docRequirements.map(d => d.id === docId ? { ...d, url } : d),
    }));
  }

  // ── Acknowledge step ──────────────────────────────────────────────────────
  function acknowledgeStep(empId: string, stepId: string) {
    const emp = employees.find(e => e.id === empId);
    if (!emp || getFilingDocPct(emp) < 100) return;
    updateEmployee(empId, e => ({
      ...e,
      processSteps: e.processSteps.map(s =>
        s.id === stepId
          ? { ...s, acknowledgedBy: 'Current User', acknowledgedAt: new Date().toISOString().slice(0, 10) }
          : s
      ),
    }));
  }

  // ── Totals ────────────────────────────────────────────────────────────────
  const totalWht   = employees.reduce((s, e) => s + e.withholding, 0);
  const totalGross = employees.reduce((s, e) => s + e.grossPay, 0);

  // ─── Render ───────────────────────────────────────────────────────────────
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
              <p className="text-xs text-slate-500">Compensation Withholding Tax</p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{coverageMonth}</h1>
            </div>
          </div>
          <button
            onClick={() => setIsOpenCaseOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all self-start sm:self-auto"
          >
            <FilePlus2 size={15} /> File Open Case
          </button>
        </div>
      </Card>

      {/* Employee table */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Employees — {coverageMonth}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
            <span>Total Gross: <span className="text-slate-800 font-black font-mono">{fmtPHP(totalGross)}</span></span>
            <span>Total WHT: <span className="text-red-700 font-black font-mono">{fmtPHP(totalWht)}</span></span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse" style={{ minWidth: '860px' }}>
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Employee</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Gross Pay</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Withholding</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-36">Payroll Status</th>
                <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 w-36">Filing Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(emp => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800">{emp.name}</p>
                    <p className="text-xs text-slate-400">{emp.position}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm font-semibold text-slate-800">
                    {fmtPHP(emp.grossPay)}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-sm font-semibold text-red-700">
                    {fmtPHP(emp.withholding)}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setPayrollEmployee(emp); setIsPayrollOpen(true); }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 active:scale-95 transition-all"
                      >
                        <ChevronDown size={11} /> Payroll
                      </button>
                      <button
                        onClick={() => { setFilingEmployee(emp); setIsFilingOpen(true); }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 active:scale-95 transition-all"
                      >
                        <ExternalLink size={11} /> File
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 w-36">
                    <ProgressBar pct={getPayrollPct(emp)} color="violet" />
                  </td>
                  <td className="px-5 py-3.5 w-36">
                    <ProgressBar pct={getFilingPct(emp)} color="emerald" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ════════════════════════════════════════════════════════
          PAYROLL MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isPayrollOpen}
        onClose={() => setIsPayrollOpen(false)}
        title=""
        size="5xl"
      >
        {payrollEmployee && (() => {
          const emp = employees.find(e => e.id === payrollEmployee.id) ?? payrollEmployee;
          const rows = emp.payrollRows;
          const totalBasic  = rows.reduce((s, r) => s + r.basicPay, 0);
          const totalOT     = rows.reduce((s, r) => s + r.overtime, 0);
          const totalLate   = rows.reduce((s, r) => s + r.late, 0);
          const totalGrossR = rows.reduce((s, r) => s + r.grossPay, 0);
          const totalSss    = rows.reduce((s, r) => s + r.sss, 0);
          const totalPhic   = rows.reduce((s, r) => s + r.phic, 0);
          const totalHdmf   = rows.reduce((s, r) => s + r.hdmf, 0);
          const totalNet    = rows.reduce((s, r) => s + r.netPay, 0);
          const totalWhtR   = rows.reduce((s, r) => s + r.wht, 0);

          return (
            <div className="overflow-y-auto max-h-[85vh]">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">{emp.name}</h2>
                  <p className="text-sm text-slate-500">Payroll for the month of <strong className="text-slate-800">{coverageMonth}</strong></p>
                </div>
                <div>
                  <input
                    ref={csvInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                  />
                  <button
                    onClick={() => csvInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <Upload size={14} /> Import CSV
                  </button>
                </div>
              </div>

              <div className="px-6 py-5 space-y-5">
                {/* Payroll table */}
                {rows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center">
                    <Upload size={24} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No payroll data yet. Import a CSV to populate.</p>
                    <p className="text-xs text-slate-300 mt-1">CSV columns: Date, Basic Pay, Overtime, Late, SSS, PHIC, HDMF, Period</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['Date','Basic Pay','OT','Late','Gross','SSS','PHIC','HDMF','Net Pay','Taxable','WHT','Period','Status'].map(h => (
                            <th key={h} className="text-left px-2 py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rows.map(row => (
                          <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{row.date}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-800">{fmtPHP(row.basicPay)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-700">{fmtPHP(row.overtime)}</td>
                            <td className="px-2 py-1.5 font-mono text-red-600">{fmtPHP(row.late)}</td>
                            <td className="px-2 py-1.5 font-mono font-semibold text-slate-800">{fmtPHP(row.grossPay)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-600">{fmtPHP(row.sss)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-600">{fmtPHP(row.phic)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-600">{fmtPHP(row.hdmf)}</td>
                            <td className="px-2 py-1.5 font-mono font-semibold text-emerald-700">{fmtPHP(row.netPay)}</td>
                            <td className="px-2 py-1.5 font-mono text-slate-700">{fmtPHP(row.taxableIncome)}</td>
                            <td className="px-2 py-1.5 font-mono font-semibold text-red-700">{fmtPHP(row.wht)}</td>
                            <td className="px-2 py-1.5 text-slate-600 whitespace-nowrap">{row.period}</td>
                            <td className="px-2 py-1.5">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${
                                row.status === 'Processed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {/* Totals row */}
                        <tr className="bg-slate-100 border-t-2 border-slate-200 font-black text-xs">
                          <td className="px-2 py-1.5 text-slate-600 uppercase tracking-wide text-[9px]">Total</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalBasic)}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalOT)}</td>
                          <td className="px-2 py-1.5 font-mono text-red-700">{fmtPHP(totalLate)}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalGrossR)}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalSss)}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalPhic)}</td>
                          <td className="px-2 py-1.5 font-mono text-slate-900">{fmtPHP(totalHdmf)}</td>
                          <td className="px-2 py-1.5 font-mono text-emerald-700">{fmtPHP(totalNet)}</td>
                          <td colSpan={2} className="px-2 py-1.5 font-mono text-red-700">{fmtPHP(totalWhtR)}</td>
                          <td colSpan={2} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* 3-box computation */}
                <PayrollComputationBoxes rows={rows} />
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ════════════════════════════════════════════════════════
          FILING MODAL
      ════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={isFilingOpen}
        onClose={() => setIsFilingOpen(false)}
        title=""
        size="5xl"
      >
        {filingEmployee && (() => {
          const emp = employees.find(e => e.id === filingEmployee.id) ?? filingEmployee;
          const docPct  = getFilingDocPct(emp);
          const procPct = getFilingProcessPct(emp);
          const docsComplete = docPct === 100;
          const completedSteps = emp.processSteps.filter(s => s.acknowledgedBy !== '').length;
          const nextStepIdx = completedSteps < emp.processSteps.length ? completedSteps : -1;

          // Compensation breakdown from payroll rows
          const rows = emp.payrollRows;
          const totalBasicPay   = rows.reduce((s, r) => s + r.basicPay, 0);
          const totalSss        = rows.reduce((s, r) => s + r.sss, 0);
          const totalPhic       = rows.reduce((s, r) => s + r.phic, 0);
          const totalHdmf       = Math.min(rows.reduce((s, r) => s + r.hdmf, 0), 200);
          const totalGrossR     = rows.reduce((s, r) => s + r.grossPay, 0);
          const nonTaxableTotal = totalSss + totalPhic + totalHdmf;
          const totalWhtR       = rows.reduce((s, r) => s + r.wht, 0);

          return (
            <div className="overflow-y-auto max-h-[85vh]">
              {/* Filing modal header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Compensation Withholding Tax</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  For the month of <strong className="text-slate-800">{coverageMonth}</strong> — {emp.name}
                </p>
              </div>

              <div className="px-6 py-6 space-y-6">
                {/* Summary strip */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Tax Withheld</p>
                      <p className="text-base font-black text-slate-900">{fmtPHP(emp.withholding)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Paid by Client</p>
                      <p className="text-base font-black text-emerald-700">{fmtPHP(emp.paidAmount)}</p>
                    </div>
                    <button className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors">
                      <ExternalLink size={10} /> See Payment
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 flex-1 min-w-0">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Zero Filing</p>
                      <span className={`text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        emp.zeroFiling ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'
                      }`}>{emp.zeroFiling ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Payment Status</p>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                        emp.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700'
                        : emp.paymentStatus === 'Partial' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-600'
                      }`}>{emp.paymentStatus}</span>
                    </div>
                  </div>
                </div>

                {/* 60/40 split */}
                <div className="flex flex-col lg:flex-row gap-5">

                  {/* ── 60% left ── */}
                  <div className="flex-[60%] space-y-6 min-w-0">

                    {/* Taxpayer information */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Taxpayer Information</p>
                      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden divide-y divide-slate-100">
                        <CopyField label="TAX IDENTIFICATION NUMBER" value={taxInfo.tin} copyable={false} />
                        <CopyField label="RDO CODE" value={taxInfo.rdoCode} copyable />
                        <CopyField label="WITHHOLDING AGENT'S NAME" value={taxInfo.withholdingAgentName} copyable />
                        <CopyField label="REGISTERED ADDRESS" value={taxInfo.registeredAddress} copyable />
                        <CopyField label="ZIP CODE" value={taxInfo.zipCode} copyable />
                        <CopyField label="CONTACT NUMBER" value={taxInfo.contactNumber} copyable />
                        <CopyField label="CATEGORY OF WITHHOLDING AGENT" value={taxInfo.category} copyable={false} />
                        <CopyField label="FILING EMAIL ADDRESS" value={taxInfo.filingEmail} copyable />
                      </div>
                    </div>

                    {/* Compensation breakdown */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Compensation & Tax Summary</p>
                      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden text-sm">
                        <div className="flex justify-between px-4 py-2.5">
                          <span className="font-semibold text-slate-700">Total Amount of Compensation</span>
                          <span className="font-black font-mono text-slate-900">{fmtPHP(totalGrossR || emp.grossPay)}</span>
                        </div>
                        <div className="px-4 py-1.5 bg-slate-50">
                          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Less:</p>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-slate-600">
                          <span>Basic Pay for MWE</span><span className="font-mono">{fmtPHP(0)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-slate-600">
                          <span>Holiday, OT, ND, Hazard (MWE)</span><span className="font-mono">{fmtPHP(0)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-slate-600">
                          <span>13th Month Pay and Other Benefits</span><span className="font-mono">{fmtPHP(0)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-slate-600">
                          <span>SSS, PHIC, HDMF EE Share</span>
                          <span className="font-mono">{fmtPHP(nonTaxableTotal || (totalSss + totalPhic + totalHdmf))}</span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5 text-slate-600 border-b border-slate-100">
                          <span className="font-semibold">Total Non-taxable Compensation</span>
                          <span className="font-mono font-semibold">{fmtPHP(nonTaxableTotal)}</span>
                        </div>
                        <div className="flex justify-between px-4 py-3 bg-red-50">
                          <span className="font-black text-slate-900 uppercase text-[11px] tracking-wide">Total Taxes Withheld</span>
                          <span className="font-black font-mono text-red-700">{fmtPHP(totalWhtR || emp.withholding)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── 40% right ── */}
                  <div className="flex-[40%] space-y-6 min-w-0">

                    {/* Documentary Requirements */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Documentary Requirements</p>
                        <div className="w-28"><ProgressBar pct={docPct} color="emerald" /></div>
                      </div>
                      <div className="rounded-xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <tbody className="divide-y divide-slate-100">
                            {emp.docRequirements.map(doc => (
                              <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-4 font-semibold text-slate-700 text-xs">{doc.label}</td>
                                <td className="px-4 py-4">
                                  {doc.url ? (
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors whitespace-nowrap"
                                    >
                                      <ExternalLink size={10} /> Open File
                                    </a>
                                  ) : (
                                    <DocUrlInput docId={doc.id} recordId={emp.id} onSave={saveDocUrl} />
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Process Flow */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Process Flow</p>
                        <div className="w-28"><ProgressBar pct={procPct} color="blue" /></div>
                      </div>

                      {!docsComplete && (
                        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                          <Lock size={12} className="text-amber-500 shrink-0" />
                          <p className="text-xs font-semibold text-amber-700">Complete all documentary requirements first.</p>
                        </div>
                      )}

                      <div className="space-y-0">
                        {emp.processSteps.map((step, idx) => {
                          const done   = step.acknowledgedBy !== '';
                          const isNext = idx === nextStepIdx;
                          const locked = !done && !isNext;
                          return (
                            <div key={step.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                                  done ? 'bg-blue-600 border-blue-600'
                                  : isNext && docsComplete ? 'bg-white border-blue-400'
                                  : 'bg-white border-slate-200'
                                }`}>
                                  {done
                                    ? <Check size={12} className="text-white" />
                                    : <span className={`text-[10px] font-black ${isNext && docsComplete ? 'text-blue-500' : 'text-slate-300'}`}>{idx + 1}</span>
                                  }
                                </div>
                                {idx < emp.processSteps.length - 1 && (
                                  <div className={`w-0.5 flex-1 min-h-6 ${done ? 'bg-blue-300' : 'bg-slate-200'}`} />
                                )}
                              </div>
                              <div className={`flex-1 pb-4 ${idx === emp.processSteps.length - 1 ? 'pb-0' : ''}`}>
                                <div className="flex items-start justify-between gap-1">
                                  <div>
                                    <p className={`text-[11px] font-black uppercase tracking-wide ${done ? 'text-blue-700' : isNext && docsComplete ? 'text-slate-700' : 'text-slate-300'}`}>
                                      {step.label}
                                    </p>
                                    <p className={`text-[10px] ${done ? 'text-slate-500' : isNext && docsComplete ? 'text-slate-400' : 'text-slate-300'}`}>
                                      {step.role}
                                    </p>
                                    {done && (
                                      <p className="text-[10px] text-blue-600 font-semibold mt-0.5">
                                        {step.acknowledgedBy} · {step.acknowledgedAt}
                                      </p>
                                    )}
                                  </div>
                                  {isNext && (
                                    <button
                                      disabled={!docsComplete}
                                      onClick={() => acknowledgeStep(emp.id, step.id)}
                                      className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
                                    >
                                      <ClipboardList size={10} /> Acknowledge
                                    </button>
                                  )}
                                  {locked && (
                                    <span className="shrink-0 inline-flex items-center gap-0.5 text-[10px] text-slate-300 font-semibold">
                                      <Lock size={9} /> Locked
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
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Open Case Modal ── */}
      <Modal isOpen={isOpenCaseOpen} onClose={() => setIsOpenCaseOpen(false)} title="File Open Case" size="lg">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong> — CWT {coverageMonth}.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
              <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option>BIR — Deficiency CWT</option>
                <option>BIR — Late Filing (1601-C)</option>
                <option>BIR — Non-Remittance</option>
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
            <button className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all" onClick={() => setIsOpenCaseOpen(false)}>
              File Case
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

// ─── Export employee progress helpers for CWTDetail rollup ─────────────────────
export { getPayrollPct, getFilingPct };
export type { EmployeeRecord };
