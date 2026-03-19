'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Calendar, ClipboardList, CircleCheckBig, Clock3, AlertTriangle } from 'lucide-react';
import { CURRENT_LIAISON, INITIAL_LIAISON_TASKS } from '@/lib/mock-liaison-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTaskStatus } from '@/lib/types';

const STATUS_ORDER: AOTaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

const STATUS_VARIANT: Record<AOTaskStatus, 'neutral' | 'info' | 'warning' | 'success'> = {
  'To Do': 'neutral',
  'In Progress': 'info',
  Review: 'warning',
  Done: 'success',
};

export function LiaisonDashboard() {
  const router = useRouter();

  const myTasks = useMemo(() => {
    return INITIAL_LIAISON_TASKS.filter(task => task.assigneeId === CURRENT_LIAISON.id);
  }, []);

  const statusCounts = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      acc[status] = myTasks.filter(task => task.status === status).length;
      return acc;
    }, {
      'To Do': 0,
      'In Progress': 0,
      Review: 0,
      Done: 0,
    } as Record<AOTaskStatus, number>);
  }, [myTasks]);

  const overdueCount = useMemo(() => {
    const today = new Date('2026-03-17');
    today.setHours(0, 0, 0, 0);

    return myTasks.filter(task => {
      if (task.status === 'Done') return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
  }, [myTasks]);

  const upcomingDueDates = useMemo(() => {
    const today = new Date('2026-03-17');
    today.setHours(0, 0, 0, 0);

    return myTasks
      .filter(task => task.status !== 'Done')
      .map(task => {
        const due = new Date(task.dueDate);
        due.setHours(0, 0, 0, 0);
        const daysRemaining = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { task, due, daysRemaining };
      })
      .sort((a, b) => a.due.getTime() - b.due.getTime())
      .slice(0, 6);
  }, [myTasks]);

  const getClientName = (clientId: string) => {
    return INITIAL_CLIENTS.find(client => client.id === clientId)?.businessName ?? 'Unknown Client';
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  const getDueBadge = (daysRemaining: number) => {
    if (daysRemaining < 0) {
      return { variant: 'danger' as const, label: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) === 1 ? '' : 's'}` };
    }
    if (daysRemaining <= 3) {
      return { variant: 'warning' as const, label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` };
    }
    return { variant: 'success' as const, label: `${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left` };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Liaison Dashboard</h2>
        <p className="text-sm text-slate-500 font-medium">Overview of your assigned tasks and upcoming due dates.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Assigned Tasks</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{myTasks.length}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-violet-50 flex items-center justify-center">
              <ClipboardList size={20} className="text-violet-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">In Progress</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{statusCounts['In Progress']}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock3 size={20} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Overdue Tasks</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{overdueCount}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-rose-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 border-none shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-4">
          <CircleCheckBig size={16} className="text-slate-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Task Status Overview</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_ORDER.map(status => (
            <div key={status} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500 font-semibold">{status}</p>
              <p className="text-2xl font-black text-slate-800 mt-1">{statusCounts[status]}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5 border-none shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-slate-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Upcoming Due Dates</h3>
        </div>

        {upcomingDueDates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No upcoming due dates for your active tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingDueDates.map(({ task, due, daysRemaining }) => {
              const dueBadge = getDueBadge(daysRemaining);
              return (
                <button
                  key={task.id}
                  onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)}
                  className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{getClientName(task.clientId)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={STATUS_VARIANT[task.status]} className="text-[10px]">{task.status}</Badge>
                      <Badge variant={dueBadge.variant} className="text-[10px]">{dueBadge.label}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Due {formatDate(due)}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
