// src/components/user-management/UserFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type { UserRecord, PortalAccessEntry } from '@/lib/schemas/user-management';

/* ─── Constants ───────────────────────────────────────────────────── */

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

const PORTALS = [
  { key: 'SALES',          label: 'Sales Portal'           },
  { key: 'COMPLIANCE',     label: 'Compliance Portal'       },
  { key: 'LIAISON',        label: 'Liaison Portal'          },
  { key: 'ACCOUNTING',     label: 'Accounting Portal'       },
  { key: 'ACCOUNT_OFFICER',label: 'Account Officer Portal'  },
  { key: 'HR',             label: 'HR Portal'               },
] as const;

const PERMISSIONS = ['canRead', 'canWrite', 'canEdit', 'canDelete'] as const;

const PERM_LABELS: Record<string, string> = {
  canRead: 'Read', canWrite: 'Write', canEdit: 'Edit', canDelete: 'Delete',
};

/* ─── Types ───────────────────────────────────────────────────────── */
interface FormPortalAccess {
  enabled: boolean;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
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
      ? { enabled: true, canRead: found.canRead, canWrite: found.canWrite, canEdit: found.canEdit, canDelete: found.canDelete }
      : { enabled: false, canRead: false, canWrite: false, canEdit: false, canDelete: false };
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

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('EMPLOYEE');
  const [active, setActive] = useState(true);
  const [portalAccess, setPortalAccess] = useState<Record<string, FormPortalAccess>>(buildInitialPortals());
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens or editingUser changes
  useEffect(() => {
    if (isOpen) {
      if (editingUser) {
        setName(editingUser.name);
        setEmail(editingUser.email);
        setPassword('');
        setRole(editingUser.role);
        setActive(editingUser.active);
        setPortalAccess(buildInitialPortals(editingUser.employee ? editingUser.portalAccess : []));
      } else {
        setName('');
        setEmail('');
        setPassword('');
        setRole('EMPLOYEE');
        setActive(true);
        setPortalAccess(buildInitialPortals());
      }
      setFieldErrors({});
    }
  }, [isOpen, editingUser]);

  /* ─── Validation ──────────────────────────────────────────── */

  function validate(): boolean {
    const errors: Record<string, string> = {};

    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errors.email = 'Invalid email address';

    if (!isEdit && !password) errors.password = 'Password is required';
    if (password && password.length < 8)
      errors.password = 'Password must be at least 8 characters';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /* ─── Submit ──────────────────────────────────────────────── */

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);

    const hasEmployee = isEdit && !!editingUser?.employee;

    const accessPayload: PortalAccessEntry[] = hasEmployee
      ? Object.entries(portalAccess)
          .filter(([, flags]) => flags.enabled)
          .map(([portal, flags]) => ({
            portal,
            canRead: flags.canRead,
            canWrite: flags.canWrite,
            canEdit: flags.canEdit,
            canDelete: flags.canDelete,
          }))
      : [];

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      ...(password ? { password } : {}),
      role,
      active,
      ...(hasEmployee ? { portalAccess: accessPayload } : {}),
    };

    try {
      const url = isEdit ? `/api/admin/users/${editingUser!.id}` : '/api/admin/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toastError(isEdit ? 'Update failed' : 'Creation failed', json.error ?? 'Something went wrong');
        return;
      }

      success(
        isEdit ? 'User updated' : 'User created',
        `${name} has been ${isEdit ? 'updated' : 'created'} successfully.`
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
        ...(!prev[key].enabled ? {} : { canRead: false, canWrite: false, canEdit: false, canDelete: false }),
      },
    }));
  }

  function togglePermission(portal: string, perm: string): void {
    setPortalAccess((prev) => ({
      ...prev,
      [portal]: {
        ...prev[portal],
        [perm]: !prev[portal][perm as keyof FormPortalAccess],
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
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-rose-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
            {fieldErrors.name && (
              <p className="text-xs text-rose-500 mt-1">{fieldErrors.name}</p>
            )}
          </div>

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
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-foreground">Active</span>
        </label>

        {/* Portal Access */}
        {role === 'EMPLOYEE' && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Portal Access</p>

            {/* State 1 — Creating a new user */}
            {!isEdit && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-700/40 dark:bg-blue-950/20 p-4">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-400">Portal access not yet assigned</p>
                <p className="text-xs text-blue-700 dark:text-blue-500 mt-1">
                  After creating this user, HR must link them to an employee record.
                  Once linked, portal access can be configured here by admins.
                </p>
              </div>
            )}

            {/* State 2 — Editing, no employee linked */}
            {isEdit && !editingUser?.employee && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-700/40 dark:bg-amber-950/20 p-4">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-400">No employee record linked</p>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  HR must link this user to an employee record before portal access can be managed.
                </p>
              </div>
            )}

            {/* State 3 — Editing, employee is linked */}
            {isEdit && editingUser?.employee && (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Linked employee: <span className="font-semibold text-foreground">{editingUser.employee.firstName} {editingUser.employee.lastName}</span>
                  {editingUser.employee.employeeNo && <span className="ml-1 text-muted-foreground">({editingUser.employee.employeeNo})</span>}
                </p>
                <div className="space-y-3">
                  {PORTALS.map((p) => {
                    const flags = portalAccess[p.key];
                    return (
                      <div
                        key={p.key}
                        className={`rounded-xl border p-4 transition ${
                          flags.enabled
                            ? 'border-blue-300 bg-blue-50/50 dark:border-blue-600/40 dark:bg-blue-950/30'
                            : 'border-border hover:bg-muted/50'
                        }`}
                      >
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={flags.enabled}
                            onChange={() => togglePortalEnabled(p.key)}
                            className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-foreground">{p.label}</span>
                        </label>
                        {flags.enabled && (
                          <div className="flex flex-wrap gap-4 mt-3 pl-6">
                            {PERMISSIONS.map((perm) => (
                              <label key={perm} className="flex items-center gap-1.5 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={flags[perm]}
                                  onChange={() => togglePermission(p.key, perm)}
                                  className="w-3.5 h-3.5 rounded border-border text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs text-muted-foreground">{PERM_LABELS[perm]}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Actions */}
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
