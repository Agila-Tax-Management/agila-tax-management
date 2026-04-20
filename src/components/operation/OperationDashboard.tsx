// src/components/operation/OperationDashboard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Users, AlertCircle, UserPlus, Clock, Loader2 } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface DashboardStats {
  activeClients: number;
  tasksNearDeadline: number;
  overdueTasks: number;
  newClientsThisMonth: number;
}

interface RecentClient {
  id: number;
  businessName: string;
  businessEntity: string;
  tin: string | null;
  operationsManager: { id: string; name: string } | null;
  accountOfficer: { id: string; name: string } | null;
  onboardedDate: string;
}

interface NearDeadlineTask {
  id: number;
  name: string;
  dueDate: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: { name: string; color: string | null } | null;
  client: { id: number; businessName: string } | null;
  assignedTo: { id: number; name: string } | null;
  department: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

const fmtEntity = (e: string) =>
  e.replace(/_/g, ' ').replace(/\\b\\w/g, (c) => c.toUpperCase());

const fmtDaysUntil = (dueDate: string | null): string => {
  if (!dueDate) return 'N/A';
  const now = new Date();
  const due = new Date(dueDate);
  const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return 'Overdue';
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return `${diff} days`;
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  NORMAL: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

export function OperationDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [nearDeadlineTasks, setNearDeadlineTasks] = useState<NearDeadlineTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, clientsRes, tasksRes] = await Promise.all([
          fetch('/api/operation/dashboard/stats'),
          fetch('/api/operation/dashboard/recent-clients'),
          fetch('/api/operation/dashboard/near-deadline-tasks'),
        ]);

        if (statsRes.ok) {
          const statsData = (await statsRes.json()) as { data: DashboardStats };
          setStats(statsData.data);
        }

        if (clientsRes.ok) {
          const clientsData = (await clientsRes.json()) as { data: RecentClient[] };
          setRecentClients(clientsData.data);
        }

        if (tasksRes.ok) {
          const tasksData = (await tasksRes.json()) as { data: NearDeadlineTask[] };
          setNearDeadlineTasks(tasksData.data);
        }
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const STAT_CARDS = [
    {
      id: 'active-clients',
      label: 'Active Clients',
      value: stats?.activeClients ?? 0,
      icon: Users,
      bg: 'bg-emerald-50',
      color: 'text-emerald-600',
    },
    {
      id: 'tasks-near-deadline',
      label: 'Tasks Near Deadline',
      value: stats?.tasksNearDeadline ?? 0,
      icon: Clock,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
    {
      id: 'overdue-tasks',
      label: 'Overdue Tasks',
      value: stats?.overdueTasks ?? 0,
      icon: AlertCircle,
      bg: 'bg-rose-50',
      color: 'text-rose-600',
    },
    {
      id: 'new-this-month',
      label: 'New This Month',
      value: stats?.newClientsThisMonth ?? 0,
      icon: UserPlus,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
  ] as const;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          Operations Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of active clients, pending requirements, and task status
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.id} className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={22} className={card.color} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                  {card.label}
                </p>
                <p className="text-3xl font-black text-slate-900 mt-0.5">
                  {loading ? <Loader2 size={24} className="animate-spin text-slate-300" /> : card.value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recently Onboarded Clients */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Recently Onboarded Clients
          </h2>
          <Badge variant="neutral">{recentClients.length} shown</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : recentClients.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            No clients onboarded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Business Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Entity Type
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    TIN
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Operations Manager
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Account Officer
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Onboarded Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentClients.map((client) => (
                  <tr
                    key={client.id}
                    onClick={() => router.push(`/portal/operation/client-list`)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900">{client.businessName}</td>
                    <td className="px-6 py-4 text-slate-600">{fmtEntity(client.businessEntity)}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                      {client.tin ?? <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {client.operationsManager?.name ?? <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {client.accountOfficer?.name ?? <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{fmtDate(client.onboardedDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Tasks Approaching Deadline */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
            Tasks Approaching Deadline
          </h2>
          <Badge variant="neutral">{nearDeadlineTasks.length} shown</Badge>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : nearDeadlineTasks.length === 0 ? (
          <div className="px-6 py-12 text-center text-slate-400 text-sm">
            No tasks approaching deadline in the next 7 days.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Task Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Assigned To
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {nearDeadlineTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{task.name}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {task.client?.businessName ?? <span className="text-slate-400 italic">N/A</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {task.assignedTo?.name ?? <span className="text-slate-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {task.dueDate ? (
                        <div className="flex flex-col">
                          <span className="text-xs">{fmtDate(task.dueDate)}</span>
                          <span className="text-[10px] text-slate-400">{fmtDaysUntil(task.dueDate)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No due date</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {task.status ? (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: task.status.color ? `${task.status.color}20` : '#f1f5f9',
                            color: task.status.color ?? '#64748b',
                          }}
                        >
                          {task.status.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">No status</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
