'use client';

import React, { useState, useMemo } from 'react';
import {
  Search, Eye, Pencil, ArrowLeft, CheckCircle2,
  Minus, FilePlus2, Building2, Users, ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';
import { SubscriptionDetail } from './SubscriptionDetail';
import { EWTDetail } from './EWTDetail';
import { CWTDetail } from './CWTDetail';
import { SalesBookDetail } from './SalesBookDetail';
import { ExpensesBookDetail } from './ExpensesBookDetail';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ComplianceRowStatus = 'Active' | 'Inactive';
type ClientStatusFilter = 'ALL' | 'Active' | 'Inactive' | 'Pending';

interface ComplianceRow {
  id: string;
  name: string;
  department: string;
  active: boolean;
  lastStatus: ComplianceRowStatus;
}

// ─── 13 Compliance definitions ─────────────────────────────────────────────────

const COMPLIANCE_DEFS = [
  { id: 'subscription',   name: 'Subscription Fee',                                  department: 'Admin',         vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 1 },
  { id: 'ewt',            name: 'Expanded Withholding Tax (EWT)',                     department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'cwt',            name: 'Compensation Withholding Tax (CWT)',                 department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'sales-book',     name: 'Sales Book',                                         department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'expense-book',   name: 'Expenses Book',                                      department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'percentage-tax', name: 'Percentage Tax',                                     department: 'BIR',           vatOnly: false, nonVatOnly: true,  secRequired: false, minLevel: 2 },
  { id: 'income-tax',     name: 'Income Tax',                                         department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 3 },
  { id: 'sss',            name: 'Social Security System',                             department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'phic',           name: 'Philippine Health Insurance Corp. (PhilHealth)',     department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'hdmf',           name: 'Home Development Mutual Fund (Pag-IBIG)',            department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'vat',            name: 'Value-Added Tax (VAT)',                              department: 'BIR',           vatOnly: true,  nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'gis',            name: 'General Information Sheet (GIS)',                    department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3 },
  { id: 'sec-afs',        name: 'SEC AFS Submission',                                 department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function isVatPlan(basePlan: string): boolean {
  if (basePlan === 'vip') return true;
  return basePlan.includes('vat') && !basePlan.includes('non-vat');
}

function getPlanLevel(basePlan: string): number {
  if (basePlan === 'vip') return 4;
  if (basePlan.includes('agila360')) return 3;
  if (basePlan.includes('essentials')) return 2;
  return 1;
}

function getWorkingPaperRows(client: MockClientWithCompliance, _year: number): ComplianceRow[] {
  const basePlan = client.planDetails?.basePlan ?? 'starter';
  const isVat = isVatPlan(basePlan);
  const planLevel = getPlanLevel(basePlan);

  const rows: ComplianceRow[] = COMPLIANCE_DEFS.map(def => {
    let active = planLevel >= def.minLevel;
    if (def.vatOnly && !isVat) active = false;
    if (def.nonVatOnly && isVat) active = false;
    if (def.secRequired && !client.isBusinessRegistered) active = false;

    return { id: def.id, name: def.name, department: def.department, active, lastStatus: active ? 'Active' : 'Inactive' };
  });

  return [...rows.filter(r => r.active), ...rows.filter(r => !r.active)];
}

// ─── Compliance status cell ────────────────────────────────────────────────────

function ComplianceStatusCell({ status }: { status: ComplianceRowStatus }): React.ReactElement {
  if (status === 'Active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
        <CheckCircle2 size={10} /> Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <Minus size={12} /> Inactive
    </span>
  );
}

// ─── Client status badge ───────────────────────────────────────────────────────

function ClientStatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
    Active:   'success',
    Pending:  'warning',
    Inactive: 'neutral',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{status}</Badge>;
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ClientCompliancesList(): React.ReactNode {
  const [clients, setClients] = useState<MockClientWithCompliance[]>(MOCK_COMPLIANCE_CLIENTS);
  const [view, setView] = useState<'list' | 'working-paper' | 'compliance-detail'>('list');
  const [selectedClient, setSelectedClient] = useState<MockClientWithCompliance | null>(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedComplianceId, setSelectedComplianceId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MockClientWithCompliance | null>(null);
  const [editStatus, setEditStatus] = useState('');

  // Open case modal
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const matchesSearch =
        c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [clients, searchTerm, statusFilter]
  );

  const activeCount   = clients.filter(c => c.status === 'Active').length;
  const pendingCount  = clients.filter(c => c.status === 'Pending').length;
  const inactiveCount = clients.filter(c => c.status === 'Inactive').length;

  function openEdit(client: MockClientWithCompliance) {
    setEditTarget(client);
    setEditStatus(client.status);
    setIsEditOpen(true);
  }

  function saveEdit() {
    if (!editTarget) return;
    setClients(prev => prev.map(c => c.id === editTarget.id ? { ...c, status: editStatus } : c));
    if (selectedClient?.id === editTarget.id) {
      setSelectedClient(prev => prev ? { ...prev, status: editStatus } : prev);
    }
    setIsEditOpen(false);
  }

  function openWorkingPaper(client: MockClientWithCompliance) {
    setSelectedClient(client);
    setView('working-paper');
  }

  const workingPaperRows = useMemo(
    () => selectedClient ? getWorkingPaperRows(selectedClient, selectedYear) : [],
    [selectedClient, selectedYear]
  );

  const activeRows   = workingPaperRows.filter(r => r.active);
  const inactiveRows = workingPaperRows.filter(r => !r.active);

  const YEAR_OPTIONS = [2024, 2025, 2026];

  // ── Compliance Detail View ─────────────────────────────────────────────────
  if (view === 'compliance-detail' && selectedClient) {
    if (selectedComplianceId === 'subscription') {
      return (
        <SubscriptionDetail
          client={selectedClient}
          year={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => setView('working-paper')}
        />
      );
    }

    if (selectedComplianceId === 'ewt') {
      return (
        <EWTDetail
          client={selectedClient}
          year={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => setView('working-paper')}
        />
      );
    }

    if (selectedComplianceId === 'cwt') {
      return (
        <CWTDetail
          client={selectedClient}
          year={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => setView('working-paper')}
        />
      );
    }

    if (selectedComplianceId === 'sales-book') {
      return (
        <SalesBookDetail
          client={selectedClient}
          year={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => setView('working-paper')}
        />
      );
    }

    if (selectedComplianceId === 'expense-book') {
      return (
        <ExpensesBookDetail
          client={selectedClient}
          year={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => setView('working-paper')}
        />
      );
    }

    // Placeholder for other compliance detail pages
    const complianceName = COMPLIANCE_DEFS.find(d => d.id === selectedComplianceId)?.name ?? selectedComplianceId;
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <button
          onClick={() => setView('working-paper')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Working Paper
        </button>
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-slate-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium mb-0.5">
                {selectedClient.businessName} ({selectedClient.clientNo})
              </p>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{complianceName}</h1>
            </div>
          </div>
        </Card>
        <Card className="p-16 text-center border-dashed border-slate-200">
          <p className="text-sm text-slate-400">Detail view for this compliance is coming soon.</p>
        </Card>
      </div>
    );
  }

  // ── Working Paper View ──────────────────────────────────────────────────────
  if (view === 'working-paper' && selectedClient) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">

        {/* Back */}
        <button
          onClick={() => setView('list')}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Clients
        </button>

        {/* Client header */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
                <Building2 size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">{selectedClient.businessName}</h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {selectedClient.clientNo} · {selectedClient.planDetails?.displayName ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <ClientStatusBadge status={selectedClient.status} />
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <button
                onClick={() => setIsOpenCaseOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <FilePlus2 size={15} /> File Open Case
              </button>
              <button
                onClick={() => openEdit(selectedClient)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
        </Card>

        {/* Compliance table */}
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Working Paper — {selectedYear} · {activeRows.length} active, {inactiveRows.length} inactive
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse" style={{ minWidth: '560px' }}>
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Compliance</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Department</th>
                  <th className="text-left px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map(row => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-100 hover:bg-emerald-50 transition-colors cursor-pointer group"
                    onClick={() => { setSelectedComplianceId(row.id); setView('compliance-detail'); }}
                  >
                    <td className="px-5 py-3.5 text-sm font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      <span className="flex items-center gap-1.5">
                        {row.name}
                        <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500 shrink-0" />
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        {row.department}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <ComplianceStatusCell status={row.lastStatus} />
                    </td>
                  </tr>
                ))}

                {/* Inactive section divider */}
                {inactiveRows.length > 0 && (
                  <tr>
                    <td colSpan={3} className="px-5 py-2 bg-slate-50 border-y border-slate-100">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        — Inactive / Not Applicable
                      </span>
                    </td>
                  </tr>
                )}

                {inactiveRows.map(row => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-5 py-3 text-sm text-slate-400">{row.name}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                        {row.department}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ComplianceStatusCell status={row.lastStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Open Case Modal */}
        <Modal
          isOpen={isOpenCaseOpen}
          onClose={() => setIsOpenCaseOpen(false)}
          title="File Open Case"
          size="lg"
        >
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-500">
              Filing a new open case for <strong className="text-slate-900">{selectedClient.businessName}</strong>.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Case Type</label>
                <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>BIR — Deficiency Tax</option>
                  <option>SEC — Late Filing</option>
                  <option>{"Mayor's Permit — Renewal"}</option>
                  <option>SSS / PhilHealth / Pag-IBIG — Arrears</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Priority</label>
                <select className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Notes</label>
              <textarea
                rows={3}
                placeholder="Describe the case..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsOpenCaseOpen(false)}>Cancel</Button>
              <button
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-95 transition-all"
                onClick={() => setIsOpenCaseOpen(false)}
              >
                File Case
              </button>
            </div>
          </div>
        </Modal>

        {/* Edit Status Modal (shared) */}
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={editTarget ? `Edit — ${editTarget.businessName}` : 'Edit Client'}
          size="md"
        >
          {editTarget && (
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Client Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <button
                  className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
                  onClick={saveEdit}
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ── List View ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Client Compliances</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor and manage client regulatory compliance status.</p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            size={16}
          />
          <Input
            className="pl-10 h-10 bg-white border-slate-200 rounded-xl"
            placeholder="Search by client name or number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white overflow-hidden text-sm font-semibold shrink-0">
          {(['ALL', 'Active', 'Inactive', 'Pending'] as ClientStatusFilter[]).map((s, i) => {
            const count =
              s === 'ALL' ? clients.length :
              s === 'Active' ? activeCount :
              s === 'Inactive' ? inactiveCount : pendingCount;
            const activeStyle =
              s === 'Active'   ? 'bg-emerald-600 text-white' :
              s === 'Inactive' ? 'bg-slate-600 text-white' :
              s === 'Pending'  ? 'bg-amber-500 text-white' :
              'bg-slate-800 text-white';
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2.5 transition-colors ${i > 0 ? 'border-l border-slate-200' : ''} ${
                  statusFilter === s ? activeStyle : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'ALL' ? 'All' : s}
                <span className={`ml-1.5 text-[10px] font-black ${statusFilter === s ? 'opacity-80' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Client #</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Client Name</th>
                <th className="text-left px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                <th className="text-right px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <Users size={28} className="text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">
                      {searchTerm ? 'No clients match your search.' : 'No clients found.'}
                    </p>
                  </td>
                </tr>
              ) : filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {client.clientNo}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-slate-900">{client.businessName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{client.planDetails?.displayName ?? '—'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 text-xs h-auto"
                        onClick={() => openWorkingPaper(client)}
                      >
                        <Eye size={13} className="mr-1.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        className="text-slate-600 border-slate-200 hover:bg-slate-50 px-3 py-1.5 text-xs h-auto"
                        onClick={() => openEdit(client)}
                      >
                        <Pencil size={13} className="mr-1.5" /> Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Status Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={editTarget ? `Edit — ${editTarget.businessName}` : 'Edit Client'}
        size="md"
      >
        {editTarget && (
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">Client Status</label>
              <select
                value={editStatus}
                onChange={e => setEditStatus(e.target.value)}
                className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <button
                className="flex-1 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 active:scale-95 transition-all"
                onClick={saveEdit}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
