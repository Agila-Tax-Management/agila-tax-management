'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';
import { Modal } from '@/components/UI/Modal';
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip,
  AreaChart, Area, CartesianGrid,
} from 'recharts';
import {
  TrendingUp, Wallet, DollarSign,
  ArrowUpRight, Download, PieChart as PieChartIcon,
  Activity, ChevronRight, Sparkles, Target, BarChart3, Users,
} from 'lucide-react';

type FilterType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ReportData {
  totalSales: number;
  totalCommission: number;
  netSales: number;
  activeRetainers: number;
  averageCommissionRate: number;
  trend: string;
  chartData: Array<{ name: string; sales: number }>;
}

interface BenchmarkData {
  yourPerformance: {
    conversionRate: number;
    salesVelocity: string;
    clientRetention: number;
    responseTime: string;
    dealCloseRate: number;
    avgDealSize: number;
    leadFollowUp: string;
  };
  companyAverage: {
    conversionRate: number;
    salesVelocity: string;
    clientRetention: number;
    responseTime: string;
    dealCloseRate: number;
    avgDealSize: number;
    leadFollowUp: string;
  };
  industryStandards: {
    topPerformer: string;
    average: string;
    belowAverage: string;
  };
}

const MOCK_DATA: Record<FilterType, ReportData> = {
  daily: {
    totalSales: 45000,
    totalCommission: 4500,
    netSales: 40500,
    activeRetainers: 142,
    averageCommissionRate: 10,
    trend: '+12%',
    chartData: [
      { name: '08:00', sales: 5200 },
      { name: '10:00', sales: 7800 },
      { name: '12:00', sales: 9400 },
      { name: '14:00', sales: 8900 },
      { name: '16:00', sales: 7600 },
      { name: '18:00', sales: 6100 },
    ],
  },
  weekly: {
    totalSales: 285000,
    totalCommission: 28500,
    netSales: 256500,
    activeRetainers: 142,
    averageCommissionRate: 10,
    trend: '+8%',
    chartData: [
      { name: 'Mon', sales: 35000 },
      { name: 'Tue', sales: 42000 },
      { name: 'Wed', sales: 48000 },
      { name: 'Thu', sales: 52000 },
      { name: 'Fri', sales: 58000 },
      { name: 'Sat', sales: 32000 },
      { name: 'Sun', sales: 18000 },
    ],
  },
  monthly: {
    totalSales: 1200000,
    totalCommission: 120000,
    netSales: 1080000,
    activeRetainers: 142,
    averageCommissionRate: 10,
    trend: '+15%',
    chartData: [
      { name: 'Week 1', sales: 280000 },
      { name: 'Week 2', sales: 320000 },
      { name: 'Week 3', sales: 290000 },
      { name: 'Week 4', sales: 310000 },
    ],
  },
  yearly: {
    totalSales: 15800000,
    totalCommission: 1580000,
    netSales: 14220000,
    activeRetainers: 142,
    averageCommissionRate: 10,
    trend: '+22%',
    chartData: [
      { name: 'Jan', sales: 1100000 },
      { name: 'Feb', sales: 1250000 },
      { name: 'Mar', sales: 1180000 },
      { name: 'Apr', sales: 1320000 },
      { name: 'May', sales: 1450000 },
      { name: 'Jun', sales: 1380000 },
      { name: 'Jul', sales: 1290000 },
      { name: 'Aug', sales: 1410000 },
      { name: 'Sep', sales: 1520000 },
      { name: 'Oct', sales: 1480000 },
      { name: 'Nov', sales: 1610000 },
      { name: 'Dec', sales: 1750000 },
    ],
  },
};

const MOCK_BENCHMARK_DATA: BenchmarkData = {
  yourPerformance: {
    conversionRate: 24.8,
    salesVelocity: '₱285K/week',
    clientRetention: 94,
    responseTime: '2.4 hours',
    dealCloseRate: 68,
    avgDealSize: 42000,
    leadFollowUp: '3.2 days',
  },
  companyAverage: {
    conversionRate: 10.6,
    salesVelocity: '₱180K/week',
    clientRetention: 78,
    responseTime: '4.2 hours',
    dealCloseRate: 52,
    avgDealSize: 38500,
    leadFollowUp: '5.8 days',
  },
  industryStandards: {
    topPerformer: '35%+',
    average: '18-22%',
    belowAverage: '<15%',
  },
};

export const Reports: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('weekly');
  const [reportData, setReportData] = useState<ReportData>(MOCK_DATA.weekly);
  const [benchmarkData] = useState<BenchmarkData>(MOCK_BENCHMARK_DATA);
  const [isBenchmarkModalOpen, setIsBenchmarkModalOpen] = useState(false);

  const getCurrentWeek = () => {
    const now = new Date();
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  };

  const [dailyValue, setDailyValue] = useState(() => new Date().toISOString().split('T')[0]);
  const [weeklyValue, setWeeklyValue] = useState(getCurrentWeek);
  const [monthlyValue, setMonthlyValue] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [yearlyValue, setYearlyValue] = useState(() => String(new Date().getFullYear()));

  useEffect(() => {
    setReportData(MOCK_DATA[filter]);
  }, [filter]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(val);

  const calculatePerformanceDiff = (yours: number, avg: number): string => {
    const diff = ((yours - avg) / avg) * 100;
    return diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
  };

  const isPerformanceBetter = (yours: number | string, avg: number | string, lowerIsBetter = false): boolean => {
    const yoursNum = typeof yours === 'string' ? parseFloat(yours.replace(/[^0-9.]/g, '')) : yours;
    const avgNum = typeof avg === 'string' ? parseFloat(avg.replace(/[^0-9.]/g, '')) : avg;
    return lowerIsBetter ? yoursNum < avgNum : yoursNum > avgNum;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Sales Reports</h2>
          <p className="text-sm text-slate-500 font-medium">Real-time performance analytics and financial tracking.</p>
        </div>

        <div className="flex items-center gap-2">
          {(() => {
            const inputCls =
              'h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#25238e]';
            const yearOptions = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));
            return (
              <>
                <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} className={inputCls}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
                {filter === 'daily' && (
                  <input type="date" value={dailyValue} onChange={e => setDailyValue(e.target.value)} className={inputCls} />
                )}
                {filter === 'weekly' && (
                  <input type="week" value={weeklyValue} onChange={e => setWeeklyValue(e.target.value)} className={inputCls} />
                )}
                {filter === 'monthly' && (
                  <input type="month" value={monthlyValue} onChange={e => setMonthlyValue(e.target.value)} className={inputCls} />
                )}
                {filter === 'yearly' && (
                  <select value={yearlyValue} onChange={e => setYearlyValue(e.target.value)} className={inputCls}>
                    {yearOptions.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Data Source Indicator */}
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-bold">
        <Activity size={14} />
        Displaying mock data — connect database to see real analytics
      </div>

      {/* Main Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <TrendingUp size={80} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
              <DollarSign size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Sales</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
              {formatCurrency(reportData.totalSales)}
            </h3>
            <Badge variant="success" className="text-[10px] font-bold">
              {reportData.trend} vs last period
            </Badge>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Wallet size={80} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
              <Wallet size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Commission</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
              {formatCurrency(reportData.totalCommission)}
            </h3>
            <p className="text-xs text-slate-500 font-bold">{reportData.averageCommissionRate}% avg rate</p>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Sparkles size={80} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
              <Sparkles size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Net Sales</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
              {formatCurrency(reportData.netSales)}
            </h3>
            <p className="text-xs text-slate-500 font-bold">After commissions</p>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Activity size={80} />
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-4">
              <Activity size={20} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Retainers</p>
            <h3 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">
              {reportData.activeRetainers}
            </h3>
            <p className="text-xs text-slate-500 font-bold">Recurring clients</p>
          </div>
        </Card>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border-none shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-800">Revenue Trend</h3>
              <p className="text-xs text-slate-500 mt-1">Sales performance over {filter} period</p>
            </div>
            <Button variant="ghost" className="text-xs font-bold">
              <Download size={14} className="mr-2" /> Export
            </Button>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reportData.chartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#25238e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#25238e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  stroke="#94a3b8"
                  tickFormatter={(val: number) => `₱${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(val: any) => {
                    const num = Number(val);
                    return [`₱${num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`, 'Sales'];
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#25238e" strokeWidth={3} fill="url(#salesGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right Sidebar Stats */}
        <div className="space-y-6">
          <Card className="p-6 border-none shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest">Performance Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-bold text-slate-600">Best Day</span>
                <span className="text-sm font-black text-slate-900">
                  {reportData.chartData.reduce((max, item) => (item.sales > max.sales ? item : max)).name}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-bold text-slate-600">Avg per Period</span>
                <span className="text-sm font-black text-slate-900">
                  {formatCurrency(reportData.chartData.reduce((sum, item) => sum + item.sales, 0) / reportData.chartData.length)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="text-xs font-bold text-slate-600">Peak Sales</span>
                <span className="text-sm font-black text-emerald-600">
                  {formatCurrency(Math.max(...reportData.chartData.map(item => item.sales)))}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-none shadow-sm bg-slate-900 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/10 rounded-lg">
                <PieChartIcon size={18} className="text-[#4743af]" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest">Quick Audit</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Your conversion rate is{' '}
              <span className="text-white font-bold">
                {calculatePerformanceDiff(benchmarkData.yourPerformance.conversionRate, benchmarkData.companyAverage.conversionRate)} higher
              </span>{' '}
              than the company average for this period.
            </p>
            <Button
              variant="ghost"
              className="w-full mt-4 text-[#4743af] hover:text-[#25238e] hover:bg-white/5 text-[10px] font-black uppercase tracking-widest p-0 h-auto justify-start"
              onClick={() => setIsBenchmarkModalOpen(true)}
            >
              View Benchmarks <ChevronRight size={12} className="ml-1" />
            </Button>
          </Card>
        </div>
      </div>

      {/* Benchmark Modal */}
      <Modal
        isOpen={isBenchmarkModalOpen}
        onClose={() => setIsBenchmarkModalOpen(false)}
        title="Performance Benchmarks"
        size="lg"
      >
        <div className="p-6 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <Card className="p-8 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-600" />
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Your Performance</p>
              </div>
              <h3 className="text-4xl font-black text-blue-600 mb-2">
                {benchmarkData.yourPerformance.conversionRate}%
              </h3>
              <p className="text-xs text-blue-600 font-bold">Conversion Rate</p>
            </Card>

            <Card className="p-8 bg-slate-50 border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-slate-600" />
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Company Average</p>
              </div>
              <h3 className="text-4xl font-black text-slate-600 mb-2">
                {benchmarkData.companyAverage.conversionRate}%
              </h3>
              <p className="text-xs text-slate-600 font-bold">Conversion Rate</p>
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="text-base font-black text-slate-800 uppercase tracking-wide mb-4">Detailed Metrics Comparison</h4>

            {[
              { metric: 'Sales Velocity', you: benchmarkData.yourPerformance.salesVelocity, average: benchmarkData.companyAverage.salesVelocity, lowerIsBetter: false },
              { metric: 'Client Retention', you: `${benchmarkData.yourPerformance.clientRetention}%`, average: `${benchmarkData.companyAverage.clientRetention}%`, lowerIsBetter: false },
              { metric: 'Response Time', you: benchmarkData.yourPerformance.responseTime, average: benchmarkData.companyAverage.responseTime, lowerIsBetter: true },
              { metric: 'Deal Close Rate', you: `${benchmarkData.yourPerformance.dealCloseRate}%`, average: `${benchmarkData.companyAverage.dealCloseRate}%`, lowerIsBetter: false },
              { metric: 'Avg Deal Size', you: formatCurrency(benchmarkData.yourPerformance.avgDealSize), average: formatCurrency(benchmarkData.companyAverage.avgDealSize), lowerIsBetter: false },
              { metric: 'Lead Follow-up', you: benchmarkData.yourPerformance.leadFollowUp, average: benchmarkData.companyAverage.leadFollowUp, lowerIsBetter: true },
            ].map((item, index) => {
              const isBetter = isPerformanceBetter(item.you, item.average, item.lowerIsBetter);
              return (
                <div key={index} className="flex items-center justify-between p-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div>
                    <p className="text-sm font-bold text-slate-800 mb-2">{item.metric}</p>
                    <div className="flex items-center gap-6">
                      <span className="text-xs text-slate-500">You: <span className="font-black text-blue-600">{item.you}</span></span>
                      <span className="text-xs text-slate-500">Avg: <span className="font-bold text-slate-600">{item.average}</span></span>
                    </div>
                  </div>
                  {isBetter ? (
                    <Badge variant="success" className="text-[10px] font-bold px-3 py-1">
                      <ArrowUpRight size={12} className="mr-1" /> Above Average
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="text-[10px] font-bold px-3 py-1">
                      Below Average
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>

          <Card className="p-8 bg-linear-to-br from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <h4 className="text-base font-black text-purple-800 uppercase tracking-wide">Industry Standards</h4>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Top Performer</p>
                <p className="text-3xl font-black text-purple-600">{benchmarkData.industryStandards.topPerformer}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-2">Average</p>
                <p className="text-3xl font-black text-blue-600">{benchmarkData.industryStandards.average}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Below Average</p>
                <p className="text-3xl font-black text-slate-600">{benchmarkData.industryStandards.belowAverage}</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4 pt-6 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-xl font-bold"
              onClick={() => setIsBenchmarkModalOpen(false)}
            >
              Close
            </Button>
            <Button
              className="flex-1 h-12 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 font-bold shadow-lg"
              onClick={() => {
                setIsBenchmarkModalOpen(false);
                alert('Generating detailed performance report...');
              }}
            >
              <Download size={14} className="mr-2" /> Export Full Report
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
