// src/components/dashboard/ClientManagement.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  Search,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
  Ban,
  UserX,
  Power,
} from 'lucide-react';

/* ─── Types (matching Prisma ClientUser + Client models) ──────────── */

type AccountStatus = 'Active' | 'Inactive' | 'Suspended';

interface MockClientUser {
  id: string;
  email: string;
  role: string;
  active: boolean;
  accountStatus: AccountStatus;
  name: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    companyCode: string | null;
    clientNo: string | null;
    businessName: string | null;
    businessType: string | null;
    portalName: string | null;
    active: boolean;
    branchType: string | null;
    timezone: string;
    createdAt: string | null;
  } | null;
}

/* ─── Constants ───────────────────────────────────────────────────── */

const STATUS_VARIANT: Record<AccountStatus, 'success' | 'danger' | 'warning'> = {
  Active: 'success',
  Inactive: 'danger',
  Suspended: 'warning',
};

const ITEMS_PER_PAGE = 10;

type StatusFilter = 'All' | 'Active' | 'Inactive' | 'Suspended';

/* ─── Mock Data (follows Prisma ClientUser + Client model shape) ──── */

const MOCK_CLIENT_USERS: MockClientUser[] = [
  {
    id: 'cu-001', email: 'roberto.v@villanuevatrading.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Roberto Villanueva',
    createdAt: '2025-10-15T09:00:00Z', updatedAt: '2026-03-01T10:00:00Z',
    client: {
      id: 1, companyCode: 'VTC-001', clientNo: '2026-0001',
      businessName: 'Villanueva Trading Co.', businessType: 'SOLE_PROPRIETORSHIP',
      portalName: 'Villanueva Trading Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-10-15T09:00:00Z',
    },
  },
  {
    id: 'cu-002', email: 'patricia.lim@limholdings.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Patricia Lim',
    createdAt: '2025-08-22T14:30:00Z', updatedAt: '2026-02-20T09:00:00Z',
    client: {
      id: 2, companyCode: 'LHC-002', clientNo: '2026-0002',
      businessName: 'Lim Holdings Corporation', businessType: 'CORPORATION',
      portalName: 'Lim Holdings Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-08-22T14:30:00Z',
    },
  },
  {
    id: 'cu-003', email: 'marco.tan@tanlaw.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Marco Tan',
    createdAt: '2025-11-05T11:00:00Z', updatedAt: '2026-03-05T11:00:00Z',
    client: {
      id: 3, companyCode: 'TAL-003', clientNo: '2026-0003',
      businessName: 'Tan & Associates Law Firm', businessType: 'PARTNERSHIP',
      portalName: 'Tan Law Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-11-05T11:00:00Z',
    },
  },
  {
    id: 'cu-004', email: 'isabella.cruz@cruzenterprises.ph', role: 'CLIENT',
    active: false, accountStatus: 'Inactive', name: 'Isabella Cruz',
    createdAt: '2026-01-10T08:00:00Z', updatedAt: '2026-02-28T09:00:00Z',
    client: {
      id: 4, companyCode: 'CEI-004', clientNo: '2026-0004',
      businessName: 'Cruz Enterprises Inc.', businessType: 'CORPORATION',
      portalName: 'Cruz Enterprises Portal', active: false, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2026-01-10T08:00:00Z',
    },
  },
  {
    id: 'cu-005', email: 'diego.aquino@aquinotech.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Diego Aquino',
    createdAt: '2025-06-01T10:00:00Z', updatedAt: '2026-03-10T08:00:00Z',
    client: {
      id: 5, companyCode: 'ATS-005', clientNo: '2026-0005',
      businessName: 'Aquino Tech Solutions', businessType: 'CORPORATION',
      portalName: 'Aquino Tech Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-06-01T10:00:00Z',
    },
  },
  {
    id: 'cu-006', email: 'carmen.reyes@reyeslaw.ph', role: 'CLIENT',
    active: false, accountStatus: 'Suspended', name: 'Carmen Reyes',
    createdAt: '2025-12-20T09:00:00Z', updatedAt: '2026-03-01T09:00:00Z',
    client: {
      id: 6, companyCode: 'RLO-006', clientNo: '2026-0006',
      businessName: 'Reyes Law Office', businessType: 'INDIVIDUAL',
      portalName: 'Reyes Law Portal', active: false, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-12-20T09:00:00Z',
    },
  },
  {
    id: 'cu-007', email: 'angelo.santos@santosfood.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Angelo Santos',
    createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-03-11T08:00:00Z',
    client: {
      id: 7, companyCode: 'SFC-007', clientNo: '2026-0007',
      businessName: 'Santos Food Corporation', businessType: 'CORPORATION',
      portalName: 'Santos Food Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2026-02-01T10:00:00Z',
    },
  },
  {
    id: 'cu-008', email: 'sofia.b@bautistaretail.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Sofia Bautista',
    createdAt: '2025-09-10T09:00:00Z', updatedAt: '2026-03-08T10:00:00Z',
    client: {
      id: 8, companyCode: 'BRS-008', clientNo: '2026-0008',
      businessName: 'Bautista Retail Shop', businessType: 'SOLE_PROPRIETORSHIP',
      portalName: 'Bautista Retail Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-09-10T09:00:00Z',
    },
  },
  {
    id: 'cu-009', email: 'elena.m@mendozacorp.ph', role: 'CLIENT',
    active: false, accountStatus: 'Inactive', name: 'Elena Mendoza',
    createdAt: '2025-07-15T08:00:00Z', updatedAt: '2026-01-15T10:00:00Z',
    client: {
      id: 9, companyCode: 'MC-009', clientNo: '2026-0009',
      businessName: 'Mendoza Construction Corp.', businessType: 'CORPORATION',
      portalName: 'Mendoza Construction Portal', active: false, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2025-07-15T08:00:00Z',
    },
  },
  {
    id: 'cu-010', email: 'rafael.g@garciafarms.ph', role: 'CLIENT',
    active: true, accountStatus: 'Active', name: 'Rafael Garcia',
    createdAt: '2026-01-20T08:00:00Z', updatedAt: '2026-03-12T08:00:00Z',
    client: {
      id: 10, companyCode: 'GF-010', clientNo: '2026-0010',
      businessName: 'Garcia Farms & Produce', businessType: 'SOLE_PROPRIETORSHIP',
      portalName: 'Garcia Farms Portal', active: true, branchType: 'Main',
      timezone: 'Asia/Manila', createdAt: '2026-01-20T08:00:00Z',
    },
  },
];

const BIZ_TYPE_LABELS: Record<string, string> = {
  INDIVIDUAL: 'Individual',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  CORPORATION: 'Corporation',
  COOPERATIVE: 'Cooperative',
};

/* ─── Component ───────────────────────────────────────────────────── */

export default function ClientManagement(): React.ReactNode {
  const { success } = useToast();

  const [clientUsers, setClientUsers] = useState<MockClientUser[]>(MOCK_CLIENT_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [page, setPage] = useState(1);
  const [viewingUser, setViewingUser] = useState<MockClientUser | null>(null);

  /* ─── Derived ────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = clientUsers;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          (u.name?.toLowerCase().includes(q) ?? false) ||
          u.email.toLowerCase().includes(q) ||
          (u.client?.businessName?.toLowerCase().includes(q) ?? false) ||
          (u.client?.clientNo?.toLowerCase().includes(q) ?? false) ||
          (u.client?.companyCode?.toLowerCase().includes(q) ?? false)
      );
    }
    if (statusFilter === 'Active') result = result.filter((u) => u.accountStatus === 'Active');
    if (statusFilter === 'Inactive') result = result.filter((u) => u.accountStatus === 'Inactive');
    if (statusFilter === 'Suspended') result = result.filter((u) => u.accountStatus === 'Suspended');
    return result;
  }, [clientUsers, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = clientUsers.filter((u) => u.accountStatus === 'Active').length;
  const inactiveCount = clientUsers.filter((u) => u.accountStatus === 'Inactive').length;
  const suspendedCount = clientUsers.filter((u) => u.accountStatus === 'Suspended').length;

  /* ─── Handlers ───────────────────────────────────────────── */

  function changeStatus(userId: string, newStatus: AccountStatus): void {
    setClientUsers((prev) =>
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
    const label = newStatus === 'Active' ? 'activated' : newStatus === 'Inactive' ? 'deactivated' : 'suspended';
    const user = clientUsers.find((u) => u.id === userId);
    success('Account updated', `${user?.name ?? 'Client'} has been ${label}.`);
  }

  /* ─── Stats ──────────────────────────────────────────────── */

  const stats = [
    { label: 'Total Clients', value: clientUsers.length, icon: Building2, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { label: 'Inactive', value: inactiveCount, icon: UserX, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400' },
    { label: 'Suspended', value: suspendedCount, icon: Ban, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Client Management</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage client user accounts and access
        </p>
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
              placeholder="Search by name, email, business name, or client no..."
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

      {/* Client Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Client User</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Business Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Business Type</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Client No.</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    No client users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => {
                  const initials = (user.name ?? user.email)
                    .split(/[\s@]/)
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
                              {user.name ?? '—'}
                            </span>
                            <span className="text-[11px] text-muted-foreground block">{user.email}</span>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-foreground hidden md:table-cell">
                        {user.client?.businessName ?? '—'}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {user.client?.businessType ? (
                          <Badge variant="neutral">
                            {BIZ_TYPE_LABELS[user.client.businessType] ?? user.client.businessType}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs hidden xl:table-cell">
                        {user.client?.clientNo ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[user.accountStatus]}>
                          {user.accountStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/dashboard/clients/${user.client?.id ?? user.client}/users`}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                            title="Manage client users"
                          >
                            <Eye size={15} />
                          </a>
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
              {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} clients
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
      <Modal isOpen={!!viewingUser} onClose={() => setViewingUser(null)} title="Client User Details" size="lg">
        {viewingUser && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 flex items-center justify-center text-lg font-bold shrink-0">
                {(viewingUser.name ?? viewingUser.email).split(/[\s@]/).map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-foreground truncate">{viewingUser.name ?? '—'}</h3>
                <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
              </div>
              <Badge variant={STATUS_VARIANT[viewingUser.accountStatus]} className="shrink-0">
                {viewingUser.accountStatus}
              </Badge>
            </div>

            {/* Client Business Info */}
            {viewingUser.client && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Business Information</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Business Name', value: viewingUser.client.businessName ?? '—' },
                    { label: 'Company Code', value: viewingUser.client.companyCode ?? '—' },
                    { label: 'Client No.', value: viewingUser.client.clientNo ?? '—' },
                    { label: 'Business Type', value: viewingUser.client.businessType ? BIZ_TYPE_LABELS[viewingUser.client.businessType] ?? viewingUser.client.businessType : '—' },
                    { label: 'Portal Name', value: viewingUser.client.portalName ?? '—' },
                    { label: 'Branch Type', value: viewingUser.client.branchType ?? '—' },
                    { label: 'Timezone', value: viewingUser.client.timezone },
                    { label: 'Client Active', value: viewingUser.client.active ? 'Yes' : 'No' },
                    { label: 'Registered', value: viewingUser.client.createdAt ? new Date(viewingUser.client.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—' },
                  ].map((f) => (
                    <div key={f.label} className="space-y-0.5">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className="text-sm text-foreground">{f.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Account Info */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Account Information</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Role', value: viewingUser.role },
                  { label: 'Account Active', value: viewingUser.active ? 'Yes' : 'No' },
                  { label: 'Created', value: new Date(viewingUser.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                  { label: 'Last Updated', value: new Date(viewingUser.updatedAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) },
                ].map((f) => (
                  <div key={f.label} className="space-y-0.5">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{f.label}</p>
                    <p className="text-sm text-foreground">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>

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
