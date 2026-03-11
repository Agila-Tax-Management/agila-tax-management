// src/components/dashboard/UserManagement.tsx
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
  Plus,
  Pencil,
  Trash2,
  Users,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────────────────── */

type UserStatus = 'Active' | 'Inactive' | 'Suspended';

interface PortalAccess {
  sales: boolean;
  compliance: boolean;
  liaison: boolean;
  accounting: boolean;
  accountOfficer: boolean;
  hr: boolean;
}

interface ManagedUser {
  id: string;
  name: string;
  login: string;
  language: string;
  latestAuthentication: string;
  company: string;
  status: UserStatus;
  portalAccess: PortalAccess;
}

const PORTAL_LABELS: Record<keyof PortalAccess, string> = {
  sales: 'Sales Portal',
  compliance: 'Compliance Portal',
  liaison: 'Liaison Portal',
  accounting: 'Accounting Portal',
  accountOfficer: 'Account Officer Portal',
  hr: 'HR Portal',
};

const STATUS_VARIANT: Record<UserStatus, 'success' | 'neutral' | 'danger'> = {
  Active: 'success',
  Inactive: 'neutral',
  Suspended: 'danger',
};

/* ─── Mock Data ───────────────────────────────────────────────────── */

const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'usr-1',
    name: 'Roberto Villanueva',
    login: 'roberto.v',
    language: 'English',
    latestAuthentication: '2026-03-11 08:24 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: true, compliance: false, liaison: false, accounting: false, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-2',
    name: 'Maria Santos',
    login: 'maria.s',
    language: 'English',
    latestAuthentication: '2026-03-11 07:50 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: false, liaison: false, accounting: true, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-3',
    name: 'Juan Dela Cruz',
    login: 'juan.dc',
    language: 'Filipino',
    latestAuthentication: '2026-03-10 05:12 PM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: true, liaison: true, accounting: false, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-4',
    name: 'Patricia Lim',
    login: 'patricia.l',
    language: 'English',
    latestAuthentication: '2026-03-11 09:01 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: false, liaison: false, accounting: false, accountOfficer: false, hr: true },
  },
  {
    id: 'usr-5',
    name: 'Carlos Reyes',
    login: 'carlos.r',
    language: 'English',
    latestAuthentication: '2026-03-09 03:45 PM',
    company: 'Agila Tax Management Services',
    status: 'Inactive',
    portalAccess: { sales: true, compliance: false, liaison: false, accounting: false, accountOfficer: true, hr: false },
  },
  {
    id: 'usr-6',
    name: 'Elena Fernandez',
    login: 'elena.f',
    language: 'English',
    latestAuthentication: '2026-03-11 08:00 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: true, compliance: true, liaison: false, accounting: false, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-7',
    name: 'Miguel Torres',
    login: 'miguel.t',
    language: 'Filipino',
    latestAuthentication: '2026-03-08 11:30 AM',
    company: 'Agila Tax Management Services',
    status: 'Suspended',
    portalAccess: { sales: false, compliance: false, liaison: true, accounting: false, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-8',
    name: 'Angela Cruz',
    login: 'angela.c',
    language: 'English',
    latestAuthentication: '2026-03-11 07:30 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: false, liaison: false, accounting: true, accountOfficer: true, hr: false },
  },
  {
    id: 'usr-9',
    name: 'Ricardo Garcia',
    login: 'ricardo.g',
    language: 'English',
    latestAuthentication: '2026-03-10 02:15 PM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: true, compliance: true, liaison: true, accounting: true, accountOfficer: true, hr: true },
  },
  {
    id: 'usr-10',
    name: 'Sofia Mendoza',
    login: 'sofia.m',
    language: 'Filipino',
    latestAuthentication: '2026-03-07 04:00 PM',
    company: 'Agila Tax Management Services',
    status: 'Inactive',
    portalAccess: { sales: false, compliance: false, liaison: false, accounting: false, accountOfficer: false, hr: false },
  },
  {
    id: 'usr-11',
    name: 'Daniel Aquino',
    login: 'daniel.a',
    language: 'English',
    latestAuthentication: '2026-03-11 09:15 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: true, liaison: false, accounting: false, accountOfficer: true, hr: false },
  },
  {
    id: 'usr-12',
    name: 'Beatriz Navarro',
    login: 'beatriz.n',
    language: 'English',
    latestAuthentication: '2026-03-10 10:45 AM',
    company: 'Agila Tax Management Services',
    status: 'Active',
    portalAccess: { sales: false, compliance: false, liaison: true, accounting: true, accountOfficer: false, hr: true },
  },
];

const ITEMS_PER_PAGE = 10;

const DEFAULT_PORTAL_ACCESS: PortalAccess = {
  sales: false,
  compliance: false,
  liaison: false,
  accounting: false,
  accountOfficer: false,
  hr: false,
};

/* ─── Component ───────────────────────────────────────────────────── */

export default function UserManagement(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>(INITIAL_USERS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'All'>('All');
  const [page, setPage] = useState(1);

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [viewingUser, setViewingUser] = useState<ManagedUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formLanguage, setFormLanguage] = useState('English');
  const [formCompany, setFormCompany] = useState('Agila Tax Management Services');
  const [formStatus, setFormStatus] = useState<UserStatus>('Active');
  const [formPortalAccess, setFormPortalAccess] = useState<PortalAccess>(DEFAULT_PORTAL_ACCESS);

  /* ─── Derived ─────────────────────────────────────────────── */

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.login.toLowerCase().includes(q) ||
          u.company.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter((u) => u.status === statusFilter);
    }
    return result;
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeCount = users.filter((u) => u.status === 'Active').length;
  const inactiveCount = users.filter((u) => u.status === 'Inactive').length;
  const suspendedCount = users.filter((u) => u.status === 'Suspended').length;

  /* ─── Handlers ────────────────────────────────────────────── */

  function resetForm() {
    setFormName('');
    setFormLogin('');
    setFormLanguage('English');
    setFormCompany('Agila Tax Management Services');
    setFormStatus('Active');
    setFormPortalAccess({ ...DEFAULT_PORTAL_ACCESS });
    setEditingUser(null);
  }

  function openAdd() {
    resetForm();
    setFormModalOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setEditingUser(user);
    setFormName(user.name);
    setFormLogin(user.login);
    setFormLanguage(user.language);
    setFormCompany(user.company);
    setFormStatus(user.status);
    setFormPortalAccess({ ...user.portalAccess });
    setFormModalOpen(true);
  }

  function handleSave() {
    if (!formName.trim() || !formLogin.trim()) {
      toastError('Validation Error', 'Name and Login are required.');
      return;
    }

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? {
                ...u,
                name: formName.trim(),
                login: formLogin.trim(),
                language: formLanguage,
                company: formCompany.trim(),
                status: formStatus,
                portalAccess: { ...formPortalAccess },
              }
            : u
        )
      );
      success('User Updated', `${formName} has been updated successfully.`);
    } else {
      const newUser: ManagedUser = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        login: formLogin.trim(),
        language: formLanguage,
        latestAuthentication: 'Never',
        company: formCompany.trim(),
        status: formStatus,
        portalAccess: { ...formPortalAccess },
      };
      setUsers((prev) => [newUser, ...prev]);
      success('User Created', `${formName} has been added successfully.`);
    }

    setFormModalOpen(false);
    resetForm();
  }

  function handleDelete(id: string) {
    const user = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    setDeleteConfirmId(null);
    success('User Deleted', `${user?.name ?? 'User'} has been removed.`);
  }

  function togglePortal(key: keyof PortalAccess) {
    setFormPortalAccess((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePortalToggleInView(key: keyof PortalAccess) {
    if (!viewingUser) return;
    const updatedAccess = { ...viewingUser.portalAccess, [key]: !viewingUser.portalAccess[key] };
    const updatedUser = { ...viewingUser, portalAccess: updatedAccess };
    setViewingUser(updatedUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === viewingUser.id ? updatedUser : u))
    );
  }

  /* ─── Stats ───────────────────────────────────────────────── */

  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600 bg-blue-50' },
    { label: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Inactive', value: inactiveCount, icon: Users, color: 'text-slate-500 bg-slate-100' },
    { label: 'Suspended', value: suspendedCount, icon: ShieldCheck, color: 'text-rose-600 bg-rose-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage user accounts, portal access, and permissions
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, login, or company..."
              className="pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as UserStatus | 'All');
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
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Login</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Language</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden lg:table-cell">Latest Authentication</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden xl:table-cell">Company</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                paginated.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setViewingUser(user)}
                        className="flex items-center gap-3 hover:opacity-80 transition text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <span className="font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap underline-offset-2 hover:underline">
                          {user.name}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.login}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{user.language}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell whitespace-nowrap">
                      {user.latestAuthentication}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden xl:table-cell whitespace-nowrap">
                      {user.company}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[user.status]}>{user.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingUser(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Edit user"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(user.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete user"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* ─── View User Details Modal ──────────────────────────── */}
      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title="User Details"
        size="lg"
      >
        {viewingUser && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-bold shrink-0">
                {viewingUser.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">{viewingUser.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{viewingUser.login}</p>
              </div>
              <div className="ml-auto">
                <Badge variant={STATUS_VARIANT[viewingUser.status]}>{viewingUser.status}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Language</p>
                <p className="text-sm text-foreground">{viewingUser.language}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company</p>
                <p className="text-sm text-foreground">{viewingUser.company}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Authentication</p>
                <p className="text-sm text-foreground">{viewingUser.latestAuthentication}</p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Portal Access</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(PORTAL_LABELS) as Array<keyof PortalAccess>).map((key) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border transition cursor-pointer ${
                      viewingUser.portalAccess[key]
                        ? 'border-blue-300 bg-blue-50/50'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={viewingUser.portalAccess[key]}
                      onChange={() => handlePortalToggleInView(key)}
                      className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-foreground">{PORTAL_LABELS[key]}</span>
                  </label>
                ))}
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

      {/* ─── Add / Edit Modal ─────────────────────────────────── */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          resetForm();
        }}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="lg"
      >
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Name</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Login (Username)</label>
              <Input
                value={formLogin}
                onChange={(e) => setFormLogin(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Language</label>
              <select
                value={formLanguage}
                onChange={(e) => setFormLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="English">English</option>
                <option value="Filipino">Filipino</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Company</label>
              <Input
                value={formCompany}
                onChange={(e) => setFormCompany(e.target.value)}
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                className="w-full rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-3">Portal Access</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(PORTAL_LABELS) as Array<keyof PortalAccess>).map((key) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-border hover:bg-muted/50 transition cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formPortalAccess[key]}
                    onChange={() => togglePortal(key)}
                    className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-foreground">{PORTAL_LABELS[key]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete User"
        size="sm"
      >
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold text-foreground">
              {users.find((u) => u.id === deleteConfirmId)?.name}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              className="bg-rose-600 hover:bg-rose-700"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
