'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface ContractSettingsState {
  defaultContractType: 'Permanent' | 'Probationary' | 'Project-Based' | 'Contractual';
  probationPeriodMonths: number;
  noticePeriodDays: number;
  renewalReminderDays: number;
  requireNda: boolean;
  autoGenerateContractNumber: boolean;
}

const INITIAL_STATE: ContractSettingsState = {
  defaultContractType: 'Permanent',
  probationPeriodMonths: 6,
  noticePeriodDays: 30,
  renewalReminderDays: 15,
  requireNda: true,
  autoGenerateContractNumber: true,
};

export function ContractsSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<ContractSettingsState>(INITIAL_STATE);

  const handleSave = () => {
    if (form.probationPeriodMonths < 0 || form.noticePeriodDays < 0 || form.renewalReminderDays < 0) {
      error('Failed to save', 'Numeric values must be zero or higher.');
      return;
    }

    success('Contract settings updated', 'Contract policy defaults have been saved.');
  };

  return (
    <Card className="p-6 sm:p-7 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">Contracts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Define default rules and behavior for employee contracts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-semibold text-foreground">
          Default Contract Type
          <select
            value={form.defaultContractType}
            onChange={(event) => setForm((prev) => ({
              ...prev,
              defaultContractType: event.target.value as ContractSettingsState['defaultContractType'],
            }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="Permanent">Permanent</option>
            <option value="Probationary">Probationary</option>
            <option value="Project-Based">Project-Based</option>
            <option value="Contractual">Contractual</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-foreground">
          Probation Period (months)
          <input
            type="number"
            min={0}
            value={form.probationPeriodMonths}
            onChange={(event) => setForm((prev) => ({ ...prev, probationPeriodMonths: Number(event.target.value) || 0 }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>

        <label className="text-sm font-semibold text-foreground">
          Notice Period (days)
          <input
            type="number"
            min={0}
            value={form.noticePeriodDays}
            onChange={(event) => setForm((prev) => ({ ...prev, noticePeriodDays: Number(event.target.value) || 0 }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>

        <label className="text-sm font-semibold text-foreground">
          Renewal Reminder (days before end)
          <input
            type="number"
            min={0}
            value={form.renewalReminderDays}
            onChange={(event) => setForm((prev) => ({ ...prev, renewalReminderDays: Number(event.target.value) || 0 }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, requireNda: !prev.requireNda }))}
          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
            form.requireNda
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <p className="text-sm font-bold">Require NDA by default</p>
          <p className="text-xs mt-1">{form.requireNda ? 'Enabled' : 'Disabled'}</p>
        </button>

        <button
          type="button"
          onClick={() => setForm((prev) => ({ ...prev, autoGenerateContractNumber: !prev.autoGenerateContractNumber }))}
          className={`rounded-lg border px-4 py-3 text-left transition-colors ${
            form.autoGenerateContractNumber
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-border bg-card text-muted-foreground'
          }`}
        >
          <p className="text-sm font-bold">Auto-generate contract number</p>
          <p className="text-xs mt-1">{form.autoGenerateContractNumber ? 'Enabled' : 'Disabled'}</p>
        </button>
      </div>

      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSave}>
          Save Contract Settings
        </Button>
      </div>
    </Card>
  );
}
