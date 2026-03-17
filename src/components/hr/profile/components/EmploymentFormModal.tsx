// src/components/hr/profile/components/EmploymentFormModal.tsx
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { EmploymentRecord } from '../profile-types';

interface IdNameOption { id: number; name: string; }
interface ManagerOption { id: number; fullName: string; }

interface EmploymentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employeeId: number;
  employeeNo?: string | null;
  departmentOptions: IdNameOption[];
  levelOptions: IdNameOption[];
  managerOptions: ManagerOption[];
  employment: EmploymentRecord | null;
}

interface FormState {
  employeeNo: string;
  clientId: string;
  departmentId: string;
  positionId: string;
  employeeLevelId: string;
  employmentType: string;
  employmentStatus: string;
  hireDate: string;
  regularizationDate: string;
  endDate: string;
  reportingManagerId: string;
}

const DEFAULT_FORM: FormState = {
  employeeNo: '',
  clientId: '1',
  departmentId: '',
  positionId: '',
  employeeLevelId: '',
  employmentType: '',
  employmentStatus: 'ACTIVE',
  hireDate: '',
  regularizationDate: '',
  endDate: '',
  reportingManagerId: '',
};

function recordToForm(r: EmploymentRecord, employeeNo?: string | null): FormState {
  return {
    employeeNo: employeeNo ?? '',
    clientId: String(r.clientId),
    departmentId: r.departmentId ? String(r.departmentId) : '',
    positionId: r.positionId ? String(r.positionId) : '',
    employeeLevelId: r.employeeLevelId ? String(r.employeeLevelId) : '',
    employmentType: r.employmentType ?? '',
    employmentStatus: r.status ?? 'ACTIVE',
    hireDate: r.hireDate ? r.hireDate.slice(0, 10) : '',
    regularizationDate: r.regularizationDate ? r.regularizationDate.slice(0, 10) : '',
    endDate: r.endDate ? r.endDate.slice(0, 10) : '',
    reportingManagerId: r.reportingManagerId ? String(r.reportingManagerId) : '',
  };
}

const EMPLOYMENT_TYPES = [
  { value: 'REGULAR', label: 'Regular' },
  { value: 'PROBATIONARY', label: 'Probationary' },
  { value: 'CONTRACTUAL', label: 'Contractual' },
  { value: 'PROJECT_BASED', label: 'Project-Based' },
  { value: 'PART_TIME', label: 'Part-Time' },
  { value: 'INTERN', label: 'Intern' },
];

const EMPLOYMENT_STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'RESIGNED', label: 'Resigned' },
  { value: 'TERMINATED', label: 'Terminated' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'RETIRED', label: 'Retired' },
];

const INPUT_CLASS = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';
const SELECT_CLASS = 'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

export function EmploymentFormModal({
  isOpen, onClose, onSaved, employeeId, employeeNo,
  departmentOptions, levelOptions, managerOptions, employment,
}: EmploymentFormModalProps): React.ReactNode {
  const { success, error } = useToast();
  const isEditMode = employment !== null;

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [positionOptions, setPositionOptions] = useState<{ id: number; title: string }[]>([]);

  // Reset form when modal opens (adjust state during render — no setState in useEffect)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setForm(employment ? recordToForm(employment, employeeNo) : { ...DEFAULT_FORM, employeeNo: employeeNo ?? '' });
      setPositionOptions([]);
    }
  }

  const fetchPositions = useCallback(async (deptId: string) => {
    if (!deptId) { setPositionOptions([]); return; }
    try {
      const res = await fetch(`/api/hr/positions?departmentId=${deptId}`);
      if (!res.ok) return;
      const json = (await res.json()) as { data: { id: number; title: string }[] };
      setPositionOptions(json.data ?? []);
    } catch { /* ignore */ }
  }, []);

  // Load positions for the pre-selected department when modal opens in edit mode
  useEffect(() => {
    if (!isOpen) return;
    const deptId = employment?.departmentId ? String(employment.departmentId) : '';
    if (deptId) void fetchPositions(deptId);
  }, [isOpen, employment?.departmentId, fetchPositions]);

  const handleDeptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    setForm((prev) => ({ ...prev, departmentId: deptId, positionId: '' }));
    void fetchPositions(deptId);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Update employee number on the Employee record first
      const employeeNoChanged = form.employeeNo.trim() !== (employeeNo ?? '');
      if (employeeNoChanged) {
        const empNoRes = await fetch(`/api/hr/employees/${employeeId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeNo: form.employeeNo.trim() || null }),
        });
        const empNoData = (await empNoRes.json()) as { error?: string };
        if (!empNoRes.ok) {
          error('Failed to update employee no.', empNoData.error ?? 'An error occurred.');
          return;
        }
      }

      const payload = {
        clientId: parseInt(form.clientId, 10) || 1,
        departmentId: form.departmentId ? parseInt(form.departmentId, 10) : null,
        positionId: form.positionId ? parseInt(form.positionId, 10) : null,
        employeeLevelId: form.employeeLevelId ? parseInt(form.employeeLevelId, 10) : null,
        employmentType: form.employmentType || null,
        employeeStatus: form.employmentStatus || null,
        hireDate: form.hireDate || null,
        regularizationDate: form.regularizationDate || null,
        endDate: form.endDate || null,
        reportingManagerId: form.reportingManagerId ? parseInt(form.reportingManagerId, 10) : null,
      };
      const url = isEditMode
        ? `/api/hr/employees/${employeeId}/employment?employmentId=${employment.id}`
        : `/api/hr/employees/${employeeId}/employment`;
      const res = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error(
          isEditMode ? 'Failed to update employment' : 'Failed to add employment',
          data.error ?? 'An error occurred.',
        );
        return;
      }
      success(
        isEditMode ? 'Employment updated' : 'Employment added',
        isEditMode ? 'Employment record has been updated.' : 'Employment record has been created.',
      );
      onSaved();
      onClose();
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
      title={isEditMode ? 'Edit Employment Record' : 'Add Employment Record'}
      size="lg"
    >
      <div className="space-y-5 p-4">
        <p className="text-sm text-muted-foreground">
          {isEditMode
            ? 'Update the employment details for this record.'
            : 'Fill in the details to create a new employment record.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No.</label>
            <input
              type="text"
              className={INPUT_CLASS}
              placeholder="e.g. EMP-001"
              value={form.employeeNo}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeNo: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Client / Company</label>
            <div className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-muted-foreground select-none">
              Agila Tax Management Services (ATMS)
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
            <select className={SELECT_CLASS} value={form.departmentId} onChange={handleDeptChange}>
              <option value="">Select department</option>
              {departmentOptions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Position</label>
            <select
              className={SELECT_CLASS}
              value={form.positionId}
              onChange={(e) => setForm((prev) => ({ ...prev, positionId: e.target.value }))}
              disabled={!form.departmentId}
            >
              <option value="">Select position</option>
              {positionOptions.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Type</label>
            <select
              className={SELECT_CLASS}
              value={form.employmentType}
              onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))}
            >
              <option value="">Select type</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employment Status</label>
            <select
              className={SELECT_CLASS}
              value={form.employmentStatus}
              onChange={(e) => setForm((prev) => ({ ...prev, employmentStatus: e.target.value }))}
            >
              {EMPLOYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee Level</label>
            <select
              className={SELECT_CLASS}
              value={form.employeeLevelId}
              onChange={(e) => setForm((prev) => ({ ...prev, employeeLevelId: e.target.value }))}
            >
              <option value="">Select level</option>
              {levelOptions.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Reporting Manager</label>
            <select
              className={SELECT_CLASS}
              value={form.reportingManagerId}
              onChange={(e) => setForm((prev) => ({ ...prev, reportingManagerId: e.target.value }))}
            >
              <option value="">Select manager</option>
              {managerOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Hire Date</label>
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.hireDate}
              onChange={(e) => setForm((prev) => ({ ...prev, hireDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Regularization Date</label>
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.regularizationDate}
              onChange={(e) => setForm((prev) => ({ ...prev, regularizationDate: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">End Date</label>
            <input
              type="date"
              className={INPUT_CLASS}
              value={form.endDate}
              onChange={(e) => setForm((prev) => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => { void handleSubmit(); }}
            disabled={saving}
          >
            {saving
              ? (isEditMode ? 'Updating...' : 'Adding...')
              : (isEditMode ? 'Update Employment' : 'Add Employment')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
