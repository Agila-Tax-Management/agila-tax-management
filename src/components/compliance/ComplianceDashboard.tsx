'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  LineChart, Line, CartesianGrid,
} from 'recharts';
import {
  Activity, AlertCircle, CheckCircle2, Clock,
  TrendingUp, ShieldCheck, Calendar, ArrowUpRight,
} from 'lucide-react';
import { Client } from '@/lib/types';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { ClientPlanDetails } from '@/lib/types';

const formatDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

const getOverallCompliance = (planDetails: ClientPlanDetails | null | undefined): 'COMPLIANT' | 'PENDING' | 'OVERDUE' => {
  const cs = planDetails?._compliance;
  if (!cs) return 'PENDING';
  const vals = [cs.bir, cs.sec, cs.mayorsPermit, cs.dti];
  if (vals.some(v => v === 'OVERDUE')) return 'OVERDUE';
  if (vals.some(v => v === 'PENDING')) return 'PENDING';
  return 'COMPLIANT';
};

const AGENCY_KEYS = [
  { key: 'bir',          label: 'BIR' },
  { key: 'sec',          label: 'SEC' },
  { key: 'mayorsPermit', label: "Mayor's Permit" },
  { key: 'dti',          label: 'DTI' },
] as const;

const getDeadlineUrgency = (deadline?: string) => {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days <= 30) return 'soon';
  return null;
};

// Returns the Monday of the ISO week from "YYYY-Www"
const parseWeekToMonday = (weekStr: string): Date => {
  const [yearPart, weekPart] = weekStr.split('-W');
  const year = parseInt(yearPart);
  const week = parseInt(weekPart);
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay() === 0 ? 7 : simple.getDay();
  const monday = new Date(simple);
  monday.setDate(simple.getDate() - dow + 1);
  return monday;
};

// Returns current ISO week string "YYYY-Www"
const getCurrentWeek = (): string => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

const healthPoint = (clients: Client[], filter: (c: Client, d: Date) => boolean) => {
  const group = clients.filter(c => filter(c, new Date(c.createdAt)));
  const compliant = group.filter(c => getOverallCompliance(c.planDetails) === 'COMPLIANT').length;
  return { health: Math.round((compliant / (group.length || 1)) * 100), filings: group.length };
};

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ComplianceDashboard: React.FC = () => {
  // Build Client[] from mock compliance data so _compliance is present
  const initialClients: Client[] = MOCK_COMPLIANCE_CLIENTS.map(c => ({
    ...c,
    planDetails: { ...c.planDetails, _compliance: c.complianceStatus },
  } as unknown as Client));
  const [clients] = useState<Client[]>(initialClients);

  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  const [filterType,   setFilterType]   = useState<FilterType>('monthly');
  const [dailyValue,   setDailyValue]   = useState(now.toISOString().slice(0, 10));
  const [weeklyValue,  setWeeklyValue]  = useState(getCurrentWeek);
  const [monthlyValue, setMonthlyValue] = useState(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`);
  const [yearlyValue,  setYearlyValue]  = useState(currentYear);

  // --- Stats ---
  const activeClients  = clients.filter(c => c.status?.toUpperCase() === 'ACTIVE').length;
  const pendingCount   = clients.filter(c => getOverallCompliance(c.planDetails) === 'PENDING').length;
  const overdueCount   = clients.filter(c => getOverallCompliance(c.planDetails) === 'OVERDUE').length;
  const monthlyRevenue = clients
    .filter(c => { const d = new Date(c.createdAt); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((sum, c) => sum + (c.finalAmount || 0), 0);

  // --- Health chart data ---
  const computeHealthData = () => {
    if (filterType === 'yearly') {
      return Array.from({ length: 12 }, (_, i) => ({
        name: MONTH_NAMES[i],
        ...healthPoint(clients, (_, d) => d.getMonth() === i && d.getFullYear() === yearlyValue),
      }));
    }

    if (filterType === 'monthly') {
      const [yr, mo] = monthlyValue.split('-').map(Number);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      const weeks: { name: string; health: number; filings: number }[] = [];
      for (let start = 1; start <= daysInMonth; start += 7) {
        const end = Math.min(start + 6, daysInMonth);
        const wk  = Math.ceil(start / 7);
        weeks.push({
          name: `Wk ${wk}`,
          ...healthPoint(clients, (_, d) =>
            d.getFullYear() === yr && d.getMonth() === mo - 1 && d.getDate() >= start && d.getDate() <= end
          ),
        });
      }
      return weeks;
    }

    if (filterType === 'weekly') {
      if (!weeklyValue) return [];
      const monday = parseWeekToMonday(weeklyValue);
      return DAY_NAMES.map((name, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return {
          name,
          ...healthPoint(clients, (_, d) =>
            d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
          ),
        };
      });
    }

    if (filterType === 'daily') {
      // Show the whole week containing the selected date, with that day highlighted
      const selected = new Date(dailyValue);
      const dow = selected.getDay() === 0 ? 7 : selected.getDay();
      const monday = new Date(selected);
      monday.setDate(selected.getDate() - dow + 1);
      return DAY_NAMES.map((name, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        return {
          name,
          ...healthPoint(clients, (_, d) =>
            d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate()
          ),
          isSelected: day.toISOString().slice(0, 10) === dailyValue,
        };
      });
    }

    return [];
  };

  const healthData = computeHealthData();

  // --- Filing distribution ---
  const filingData = AGENCY_KEYS.map(({ key, label }) => ({
    name: label,
    completed: clients.filter(c => c.planDetails?._compliance?.[key] === 'COMPLIANT').length,
    pending:   clients.filter(c => { const v = c.planDetails?._compliance?.[key]; return !v || v !== 'COMPLIANT'; }).length,
  }));

  // --- Upcoming deadlines ---
  const upcomingDeadlines: { title: string; date: string; urgency: string }[] = [];
  clients.forEach(c => {
    const cs = c.planDetails?._compliance;
    if (!cs) return;
    AGENCY_KEYS.forEach(({ key, label }) => {
      const deadline = cs[`${key}Deadline`];
      const urgency  = getDeadlineUrgency(deadline);
      if (urgency && deadline) {
        upcomingDeadlines.push({
          title: `${label} — ${c.businessName}`,
          date: new Date(deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          urgency,
        });
      }
    });
  });
  upcomingDeadlines.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const recentClients = [...clients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  const yearOptions = Array.from({ length: 8 }, (_, i) => currentYear - 3 + i);

  const inputCls = 'h-8 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Overview of all compliance activities and statuses.</p>
      </div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Active Compliances', value: activeClients.toString(),   trend: activeClients === clients.length ? 'All Active' : `${clients.length - activeClients} inactive`, color: 'text-blue-600',   icon: <ShieldCheck size={20} />, variant: 'info'    as const },
          { label: 'Overdue Agencies',          value: overdueCount.toString(),    trend: overdueCount > 0 ? 'Critical' : 'Clear',                                                        color: 'text-red-600',    icon: <AlertCircle size={20} />, variant: overdueCount > 0 ? 'danger' as const : 'success' as const },
          { label: 'Pending Compliance',        value: pendingCount.toString(),    trend: pendingCount > 0 ? 'Action Req.' : 'All Updated',                                               color: 'text-amber-600',  icon: <Clock size={20} />,       variant: 'warning' as const },
          { label: 'Monthly Revenue',           value: `₱${(monthlyRevenue/1000).toFixed(1)}k`, trend: MONTH_NAMES[currentMonth] + ' ' + currentYear,                                   color: 'text-emerald-600', icon: <TrendingUp size={20} />, variant: 'success' as const },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 transition-all hover:shadow-md group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
              <div className={`${stat.color} opacity-20 group-hover:opacity-100 transition-opacity`}>{stat.icon}</div>
            </div>
            <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
            <Badge variant={stat.variant} className="mt-3 text-[10px] uppercase font-black">{stat.trend}</Badge>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Line Chart */}
        <Card className="p-8 lg:col-span-2 border-slate-200 shadow-sm">
          <div className="flex flex-wrap justify-between items-center gap-3 mb-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-emerald-600" /> Compliance Health Monitoring
            </h3>
            {/* Filter Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as FilterType)}
                className={inputCls}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>

              {filterType === 'daily' && (
                <input type="date" value={dailyValue} onChange={e => setDailyValue(e.target.value)} className={inputCls} />
              )}
              {filterType === 'weekly' && (
                <input type="week" value={weeklyValue} onChange={e => setWeeklyValue(e.target.value)} className={inputCls} />
              )}
              {filterType === 'monthly' && (
                <input type="month" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} className={inputCls} />
              )}
              {filterType === 'yearly' && (
                <select value={yearlyValue} onChange={e => setYearlyValue(parseInt(e.target.value))} className={inputCls}>
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              )}
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(val) => [typeof val === 'number' ? `${val}%` : '—', 'Health']}
                />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="#10b981"
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Bar Chart */}
        <Card className="p-8 border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Filing Distribution</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filingData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: 700 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="completed" stackId="a" fill="#10b981" barSize={12} />
                <Bar dataKey="pending" stackId="a" fill="#f1f5f9" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Compliant</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-slate-200 rounded-full" />
              <span className="text-[10px] font-bold text-slate-500 uppercase">Pending</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Deadlines + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-8 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Upcoming Deadlines</h3>
          <div className="space-y-2">
            {upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-slate-400">
                <CheckCircle2 size={32} className="mb-2 text-emerald-300" />
                <p className="text-sm font-medium">No upcoming deadlines</p>
              </div>
            ) : upcomingDeadlines.slice(0, 4).map((d, i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${d.urgency === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{d.title}</p>
                    <p className="text-xs text-slate-500">{d.date}</p>
                  </div>
                </div>
                <Badge variant={d.urgency === 'overdue' ? 'danger' : 'warning'}>
                  {d.urgency === 'overdue' ? 'Overdue' : 'Due Soon'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-8 border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Recent Enrollments</h3>
            <Badge variant="info" className="text-xs">Live</Badge>
          </div>
          <div className="space-y-2">
            {recentClients.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-8">No recent activity.</p>
            ) : recentClients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{client.businessName}</p>
                    <p className="text-xs text-slate-400">{client.clientNo} · {formatDate(new Date(client.createdAt))}</p>
                  </div>
                </div>
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
