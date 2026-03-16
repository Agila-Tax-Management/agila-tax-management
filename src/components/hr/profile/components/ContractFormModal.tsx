// src/components/hr/profile/components/ContractFormModal.tsx
'use client';

import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { ContractRecord, EmploymentRecord } from '../profile-types';

interface ContractFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeId: number;
  employmentRecords: EmploymentRecord[];
  scheduleOptions: { id: number; name: string }[];
  contract: ContractRecord | null; // null = add mode, non-null = edit mode
}

interface ContractFormLocal {
  employmentId: string;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string;
  monthlyRate: string;
  dailyRate: string;
  hourlyRate: string;
  disbursedMethod: string;
  scheduleId: string;
  workingHoursPerWeek: string;
  bankDetails: string;
  notes: string;
}

const DEFAULT_FORM: ContractFormLocal = {
  employmentId: '',
  contractType: 'PROBATIONARY',
  status: 'DRAFT',
  startDate: '',
  endDate: '',
  monthlyRate: '',
  dailyRate: '',
  hourlyRate: '',
  disbursedMethod: '',
  scheduleId: '',
  workingHoursPerWeek: '',
  bankDetails: '',
  notes: '',
};

function mapToForm(c: ContractRecord): ContractFormLocal {
  return {
    employmentId: String(c.employmentId),
    contractType: c.contractType,
    status: c.status,
    startDate: c.startDate ? c.startDate.slice(0, 10) : '',
    endDate: c.endDate ? c.endDate.slice(0, 10) : '',
    monthlyRate: c.monthlyRate ?? '',
    dailyRate: c.dailyRate ?? '',
    hourlyRate: c.hourlyRate ?? '',
    disbursedMethod: c.disbursedMethod ?? '',
    scheduleId: c.scheduleId ? String(c.scheduleId) : '',
    workingHoursPerWeek: c.workingHoursPerWeek ? String(c.workingHoursPerWeek) : '',
    bankDetails: c.bankDetails ?? '',
    notes: c.notes ?? '',
  };
}

const modalInputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30';
const modalSelectClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

export function ContractFormModal({
  isOpen, onClose, onSaved, employeeId, employmentRecords, scheduleOptions, contract,
}: ContractFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<ContractFormLocal>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);

  // Adjust state during render (React pattern — avoids setState in useEffect)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(contract ? mapToForm(contract) : DEFAULT_FORM);
    }
  }

  const set = <K extends keyof ContractFormLocal>(key: K, value: ContractFormLocal[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const isEditMode = contract !== null;

  const handleSave = async () => {
    if (!form.startDate) {
      error('Missing fields', 'Contract start date is required.');
      return;
    }
    if (!isEditMode && !form.employmentId) {
      error('Missing fields', 'Please select an employment record.');
      return;
    }
    setSaving(true);
    try {
      let res: Response;
      if (isEditMode) {
        res = await fetch(`/api/hr/employees/${employeeId}/contract?contractId=${contract.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contractType: form.contractType,
            status: form.status,
            contractStart: form.startDate,
            contractEnd: form.endDate || null,
            monthlyRate: form.monthlyRate || null,
            dailyRate: form.dailyRate || null,
            hourlyRate: form.hourlyRate || null,
            disbursedMethod: form.disbursedMethod || null,
            workingHoursPerWeek: form.workingHoursPerWeek ? parseInt(form.workingHoursPerWeek, 10) : null,
            scheduleId: form.scheduleId ? parseInt(form.scheduleId, 10) : null,
            bankDetails: form.bankDetails || null,
            notes: form.notes || null,
          }),
        });
      } else {
        res = await fetch(`/api/hr/employees/${employeeId}/contract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employmentId: parseInt(form.employmentId, 10),
            contractType: form.contractType,
            status: form.status,
            contractStart: form.startDate,
            contractEnd: form.endDate || null,
            monthlyRate: form.monthlyRate || null,
            dailyRate: form.dailyRate || null,
            hourlyRate: form.hourlyRate || null,
            disbursedMethod: form.disbursedMethod || null,
            workingHoursPerWeek: form.workingHoursPerWeek ? parseInt(form.workingHoursPerWeek, 10) : null,
            scheduleId: form.scheduleId ? parseInt(form.scheduleId, 10) : null,
            bankDetails: form.bankDetails || null,
            notes: form.notes || null,
          }),
        });
      }
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error(
          isEditMode ? 'Failed to update contract' : 'Failed to save contract',
          data.error ?? 'An error occurred.',
        );
        return;
      }
      success(
        isEditMode ? 'Contract updated' : 'Contract saved',
        isEditMode ? 'Contract details have been updated.' : 'Employee contract has been added.',
      );
      onSaved();
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Contract' : 'Add Contract'}
      size="xl"
    >
      <div className="p-6 space-y-5">
        {/* Employment selector — only shown in add mode */}
        {!isEditMode && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Employment Record <span className="text-red-500">*</span>
            </label>
            <select
              className={modalSelectClass}
              value={form.employmentId}
              onChange={(e) => set('employmentId', e.target.value)}
            >
              <option value="">Select employment</option>
              {employmentRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.position || 'Role'} · {r.department || r.clientName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Contract Type <span className="text-red-500">*</span>
            </label>
            <select className={modalSelectClass} value={form.contractType} onChange={(e) => set('contractType', e.target.value)}>
              <option value="PROBATIONARY">Probationary</option>
              <option value="REGULAR">Regular</option>
              <option value="CONTRACTUAL">Contractual</option>
              <option value="PROJECT_BASED">Project Based</option>
              <option value="CONSULTANT">Consultant</option>
              <option value="INTERN">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Contract Status <span className="text-red-500">*</span>
            </label>
            <select className={modalSelectClass} value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRED">Expired</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={modalInputClass}
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
            <input
              type="date"
              className={modalInputClass}
              value={form.endDate}
              onChange={(e) => set('endDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Monthly Rate (₱)</label>
            <input
              type="number"
              className={modalInputClass}
              value={form.monthlyRate}
              onChange={(e) => set('monthlyRate', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Daily Rate (₱)</label>
            <input
              type="number"
              className={modalInputClass}
              value={form.dailyRate}
              onChange={(e) => set('dailyRate', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hourly Rate (₱)</label>
            <input
              type="number"
              className={modalInputClass}
              value={form.hourlyRate}
              onChange={(e) => set('hourlyRate', e.target.value)}
              placeholder="0.00"
              min="0"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Disbursement Method</label>
            <select className={modalSelectClass} value={form.disbursedMethod} onChange={(e) => set('disbursedMethod', e.target.value)}>
              <option value="">Select method</option>
              <option value="CASH_SALARY">Cash Salary</option>
              <option value="FUND_TRANSFER">Fund Transfer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Work Schedule</label>
            <select className={modalSelectClass} value={form.scheduleId} onChange={(e) => set('scheduleId', e.target.value)}>
              <option value="">No schedule assigned</option>
              {scheduleOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Working Hours / Week</label>
            <input
              type="number"
              className={modalInputClass}
              value={form.workingHoursPerWeek}
              onChange={(e) => set('workingHoursPerWeek', e.target.value)}
              placeholder="40"
              min="1"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Bank Details</label>
            <input
              type="text"
              className={modalInputClass}
              value={form.bankDetails}
              onChange={(e) => set('bankDetails', e.target.value)}
              placeholder="Bank name, account number"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
            <textarea
              className={`${modalInputClass} min-h-24 resize-none`}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => { void handleSave(); }} disabled={saving} className="gap-2">
            <Save size={14} /> {isEditMode ? 'Update Contract' : 'Save Contract'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
