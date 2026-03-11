'use client';

import React from 'react';
import {
  Users, CalendarDays, Clock, FileQuestion,
  Landmark, TrendingUp, AlertTriangle, CheckCircle,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  EMPLOYEES, LEAVE_REQUESTS, ATTENDANCE_RECORDS, PAYROLL_RECORDS,
  GOV_COMPLIANCE_RECORDS, HR_REQUESTS as HR_REQUESTS_DATA,
  getActiveEmployees, getPendingLeaves, getOpenRequests, getPendingCompliance,
} from '@/lib/mock-hr-data';

export function HRDashboard() {
  const activeCount = getActiveEmployees().length;
  const pendingLeaves = getPendingLeaves();
  const openRequests = getOpenRequests();
  const pendingCompliance = getPendingCompliance();
  const overdueCompliance = GOV_COMPLIANCE_RECORDS.filter(g => g.status === 'Overdue');

  const todayAttendance = ATTENDANCE_RECORDS.filter(a => a.date === '2025-06-23');
  const presentCount = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
  const absentCount = todayAttendance.filter(a => a.status === 'Absent').length;
  const onLeaveCount = todayAttendance.filter(a => a.status === 'On Leave').length;

  const processingPayroll = PAYROLL_RECORDS.filter(p => p.status === 'Processing' || p.status === 'Draft');
  const totalPayrollNet = processingPayroll.reduce((sum, p) => sum + p.netPay, 0);

  const kpiCards = [
    { label: 'Active Employees', value: activeCount, total: EMPLOYEES.length, icon: Users, color: 'rose' },
    { label: 'Pending Leaves', value: pendingLeaves.length, total: LEAVE_REQUESTS.length, icon: CalendarDays, color: 'amber' },
    { label: 'Open HR Requests', value: openRequests.length, total: HR_REQUESTS_DATA.length, icon: FileQuestion, color: 'blue' },
    { label: 'Gov Compliance Due', value: pendingCompliance.length, total: GOV_COMPLIANCE_RECORDS.length, icon: Landmark, color: 'emerald' },
  ];

  const colorMap: Record<string, string> = {
    rose: 'bg-rose-50 text-rose-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">HR Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of people operations & compliance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl ${colorMap[kpi.color]}`}>
                  <Icon size={20} />
                </div>
                <span className="text-xs text-slate-400 font-medium">{kpi.value}/{kpi.total}</span>
              </div>
              <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Today's Attendance + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Today&apos;s Attendance</h2>
            <span className="text-xs text-slate-400 ml-auto">June 23, 2025</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Present', count: presentCount, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Late', count: todayAttendance.filter(a => a.status === 'Late').length, color: 'text-amber-600 bg-amber-50' },
              { label: 'Absent', count: absentCount, color: 'text-red-600 bg-red-50' },
              { label: 'On Leave', count: onLeaveCount, color: 'text-blue-600 bg-blue-50' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 text-center ${item.color}`}>
                <p className="text-2xl font-black">{item.count}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3 italic">
            Data sourced from Timesheet module (not yet integrated)
          </p>
        </Card>

        {/* Alerts & Action Items */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900">Action Required</h2>
          </div>
          <div className="space-y-3">
            {overdueCompliance.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Landmark size={16} className="text-red-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-700">Overdue Government Filing</p>
                  <p className="text-[11px] text-red-600 mt-0.5">{overdueCompliance[0].description}</p>
                  <p className="text-[10px] text-red-400 mt-1">Deadline: {overdueCompliance[0].deadline}</p>
                </div>
              </div>
            )}
            {pendingLeaves.map(leave => (
              <div key={leave.id} className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
                <CalendarDays size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-amber-700">{leave.employeeName} — {leave.leaveType} Leave</p>
                  <p className="text-[11px] text-amber-600 mt-0.5">{leave.startDate} to {leave.endDate} ({leave.totalDays} day{leave.totalDays > 1 ? 's' : ''})</p>
                </div>
              </div>
            ))}
            {openRequests.filter(r => r.priority === 'High').map(req => (
              <div key={req.id} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <FileQuestion size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-blue-700">{req.employeeName} — {req.requestType}</p>
                  <p className="text-[11px] text-blue-600 mt-0.5">{req.subject}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Payroll & Department Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Payroll */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Current Payroll Cycle</h2>
            <Badge variant="info" className="ml-auto text-[9px]">June 16-30</Badge>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Total Net Pay (processing)</span>
              <span className="text-sm font-black text-slate-900">₱{totalPayrollNet.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Records in Processing</span>
              <span className="text-sm font-bold text-blue-600">{PAYROLL_RECORDS.filter(p => p.status === 'Processing').length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-xs text-slate-500">Draft Records</span>
              <span className="text-sm font-bold text-amber-600">{PAYROLL_RECORDS.filter(p => p.status === 'Draft').length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-xs text-slate-500">On Hold</span>
              <span className="text-sm font-bold text-red-600">{PAYROLL_RECORDS.filter(p => p.status === 'On Hold').length}</span>
            </div>
          </div>
        </Card>

        {/* Department Headcount */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle size={18} className="text-rose-600" />
            <h2 className="text-sm font-bold text-slate-900">Department Headcount</h2>
          </div>
          <div className="space-y-2">
            {(() => {
              const deptCounts = EMPLOYEES.filter(e => e.status !== 'Resigned').reduce((acc, emp) => {
                acc[emp.department] = (acc[emp.department] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);

              const totalActive = Object.values(deptCounts).reduce((a, b) => a + b, 0);

              return Object.entries(deptCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([dept, count]) => {
                  const pct = Math.round((count / totalActive) * 100);
                  return (
                    <div key={dept} className="flex items-center gap-3">
                      <span className="text-xs text-slate-600 w-28 truncate">{dept}</span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-rose-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                    </div>
                  );
                });
            })()}
          </div>
        </Card>
      </div>
    </div>
  );
}
