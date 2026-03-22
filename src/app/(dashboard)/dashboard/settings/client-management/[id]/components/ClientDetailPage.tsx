// src/app/(dashboard)/dashboard/settings/client-management/[id]/components/ClientDetailPage.tsx
'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import ClientUserFormModal from './ClientUserFormModal';
import ClientUserDeleteModal from './ClientUserDeleteModal';
import type {
  ClientDetailRecord,
  ClientDetailUserFormValues,
  ClientUserMember,
} from '@/types/client-management.types';

const BIZ_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  CORPORATION: 'Corporation',
  COOPERATIVE: 'Cooperative',
};

const BRANCH_LABELS: Record<string, string> = {
  MAIN: 'Main Branch',
  BRANCH: 'Branch',
};

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

function formatDate(val: string | null): string {
  if (!val) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(val));
}

function getInitials(name: string | null, email: string): string {
  return (name ?? email)
    .split(/[\s@]/)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ClientDetailPage(): React.ReactNode {
  const params = useParams();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const clientId = parseInt(params.id as string, 10);

  const [client, setClient] = useState<ClientDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUserMember | null>(null);
  const [deletingUser, setDeletingUser] = useState<ClientUserMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchClient = useCallback(async (): Promise<void> => {
    if (isNaN(clientId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/settings/clients/${clientId}`);
      if (response.status === 404) {
        setNotFound(true);
        return;
      }
      if (!response.ok) {
        toastError('Failed to load client', 'Could not fetch client data.');
        return;
      }
      const json = (await response.json()) as { data: ClientDetailRecord };
      setClient(json.data);
    } catch {
      toastError('Failed to load client', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [clientId, toastError]);

  useEffect(() => {
    void fetchClient();
  }, [fetchClient]);

  async function saveUser(values: ClientDetailUserFormValues): Promise<void> {
    try {
      const isEdit = !!editingUser;
      const url = isEdit
        ? `/api/admin/settings/clients/${clientId}/users/${editingUser.id}`
        : `/api/admin/settings/clients/${clientId}/users`;

      const body: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        role: values.role,
        status: values.status,
      };
      // Always include password on create; on edit only if filled
      if (!isEdit || values.password) {
        body.password = values.password;
      }

      const response = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toastError(
          isEdit ? 'Failed to update user' : 'Failed to add user',
          data.error ?? 'An unexpected error occurred.',
        );
        return;
      }

      await fetchClient();
      success(
        isEdit ? 'User updated' : 'User added',
        `${values.name || values.email} has been ${isEdit ? 'updated' : 'added'} successfully.`,
      );
      setFormOpen(false);
      setEditingUser(null);
    } catch {
      toastError('Failed to save user', 'An unexpected error occurred.');
    }
  }

  async function deleteUser(): Promise<void> {
    if (!deletingUser) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(
        `/api/admin/settings/clients/${clientId}/users/${deletingUser.id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toastError('Failed to remove user', data.error ?? 'An unexpected error occurred.');
        return;
      }
      await fetchClient();
      success(
        'User removed',
        `${deletingUser.name ?? deletingUser.email} has been removed from this client.`,
      );
      setDeletingUser(null);
    } catch {
      toastError('Failed to remove user', 'An unexpected error occurred.');
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/settings/client-management')}
        >
          <ArrowLeft size={16} />
          Back to Clients
        </Button>
        <Card className="p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">Client not found.</p>
        </Card>
      </div>
    );
  }

  const clientInitials = (client.businessName ?? client.companyCode ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button
        variant="outline"
        onClick={() => router.push('/dashboard/settings/client-management')}
      >
        <ArrowLeft size={16} />
        Back to Clients
      </Button>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            {clientInitials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">
                {client.businessName ?? '—'}
              </h1>
              <Badge variant={client.active ? 'success' : 'danger'}>
                {client.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {client.companyCode}
              {client.clientNo ? ` · ${client.clientNo}` : ''}
              {client.portalName ? ` · ${client.portalName}` : ''}
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingUser(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} />
          Add User
        </Button>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            label: 'Business Entity',
            value:
              BIZ_TYPE_LABELS[client.businessEntity ?? ''] ?? client.businessEntity ?? '—',
          },
          {
            label: 'Branch Type',
            value: BRANCH_LABELS[client.branchType ?? ''] ?? client.branchType ?? '—',
          },
          { label: 'Timezone', value: client.timezone ?? '—' },
          { label: 'Registered', value: formatDate(client.createdAt) },
        ].map((item) => (
          <Card key={item.label} className="p-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="truncate text-sm font-medium text-foreground">{item.value}</p>
          </Card>
        ))}
      </div>

      {/* Users table */}
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Users size={16} className="text-muted-foreground" />
          <h2 className="font-semibold text-foreground">Portal Users</h2>
          <span className="ml-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {client.users.length}
          </span>
        </div>

        {client.users.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
            <Users size={36} className="opacity-25" />
            <p className="text-sm">No users assigned to this client yet.</p>
            <Button
              variant="outline"
              onClick={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
              className="mt-2"
            >
              <Plus size={15} />
              Add First User
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                    User
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground sm:table-cell">
                    Role
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground md:table-cell">
                    Position
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground lg:table-cell">
                    Joined
                  </th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {client.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20"
                  >
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                          {getInitials(u.name, u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-foreground">
                            {u.name ?? '—'}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Badge variant={ROLE_VARIANT[u.role] ?? 'neutral'}>
                        {u.role.charAt(0) + u.role.slice(1).toLowerCase()}
                      </Badge>
                    </td>

                    {/* Position */}
                    <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                      {u.employee?.employment?.position?.title ?? (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[u.status] ?? 'neutral'}>
                        {u.status.charAt(0) + u.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setFormOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30"
                          title="Edit user"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeletingUser(u)}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                          title="Remove user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      <ClientUserFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingUser(null);
        }}
        onSave={(values) => void saveUser(values)}
        editingUser={editingUser}
      />

      <ClientUserDeleteModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={() => void deleteUser()}
        user={deletingUser}
        clientName={client.businessName}
        loading={deleteLoading}
      />
    </div>
  );
}
