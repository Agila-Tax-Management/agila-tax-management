'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Eye, Trash2, Users, UserPlus, Building2, Network, Briefcase, Loader2 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { DepartmentsTab } from './management/DepartmentsTab';
import { TeamsTab } from './management/TeamsTab';
import { PositionsTab } from './management/PositionsTab';
import { DeleteEmployeeModal } from './management/DeleteEmployeeModal';

type EmploymentStatus = 'ACTIVE' | 'RESIGNED' | 'TERMINATED' | 'ON_LEAVE' | 'SUSPENDED' | 'RETIRED';

const STATUS_LABEL: Record<EmploymentStatus, string> = {
  ACTIVE: 'Active',
  RESIGNED: 'Resigned',
  TERMINATED: 'Terminated',
  ON_LEAVE: 'On Leave',
  SUSPENDED: 'Suspended',
  RETIRED: 'Retired',
};

const STATUS_VARIANT: Record<EmploymentStatus, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success',
  ON_LEAVE: 'info',
  SUSPENDED: 'warning',
  RESIGNED: 'danger',
  TERMINATED: 'danger',
  RETIRED: 'neutral',
};

interface EmployeeRecord {
  id: string;
  employeeNo: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string | null;
  user: { id: string; email: string; role: string; active: boolean } | null;
  employment: {
    employmentStatus: EmploymentStatus;
    department: { name: string } | null;
    position: { title: string } | null;
    hireDate: string | null;
  } | null;
}

interface Department {
  id: string;
  name: string;
}

type ManagementTab = 'employees' | 'departments' | 'teams' | 'positions';

const TABS: { key: ManagementTab; label: string; icon: typeof Users }[] = [
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'teams', label: 'Teams', icon: Network },
  { key: 'positions', label: 'Positions', icon: Briefcase },
];

export function EmployeeManagement() {
  const router = useRouter();
  const { error: showError } = useToast();
  const { data: session } = authClient.useSession();
  const sessionUser = session?.user as { role?: string } | undefined;
  const isAdmin = sessionUser?.role === 'SUPER_ADMIN' || sessionUser?.role === 'ADMIN';

  const [activeTab, setActiveTab] = useState<ManagementTab>('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<EmployeeRecord | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = (await res.json()) as { data: EmployeeRecord[] };
      setEmployees(json.data ?? []);
    } catch {
      showError('Error', 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await fetch('/api/hr/departments');
      if (!res.ok) return;
      const json = (await res.json()) as { data: Department[] };
      setDepartments(json.data ?? []);
    } catch {
      // silently fail — departments are only used for filter
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
    void fetchDepartments();
  }, [fetchEmployees, fetchDepartments]);

  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch =
        emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
        (emp.email ?? '').toLowerCase().includes(search.toLowerCase());
      const matchDept =
        deptFilter === 'All' ||
        (emp.employment?.department?.name ?? '') === deptFilter;
      const matchStatus =
        statusFilter === 'All' ||
        (emp.employment?.employmentStatus ?? '') === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const activeCount = employees.filter(e => e.employment?.employmentStatus === 'ACTIVE').length;
  const onLeaveCount = employees.filter(e => e.employment?.employmentStatus === 'ON_LEAVE').length;
  const suspendedCount = employees.filter(e => e.employment?.employmentStatus === 'SUSPENDED').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-foreground">Employee Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage employee records & information</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── Employees Tab ──────────────────────────────────────── */}
      {activeTab === 'employees' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: employees.length, icon: Users, color: 'text-slate-600 bg-slate-50' },
              { label: 'Active', value: activeCount, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'On Leave', value: onLeaveCount, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Suspended', value: suspendedCount, icon: Users, color: 'text-amber-600 bg-amber-50' },
            ].map(stat => (
              <Card key={stat.label} className="p-4 flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <stat.icon size={16} />
                </div>
                <div>
                  <p className="text-lg font-black text-foreground">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, employee no., or email..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    className="pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                    value={deptFilter}
                    onChange={e => setDeptFilter(e.target.value)}
                  >
                    <option value="All">All Departments</option>
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="relative">
                  <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <select
                    className="pl-9 pr-8 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Statuses</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="RETIRED">Retired</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Add Employee Button */}
          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => router.push('/portal/hr/add-new-employee')}>
              <UserPlus size={16} /> Add Employee
            </Button>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employee</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden lg:table-cell">Position</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Date Hired</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                        <Loader2 size={20} className="animate-spin mx-auto" />
                      </td>
                    </tr>
                  )}
                  {!loading && filtered.map(emp => {
                    const initials = `${emp.firstName[0] ?? ''}${emp.lastName[0] ?? ''}`.toUpperCase();
                    const status = emp.employment?.employmentStatus;
                    return (
                      <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => router.push(`/portal/hr/employee-management/${emp.id}`)}
                            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm hover:text-rose-600 transition-colors">{emp.fullName}</p>
                              <p className="text-[11px] text-muted-foreground">{emp.employeeNo}</p>
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                          {emp.employment?.department?.name ?? <span className="text-muted-foreground/50 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                          {emp.employment?.position?.title ?? <span className="text-muted-foreground/50 italic">—</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                          {emp.employment?.hireDate
                            ? new Date(emp.employment.hireDate).toLocaleDateString('en-PH')
                            : <span className="text-muted-foreground/50 italic">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {status
                            ? <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
                            : <Badge variant="neutral">No Employment</Badge>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" onClick={() => router.push(`/portal/hr/employee-management/${emp.id}`)}>                              <Eye size={16} />
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => {
                                  setDeleteTarget(emp);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Delete confirmation modal */}
      <DeleteEmployeeModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        employee={deleteTarget ? {
          id: deleteTarget.id,
          fullName: deleteTarget.fullName,
          employeeNo: deleteTarget.employeeNo,
          user: deleteTarget.user ? { email: deleteTarget.user.email, active: deleteTarget.user.active } : null,
        } : null}
        onDeleted={(deletedId) => {
          setEmployees(prev => prev.filter(e => e.id !== deletedId));
          setDeleteTarget(null);
        }}
      />

      {/* ── Departments Tab ────────────────────────────────────── */}
      {activeTab === 'departments' && <DepartmentsTab />}

      {/* ── Teams Tab ──────────────────────────────────────────── */}
      {activeTab === 'teams' && <TeamsTab />}

      {/* ── Positions Tab ──────────────────────────────────────── */}
      {activeTab === 'positions' && <PositionsTab />}

    </div>
  );
}
