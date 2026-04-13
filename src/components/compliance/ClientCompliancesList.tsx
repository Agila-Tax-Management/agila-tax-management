'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Eye, Pencil, Users,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { MockClientWithCompliance } from '@/lib/mock-compliance-data';

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ClientStatusFilter = 'ALL' | 'Active' | 'Inactive' | 'Pending';

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ClientStatusBadge({ status }: { status: string }): React.ReactElement {
  const map: Record<string, 'success' | 'warning' | 'neutral' | 'danger'> = {
    Active:   'success',
    Pending:  'warning',
    Inactive: 'neutral',
  };
  return <Badge variant={map[status] ?? 'neutral'}>{status}</Badge>;
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function ClientCompliancesList(): React.ReactNode {
  const router = useRouter();
  const [clients, setClients] = useState<MockClientWithCompliance[]>(MOCK_COMPLIANCE_CLIENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatusFilter>('ALL');

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MockClientWithCompliance | null>(null);
  const [editStatus, setEditStatus] = useState('');

  const filteredClients = useMemo(() =>
    clients.filter(c => {
      const matchesSearch =
        c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientNo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    }),
    [clients, searchTerm, statusFilter],
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
    setIsEditOpen(false);
  }

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
              s === 'ALL'      ? clients.length :
              s === 'Active'   ? activeCount    :
              s === 'Inactive' ? inactiveCount  : pendingCount;
            const activeStyle =
              s === 'Active'   ? 'bg-emerald-600 text-white' :
              s === 'Inactive' ? 'bg-slate-600 text-white'   :
              s === 'Pending'  ? 'bg-amber-500 text-white'   :
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
                    <p className="text-xs text-slate-400 mt-0.5">{client.planDetails?.displayName ?? 'â€”'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <ClientStatusBadge status={client.status} />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-3 py-1.5 text-xs h-auto"
                        onClick={() => router.push(`/portal/compliance/client-compliances/${client.id}`)}
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
        title={editTarget ? `Edit â€” ${editTarget.businessName}` : 'Edit Client'}
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
