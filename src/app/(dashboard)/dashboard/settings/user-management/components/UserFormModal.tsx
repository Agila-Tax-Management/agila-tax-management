// src/app/(dashboard)/dashboard/settings/user-management/components/UserFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type { UserRecord, PortalAccessEntry } from '@/lib/schemas/user-management';

/* ─── Types ──────────────────────────────────────────────────── */

interface EmployeeLevel {
  id: number;
  name: string;
  position: number;
  description: string | null;
}

/* ─── Constants ───────────────────────────────────────────────────── */

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

const PORTALS = [
  { key: 'SALES', label: 'Sales Portal' },
  { key: 'COMPLIANCE', label: 'Compliance Portal' },
  { key: 'LIAISON', label: 'Liaison Portal' },
  { key: 'ACCOUNTING', label: 'ACF Portal' },
  { key: 'OPERATIONS_MANAGEMENT', label: 'Operations Management Portal' },
  { key: 'HR', label: 'HR Portal' },
  { key: 'TASK_MANAGEMENT', label: 'Task Management Portal' },
  { key: 'CLIENT_RELATIONS', label: 'Client Relations Portal' },
] as const;

const PORTAL_ROLES = [
  { value: 'VIEWER', label: 'Viewer', description: 'Read-only access' },
  { value: 'USER', label: 'User', description: 'Standard operations (Maker)' },
  { value: 'ADMIN', label: 'Admin', description: 'Approvals & deletions (Checker)' },
  { value: 'SETTINGS', label: 'Settings', description: 'Full portal configuration' },
] as const;

type PortalRole = 'VIEWER' | 'USER' | 'ADMIN' | 'SETTINGS';

const GENDERS = ['Male', 'Female', 'Other'] as const;

/* ─── Types ───────────────────────────────────────────────────────── */

interface FormPortalAccess {
  enabled: boolean;
  role: PortalRole;
}

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingUser?: UserRecord | null;
}

/* ─── Helpers ───────────────────────────────────────────────────── */

function buildInitialPortals(
  existing?: PortalAccessEntry[]
): Record<string, FormPortalAccess> {
  const map: Record<string, FormPortalAccess> = {};
  for (const p of PORTALS) {
    const found = existing?.find((e) => e.portal === p.key);
    map[p.key] = found
      ? {
          enabled: true,
          role: found.role as PortalRole,
        }
      : {
          enabled: false,
          role: 'VIEWER',
        };
  }
  return map;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserFormModal({
  isOpen,
  onClose,
  onSaved,
  editingUser,
}: UserFormModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const isEdit = !!editingUser;

  // Employee levels fetched from API
  const [levels, setLevels] = useState<EmployeeLevel[]>([]);

  useEffect(() => {
    fetch('/api/admin/employee-levels')
      .then((r) => r.json())
      .then((json: { data?: EmployeeLevel[] }) => setLevels(json.data ?? []))
      .catch(() => { /* non-critical — dropdown will be empty */ });
  }, []);

  // User fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('EMPLOYEE');
  const [active, setActive] = useState(true);

  // Employee fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('Male');

  // Portal access
  const [portalAccess, setPortalAccess] = useState<Record<string, FormPortalAccess>>(
    buildInitialPortals()
  );

  // Employee level
  const [employeeLevelId, setEmployeeLevelId] = useState<number | null>(null);
  // Employee record active status (edit only)
  const [employeeActive, setEmployeeActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/editingUser changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setName(editingUser.name);
        setEmail(editingUser.email);
        setPassword('');
        setRole(editingUser.role);
        setActive(editingUser.active);
        setFirstName(editingUser.employee?.firstName ?? '');
        setMiddleName(editingUser.employee?.middleName ?? '');
        setLastName(editingUser.employee?.lastName ?? '');
        setPhone(editingUser.employee?.phone ?? '');
        setBirthDate(
          editingUser.employee?.birthDate
            ? editingUser.employee.birthDate.split('T')[0]
            : ''
        );
        setGender(editingUser.employee?.gender ?? 'Male');
        setEmployeeLevelId(editingUser.employee?.employment?.employeeLevelId ?? null);
        setEmployeeActive(editingUser.employee?.active ?? true);
        setPortalAccess(buildInitialPortals(editingUser.portalAccess));
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setRole('EMPLOYEE');
        setActive(true);
        setFirstName('');
        setMiddleName('');
        setLastName('');
        setPhone('');
        setBirthDate('');
        setGender('Male');
        setEmployeeLevelId(null);
        setEmployeeActive(true);
        setPortalAccess(buildInitialPortals());
      }
      setFieldErrors({});
    }
  }, [isOpen, editingUser]);

  // Auto-sync name from firstName + lastName
  function syncName(first: string, last: string): void {
    const full = [first, last].filter(Boolean).join(' ');
    setName(full);
  }

  /* ─── Validation ──────────────────────────────────────────── */

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) errors.firstName = 'First name is required';
    if (!lastName.trim()) errors.lastName = 'Last name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Invalid email address';
    if (!isEdit && !password) errors.password = 'Password is required';
    if (password && password.length < 8)
      errors.password = 'Password must be at least 8 characters';
    if (!phone.trim()) errors.phone = 'Phone is required';
    if (!birthDate) errors.birthDate = 'Birth date is required';
    if (!gender) errors.gender = 'Gender is required';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ─── Submit ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const accessPayload: PortalAccessEntry[] = Object.entries(portalAccess)
      .filter(([, flags]) => flags.enabled)
      .map(([portal, flags]) => ({
        portal,
        role: flags.role,
      }));

    const payload = {
      name: name.trim() || `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim().toLowerCase(),
      ...(password ? { password } : {}),
      role,
      active,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      birthDate,
      gender,
      employeeLevelId,
      ...(isEdit ? { employeeActive } : {}),
      portalAccess: accessPayload,
    };

    try {
      const url = isEdit
        ? `/api/admin/users/${editingUser!.id}`
        : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toastError(
          isEdit ? 'Update failed' : 'Creation failed',
          json.error ?? 'Something went wrong'
        );
        return;
      }

      success(
        isEdit ? 'User updated' : 'User created',
        `${firstName} ${lastName} has been ${isEdit ? 'updated' : 'created'} successfully.`
      );
      onSaved();
      onClose();
    } catch {
      toastError('Network error', 'Could not reach the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  /* ─── Portal toggle helpers ───────────────────────────────── */

  function togglePortalEnabled(key: string): void {
    setPortalAccess((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        enabled: !prev[key].enabled,
        role: prev[key].enabled ? 'VIEWER' : prev[key].role,
      },
    }));
  }

  function setPortalRole(portal: string, role: PortalRole): void {
    setPortalAccess((prev) => ({
      ...prev,
      [portal]: {
        ...prev[portal],
        role,
      },
    }));
  }

  /* ─── Render ──────────────────────────────────────────────── */

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit User' : 'Add User'}
      size="2xl"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
        {/* ─── Employee Info ────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Employee Information</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                First Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  syncName(e.target.value, lastName);
                }}
                placeholder="First name"
              />
              {fieldErrors.firstName && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Middle Name
              </label>
              <Input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Middle name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Last Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  syncName(firstName, e.target.value);
                }}
                placeholder="Last name"
              />
              {fieldErrors.lastName && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Phone <span className="text-rose-500">*</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09XXXXXXXXX"
              />
              {fieldErrors.phone && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Birth Date <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
              {fieldErrors.birthDate && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.birthDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {fieldErrors.gender && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.gender}</p>
              )}
            </div>

            <div className="sm:col-span-3">
              <label className="block text-sm font-medium text-foreground mb-1">
                Employee Level
              </label>
              <select
                value={employeeLevelId ?? ''}
                onChange={(e) => setEmployeeLevelId(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">— None —</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}{l.description ? ` — ${l.description}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ─── Employee Record Status (edit only) ──────────── */}
        {isEdit && editingUser?.employee && (
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Employee Record Status</p>
            <div
              className={`rounded-xl border p-4 transition ${
                employeeActive
                  ? 'border-emerald-300 bg-emerald-50/50 dark:border-emerald-600/40 dark:bg-emerald-950/20'
                  : 'border-rose-300 bg-rose-50/50 dark:border-rose-600/40 dark:bg-rose-950/20'
              }`}
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={employeeActive}
                  onChange={(e) => setEmployeeActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Employee record is {employeeActive ? 'active' : 'inactive'}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {employeeActive
                      ? 'This employee appears in HR management and compliance lists.'
                      : 'Inactive employees are hidden from HR lists. Re-activate to restore visibility.'}
                  </p>
                </div>
              </label>
              {editingUser.employee.softDelete && !employeeActive && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 pl-7">
                  This record was soft-deleted (e.g. via account deactivation). Check the box above to restore it.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ─── Account Info ─────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Account Information</p>          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Email <span className="text-rose-500">*</span>
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@agila.com"
              />
              {fieldErrors.email && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Password {!isEdit && <span className="text-rose-500">*</span>}
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Leave blank to keep current' : 'Min. 8 characters'}
              />
              {fieldErrors.password && (
                <p className="text-xs text-rose-500 mt-1">{fieldErrors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-foreground">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* ─── Portal Access ────────────────────────────────── */}
        <div>
          <p className="text-sm font-semibold text-foreground mb-3">Portal Access</p>
          <div className="space-y-3">
            {PORTALS.map((p) => {
              const flags = portalAccess[p.key];
              return (
                <div
                  key={p.key}
                  className={`rounded-xl border p-4 transition ${
                    flags.enabled
                      ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600/40 dark:bg-blue-950/20'
                      : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={flags.enabled}
                        onChange={() => togglePortalEnabled(p.key)}
                        className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-foreground">{p.label}</span>
                    </label>
                    {flags.enabled && (
                      <select
                        value={flags.role}
                        onChange={(e) => setPortalRole(p.key, e.target.value as PortalRole)}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {PORTAL_ROLES.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  {flags.enabled && (
                    <p className="text-xs text-muted-foreground mt-2 pl-6">
                      {PORTAL_ROLES.find((r) => r.value === flags.role)?.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Actions ──────────────────────────────────────── */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting
              ? isEdit
                ? 'Saving...'
                : 'Creating...'
              : isEdit
                ? 'Save Changes'
                : 'Create User'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
