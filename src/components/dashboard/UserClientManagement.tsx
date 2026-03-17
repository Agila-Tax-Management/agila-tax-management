'use client';

import React, { useMemo, useState } from 'react';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Eye,
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
  StatusFilter,
} from './user-client-management.types';

const ITEMS_PER_PAGE = 10;

const STATUS_VARIANT: Record<AccountStatus, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
};

const ALL_CLIENTS: ClientOption[] = [
  { id: 101, clientNo: '2026-0001', businessName: 'Villanueva Trading Co.', companyCode: 'VTC-001', portalName: 'Villanueva Trading Portal', active: true },
  { id: 102, clientNo: '2026-0002', businessName: 'Lim Holdings Corporation', companyCode: 'LHC-002', portalName: 'Lim Holdings Portal', active: true },
  { id: 103, clientNo: '2026-0003', businessName: 'Tan & Associates Law Firm', companyCode: 'TAL-003', portalName: 'Tan Law Portal', active: true },
  { id: 104, clientNo: '2026-0004', businessName: 'Cruz Enterprises Inc.', companyCode: 'CEI-004', portalName: 'Cruz Enterprises Portal', active: false },
  { id: 105, clientNo: '2026-0005', businessName: 'Aquino Tech Solutions', companyCode: 'ATS-005', portalName: 'Aquino Tech Portal', active: true },
  { id: 106, clientNo: '2026-0006', businessName: 'Reyes Law Office', companyCode: 'RLO-006', portalName: 'Reyes Law Portal', active: false },
  { id: 107, clientNo: '2026-0007', businessName: 'Santos Food Corporation', companyCode: 'SFC-007', portalName: 'Santos Food Portal', active: true },
  { id: 108, clientNo: '2026-0008', businessName: 'Bautista Retail Shop', companyCode: 'BRS-008', portalName: 'Bautista Retail Portal', active: true },
  { id: 109, clientNo: '2026-0009', businessName: 'Mendoza Construction Corp.', companyCode: 'MCC-009', portalName: 'Mendoza Construction Portal', active: true },
];

const INITIAL_USERS: ClientUserRecord[] = [
  { id: 'uc-001', name: 'Juan Dela Cruz', email: 'juan.delacruz@villanuevatrading.ph', active: true, accountStatus: 'Active', assignedClientIds: [101, 105], createdAt: '2026-02-10T08:30:00.000Z', updatedAt: '2026-03-16T10:00:00.000Z' },
  { id: 'uc-002', name: 'Maria Clara', email: 'maria.clara@limholdings.ph', active: true, accountStatus: 'Active', assignedClientIds: [102, 103, 109], createdAt: '2026-01-20T09:00:00.000Z', updatedAt: '2026-03-12T13:15:00.000Z' },
  { id: 'uc-003', name: 'Carmen Reyes', email: 'carmen.reyes@clientmail.ph', active: false, accountStatus: 'Suspended', assignedClientIds: [107], createdAt: '2025-12-28T11:45:00.000Z', updatedAt: '2026-03-14T15:45:00.000Z' },
  { id: 'uc-004', name: 'Roberto Villanueva', email: 'roberto.v@externalclient.ph', active: false, accountStatus: 'Inactive', assignedClientIds: [108], createdAt: '2026-02-28T07:20:00.000Z', updatedAt: '2026-03-10T08:05:00.000Z' },
];

function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(dateValue));
}

function getAssignedClients(user: ClientUserRecord, clients: ClientOption[]): ClientOption[] {
  return clients.filter((client) => user.assignedClientIds.includes(client.id));
}

export default function UserClientManagement(): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [users, setUsers] = useState<ClientUserRecord[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ClientUserRecord | null>(null);
  const [viewingUser, setViewingUser] = useState<ClientUserRecord | null>(null);

  const activeClients = useMemo(() => ALL_CLIENTS.filter((client) => client.active), []);

  const [prevFilters, setPrevFilters] = useState({ search, statusFilter });
  if (prevFilters.search !== search || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ search, statusFilter });
    setPage(1);
  }

  const filteredUsers = useMemo(() => {
    let result = users;

    if (search) {
      const query = search.toLowerCase();
      result = result.filter((user) => {
        const assignedClients = getAssignedClients(user, activeClients);

        return (
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          assignedClients.some(
            (client) =>
              client.businessName.toLowerCase().includes(query) ||
              client.clientNo.toLowerCase().includes(query) ||
              client.companyCode.toLowerCase().includes(query)
          )
        );
      });
    }

    if (statusFilter !== 'All') {
      result = result.filter((user) => user.accountStatus === statusFilter);
    }

    return result;
  }, [activeClients, search, statusFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = filteredUsers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = users.filter((user) => user.accountStatus === 'Active').length;
  const inactiveCount = users.filter((user) => user.accountStatus === 'Inactive').length;
  const suspendedCount = users.filter((user) => user.accountStatus === 'Suspended').length;
  const assignedClientCount = users.reduce((count, user) => count + user.assignedClientIds.length, 0);

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

  function saveUserClient(values: ClientUserFormValues): void {
    const duplicateEmail = users.some(
      (user) => user.email.toLowerCase() === values.email.toLowerCase() && user.id !== editingUser?.id
    );

    if (duplicateEmail) {
      toastError('Email already in use', 'Use a different email address for this external user.');
      return;
    }

    const timestamp = new Date().toISOString();

    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: values.name,
                email: values.email,
                accountStatus: values.accountStatus,
                active: values.accountStatus === 'Active',
                assignedClientIds: values.assignedClientIds,
                updatedAt: timestamp,
              }
            : user
        )
      );
      success('User client updated', `${values.name} now has ${values.assignedClientIds.length} assigned client(s).`);
    } else {
      setUsers((prev) => [
        {
          id: crypto.randomUUID(),
          name: values.name,
          email: values.email,
          accountStatus: values.accountStatus,
          active: values.accountStatus === 'Active',
          assignedClientIds: values.assignedClientIds,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
        ...prev,
      ]);
      success('User client created', `${values.name} was added with active client assignments.`);
    }

    closeForm();
  }

  function updateStatus(userId: string, nextStatus: AccountStatus): void {
    const targetUser = users.find((user) => user.id === userId);
    if (!targetUser) {
      toastError('User client not found', 'The selected external user is no longer available.');
      return;
    }

    const updatedAt = new Date().toISOString();

    setUsers((prev) =>
      prev.map((user) =>
        user.id === userId
          ? {
              ...user,
              accountStatus: nextStatus,
              active: nextStatus === 'Active',
              updatedAt,
            }
          : user
      )
    );

    setViewingUser((prev) =>
      prev && prev.id === userId
        ? {
            ...prev,
            accountStatus: nextStatus,
            active: nextStatus === 'Active',
            updatedAt,
          }
        : prev
    );

    success('Account status updated', `${targetUser.name} is now ${nextStatus.toLowerCase()}.`);
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
            Manage external users who can access client-facing records only. Each user can be assigned to multiple clients,
            and only active clients are available for assignment.
          </p>
        </div>
        <Button onClick={openAdd}>
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
          <span>{activeClients.length} active clients available for assignment.</span>
          <span>•</span>
          <span>{ALL_CLIENTS.length - activeClients.length} inactive clients are excluded.</span>
          <span>•</span>
          <span>{inactiveCount} external users are currently inactive.</span>
        </div>
      </Card>

      <Card className="overflow-hidden">
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
                  const assignedClients = getAssignedClients(user, activeClients);
                  const initials = user.name
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
                              {user.name}
                            </span>
                            <span className="block text-xs text-muted-foreground">{user.email}</span>
                            <div className="mt-1 flex flex-wrap gap-1 lg:hidden">
                              {assignedClients.slice(0, 2).map((client) => (
                                <Badge key={client.id} variant="neutral">{client.businessName}</Badge>
                              ))}
                              {assignedClients.length > 2 ? (
                                <Badge variant="neutral">+{assignedClients.length - 2} more</Badge>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="hidden px-4 py-3 align-middle lg:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {assignedClients.map((client) => (
                            <Badge key={client.id} variant="info" className="px-2 py-1 text-[11px]">
                              {client.businessName}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 align-middle">
                        <Badge variant={STATUS_VARIANT[user.accountStatus]} className="px-2.5 py-1 text-[11px]">
                          {user.accountStatus}
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
                            onClick={() => updateStatus(user.id, user.accountStatus === 'Active' ? 'Inactive' : 'Active')}
                          >
                            <Power size={14} />
                            {user.accountStatus === 'Active' ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => updateStatus(user.id, 'Suspended')}
                            disabled={user.accountStatus === 'Suspended'}
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

        <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredUsers.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}-
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
        onSave={saveUserClient}
        editingUser={editingUser}
        clients={activeClients}
      />

      <UserClientViewModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        clients={activeClients}
        onEdit={(u) => { setViewingUser(null); openEdit(u); }}
      />
    </div>
  );
}