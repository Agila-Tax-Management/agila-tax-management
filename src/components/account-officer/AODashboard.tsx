'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import {
  ClipboardList, Users, CheckCircle2, Clock,
  AlertTriangle, ArrowUpRight, TrendingUp,
  MessageSquare, Bell, Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const PRIORITY_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'info' | 'neutral' }> = {
  Urgent: { variant: 'danger' },
  High: { variant: 'warning' },
  Medium: { variant: 'info' },
  Low: { variant: 'neutral' },
};

interface DashboardCards {
  totalTasks: number;
  doneCount: number;
  inProgressCount: number;
  completionRate: number;
  activeClients: number;
  totalClients: number;
  unreadNotifs: number;
}

interface DashboardStatusItem {
  name: string;
  count: number;
  color: string;
}

interface DashboardTaskItem {
  id: number;
  title: string;
  clientName: string;
  dueDate: string | null;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  assigneeName?: string;
}

interface DashboardActivityItem {
  id: string;
  actorName: string;
  action: string;
  entity: string;
  description: string;
  createdAt: string;
  clientName: string;
}

interface AODashboardData {
  cards: DashboardCards;
  statusBreakdown: DashboardStatusItem[];
  overdueTasks: DashboardTaskItem[];
  upcomingTasks: DashboardTaskItem[];
  recentActivityLogs: DashboardActivityItem[];
}

const EMPTY_DASHBOARD_DATA: AODashboardData = {
  cards: {
    totalTasks: 0,
    doneCount: 0,
    inProgressCount: 0,
    completionRate: 0,
    activeClients: 0,
    totalClients: 0,
    unreadNotifs: 0,
  },
  statusBreakdown: [],
  overdueTasks: [],
  upcomingTasks: [],
  recentActivityLogs: [],
};

export function AODashboard() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [data, setData] = useState<AODashboardData>(EMPTY_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);

   
  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/account-officer/dashboard', { cache: 'no-store' });
        if (!res.ok) {
          toastError('Failed to load dashboard', 'Please refresh and try again.');
          setData(EMPTY_DASHBOARD_DATA);
          return;
        }
        const json = await res.json() as { data?: AODashboardData };
        setData(json.data ?? EMPTY_DASHBOARD_DATA);
      } catch {
        toastError('Failed to load dashboard', 'Please refresh and try again.');
        setData(EMPTY_DASHBOARD_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboard();
  }, [toastError]);
   

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No due date';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-500 font-medium">Overview of your tasks, clients, and communications.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 border-none shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/account-officer/tasks')}>
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
            <ClipboardList size={60} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
              <ClipboardList size={18} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
            <h3 className="text-2xl font-black text-slate-900">{data.cards.totalTasks}</h3>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="success" className="text-[9px]">{data.cards.doneCount} done</Badge>
              <Badge variant="info" className="text-[9px]">{data.cards.inProgressCount} active</Badge>
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/account-officer/clients')}>
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
            <Users size={60} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-3">
              <Users size={18} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Active Clients</p>
            <h3 className="text-2xl font-black text-slate-900">{data.cards.activeClients}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-2">{data.cards.totalClients} total</p>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={60} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-3">
              <CheckCircle2 size={18} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Completion</p>
            <h3 className="text-2xl font-black text-slate-900">{data.cards.completionRate}%</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${data.cards.completionRate}%` }} />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm relative overflow-hidden group cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/portal/account-officer/notifications')}>
          <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
            <Bell size={60} />
          </div>
          <div className="relative z-10">
            <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
              <Bell size={18} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Notifications</p>
            <h3 className="text-2xl font-black text-slate-900">{data.cards.unreadNotifs}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-2">unread alerts</p>
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-6 border-none shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4">Task Pipeline</h3>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 size={20} className="animate-spin text-[#25238e]" />
          </div>
        ) : data.statusBreakdown.length === 0 ? (
          <p className="text-sm text-slate-500">No task statuses available.</p>
        ) : (
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${data.statusBreakdown.length === 3 ? 'lg:grid-cols-3' : data.statusBreakdown.length === 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            {data.statusBreakdown.map(stage => (
              <div key={stage.name} className="bg-slate-50 rounded-xl p-4 text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: stage.color }} />
                <p className="text-2xl font-black text-slate-900">{stage.count}</p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{stage.name}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue & Upcoming Tasks */}
        <div className="space-y-6">
          {data.overdueTasks.length > 0 && (
            <Card className="p-6 border-none shadow-sm border-l-4 border-l-rose-500!">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-rose-500" />
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-wide">Overdue ({data.overdueTasks.length})</h3>
              </div>
              <div className="space-y-3">
                {data.overdueTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{task.clientName} • Due {formatDate(task.dueDate)}</p>
                    </div>
                    <Badge variant={(PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Medium).variant} className="text-[9px] ml-2 shrink-0">
                      {task.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 border-none shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Upcoming Tasks</h3>
              </div>
              <Button variant="ghost" className="text-xs font-bold" onClick={() => router.push('/portal/account-officer/tasks')}>
                View All <ArrowUpRight size={12} className="ml-1" />
              </Button>
            </div>
            <div className="space-y-3">
              {data.upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {task.clientName} • {task.assigneeName ?? 'Unassigned'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(task.dueDate)}</span>
                    <Badge variant={(PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.Medium).variant} className="text-[9px]">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Activity Log */}
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#25238e]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Recent Activity Log</h3>
            </div>
            <Button variant="ghost" className="text-xs font-bold" onClick={() => router.push('/portal/account-officer/clients')}>
              View Clients <ArrowUpRight size={12} className="ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {data.recentActivityLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white bg-[#25238e]">
                      {log.actorName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{log.actorName}</span>
                    <Badge variant="info" className="text-[9px]">
                      {log.action}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{formatTime(log.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 pl-9 line-clamp-2">{log.description}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 pl-9">{log.clientName} • {log.entity}</p>
              </div>
            ))}
            {!isLoading && data.recentActivityLogs.length === 0 && (
              <p className="text-sm text-slate-500">No recent activity logs yet.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
