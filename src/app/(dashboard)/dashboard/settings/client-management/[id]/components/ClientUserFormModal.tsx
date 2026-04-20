// src/app/(dashboard)/dashboard/settings/client-management/[id]/components/ClientUserFormModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type {
  ClientDetailUserFormValues,
  ClientPortalRole,
  ClientUserMember,
} from '@/types/client-management.types';

const ROLES: { value: ClientPortalRole; label: string }[] = [
  { value: 'OWNER', label: 'Owner' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'VIEWER', label: 'Viewer' },
];

const STATUSES = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
] as const;

function getInitialForm(editingUser?: ClientUserMember | null): ClientDetailUserFormValues {
  return {
    name: editingUser?.name ?? '',
    email: editingUser?.email ?? '',
    password: '',
    role: (editingUser?.role as ClientPortalRole) ?? 'OWNER',
    status: (editingUser?.status as ClientDetailUserFormValues['status']) ?? 'ACTIVE',
  };
}

interface ClientUserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: ClientDetailUserFormValues) => void;
  editingUser?: ClientUserMember | null;
}

export default function ClientUserFormModal({
  isOpen,
  onClose,
  onSave,
  editingUser,
}: ClientUserFormModalProps): React.ReactNode {
  const { error: toastError } = useToast();
  const syncKey = `${isOpen}-${editingUser?.id ?? 'new'}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  const [form, setForm] = useState<ClientDetailUserFormValues>(getInitialForm(editingUser));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (syncKey !== prevSyncKey) {
    setPrevSyncKey(syncKey);
    setForm(getInitialForm(editingUser));
    setFieldErrors({});
  }

  function set(key: keyof ClientDetailUserFormValues, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
  }

  function validate(): boolean {
    const errors: Record<string, string> = {};
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Invalid email address';
    }
    if (!editingUser && !form.password) {
      errors.password = 'Password is required for new users';
    } else if (form.password && form.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toastError('Validation failed', 'Please check the form for errors.');
      return false;
    }
    return true;
  }

  function handleSubmit(): void {
    if (!validate()) return;
    onSave(form);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? 'Edit User' : 'Add New User'}
      size="md"
    >
      <div className="space-y-4 p-6">
        {/* Name */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Full Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Juan dela Cruz"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="e.g. juan@example.com"
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Password {!editingUser && <span className="text-red-500">*</span>}
          </label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder={editingUser ? 'Leave blank to keep unchanged' : 'Min. 8 characters'}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
          )}
        </div>

        {/* Role + Status */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Portal Role
            </label>
            <select
              value={form.role}
              onChange={(e) => set('role', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-border pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {editingUser ? 'Save Changes' : 'Add User'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
