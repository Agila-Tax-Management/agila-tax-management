// src/components/quick-links/SalaryComputation.tsx
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  Coins,
  Info,
  Landmark,
  Receipt,
} from 'lucide-react';

// ── Peso formatter ───────────────────────────────────────────────────────────
const fmtP = (v: number) =>
  `₱${v.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

// ── Philippine mandatory contribution rules ──────────────────────────────────
function sssEmployee(monthly: number): number {
  const msc = Math.min(
    30_000,
    Math.max(4_000, Math.round(monthly / 500) * 500),
  );
  return Math.round(msc * 0.05 * 100) / 100;
}

function philhealthEmployee(monthly: number): number {
  const base = Math.min(100_000, Math.max(10_000, monthly));
  return Math.round(base * 0.025 * 100) / 100;
}

function pagibigEmployee(monthly: number): number {
  const rate = monthly <= 1_500 ? 0.01 : 0.02;
  return Math.min(100, Math.round(Math.min(5_000, monthly) * rate * 100) / 100);
}

// BIR TRAIN Law — monthly withholding tax on taxable income
const EXEMPT_MONTHLY = 250_000 / 12;

function withholdingTax(taxable: number): number {
  if (taxable <= EXEMPT_MONTHLY) return 0;
  if (taxable <= 33_332) return (taxable - EXEMPT_MONTHLY) * 0.2;
  if (taxable <= 66_666) return 2_500 + (taxable - 33_333) * 0.25;
  if (taxable <= 166_666) return 10_833 + (taxable - 66_667) * 0.3;
  if (taxable <= 666_666) return 40_833 + (taxable - 166_667) * 0.32;
  return 200_833 + (taxable - 666_667) * 0.35;
}

// ── Pay frequency helpers ────────────────────────────────────────────────────
type PayFreq = 'semi-monthly' | 'weekly';

const FREQ_LABEL: Record<PayFreq, string> = {
  'semi-monthly': 'Semi-monthly (5th & 20th)',
  weekly: 'Weekly',
};

const PERIODS: Record<PayFreq, number> = {
  'semi-monthly': 2,
  weekly: 52 / 12,
};

// ── Row helper ───────────────────────────────────────────────────────────────
function Row({
  label,
  value,
  bold,
  color,
  indent,
}: {
  label: string;
  value?: string;
  bold?: boolean;
  color?: string;
  indent?: boolean;
}) {
  return (
    <div
      className={`flex justify-between items-center py-3 ${indent ? 'pl-6' : ''} border-b border-border last:border-none`}
    >
      <span
        className={`text-sm ${bold ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'} ${indent ? 'text-xs' : ''}`}
      >
        {label}
      </span>
      {value !== undefined && (
        <span className={`font-bold text-sm ${color ?? 'text-foreground'}`}>
          {value}
        </span>
      )}
    </div>
  );
}

// ── Contribution detail row ──────────────────────────────────────────────────
function ContribRow({
  label,
  amount,
  note,
  exempt,
}: {
  label: string;
  amount: number;
  note: string;
  exempt?: boolean;
}) {
  return (
    <div className="py-3 border-b border-border last:border-none">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
          {label}
        </span>
        {exempt ? (
          <Badge variant="success">Exempt</Badge>
        ) : (
          <span className="text-sm font-bold text-foreground">
            {fmtP(amount)}
          </span>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">{note}</p>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export function SalaryComputation(): React.ReactNode {
  const [freq, setFreq] = useState<PayFreq>('semi-monthly');
  const [rateInput, setRateInput] = useState('');
  const [computed, setComputed] = useState(false);

  const monthly = parseFloat(rateInput.replace(/,/g, '')) || 0;

  const result = useMemo(() => {
    if (monthly <= 0) return null;

    const daily = monthly / 21.75;
    const hourly = daily / 8;
    const period = monthly / PERIODS[freq];

    const sss = sssEmployee(monthly);
    const ph = philhealthEmployee(monthly);
    const pagibig = pagibigEmployee(monthly);
    const govTotal = sss + ph + pagibig;

    const taxable = Math.max(0, monthly - govTotal);
    const taxExempt = taxable <= EXEMPT_MONTHLY;
    const tax = withholdingTax(taxable);
    const totalDed = govTotal + tax;

    const monthlyNet = monthly - totalDed;
    const periodDed = totalDed / PERIODS[freq];
    const periodNet = period - periodDed;

    const msc = Math.min(
      30_000,
      Math.max(4_000, Math.round(monthly / 500) * 500),
    );

    return {
      monthly,
      daily,
      hourly,
      period,
      sss,
      ph,
      pagibig,
      govTotal,
      msc,
      tax,
      taxExempt,
      totalDed,
      taxable,
      monthlyNet,
      periodNet,
    };
  }, [monthly, freq]);

  const handleCompute = () => {
    if (monthly > 0) setComputed(true);
  };

  return (
    <div className="space-y-8">
      {/* ── Back + Header ─────────────────────────────────────────────── */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
              Salary Computation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Compute take-home pay with Philippine mandatory deductions
            </p>
          </div>
          <Badge variant="info" className="self-start">
            PH 2024 Rates
          </Badge>
        </div>
      </div>

      {/* ── Input Card ────────────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 rounded-xl bg-blue-600 text-white">
            <Calculator size={16} />
          </div>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Compensation Details
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Frequency */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
              Pay Schedule
            </label>
            <div className="relative">
              <select
                value={freq}
                onChange={(e) => {
                  setFreq(e.target.value as PayFreq);
                  setComputed(false);
                }}
                className="w-full h-12 px-4 bg-muted border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring appearance-none cursor-pointer"
              >
                <option value="semi-monthly">
                  Semi-monthly (5th &amp; 20th)
                </option>
                <option value="weekly">Weekly</option>
              </select>
              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          {/* Salary input */}
          <div>
            <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2">
              Agreed Monthly Basic Salary
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                ₱
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={rateInput}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, '');
                  setRateInput(raw);
                  setComputed(false);
                }}
                placeholder="e.g. 25000"
                className="w-full h-12 pl-8 pr-4 bg-muted border border-border rounded-xl text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Info note */}
        <div className="mt-5 flex items-start gap-3 p-4">
          <Info
            size={16}
            className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5"
          />
          <p className="text-xs font-medium text-black leading-relaxed">
            Deductions use 2024 PH rates: <strong>SSS 5%</strong> (MSC ceiling
            ₱30,000) · <strong>PhilHealth 2.5%</strong> (ceiling ₱100,000) ·{' '}
            <strong>Pag-IBIG 2%</strong> (max ₱100) ·{' '}
            <strong>BIR TRAIN Law</strong> — employees with annual taxable
            income ≤ ₱250,000 are fully exempt from income tax.
          </p>
        </div>

        <Button
          onClick={handleCompute}
          disabled={monthly <= 0}
          className="mt-6 h-12 px-8"
        >
          <Calculator size={16} />
          Compute Salary
        </Button>
      </Card>

      {/* ── Results ───────────────────────────────────────────────────── */}
      {computed && result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rate Breakdown */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-emerald-600 text-white">
                <Coins size={16} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Rate Breakdown
              </span>
            </div>

            <Row label="Monthly Rate" value={fmtP(result.monthly)} bold />
            <Row
              label={
                freq === 'semi-monthly' ? 'Semi-monthly Rate' : 'Weekly Rate'
              }
              value={fmtP(result.period)}
              bold
            />
            <Row label="Daily Rate (÷ 21.75)" value={fmtP(result.daily)} />
            <Row label="Hourly Rate (÷ 8 hrs)" value={fmtP(result.hourly)} />

            <div className="mt-5 p-4 rounded-xl bg-emerald-600 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">
                {FREQ_LABEL[freq]} Net Pay
              </p>
              <p className="text-2xl font-extrabold">{fmtP(result.periodNet)}</p>
              <p className="text-[10px] opacity-60 mt-1">after all deductions</p>
            </div>
          </Card>

          {/* Government Contributions */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-amber-500 text-white">
                <Landmark size={16} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Gov&apos;t Contributions
              </span>
              <Badge variant="neutral" className="ml-auto">
                Monthly
              </Badge>
            </div>

            <ContribRow
              label="SSS"
              amount={result.sss}
              note={`5% of MSC · ₱${result.msc.toLocaleString()} salary credit`}
            />
            <ContribRow
              label="PhilHealth"
              amount={result.ph}
              note="2.5% of monthly salary (max ₱2,500)"
            />
            <ContribRow
              label="Pag-IBIG"
              amount={result.pagibig}
              note="2% of salary (max ₱100 / month)"
            />
            <ContribRow
              label="Withholding Tax"
              amount={result.tax}
              exempt={result.taxExempt}
              note={
                result.taxExempt
                  ? 'Annual taxable ≤ ₱250,000 — TRAIN Law exemption applies'
                  : `BIR TRAIN Law on taxable income of ${fmtP(result.taxable)}/mo`
              }
            />

            <div className="flex justify-between items-center py-3 px-4 bg-muted rounded-xl mt-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                Total Deductions
              </span>
              <span className="text-sm font-bold text-rose-600">
                {fmtP(result.totalDed)}
              </span>
            </div>
          </Card>

          {/* Net Pay Summary */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 rounded-xl bg-slate-800 text-white">
                <Receipt size={16} />
              </div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Monthly Net Pay
              </span>
            </div>

            <Row label="Monthly Gross" value={fmtP(result.monthly)} bold />
            <Row
              label="SSS"
              value={`– ${fmtP(result.sss)}`}
              color="text-rose-500"
              indent
            />
            <Row
              label="PhilHealth"
              value={`– ${fmtP(result.ph)}`}
              color="text-rose-500"
              indent
            />
            <Row
              label="Pag-IBIG"
              value={`– ${fmtP(result.pagibig)}`}
              color="text-rose-500"
              indent
            />
            <Row
              label="Total Contributions"
              value={`– ${fmtP(result.govTotal)}`}
              color="text-rose-600"
              bold
            />

            {/* Taxable income callout */}
            <div className="py-2 px-4 bg-muted rounded-xl my-2 text-[10px] text-muted-foreground font-medium flex justify-between">
              <span>Taxable Income</span>
              <span className="font-bold text-foreground">
                {fmtP(result.taxable)}
              </span>
            </div>

            {/* BIR row */}
            <div className="flex justify-between items-center py-3 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">
                Withholding Tax (BIR)
              </span>
              {result.taxExempt ? (
                <Badge variant="success">₱0.00 — Exempt</Badge>
              ) : (
                <span className="font-bold text-sm text-rose-500">
                  – {fmtP(result.tax)}
                </span>
              )}
            </div>

            <Row
              label="Total Deductions"
              value={`– ${fmtP(result.totalDed)}`}
              color="text-rose-700"
              bold
            />

            {/* Monthly net highlight */}
            <div className="mt-4 p-4 rounded-xl bg-slate-900 text-white">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50 mb-1">
                Monthly Net Pay
              </p>
              <p className="text-2xl font-extrabold">{fmtP(result.monthlyNet)}</p>
              <div className="mt-3 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (result.monthlyNet / result.monthly) * 100).toFixed(1)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] opacity-40 mt-2">
                {((result.monthlyNet / result.monthly) * 100).toFixed(1)}% of
                gross
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
