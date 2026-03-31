'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Calendar, ClipboardList, CircleCheckBig, Clock3, AlertTriangle } from 'lucide-react';

type BadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

interface LiaisonDashboardData {
  cards: {
    assignedTasks: number;
    inProgress: number;
    overdue: number;
  };
  statusOverview: Array<{
    name: string;
    count: number;
    variant: BadgeVariant;
  }>;
  upcomingDueTasks: Array<{
    id: number;
    name: string;
    clientName: string;
    statusName: string;
    statusVariant: BadgeVariant;
    dueDate: string;
    dueBadge: {
      variant: BadgeVariant;
      label: string;
    };
  }>;
}

const EMPTY_DASHBOARD_DATA: LiaisonDashboardData = {
  cards: {
    assignedTasks: 0,
    inProgress: 0,
    overdue: 0,
  },
  statusOverview: [],
  upcomingDueTasks: [],
};

export function LiaisonDashboard() {
  const router = useRouter();

  const [data, setData] = useState<LiaisonDashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching dashboard data from API */
  useEffect(() => {
    async function loadDashboard(): Promise<void> {
      setIsLoading(true);
      try {
        const response = await fetch('/api/liaison/dashboard', { cache: 'no-store' });
        if (!response.ok) {
          setData(EMPTY_DASHBOARD_DATA);
          return;
        }
        const json = (await response.json()) as { data?: LiaisonDashboardData };
        setData(json.data ?? EMPTY_DASHBOARD_DATA);
      } catch {
        setData(EMPTY_DASHBOARD_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
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
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.assignedTasks}</p>
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
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.inProgress}</p>
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
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.overdue}</p>
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
        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">Loading task status overview...</p>
          </div>
        ) : data.statusOverview.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No task statuses available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.statusOverview.map((status) => (
              <div key={status.name} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs text-slate-500 font-semibold">{status.name}</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{status.count}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 border-none shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={16} className="text-slate-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Upcoming Due Dates</h3>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">Loading upcoming due dates...</p>
          </div>
        ) : data.upcomingDueTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No upcoming due dates for your active tasks.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.upcomingDueTasks.map((task) => {
              return (
                <button
                  key={task.id}
                  onClick={() => router.push(`/portal/liaison/tasks/${task.id}`)}
                  className="w-full text-left rounded-xl border border-slate-200 px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{task.clientName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={task.statusVariant} className="text-[10px]">{task.statusName}</Badge>
                      <Badge variant={task.dueBadge.variant} className="text-[10px]">{task.dueBadge.label}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Due {formatDate(new Date(task.dueDate))}</p>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
