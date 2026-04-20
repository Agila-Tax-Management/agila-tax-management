// src/components/dashboard/ClientUsersModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, Users } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';
import type { ClientRecord, ClientUserMember } from '@/types/client-management.types';

const ROLE_VARIANT: Record<string, 'success' | 'neutral' | 'warning' | 'danger'> = {
  OWNER: 'success',
  ADMIN: 'warning',
  EMPLOYEE: 'neutral',
  VIEWER: 'neutral',
};

const STATUS_VARIANT: Record<string, 'success' | 'danger' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'danger',
  SUSPENDED: 'warning',
};

interface ClientUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientRecord | null;
}

export default function ClientUsersModal({
  isOpen,
  onClose,
  client,
}: ClientUsersModalProps): React.ReactNode {
  const { error: toastError } = useToast();
  const [users, setUsers] = useState<ClientUserMember[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !client) {
      setUsers([]);
      return;
    }
    void (async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/settings/clients/${client.id}`);
        if (!response.ok) {
          toastError('Failed to load users', 'Could not fetch client users.');
          return;
        }
        const json = await response.json() as { data: { users: ClientUserMember[] } };
        setUsers(json.data.users);
      } catch {
        toastError('Failed to load users', 'An unexpected error occurred.');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, client, toastError]);

  function getInitials(name: string | null, email: string): string {
    return (name ?? email)
      .split(/[\s@]/)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={client ? `Users — ${client.businessName ?? client.companyCode}` : 'Client Users'}
      size="lg"
    >
      <div className="p-6 space-y-4">
        {client && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:text-blue-300 shrink-0">
              {(client.businessName ?? client.companyCode ?? '?').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{client.businessName ?? '—'}</p>
              <p className="text-xs text-muted-foreground">{client.companyCode} · {client.clientNo ?? 'No client no.'}</p>
            </div>
            <Badge variant={client.active ? 'success' : 'danger'} className="ml-auto shrink-0">
              {client.active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={22} className="animate-spin text-muted-foreground" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">No users assigned to this client yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">User</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:table-cell">Portal Role</th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">Position</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                          {getInitials(u.name, u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">{u.name ?? '—'}</p>
                          <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge variant={ROLE_VARIANT[u.role] ?? 'neutral'}>
                        {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {u.employee?.employment?.position?.title ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[u.status] ?? 'neutral'}>
                        {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          {users.length} user{users.length !== 1 ? 's' : ''} assigned · To add employees, use the User Client Management page.
        </p>
      </div>
    </Modal>
  );
}
