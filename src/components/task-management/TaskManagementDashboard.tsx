// src/components/task-management/TaskManagementDashboard.tsx
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Calendar, TrendingUp, Handshake, Truck,
  Shield, Target, Building2, Calculator, Users, ChevronRight,
} from 'lucide-react';
import { ALL_TASKS, SOURCE_CONFIG } from '@/lib/mock-task-management-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { TaskSource } from '@/lib/mock-task-management-data';
import type { AOTaskStatus, AOTaskPriority } from '@/lib/types';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const TODAY = new Date('2026-03-24');

const ALL_SOURCES: TaskSource[] = [
  'client-relations', 'liaison', 'compliance', 'om', 'admin', 'accounting', 'hr',
];

const DEPT_ROUTES: Record<TaskSource, string> = {
  'client-relations': '/portal/task-management/client-relations',
  liaison:            '/portal/task-management/liaison',
  compliance:         '/portal/task-management/compliance',
  om:                 '/portal/task-management/om',
  admin:              '/portal/task-management/admin',
  accounting:         '/portal/task-management/accounting',
  hr:                 '/portal/task-management/hr',
};

const DEPT_ICONS: Record<TaskSource, React.ReactNode> = {
  'client-relations': <Handshake />,
  liaison:            <Truck />,
  compliance:         <Shield />,
  om:                 <Target />,
  admin:              <Building2 />,
  accounting:         <Calculator />,
  hr:                 <Users />,
};

const STATUS_CONFIG: Record<AOTaskStatus, { color: string; bg: string }> = {
  'To Do':       { color: 'bg-slate-400',   bg: 'bg-slate-50'   },
  'In Progress': { color: 'bg-blue-500',    bg: 'bg-blue-50'    },
  'Review':      { color: 'bg-amber-500',   bg: 'bg-amber-50'   },
  'Done':        { color: 'bg-emerald-500', bg: 'bg-emerald-50' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low:    { variant: 'neutral' },
  Medium: { variant: 'info'    },
  High:   { variant: 'warning' },
  Urgent: { variant: 'danger'  },
};

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function TaskManagementDashboard() {
  const router = useRouter();

  const stats = useMemo(() => {
    const total     = ALL_TASKS.length;
    const done      = ALL_TASKS.filter(t => t.status === 'Done').length;
    const overdue   = ALL_TASKS.filter(t => t.status !== 'Done' && new Date(t.dueDate) < TODAY).length;
    const urgent    = ALL_TASKS.filter(t => t.priority === 'Urgent' && t.status !== 'Done').length;
    return { total, done, overdue, urgent, active: total - done };
  }, []);

  const deptStats = useMemo(() =>
    ALL_SOURCES.map(source => {
      const tasks  = ALL_TASKS.filter(t => t.source === source);
      const done   = tasks.filter(t => t.status === 'Done').length;
      const active = tasks.filter(t => t.status !== 'Done').length;
      const overdue = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < TODAY).length;
      return { source, total: tasks.length, active, done, overdue };
    }),
  []);

  const statusBreakdown = useMemo(() => {
    const statuses: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];
    return statuses.map(status => ({
      status,
      count: ALL_TASKS.filter(t => t.status === status).length,
      config: STATUS_CONFIG[status],
    }));
  }, []);

  const overdueTasks = useMemo(() =>
    ALL_TASKS
      .filter(t => t.status !== 'Done' && new Date(t.dueDate) < TODAY)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8),
  []);

  const upcomingTasks = useMemo(() =>
    ALL_TASKS
      .filter(t => t.status !== 'Done' && new Date(t.dueDate) >= TODAY)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 8),
  []);

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">

      {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Management</h2>
          <p className="text-sm text-slate-500 font-medium mt-0.5">
            Overview across all departments and task pipelines.
          </p>
        </div>
      </div>

      {/* â”€â”€ Summary strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

      {/* â”€â”€ Department cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div>
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Departments</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {deptStats.map(({ source, total, active, overdue }) => {
            const cfg   = SOURCE_CONFIG[source];
            const icon  = DEPT_ICONS[source];
            const route = DEPT_ROUTES[source];
            const donePct = total > 0 ? Math.round(((total - active) / total) * 100) : 0;
            return (
              <button
                key={source}
                onClick={() => router.push(route)}
                className={`group text-left p-5 rounded-2xl ${cfg.bg} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-9 h-9 bg-white/70 rounded-xl flex items-center justify-center ${cfg.textColor}`}>
                    {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 18 })}
                  </div>
                  <ArrowRight size={13} className={`${cfg.textColor} opacity-0 group-hover:opacity-100 transition-opacity mt-1`} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.textColor} mb-1`}>{cfg.label}</p>
                <p className="text-2xl font-black text-slate-900">{total}</p>
                <p className="text-[10px] text-slate-500 font-medium mb-3">total tasks</p>
                <div className="w-full bg-white/50 rounded-full h-1.5 mb-2">
                  <div className={`h-1.5 rounded-full ${cfg.color} transition-all`} style={{ width: `${donePct}%` }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-semibold">{donePct}% done</span>
                  {overdue > 0
                    ? <span className="text-[10px] font-bold text-rose-600">{overdue} overdue</span>
                    : active > 0
                      ? <span className={`text-[10px] font-bold ${cfg.textColor}`}>{active} active</span>
                      : <span className="text-[10px] font-bold text-emerald-600">All done</span>
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Status pipeline â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <Card className="p-5 border-none shadow-sm">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Task Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statusBreakdown.map(({ status, count, config }) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={status} className={`${config.bg} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-wide">{status}</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{count}</p>
                <div className="w-full bg-white/60 rounded-full h-1.5 mt-2">
                  <div className={`h-1.5 rounded-full ${config.color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 font-bold mt-1">{pct}% of total</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* â”€â”€ Overdue + Upcoming â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
              <span className="text-sm text-slate-500">All clear â€” no overdue tasks!</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {overdueTasks.map(task => {
                const src = SOURCE_CONFIG[task.source];
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-rose-50/40 transition cursor-pointer"
                    onClick={() => router.push('/portal/task-management/tasks')}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${src.color} shrink-0`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-400 truncate">{getClientName(task.clientId)}</p>
                    </div>
                    <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${src.bg} ${src.textColor}`}>
                      {src.label}
                    </span>
                    <span className="text-[10px] font-bold text-rose-600 shrink-0 flex items-center gap-1 whitespace-nowrap">
                      <Calendar size={9} /> {formatDate(task.dueDate)}
                    </span>
                  </div>
                );
              })}
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
            {upcomingTasks.map(task => {
              const src = SOURCE_CONFIG[task.source];
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition cursor-pointer"
                  onClick={() => router.push('/portal/task-management/tasks')}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[task.status].color} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-400 truncate">{getClientName(task.clientId)}</p>
                  </div>
                  <span className={`shrink-0 text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${src.bg} ${src.textColor}`}>
                    {src.label}
                  </span>
                  <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] px-1.5 py-0 shrink-0">
                    {task.priority}
                  </Badge>
                  <span className="text-[10px] font-medium text-slate-400 shrink-0 flex items-center gap-1 whitespace-nowrap">
                    <Calendar size={9} /> {formatDate(task.dueDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

      </div>
    </div>
  );
}

