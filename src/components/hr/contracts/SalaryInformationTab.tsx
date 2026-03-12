// src/components/hr/contracts/SalaryInformationTab.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

interface SalaryData {
  baseSalary: number;
  salaryStructure: string;
  paymentSchedule: string;
  allowances: { name: string; amount: number }[];
  bonuses: { name: string; amount: number; frequency: string }[];
}

const inputClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const selectClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

interface SalaryInformationTabProps {
  baseSalary: number;
}

export function SalaryInformationTab({ baseSalary }: SalaryInformationTabProps) {
  const [data, setData] = useState<SalaryData>({
    baseSalary,
    salaryStructure: 'Regular Employee',
    paymentSchedule: 'Semi-Monthly',
    allowances: [
      { name: 'Transportation Allowance', amount: 2000 },
      { name: 'Meal Allowance', amount: 1500 },
      { name: 'Communication Allowance', amount: 1000 },
    ],
    bonuses: [
      { name: '13th Month Pay', amount: baseSalary, frequency: 'Annual' },
      { name: 'Performance Bonus', amount: 5000, frequency: 'Quarterly' },
    ],
  });

  const totalAllowances = data.allowances.reduce((s, a) => s + a.amount, 0);
  const totalMonthlyBonuses = data.bonuses.reduce((s, b) => {
    if (b.frequency === 'Monthly') return s + b.amount;
    if (b.frequency === 'Quarterly') return s + b.amount / 3;
    if (b.frequency === 'Annual') return s + b.amount / 12;
    return s;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Base Compensation */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Base Compensation</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Base Salary (Monthly)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
              <input
                type="text"
                className={`${inputClass} pl-7`}
                value={data.baseSalary.toLocaleString()}
                onChange={e => {
                  const val = Number(e.target.value.replace(/,/g, ''));
                  if (!isNaN(val)) setData(prev => ({ ...prev, baseSalary: val }));
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Salary Structure</label>
            <select className={selectClass} value={data.salaryStructure} onChange={e => setData(prev => ({ ...prev, salaryStructure: e.target.value }))}>
              <option>Regular Employee</option>
              <option>Managerial</option>
              <option>Supervisory</option>
              <option>Contractual</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Payment Schedule</label>
            <select className={selectClass} value={data.paymentSchedule} onChange={e => setData(prev => ({ ...prev, paymentSchedule: e.target.value }))}>
              <option>Semi-Monthly</option>
              <option>Monthly</option>
              <option>Weekly</option>
              <option>Bi-Weekly</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Allowances */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Allowances</h3>
          <Badge variant="info">Total: ₱{totalAllowances.toLocaleString()}/mo</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-xs font-bold text-muted-foreground uppercase">Allowance</th>
                <th className="text-right py-2 text-xs font-bold text-muted-foreground uppercase">Amount (Monthly)</th>
              </tr>
            </thead>
            <tbody>
              {data.allowances.map((a, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4">
                    <input
                      className={inputClass}
                      value={a.name}
                      onChange={e => {
                        const updated = [...data.allowances];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setData(prev => ({ ...prev, allowances: updated }));
                      }}
                    />
                  </td>
                  <td className="py-2.5">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                      <input
                        type="text"
                        className={`${inputClass} pl-7 text-right`}
                        value={a.amount.toLocaleString()}
                        onChange={e => {
                          const val = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(val)) {
                            const updated = [...data.allowances];
                            updated[i] = { ...updated[i], amount: val };
                            setData(prev => ({ ...prev, allowances: updated }));
                          }
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Bonuses */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Bonuses</h3>
          <Badge variant="success">≈ ₱{Math.round(totalMonthlyBonuses).toLocaleString()}/mo equiv.</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-xs font-bold text-muted-foreground uppercase">Bonus</th>
                <th className="text-right py-2 pr-4 text-xs font-bold text-muted-foreground uppercase">Amount</th>
                <th className="text-left py-2 text-xs font-bold text-muted-foreground uppercase">Frequency</th>
              </tr>
            </thead>
            <tbody>
              {data.bonuses.map((b, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="py-2.5 pr-4">
                    <input
                      className={inputClass}
                      value={b.name}
                      onChange={e => {
                        const updated = [...data.bonuses];
                        updated[i] = { ...updated[i], name: e.target.value };
                        setData(prev => ({ ...prev, bonuses: updated }));
                      }}
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                      <input
                        type="text"
                        className={`${inputClass} pl-7 text-right`}
                        value={b.amount.toLocaleString()}
                        onChange={e => {
                          const val = Number(e.target.value.replace(/,/g, ''));
                          if (!isNaN(val)) {
                            const updated = [...data.bonuses];
                            updated[i] = { ...updated[i], amount: val };
                            setData(prev => ({ ...prev, bonuses: updated }));
                          }
                        }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5">
                    <select
                      className={selectClass}
                      value={b.frequency}
                      onChange={e => {
                        const updated = [...data.bonuses];
                        updated[i] = { ...updated[i], frequency: e.target.value };
                        setData(prev => ({ ...prev, bonuses: updated }));
                      }}
                    >
                      <option>Monthly</option>
                      <option>Quarterly</option>
                      <option>Annual</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
