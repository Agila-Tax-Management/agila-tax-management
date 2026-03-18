'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Plus,
  Power,
  Search,
  UserCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import UserClientFormModal from './UserClientFormModal';
import UserClientViewModal from './UserClientViewModal';
import type {
  AccountStatus,
  ClientOption,
  ClientUserFormValues,
  ClientUserRecord,
  ClientUserStatus,
  StatusFilter,
} from '@/types/client-user-management.types';
import { STATUS_DB_MAP, STATUS_UI_MAP } from '@/types/client-user-management.types';

const ITEMS_PER_PAGE = 10;

const STATUS_VARIANT: Record<AccountStatus, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
};

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

export default function UserClientManagement(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<ClientUserRecord[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUserRecord | null>(null);
  const [viewingUser, setViewingUser] = useState<ClientUserRecord | null>(null);

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoadingUsers(true);
    try {
      const response = await fetch('/api/admin/settings/client-users?role=OWNER');
      if (!response.ok) {
        toastError('Failed to load users', 'Could not fetch client portal users.');
        return;
      }
      const json = await response.json() as { data: ClientUserRecord[] };
      setUsers(json.data);
    } catch {
      toastError('Failed to load users', 'An unexpected error occurred.');
    } finally {
      setLoadingUsers(false);
    }
  }, [toastError]);

  const fetchClients = useCallback(async (): Promise<void> => {
    setLoadingClients(true);
    try {
      const response = await fetch('/api/hr/clients');
      if (!response.ok) return;
      const json = await response.json() as { data: ClientOption[] };
      setClients(json.data);
    } catch {
      // non-critical — form will show empty client list
    } finally {
      setLoadingClients(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    void fetchClients();
  }, [fetchUsers, fetchClients]);

  const [prevFilters, setPrevFilters] = useState({ search, statusFilter });
  if (prevFilters.search !== search || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ search, statusFilter });
    setPage(1);
  }

  const filteredUsers = useMemo(() => {
    let result = users;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((user) =>
        (user.name?.toLowerCase().includes(query) ?? false) ||
        user.email.toLowerCase().includes(query) ||
        user.assignments.some(
          (a) =>
            a.businessName?.toLowerCase().includes(query) ||
            a.companyCode?.toLowerCase().includes(query) ||
            a.clientNo?.toLowerCase().includes(query)
        )
      );
    }

    if (statusFilter !== 'All') {
      result = result.filter((user) => STATUS_UI_MAP[user.status] === statusFilter);
    }

    return result;
  }, [search, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const inactiveCount = users.filter((u) => u.status === 'INACTIVE').length;
  const suspendedCount = users.filter((u) => u.status === 'SUSPENDED').length;
  const assignedClientCount = users.reduce((sum, u) => sum + u.assignments.length, 0);

  function openAdd(): void {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user: ClientUserRecord): void {
    setEditingUser(user);
    setFormOpen(true);
  }

  function closeForm(): void {
    setFormOpen(false);
    setEditingUser(null);
  }

  async function saveUserClient(values: ClientUserFormValues): Promise<void> {
    try {
      const url = editingUser
        ? `/api/admin/settings/client-users/${editingUser.id}`
        : '/api/admin/settings/client-users';

      const body: Record<string, unknown> = {
        name: values.name,
        email: values.email,
        status: STATUS_DB_MAP[values.accountStatus],
        clientIds: values.assignedClientIds,
      };
      if (values.password) body.password = values.password;

      const response = await fetch(url, {
        method: editingUser ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        toastError('Failed to save user client', data.error ?? 'An unexpected error occurred.');
        return;
      }

      await fetchUsers();
      success(
        editingUser ? 'User client updated' : 'User client created',
        `${values.name} has been saved with ${values.assignedClientIds.length} assigned client(s).`
      );
      closeForm();
    } catch {
      toastError('Failed to save user client', 'An unexpected error occurred. Please try again.');
    }
  }

  async function updateStatus(userId: string, nextStatus: ClientUserStatus): Promise<void> {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    try {
      const response = await fetch(`/api/admin/settings/client-users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        const data = await response.json() as { error?: string };
        toastError('Failed to update status', data.error ?? 'An unexpected error occurred.');
        return;
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: nextStatus, active: nextStatus === 'ACTIVE' } : u
        )
      );
      setViewingUser((prev) =>
        prev?.id === userId ? { ...prev, status: nextStatus, active: nextStatus === 'ACTIVE' } : prev
      );

      success(
        'Account status updated',
        `${targetUser.name ?? targetUser.email} is now ${STATUS_UI_MAP[nextStatus].toLowerCase()}.`
      );
    } catch {
      toastError('Failed to update status', 'An unexpected error occurred.');
    }
  }

  const stats = [
    { label: 'Total External Users', value: users.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active Users', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Assigned Clients', value: assignedClientCount, icon: UserRound, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Suspended', value: suspendedCount, icon: Ban, color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">User Client Management</h1>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
            Manage external users who are the primary owners of their client business. Each owner can be
            assigned to one or more clients and gains full access to the client portal.
          </p>
        </div>
        <Button onClick={openAdd} disabled={loadingClients}>
          <Plus size={16} />
          Add User Client
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4 p-4">
            <div className={`rounded-xl p-2.5 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by user, email, or assigned client..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{clients.length} active clients available for assignment.</span>
          <span>•</span>
          <span>{inactiveCount} external users are currently inactive.</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {loadingUsers ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                  <th className="hidden px-4 py-3 text-left font-semibold text-muted-foreground lg:table-cell">Assigned Clients</th>
                  <th className="whitespace-nowrap px-4 py-3 text-left font-semibold text-muted-foreground">Status</th>
                  <th className="hidden whitespace-nowrap px-4 py-3 text-left font-semibold text-muted-foreground md:table-cell">Last Updated</th>
                  <th className="whitespace-nowrap px-4 py-3 text-right font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      No external users matched the current filters.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const uiStatus = STATUS_UI_MAP[user.status];
                    const initials = (user.name ?? user.email)
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-b-0 transition-colors hover:bg-muted/20"
                      >
                        <td className="px-4 py-3 align-middle">
                          <button
                            onClick={() => setViewingUser(user)}
                            className="flex items-center gap-3 text-left transition hover:opacity-80"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                              {initials}
                            </div>
                            <div>
                              <span className="block font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400">
                                {user.name ?? '—'}
                              </span>
                              <span className="block text-xs text-muted-foreground">{user.email}</span>
                              <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                                {user.assignments.slice(0, 2).map((a) => (
                                  <Badge key={a.clientId} variant="neutral">{a.businessName ?? a.companyCode}</Badge>
                                ))}
                                {user.assignments.length > 2 ? (
                                  <Badge variant="neutral">+{user.assignments.length - 2} more</Badge>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        </td>
                        <td className="hidden px-4 py-3 align-middle lg:table-cell">
                          <div className="flex flex-wrap gap-1.5">
                            {user.assignments.map((a) => (
                              <Badge key={a.clientId} variant="info" className="px-2 py-1 text-[11px]">
                                {a.businessName ?? a.companyCode}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-middle">
                          <Badge variant={STATUS_VARIANT[uiStatus]} className="px-2.5 py-1 text-[11px]">
                            {uiStatus}
                          </Badge>
                        </td>
                        <td className="hidden whitespace-nowrap px-4 py-3 align-middle text-muted-foreground md:table-cell">
                          {formatDate(user.updatedAt)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" onClick={() => setViewingUser(user)}>
                              <Eye size={14} />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => void updateStatus(user.id, user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                            >
                              <Power size={14} />
                              {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => void updateStatus(user.id, 'SUSPENDED')}
                              disabled={user.status === 'SUSPENDED'}
                            >
                              <Ban size={14} />
                              Suspend
                            </Button>
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

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}–
            {Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} user clients
          </p>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page === 1}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </Card>

      <UserClientFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSave={(values) => void saveUserClient(values)}
        editingUser={editingUser}
        clients={clients}
      />

      <UserClientViewModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(u) => { setViewingUser(null); openEdit(u); }}
        onStatusChange={(userId, nextStatus) => void updateStatus(userId, nextStatus)}
      />
    </div>
  );
}
