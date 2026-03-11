'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Users, UserPlus, Building2 } from 'lucide-react';
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

export function EmployeeManagement() {
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
          <h1 className="text-2xl font-black text-slate-900">Employee Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage employee records & information</p>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 self-start">
          <UserPlus size={16} /> Add Employee
        </Button>
      </div>

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
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, employee no., or email..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
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

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Position</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Date Hired</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center text-xs font-black shrink-0">
                        {emp.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{emp.fullName}</p>
                        <p className="text-[11px] text-slate-400">{emp.employeeNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{emp.department}</td>
                  <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{emp.position}</td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">{emp.dateHired}</td>
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
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">No employees found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

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
                <h3 className="text-lg font-black text-slate-900">{selectedEmployee.fullName}</h3>
                <p className="text-sm text-slate-500">{selectedEmployee.position} — {selectedEmployee.department}</p>
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
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{field.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{field.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
