// src/app/(dashboard)/dashboard/settings/user-management/components/UserViewModal.tsx
'use client';

import React from 'react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { UserRecord } from '@/lib/schemas/user-management';
import { Pencil } from 'lucide-react';

/* ─── Constants ───────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

const PORTAL_LABELS: Record<string, string> = {
  SALES: 'Sales Portal',
  COMPLIANCE: 'Compliance Portal',
  LIAISON: 'Liaison Portal',
  ACCOUNTING: 'ACF Portal',
  OPERATIONS_MANAGEMENT: 'Operations Management Portal',
  HR: 'HR Portal',
  TASK_MANAGEMENT: 'Task Management Portal',
  CLIENT_RELATIONS: 'Client Relations Portal',
};

const ROLE_VARIANT: Record<string, 'info' | 'warning' | 'success' | 'neutral'> = {
  VIEWER: 'neutral',
  USER: 'info',
  ADMIN: 'warning',
  SETTINGS: 'success',
};

const ROLE_DESC: Record<string, string> = {
  VIEWER: 'Read-only access',
  USER: 'Standard operations (Maker)',
  ADMIN: 'Approvals & deletions (Checker)',
  SETTINGS: 'Full portal configuration',
};

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
  onEdit: (user: UserRecord) => void;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserViewModal({
  isOpen,
  onClose,
  user,
  onEdit,
}: UserViewModalProps): React.ReactNode {
  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
      <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:text-blue-300 flex items-center justify-center text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-bold text-foreground truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={user.active ? 'success' : 'danger'}>
              {user.active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        </div>

        {/* Employee Info Grid */}
        {user.employee && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Employee Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Employee No.', value: user.employee.employeeNo ?? '—' },
                { label: 'First Name', value: user.employee.firstName },
                { label: 'Middle Name', value: user.employee.middleName ?? '—' },
                { label: 'Last Name', value: user.employee.lastName },
                { label: 'Phone', value: user.employee.phone },
                { label: 'Gender', value: user.employee.gender },
                {
                  label: 'Birth Date',
                  value: user.employee.birthDate
                    ? new Date(user.employee.birthDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—',
                },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {f.label}
                  </p>
                  <p className="text-sm text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Employment Info */}
        {user.employee?.employment && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Employment</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Department', value: user.employee.employment.department ?? '—' },
                { label: 'Position', value: user.employee.employment.position ?? '—' },
                { label: 'Type', value: user.employee.employment.employmentType ?? '—' },
                { label: 'Status', value: user.employee.employment.employmentStatus },
                { label: 'Level', value: user.employee.employment.employeeLevel ?? '—' },
                {
                  label: 'Hire Date',
                  value: user.employee.employment.hireDate
                    ? new Date(user.employee.employment.hireDate).toLocaleDateString('en-PH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    : '—',
                },
              ].map((f) => (
                <div key={f.label} className="space-y-0.5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {f.label}
                  </p>
                  <p className="text-sm text-foreground">{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Info */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Email Verified
              </p>
              <p className="text-sm text-foreground">{user.emailVerified ? 'Yes' : 'No'}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Created
              </p>
              <p className="text-sm text-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Last Updated
              </p>
              <p className="text-sm text-foreground">
                {new Date(user.updatedAt).toLocaleDateString('en-PH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Portal Access */}
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Portal Access</h4>

          {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
            <div className="p-3 rounded-xl border border-border bg-muted/30 mb-3">
              <p className="text-sm text-muted-foreground">
                {user.role === 'SUPER_ADMIN'
                  ? 'Super Admins have full settings-level access to all portals.'
                  : 'Admins have admin-level access to all portals by default.'}
              </p>
            </div>
          )}

          {user.portalAccess.length === 0 && user.role === 'EMPLOYEE' ? (
            <p className="text-sm text-muted-foreground">No portal access configured.</p>
          ) : (
            <div className="space-y-2">
              {user.portalAccess.map((access) => (
                <div
                  key={access.portal}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-border bg-muted/30"
                >
                  <span className="text-sm font-medium text-foreground">
                    {PORTAL_LABELS[access.portal] ?? access.portal}
                  </span>
                  <div className="flex flex-col sm:items-end gap-1">
                    <Badge variant={ROLE_VARIANT[access.role] ?? 'neutral'}>
                      {access.role}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_DESC[access.role]}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => onEdit(user)}
            className="gap-2"
          >
            <Pencil size={14} /> Edit
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
