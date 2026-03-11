'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import {
  AlertCircle, Search, User, Building2,
  ArrowRight, Calendar, CheckCircle, Plus,
} from 'lucide-react';
import { MOCK_COMPLIANCE_CLIENTS, MOCK_STORED_CASES, COMPLIANCE_AGENTS } from '@/lib/mock-compliance-data';

interface StoredCase {
  id: string;
  agency: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'In Progress' | 'Pending Client' | 'Action Required' | 'Resolved';
  assignedTo: string;
  notes: string;
  createdAt: string;
  dueDate?: string;
}

interface ClientData {
  id: string;
  clientNo: string;
  businessName: string;
  planDetails: any;
}

interface Agent {
  id: string;
  name: string;
  role: string;
}

interface CaseItem {
  caseId: string;
  clientId: string;
  clientNo: string;
  client: string;
  type: string;
  agency: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'In Progress' | 'Pending Client' | 'Action Required' | 'Resolved';
  assignedTo: string;
  notes: string;
  date: string;
  dueDate: string;
  isAutoDetected: boolean;
}

const AGENCY_LABELS: Record<string, string> = {
  bir: 'BIR', sec: 'SEC', mayorsPermit: "Mayor's Permit", dti: 'DTI',
};
const AGENCY_CASE_TYPES: Record<string, string> = {
  bir: 'BIR Filing Issue', sec: 'SEC Compliance Issue',
  mayorsPermit: "Mayor's Permit Issue", dti: 'DTI Registration Issue',
};
const AGENCY_DEADLINE_KEYS: Record<string, string> = {
  bir: 'birDeadline', sec: 'secDeadline',
  mayorsPermit: 'mayorsPermitDeadline', dti: 'dtiDeadline',
};

export const OpenCases: React.FC = () => {
  const initialClients: ClientData[] = MOCK_COMPLIANCE_CLIENTS.map(c => ({
    id: c.id,
    clientNo: c.clientNo,
    businessName: c.businessName,
    planDetails: {
      ...c.planDetails,
      _compliance: c.complianceStatus,
      _cases: MOCK_STORED_CASES[c.id] ?? [],
    },
  }));
  const [clients, setClients] = useState<ClientData[]>(initialClients);
  const agents: Agent[] = COMPLIANCE_AGENTS;
  const [searchTerm, setSearchTerm] = useState('');
  const [managingCase, setManagingCase] = useState<CaseItem | null>(null);
  const [manageDraft, setManageDraft] = useState<{ status: CaseItem['status']; assignedTo: string; notes: string } | null>(null);
  const [isNewCaseOpen, setIsNewCaseOpen] = useState(false);
  const [newCase, setNewCase] = useState({ clientId: '', agency: 'bir', type: AGENCY_CASE_TYPES['bir'], priority: 'MEDIUM' as const, notes: '', dueDate: '' });
  const [saving, setSaving] = useState(false);

  const cases = useMemo(() => {
    const derived: CaseItem[] = [];

    clients.forEach(c => {
      const compliance = c.planDetails?._compliance as Record<string, string> | undefined;
      const manual: StoredCase[] = c.planDetails?._cases ?? [];

      if (compliance) {
        Object.entries(compliance).forEach(([key, val]) => {
          if (!['bir', 'sec', 'mayorsPermit', 'dti'].includes(key)) return;
          if (val === 'OVERDUE' || val === 'PENDING') {
            derived.push({
              caseId: `AUTO-${c.clientNo}-${key.toUpperCase()}`,
              clientId: c.id,
              clientNo: c.clientNo,
              client: c.businessName,
              type: AGENCY_CASE_TYPES[key] ?? `${key} Issue`,
              agency: AGENCY_LABELS[key] ?? key,
              priority: val === 'OVERDUE' ? 'HIGH' : 'MEDIUM',
              status: val === 'OVERDUE' ? 'Action Required' : 'In Progress',
              assignedTo: '—',
              notes: '',
              date: new Date().toISOString().slice(0, 10),
              dueDate: (compliance as any)?.[AGENCY_DEADLINE_KEYS[key]] ?? '',
              isAutoDetected: true,
            });
          }
        });
      }

      manual.forEach(mc => {
        derived.push({
          caseId: mc.id,
          clientId: c.id,
          clientNo: c.clientNo,
          client: c.businessName,
          type: mc.type,
          agency: mc.agency,
          priority: mc.priority,
          status: mc.status,
          assignedTo: mc.assignedTo,
          notes: mc.notes,
          date: mc.createdAt.slice(0, 10),
          dueDate: mc.dueDate ?? '',
          isAutoDetected: false,
        });
      });
    });

    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    derived.sort((a, b) => order[a.priority] - order[b.priority]);
    return derived;
  }, [clients]);

  const filteredCases = cases.filter(c =>
    c.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.caseId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleManageSave = () => {
    if (!managingCase || !manageDraft) return;
    setSaving(true);
    if (!managingCase.isAutoDetected) {
      const client = clients.find(c => c.id === managingCase.clientId)!;
      const updatedCases: StoredCase[] = (client.planDetails?._cases ?? []).map((sc: StoredCase) =>
        sc.id === managingCase.caseId
          ? { ...sc, status: manageDraft.status, assignedTo: manageDraft.assignedTo, notes: manageDraft.notes }
          : sc
      );
      const updatedPlanDetails = { ...(client.planDetails ?? {}), _cases: updatedCases };
      setClients(prev => prev.map(c => c.id === client.id ? { ...c, planDetails: updatedPlanDetails } : c));
    }
    setManagingCase(null);
    setSaving(false);
  };

  const handleCreateCase = () => {
    if (!newCase.clientId || !newCase.type) return;
    setSaving(true);
    const client = clients.find(c => c.id === newCase.clientId)!;
    const newId = `C-${client.clientNo}-${Date.now().toString(36).toUpperCase()}`;
    const entry: StoredCase = {
      id: newId,
      agency: AGENCY_LABELS[newCase.agency] ?? newCase.agency,
      type: newCase.type,
      priority: newCase.priority,
      status: 'In Progress',
      assignedTo: '—',
      notes: newCase.notes,
      createdAt: new Date().toISOString(),
      dueDate: newCase.dueDate,
    };
    const updatedPlanDetails = {
      ...(client.planDetails ?? {}),
      _cases: [...(client.planDetails?._cases ?? []), entry],
    };
    setClients(prev => prev.map(c => c.id === client.id ? { ...c, planDetails: updatedPlanDetails } : c));
    setIsNewCaseOpen(false);
    setNewCase({ clientId: '', agency: 'bir', type: AGENCY_CASE_TYPES['bir'], priority: 'MEDIUM', notes: '', dueDate: '' });
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Open Cases</h2>
        <p className="text-sm text-slate-500 mt-1">Track and manage active compliance issues across all clients.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            className="pl-10 h-11 bg-white border-slate-200 rounded-xl shadow-sm text-slate-900"
            placeholder="Search cases, clients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700 h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 font-bold text-white"
          onClick={() => setIsNewCaseOpen(true)}
        >
          <Plus size={16} className="mr-2" /> Open New Case
        </Button>
      </div>

      {/* Cases List */}
      <div className="space-y-6">
        {filteredCases.length === 0 ? (
          <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-4">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No Open Cases</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              {searchTerm ? 'No cases match your search.' : 'All clients are compliant. No open cases at this time.'}
            </p>
          </div>
        ) : (() => {
          // Group by clientId, preserving priority sort within each group
          const groups = new Map<string, { client: string; clientNo: string; items: CaseItem[] }>();
          filteredCases.forEach(c => {
            if (!groups.has(c.clientId)) {
              groups.set(c.clientId, { client: c.client, clientNo: c.clientNo, items: [] });
            }
            groups.get(c.clientId)!.items.push(c);
          });

          return Array.from(groups.entries()).map(([clientId, group]) => (
            <div key={clientId} className="space-y-3">
              {/* Client Header */}
              <div className="flex items-center gap-3 px-1">
                <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                  <Building2 size={14} className="text-slate-500" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="font-black text-slate-800 text-sm truncate">{group.client}</h3>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">#{group.clientNo}</span>
                  <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black shrink-0">
                    {group.items.length} {group.items.length === 1 ? 'case' : 'cases'}
                  </span>
                </div>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              {/* Cases for this client */}
              <div className="grid grid-cols-1 gap-3 pl-11">
                {group.items.map(caseItem => (
                  <Card key={caseItem.caseId} className="p-0 border-none shadow-sm hover:shadow-md transition-all bg-white overflow-hidden group">
                    <div className="flex flex-col lg:flex-row">
                      <div className={`w-2 shrink-0 ${
                        caseItem.priority === 'HIGH' ? 'bg-red-500' :
                        caseItem.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-400'
                      }`} />
                      <div className="flex-1 p-5 flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Identity */}
                        <div className="flex gap-3 items-start lg:w-1/3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            caseItem.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                            caseItem.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                          }`}>
                            <AlertCircle size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 leading-tight">{caseItem.type}</h4>
                              <Badge variant={caseItem.priority === 'HIGH' ? 'danger' : caseItem.priority === 'MEDIUM' ? 'warning' : 'info'} className="text-[9px] uppercase shrink-0">
                                {caseItem.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <p className="text-[10px] text-slate-400 font-bold">CASE: {caseItem.caseId}</p>
                              {caseItem.isAutoDetected && (
                                <span className="text-[8px] bg-blue-50 text-blue-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Auto-detected</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Due Date */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-6">
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status & Assignment</p>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  caseItem.status === 'Resolved' ? 'bg-emerald-500' :
                                  caseItem.status === 'In Progress' ? 'bg-blue-500' :
                                  caseItem.status === 'Action Required' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                <span className="text-sm font-bold text-slate-700">{caseItem.status}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500">
                                <User size={13} />
                                <span className="text-xs font-medium">{caseItem.assignedTo}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Agency / Due Date</p>
                            <div className="flex items-center gap-4">
                              <span className="text-xs font-bold text-slate-700">{caseItem.agency}</span>
                              <div className="flex items-center gap-1.5">
                                <Calendar
                                  size={13}
                                  className={caseItem.dueDate && new Date(caseItem.dueDate) < new Date() ? 'text-red-500' : 'text-slate-400'}
                                />
                                <span className={`text-xs font-medium ${
                                  caseItem.dueDate && new Date(caseItem.dueDate) < new Date()
                                    ? 'text-red-500 font-bold'
                                    : 'text-slate-500'
                                }`}>
                                  {caseItem.dueDate || '—'}
                                </span>
                                {caseItem.dueDate && new Date(caseItem.dueDate) < new Date() && (
                                  <span className="text-[8px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-black uppercase">Overdue</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action */}
                        <div className="lg:w-32 shrink-0 flex items-center justify-end">
                          <Button
                            variant="outline"
                            className="h-9 px-4 rounded-xl font-bold border-slate-200 group-hover:border-emerald-200 group-hover:text-emerald-600 transition-all text-slate-700 text-xs"
                            onClick={() => { setManagingCase(caseItem); setManageDraft({ status: caseItem.status, assignedTo: caseItem.assignedTo, notes: caseItem.notes }); }}
                          >
                            Manage <ArrowRight size={13} className="ml-1 opacity-40" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Manage Modal */}
      {managingCase && manageDraft && (
        <Modal isOpen={!!managingCase} onClose={() => setManagingCase(null)} title="Manage Case" size="xl">
          <div className="space-y-5 p-6">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                managingCase.priority === 'HIGH' ? 'bg-red-50 text-red-600' :
                managingCase.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
              }`}>
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900">{managingCase.type}</h4>
                <p className="text-xs text-slate-500">{managingCase.client} · {managingCase.caseId} · {managingCase.agency}</p>
                {managingCase.dueDate && (
                  <p className={`text-xs font-bold mt-1 flex items-center gap-1 ${
                    new Date(managingCase.dueDate) < new Date() ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    <Calendar size={11} /> Due: {managingCase.dueDate}
                    {new Date(managingCase.dueDate) < new Date() && (
                      <span className="ml-1 text-[8px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-black uppercase">Overdue</span>
                    )}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</label>
              <div className="grid grid-cols-2 gap-2">
                {(['In Progress', 'Pending Client', 'Action Required', 'Resolved'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setManageDraft(prev => prev ? { ...prev, status: s } : prev)}
                    className={`p-3 rounded-xl font-bold text-xs border transition-all ${
                      manageDraft.status === s
                        ? s === 'Resolved' ? 'bg-emerald-600 text-white border-emerald-600'
                        : s === 'Action Required' ? 'bg-red-600 text-white border-red-600'
                        : s === 'In Progress' ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assign Liaison</label>
              <select
                value={manageDraft.assignedTo}
                onChange={e => setManageDraft(prev => prev ? { ...prev, assignedTo: e.target.value } : prev)}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="—">— Unassigned —</option>
                {agents.map(a => (
                  <option key={a.id} value={a.name}>{a.name} ({a.role})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
              <textarea
                value={manageDraft.notes}
                onChange={e => setManageDraft(prev => prev ? { ...prev, notes: e.target.value } : prev)}
                className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none min-h-25"
                placeholder="Enter updates or issues encountered..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setManagingCase(null)}>Cancel</Button>
              <Button disabled={saving} className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleManageSave}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Open New Case Modal */}
      <Modal isOpen={isNewCaseOpen} onClose={() => setIsNewCaseOpen(false)} title="Open New Case" size="xl">
        <div className="space-y-5 p-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Client</label>
            <select
              value={newCase.clientId}
              onChange={e => setNewCase(prev => ({ ...prev, clientId: e.target.value }))}
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">— Select Client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.businessName} ({c.clientNo})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Agency</label>
              <select
                value={newCase.agency}
                onChange={e => setNewCase(prev => ({ ...prev, agency: e.target.value, type: AGENCY_CASE_TYPES[e.target.value] ?? '' }))}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="bir">BIR</option>
                <option value="sec">SEC</option>
                <option value="mayorsPermit">{"Mayor's Permit"}</option>
                <option value="dti">DTI</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Priority</label>
              <select
                value={newCase.priority}
                onChange={e => setNewCase(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Case Type / Description</label>
            <Input
              value={newCase.type}
              onChange={e => setNewCase(prev => ({ ...prev, type: e.target.value }))}
              className="h-11 bg-white border-slate-200 rounded-xl text-slate-900"
              placeholder="e.g. BIR Open Case, SEC GIS Delay..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Due Date</label>
            <input
              type="date"
              value={newCase.dueDate}
              onChange={e => setNewCase(prev => ({ ...prev, dueDate: e.target.value }))}
              className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Notes</label>
            <textarea
              value={newCase.notes}
              onChange={e => setNewCase(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none min-h-24"
              placeholder="Describe the issue..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsNewCaseOpen(false)}>Cancel</Button>
            <Button
              disabled={saving || !newCase.clientId || !newCase.type}
              className="flex-1 h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              onClick={handleCreateCase}
            >
              {saving ? 'Creating...' : 'Open Case'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
