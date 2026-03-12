// src/components/dashboard/UserManagement.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
// EditablePortalAccess component (top-level)
type EditablePortalAccessProps = {
  user: MockUserRecord;
  onSave: (access: PortalAccessEntry[]) => void;
};
function EditablePortalAccess({ user, onSave }: EditablePortalAccessProps) {
  const [editing, setEditing] = useState(false);
  const [access, setAccess] = useState<PortalAccessEntry[]>(user.portalAccess);

  // All possible portals
  const allPortals = Object.keys(PORTAL_LABELS);

  // Sync state if user changes
  useEffect(() => {
    setAccess(user.portalAccess);
    setEditing(false);
  }, [user]);

  function handleToggle(portal: string) {
    const exists = access.find((a) => a.portal === portal);
    if (exists) {
      setAccess(access.filter((a) => a.portal !== portal));
    } else {
      setAccess([
        ...access,
        { portal, canRead: true, canWrite: false, canEdit: false, canDelete: false },
      ]);
    }
  }

  function handlePermChange(portal: string, perm: keyof PortalAccessEntry, checked: boolean) {
    setAccess((prev) =>
      prev.map((a) =>
        a.portal === portal ? { ...a, [perm]: checked } : a
      )
    );
  }

  function handleSave() {
    onSave(access);
    setEditing(false);
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground mb-3">Portal Access</h4>
      <div className="space-y-2">
        {allPortals.map((portal) => {
          const entry = access.find((a) => a.portal === portal);
          return (
            <div
              key={portal}
              className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-xl border border-border bg-muted/30"
            >
              <label className="flex items-center gap-2 min-w-40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!entry}
                  onChange={() => {
                    setEditing(true);
                    handleToggle(portal);
                  }}
                  className="accent-blue-600 w-4 h-4 rounded"
                />
                <span className="text-sm font-medium text-foreground">
                  {PORTAL_LABELS[portal] ?? portal}
                </span>
              </label>
              {/* Permissions checkboxes, only if checked */}
              {entry && (
                <div className="flex flex-wrap gap-2 ml-6">
                  {PERM_KEYS.map((perm) => (
                    <label key={perm} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={entry[perm]}
                        onChange={(e) => {
                          setEditing(true);
                          handlePermChange(portal, perm, e.target.checked);
                        }}
                        className="accent-blue-600 w-3.5 h-3.5 rounded"
                      />
                      {PERM_LABELS[perm]}
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex gap-2 mt-4">
        <Button
          onClick={handleSave}
          disabled={!editing}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Save
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setAccess(user.portalAccess);
            setEditing(false);
          }}
          disabled={!editing}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  Search,
  Plus,
  Users,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Ban,
  UserX,
  Power,
} from 'lucide-react';

/* ─── Types (matching API response shape) ─────────────────────────── */

type AccountStatus = 'Active' | 'Inactive' | 'Suspended';

interface PortalAccessEntry {
  portal: string;
  canRead: boolean;
  canWrite: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

interface MockUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    department: string;
    position: string;
    phone: string;
    hireDate: string;
    employmentType: string;
    employmentStatus: string;
  } | null;
  portalAccess: PortalAccessEntry[];
}

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

const STATUS_VARIANT: Record<AccountStatus, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
};

const PORTAL_LABELS: Record<string, string> = {
  SALES: 'Sales Portal',
  COMPLIANCE: 'Compliance Portal',
  LIAISON: 'Liaison Portal',
  ACCOUNTING: 'Accounting Portal',
  ACCOUNT_OFFICER: 'Account Officer Portal',
  HR: 'HR Portal',
};

const PERM_KEYS = ['canRead', 'canWrite', 'canEdit', 'canDelete'] as const;
const PERM_LABELS: Record<string, string> = {
  canRead: 'Read', canWrite: 'Write', canEdit: 'Edit', canDelete: 'Delete',
};

const ITEMS_PER_PAGE = 10;

type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Suspended';

/* ─── Mock Data (follows GET /api/admin/users response shape) ─────── */

const MOCK_USERS: MockUserRecord[] = [
  {
    id: 'usr-001', name: 'Rosa Mendoza', email: 'rosa.mendoza@agila.ph', role: 'SUPER_ADMIN',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-06-01T08:00:00Z', updatedAt: '2026-03-01T10:00:00Z',
    employee: {
      id: 1, firstName: 'Rosa', lastName: 'Mendoza', employeeNo: 'EMP-0001',
      department: 'HR', position: 'HR Manager', phone: '09171234567',
      hireDate: '2024-06-01', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'HR', canRead: true, canWrite: true, canEdit: true, canDelete: true },
      { portal: 'SALES', canRead: true, canWrite: true, canEdit: true, canDelete: true },
      { portal: 'COMPLIANCE', canRead: true, canWrite: true, canEdit: true, canDelete: true },
      { portal: 'ACCOUNTING', canRead: true, canWrite: true, canEdit: true, canDelete: true },
    ],
  },
  {
    id: 'usr-002', name: 'Elena Torres', email: 'elena.torres@agila.ph', role: 'ADMIN',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-07-15T08:00:00Z', updatedAt: '2026-02-20T09:00:00Z',
    employee: {
      id: 2, firstName: 'Elena', lastName: 'Torres', employeeNo: 'EMP-0002',
      department: 'Admin', position: 'Admin Assistant', phone: '09181234567',
      hireDate: '2024-07-15', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'HR', canRead: true, canWrite: true, canEdit: true, canDelete: false },
      { portal: 'ACCOUNTING', canRead: true, canWrite: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'usr-003', name: 'Maria Santos', email: 'maria.santos@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-08-01T08:00:00Z', updatedAt: '2026-03-05T11:00:00Z',
    employee: {
      id: 3, firstName: 'Maria', lastName: 'Santos', employeeNo: 'EMP-0003',
      department: 'Sales', position: 'Sales Manager', phone: '09191234567',
      hireDate: '2024-08-01', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'SALES', canRead: true, canWrite: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'usr-004', name: 'Juan Cruz', email: 'juan.cruz@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-09-01T08:00:00Z', updatedAt: '2026-02-15T10:00:00Z',
    employee: {
      id: 4, firstName: 'Juan', lastName: 'Cruz', employeeNo: 'EMP-0004',
      department: 'Accounting', position: 'Senior Accountant', phone: '09201234567',
      hireDate: '2024-09-01', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'ACCOUNTING', canRead: true, canWrite: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'usr-005', name: 'Ana Reyes', email: 'ana.reyes@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-10-01T08:00:00Z', updatedAt: '2026-03-10T08:00:00Z',
    employee: {
      id: 5, firstName: 'Ana', lastName: 'Reyes', employeeNo: 'EMP-0005',
      department: 'Compliance', position: 'Compliance Manager', phone: '09211234567',
      hireDate: '2024-10-01', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'COMPLIANCE', canRead: true, canWrite: true, canEdit: true, canDelete: true },
    ],
  },
  {
    id: 'usr-006', name: 'Carlos Garcia', email: 'carlos.garcia@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2024-11-01T08:00:00Z', updatedAt: '2026-01-20T09:00:00Z',
    employee: {
      id: 6, firstName: 'Carlos', lastName: 'Garcia', employeeNo: 'EMP-0006',
      department: 'Liaison', position: 'Liaison Supervisor', phone: '09221234567',
      hireDate: '2024-11-01', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'LIAISON', canRead: true, canWrite: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'usr-007', name: 'Patricia Lim', email: 'patricia.lim@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2025-01-15T08:00:00Z', updatedAt: '2026-03-08T10:00:00Z',
    employee: {
      id: 7, firstName: 'Patricia', lastName: 'Lim', employeeNo: 'EMP-0007',
      department: 'Account Officer', position: 'Account Manager', phone: '09231234567',
      hireDate: '2025-01-15', employmentType: 'REGULAR', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'ACCOUNT_OFFICER', canRead: true, canWrite: true, canEdit: true, canDelete: false },
    ],
  },
  {
    id: 'usr-008', name: 'Mark Villanueva', email: 'mark.villanueva@agila.ph', role: 'EMPLOYEE',
    active: false, accountStatus: 'Inactive', emailVerified: true,
    createdAt: '2025-02-01T08:00:00Z', updatedAt: '2026-03-01T09:00:00Z',
    employee: {
      id: 8, firstName: 'Mark', lastName: 'Villanueva', employeeNo: 'EMP-0008',
      department: 'IT', position: 'IT Manager', phone: '09241234567',
      hireDate: '2025-02-01', employmentType: 'REGULAR', employmentStatus: 'RESIGNED',
    },
    portalAccess: [],
  },
  {
    id: 'usr-009', name: 'Roberto Tan', email: 'roberto.tan@agila.ph', role: 'EMPLOYEE',
    active: false, accountStatus: 'Suspended', emailVerified: true,
    createdAt: '2025-03-01T08:00:00Z', updatedAt: '2026-02-28T09:00:00Z',
    employee: {
      id: 9, firstName: 'Roberto', lastName: 'Tan', employeeNo: 'EMP-0009',
      department: 'Sales', position: 'Sales Associate', phone: '09251234567',
      hireDate: '2025-03-01', employmentType: 'PROBATIONARY', employmentStatus: 'SUSPENDED',
    },
    portalAccess: [
      { portal: 'SALES', canRead: true, canWrite: false, canEdit: false, canDelete: false },
    ],
  },
  {
    id: 'usr-010', name: 'David Aquino', email: 'david.aquino@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: false,
    createdAt: '2025-06-01T08:00:00Z', updatedAt: '2026-03-10T11:00:00Z',
    employee: {
      id: 10, firstName: 'David', lastName: 'Aquino', employeeNo: 'EMP-0010',
      department: 'Compliance', position: 'Compliance Officer', phone: '09261234567',
      hireDate: '2025-06-01', employmentType: 'CONTRACTUAL', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'COMPLIANCE', canRead: true, canWrite: true, canEdit: false, canDelete: false },
    ],
  },
  {
    id: 'usr-011', name: 'Sofia Bautista', email: 'sofia.bautista@agila.ph', role: 'EMPLOYEE',
    active: true, accountStatus: 'Active', emailVerified: true,
    createdAt: '2025-08-01T08:00:00Z', updatedAt: '2026-03-11T08:00:00Z',
    employee: {
      id: 11, firstName: 'Sofia', lastName: 'Bautista', employeeNo: 'EMP-0011',
      department: 'Accounting', position: 'Junior Accountant', phone: '09271234567',
      hireDate: '2025-08-01', employmentType: 'PROBATIONARY', employmentStatus: 'ACTIVE',
    },
    portalAccess: [
      { portal: 'ACCOUNTING', canRead: true, canWrite: true, canEdit: false, canDelete: false },
    ],
  },
  {
    id: 'usr-012', name: 'Angelo Ramos', email: 'angelo.ramos@agila.ph', role: 'EMPLOYEE',
    active: false, accountStatus: 'Inactive', emailVerified: true,
    createdAt: '2025-09-15T08:00:00Z', updatedAt: '2026-01-15T10:00:00Z',
    employee: {
      id: 12, firstName: 'Angelo', lastName: 'Ramos', employeeNo: 'EMP-0012',
      department: 'Liaison', position: 'Liaison Officer', phone: '09281234567',
      hireDate: '2025-09-15', employmentType: 'REGULAR', employmentStatus: 'RESIGNED',
    },
    portalAccess: [],
  },
];

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserManagement(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<MockUserRecord[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<MockUserRecord | null>(null);

  /* ─── Derived ────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.employee?.employeeNo?.toLowerCase().includes(q) ?? false) ||
          (u.employee?.department.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter === 'Active') result = result.filter((u) => u.accountStatus === 'Active');
    if (statusFilter === 'Inactive') result = result.filter((u) => u.accountStatus === 'Inactive');
    if (statusFilter === 'Suspended') result = result.filter((u) => u.accountStatus === 'Suspended');
    return result;
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const activeCount = users.filter((u) => u.accountStatus === 'Active').length;
  const inactiveCount = users.filter((u) => u.accountStatus === 'Inactive').length;
  const suspendedCount = users.filter((u) => u.accountStatus === 'Suspended').length;

  /* ─── Handlers ───────────────────────────────────────────── */

  function changeStatus(userId: string, newStatus: AccountStatus): void {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, accountStatus: newStatus, active: newStatus === 'Active', updatedAt: new Date().toISOString() }
          : u
      )
    );
    // Also update the viewing modal if open
    setViewingUser((prev) =>
      prev && prev.id === userId
        ? { ...prev, accountStatus: newStatus, active: newStatus === 'Active', updatedAt: new Date().toISOString() }
        : prev
    );
    const label = newStatus === 'Active' ? 'activated' : newStatus === 'Inactive' ? 'deactivated' : 'suspended';
    const user = users.find((u) => u.id === userId);
    success('Account updated', `${user?.name ?? 'User'} has been ${label}.`);
  }

  /* ─── Stats ──────────────────────────────────────────────── */

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Inactive', value: inactiveCount, icon: UserX, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { label: 'Suspended', value: suspendedCount, icon: Ban, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
    { label: 'Admins', value: users.filter((u) => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length, icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30 dark:text-purple-400' },
  ];

  /* ─── Render ─────────────────────────────────────────────── */

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
        <Button>
          <Plus size={16} />
          Add User
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
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
              placeholder="Search by name, email, employee no., or department..."
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
                        {user.employee?.department ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {user.employee?.position ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={ROLE_VARIANT[user.role] ?? 'neutral'}>
                          {ROLE_LABELS[user.role] ?? user.role}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[user.accountStatus]}>
                          {user.accountStatus}
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
                          {user.accountStatus !== 'Active' && (
                            <button
                              onClick={() => changeStatus(user.id, 'Active')}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
                              title="Activate account"
                            >
                              <Power size={15} />
                            </button>
                          )}
                          {user.accountStatus === 'Active' && (
                            <button
                              onClick={() => changeStatus(user.id, 'Inactive')}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Deactivate account"
                            >
                              <UserX size={15} />
                            </button>
                          )}
                          {user.accountStatus !== 'Suspended' && (
                            <button
                              onClick={() => changeStatus(user.id, 'Suspended')}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition"
                              title="Suspend account"
                            >
                              <Ban size={15} />
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

      {/* ─── Detail Modal ─────────────────────────────────────── */}
      <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="User Details" size="lg">
        {viewingUser && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-lg font-bold shrink-0">
                {viewingUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground truncate">{viewingUser.name}</h3>
                <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={STATUS_VARIANT[viewingUser.accountStatus]}>
                  {viewingUser.accountStatus}
                </Badge>
                <Badge variant={ROLE_VARIANT[viewingUser.role] ?? 'neutral'}>
                  {ROLE_LABELS[viewingUser.role] ?? viewingUser.role}
                </Badge>
              </div>
            </div>

            {/* Employee Info */}
            {viewingUser.employee && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Employee No.', value: viewingUser.employee.employeeNo ?? '—' },
                  { label: 'Department', value: viewingUser.employee.department },
                  { label: 'Position', value: viewingUser.employee.position },
                  { label: 'Phone', value: viewingUser.employee.phone },
                  { label: 'Hire Date', value: viewingUser.employee.hireDate },
                  { label: 'Employment Type', value: viewingUser.employee.employmentType },
                  { label: 'Employment Status', value: viewingUser.employee.employmentStatus },
                  { label: 'Email Verified', value: viewingUser.emailVerified ? 'Yes' : 'No' },
                  { label: 'Created', value: new Date(viewingUser.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                ].map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Editable Portal Access */}
            <EditablePortalAccess
              user={viewingUser}
              onSave={(updatedAccess) => {
                const updatedUser = { ...viewingUser, portalAccess: updatedAccess };
                setUsers((prev) => prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)));
                setViewingUser(updatedUser);
                success('Portal access updated', 'User portal access has been updated.');
              }}
            />

            {/* Account Actions */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Account Actions</h4>
              <div className="flex flex-wrap gap-2">
                {viewingUser.accountStatus !== 'Active' && (
                  <Button
                    onClick={() => changeStatus(viewingUser.id, 'Active')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <Power size={14} /> Activate
                  </Button>
                )}
                {viewingUser.accountStatus === 'Active' && (
                  <Button
                    variant="outline"
                    onClick={() => changeStatus(viewingUser.id, 'Inactive')}
                    className="gap-2"
                  >
                    <UserX size={14} /> Deactivate
                  </Button>
                )}
                {viewingUser.accountStatus !== 'Suspended' && (
                  <Button
                    variant="outline"
                    onClick={() => changeStatus(viewingUser.id, 'Suspended')}
                    className="gap-2 text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                  >
                    <Ban size={14} /> Suspend
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
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
