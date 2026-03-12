// src/components/dashboard/ClientUserManagement.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Search, Plus, ChevronLeft, ChevronRight, Eye, Ban, UserX, Power, ArrowLeft, Users, UserCheck } from 'lucide-react';

// Types for client user
type AccountStatus = 'Active' | 'Inactive' | 'Suspended';
type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Suspended';

interface ClientUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

const STATUS_VARIANT: Record<AccountStatus, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
};

const ITEMS_PER_PAGE = 10;

// Mock data for client users
const MOCK_CLIENT_USERS: ClientUserRecord[] = [
  {
    id: 'clu-001',
    name: 'Juan Dela Cruz',
    email: 'juan@client.com',
    role: 'CLIENT',
    active: true,
    accountStatus: 'Active',
    createdAt: '2024-06-01T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
  {
    id: 'clu-002',
    name: 'Maria Clara',
    email: 'maria@client.com',
    role: 'CLIENT',
    active: false,
    accountStatus: 'Inactive',
    createdAt: '2024-07-01T08:00:00Z',
    updatedAt: '2026-03-01T10:00:00Z',
  },
];

export default function ClientUserManagement() {
  const router = useRouter();
  const [users, setUsers] = useState<ClientUserRecord[]>(MOCK_CLIENT_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<ClientUserRecord | null>(null);

  // Derived
  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'Active') result = result.filter((u) => u.accountStatus === 'Active');
    if (statusFilter === 'Inactive') result = result.filter((u) => u.accountStatus === 'Inactive');
    if (statusFilter === 'Suspended') result = result.filter((u) => u.accountStatus === 'Suspended');
    return result;
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Stats
  const activeCount = users.filter((u) => u.accountStatus === 'Active').length;
  const inactiveCount = users.filter((u) => u.accountStatus === 'Inactive').length;
  const suspendedCount = users.filter((u) => u.accountStatus === 'Suspended').length;

  // Handlers
  function changeStatus(userId: string, newStatus: AccountStatus): void {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, accountStatus: newStatus, active: newStatus === 'Active', updatedAt: new Date().toISOString() }
          : u
      )
    );
    setViewingUser((prev) =>
      prev && prev.id === userId
        ? { ...prev, accountStatus: newStatus, active: newStatus === 'Active', updatedAt: new Date().toISOString() }
        : prev
    );
  }

  // Stat cards config
  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Inactive', value: inactiveCount, icon: UserX, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { label: 'Suspended', value: suspendedCount, icon: Ban, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center gap-2 mb-2">
        <Button variant="outline"  onClick={() => router.push('/dashboard/settings/client-management')}>
          <ArrowLeft size={16} className="mr-1" />
          Back to Clients
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Client User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage client user accounts and access
          </p>
        </div>
        <Button>
          <Plus size={16} />
          Add User
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-4 flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${s.color}`}>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => {
                  const initials = user.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="flex items-center gap-3 hover:opacity-80 transition text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-xs font-bold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <span className="font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap underline-offset-2 hover:underline block">
                              {user.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">
                              {user.email}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3">{user.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[user.accountStatus]}>
                          {user.accountStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="outline" onClick={() => setViewingUser(user)}>
                          <Eye size={14} className="mr-1" /> View
                        </Button>
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() => changeStatus(user.id, user.accountStatus === 'Active' ? 'Inactive' : 'Active')}
                        >
                          {user.accountStatus === 'Active' ? (
                            <>
                              <Power size={13} className="mr-1" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck size={13} className="mr-1" /> Activate
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          className="ml-2"
                          onClick={() => changeStatus(user.id, 'Suspended')}
                          disabled={user.accountStatus === 'Suspended'}
                        >
                          <Ban size={13} className="mr-1" /> Suspend
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {(page - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} users
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                    n === page ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* User Details Modal */}
      {viewingUser && (
        <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details" size="md">
          <div className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-lg font-bold shrink-0">
                {viewingUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground truncate">{viewingUser.name}</h3>
                <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
              </div>
              <Badge variant={STATUS_VARIANT[viewingUser.accountStatus]}>
                {viewingUser.accountStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Role</p>
                <p className="text-sm text-foreground">{viewingUser.role}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Created</p>
                <p className="text-sm text-foreground">{new Date(viewingUser.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Last Updated</p>
                <p className="text-sm text-foreground">{new Date(viewingUser.updatedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
