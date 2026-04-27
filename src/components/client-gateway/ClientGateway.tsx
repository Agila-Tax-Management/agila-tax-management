// src/components/client-gateway/ClientGateway.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Search, Filter,
  ExternalLink, Eye, EyeOff, Trash2, GitBranch, ChevronUp, ChevronDown, AlertCircle, Loader2,
  Download, Upload,
} from 'lucide-react';
import type { ClientListItem } from '@/types/client-gateway.types';
import { useToast } from '@/context/ToastContext';
import { AddBranchModal } from './AddBranchModal';
import { ExportClientsModal } from './ExportClientsModal';
import { ImportClientsModal } from './ImportClientsModal';

type SortField = 'clientNo' | 'businessName' | 'companyCode' | 'branchType' | 'active' | 'createdAt';
type SortDir   = 'asc' | 'desc';
type StatusFilter = 'All' | 'Active' | 'Inactive';

export function ClientGateway(): React.ReactNode {
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
  const [deleteText, setDeleteText]     = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [branchTarget, setBranchTarget] = useState<ClientListItem | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

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

  const filteredClients = useMemo(() => {
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
    list = [...list].sort((a, b) => {
      const av = (a[sortField] ?? '') as string;
      const bv = (b[sortField] ?? '') as string;
      if (sortField === 'active') return sortDir === 'asc' ? (a.active ? -1 : 1) : (a.active ? 1 : -1);
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
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

  async function refreshClients() {
    try {
      const res = await fetch('/api/client-gateway/clients');
      if (!res.ok) throw new Error();
      const json = await res.json() as { data: ClientListItem[] };
      setClients(json.data);
    } catch {
      // silently ignore — user can refresh the page
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/client-gateway/clients/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Delete failed', json.error ?? 'Could not delete this client.');
        return;
      }
      setClients((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteTarget(null);
      setDeleteText('');
      setDeletePassword('');
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
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-foreground">Client List</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              All registered clients with their portal access and status.
            </p>
          </div>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            {loading ? (
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground">
                <Users size={13} className="text-[#25238e]" />
                {clients.length} Total
              </div>
            )}
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all"
            >
              <Upload size={13} />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setShowExport(true)}
              disabled={loading || clients.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all disabled:opacity-50"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
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
                          { label: 'Branch Type',   field: 'branchType'   },
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
                        <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                          No clients found.
                        </td>
                      </tr>
                    ) : (
                      filteredClients.map((client) => (
                        <tr key={client.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-foreground">
                            {client.clientNo ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{client.businessName}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{client.businessEntity.replace(/_/g, ' ')}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                            {client.companyCode ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${                              client.branchType === 'MAIN'
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                              {client.branchType === 'MAIN' ? 'Main Branch' : 'Branch'}
                            </span>
                            {client.branchType === 'BRANCH' && client.mainBranchName && (
                              <p className="text-xs text-muted-foreground mt-0.5">{client.mainBranchName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${                              client.active
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {client.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={`${process.env.NEXT_PUBLIC_CLIENT_PORTAL_URL ?? '/client-portal'}/${client.portalName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                            >
                              <ExternalLink size={11} /> Open Portal
                            </a>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              {client.branchType === 'MAIN' && (
                                <button
                                  onClick={() => setBranchTarget(client)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-all"
                                  title="Add branch"
                                >
                                  <GitBranch size={12} /> Branch
                                </button>
                              )}
                              <button
                                onClick={() => router.push(`/portal/client-gateway/clients/${client.id}`)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all"
                              >
                                <Eye size={12} /> View
                              </button>
                              <button
                                onClick={() => {
                                  setDeleteTarget(client);
                                  setDeleteText('');
                                  setDeletePassword('');
                                  setShowDeletePassword(false);
                                }}
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
                {loading ? 'Loading…' : `Showing ${filteredClients.length} of ${clients.length} clients`}
              </div>
            </div>
          </div>
        </div>

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
                <p className="text-xs text-slate-500 mt-0.5">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 mb-4">
              You are about to permanently delete{' '}
              <strong className="text-red-700">{deleteTarget.businessName}</strong>
              {deleteTarget.clientNo ? ` (${deleteTarget.clientNo})` : ''}
              {' '}and all associated records.
            </p>

            <div className="flex flex-col gap-3">
              {/* Type DELETE */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Type <span className="font-mono font-black text-red-600">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                  placeholder="DELETE"
                  autoComplete="off"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Your password
                </label>
                <div className="relative">
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className="w-full px-3 py-2 pr-9 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showDeletePassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-5">
              <button
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteText('');
                  setDeletePassword('');
                }}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting || deleteText.toUpperCase() !== 'DELETE' || !deletePassword.trim()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {deleting ? 'Deleting…' : 'Delete Client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      <AddBranchModal
        isOpen={branchTarget !== null}
        onClose={() => setBranchTarget(null)}
        onSuccess={() => { void refreshClients(); }}
        parentClient={branchTarget}
      />

      {/* Export Modal */}
      <ExportClientsModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        totalClients={filteredClients.length}
      />

      {/* Import Modal */}
      <ImportClientsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={() => { void refreshClients(); }}
      />
    </div>
  );
}
