// src/components/task-management/TaskManagementDashboard.tsx
'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock,
  ArrowRight, Calendar, Shield, Truck, Handshake,
} from 'lucide-react';
import { ALL_TASKS, SOURCE_CONFIG } from '@/lib/mock-task-management-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTaskStatus, AOTaskPriority } from '@/lib/types';

const STATUS_CONFIG: Record<AOTaskStatus, { variant: 'neutral' | 'info' | 'warning' | 'success'; color: string }> = {
  'To Do': { variant: 'neutral', color: 'bg-slate-500' },
  'In Progress': { variant: 'info', color: 'bg-blue-500' },
  'Review': { variant: 'warning', color: 'bg-amber-500' },
  'Done': { variant: 'success', color: 'bg-emerald-500' },
};

const PRIORITY_CONFIG: Record<AOTaskPriority, { variant: 'neutral' | 'info' | 'warning' | 'danger' }> = {
  Low: { variant: 'neutral' },
  Medium: { variant: 'info' },
  High: { variant: 'warning' },
  Urgent: { variant: 'danger' },
};

export function TaskManagementDashboard() {
  const router = useRouter();

  const stats = useMemo(() => {
    const total = ALL_TASKS.length;
    const done = ALL_TASKS.filter(t => t.status === 'Done').length;
    const overdue = ALL_TASKS.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-12')).length;
    const urgent = ALL_TASKS.filter(t => t.priority === 'Urgent' && t.status !== 'Done').length;
    const clientRelationsCount = ALL_TASKS.filter(t => t.source === 'client-relations').length;
    const liaisonCount = ALL_TASKS.filter(t => t.source === 'liaison').length;
    const complianceCount = ALL_TASKS.filter(t => t.source === 'compliance').length;
    return { total, done, overdue, urgent, clientRelationsCount, liaisonCount, complianceCount };
  }, []);

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
      .filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-12'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    []
  );

  const upcomingTasks = useMemo(() =>
    ALL_TASKS
      .filter(t => t.status !== 'Done' && new Date(t.dueDate) >= new Date('2026-03-12'))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 6),
    []
  );

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Task Management Dashboard</h2>
        <p className="text-sm text-slate-500 font-medium">Overview of all client relations, liaison, and compliance tasks across teams.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm"
          onClick={() => router.push('/portal/task-management/tasks')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-[#0f766e]/10 rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-[#0f766e]" />
            </div>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.total}</p>
          <p className="text-xs text-slate-500 font-medium">Total Tasks</p>
          <div className="flex gap-2 mt-2">
            <Badge variant="success" className="text-[9px]">{stats.done} Done</Badge>
            <Badge variant="info" className="text-[9px]">{stats.total - stats.done} Active</Badge>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <AlertTriangle size={20} className="text-rose-500" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.overdue}</p>
          <p className="text-xs text-slate-500 font-medium">Overdue Tasks</p>
          {stats.urgent > 0 && (
            <Badge variant="danger" className="text-[9px] mt-2">{stats.urgent} Urgent</Badge>
          )}
        </Card>

        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm"
          onClick={() => router.push('/portal/task-management/client-relations')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Handshake size={20} className="text-rose-600" />
            </div>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.clientRelationsCount}</p>
          <p className="text-xs text-slate-500 font-medium">Client Relations</p>
          <Badge variant="info" className="text-[9px] mt-2">
            {ALL_TASKS.filter(t => t.source === 'client-relations' && t.status !== 'Done').length} Active
          </Badge>
        </Card>

        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm"
          onClick={() => router.push('/portal/task-management/liaison')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
              <Truck size={20} className="text-cyan-600" />
            </div>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.liaisonCount}</p>
          <p className="text-xs text-slate-500 font-medium">Liaison Tasks</p>
          <Badge variant="info" className="text-[9px] mt-2">
            {ALL_TASKS.filter(t => t.source === 'liaison' && t.status !== 'Done').length} Active
          </Badge>
        </Card>

        <Card
          className="p-5 cursor-pointer hover:shadow-md transition-shadow border-none shadow-sm"
          onClick={() => router.push('/portal/task-management/compliance')}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
              <Shield size={20} className="text-violet-600" />
            </div>
            <ArrowRight size={14} className="text-slate-300" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.complianceCount}</p>
          <p className="text-xs text-slate-500 font-medium">Compliance Tasks</p>
          <Badge variant="info" className="text-[9px] mt-2">
            {ALL_TASKS.filter(t => t.source === 'compliance' && t.status !== 'Done').length} Active
          </Badge>
        </Card>
      </div>

      {/* Task Pipeline */}
      <Card className="p-5 border-none shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">Task Pipeline</h3>
        <div className="grid grid-cols-4 gap-3">
          {statusBreakdown.map(({ status, count, config }) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
            return (
              <div key={status} className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${config.color}`} />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wide">{status}</span>
                </div>
                <p className="text-2xl font-black text-slate-900">{count}</p>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div className={`h-1.5 rounded-full ${config.color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 font-bold mt-1">{pct}%</p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two-column: Overdue + Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Overdue Tasks */}
        <Card className="p-5 border-none shadow-sm border-l-4 border-l-rose-400">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Overdue Tasks</h3>
            <span className="ml-auto text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">{overdueTasks.length}</span>
          </div>
          {overdueTasks.length === 0 ? (
            <div className="flex items-center gap-2 py-6 justify-center">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-500">No overdue tasks. Great job!</span>
            </div>
          ) : (
            <div className="space-y-2">
              {overdueTasks.map(task => {
                const src = SOURCE_CONFIG[task.source];
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 bg-rose-50/50 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                    onClick={() => router.push('/portal/task-management/tasks')}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{getClientName(task.clientId)}</p>
                    </div>
                    <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${src.bg} ${src.textColor}`}>
                      {src.label}
                    </span>
                    <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[8px] shrink-0">
                      {task.priority}
                    </Badge>
                    <span className="text-[10px] font-bold text-rose-600 shrink-0 flex items-center gap-1">
                      <Calendar size={10} /> {formatDate(task.dueDate)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Upcoming Tasks */}
        <Card className="p-5 border-none shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#0f766e]" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Upcoming Tasks</h3>
          </div>
          <div className="space-y-2">
            {upcomingTasks.map(task => {
              const src = SOURCE_CONFIG[task.source];
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                  onClick={() => router.push('/portal/task-management/tasks')}
                >
                  <div className={`w-2 h-2 rounded-full shrink-0 ${STATUS_CONFIG[task.status].color}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-[10px] text-slate-500 truncate">{getClientName(task.clientId)}</p>
                  </div>
                  <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${src.bg} ${src.textColor}`}>
                    {src.label}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 shrink-0 flex items-center gap-1">
                    <Calendar size={10} /> {formatDate(task.dueDate)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card className="p-5 border-none shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-4">Department Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(['liaison', 'compliance'] as const).map(source => {
            const cfg = SOURCE_CONFIG[source];
            const tasks = ALL_TASKS.filter(t => t.source === source);
            const todo = tasks.filter(t => t.status === 'To Do').length;
            const inProgress = tasks.filter(t => t.status === 'In Progress').length;
            const review = tasks.filter(t => t.status === 'Review').length;
            const done = tasks.filter(t => t.status === 'Done').length;
            const overdue = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date('2026-03-12')).length;

            return (
              <div key={source} className={`p-4 rounded-xl border ${cfg.bg}`}>
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                  <span className={`text-sm font-black uppercase tracking-tight ${cfg.textColor}`}>{cfg.label}</span>
                  <span className="ml-auto text-lg font-black text-slate-900">{tasks.length}</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { label: 'To Do', value: todo },
                    { label: 'Active', value: inProgress },
                    { label: 'Review', value: review },
                    { label: 'Done', value: done },
                    { label: 'Overdue', value: overdue },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-lg font-black text-slate-800">{item.value}</p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
