// src/app/(portal)/portal/compliance/client-compliances/[clientId]/components/WorkingPaper.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Pencil, FilePlus2, Building2, CheckCircle2,
  Minus, ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// ─── Compliance definitions (same as ClientCompliancesList) ───────────────────

const COMPLIANCE_DEFS = [
  { id: 'subscription',   name: 'Subscription Fee',                              slug: 'subscription-fee',               department: 'Admin',         vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 1 },
  { id: 'ewt',            name: 'Expanded Withholding Tax (EWT)',                 slug: 'expanded-withholding-tax',        department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'cwt',            name: 'Compensation Withholding Tax (CWT)',             slug: 'compensation-withholding-tax',    department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'sales-book',     name: 'Sales Book',                                     slug: 'sales-book',                      department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'expense-book',   name: 'Expenses Book',                                  slug: 'expenses-book',                   department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'percentage-tax', name: 'Percentage Tax',                                 slug: 'percentage-tax',                  department: 'BIR',           vatOnly: false, nonVatOnly: true,  secRequired: false, minLevel: 2 },
  { id: 'income-tax',     name: 'Income Tax',                                     slug: 'income-tax',                      department: 'BIR',           vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 3 },
  { id: 'sss',            name: 'Social Security System',                         slug: 'sss',                             department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'phic',           name: 'Philippine Health Insurance Corp. (PhilHealth)', slug: 'philhealth',                      department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'hdmf',           name: 'Home Development Mutual Fund (Pag-IBIG)',        slug: 'pagibig',                         department: 'Gov. Benefits', vatOnly: false, nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'vat',            name: 'Value-Added Tax (VAT)',                          slug: 'vat',                             department: 'BIR',           vatOnly: true,  nonVatOnly: false, secRequired: false, minLevel: 2 },
  { id: 'gis',            name: 'General Information Sheet (GIS)',                slug: 'gis',                             department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3 },
  { id: 'sec-afs',        name: 'SEC AFS Submission',                             slug: 'sec-afs',                         department: 'SEC',           vatOnly: false, nonVatOnly: false, secRequired: true,  minLevel: 3 },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

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

interface ComplianceRow {
  id: string;
  slug: string;
  name: string;
  department: string;
  active: boolean;
}

function getWorkingPaperRows(client: MockClientWithCompliance): ComplianceRow[] {
  const basePlan = client.planDetails?.basePlan ?? 'starter';
  const isVat = isVatPlan(basePlan);
  const planLevel = getPlanLevel(basePlan);

  const rows = COMPLIANCE_DEFS.map(def => {
    let active = planLevel >= def.minLevel;
    if (def.vatOnly && !isVat) active = false;
    if (def.nonVatOnly && isVat) active = false;
    if (def.secRequired && !client.isBusinessRegistered) active = false;
    return { id: def.id, slug: def.slug, name: def.name, department: def.department, active };
  });

  return [...rows.filter(r => r.active), ...rows.filter(r => !r.active)];
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ComplianceStatusCell({ active }: { active: boolean }): React.ReactElement {
  if (active) {
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

function ClientStatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, 'success' | 'warning' | 'neutral'> = {
    Active: 'success', Pending: 'warning', Inactive: 'neutral',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{status}</Badge>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface WorkingPaperProps {
  clientId: string;
  yearParam: string | undefined;
}

// ─── Component ────────────────────────────────────────────────────────────────

const YEAR_OPTIONS = [2024, 2025, 2026];

export function WorkingPaper({ clientId, yearParam }: WorkingPaperProps): React.ReactNode {
  const router = useRouter();

  const client = MOCK_COMPLIANCE_CLIENTS.find(c => c.id === clientId) ?? null;

  const initialYear = yearParam ? parseInt(yearParam, 10) : 2026;
  const [selectedYear, setSelectedYear] = useState(
    YEAR_OPTIONS.includes(initialYear) ? initialYear : 2026,
  );

  // Edit state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState(client?.status ?? '');
  const [localStatus, setLocalStatus] = useState(client?.status ?? '');

  // Open case modal
  const [isOpenCaseOpen, setIsOpenCaseOpen] = useState(false);

  const rows = useMemo(
    () => (client ? getWorkingPaperRows(client) : []),
    [client],
  );
  const activeRows   = rows.filter(r => r.active);
  const inactiveRows = rows.filter(r => !r.active);

  function handleYearChange(y: number) {
    setSelectedYear(y);
    router.replace(
      `/portal/compliance/client-compliances/${clientId}?year=${y}`,
      { scroll: false },
    );
  }

  function saveEdit() {
    setLocalStatus(editStatus);
    setIsEditOpen(false);
  }

  function openComplianceDetail(row: ComplianceRow) {
    if (!row.active) return;
    router.push(
      `/portal/compliance/client-compliances/${clientId}/${row.slug}?year=${selectedYear}`,
    );
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Client not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Client header */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Building2 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{client.businessName}</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {client.clientNo} · {client.planDetails?.displayName ?? '—'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ClientStatusBadge status={localStatus} />
            <select
              value={selectedYear}
              onChange={e => handleYearChange(Number(e.target.value))}
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
              onClick={() => { setEditStatus(localStatus); setIsEditOpen(true); }}
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
                  onClick={() => openComplianceDetail(row)}
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
                    <ComplianceStatusCell active={row.active} />
                  </td>
                </tr>
              ))}

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
                    <ComplianceStatusCell active={row.active} />
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
            Filing a new open case for <strong className="text-slate-900">{client.businessName}</strong>.
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

      {/* Edit Status Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit — ${client.businessName}`}
        size="md"
      >
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
      </Modal>

    </div>
  );
}
