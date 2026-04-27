// src/app/(dashboard)/dashboard/settings/user-management/components/UserAddEmployeeModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type { UserRecord } from '@/lib/schemas/user-management';

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserAddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  user: UserRecord | null;
}

/* ─── Form state ──────────────────────────────────────────────────── */

interface EmployeeFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  birthDate: string;
  phone: string;
  employeeNo: string;
}

const DEFAULT_FORM: EmployeeFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  gender: '',
  birthDate: '',
  phone: '',
  employeeNo: '',
};

/* ─── Shared input styles ─────────────────────────────────────────── */

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1';

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserAddEmployeeModal({
  isOpen,
  onClose,
  onSaved,
  user,
}: UserAddEmployeeModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EmployeeFormData>(DEFAULT_FORM);

  // Reset form when modal opens (adjust-state-during-render pattern)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen && user) {
      // Pre-fill name from the user record
      const nameParts = user.name.trim().split(' ');
      setForm({
        ...DEFAULT_FORM,
        firstName: nameParts[0] ?? '',
        lastName: nameParts.length > 1 ? (nameParts[nameParts.length - 1] ?? '') : '',
        middleName: nameParts.length > 2 ? nameParts.slice(1, -1).join(' ') : '',
      });
    }
  }

  if (!user) return null;

  function set(field: keyof EmployeeFormData, value: string): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(): Promise<void> {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toastError('Missing fields', 'First name and last name are required.');
      return;
    }
    if (!form.gender) {
      toastError('Missing field', 'Gender is required.');
      return;
    }
    if (!form.birthDate) {
      toastError('Missing field', 'Birth date is required.');
      return;
    }
    if (!form.phone.trim()) {
      toastError('Missing field', 'Phone number is required.');
      return;
    }

    setSaving(true);
    if (!user) return;
    try {
      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || null,
          lastName: form.lastName.trim(),
          gender: form.gender,
          birthDate: form.birthDate,
          phone: form.phone.trim(),
          employeeNo: form.employeeNo.trim() || null,
          email: user.email,
          userId: user.id,
        }),
      });

      const json = (await res.json()) as { error?: string };

      if (!res.ok) {
        toastError('Failed to create employee', json.error ?? 'Something went wrong.');
        return;
      }

      success('Employee record created', `${form.firstName} ${form.lastName} has been linked to ${user?.name}.`);
      onSaved();
      onClose();
    } catch {
      toastError('Network error', 'Could not reach the server. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Employee Record" size="md">
      <div className="p-6 space-y-5">
        <p className="text-sm text-muted-foreground">
          Creating an employee record for{' '}
          <span className="font-semibold text-foreground">{user.name}</span>.
          The user account will be linked automatically.
        </p>

        {/* Name row */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>First Name <span className="text-rose-500">*</span></label>
            <Input
              value={form.firstName}
              onChange={(e) => set('firstName', e.target.value)}
              placeholder="e.g. Juan"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Middle Name</label>
            <Input
              value={form.middleName}
              onChange={(e) => set('middleName', e.target.value)}
              placeholder="Optional"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Last Name <span className="text-rose-500">*</span></label>
            <Input
              value={form.lastName}
              onChange={(e) => set('lastName', e.target.value)}
              placeholder="e.g. Dela Cruz"
              className={inputCls}
            />
          </div>
        </div>

        {/* Gender + Birth Date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Gender <span className="text-rose-500">*</span></label>
            <select
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              className={inputCls}
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Birth Date <span className="text-rose-500">*</span></label>
            <Input
              type="date"
              value={form.birthDate}
              onChange={(e) => set('birthDate', e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Phone + Employee No */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Phone <span className="text-rose-500">*</span></label>
            <Input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="e.g. 09171234567"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Employee No <span className="text-xs text-muted-foreground font-normal">(auto if blank)</span></label>
            <Input
              value={form.employeeNo}
              onChange={(e) => set('employeeNo', e.target.value)}
              placeholder="e.g. EMP-00042"
              className={inputCls}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Create Employee'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
