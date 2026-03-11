'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Users, UserPlus, Building2, Network, Briefcase, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  EMPLOYEES, Employee, Department, EmployeeStatus,
} from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<EmployeeStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  Active: 'success',
  'On Leave': 'info',
  Probationary: 'warning',
  Resigned: 'danger',
};

const DEPARTMENTS: Department[] = ['Sales', 'Accounting', 'Compliance', 'Liaison', 'Account Officer', 'HR', 'IT', 'Admin'];

type ManagementTab = 'employees' | 'departments' | 'teams' | 'positions';

const TABS: { key: ManagementTab; label: string; icon: typeof Users }[] = [
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'teams', label: 'Teams', icon: Network },
  { key: 'positions', label: 'Positions', icon: Briefcase },
];

// ── Mock Data for Departments, Teams, Positions ──────────────────

interface MockDepartment {
  id: number;
  name: string;
  head: string;
  employeeCount: number;
  description: string;
}

interface MockTeam {
  id: number;
  name: string;
  department: string;
  leader: string;
  memberCount: number;
}

interface MockPosition {
  id: number;
  title: string;
  department: string;
  level: string;
  employeeCount: number;
}

const MOCK_DEPARTMENTS: MockDepartment[] = [
  { id: 1, name: 'Sales', head: 'Maria Santos', employeeCount: 5, description: 'Handles client acquisition and service plans' },
  { id: 2, name: 'Accounting', head: 'Juan Cruz', employeeCount: 4, description: 'Financial reporting, billing, and invoicing' },
  { id: 3, name: 'Compliance', head: 'Ana Reyes', employeeCount: 6, description: 'Tax compliance and regulatory filings' },
  { id: 4, name: 'Liaison', head: 'Carlos Garcia', employeeCount: 3, description: 'Field operations and government liaising' },
  { id: 5, name: 'Account Officer', head: 'Patricia Lim', employeeCount: 4, description: 'Client account management and coordination' },
  { id: 6, name: 'HR', head: 'Rosa Mendoza', employeeCount: 3, description: 'Human resources and employee welfare' },
  { id: 7, name: 'IT', head: 'Mark Villanueva', employeeCount: 3, description: 'Systems development and technical support' },
  { id: 8, name: 'Admin', head: 'Elena Torres', employeeCount: 2, description: 'Administrative support and office management' },
];

const MOCK_TEAMS: MockTeam[] = [
  { id: 1, name: 'Sales Team Alpha', department: 'Sales', leader: 'Maria Santos', memberCount: 3 },
  { id: 2, name: 'Sales Team Beta', department: 'Sales', leader: 'Roberto Tan', memberCount: 2 },
  { id: 3, name: 'Compliance Core', department: 'Compliance', leader: 'Ana Reyes', memberCount: 4 },
  { id: 4, name: 'Compliance Support', department: 'Compliance', leader: 'David Aquino', memberCount: 2 },
  { id: 5, name: 'Field Ops', department: 'Liaison', leader: 'Carlos Garcia', memberCount: 3 },
  { id: 6, name: 'Finance Team', department: 'Accounting', leader: 'Juan Cruz', memberCount: 4 },
  { id: 7, name: 'Dev Team', department: 'IT', leader: 'Mark Villanueva', memberCount: 3 },
  { id: 8, name: 'Client Services', department: 'Account Officer', leader: 'Patricia Lim', memberCount: 4 },
];

const MOCK_POSITIONS: MockPosition[] = [
  { id: 1, title: 'Sales Manager', department: 'Sales', level: 'Manager', employeeCount: 1 },
  { id: 2, title: 'Sales Associate', department: 'Sales', level: 'Staff', employeeCount: 4 },
  { id: 3, title: 'Senior Accountant', department: 'Accounting', level: 'Senior', employeeCount: 1 },
  { id: 4, title: 'Junior Accountant', department: 'Accounting', level: 'Junior', employeeCount: 3 },
  { id: 5, title: 'Compliance Officer', department: 'Compliance', level: 'Staff', employeeCount: 4 },
  { id: 6, title: 'Compliance Manager', department: 'Compliance', level: 'Manager', employeeCount: 1 },
  { id: 7, title: 'Liaison Officer', department: 'Liaison', level: 'Staff', employeeCount: 2 },
  { id: 8, title: 'Liaison Supervisor', department: 'Liaison', level: 'Supervisor', employeeCount: 1 },
  { id: 9, title: 'Account Officer', department: 'Account Officer', level: 'Staff', employeeCount: 3 },
  { id: 10, title: 'Account Manager', department: 'Account Officer', level: 'Manager', employeeCount: 1 },
  { id: 11, title: 'HR Officer', department: 'HR', level: 'Staff', employeeCount: 2 },
  { id: 12, title: 'HR Manager', department: 'HR', level: 'Manager', employeeCount: 1 },
  { id: 13, title: 'Jr. Website Developer', department: 'IT', level: 'Junior', employeeCount: 1 },
  { id: 14, title: 'Sr. Systems Developer', department: 'IT', level: 'Senior', employeeCount: 1 },
  { id: 15, title: 'IT Manager', department: 'IT', level: 'Manager', employeeCount: 1 },
  { id: 16, title: 'Admin Assistant', department: 'Admin', level: 'Staff', employeeCount: 2 },
];

export function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState<ManagementTab>('employees');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

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
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
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
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
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
                        <Button variant="ghost" onClick={() => setSelectedEmployee(emp)}>
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

      {/* ── Departments Tab ────────────────────────────────────── */}
      {activeTab === 'departments' && (
        <>
          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              <Plus size={16} /> Add Department
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MOCK_DEPARTMENTS.map(dept => (
              <Card key={dept.id} className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded-xl flex items-center justify-center">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{dept.name}</h3>
                      <p className="text-xs text-muted-foreground">Head: {dept.head}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="p-1.5 h-auto"><Pencil size={14} /></Button>
                    <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{dept.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="neutral">{dept.employeeCount} Employees</Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ── Teams Tab ──────────────────────────────────────────── */}
      {activeTab === 'teams' && (
        <>
          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              <Plus size={16} /> Add Team
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Team Name</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Leader</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Members</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TEAMS.map(team => (
                    <tr key={team.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center">
                            <Network size={16} />
                          </div>
                          <span className="font-bold text-foreground">{team.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{team.department}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{team.leader}</td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{team.memberCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" className="p-1.5 h-auto"><Eye size={14} /></Button>
                          <Button variant="ghost" className="p-1.5 h-auto"><Pencil size={14} /></Button>
                          <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ── Positions Tab ──────────────────────────────────────── */}
      {activeTab === 'positions' && (
        <>
          <div className="flex justify-end">
            <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2">
              <Plus size={16} /> Add Position
            </Button>
          </div>
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted border-b border-border">
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Position Title</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden sm:table-cell">Department</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider hidden md:table-cell">Level</th>
                    <th className="text-left px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Employees</th>
                    <th className="text-center px-4 py-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_POSITIONS.map(pos => (
                    <tr key={pos.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center">
                            <Briefcase size={16} />
                          </div>
                          <span className="font-bold text-foreground">{pos.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{pos.department}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge variant={
                          pos.level === 'Manager' ? 'warning' :
                          pos.level === 'Senior' ? 'info' :
                          pos.level === 'Supervisor' ? 'success' : 'neutral'
                        }>{pos.level}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{pos.employeeCount}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" className="p-1.5 h-auto"><Pencil size={14} /></Button>
                          <Button variant="ghost" className="p-1.5 h-auto text-red-500"><Trash2 size={14} /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedEmployee} onClose={() => setSelectedEmployee(null)} title="Employee Details" size="lg">
        {selectedEmployee && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-4rem)]">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 bg-rose-50 rounded-xl">
              <div className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center text-lg font-black">
                {selectedEmployee.avatar}
              </div>
              <div>
                <h3 className="text-lg font-black text-foreground">{selectedEmployee.fullName}</h3>
                <p className="text-sm text-muted-foreground">{selectedEmployee.position} — {selectedEmployee.department}</p>
                <Badge variant={STATUS_VARIANT[selectedEmployee.status]} className="mt-1">
                  {selectedEmployee.status}
                </Badge>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Employee No.', value: selectedEmployee.employeeNo },
                { label: 'Email', value: selectedEmployee.email },
                { label: 'Phone', value: selectedEmployee.phone },
                { label: 'Date Hired', value: selectedEmployee.dateHired },
                { label: 'Salary', value: `₱${selectedEmployee.salary.toLocaleString()}` },
                { label: 'SSS No.', value: selectedEmployee.sssNo },
                { label: 'PhilHealth No.', value: selectedEmployee.philHealthNo },
                { label: 'Pag-IBIG No.', value: selectedEmployee.pagIbigNo },
                { label: 'TIN', value: selectedEmployee.tinNo },
              ].map(field => (
                <div key={field.label}>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{field.label}</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
