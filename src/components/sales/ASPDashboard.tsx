'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  BarChart, ResponsiveContainer,
  Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import {
  TrendingUp, Target, Download,
  ArrowUpRight, Activity, Clock, ChevronRight,
  DollarSign, Briefcase, Wallet, Bell, Phone, FileText,
  Percent, BarChart as BarChartIcon, Mail,
  ExternalLink, Sparkles, AlertCircle, Zap
} from 'lucide-react';
import { LEAD_STATUSES } from '@/lib/constants';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  businessType: string;
  leadSource: string;
  statusId: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardData {
  stageCounts: number[];
  totalValue: string;
  activeOpportunities: number;
  conversionRate: string;
  avgCloseTime: string;
  trends: {
    value: string;
    opportunities: string;
    conversion: string;
    closeTime: string;
  };
  pipelineData?: Array<{ name: string; value: number }>;
  hasData: boolean;
  timestamp: string;
}

interface AuditData {
  efficiency: {
    leadResponse: { value: string; rating: 'excellent' | 'good' | 'poor'; benchmark: string };
    closeVelocity: { value: string; rating: 'excellent' | 'good' | 'poor'; benchmark: string };
    conversion: { value: string; rating: 'excellent' | 'good' | 'poor'; benchmark: string };
  };
  pipelineHealth: {
    bottlenecks: string[];
    recommendations: string[];
    healthScore: number;
  };
  performance: {
    topStage: string;
    weakestStage: string;
    improvementAreas: string[];
  };
}

const COLORS = ['#25238e', '#0ea5e9', '#10b981', '#f59e0b', '#f97316', '#16a34a', '#ef4444', '#8b5cf6', '#6366f1', '#eab308', '#0d9488'];

const MOCK_DASHBOARD_DATA: DashboardData = {
  stageCounts: [12, 8, 5, 3, 4, 2, 3, 2, 1, 1, 1],
  totalValue: '₱1.2M',
  activeOpportunities: 42,
  conversionRate: '24.8%',
  avgCloseTime: '11d',
  trends: {
    value: '+15%',
    opportunities: '+2.4%',
    conversion: '+8 Closing',
    closeTime: '+3 vs last'
  },
  pipelineData: [
    { name: 'New', value: 12 },
    { name: 'Contacted', value: 8 },
    { name: 'Qualified', value: 5 },
    { name: 'Proposal', value: 3 },
    { name: 'Negotiation', value: 4 },
    { name: 'Closed Won', value: 2 },
    { name: 'Onboarding', value: 3 },
    { name: 'Contract', value: 2 },
    { name: 'Payment', value: 1 },
    { name: 'Turnover', value: 1 },
    { name: 'Lost', value: 1 },
  ],
  hasData: false,
  timestamp: new Date().toISOString()
};

const MOCK_AUDIT_DATA: AuditData = {
  efficiency: {
    leadResponse: { value: '4.2 minutes', rating: 'excellent', benchmark: 'Target: <5 min' },
    closeVelocity: { value: '11 days', rating: 'good', benchmark: 'Target: <14 days' },
    conversion: { value: '24.8%', rating: 'excellent', benchmark: 'Target: >20%' }
  },
  pipelineHealth: {
    bottlenecks: [
      'Proposal stage has 40% drop-off rate',
      'Average time in Negotiation: 8 days (above target)'
    ],
    recommendations: [
      'Implement automated follow-up for Proposal stage',
      'Create negotiation playbook to reduce cycle time',
      'Increase Contacted → Qualified conversion with better qualification criteria'
    ],
    healthScore: 78
  },
  performance: {
    topStage: 'New Leads (12 leads)',
    weakestStage: 'Lost (1 lead)',
    improvementAreas: [
      'Reduce proposal response time',
      'Improve negotiation techniques',
      'Enhance qualification process'
    ]
  }
};

export const ASPDashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>(MOCK_DASHBOARD_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Leads and audit data
  const [followUpLeads] = useState<Lead[]>([]);
  const [callLeads] = useState<Lead[]>([]);
  const [proposalLeads] = useState<Lead[]>([]);
  const [auditData] = useState<AuditData>(MOCK_AUDIT_DATA);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/sales/dashboard');
        if (res.ok) {
          const json = await res.json() as { data: DashboardData };
          setData(json.data);
          setError(null);
        } else {
          setError('Failed to load dashboard data');
        }
      } catch {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };
    void fetchDashboardData();
  }, []);

  const totalLeads = data.stageCounts.reduce((sum, count) => sum + count, 0);
  const maxCount = Math.max(...data.stageCounts);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'poor': return 'text-rose-600 bg-rose-50 border-rose-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getRatingBadgeColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'bg-emerald-600 text-white';
      case 'good': return 'bg-blue-600 text-white';
      case 'poor': return 'bg-rose-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-pulse p-4 sm:p-6 md:p-0">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200">
              <div className="h-3 sm:h-4 bg-slate-200 rounded w-3/4 mb-2 sm:mb-3"></div>
              <div className="h-6 sm:h-8 bg-slate-200 rounded w-1/2 mb-2 sm:mb-3"></div>
              <div className="h-3 sm:h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center">
        <p className="text-rose-700 font-semibold">Failed to load dashboard</p>
        <p className="text-rose-600 text-sm mt-1">{error}</p>
      </div>
    );
  }



  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 animate-in fade-in duration-700 pb-16 sm:pb-20 px-4 sm:px-6 md:px-0">


      {/* Primary Performance Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
        {[
          { label: 'Total Revenue', value: data.totalValue, trend: data.trends.value, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" /> },
          { label: 'Conversion Rate', value: data.conversionRate, trend: data.trends.conversion, color: 'text-blue-600', bg: 'bg-blue-50', icon: <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" /> },
          { label: 'Active Deals', value: data.activeOpportunities.toString(), trend: data.trends.opportunities, color: 'text-[#25238e]', bg: 'bg-indigo-50', icon: <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" /> },
          { label: 'Avg. Close Time', value: data.avgCloseTime, trend: data.trends.closeTime, color: 'text-purple-600', bg: 'bg-purple-50', icon: <Clock className="w-4 h-4 sm:w-5 sm:h-5" /> },
          { label: 'Commission', value: '₱124k', trend: 'Paid out', color: 'text-orange-600', bg: 'bg-orange-50', icon: <Wallet className="w-4 h-4 sm:w-5 sm:h-5" /> },
        ].map((stat, i) => (
          <Card key={i} className="p-3 sm:p-4 md:p-5 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <div className={`p-1.5 sm:p-2 md:p-2.5 rounded-lg sm:rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                {stat.icon}
              </div>
              <Badge variant="neutral" className="text-[7px] sm:text-[8px] uppercase font-black tracking-tighter">
                {stat.trend}
              </Badge>
            </div>
            <div className="mt-2 sm:mt-3 md:mt-4">
              <p className="text-[8px] sm:text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{stat.label}</p>
              <h3 className={`text-base sm:text-lg md:text-xl lg:text-2xl font-black mt-1 ${stat.color}`}>{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      {/* Action Items Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {[
          {
            label: 'Follow-ups due',
            value: followUpLeads.length.toString(),
            icon: <Bell className="text-rose-500 w-5 h-5 sm:w-6 sm:h-6" />,
            bg: 'bg-rose-50',
            description: 'Immediate attention',
            onClick: () => setIsFollowUpModalOpen(true)
          },
          {
            label: 'Clients to call',
            value: callLeads.length.toString(),
            icon: <Phone className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6" />,
            bg: 'bg-blue-50',
            description: 'Outreach needed',
            onClick: () => setIsCallModalOpen(true)
          },
          {
            label: 'Pending proposals',
            value: proposalLeads.length.toString(),
            icon: <FileText className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6" />,
            bg: 'bg-amber-50',
            description: 'Awaiting signature',
            onClick: () => setIsProposalModalOpen(true)
          },
        ].map((item, i) => (
          <Card
            key={i}
            className="p-4 sm:p-5 md:p-6 border-none shadow-sm flex items-center gap-3 sm:gap-4 md:gap-5 hover:bg-slate-50 transition-colors cursor-pointer group"
            onClick={item.onClick}
          >
            <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-xl sm:rounded-2xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              {item.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight truncate">{item.label}</h4>
              <div className="flex items-baseline gap-1.5 sm:gap-2 mt-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{item.value}</span>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 truncate">{item.description}</span>
              </div>
            </div>
            <ChevronRight size={14} className="ml-auto text-slate-200 group-hover:text-slate-400 transition-colors shrink-0 hidden sm:block" />
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Pipeline Distribution */}
        <Card className="p-4 sm:p-6 md:p-8 lg:col-span-2 border-none shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 sm:p-6 md:p-8 opacity-5 hidden md:block">
            <BarChartIcon className="w-20 h-20 sm:w-24 sm:h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 md:mb-8 gap-3">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-widest">Pipeline Distribution</h3>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium mt-1">Lead volume across sales stages</p>
              </div>
              <Badge variant="info" className="bg-blue-50 text-[#25238e] border-none font-black text-[8px] sm:text-[10px] self-start sm:self-auto">REAL-TIME</Badge>
            </div>

            <div className="h-48 sm:h-56 md:h-64 lg:h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.pipelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                    dy={8}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                      fontSize: '11px',
                      fontWeight: 'bold'
                    }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={30}>
                    {(data.pipelineData || []).map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Efficiency Pulse */}
        <Card className="p-4 sm:p-6 md:p-8 border-none shadow-sm flex flex-col bg-slate-900 text-white">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8">
            <div className="p-1.5 sm:p-2 bg-white/10 rounded-lg">
              <Activity className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-widest">Efficiency Pulse</h3>
          </div>

          <div className="space-y-4 sm:space-y-6 md:space-y-8 flex-1">
            {[
              { label: 'Lead Response', value: '4.2m', color: 'bg-blue-500', pct: 85, icon: <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
              { label: 'Close Velocity', value: '11 Days', color: 'bg-emerald-500', pct: 62, icon: <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
              { label: 'Conversion', value: '24.8%', color: 'bg-[#4743af]', pct: 75, icon: <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> },
            ].map((m, i) => (
              <div key={i} className="group">
                <div className="flex justify-between items-end mb-2 sm:mb-3">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-slate-400 group-hover:text-white transition-colors">{m.icon}</span>
                    <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white transition-colors line-clamp-1">{m.label}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black">{m.value}</span>
                </div>
                <div className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${m.color} rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.2)]`}
                    style={{ width: `${m.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="ghost"
            onClick={() => setIsAuditModalOpen(true)}
            className="w-full mt-4 sm:mt-6 md:mt-8 text-blue-400 hover:text-blue-300 hover:bg-white/5 font-black text-[9px] sm:text-[10px] uppercase tracking-widest border-t border-white/5 pt-4 sm:pt-6 rounded-none justify-center"
          >
            View Audit <ArrowUpRight className="w-3 h-3 ml-1.5 sm:ml-2" />
          </Button>
        </Card>
      </div>

      {/* Pipeline Stage Monitoring */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Target size={16} className="text-[#25238e]" />
              Pipeline Overview
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <span className="font-bold text-[#25238e]">{totalLeads} leads</span> across {LEAD_STATUSES.length} stages
            </p>
          </div>
          <Button
            variant="outline"
            className="text-xs font-bold h-9 px-4 rounded-lg"
            onClick={() => window.location.href = '/portal/sales/lead-center'}
          >
            View Kanban <ExternalLink className="w-3 h-3 ml-1.5" />
          </Button>
        </div>

        {/* Compact Square Grid */}
        <div className="grid grid-cols-7 gap-2">
          {LEAD_STATUSES.map((status, index) => {
            const count = data.stageCounts[index] || 0;
            const percentage = totalLeads > 0 ? (count / totalLeads) * 100 : 0;
            const isHighVolume = count === maxCount && count > 0;

            return (
              <Card
                key={status.id}
                className={`p-3 border hover:shadow-lg transition-all cursor-pointer group aspect-square flex flex-col justify-between ${
                  isHighVolume
                    ? 'border-[#25238e] bg-blue-50 ring-1 ring-[#25238e]'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
                onClick={() => window.location.href = '/portal/sales/lead-center'}
              >
                <div className="flex items-start justify-between">
                  <div className={`w-6 h-6 rounded-lg ${status.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-black">{index + 1}</span>
                  </div>
                  {isHighVolume && <Zap size={12} className="text-[#25238e]" fill="#25238e" />}
                </div>
                <div className="text-center">
                  <p className="text-3xl font-black text-slate-900 group-hover:text-[#25238e] transition-colors">
                    {count}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-tight truncate text-center">
                    {status.name}
                  </p>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${status.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Quick Summary Stats */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="p-4 bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={14} className="text-emerald-600" />
              <p className="text-xs font-black text-emerald-700 uppercase">Health</p>
            </div>
            <p className="text-2xl font-black text-emerald-800">
              {totalLeads > 0 ? Math.min(100, Math.round((data.stageCounts[5] / totalLeads) * 100 + 70)) : 0}
              <span className="text-sm text-emerald-600">/100</span>
            </p>
          </Card>

          <Card className="p-4 bg-linear-to-br from-orange-50 to-amber-50 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-orange-600" />
              <p className="text-xs font-black text-orange-700 uppercase">Hot</p>
            </div>
            <p className="text-2xl font-black text-orange-800">
              {data.stageCounts[3] + data.stageCounts[4]}
              <span className="text-xs text-orange-600 ml-1">closing</span>
            </p>
          </Card>

          <Card className="p-4 bg-linear-to-br from-blue-50 to-indigo-50 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Target size={14} className="text-blue-600" />
              <p className="text-xs font-black text-blue-700 uppercase">Win Rate</p>
            </div>
            <p className="text-2xl font-black text-blue-800">
              {totalLeads > 0 ? ((data.stageCounts[5] / totalLeads) * 100).toFixed(1) : '0.0'}
              <span className="text-xs text-blue-600">%</span>
            </p>
          </Card>

          <Card className="p-4 bg-linear-to-br from-rose-50 to-pink-50 border border-rose-200">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} className="text-rose-600" />
              <p className="text-xs font-black text-rose-700 uppercase">Drop-off</p>
            </div>
            <p className="text-2xl font-black text-rose-800">
              {totalLeads > 0 ? ((data.stageCounts[6] / totalLeads) * 100).toFixed(1) : '0.0'}
              <span className="text-xs text-rose-600">%</span>
            </p>
          </Card>
        </div>
      </section>

      {/* Modals */}
      <LeadListModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Follow-ups Due Today"
        leads={followUpLeads}
        emptyMessage="No follow-ups are due today"
        icon={<Bell className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />}
        iconBg="bg-rose-50"
      />

      <LeadListModal
        isOpen={isCallModalOpen}
        onClose={() => setIsCallModalOpen(false)}
        title="Clients to Call"
        leads={callLeads}
        emptyMessage="No clients pending calls"
        icon={<Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />}
        iconBg="bg-blue-50"
      />

      <LeadListModal
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        title="Pending Proposals"
        leads={proposalLeads}
        emptyMessage="No pending proposals"
        icon={<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />}
        iconBg="bg-amber-50"
      />

      {/* Audit Modal */}
      <Modal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title=""
        size="2xl"
      >
        <div className="p-6 space-y-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="bg-linear-to-r from-[#25238e] to-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <Activity size={24} className="text-blue-200" />
              <h2 className="text-2xl font-black uppercase tracking-tight">Pipeline Performance Audit</h2>
            </div>
            <p className="text-blue-100 text-sm">Comprehensive analysis of your sales pipeline efficiency</p>
          </div>

          {/* Efficiency Metrics */}
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-blue-600 rounded-full" />
              Efficiency Metrics
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(auditData.efficiency).map(([key, metric]) => (
                <Card key={key} className={`p-5 border ${getRatingColor(metric.rating)}`}>
                  <p className="text-xs font-black uppercase tracking-widest mb-3 opacity-70">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-3xl font-black mb-2">{metric.value}</p>
                  <p className="text-[10px] font-bold opacity-60 mb-3">{metric.benchmark}</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black ${getRatingBadgeColor(metric.rating)}`}>
                    {metric.rating.toUpperCase()}
                  </span>
                </Card>
              ))}
            </div>
          </div>

          {/* Pipeline Health */}
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-purple-600 rounded-full" />
              Pipeline Health Analysis
            </h4>
            <Card className="p-6 bg-slate-50 border-slate-200">
              <div className="flex flex-col md:flex-row items-center gap-6 mb-6">
                <div className="relative shrink-0">
                  <svg className="w-32 h-32 transform -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="#e2e8f0" strokeWidth="10" />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      fill="none"
                      stroke="#25238e"
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 56}`}
                      strokeDashoffset={`${2 * Math.PI * 56 * (1 - auditData.pipelineHealth.healthScore / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-[#25238e]">{auditData.pipelineHealth.healthScore}</span>
                    <span className="text-xs text-slate-500 font-bold">Health Score</span>
                  </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-sm font-bold text-slate-700 mb-2">Overall Health Assessment</p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your pipeline is performing <span className="font-black text-[#25238e]">above average</span> with room for optimization in key stages.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle size={16} className="text-amber-600" />
                    <h5 className="text-sm font-black text-slate-800">Identified Bottlenecks</h5>
                  </div>
                  <div className="space-y-2">
                    {auditData.pipelineHealth.bottlenecks.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <div className="w-5 h-5 bg-amber-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-blue-600" />
                    <h5 className="text-sm font-black text-slate-800">Action Items</h5>
                  </div>
                  <div className="space-y-2">
                    {auditData.pipelineHealth.recommendations.map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">
                          ✓
                        </div>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Summary */}
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-emerald-600 rounded-full" />
              Performance Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-5 bg-emerald-50 border-emerald-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={16} className="text-emerald-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-700">Top Performer</p>
                </div>
                <p className="text-lg font-black text-emerald-800">{auditData.performance.topStage}</p>
              </Card>
              <Card className="p-5 bg-rose-50 border-rose-200">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle size={16} className="text-rose-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-rose-700">Needs Attention</p>
                </div>
                <p className="text-lg font-black text-rose-800">{auditData.performance.weakestStage}</p>
              </Card>
              <Card className="p-5 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Target size={16} className="text-blue-600" />
                  <p className="text-xs font-black uppercase tracking-widest text-blue-700">Focus Areas</p>
                </div>
                <p className="text-lg font-black text-blue-800">{auditData.performance.improvementAreas.length} identified</p>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => setIsAuditModalOpen(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 h-12 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 font-bold shadow-lg"
              onClick={() => {
                alert('Detailed audit report will be generated and downloaded.');
              }}
            >
              <Download size={16} className="mr-2" /> Download Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Lead List Modal Component
interface LeadListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  leads: Lead[];
  emptyMessage: string;
  icon: React.ReactNode;
  iconBg: string;
}

const LeadListModal: React.FC<LeadListModalProps> = ({
  isOpen,
  onClose,
  title,
  leads,
  emptyMessage,
  icon,
  iconBg
}) => {
  const getStatusName = (statusId: string) => {
    const status = LEAD_STATUSES.find(s => s.id === statusId);
    return status?.name || 'Unknown';
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
        {leads.length > 0 ? (
          <>
            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
              <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                {icon}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{leads.length} Leads</p>
                <p className="text-xs text-slate-500">Requires immediate attention</p>
              </div>
            </div>

            <div className="space-y-3">
              {leads.map((lead) => (
                <Card key={lead.id} className="p-4 border-slate-100 hover:border-blue-200 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {lead.firstName} {lead.lastName}
                        </h4>
                        <Badge variant="neutral" className="text-[9px] shrink-0">
                          {getStatusName(lead.statusId)}
                        </Badge>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone size={12} className="text-slate-400 shrink-0" />
                          <span className="font-medium truncate">{lead.contactNumber}</span>
                        </div>

                        {lead.email && (
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail size={12} className="text-slate-400 shrink-0" />
                            <span className="font-medium truncate">{lead.email}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Briefcase size={12} className="text-slate-400 shrink-0" />
                          <span className="font-medium truncate">{lead.businessType}</span>
                        </div>

                        {lead.notes && (
                          <p className="text-xs text-slate-500 italic mt-2 line-clamp-2">
                            {lead.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      className="shrink-0 h-9 w-9 p-0"
                      onClick={() => window.location.href = '/portal/sales/lead-center'}
                    >
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={() => window.location.href = '/portal/sales/lead-center'}
              >
                View All in Leads Center <ChevronRight size={14} className="ml-2" />
              </Button>
            </div>
          </>
        ) : (
          <div className="py-12 text-center">
            <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {icon}
            </div>
            <h4 className="text-base text-slate-800 font-bold mb-2">{emptyMessage}</h4>
            <p className="text-xs text-slate-500">All caught up! 🎉</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
