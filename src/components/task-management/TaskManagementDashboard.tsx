// src/components/task-management/TaskManagementDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Calendar, TrendingUp, FolderKanban,
  ChevronRight, Loader2,
} from 'lucide-react';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { useToast } from '@/context/ToastContext';

// -- Types ----------------------------------------------------------

interface DashboardStats {
  total: number;
  active: number;
  done: number;
  overdue: number;
  urgent: number;
}

interface DepartmentStats {
  departmentId: number;
  departmentName: string;
  total: number;
  active: number;
  done: number;
  overdue: number;
}

interface StatusBreakdown {
  statusName: string;
  statusColor: string | null;
  count: number;
}

interface TaskSummary {
  id: number;
  name: string;
  priority: string | null;
  dueDate: string | null;
  client: { id: number; businessName: string } | null;
  assignedTo: { id: number; firstName: string; lastName: string } | null;
  department: { id: number; name: string } | null;
  status: { id: number; name: string; color: string | null } | null;
}

interface DashboardData {
  stats: DashboardStats;
  departmentStats: DepartmentStats[];
  statusBreakdown: StatusBreakdown[];
  overdueTasks: TaskSummary[];
  upcomingTasks: TaskSummary[];
}

// -- Constants ------------------------------------------------------

const PRIORITY_MAP: Record<string, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  LOW: { variant: 'neutral' },
  NORMAL: { variant: 'info' },
  HIGH: { variant: 'warning' },
  URGENT: { variant: 'danger' },
};

function getStatusColor(color: string | null): string {
  if (color) return color;
  return '#64748b'; // slate-400
}

function statusVariant(name: string): 'neutral' | 'info' | 'warning' | 'success' | 'danger' {
  const lower = name.toLowerCase();
  if (/done|complet|finish/.test(lower)) return 'success';
  if (/progress|doing|active|ongoing/.test(lower)) return 'info';
  if (/review|pending|wait|hold/.test(lower)) return 'warning';
  if (/cancel|block|reject|fail/.test(lower)) return 'danger';
  return 'neutral';
}

// -- Component ------------------------------------------------------

export function TaskManagementDashboard() {
  const router = useRouter();
  const { departments: _departments } = useTaskDepartments();
  const { error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/task-management/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load dashboard');
        return r.json();
      })
      .then((json: { data: DashboardData }) => {
        setData(json.data);
        setLoading(false);
      })
      .catch((err) => {
        toastError('Failed to load', err instanceof Error ? err.message : 'Could not fetch dashboard data');
        setLoading(false);
      });
  }, [toastError]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-teal-700" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500">No dashboard data available</p>
      </div>
    );
  }

  const { stats, departmentStats, statusBreakdown, overdueTasks, upcomingTasks } = data;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* -- Header --------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Management</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Overview across all departments and task pipelines.
          </p>
        </div>
      </div>

      {/* -- Summary strip ------------------------------------------ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {([
          {
            label: 'Total Tasks',  value: stats.total,
            icon: <ClipboardList size={18} />, iconBg: 'bg-[#0f766e]/10', iconColor: 'text-[#0f766e]',
          },
          {
            label: 'Active Tasks', value: stats.active,
            icon: <TrendingUp size={18} />,    iconBg: 'bg-blue-50',       iconColor: 'text-blue-600',
          },
          {
            label: 'Overdue',      value: stats.overdue,
            icon: <AlertTriangle size={18} />, iconBg: 'bg-rose-50',       iconColor: 'text-rose-500',
          },
          {
            label: 'Completed',    value: stats.done,
            icon: <CheckCircle2 size={18} />,  iconBg: 'bg-emerald-50',    iconColor: 'text-emerald-600',
          },
        ] as const).map(stat => (
          <Card
            key={stat.label}
            className="p-5 border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/portal/task-management/tasks')}
          >
            <div className="flex items-start justify-between">
              <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center ${stat.iconColor}`}>
                {stat.icon}
              </div>
              <ChevronRight size={14} className="text-slate-300 mt-1" />
            </div>
            <p className="text-2xl font-black text-slate-900 mt-3">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* -- Department cards --------------------------------------- */}
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Departments</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departmentStats.map((deptStat) => {
            const donePct = deptStat.total > 0 ? Math.round(((deptStat.total - deptStat.active) / deptStat.total) * 100) : 0;
            return (
              <button
                key={deptStat.departmentId}
                onClick={() => router.push(`/portal/task-management/tasks?dept=${deptStat.departmentId}`)}
                className="group text-left p-5 rounded-2xl bg-slate-50 hover:bg-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-teal-700">
                    <FolderKanban size={18} />
                  </div>
                  <ArrowRight size={13} className="text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-700 mb-1">{deptStat.departmentName}</p>
                <p className="text-2xl font-black text-slate-900">{deptStat.total}</p>
                <p className="text-[10px] text-slate-500 font-medium mb-3">total tasks</p>
                <div className="w-full bg-white rounded-full h-1.5 mb-2">
                  <div className="h-1.5 rounded-full bg-teal-700 transition-all" style={{ width: `${donePct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold">{donePct}% done</span>
                  {deptStat.overdue > 0
                    ? <span className="text-[10px] font-bold text-rose-600">{deptStat.overdue} overdue</span>
                    : deptStat.active > 0
                      ? <span className="text-[10px] font-bold text-teal-700">{deptStat.active} active</span>
                      : <span className="text-[10px] font-bold text-emerald-600">All done</span>
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* -- Status pipeline --------------------------------------- */}
      <Card className="p-5 border-none shadow-sm">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Task Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusBreakdown.map((status, index) => {
            const pct = stats.total > 0 ? Math.round((status.count / stats.total) * 100) : 0;
            const bgColor = statusVariant(status.statusName);
            const bgMap: Record<typeof bgColor, string> = {
              neutral: 'bg-slate-50',
              info: 'bg-blue-50',
              warning: 'bg-amber-50',
              success: 'bg-emerald-50',
              danger: 'bg-rose-50',
            };
            return (
              <div key={`status-${index}-${status.statusName}`} className={`${bgMap[bgColor]} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: getStatusColor(status.statusColor) }}
                  />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">{status.statusName}</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{status.count}</p>
                <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: getStatusColor(status.statusColor) }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* -- Overdue + Upcoming ------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Overdue */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-rose-50 border-b border-rose-100">
            <AlertTriangle size={14} className="text-rose-500" />
            <h3 className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Overdue Tasks</h3>
            <span className="ml-auto text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full">
              {overdueTasks.length}
            </span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-500">All clear — no overdue tasks!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {overdueTasks.map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50/40 transition cursor-pointer"
                  onClick={() => router.push(`/portal/task-management/tasks/${task.id}`)}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: getStatusColor(task.status?.color ?? null) }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {task.client?.businessName ?? 'No client'}
                    </p>
                  </div>
                  {task.department && (
                    <span className="shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {task.department.name}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-rose-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={9} /> {formatDate(task.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Upcoming */}
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 border-b border-slate-100">
            <Clock size={14} className="text-[#0f766e]" />
            <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Upcoming Tasks</h3>
            <span className="ml-auto text-[10px] font-bold text-[#0f766e] bg-[#0f766e]/10 px-2 py-0.5 rounded-full">
              {upcomingTasks.length}
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {upcomingTasks.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                onClick={() => router.push(`/portal/task-management/tasks/${task.id}`)}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: getStatusColor(task.status?.color ?? null) }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {task.client?.businessName ?? 'No client'}
                  </p>
                </div>
                {task.department && (
                  <span className="shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {task.department.name}
                  </span>
                )}
                {task.priority && (
                  <Badge variant={PRIORITY_MAP[task.priority]?.variant ?? 'neutral'} className="text-[8px] px-1.5 py-0 shrink-0">
                    {task.priority.toLowerCase()}
                  </Badge>
                )}
                <span className="text-[10px] font-medium text-slate-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
                  <Calendar size={9} /> {formatDate(task.dueDate)}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
