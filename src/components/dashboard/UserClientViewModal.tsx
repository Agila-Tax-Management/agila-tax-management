'use client';

import React from 'react';
import { CalendarClock, Mail, Pencil, Users } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { ClientOption, ClientUserRecord } from './user-client-management.types';

const STATUS_VARIANT = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
} as const;

interface UserClientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: ClientUserRecord | null;
  clients: ClientOption[];
  onEdit: (user: ClientUserRecord) => void;
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
  clients,
  onEdit,
}: UserClientViewModalProps): React.ReactNode {
  const assignedClients = user
    ? clients.filter((client) => user.assignedClientIds.includes(client.id))
    : [];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Client Details" size="xl">
      {user ? (
        <div className="space-y-6 p-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={STATUS_VARIANT[user.accountStatus]} className="w-fit px-3 py-1 text-xs">
                {user.accountStatus}
              </Badge>
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
              <h4 className="text-base font-semibold text-foreground">Assigned Clients</h4>
            </div>
            <div className="mt-4 space-y-3">
              {assignedClients.length > 0 ? (
                assignedClients.map((client) => (
                  <div key={client.id} className="rounded-xl border border-border bg-muted/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{client.businessName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {client.clientNo} • {client.companyCode}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{client.portalName}</p>
                      </div>
                      <Badge variant="success">Active Client</Badge>
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