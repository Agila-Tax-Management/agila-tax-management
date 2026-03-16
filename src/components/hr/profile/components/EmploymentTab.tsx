// src/components/hr/profile/components/EmploymentTab.tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { EmploymentFormState, EmploymentRecord, EmploymentTypeOption } from '../profile-types';

interface EmploymentTabProps {
  employmentForm: EmploymentFormState;
  employmentRecords: EmploymentRecord[];
  selectClass: string;
  inputClass: string;
  statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger'>;
  departmentOptions: string[];
  teamOptions: string[];
  levelOptions: string[];
  reportingManagerOptions: string[];
  clientOptions: string[];
  onFieldChange: <K extends keyof EmploymentFormState>(key: K, value: EmploymentFormState[K]) => void;
  onSave: () => void;
}

export function EmploymentTab({
  employmentForm,
  employmentRecords,
  selectClass,
  inputClass,
  statusVariant,
  departmentOptions,
  teamOptions,
  levelOptions,
  reportingManagerOptions,
  clientOptions,
  onFieldChange,
  onSave,
}: EmploymentTabProps): React.ReactNode {
  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">Employment</h2>
            <p className="text-sm text-muted-foreground mt-1">Create and maintain employee job assignments.</p>
          </div>
          <Badge variant="info">Add Employment</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client</label>
            <select className={selectClass} value={employmentForm.client} onChange={(event) => onFieldChange('client', event.target.value)}>
              {clientOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
            <select className={selectClass} value={employmentForm.department} onChange={(event) => onFieldChange('department', event.target.value)}>
              {departmentOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
            <input type="text" className={inputClass} value={employmentForm.position} onChange={(event) => onFieldChange('position', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Team</label>
            <select className={selectClass} value={employmentForm.team} onChange={(event) => onFieldChange('team', event.target.value)}>
              {teamOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee Level</label>
            <select className={selectClass} value={employmentForm.employeeLevel} onChange={(event) => onFieldChange('employeeLevel', event.target.value)}>
              {levelOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Type</label>
            <select
              className={selectClass}
              value={employmentForm.employmentType}
              onChange={(event) => onFieldChange('employmentType', event.target.value as EmploymentTypeOption)}
            >
              <option>Regular</option>
              <option>Probationary</option>
              <option>Contractual</option>
              <option>Project Based</option>
              <option>Part Time</option>
              <option>Intern</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hire Date</label>
            <input type="date" className={inputClass} value={employmentForm.hireDate} onChange={(event) => onFieldChange('hireDate', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Regularization Date</label>
            <input
              type="date"
              className={inputClass}
              value={employmentForm.regularizationDate}
              onChange={(event) => onFieldChange('regularizationDate', event.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Reporting Manager</label>
            <select className={selectClass} value={employmentForm.reportingManager} onChange={(event) => onFieldChange('reportingManager', event.target.value)}>
              {reportingManagerOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={onSave}>
            <Plus size={16} /> Save
          </Button>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Employment History</h3>
        <div className="space-y-3">
          {employmentRecords.map((record) => (
            <div key={record.id} className="rounded-xl border border-border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{record.position}</p>
                  <p className="text-sm text-muted-foreground mt-1">{record.department} Department</p>
                  <p className="text-xs text-muted-foreground mt-1">{record.hireDate} - Present</p>
                </div>
                <Badge variant={statusVariant[record.status] ?? 'neutral'}>{record.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
