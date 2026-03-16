'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Eye, Users, UserPlus, Building2, Network, Briefcase } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { EMPLOYEES, EmployeeStatus } from '@/lib/mock-hr-data';
import { HR_DEPARTMENTS } from './management/data';
import { DepartmentsTab } from './management/DepartmentsTab';
import { TeamsTab } from './management/TeamsTab';
import { PositionsTab } from './management/PositionsTab';

const STATUS_VARIANT: Record<EmployeeStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  Active: 'success',
  'On Leave': 'info',
  Probationary: 'warning',
  Resigned: 'danger',
};

type ManagementTab = 'employees' | 'departments' | 'teams' | 'positions';

const TABS: { key: ManagementTab; label: string; icon: typeof Users }[] = [
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'teams', label: 'Teams', icon: Network },
  { key: 'positions', label: 'Positions', icon: Briefcase },
];

interface AddEmployeeFormData {
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  gender: string;
  phone: string;
  address: string;
  email: string;
  employeeNo: string;
}

const EMPTY_ADD_EMPLOYEE_FORM: AddEmployeeFormData = {
  firstName: '',
  middleName: '',
  lastName: '',
  birthDate: '',
  gender: '',
  phone: '',
  address: '',
  email: '',
  employeeNo: '',
};

export function EmployeeManagement() {
  const router = useRouter();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<ManagementTab>('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [addEmployeeForm, setAddEmployeeForm] = useState<AddEmployeeFormData>(EMPTY_ADD_EMPLOYEE_FORM);

  const filtered = useMemo(() => {
    return EMPLOYEES.filter(emp => {
      const matchSearch = emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
        emp.employeeNo.toLowerCase().includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase());
      const matchDept = deptFilter === 'All' || emp.department === deptFilter;
      const matchStatus = statusFilter === 'All' || emp.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [search, deptFilter, statusFilter]);

  const activeCount = EMPLOYEES.filter(e => e.status === 'Active').length;
  const onLeaveCount = EMPLOYEES.filter(e => e.status === 'On Leave').length;
  const probCount = EMPLOYEES.filter(e => e.status === 'Probationary').length;

  const updateAddEmployeeForm = <K extends keyof AddEmployeeFormData>(key: K, value: AddEmployeeFormData[K]) => {
    setAddEmployeeForm(prev => ({ ...prev, [key]: value }));
  };

  const closeAddEmployeeModal = () => {
    setIsAddEmployeeOpen(false);
    setAddEmployeeForm(EMPTY_ADD_EMPLOYEE_FORM);
  };

  const handleAddEmployee = () => {
    const requiredFields: Array<keyof AddEmployeeFormData> = [
      'firstName',
      'lastName',
      'birthDate',
      'gender',
      'phone',
      'address',
      'email',
      'employeeNo',
    ];

    const hasMissingRequiredField = requiredFields.some((field) => !addEmployeeForm[field].trim());

    if (hasMissingRequiredField) {
      error('Failed to add employee', 'Please complete all required employee fields.');
      return;
    }

    success('Employee created', 'The new employee has been added successfully.');
    closeAddEmployeeModal();
  };

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
              { label: 'Total', value: EMPLOYEES.length, icon: Users, color: 'text-slate-600 bg-slate-50' },
              { label: 'Active', value: activeCount, icon: Users, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'On Leave', value: onLeaveCount, icon: Users, color: 'text-blue-600 bg-blue-50' },
              { label: 'Probationary', value: probCount, icon: Users, color: 'text-amber-600 bg-amber-50' },
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
                    {HR_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Probationary">Probationary</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* Add Employee Button */}
          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={() => setIsAddEmployeeOpen(true)}>
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
                  {filtered.map(emp => (
                    <tr key={emp.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                            {emp.avatar}
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-sm">{emp.fullName}</p>
                            <p className="text-[11px] text-muted-foreground">{emp.employeeNo}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{emp.department}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">{emp.position}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{emp.dateHired}</td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[emp.status]}>{emp.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="ghost" onClick={() => router.push(`/portal/hr/employee-management/${emp.id}`)}>
                          <Eye size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
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

      <Modal isOpen={isAddEmployeeOpen} onClose={closeAddEmployeeModal} title="Add Employee" size="xl">
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.firstName}
                onChange={e => updateAddEmployeeForm('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Middle Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.middleName}
                onChange={e => updateAddEmployeeForm('middleName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.lastName}
                onChange={e => updateAddEmployeeForm('lastName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Birth Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.birthDate}
                onChange={e => updateAddEmployeeForm('birthDate', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Gender</label>
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={addEmployeeForm.gender}
                onChange={e => updateAddEmployeeForm('gender', e.target.value)}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
              <input
                type="tel"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.phone}
                onChange={e => updateAddEmployeeForm('phone', e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.address}
                onChange={e => updateAddEmployeeForm('address', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
              <input
                type="email"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.email}
                onChange={e => updateAddEmployeeForm('email', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Employee No</label>
              <input
                type="text"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                value={addEmployeeForm.employeeNo}
                onChange={e => updateAddEmployeeForm('employeeNo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAddEmployeeModal}>Cancel</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAddEmployee}>
              Save Employee
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Departments Tab ────────────────────────────────────── */}
      {activeTab === 'departments' && <DepartmentsTab />}

      {/* ── Teams Tab ──────────────────────────────────────────── */}
      {activeTab === 'teams' && <TeamsTab />}

      {/* ── Positions Tab ──────────────────────────────────────── */}
      {activeTab === 'positions' && <PositionsTab />}

    </div>
  );
}
