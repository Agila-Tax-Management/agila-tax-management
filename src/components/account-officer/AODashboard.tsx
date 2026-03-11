'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  ClipboardList, Users, CheckCircle2, Clock,
  AlertTriangle, ArrowUpRight, TrendingUp,
  MessageSquare, Bell,
} from 'lucide-react';
import { INITIAL_AO_TASKS, INITIAL_AO_NOTIFICATIONS, INITIAL_AO_DISCUSSIONS, AO_TEAM_MEMBERS } from '@/lib/mock-ao-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AOTask } from '@/lib/types';
import { useRouter } from 'next/navigation';

const PRIORITY_CONFIG: Record<string, { variant: 'danger' | 'warning' | 'info' | 'neutral'; label: string }> = {
  Urgent: { variant: 'danger', label: 'Urgent' },
  High: { variant: 'warning', label: 'High' },
  Medium: { variant: 'info', label: 'Medium' },
  Low: { variant: 'neutral', label: 'Low' },
};

export function AODashboard() {
  const router = useRouter();
  const [tasks] = useState<AOTask[]>(INITIAL_AO_TASKS);

  const todoCount = tasks.filter(t => t.status === 'To Do').length;
  const inProgressCount = tasks.filter(t => t.status === 'In Progress').length;
  const reviewCount = tasks.filter(t => t.status === 'Review').length;
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const totalTasks = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

  const activeClients = INITIAL_CLIENTS.filter(c => c.status === 'Active').length;
  const unreadNotifs = INITIAL_AO_NOTIFICATIONS.filter(n => !n.isRead).length;

  const overdueTasks = tasks.filter(t => {
    if (t.status === 'Done') return false;
    return new Date(t.dueDate) < new Date('2026-03-11');
  });

  const upcomingTasks = tasks
    .filter(t => t.status !== 'Done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const recentDiscussions = INITIAL_AO_DISCUSSIONS
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const getClientName = (clientId: string) =>
    INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? 'Unknown';

  const getAssigneeName = (assigneeId: string) =>
    AO_TEAM_MEMBERS.find(m => m.id === assigneeId)?.name ?? 'Unassigned';

  const formatDate = (dateStr: string) => {
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
            <h3 className="text-2xl font-black text-slate-900">{totalTasks}</h3>
            <div className="flex items-center gap-1 mt-2">
              <Badge variant="success" className="text-[9px]">{doneCount} done</Badge>
              <Badge variant="info" className="text-[9px]">{inProgressCount} active</Badge>
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
            <h3 className="text-2xl font-black text-slate-900">{activeClients}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-2">{INITIAL_CLIENTS.length} total</p>
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
            <h3 className="text-2xl font-black text-slate-900">{completionRate}%</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
              <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
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
            <h3 className="text-2xl font-black text-slate-900">{unreadNotifs}</h3>
            <p className="text-[10px] text-slate-500 font-bold mt-2">unread alerts</p>
          </div>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="p-6 border-none shadow-sm">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4">Task Pipeline</h3>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'To Do', count: todoCount, color: 'bg-slate-500', bgColor: 'bg-slate-50' },
            { label: 'In Progress', count: inProgressCount, color: 'bg-blue-500', bgColor: 'bg-blue-50' },
            { label: 'Review', count: reviewCount, color: 'bg-amber-500', bgColor: 'bg-amber-50' },
            { label: 'Done', count: doneCount, color: 'bg-emerald-500', bgColor: 'bg-emerald-50' },
          ].map(stage => (
            <div key={stage.label} className={`${stage.bgColor} rounded-xl p-4 text-center`}>
              <div className={`w-3 h-3 ${stage.color} rounded-full mx-auto mb-2`} />
              <p className="text-2xl font-black text-slate-900">{stage.count}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{stage.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue & Upcoming Tasks */}
        <div className="space-y-6">
          {overdueTasks.length > 0 && (
            <Card className="p-6 border-none shadow-sm border-l-4 border-l-rose-500!">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} className="text-rose-500" />
                <h3 className="text-sm font-black text-rose-700 uppercase tracking-wide">Overdue ({overdueTasks.length})</h3>
              </div>
              <div className="space-y-3">
                {overdueTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                      <p className="text-xs text-slate-500">{getClientName(task.clientId)} • Due {formatDate(task.dueDate)}</p>
                    </div>
                    <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px] ml-2 shrink-0">
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
              {upcomingTasks.map(task => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">
                      {getClientName(task.clientId)} • {getAssigneeName(task.assigneeId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[10px] font-bold text-slate-400">{formatDate(task.dueDate)}</span>
                    <Badge variant={PRIORITY_CONFIG[task.priority].variant} className="text-[9px]">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Recent Discussions */}
        <Card className="p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-[#25238e]" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Recent Discussions</h3>
            </div>
            <Button variant="ghost" className="text-xs font-bold" onClick={() => router.push('/portal/account-officer/discussions')}>
              View All <ArrowUpRight size={12} className="ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {recentDiscussions.map(msg => (
              <div key={msg.id} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                      msg.senderRole === 'account-officer' ? 'bg-[#25238e]' : 'bg-emerald-600'
                    }`}>
                      {msg.senderName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-bold text-slate-800">{msg.senderName}</span>
                    <Badge variant={msg.senderRole === 'account-officer' ? 'info' : 'success'} className="text-[9px]">
                      {msg.senderRole === 'account-officer' ? 'AO' : 'Client'}
                    </Badge>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">{formatTime(msg.createdAt)}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 pl-9 line-clamp-2">{msg.content}</p>
                <p className="text-[10px] text-slate-400 font-bold mt-1 pl-9">{getClientName(msg.clientId)}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
