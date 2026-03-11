'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { ArrowLeft, DollarSign, TrendingUp, Calendar, Award } from 'lucide-react';
import { useRouter } from 'next/navigation';

const compensationData = {
  employee: { name: 'Genesis Esdrilon', id: 'EMP-10002', department: 'IT Operations', position: 'Jr. Website Developer' },
  monthly: 16000,
  dailyRate: 735.63,
  hourlyRate: 91.95,
  allowances: [
    { label: 'Rice Allowance', amount: 2000 },
    { label: 'Transportation', amount: 1500 },
    { label: 'Communication', amount: 500 },
  ],
  deductions: [
    { label: 'SSS', amount: 800 },
    { label: 'PhilHealth', amount: 400 },
    { label: 'Pag-IBIG', amount: 200 },
    { label: 'Tax', amount: 0 },
  ],
};

export default function CompensationPage() {
  const router = useRouter();
  const { employee, monthly, dailyRate, hourlyRate, allowances, deductions } = compensationData;
  const totalAllowances = allowances.reduce((s, a) => s + a.amount, 0);
  const totalDeductions = deductions.reduce((s, d) => s + d.amount, 0);
  const grossPay = monthly + totalAllowances;
  const netPay = grossPay - totalDeductions;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-350 mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <Button variant="ghost" onClick={() => router.back()} className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Compensation Details</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{employee.id} — {employee.position}</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Rate', value: `₱${monthly.toLocaleString()}`, icon: <DollarSign size={18} />, bg: 'bg-blue-50', color: 'text-blue-600' },
          { label: 'Daily Rate', value: `₱${dailyRate.toFixed(2)}`, icon: <Calendar size={18} />, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Hourly Rate', value: `₱${hourlyRate.toFixed(2)}`, icon: <TrendingUp size={18} />, bg: 'bg-amber-50', color: 'text-amber-600' },
          { label: 'Net Pay', value: `₱${netPay.toLocaleString()}`, icon: <Award size={18} />, bg: 'bg-violet-50', color: 'text-violet-600' },
        ].map(c => (
          <Card key={c.label} className="p-4 border-none shadow-sm bg-white rounded-2xl flex items-center gap-4">
            <div className={`w-10 h-10 ${c.bg} ${c.color} rounded-xl flex items-center justify-center shrink-0`}>{c.icon}</div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Allowances */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="bg-emerald-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Allowances</h2>
          </div>
          <div className="p-6 space-y-3">
            {allowances.map(a => (
              <div key={a.label} className="flex justify-between items-center">
                <span className="text-sm text-slate-700">{a.label}</span>
                <Badge className="bg-emerald-100 text-emerald-700 font-bold text-xs px-3 py-1 rounded-lg">₱{a.amount.toLocaleString()}</Badge>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Allowances</span>
              <span className="font-black text-emerald-600">₱{totalAllowances.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Deductions */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <div className="bg-rose-50/50 px-6 py-4 border-b border-slate-100">
            <h2 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Deductions</h2>
          </div>
          <div className="p-6 space-y-3">
            {deductions.map(d => (
              <div key={d.label} className="flex justify-between items-center">
                <span className="text-sm text-slate-700">{d.label}</span>
                <Badge className="bg-rose-100 text-rose-700 font-bold text-xs px-3 py-1 rounded-lg">₱{d.amount.toLocaleString()}</Badge>
              </div>
            ))}
            <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-900">Total Deductions</span>
              <span className="font-black text-rose-600">₱{totalDeductions.toLocaleString()}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Net Pay Card */}
      <Card className="bg-slate-900 text-white border-none shadow-sm rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimated Net Pay (Semi-Monthly)</p>
            <p className="text-3xl font-black">₱{netPay.toLocaleString()}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-xs text-slate-400">Gross: ₱{grossPay.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Deductions: ₱{totalDeductions.toLocaleString()}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
