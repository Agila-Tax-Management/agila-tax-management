// src/components/dashboard/ClientManagement.tsx
'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Ban,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import ClientFormModal from './ClientFormModal';
import type {
  ClientFormValues,
  ClientRecord,
  ClientStatusFilter,
} from '@/types/client-management.types';

const ITEMS_PER_PAGE = 10;

const BIZ_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  CORPORATION: 'Corporation',
  COOPERATIVE: 'Cooperative',
};

function formatDate(val: string | null): string {
  if (!val) return '—';
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(val));
}

export default function ClientManagement(): React.ReactNode {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('All');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  const fetchClients = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/settings/clients');
      if (!response.ok) {
        toastError('Failed to load clients', 'Could not fetch the client list.');
        return;
      }
      const json = (await response.json()) as { data: ClientRecord[] };
      setClients(json.data);
    } catch {
      toastError('Failed to load clients', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchClients();
  }, [fetchClients]);

  // Reset page on filter change — adjust state during render (no useEffect)
  const [prevFilters, setPrevFilters] = useState({ search, statusFilter });
  if (prevFilters.search !== search || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ search, statusFilter });
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = clients;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.businessName?.toLowerCase().includes(q) ?? false) ||
          (c.companyCode?.toLowerCase().includes(q) ?? false) ||
          (c.clientNo?.toLowerCase().includes(q) ?? false) ||
          (c.owner?.name?.toLowerCase().includes(q) ?? false) ||
          (c.owner?.email.toLowerCase().includes(q) ?? false),
      );
    }
    if (statusFilter === 'Active') result = result.filter((c) => c.active);
    if (statusFilter === 'Inactive') result = result.filter((c) => !c.active);
    return result;
  }, [clients, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = clients.filter((c) => c.active).length;
  const inactiveCount = clients.filter((c) => !c.active).length;
  const totalUsers = clients.reduce((sum, c) => sum + c.userCount, 0);

  async function saveClient(values: ClientFormValues): Promise<void> {
    try {
      const url = editingClient
        ? `/api/admin/settings/clients/${editingClient.id}`
        : '/api/admin/settings/clients';
      const response = await fetch(url, {
        method: editingClient ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toastError('Failed to save client', data.error ?? 'An unexpected error occurred.');
        return;
      }
      await fetchClients();
      success(
        editingClient ? 'Client updated' : 'Client created',
        `${values.businessName} has been saved successfully.`,
      );
      setFormOpen(false);
      setEditingClient(null);
    } catch {
      toastError('Failed to save client', 'An unexpected error occurred.');
    }
  }

  async function toggleActive(client: ClientRecord): Promise<void> {
    try {
      const response = await fetch(`/api/admin/settings/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !client.active }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        toastError('Failed to update status', data.error ?? 'An unexpected error occurred.');
        return;
      }
      setClients((prev) =>
        prev.map((c) => (c.id === client.id ? { ...c, active: !client.active } : c)),
      );
      success(
        'Client status updated',
        `${client.businessName} is now ${client.active ? 'inactive' : 'active'}.`,
      );
    } catch {
      toastError('Failed to update status', 'An unexpected error occurred.');
    }
  }

  const stats = [
    {
      label: 'Total Clients',
      value: clients.length,
      icon: Building2,
      color: 'text-blue-600 dark:text-blue-400',
    },
    {
      label: 'Active',
      value: activeCount,
      icon: UserCheck,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Inactive',
      value: inactiveCount,
      icon: Ban,
      color: 'text-red-500 dark:text-red-400',
    },
    {
      label: 'Total Portal Users',
      value: totalUsers,
      icon: Users,
      color: 'text-amber-600 dark:text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage client companies and view their assigned portal users.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingClient(null);
            setFormOpen(true);
          }}
        >
          <Plus size={16} />
          Add Client
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex items-center gap-4 p-4">
            <div className={`rounded-xl p-2.5 ${s.color}`}>
              <s.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by business name, code, or owner…"
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ClientStatusFilter)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Client
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">
                    Business Type
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground lg:table-cell">
                    Owner
                  </th>
                  <th className="hidden px-4 py-3 text-center font-semibold text-muted-foreground sm:table-cell">
                    Users
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground xl:table-cell">
                    Registered
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      No clients matched the current filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((client) => {
                    const initials = (client.businessName ?? client.companyCode ?? '?')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <tr
                        key={client.id}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20"
                      >
                        {/* Business name / code */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/dashboard/settings/client-management/${client.id}`)}
                            className="flex items-center gap-3 text-left transition hover:opacity-80"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:text-blue-300">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="block truncate font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
                                {client.businessName ?? '—'}
                              </span>
                              <span className="block text-[11px] text-muted-foreground">
                                {client.companyCode}
                                {client.clientNo ? ` · ${client.clientNo}` : ''}
                              </span>
                            </div>
                          </button>
                        </td>

                        {/* Business type */}
                        <td className="hidden px-4 py-3 md:table-cell">
                          {client.businessEntity ? (
                            <Badge variant="neutral">
                              {BIZ_TYPE_LABELS[client.businessEntity] ?? client.businessEntity}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Owner */}
                        <td className="hidden px-4 py-3 lg:table-cell">
                          {client.owner ? (
                            <div className="min-w-0">
                              <p className="truncate text-sm text-foreground">
                                {client.owner.name ?? '—'}
                              </p>
                              <p className="truncate text-[11px] text-muted-foreground">
                                {client.owner.email}
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">
                              No owner assigned
                            </span>
                          )}
                        </td>

                        {/* User count */}
                        <td className="hidden px-4 py-3 text-center sm:table-cell">
                          <button
                            onClick={() => router.push(`/dashboard/settings/client-management/${client.id}`)}
                            className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-semibold text-foreground transition hover:bg-muted/70"
                            title="View assigned users"
                          >
                            <Users size={12} />
                            {client.userCount}
                          </button>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={client.active ? 'success' : 'danger'}>
                            {client.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>

                        {/* Registered date */}
                        <td className="hidden px-4 py-3 text-muted-foreground xl:table-cell">
                          {formatDate(client.createdAt)}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => {
                                setEditingClient(client);
                                setFormOpen(true);
                              }}
                              className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-blue-50 hover:text-blue-600"
                              title="Edit client"
                            >
                              <Pencil size={15} />
                            </button>
                            {client.active ? (
                              <button
                                onClick={() => void toggleActive(client)}
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-slate-100 hover:text-slate-600"
                                title="Deactivate client"
                              >
                                <UserX size={15} />
                              </button>
                            ) : (
                              <button
                                onClick={() => void toggleActive(client)}
                                className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-emerald-50 hover:text-emerald-600"
                                title="Activate client"
                              >
                                <Power size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing{' '}
            {filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} clients
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <ClientFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingClient(null);
        }}
        onSave={(values) => void saveClient(values)}
        editingClient={editingClient}
      />

    </div>
  );
}
