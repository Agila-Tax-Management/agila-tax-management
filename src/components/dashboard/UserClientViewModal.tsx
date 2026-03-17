'use client';

import React from 'react';
import { CalendarClock, Mail, Pencil, Users } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { ClientUserRecord, ClientUserStatus } from './user-client-management.types';
import { STATUS_UI_MAP } from './user-client-management.types';

const STATUS_VARIANT = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
} as const;

interface UserClientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ClientUserRecord | null;
  onEdit: (user: ClientUserRecord) => void;
  onStatusChange: (userId: string, nextStatus: ClientUserStatus) => void;
}

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateValue));
}

export default function UserClientViewModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onStatusChange,
}: UserClientViewModalProps): React.ReactNode {
  const uiStatus = user ? STATUS_UI_MAP[user.status] : 'Active';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Client Details" size="xl">
      {user ? (
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{user.name ?? '—'}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANT[uiStatus]} className="w-fit px-3 py-1 text-xs">
                {uiStatus}
              </Badge>
              <Button
                variant="outline"
                onClick={() => onStatusChange(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
              >
                {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button variant="outline" onClick={() => onEdit(user)}>
                <Pencil size={14} />
                Edit
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Created</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <CalendarClock size={14} />
                <span>{formatDate(user.createdAt)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last Updated</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-foreground">
                <CalendarClock size={14} />
                <span>{formatDate(user.updatedAt)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-blue-600" />
              <h4 className="text-base font-semibold text-foreground">
                Assigned Clients ({user.assignments.length})
              </h4>
            </div>
            <div className="mt-4 space-y-3">
              {user.assignments.length > 0 ? (
                user.assignments.map((a) => (
                  <div key={a.clientId} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{a.businessName ?? '—'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {a.clientNo ? `${a.clientNo} • ` : ''}{a.companyCode}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{a.portalName}</p>
                      </div>
                      <Badge variant={a.active ? 'success' : 'neutral'}>
                        {a.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No clients are assigned to this external user.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}