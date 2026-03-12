// src/app/(dashboard)/dashboard/settings/user-management/components/UserManagement.tsx
'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import type { UserRecord } from '@/lib/schemas/user-management';
import UserFormModal from './UserFormModal';
import UserViewModal from './UserViewModal';
import UserDeleteModal from './UserDeleteModal';
import UserReactivateModal from './UserReactivateModal';
import {
  Search,
  Plus,
  Users,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Trash2,
  UserX,
  RotateCcw,
} from 'lucide-react';

/* ─── Constants ───────────────────────────────────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

const ROLE_VARIANT: Record<string, 'info' | 'warning' | 'neutral'> = {
  SUPER_ADMIN: 'info',
  ADMIN: 'warning',
  EMPLOYEE: 'neutral',
};

const ITEMS_PER_PAGE = 10;

type StatusFilter = 'All' | 'Active' | 'Inactive';

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserManagement(): React.ReactNode {
  const { error: toastError } = useToast();

  /* ─── State ──────────────────────────────────────────────── */
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);

  // Modal states
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRecord | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserRecord | null>(null);
  const [reactivatingUser, setReactivatingUser] = useState<UserRecord | null>(null);

  /* ─── Fetch users ────────────────────────────────────────── */

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        toastError('Failed to load users', 'Could not fetch user list.');
        return;
      }
      const json = await res.json();
      setUsers(json.data ?? []);
    } catch {
      toastError('Network error', 'Could not reach the server.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  /* ─── Derived ────────────────────────────────────────────── */

  // Reset page on filter change (adjust-state-during-render pattern)
  const [prevFilters, setPrevFilters] = useState({ search, statusFilter });
  if (prevFilters.search !== search || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ search, statusFilter });
    setPage(1);
  }

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.employee?.employeeNo?.toLowerCase().includes(q) ?? false) ||
          (u.employee?.employment?.department?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter === 'Active') result = result.filter((u) => u.active);
    if (statusFilter === 'Inactive') result = result.filter((u) => !u.active);
    return result;
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const activeCount = users.filter((u) => u.active).length;
  const inactiveCount = users.filter((u) => !u.active).length;

  /* ─── Modal handlers ─────────────────────────────────────── */

  function openAdd(): void {
    setEditingUser(null);
    setFormOpen(true);
  }

  function openEdit(user: UserRecord): void {
    setEditingUser(user);
    setFormOpen(true);
  }

  function closeForm(): void {
    setFormOpen(false);
    setEditingUser(null);
  }

  /* ─── Stats ──────────────────────────────────────────────── */

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Inactive', value: inactiveCount, icon: UserX, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { label: 'Admins', value: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  /* ─── Render ─────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage employee accounts, roles, and portal access
          </p>
        </div>
        <Button onClick={openAdd}>
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, employee no., or department..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Position</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
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
                              {user.employee?.employeeNo ?? user.email}
                            </span>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {user.employee?.employment?.department ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {user.employee?.employment?.position ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.active ? 'success' : 'danger'}>
                          {user.active ? 'Active' : 'Inactive'}
                        </Badge>
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
                            onClick={() => openEdit(user)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                            title="Edit user"
                          >
                            <Pencil size={15} />
                          </button>
                          {user.active ? (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition"
                              title="Deactivate user"
                            >
                              <Trash2 size={15} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setReactivatingUser(user)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                              title="Reactivate user"
                            >
                              <RotateCcw size={15} />
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

      {/* ─── Modals ───────────────────────────────────────────── */}

      <UserFormModal
        isOpen={formOpen}
        onClose={closeForm}
        onSaved={fetchUsers}
        editingUser={editingUser}
      />

      <UserViewModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(user) => {
          setViewingUser(null);
          openEdit(user);
        }}
      />

      <UserDeleteModal
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onDeleted={fetchUsers}
        user={deletingUser}
      />

      <UserReactivateModal
        isOpen={!!reactivatingUser}
        onClose={() => setReactivatingUser(null)}
        onReactivated={fetchUsers}
        user={reactivatingUser}
      />
    </div>
  );
}
