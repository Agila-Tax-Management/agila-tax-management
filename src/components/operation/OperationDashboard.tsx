// src/components/operation/OperationDashboard.tsx
'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Users, ClipboardList, AlertCircle, UserPlus } from 'lucide-react';

// ── Placeholder data (replace with API calls) ───────────────────
const STAT_CARDS = [
  {
    id: 'active-clients',
    label: 'Total Active Clients',
    value: 0,
    icon: Users,
    bg: 'bg-amber-50',
    color: 'text-amber-600',
  },
  {
    id: 'pending-requirements',
    label: 'Pending Requirements',
    value: 0,
    icon: ClipboardList,
    bg: 'bg-blue-50',
    color: 'text-blue-600',
  },
  {
    id: 'tasks-due',
    label: 'Tasks Due / Overdue',
    value: 0,
    icon: AlertCircle,
    bg: 'bg-rose-50',
    color: 'text-rose-600',
  },
  {
    id: 'new-this-month',
    label: 'New This Month',
    value: 0,
    icon: UserPlus,
    bg: 'bg-emerald-50',
    color: 'text-emerald-600',
  },
] as const;

const RECENTLY_ONBOARDED = [
  { id: 1, businessName: 'ABC Trading Co.',         entity: 'Sole Proprietorship', assignedAO: 'Juan dela Cruz', onboardedDate: '2026-03-20' },
  { id: 2, businessName: 'XYZ Corporation',         entity: 'Corporation',         assignedAO: '—',             onboardedDate: '2026-03-18' },
  { id: 3, businessName: 'Santos Enterprises',      entity: 'Partnership',         assignedAO: 'Ana Reyes',     onboardedDate: '2026-03-15' },
  { id: 4, businessName: 'Dela Cruz Bakery',        entity: 'Sole Proprietorship', assignedAO: '—',             onboardedDate: '2026-03-10' },
  { id: 5, businessName: 'Makati Consultants, Inc.', entity: 'Corporation',        assignedAO: 'Pedro Santos',  onboardedDate: '2026-03-05' },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

export function OperationDashboard() {
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
                <p className="text-3xl font-black text-slate-900 mt-0.5">{card.value}</p>
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
          <Badge variant="neutral">{RECENTLY_ONBOARDED.length} shown</Badge>
        </div>

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
                  Assigned AO
                </th>
                <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                  Onboarded Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {RECENTLY_ONBOARDED.map((client) => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">{client.businessName}</td>
                  <td className="px-6 py-4 text-slate-600">{client.entity}</td>
                  <td className="px-6 py-4 text-slate-600">{client.assignedAO}</td>
                  <td className="px-6 py-4 text-slate-500">{fmtDate(client.onboardedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
