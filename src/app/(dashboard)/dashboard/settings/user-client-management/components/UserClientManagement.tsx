// src/app/(dashboard)/dashboard/settings/user-client-management/components/UserClientManagement.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Plus,
  Search,
  SquarePen,
  UserCheck,
  UserRound,
  UserRoundX,
} from 'lucide-react';

type ExternalUserStatus = 'Active' | 'Inactive';

type StatusFilter = 'All' | ExternalUserStatus;

interface ExternalClientUser {
  id: string;
  name: string;
  email: string;
  status: ExternalUserStatus;
  assignedClientIds: string[];
  createdAt: string;
}

interface ExternalUserForm {
  name: string;
  email: string;
  status: ExternalUserStatus;
  assignedClientIds: string[];
}

interface ClientOption {
  id: string;
  clientNo: string;
  businessName: string;
  companyCode: string;
}

const ITEMS_PER_PAGE = 8;

const INITIAL_EXTERNAL_USERS: ExternalClientUser[] = [
  {
    id: 'ext-user-1',
    name: 'Roberto Villanueva',
    email: 'roberto.v@villanuevatrading.ph',
    status: 'Active',
    assignedClientIds: ['client-1', 'client-5'],
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'ext-user-2',
    name: 'Patricia Lim',
    email: 'patricia.lim@limholdings.ph',
    status: 'Active',
    assignedClientIds: ['client-2'],
    createdAt: '2026-02-18T10:15:00Z',
  },
  {
    id: 'ext-user-3',
    name: 'Marco Tan',
    email: 'marco.tan@tanlaw.ph',
    status: 'Inactive',
    assignedClientIds: ['client-3', 'client-6'],
    createdAt: '2026-01-25T09:40:00Z',
  },
];

const STATUS_VARIANT: Record<ExternalUserStatus, 'success' | 'danger'> = {
  Active: 'success',
  Inactive: 'danger',
};

const emptyForm: ExternalUserForm = {
  name: '',
  email: '',
  status: 'Active',
  assignedClientIds: [],
};

export default function UserClientManagement(): React.ReactNode {
  const { success, error } = useToast();
  const [users, setUsers] = useState<ExternalClientUser[]>(INITIAL_EXTERNAL_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ExternalClientUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ExternalClientUser | null>(null);
  const [form, setForm] = useState<ExternalUserForm>(emptyForm);

  const activeClientOptions = useMemo<ClientOption[]>(() => {
    return INITIAL_CLIENTS.filter((client) => client.status === 'Active').map((client) => ({
      id: client.id,
      clientNo: client.clientNo,
      businessName: client.businessName,
      companyCode: client.companyCode,
    }));
  }, []);

  const activeClientIds = useMemo(() => new Set(activeClientOptions.map((client) => client.id)), [activeClientOptions]);

  const clientLookup = useMemo(() => {
    return new Map(activeClientOptions.map((client) => [client.id, client]));
  }, [activeClientOptions]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus = statusFilter === 'All' ? true : user.status === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const assignedClientNames = user.assignedClientIds
        .map((clientId) => clientLookup.get(clientId)?.businessName ?? '')
        .join(' ')
        .toLowerCase();

      return (
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch) ||
        assignedClientNames.includes(normalizedSearch)
      );
    });
  }, [users, search, statusFilter, clientLookup]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  if (page > totalPages) {
    setPage(totalPages);
  }

  const stats = [
    {
      label: 'External Users',
      value: users.length,
      icon: UserRound,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400',
    },
    {
      label: 'Active Users',
      value: users.filter((user) => user.status === 'Active').length,
      icon: UserCheck,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400',
    },
    {
      label: 'Inactive Users',
      value: users.filter((user) => user.status === 'Inactive').length,
      icon: UserRoundX,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/30 dark:text-rose-400',
    },
    {
      label: 'Active Clients',
      value: activeClientOptions.length,
      icon: Building2,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400',
    },
  ];

  function openAddModal(): void {
    setEditingUser(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  }

  function openEditModal(user: ExternalClientUser): void {
    setEditingUser(user);
    setForm({
      name: user.name,
      email: user.email,
      status: user.status,
      assignedClientIds: user.assignedClientIds.filter((clientId) => activeClientIds.has(clientId)),
    });
    setIsFormOpen(true);
  }

  function closeFormModal(): void {
    setIsFormOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
  }

  function toggleAssignedClient(clientId: string): void {
    setForm((prev) => {
      const isAssigned = prev.assignedClientIds.includes(clientId);
      if (isAssigned) {
        return {
          ...prev,
          assignedClientIds: prev.assignedClientIds.filter((id) => id !== clientId),
        };
      }

      return {
        ...prev,
        assignedClientIds: [...prev.assignedClientIds, clientId],
      };
    });
  }

  function saveForm(): void {
    if (!form.name.trim() || !form.email.trim()) {
      error('Unable to save external user', 'Name and email are required.');
      return;
    }

    const validAssignedClientIds = form.assignedClientIds.filter((clientId) => activeClientIds.has(clientId));

    if (validAssignedClientIds.length === 0) {
      error('Unable to save external user', 'Assign at least one active client.');
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: form.name.trim(),
                email: form.email.trim(),
                status: form.status,
                assignedClientIds: validAssignedClientIds,
              }
            : user
        )
      );
      success('External user updated', 'Client assignments were saved successfully.');
    } else {
      const nextUser: ExternalClientUser = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        email: form.email.trim(),
        status: form.status,
        assignedClientIds: validAssignedClientIds,
        createdAt: new Date().toISOString(),
      };

      setUsers((prev) => [nextUser, ...prev]);
      success('External user created', 'New client user was added successfully.');
    }

    closeFormModal();
  }

  function toggleUserStatus(user: ExternalClientUser): void {
    const nextStatus: ExternalUserStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    setUsers((prev) => prev.map((record) => (record.id === user.id ? { ...record, status: nextStatus } : record)));
    success('User status updated', `${user.name} is now ${nextStatus}.`);
  }

  function getAssignedClientText(user: ExternalClientUser): string {
    const names = user.assignedClientIds
      .map((clientId) => clientLookup.get(clientId)?.businessName)
      .filter((name): name is string => Boolean(name));

    if (names.length === 0) {
      return 'No active client assignment';
    }

    if (names.length === 1) {
      return names[0];
    }

    return `${names[0]} +${names.length - 1} more`;
  }

  function renderAssignedClientList(user: ExternalClientUser): React.ReactNode {
    const assigned = user.assignedClientIds
      .map((clientId) => clientLookup.get(clientId))
      .filter((client): client is ClientOption => Boolean(client));

    if (assigned.length === 0) {
      return <p className="text-sm text-muted-foreground">No active clients assigned.</p>;
    }

    return (
      <div className="space-y-2">
        {assigned.map((client) => (
          <div key={client.id} className="rounded-lg border border-border px-3 py-2">
            <p className="text-sm font-medium text-foreground">{client.businessName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {client.clientNo} · {client.companyCode}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Client Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage external users and assign active clients only. External users cannot access Agila internal tools.
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus size={16} />
          Add External User
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${stat.color}`}>
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by external user, email, or assigned client..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as StatusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">External User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Assigned Clients</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-muted-foreground">
                    No external users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-foreground">{getAssignedClientText(user)}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{user.assignedClientIds.length} assigned</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <Badge variant="info">External</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                          title="Edit external user"
                        >
                          <SquarePen size={15} />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                          title={user.status === 'Active' ? 'Deactivate external user' : 'Activate external user'}
                        >
                          <UserRoundX size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} external users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((value) => (
                <button
                  key={value}
                  onClick={() => setPage(value)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    value === page ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {value}
                </button>
              ))}
              <button
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingUser ? 'Edit External User' : 'Add External User'}
        size="2xl"
      >
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Full Name</label>
              <Input
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
              <Input
                type="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Enter email"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as ExternalUserStatus }))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Assign Active Clients</label>
            <p className="text-xs text-muted-foreground mb-3">Only clients with Active status from Client Management are available for assignment.</p>
            <div className="max-h-64 overflow-auto rounded-xl border border-border divide-y divide-border">
              {activeClientOptions.map((client) => (
                <label key={client.id} className="flex items-start gap-3 p-3 hover:bg-muted/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.assignedClientIds.includes(client.id)}
                    onChange={() => toggleAssignedClient(client.id)}
                    className="mt-1 h-4 w-4 rounded border-border"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.businessName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {client.clientNo} · {client.companyCode}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeFormModal}>Cancel</Button>
            <Button onClick={saveForm}>{editingUser ? 'Save Changes' : 'Create External User'}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingUser)}
        onClose={() => setViewingUser(null)}
        title="External User Details"
        size="lg"
      >
        {viewingUser && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground mt-1">{viewingUser.name}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground mt-1">{viewingUser.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                <div className="mt-1">
                  <Badge variant={STATUS_VARIANT[viewingUser.status]}>{viewingUser.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
                <div className="mt-1">
                  <Badge variant="info">External User</Badge>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Assigned Active Clients</p>
              {renderAssignedClientList(viewingUser)}
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setViewingUser(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
