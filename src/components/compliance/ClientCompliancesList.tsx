'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { Search, Eye, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';

interface ComplianceStatus {
  bir: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  sec: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  mayorsPermit: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  dti: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  birDeadline?: string;
  secDeadline?: string;
  mayorsPermitDeadline?: string;
  dtiDeadline?: string;
}

interface ClientWithCompliance {
  id: string;
  clientNo: string;
  businessName: string;
  authorizedRep: string;
  email: string;
  phone: string;
  tin: string;
  businessAddress: string;
  isBusinessRegistered: boolean;
  isPaid: boolean;
  planDetails: any;
  finalAmount: number;
  createdAt: string;
  status: string;
  complianceStatus: ComplianceStatus;
  lastAudit: string;
  nextDeadline: string;
}

const AGENCIES = [
  { key: 'bir'          as const, label: 'BIR',           deadlineKey: 'birDeadline'          as const },
  { key: 'sec'          as const, label: 'SEC',            deadlineKey: 'secDeadline'          as const },
  { key: 'mayorsPermit' as const, label: "Mayor's Permit", deadlineKey: 'mayorsPermitDeadline' as const },
  { key: 'dti'          as const, label: 'DTI',            deadlineKey: 'dtiDeadline'          as const },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

const getDeadlineUrgency = (deadline?: string) => {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'soon';
  return null;
};

const getDeadlineLabel = (deadline?: string) => {
  if (!deadline) return null;
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return 'Due today';
  if (days <= 7) return `${days}d left`;
  if (days <= 30) return `${days}d left`;
  return null;
};

export const ClientCompliancesList: React.FC = () => {
  const [clients, setClients] = useState<ClientWithCompliance[]>(MOCK_COMPLIANCE_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientWithCompliance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateDraft, setUpdateDraft] = useState<ComplianceStatus | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const loading = false;

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      client.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.clientNo.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'ALL') return matchesSearch;
    const hasStatus = Object.values(client.complianceStatus).some(s => s === statusFilter);
    return matchesSearch && hasStatus;
  });

  const getOverallStatus = (status: ComplianceStatus) => {
    if (Object.values(status).some(s => s === 'OVERDUE')) return 'OVERDUE';
    if (Object.values(status).some(s => s === 'PENDING')) return 'PENDING';
    return 'COMPLIANT';
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLIANT': return 'success' as const;
      case 'PENDING':   return 'warning' as const;
      case 'OVERDUE':   return 'danger' as const;
      default:          return 'neutral' as const;
    }
  };

  const handleOpenUpdate = () => {
    if (!selectedClient) return;
    setUpdateDraft({ ...selectedClient.complianceStatus });
    setIsUpdateModalOpen(true);
  };

  const handleSaveCompliance = () => {
    if (!selectedClient || !updateDraft) return;

    const adjusted = { ...updateDraft };
    AGENCIES.forEach(({ key, deadlineKey }) => {
      if (getDeadlineUrgency(adjusted[deadlineKey]) === 'overdue') {
        adjusted[key] = 'OVERDUE';
      }
    });

    const updatedPlanDetails = { ...(selectedClient.planDetails ?? {}), _compliance: adjusted };
    const updated = { ...selectedClient, complianceStatus: adjusted, planDetails: updatedPlanDetails };
    setClients(prev => prev.map(c => c.id === selectedClient.id ? updated : c));
    setSelectedClient(updated);
    setIsUpdateModalOpen(false);
  };

  const compliantCount = clients.filter(c => getOverallStatus(c.complianceStatus) === 'COMPLIANT').length;
  const pendingCount   = clients.filter(c => getOverallStatus(c.complianceStatus) === 'PENDING').length;
  const overdueCount   = clients.filter(c => getOverallStatus(c.complianceStatus) === 'OVERDUE').length;

  const urgentDeadlines = clients.flatMap(c =>
    AGENCIES.flatMap(({ label, deadlineKey }) => {
      const urgency = getDeadlineUrgency(c.complianceStatus[deadlineKey]);
      if (!urgency) return [];
      return [{ client: c.businessName, agency: label, deadline: c.complianceStatus[deadlineKey]!, urgency }];
    })
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Client Compliances</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage client regulatory compliance status.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="bg-slate-50 p-3 rounded-xl text-slate-600 mb-4 w-fit"><FileText size={20} /></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Clients</p>
          <p className="text-3xl font-black text-slate-900">{clients.length}</p>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mb-4 w-fit"><CheckCircle size={20} /></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Fully Compliant</p>
          <p className="text-3xl font-black text-slate-900">{compliantCount}</p>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="bg-amber-50 p-3 rounded-xl text-amber-600 mb-4 w-fit"><AlertCircle size={20} /></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Review</p>
          <p className="text-3xl font-black text-slate-900">{pendingCount}</p>
        </Card>
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="bg-red-50 p-3 rounded-xl text-red-600 mb-4 w-fit"><AlertCircle size={20} /></div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="text-3xl font-black text-slate-900">{overdueCount}</p>
        </Card>
      </div>

      {/* Deadline Alerts */}
      {urgentDeadlines.length > 0 && (
        <Card className="border-amber-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-600 shrink-0" />
            <p className="text-xs font-black text-amber-700 uppercase tracking-widest">
              Deadline Alerts — {urgentDeadlines.length} item{urgentDeadlines.length !== 1 ? 's' : ''} need attention
            </p>
          </div>
          <div className="divide-y divide-slate-100">
            {urgentDeadlines.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    d.urgency === 'overdue' ? 'bg-red-500' :
                    d.urgency === 'urgent'  ? 'bg-amber-500' : 'bg-yellow-500'
                  }`} />
                  <p className="text-sm font-bold text-slate-800 truncate">{d.client}</p>
                  <span className="text-xs text-slate-400 shrink-0">· {d.agency}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs font-bold text-slate-600">{fmtDate(d.deadline)}</p>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                    d.urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                    d.urgency === 'urgent'  ? 'bg-amber-100 text-amber-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {d.urgency === 'overdue' ? 'Overdue' : d.urgency === 'urgent' ? 'Due Soon' : 'Upcoming'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl"
              placeholder="Search by business name or client number..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </Card>

      {/* Clients Table */}
      <Card className="border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Client</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Plan</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">BIR</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">SEC</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">{"Mayor's Permit"}</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">DTI</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider">Overall</th>
                <th className="p-5 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center text-sm text-slate-400 font-medium">Loading clients...</td>
                </tr>
              ) : filteredClients.length > 0 ? filteredClients.map(client => (
                <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5">
                    <p className="font-bold text-slate-900 text-sm">{client.businessName}</p>
                    <p className="text-xs text-slate-400">{client.clientNo}</p>
                  </td>
                  <td className="p-5">
                    <span className="text-sm text-slate-600">{client.planDetails?.displayName ?? '—'}</span>
                  </td>
                  {AGENCIES.map(({ key, deadlineKey }) => {
                    const urgency = getDeadlineUrgency(client.complianceStatus[deadlineKey]);
                    const label   = getDeadlineLabel(client.complianceStatus[deadlineKey]);
                    return (
                      <td key={key} className="p-5">
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusBadgeVariant(client.complianceStatus[key])}>
                            {client.complianceStatus[key]}
                          </Badge>
                          {label && (
                            <span className={`text-[9px] font-black uppercase tracking-wide ${
                              urgency === 'overdue' ? 'text-red-500' :
                              urgency === 'urgent'  ? 'text-amber-500' : 'text-yellow-600'
                            }`}>
                              {label}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-5">
                    <Badge variant={getStatusBadgeVariant(getOverallStatus(client.complianceStatus))}>
                      {getOverallStatus(client.complianceStatus)}
                    </Badge>
                  </td>
                  <td className="p-5 text-right">
                    <Button
                      variant="outline"
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      onClick={() => { setSelectedClient(client); setIsDetailModalOpen(true); }}
                    >
                      <Eye size={16} className="mr-2" />
                      View
                    </Button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="p-20 text-center text-slate-400 italic">
                    {searchTerm ? 'No clients found matching your search.' : 'No clients available.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Client Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={selectedClient ? `${selectedClient.businessName} - Compliance Details` : ''}
        size="xl"
      >
        {selectedClient && (
          <div className="space-y-6 p-6">
            <Card className="p-6 border-slate-200 bg-slate-50">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Client Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Client Number</p>
                  <p className="font-bold text-slate-900">{selectedClient.clientNo}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Business Name</p>
                  <p className="font-bold text-slate-900">{selectedClient.businessName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Authorized Representative</p>
                  <p className="font-bold text-slate-900">{selectedClient.authorizedRep}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Plan</p>
                  <p className="font-bold text-slate-900">{selectedClient.planDetails?.displayName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Email</p>
                  <p className="text-sm text-slate-600">{selectedClient.email}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-sm text-slate-600">{selectedClient.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">TIN</p>
                  <p className="text-sm text-slate-600">{selectedClient.tin}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date Enrolled</p>
                  <p className="text-sm text-slate-600">{fmtDate(selectedClient.createdAt)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-slate-200">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Compliance Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AGENCIES.map(({ key, label, deadlineKey }) => (
                  <div key={key}>
                    <p className="text-xs text-slate-500 mb-2 uppercase">{label}</p>
                    <Badge variant={getStatusBadgeVariant(selectedClient.complianceStatus[key])}>
                      {selectedClient.complianceStatus[key]}
                    </Badge>
                    {selectedClient.complianceStatus[deadlineKey] && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Due: {fmtDate(selectedClient.complianceStatus[deadlineKey]!)}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button variant="outline" className="flex-1" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleOpenUpdate}>
                Update Compliance
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Compliance Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title="Update Compliance Deadlines"
        size="xl"
      >
        {updateDraft && (
          <div className="space-y-4 p-6">
            <p className="text-xs text-slate-500 font-medium">
              Set the status and deadline for each agency. Deadlines past today will automatically be marked as <strong>Overdue</strong>.
            </p>
            {AGENCIES.map(({ key, label, deadlineKey }) => {
              const urgency = getDeadlineUrgency(updateDraft[deadlineKey]);
              return (
                <div key={key} className={`p-4 rounded-xl border ${
                  urgency === 'overdue' ? 'bg-red-50 border-red-200' :
                  urgency === 'urgent'  ? 'bg-amber-50 border-amber-200' :
                  urgency === 'soon'    ? 'bg-yellow-50 border-yellow-100' :
                  'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="w-36 shrink-0">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">{label}</p>
                      <select
                        value={updateDraft[key]}
                        onChange={e => setUpdateDraft(prev => prev ? { ...prev, [key]: e.target.value as any } : prev)}
                        className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium w-full text-slate-900"
                      >
                        <option value="COMPLIANT">Compliant</option>
                        <option value="PENDING">Pending</option>
                        <option value="OVERDUE">Overdue</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Deadline</p>
                      <input
                        type="date"
                        value={updateDraft[deadlineKey] ? updateDraft[deadlineKey]!.slice(0, 10) : ''}
                        onChange={e => setUpdateDraft(prev => prev ? { ...prev, [deadlineKey]: e.target.value } : prev)}
                        className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm font-medium w-full text-slate-900"
                      />
                    </div>
                    {urgency && (
                      <div className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                        urgency === 'overdue' ? 'bg-red-100 text-red-700' :
                        urgency === 'urgent'  ? 'bg-amber-100 text-amber-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {urgency === 'overdue' ? 'Overdue' :
                         urgency === 'urgent'  ? 'Due in 7 days' :
                         'Due soon'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="flex-1" onClick={() => setIsUpdateModalOpen(false)}>Cancel</Button>
              <Button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSaveCompliance}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};
