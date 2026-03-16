// src/components/hr/profile/components/ContractsTab.tsx
'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { ContractFormState, ContractRecord, ContractTypeOption, EmploymentRecord, PayMethodOption } from '../profile-types';

interface ContractsTabProps {
  contractForm: ContractFormState;
  contracts: ContractRecord[];
  employmentRecords: EmploymentRecord[];
  selectClass: string;
  inputClass: string;
  statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'>;
  onFieldChange: <K extends keyof ContractFormState>(key: K, value: ContractFormState[K]) => void;
  onSave: () => void;
}

export function ContractsTab({
  contractForm,
  contracts,
  employmentRecords,
  selectClass,
  inputClass,
  statusVariant,
  onFieldChange,
  onSave,
}: ContractsTabProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">Contracts</h2>
            <p className="text-sm text-muted-foreground mt-1">Maintain legal agreement records for the selected employment.</p>
          </div>
          <Badge variant="warning">Add Contract</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Record</label>
            <select className={selectClass} value={contractForm.employmentId} onChange={(event) => onFieldChange('employmentId', event.target.value)}>
              {employmentRecords.map((record) => (
                <option key={record.id} value={record.id}>
                  {record.position} · {record.department}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contract Type</label>
            <select
              className={selectClass}
              value={contractForm.contractType}
              onChange={(event) => onFieldChange('contractType', event.target.value as ContractTypeOption)}
            >
              <option>Probationary</option>
              <option>Regular</option>
              <option>Contractual</option>
              <option>Project Based</option>
              <option>Consultant</option>
              <option>Intern</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Start Date</label>
            <input type="date" className={inputClass} value={contractForm.startDate} onChange={(event) => onFieldChange('startDate', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
            <input type="date" className={inputClass} value={contractForm.endDate} onChange={(event) => onFieldChange('endDate', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Salary (Monthly)</label>
            <input type="text" className={inputClass} value={contractForm.salary} onChange={(event) => onFieldChange('salary', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Pay Method</label>
            <select
              className={selectClass}
              value={contractForm.payMethod}
              onChange={(event) => onFieldChange('payMethod', event.target.value as PayMethodOption)}
            >
              <option>Cash Salary</option>
              <option>Fund Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Working Hours</label>
            <input type="text" className={inputClass} value={contractForm.workHours} onChange={(event) => onFieldChange('workHours', event.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
            <textarea className={`${inputClass} min-h-28 resize-none`} value={contractForm.notes} onChange={(event) => onFieldChange('notes', event.target.value)} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={onSave}>
            <Save size={16} /> Save Contract
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Contract Records</h3>
        <div className="space-y-3">
          {contracts.map((contract) => (
            <div key={contract.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{contract.contractType}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contract.startDate} - {contract.endDate || 'Open-ended'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Salary: {contract.salary} · {contract.payMethod} · {contract.workHours}
                  </p>
                </div>
                <Badge variant={statusVariant[contract.status] ?? 'neutral'}>{contract.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
