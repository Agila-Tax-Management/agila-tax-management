'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, ClipboardCheck, Clock3, AlertTriangle, Target } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import type { Department } from '@/lib/mock-hr-data';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

type ReportDepartment = Extract<Department, 'Compliance' | 'Liaison' | 'Account Officer'>;
type TaskStatus = 'Accomplished' | 'Not Accomplished' | 'Delayed';

interface EmployeePortalTaskReport {
  id: string;
  department: ReportDepartment;
  portal: string;
  employeeName: string;
  accomplished: number;
  notAccomplished: number;
  delayed: number;
}

const MOCK_EMPLOYEE_REPORTS: EmployeePortalTaskReport[] = [
  {
    id: 'rep-1',
    department: 'Compliance',
    portal: 'Compliance Portal',
    employeeName: 'Juan Dela Cruz',
    accomplished: 22,
    notAccomplished: 4,
    delayed: 1,
  },
  {
    id: 'rep-2',
    department: 'Compliance',
    portal: 'Compliance Portal',
    employeeName: 'Diego Aquino',
    accomplished: 13,
    notAccomplished: 7,
    delayed: 5,
  },
  {
    id: 'rep-3',
    department: 'Liaison',
    portal: 'Liaison Portal',
    employeeName: 'Ana Reyes',
    accomplished: 18,
    notAccomplished: 5,
    delayed: 2,
  },
  {
    id: 'rep-4',
    department: 'Liaison',
    portal: 'Liaison Portal',
    employeeName: 'Camille Ramos',
    accomplished: 14,
    notAccomplished: 8,
    delayed: 4,
  },
  {
    id: 'rep-5',
    department: 'Account Officer',
    portal: 'Account Officer Portal',
    employeeName: 'Carlos Garcia',
    accomplished: 24,
    notAccomplished: 3,
    delayed: 1,
  },
  {
    id: 'rep-6',
    department: 'Account Officer',
    portal: 'Account Officer Portal',
    employeeName: 'Patricia Lim',
    accomplished: 19,
    notAccomplished: 6,
    delayed: 3,
  },
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  Accomplished: '#16a34a',
  'Not Accomplished': '#f59e0b',
  Delayed: '#e11d48',
};

export function PerformanceManagement() {
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<'All' | ReportDepartment>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | TaskStatus>('All');

  const employeeReports = useMemo(() => {
    return MOCK_EMPLOYEE_REPORTS.filter((report) => {
      const normalizedSearch = search.toLowerCase();
      const matchesSearch =
        report.employeeName.toLowerCase().includes(normalizedSearch) ||
        report.portal.toLowerCase().includes(normalizedSearch) ||
        report.department.toLowerCase().includes(normalizedSearch);
      const matchesDepartment = departmentFilter === 'All' || report.department === departmentFilter;

      const matchesStatus =
        statusFilter === 'All' ||
        (statusFilter === 'Accomplished' && report.accomplished > 0) ||
        (statusFilter === 'Not Accomplished' && report.notAccomplished > 0) ||
        (statusFilter === 'Delayed' && report.delayed > 0);

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [search, departmentFilter, statusFilter]);

  const departmentChartData = useMemo(() => {
    const map = new Map<ReportDepartment, { accomplished: number; notAccomplished: number; delayed: number; employees: number }>();

    employeeReports.forEach((report) => {
      const current = map.get(report.department) ?? {
        accomplished: 0,
        notAccomplished: 0,
        delayed: 0,
        employees: 0,
      };

      map.set(report.department, {
        accomplished: current.accomplished + report.accomplished,
        notAccomplished: current.notAccomplished + report.notAccomplished,
        delayed: current.delayed + report.delayed,
        employees: current.employees + 1,
      });
    });

    return Array.from(map.entries()).map(([department, values]) => ({
      department,
      employees: values.employees,
      accomplished: values.accomplished,
      notAccomplished: values.notAccomplished,
      delayed: values.delayed,
      total: values.accomplished + values.notAccomplished + values.delayed,
    }));
  }, [employeeReports]);

  const employeeChartData = useMemo(() => {
    return employeeReports.map((report) => ({
      employee: report.employeeName,
      department: report.department,
      accomplished: report.accomplished,
      notAccomplished: report.notAccomplished,
      delayed: report.delayed,
      total: report.accomplished + report.notAccomplished + report.delayed,
      completionRate: Math.round((report.accomplished / (report.accomplished + report.notAccomplished + report.delayed)) * 100),
    }));
  }, [employeeReports]);

  const totals = useMemo(() => {
    return employeeReports.reduce(
      (acc, report) => {
        acc.accomplished += report.accomplished;
        acc.notAccomplished += report.notAccomplished;
        acc.delayed += report.delayed;
        return acc;
      },
      { accomplished: 0, notAccomplished: 0, delayed: 0 },
    );
  }, [employeeReports]);

  const pieData = [
    { name: 'Accomplished', value: totals.accomplished },
    { name: 'Not Accomplished', value: totals.notAccomplished },
    { name: 'Delayed', value: totals.delayed },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Performance Management</h1>
        <p className="text-sm text-slate-500 mt-1">
          Frontend analytics view of accomplished, not accomplished, and delayed portal tasks per employee and department.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          {
            label: 'Accomplished',
            value: totals.accomplished,
            icon: ClipboardCheck,
            color: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Not Accomplished',
            value: totals.notAccomplished,
            icon: Clock3,
            color: 'bg-amber-50 text-amber-700',
          },
          {
            label: 'Delayed',
            value: totals.delayed,
            icon: AlertTriangle,
            color: 'bg-rose-50 text-rose-700',
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon size={18} />
              </div>
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
              placeholder="Search by employee, report type, or department..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative min-w-52">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value as 'All' | ReportDepartment)}
            >
              <option value="All">All Departments</option>
              <option value="Compliance">Compliance</option>
              <option value="Liaison">Liaison</option>
              <option value="Account Officer">Account Officer</option>
            </select>
          </div>
          <div className="relative min-w-44">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'All' | TaskStatus)}
            >
              <option value="All">All Task States</option>
              <option value="Accomplished">Accomplished</option>
              <option value="Not Accomplished">Not Accomplished</option>
              <option value="Delayed">Delayed</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Department Task Graph</h2>
            <p className="text-xs text-slate-500 mt-1">Accomplished vs not accomplished vs delayed by department</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="accomplished" stackId="dept" fill={STATUS_COLORS.Accomplished} name="Accomplished" radius={[6, 6, 0, 0]} />
                <Bar dataKey="notAccomplished" stackId="dept" fill={STATUS_COLORS['Not Accomplished']} name="Not Accomplished" />
                <Bar dataKey="delayed" stackId="dept" fill={STATUS_COLORS.Delayed} name="Delayed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Overall Status Split</h2>
            <p className="text-xs text-slate-500 mt-1">Total task distribution across selected employees</p>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={2}
                  label
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name as TaskStatus]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">Employee Task Graph</h2>
            <p className="text-xs text-slate-500 mt-1">Task outcomes for each employee with department context</p>
          </div>
          <Badge variant="info">{employeeChartData.length} Employees</Badge>
        </div>
        <div className="h-104">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employeeChartData} layout="vertical" margin={{ left: 24, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
              <YAxis type="category" dataKey="employee" width={130} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="accomplished" stackId="emp" fill={STATUS_COLORS.Accomplished} name="Accomplished" />
              <Bar dataKey="notAccomplished" stackId="emp" fill={STATUS_COLORS['Not Accomplished']} name="Not Accomplished" />
              <Bar dataKey="delayed" stackId="emp" fill={STATUS_COLORS.Delayed} name="Delayed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Department</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Portal</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Accomplished</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Not Accomplished</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Delayed</th>
                <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">Completion</th>
              </tr>
            </thead>
            <tbody>
              {employeeChartData.map((report) => (
                <tr key={report.employee} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">{report.employee}</td>
                  <td className="px-4 py-3 text-slate-700">{report.department}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {employeeReports.find((entry) => entry.employeeName === report.employee)?.portal}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="success">{report.accomplished}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="warning">{report.notAccomplished}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="danger">{report.delayed}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Target size={14} className="text-slate-500" />
                      <span className="text-sm font-semibold text-slate-700">{report.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {employeeChartData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">No employee data found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
