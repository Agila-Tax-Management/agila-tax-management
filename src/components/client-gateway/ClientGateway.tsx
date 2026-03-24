// src/components/client-gateway/ClientGateway.tsx
'use client';

import React, { useState, useMemo } from 'react';
import {
  Users, Search, Filter,
  ExternalLink, Eye, Trash2, ChevronUp, ChevronDown, AlertCircle,
} from 'lucide-react';
import {
  MOCK_GATEWAY_CLIENTS,
  type GatewayClient,
  type ClientStatus,
} from '@/lib/mock-client-gateway-data';
import { ClientViewModal } from '@/components/client-gateway/ClientViewModal';
import { ClientEditModal } from '@/components/client-gateway/ClientEditModal';

type SortField = 'clientNumber' | 'businessName' | 'companyCode' | 'status' | 'createdAt';
type SortDir   = 'asc' | 'desc';

const STATUS_BADGE: Record<ClientStatus, string> = {
  Active:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Inactive:  'bg-slate-100 text-slate-600 border border-slate-200',
  Suspended: 'bg-red-100 text-red-700 border border-red-200',
};

export function ClientGateway(): React.ReactNode {
  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState<ClientStatus | 'All'>('All');
  const [sortField, setSortField]           = useState<SortField>('clientNumber');
  const [sortDir, setSortDir]               = useState<SortDir>('asc');
  const [selectedClient, setSelectedClient] = useState<GatewayClient | null>(null);
  const [viewOpen, setViewOpen]             = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<GatewayClient | null>(null);
  const [clients, setClients]               = useState<GatewayClient[]>(MOCK_GATEWAY_CLIENTS);
  const [editTarget, setEditTarget]         = useState<GatewayClient | null>(null);
  const [editOpen, setEditOpen]             = useState(false);

  const filteredClients = useMemo(() => {
    let list = clients;
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.businessName.toLowerCase().includes(q) ||
          c.clientNumber.toLowerCase().includes(q) ||
          c.companyCode.toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      const av = a[sortField] as string;
      const bv = b[sortField] as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [clients, searchTerm, statusFilter, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-[#25238e]" />
      : <ChevronDown size={12} className="text-[#25238e]" />;
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-foreground">Client List</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All registered clients with their portal access and status.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
              <Users size={13} className="text-[#25238e]" />
              {clients.length} Total
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-52">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name, number, or code…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#25238e]/30"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Filter size={14} className="text-muted-foreground" />
                {(['All', 'Active', 'Inactive', 'Suspended'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                      statusFilter === s
                        ? 'bg-[#25238e] text-white border-[#25238e]'
                        : 'bg-card text-muted-foreground border-border hover:border-[#25238e]/40'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 border-b border-border">
                    <tr>
                      {(
                        [
                          { label: 'Client #',   field: 'clientNumber' },
                          { label: 'Business Name', field: 'businessName' },
                          { label: 'Company Code',  field: 'companyCode' },
                          { label: 'Status',        field: 'status' },
                        ] as { label: string; field: SortField }[]
                      ).map(({ label, field }) => (
                        <th
                          key={field}
                          onClick={() => toggleSort(field)}
                          className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer hover:text-foreground select-none"
                        >
                          <span className="inline-flex items-center gap-1">
                            {label} <SortIcon field={field} />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Portal Link
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No clients found.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                            {client.clientNumber}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-foreground">{client.businessName}</span>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {client.companyCode}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[client.status]}`}>
                              {client.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={client.portalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              <ExternalLink size={11} /> Open Portal
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => { setSelectedClient(client); setViewOpen(true); }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                              >
                                <Eye size={12} /> View
                              </button>
                              <button
                                onClick={() => setDeleteTarget(client)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all"
                              >
                                <Trash2 size={12} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-2.5 border-t border-border bg-muted/30 text-xs text-muted-foreground">
                Showing {filteredClients.length} of {clients.length} clients
              </div>
            </div>
          </div>
        </div>

      {/* View Modal */}
      <ClientViewModal
        client={selectedClient}
        isOpen={viewOpen}
        onClose={() => setViewOpen(false)}
        onEdit={(c) => { setViewOpen(false); setEditTarget(c); setEditOpen(true); }}
      />

      {/* Edit Modal */}
      <ClientEditModal
        client={editTarget}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={(updated) => {
          setClients((prev) => prev.map((c) => c.id === updated.id ? updated : c));
          setEditOpen(false);
        }}
      />

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-red-100">
                <AlertCircle size={20} className="text-red-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Delete Client</h3>
                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-slate-700 mb-6">
              Are you sure you want to delete{' '}
              <strong>{deleteTarget.businessName}</strong> ({deleteTarget.clientNumber})?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
    )}
    </div>
  );
}
