'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Wallet, FileCheck, Play, CheckCircle, PauseCircle, RotateCcw } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  PAYROLL_RECORDS, PayrollRecord, PayrollStatus,
} from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<PayrollStatus, 'neutral' | 'info' | 'success' | 'warning'> = {
  Draft: 'neutral',
  Processing: 'info',
  Completed: 'success',
  'On Hold': 'warning',
};

export function PayrollCoordination() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [periodFilter, setPeriodFilter] = useState<string>('All');
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [records, setRecords] = useState(PAYROLL_RECORDS);

  const periods = [...new Set(records.map(p => p.payPeriod))];

  const filtered = useMemo(() => {
    return records.filter(rec => {
      const matchSearch = rec.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        rec.department.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
      const matchPeriod = periodFilter === 'All' || rec.payPeriod === periodFilter;
      return matchSearch && matchStatus && matchPeriod;
    });
  }, [search, statusFilter, periodFilter, records]);

  const totalNetPay = filtered.reduce((sum, p) => sum + p.netPay, 0);
  const totalBasic = filtered.reduce((sum, p) => sum + p.basicPay, 0);
  const totalDeductions = filtered.reduce((sum, p) => sum + p.sssContribution + p.philHealthContribution + p.pagIbigContribution + p.withholdingTax + p.deductions, 0);
  const completedCount = records.filter(p => p.status === 'Completed').length;

  const updateStatus = (id: string, newStatus: PayrollStatus) => {
    setRecords(prev => prev.map(r =>
      r.id === id
        ? { ...r, status: newStatus, processedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : r.processedDate }
        : r
    ));
    setSelectedPayroll(prev =>
      prev?.id === id
        ? { ...prev, status: newStatus, processedDate: newStatus === 'Completed' ? new Date().toISOString().split('T')[0] : prev.processedDate }
        : prev
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Payroll Coordination</h1>
        <p className="text-sm text-slate-500 mt-1">Manage payroll processing & employee compensation</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Net Pay', value: `₱${totalNetPay.toLocaleString()}`, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Total Basic Pay', value: `₱${totalBasic.toLocaleString()}`, color: 'text-blue-600 bg-blue-50' },
          { label: 'Total Deductions', value: `₱${totalDeductions.toLocaleString()}`, color: 'text-red-600 bg-red-50' },
          { label: 'Completed', value: `${completedCount}/${PAYROLL_RECORDS.length}`, color: 'text-rose-600 bg-rose-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-4">
            <p className={`text-lg font-black ${stat.color.split(' ')[0]}`}>{stat.value}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">{stat.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or department..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Wallet size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={periodFilter}
                onChange={e => setPeriodFilter(e.target.value)}
              >
                <option value="All">All Periods</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Processing">Processing</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Period</th>
                <th className="text-right px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Basic</th>
                <th className="text-right px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Deductions</th>
                <th className="text-right px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Net Pay</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => {
                const totalDed = rec.sssContribution + rec.philHealthContribution + rec.pagIbigContribution + rec.withholdingTax + rec.deductions;
                return (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900">{rec.employeeName}</p>
                      <p className="text-[11px] text-slate-400">{rec.department}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden md:table-cell">{rec.payPeriod}</td>
                    <td className="px-4 py-3 text-right text-slate-700 hidden sm:table-cell">₱{rec.basicPay.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-red-500 hidden lg:table-cell">₱{totalDed.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">₱{rec.netPay.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[rec.status]}>{rec.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {rec.status === 'Draft' && (
                          <Button variant="ghost" onClick={() => updateStatus(rec.id, 'Processing')} title="Start Processing">
                            <Play size={15} className="text-blue-600" />
                          </Button>
                        )}
                        {rec.status === 'Processing' && (
                          <Button variant="ghost" onClick={() => updateStatus(rec.id, 'Completed')} title="Mark Completed">
                            <CheckCircle size={15} className="text-emerald-600" />
                          </Button>
                        )}
                        {rec.status === 'On Hold' && (
                          <Button variant="ghost" onClick={() => updateStatus(rec.id, 'Processing')} title="Resume Processing">
                            <RotateCcw size={15} className="text-blue-600" />
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => setSelectedPayroll(rec)}>
                          <Eye size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">No payroll records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedPayroll} onClose={() => setSelectedPayroll(null)} title="Payroll Details" size="md">
        {selectedPayroll && (() => {
          const totalDed = selectedPayroll.sssContribution + selectedPayroll.philHealthContribution + selectedPayroll.pagIbigContribution + selectedPayroll.withholdingTax + selectedPayroll.deductions;
          const grossPay = selectedPayroll.basicPay + selectedPayroll.overtime + selectedPayroll.allowances;
          return (
            <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
              <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedPayroll.employeeName}</h3>
                  <p className="text-sm text-slate-500">{selectedPayroll.department} • {selectedPayroll.payPeriod}</p>
                </div>
                <Badge variant={STATUS_VARIANT[selectedPayroll.status]}>{selectedPayroll.status}</Badge>
              </div>

              {/* Earnings */}
              <div>
                <p className="text-[10px] text-emerald-600 uppercase font-bold tracking-wider mb-2">Earnings</p>
                <div className="space-y-2">
                  {[
                    { label: 'Basic Pay', value: selectedPayroll.basicPay },
                    { label: 'Overtime', value: selectedPayroll.overtime },
                    { label: 'Allowances', value: selectedPayroll.allowances },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-slate-700">₱{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2 font-bold">
                    <span className="text-slate-900">Gross Pay</span>
                    <span className="text-emerald-600">₱{grossPay.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <p className="text-[10px] text-red-600 uppercase font-bold tracking-wider mb-2">Deductions</p>
                <div className="space-y-2">
                  {[
                    { label: 'SSS Contribution', value: selectedPayroll.sssContribution },
                    { label: 'PhilHealth Contribution', value: selectedPayroll.philHealthContribution },
                    { label: 'Pag-IBIG Contribution', value: selectedPayroll.pagIbigContribution },
                    { label: 'Withholding Tax', value: selectedPayroll.withholdingTax },
                    { label: 'Other Deductions', value: selectedPayroll.deductions },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{item.label}</span>
                      <span className="font-semibold text-red-500">₱{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2 font-bold">
                    <span className="text-slate-900">Total Deductions</span>
                    <span className="text-red-600">₱{totalDed.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="p-4 bg-slate-900 rounded-xl text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Net Pay</p>
                <p className="text-2xl font-black text-white mt-1">₱{selectedPayroll.netPay.toLocaleString()}</p>
              </div>

              {selectedPayroll.processedDate && (
                <p className="text-xs text-slate-400 text-center">
                  <FileCheck size={12} className="inline mr-1" />
                  Processed on {selectedPayroll.processedDate}
                </p>
              )}

              {/* Processing Flow Actions */}
              {selectedPayroll.status !== 'Completed' && (
                <div className="flex gap-3 pt-2">
                  {selectedPayroll.status === 'Draft' && (
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => updateStatus(selectedPayroll.id, 'Processing')}>
                      <Play size={16} /> Start Processing
                    </Button>
                  )}
                  {selectedPayroll.status === 'Processing' && (
                    <>
                      <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={() => updateStatus(selectedPayroll.id, 'Completed')}>
                        <CheckCircle size={16} /> Mark Completed
                      </Button>
                      <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white gap-2" onClick={() => updateStatus(selectedPayroll.id, 'On Hold')}>
                        <PauseCircle size={16} /> Put On Hold
                      </Button>
                    </>
                  )}
                  {selectedPayroll.status === 'On Hold' && (
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => updateStatus(selectedPayroll.id, 'Processing')}>
                      <RotateCcw size={16} /> Resume Processing
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
