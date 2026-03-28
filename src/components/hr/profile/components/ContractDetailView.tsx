// src/components/hr/profile/components/ContractDetailView.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, CheckCircle, Info, Pencil, Plus } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { CompensationRecord, ContractRecord, ScheduleOption } from '../profile-types';

// ─── Local Types ─────────────────────────────────────────────────

type RateType = 'DAILY' | 'MONTHLY';
type SalaryFrequency = 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY';
type PayType = 'FIXED_PAY' | 'VARIABLE_PAY';
type DisbursementType = 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'E_WALLET';

interface CompFormData {
  baseRate: string;
  allowanceRate: string;
  rateType: RateType;
  frequency: SalaryFrequency;
  payType: PayType;
  disbursementType: DisbursementType;
  bankDetails: string;
  isPaidRestDays: boolean;
  restDaysPerWeek: number;
  deductSss: boolean;
  deductPhilhealth: boolean;
  deductPagibig: boolean;
  pagibigType: 'REGULAR' | 'MINIMUM';
}

export interface ContractDetailViewProps {
  contract: ContractRecord;
  employeeId: number;
  scheduleOptions: ScheduleOption[];
  onBack: () => void;
  onContractSaved: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────

const CONTRACT_STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success', DRAFT: 'warning', EXPIRED: 'neutral', TERMINATED: 'danger',
};

function getDoleFactor(isPaidRestDays: boolean, restDaysPerWeek: number): number {
  if (isPaidRestDays) return 365;
  if (restDaysPerWeek === 2) return 261;
  if (restDaysPerWeek === 1) return 313;
  return 393.8;
}

const DEFAULT_COMP_FORM: CompFormData = {
  baseRate: '',
  allowanceRate: '',
  rateType: 'DAILY',
  frequency: 'TWICE_A_MONTH',
  payType: 'VARIABLE_PAY',
  disbursementType: 'CASH',
  bankDetails: '',
  isPaidRestDays: false,
  restDaysPerWeek: 1,
  deductSss: false,
  deductPhilhealth: false,
  deductPagibig: false,
  pagibigType: 'REGULAR',
};

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';
const selectCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

const fmtRate = (v: number) =>
  `₱${v.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const FREQ_LABELS: Record<SalaryFrequency, string> = {
  ONCE_A_MONTH: 'Once a Month',
  TWICE_A_MONTH: 'Twice a Month',
  WEEKLY: 'Weekly',
};

const DISB_LABELS: Record<DisbursementType, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHEQUE: 'Cheque',
  E_WALLET: 'E-Wallet',
};

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ─── Component ───────────────────────────────────────────────────

export function ContractDetailView({
  contract, employeeId, scheduleOptions, onBack, onContractSaved,
}: ContractDetailViewProps): React.ReactNode {
  const { success, error } = useToast();

  const [compensation, setCompensation] = useState<CompensationRecord | null>(null);
  const [compLoading, setCompLoading] = useState(true);
  const [showCompForm, setShowCompForm] = useState(false);
  const [compForm, setCompForm] = useState<CompFormData>(DEFAULT_COMP_FORM);
  const [compSaving, setCompSaving] = useState(false);

  const fetchCompensation = useCallback(async () => {
    setCompLoading(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/compensation`);
      if (!res.ok) return;
      const data = (await res.json()) as { data: CompensationRecord[] };
      const active =
        (data.data ?? []).find((c) => c.contractId === contract.id && c.isActive) ?? null;
      setCompensation(active);
    } catch {
      // silently fail — non-critical
    } finally {
      setCompLoading(false);
    }
  }, [employeeId, contract.id]);

  useEffect(() => {
    void fetchCompensation();
  }, [fetchCompensation]);

  const handleOpenCompForm = () => {
    if (compensation) {
      setCompForm({
        baseRate: compensation.baseRate,
        allowanceRate: compensation.allowanceRate,
        rateType: compensation.rateType,
        frequency: compensation.frequency,
        payType: compensation.payType,
        disbursementType: compensation.disbursementType,
        bankDetails: compensation.bankDetails ?? '',
        isPaidRestDays: compensation.isPaidRestDays,
        restDaysPerWeek: compensation.restDaysPerWeek,
        deductSss: compensation.deductSss,
        deductPhilhealth: compensation.deductPhilhealth,
        deductPagibig: compensation.deductPagibig,
        pagibigType: (compensation.pagibigType ?? 'REGULAR') as 'REGULAR' | 'MINIMUM',
      });
    } else {
      setCompForm(DEFAULT_COMP_FORM);
    }
    setShowCompForm(true);
  };

  const handleSaveComp = async () => {
    if (!compForm.baseRate.trim()) {
      error('Missing field', 'Base rate is required.');
      return;
    }
    setCompSaving(true);
    try {
      const res = await fetch(`/api/hr/employees/${employeeId}/compensation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: contract.id,
          baseRate: compForm.baseRate,
          allowanceRate: compForm.allowanceRate || '0',
          rateType: compForm.rateType,
          frequency: compForm.frequency,
          payType: compForm.payType,
          disbursementType: compForm.disbursementType,
          bankDetails: compForm.bankDetails || null,
          isPaidRestDays: compForm.isPaidRestDays,
          restDaysPerWeek: compForm.restDaysPerWeek,
          deductSss: compForm.deductSss,
          deductPhilhealth: compForm.deductPhilhealth,
          deductPagibig: compForm.deductPagibig,
          pagibigType: compForm.pagibigType,
          deductTax: false,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to save', data.error ?? 'An error occurred.');
        return;
      }
      success('Compensation saved', 'Employee compensation has been updated.');
      setShowCompForm(false);
      await fetchCompensation();
      onContractSaved();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setCompSaving(false);
    }
  };

  const schedule = scheduleOptions.find((s) => s.id === contract.scheduleId);

  // Live calculation for the comp form
  const baseRateNum = parseFloat(compForm.baseRate) || 0;
  const allowanceNum = parseFloat(compForm.allowanceRate) || 0;
  const formFactor = getDoleFactor(compForm.isPaidRestDays, compForm.restDaysPerWeek);
  const formCalcDaily =
    baseRateNum === 0
      ? 0
      : compForm.rateType === 'DAILY'
        ? baseRateNum
        : (baseRateNum * 12) / formFactor;
  const formCalcMonthly =
    baseRateNum === 0
      ? 0
      : compForm.rateType === 'MONTHLY'
        ? baseRateNum
        : (baseRateNum * formFactor) / 12;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="Back to contracts list"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-foreground">
            {contract.contractType.replace(/_/g, ' ')} Contract
          </h2>
          <p className="text-xs text-muted-foreground">
            {contract.positionTitle} · {contract.departmentName}
          </p>
        </div>
        <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? 'neutral'}>
          {contract.status}
        </Badge>
      </div>

      {/* Contract Details */}
      <Card className="p-5 space-y-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
          Contract Details
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Start Date</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {contract.startDate
                ? new Date(contract.startDate).toLocaleDateString('en-PH')
                : '—'}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">End Date</p>
            <p className="text-sm font-medium text-foreground mt-0.5">
              {contract.endDate
                ? new Date(contract.endDate).toLocaleDateString('en-PH')
                : 'Open-ended'}
            </p>
          </div>
          {contract.workingHoursPerWeek != null && (
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Working Hrs/Week</p>
              <p className="text-sm font-medium text-foreground mt-0.5">
                {contract.workingHoursPerWeek} hrs
              </p>
            </div>
          )}

          {schedule && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                Work Schedule
              </p>
              <p className="text-sm font-medium text-foreground mt-0.5">{schedule.name}</p>
              {schedule.days.filter((d) => d.isWorkingDay).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {schedule.days
                    .filter((d) => d.isWorkingDay)
                    .map((d) => (
                      <span
                        key={d.dayOfWeek}
                        className="text-[11px] bg-muted px-2 py-0.5 rounded font-medium text-muted-foreground"
                      >
                        {DAY_SHORT[d.dayOfWeek]} {d.startTime}–{d.endTime}
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}

          {contract.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Notes</p>
              <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{contract.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Compensation Section */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Compensation</p>
          {!showCompForm && (
            <Button
              variant="outline"
              className="gap-1.5 text-xs h-8 px-3"
              onClick={handleOpenCompForm}
            >
              {compensation ? (
                <><Pencil size={13} /> Edit Compensation</>
              ) : (
                <><Plus size={13} /> Add Compensation</>
              )}
            </Button>
          )}
        </div>

        {compLoading ? (
          <p className="text-xs text-muted-foreground py-4 text-center">Loading compensation data…</p>
        ) : !compensation && !showCompForm ? (
          <div className="rounded-lg bg-muted/50 border border-border px-4 py-6 text-center space-y-2">
            <Info size={24} className="mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm font-medium text-foreground">No compensation configured</p>
            <p className="text-xs text-muted-foreground">
              Click &ldquo;Add Compensation&rdquo; to configure salary, benefits, and government
              deductions.
            </p>
          </div>
        ) : compensation && !showCompForm ? (
          // ── Display existing compensation ────────────────────────
          <div className="space-y-5">
            {/* Basic Compensation */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Basic Compensation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Salary Rate</p>
                  <p className="text-sm font-bold text-foreground">
                    {fmtRate(parseFloat(compensation.baseRate))}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {compensation.rateType === 'DAILY' ? 'per day' : 'per month'}
                  </p>
                </div>
                {parseFloat(compensation.allowanceRate) > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground">Allowance</p>
                    <p className="text-sm font-bold text-foreground">
                      {fmtRate(parseFloat(compensation.allowanceRate))}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Salary Configuration */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Salary Configuration
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Frequency</p>
                  <p className="text-sm font-medium text-foreground">
                    {FREQ_LABELS[compensation.frequency] ?? compensation.frequency}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Pay Type</p>
                  <p className="text-sm font-medium text-foreground">
                    {compensation.payType === 'FIXED_PAY' ? 'Fixed Pay' : 'Variable Pay'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Disbursement</p>
                  <p className="text-sm font-medium text-foreground">
                    {DISB_LABELS[compensation.disbursementType] ?? compensation.disbursementType}
                  </p>
                </div>
                {compensation.bankDetails && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[11px] text-muted-foreground">Bank / Account</p>
                    <p className="text-sm font-medium text-foreground">{compensation.bankDetails}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Rest Days */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Rest Days Configuration
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] text-muted-foreground">Paid on Rest Days</p>
                  <p className="text-sm font-medium text-foreground">
                    {compensation.isPaidRestDays ? 'Yes' : 'No'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Rest Days / Week</p>
                  <p className="text-sm font-medium text-foreground">{compensation.restDaysPerWeek}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">DOLE Factor</p>
                  <p className="text-sm font-bold text-foreground">
                    {parseFloat(compensation.doleFactor)}
                  </p>
                </div>
              </div>
            </div>

            {/* Government Benefits */}
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                Government Benefits
              </p>
              <div className="flex flex-wrap gap-2">
                {([
                  { key: 'deductSss' as const, label: 'SSS' },
                  { key: 'deductPhilhealth' as const, label: 'PhilHealth' },
                ] as { key: keyof Pick<CompensationRecord, 'deductSss' | 'deductPhilhealth'>; label: string }[]).map(({ key, label }) => (
                  <span
                    key={key}
                    className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                      compensation[key]
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}
                  >
                    {compensation[key] ? '✓' : '✗'} {label}
                  </span>
                ))}
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full border ${
                    compensation.deductPagibig
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {compensation.deductPagibig ? '✓' : '✗'} Pag-IBIG
                  {compensation.deductPagibig && (
                    <span className="ml-1 opacity-70">
                      ({compensation.pagibigType === 'MINIMUM' ? '₱200' : '2%'})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {/* Calculated Rates */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-500" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Calculated Rates
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground">Salary Basis</p>
                  <p className="text-sm font-bold text-foreground">
                    {compensation.rateType === 'DAILY' ? 'Daily' : 'Monthly'}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">DOLE Factor</p>
                  <p className="text-sm font-bold text-foreground">
                    {parseFloat(compensation.doleFactor)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Daily Rate</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {fmtRate(parseFloat(compensation.calculatedDailyRate))}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Monthly Rate (EEMR)</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {fmtRate(parseFloat(compensation.calculatedMonthlyRate))}
                  </p>
                </div>
              </div>
              {parseFloat(compensation.allowanceRate) > 0 && (
                <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-[11px] text-muted-foreground">Allowance</p>
                  <p className="text-sm font-bold text-foreground">
                    {fmtRate(parseFloat(compensation.allowanceRate))}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Effective: {new Date(compensation.effectiveDate).toLocaleDateString('en-PH')}
              </p>
            </div>
          </div>
        ) : null}

        {/* ── Inline Compensation Form ── */}
        {showCompForm && (
          <div className="space-y-5 pt-2 border-t border-border">
            {compensation && (
              <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Saving will create a new active compensation and deactivate the current one.
                </p>
              </div>
            )}

            {/* Section: Basic Compensation */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
                Basic Compensation
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Salary Rate (₱) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    className={inputCls}
                    value={compForm.baseRate}
                    onChange={(e) => setCompForm((p) => ({ ...p, baseRate: e.target.value }))}
                    placeholder="e.g. 540.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className={labelCls}>Allowance Rate (₱)</label>
                  <input
                    type="number"
                    className={inputCls}
                    value={compForm.allowanceRate}
                    onChange={(e) => setCompForm((p) => ({ ...p, allowanceRate: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Section: Salary Configuration */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
                Salary Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Agreed Salary Rate</label>
                  <select
                    className={selectCls}
                    value={compForm.rateType}
                    onChange={(e) => setCompForm((p) => ({ ...p, rateType: e.target.value as RateType }))}
                  >
                    <option value="DAILY">Daily Rate</option>
                    <option value="MONTHLY">Monthly Rate</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Salary Frequency</label>
                  <select
                    className={selectCls}
                    value={compForm.frequency}
                    onChange={(e) => setCompForm((p) => ({ ...p, frequency: e.target.value as SalaryFrequency }))}
                  >
                    <option value="ONCE_A_MONTH">Once a Month</option>
                    <option value="TWICE_A_MONTH">Twice a Month</option>
                    <option value="WEEKLY">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Pay Type</label>
                  <select
                    className={selectCls}
                    value={compForm.payType}
                    onChange={(e) => setCompForm((p) => ({ ...p, payType: e.target.value as PayType }))}
                  >
                    <option value="VARIABLE_PAY">Variable Pay (Timesheet-based)</option>
                    <option value="FIXED_PAY">Fixed Pay (No timesheet needed)</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Disbursement Type</label>
                  <select
                    className={selectCls}
                    value={compForm.disbursementType}
                    onChange={(e) =>
                      setCompForm((p) => ({ ...p, disbursementType: e.target.value as DisbursementType }))
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="E_WALLET">E-Wallet</option>
                  </select>
                </div>
                {compForm.disbursementType !== 'CASH' && (
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Bank / Account Details</label>
                    <input
                      className={inputCls}
                      value={compForm.bankDetails}
                      onChange={(e) => setCompForm((p) => ({ ...p, bankDetails: e.target.value }))}
                      placeholder="Bank name, account number"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Section: Rest Days */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
                Rest Days Configuration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Paid on Rest Days</label>
                  <div className="flex gap-4 mt-1">
                    {([
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No (Default)' },
                    ] as const).map(({ value, label }) => (
                      <label key={label} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="cdv-isPaidRestDays"
                          checked={compForm.isPaidRestDays === value}
                          onChange={() => setCompForm((p) => ({ ...p, isPaidRestDays: value }))}
                          className="h-4 w-4 accent-blue-600"
                        />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Rest Days per Week</label>
                  <select
                    className={selectCls}
                    value={compForm.restDaysPerWeek}
                    onChange={(e) =>
                      setCompForm((p) => ({ ...p, restDaysPerWeek: parseInt(e.target.value, 10) }))
                    }
                  >
                    <option value={0}>0 rest days</option>
                    <option value={1}>1 rest day</option>
                    <option value={2}>2 rest days</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section: Government Benefits */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
                Government Benefits Registration
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* SSS */}
                <div>
                  <label className={labelCls}>SSS Registration</label>
                  <div className="flex gap-4 mt-1">
                    {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label }) => (
                      <label key={String(value)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cdv-deductSss" checked={compForm.deductSss === value}
                          onChange={() => setCompForm((p) => ({ ...p, deductSss: value }))}
                          className="h-4 w-4 accent-blue-600" />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {/* PhilHealth */}
                <div>
                  <label className={labelCls}>PhilHealth Registration</label>
                  <div className="flex gap-4 mt-1">
                    {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label }) => (
                      <label key={String(value)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cdv-deductPhilhealth" checked={compForm.deductPhilhealth === value}
                          onChange={() => setCompForm((p) => ({ ...p, deductPhilhealth: value }))}
                          className="h-4 w-4 accent-blue-600" />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                  {compForm.deductPhilhealth && (
                    <p className="text-[11px] text-muted-foreground mt-1.5">2.5% of monthly salary</p>
                  )}
                </div>
                {/* Pag-IBIG */}
                <div>
                  <label className={labelCls}>Pag-IBIG Registration</label>
                  <div className="flex gap-4 mt-1">
                    {([{ value: true, label: 'Yes' }, { value: false, label: 'No' }] as const).map(({ value, label }) => (
                      <label key={String(value)} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="cdv-deductPagibig" checked={compForm.deductPagibig === value}
                          onChange={() => setCompForm((p) => ({ ...p, deductPagibig: value }))}
                          className="h-4 w-4 accent-blue-600" />
                        <span className="text-sm text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                  {compForm.deductPagibig && (
                    <div className="mt-2 space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground">Contribution Type</p>
                      <div className="flex gap-4">
                        {([{ value: 'REGULAR', label: 'Regular (2%)' }, { value: 'MINIMUM', label: 'Minimum (₱200)' }] as const).map(({ value, label }) => (
                          <label key={value} className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="cdv-pagibigType" checked={compForm.pagibigType === value}
                              onChange={() => setCompForm((p) => ({ ...p, pagibigType: value }))}
                              className="h-4 w-4 accent-blue-600" />
                            <span className="text-sm text-foreground">{label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section: Calculated Rates (live preview) */}
            {baseRateNum > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
                  Calculated Rates (Preview)
                </p>
                <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 p-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Salary Basis</p>
                      <p className="text-sm font-bold text-foreground">
                        {compForm.rateType === 'DAILY' ? 'Daily Rate' : 'Monthly Rate'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">DOLE Factor</p>
                      <p className="text-sm font-bold text-foreground">{formFactor}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Daily Rate</p>
                      <p className="text-sm font-bold text-emerald-600">{fmtRate(formCalcDaily)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground">Monthly Rate (EEMR)</p>
                      <p className="text-sm font-bold text-emerald-600">{fmtRate(formCalcMonthly)}</p>
                    </div>
                  </div>
                  {allowanceNum > 0 && (
                    <div className="pt-2 border-t border-blue-200 dark:border-blue-800">
                      <p className="text-[11px] text-muted-foreground">Allowance</p>
                      <p className="text-sm font-bold text-foreground">{fmtRate(allowanceNum)}</p>
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Formula:{' '}
                    {compForm.rateType === 'DAILY'
                      ? `Monthly = (${fmtRate(formCalcDaily)} × ${formFactor}) ÷ 12`
                      : `Daily = (${fmtRate(formCalcMonthly)} × 12) ÷ ${formFactor}`}
                  </p>
                </div>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowCompForm(false)}
                disabled={compSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={() => { void handleSaveComp(); }}
                disabled={compSaving}
                className="gap-2"
              >
                {compSaving
                  ? 'Saving…'
                  : compensation
                    ? 'Update Compensation'
                    : 'Save Compensation'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
