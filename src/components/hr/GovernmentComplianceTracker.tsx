'use client';

import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, Landmark, AlertTriangle, CheckCircle2, Clock, FileWarning } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  GOV_COMPLIANCE_RECORDS, GovComplianceRecord, GovComplianceStatus, GovComplianceType,
} from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<GovComplianceStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  Compliant: 'success',
  Pending: 'warning',
  Overdue: 'danger',
  Submitted: 'info',
};

const TYPE_COLORS: Record<GovComplianceType, string> = {
  SSS: 'bg-blue-100 text-blue-700',
  PhilHealth: 'bg-emerald-100 text-emerald-700',
  'Pag-IBIG': 'bg-amber-100 text-amber-700',
  BIR: 'bg-red-100 text-red-700',
  DOLE: 'bg-violet-100 text-violet-700',
};

export function GovernmentComplianceTracker() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedRecord, setSelectedRecord] = useState<GovComplianceRecord | null>(null);

  const filtered = useMemo(() => {
    return GOV_COMPLIANCE_RECORDS.filter(rec => {
      const matchSearch = rec.description.toLowerCase().includes(search.toLowerCase()) ||
        rec.type.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
      const matchType = typeFilter === 'All' || rec.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [search, statusFilter, typeFilter]);

  const compliantCount = GOV_COMPLIANCE_RECORDS.filter(g => g.status === 'Compliant').length;
  const pendingCount = GOV_COMPLIANCE_RECORDS.filter(g => g.status === 'Pending').length;
  const overdueCount = GOV_COMPLIANCE_RECORDS.filter(g => g.status === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Government Compliance Tracker</h1>
        <p className="text-sm text-slate-500 mt-1">Track SSS, PhilHealth, Pag-IBIG, BIR & DOLE filings</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Filings', value: GOV_COMPLIANCE_RECORDS.length, icon: Landmark, color: 'text-slate-600 bg-slate-50' },
          { label: 'Compliant', value: compliantCount, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending', value: pendingCount, icon: Clock, color: 'text-amber-600 bg-amber-50' },
          { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'text-red-600 bg-red-50' },
        ].map(stat => (
          <Card key={stat.label} className="p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${stat.color}`}>
              <stat.icon size={16} />
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-400 uppercase font-bold">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <FileWarning size={20} className="text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Overdue Filings Detected</p>
            <p className="text-xs text-red-600 mt-0.5">
              {overdueCount} filing(s) past the deadline. Penalties may apply. Please address immediately.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description or agency..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Landmark size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
              >
                <option value="All">All Agencies</option>
                <option value="SSS">SSS</option>
                <option value="PhilHealth">PhilHealth</option>
                <option value="Pag-IBIG">Pag-IBIG</option>
                <option value="BIR">BIR</option>
                <option value="DOLE">DOLE</option>
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
                <option value="Compliant">Compliant</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
                <option value="Submitted">Submitted</option>
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
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Agency</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Description</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Deadline</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Filed Date</th>
                <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(rec => (
                <tr key={rec.id} className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors ${rec.status === 'Overdue' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2.5 py-1.5 rounded-lg ${TYPE_COLORS[rec.type]}`}>
                      {rec.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-xs truncate">{rec.description}</td>
                  <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">{rec.deadline}</td>
                  <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">{rec.filedDate || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[rec.status]}>{rec.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" onClick={() => setSelectedRecord(rec)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">No compliance records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Compliance Filing Details" size="md">
        {selectedRecord && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-4rem)]">
            <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl">
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold px-3 py-2 rounded-lg ${TYPE_COLORS[selectedRecord.type]}`}>
                  {selectedRecord.type}
                </span>
                <div>
                  <h3 className="font-black text-slate-900">{selectedRecord.description}</h3>
                </div>
              </div>
              <Badge variant={STATUS_VARIANT[selectedRecord.status]}>{selectedRecord.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Deadline', value: selectedRecord.deadline },
                { label: 'Affected Employees', value: selectedRecord.affectedEmployees.toString() },
                { label: 'Filed Date', value: selectedRecord.filedDate || 'Not yet filed' },
                { label: 'Reference No.', value: selectedRecord.referenceNo || '—' },
              ].map(f => (
                <div key={f.label}>
                  <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{f.label}</p>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">{f.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Notes</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{selectedRecord.notes}</p>
            </div>

            {(selectedRecord.status === 'Pending' || selectedRecord.status === 'Overdue') && (
              <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white gap-2">
                <CheckCircle2 size={16} /> Mark as Filed
              </Button>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
