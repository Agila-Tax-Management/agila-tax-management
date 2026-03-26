// src/components/client-gateway/ClientGatewayClientList.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Filter, Eye, Trash2, ExternalLink,
  ChevronUp, ChevronDown, AlertCircle, Users, Loader2,
} from 'lucide-react';
import type { ClientListItem } from '@/types/client-gateway.types';
import { useToast } from '@/context/ToastContext';

type SortField = 'clientNo' | 'businessName' | 'companyCode' | 'active' | 'createdAt';
type SortDir   = 'asc' | 'desc';
type StatusFilter = 'All' | 'Active' | 'Inactive';

export function ClientGatewayClientList(): React.ReactNode {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [clients, setClients]           = useState<ClientListItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortField, setSortField]       = useState<SortField>('clientNo');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const [deleteTarget, setDeleteTarget] = useState<ClientListItem | null>(null);
  const [deleting, setDeleting]         = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/client-gateway/clients');
        if (!res.ok) throw new Error('Failed to load clients');
        const json = await res.json() as { data: ClientListItem[] };
        setClients(json.data);
      } catch {
        toastError('Load failed', 'Could not fetch the client list.');
      } finally {
        setLoading(false);
      }
    })();
  }, [toastError]);

  const activeCount    = clients.filter((c) => c.active).length;
  const inactiveCount  = clients.filter((c) => !c.active).length;

  const filtered = useMemo(() => {
    let list = clients;
    if (statusFilter === 'Active') list = list.filter((c) => c.active);
    if (statusFilter === 'Inactive') list = list.filter((c) => !c.active);
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.businessName.toLowerCase().includes(q) ||
          (c.clientNo ?? '').toLowerCase().includes(q) ||
          (c.companyCode ?? '').toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sortField === 'active') return sortDir === 'asc' ? (a.active ? -1 : 1) : (a.active ? 1 : -1);
      const av = (a[sortField] ?? '') as string;
      const bv = (b[sortField] ?? '') as string;
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });
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

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/settings/clients/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch {
      toastError('Delete failed', 'Could not delete this client.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <h1 className="text-2xl font-black text-foreground">Client List</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All registered clients with their portal access and status.
        </p>

        {/* Summary chips */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          {loading ? (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
                <Users size={13} className="text-[#25238e]" />
                {clients.length} Total
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {activeCount} Active
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                {inactiveCount} Inactive
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-4 shrink-0 flex flex-wrap items-center gap-3">
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
          {(['All', 'Active', 'Inactive'] as const).map((s) => (
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
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  {(
                    [
                      { label: 'Client #',      field: 'clientNo'     },
                      { label: 'Business Name', field: 'businessName' },
                      { label: 'Company Code',  field: 'companyCode'  },
                      { label: 'Status',        field: 'active'       },
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portal</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Loader2 size={20} className="animate-spin text-muted-foreground mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      No clients match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                        {client.clientNo ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{client.businessName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{client.businessEntity.replace(/_/g, ' ')}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {client.companyCode ?? '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                          client.active
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {client.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href={`${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ?? '/client-portal'}/${client.portalName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          <ExternalLink size={11} /> Open
                        </a>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/portal/client-gateway/clients/${client.id}`)}
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
            {loading ? 'Loading…' : `Showing ${filtered.length} of ${clients.length} clients`}
          </div>
        </div>
      </div>

      {/* Delete Confirm */}
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
              <strong>{deleteTarget.businessName}</strong>{deleteTarget.clientNo ? ` (${deleteTarget.clientNo})` : ''}?
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
                disabled={deleting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : null}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type SortField = 'clientNumber' | 'businessName' | 'companyCode' | 'status' | 'createdAt';
type SortDir   = 'asc' | 'desc';

const STATUS_BADGE: Record<ClientStatus, string> = {
  Active:    'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Inactive:  'bg-slate-100 text-slate-600 border border-slate-200',
  Suspended: 'bg-red-100 text-red-700 border border-red-200',
};

export function ClientGatewayClientList(): React.ReactNode {
  const [clients, setClients]               = useState<GatewayClient[]>(MOCK_GATEWAY_CLIENTS);
  const [searchTerm, setSearchTerm]         = useState('');
  const [statusFilter, setStatusFilter]     = useState<ClientStatus | 'All'>('All');
  const [sortField, setSortField]           = useState<SortField>('clientNumber');
  const [sortDir, setSortDir]               = useState<SortDir>('asc');
  const [selectedClient, setSelectedClient] = useState<GatewayClient | null>(null);
  const [viewOpen, setViewOpen]             = useState(false);
  const [deleteTarget, setDeleteTarget]     = useState<GatewayClient | null>(null);
  const [editTarget, setEditTarget]         = useState<GatewayClient | null>(null);
  const [editOpen, setEditOpen]             = useState(false);

  // Summary counts
  const activeCount    = clients.filter((c) => c.status === 'Active').length;
  const inactiveCount  = clients.filter((c) => c.status === 'Inactive').length;
  const suspendedCount = clients.filter((c) => c.status === 'Suspended').length;

  const filtered = useMemo(() => {
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
    return [...list].sort((a, b) => {
      const av = a[sortField] as string;
      const bv = b[sortField] as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
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
        <h1 className="text-2xl font-black text-foreground">Client List</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All registered clients with their portal access and status.
        </p>

        {/* Summary chips */}
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
            <Users size={13} className="text-[#25238e]" />
            {clients.length} Total
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {activeCount} Active
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {inactiveCount} Inactive
          </div>
          {suspendedCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-700">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {suspendedCount} Suspended
            </div>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 pb-4 shrink-0 flex flex-wrap items-center gap-3">
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
      <div className="flex-1 overflow-auto px-6 pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 border-b border-border">
                <tr>
                  {(
                    [
                      { label: 'Client #',      field: 'clientNumber' },
                      { label: 'Business Name', field: 'businessName' },
                      { label: 'Company Code',  field: 'companyCode'  },
                      { label: 'Status',        field: 'status'       },
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Portal Link</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-16 text-center text-sm text-muted-foreground">
                      No clients match your search.
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 font-mono text-xs font-semibold text-foreground">
                        {client.clientNumber}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-foreground">{client.businessName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{client.businessType}</p>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                        {client.companyCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[client.status]}`}>
                          {client.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <a
                          href={`${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ?? ''}${client.portalLink}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          <ExternalLink size={11} /> Open Portal
                        </a>
                      </td>
                      <td className="px-4 py-3.5">
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
            Showing {filtered.length} of {clients.length} clients
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

      {/* Delete Confirm */}
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
