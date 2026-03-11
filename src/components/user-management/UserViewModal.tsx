// src/components/user-management/UserViewModal.tsx
'use client';

import React from 'react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { UserRecord } from '@/lib/schemas/user-management';

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
  ACCOUNTING: 'Accounting Portal',
  ACCOUNT_OFFICER: 'Account Officer Portal',
  HR: 'HR Portal',
};

const PERM_LABELS: Record<string, string> = {
  canRead: 'Read',
  canWrite: 'Write',
  canEdit: 'Edit',
  canDelete: 'Delete',
};

const PERMISSIONS = ['canRead', 'canWrite', 'canEdit', 'canDelete'] as const;

/* ─── Props ───────────────────────────────────────────────────────── */

interface UserViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserRecord | null;
}

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserViewModal({
  isOpen,
  onClose,
  user,
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
          <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-lg font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 shrink-0">
            <Badge variant={user.active ? 'success' : 'danger'}>
              {user.active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="info">{ROLE_LABELS[user.role] ?? user.role}</Badge>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Role
            </p>
            <p className="text-sm text-foreground">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Email Verified
            </p>
            <p className="text-sm text-foreground">{user.emailVerified ? 'Yes' : 'No'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
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
          {user.employee && (
            <div className="space-y-1 col-span-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Employee No.
              </p>
              <p className="text-sm text-foreground">
                {user.employee.employeeNo ?? 'Not assigned'}
              </p>
            </div>
          )}
        </div>

        {/* Portal Access */}
        {user.role === 'EMPLOYEE' && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Portal Access</h4>
            {user.portalAccess.length === 0 ? (
              <p className="text-sm text-muted-foreground">No portal access configured.</p>
            ) : (
              <div className="space-y-2">
                {user.portalAccess.map((access) => (
                  <div
                    key={access.portal}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-border bg-muted/30"
                  >
                    <span className="text-sm font-medium text-foreground min-w-40">
                      {PORTAL_LABELS[access.portal] ?? access.portal}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {PERMISSIONS.map((perm) => (
                        <Badge
                          key={perm}
                          variant={access[perm] ? 'success' : 'neutral'}
                        >
                          {PERM_LABELS[perm]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Admin/Super Admin note */}
        {(user.role === 'SUPER_ADMIN' || user.role === 'ADMIN') && (
          <div className="p-3 rounded-xl border border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              {user.role === 'SUPER_ADMIN'
                ? 'Super Admins have full access to all portals with all permissions.'
                : 'Admins have read, write, and edit access to all portals (no delete).'}
            </p>
          </div>
        )}

        {/* Close */}
        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
