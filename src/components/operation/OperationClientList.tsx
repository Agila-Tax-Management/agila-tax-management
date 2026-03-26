// src/components/operation/OperationClientList.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Search, ChevronDown, Eye } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// ── OperationClient type ─────────────────────────────────────────
export interface OperationClient {
  id: number;
  businessName: string;
  businessEntity: string;
  clientNo: string | null;
  assignedOMId: string | null;
  assignedOM: string;
  assignedAOId: string | null;
  assignedAO: string | null;
  onboardedDate: string;
  ownerAccountId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
  tsaUrl: string | null;
  jobOrderNumber: string | null;
  jobOrderUrl: string | null;
}

// ── Types ────────────────────────────────────────────────────────
interface AOUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ── Avatar helper ────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-amber-500', 'bg-blue-500', 'bg-emerald-500',
  'bg-violet-500', 'bg-rose-500', 'bg-teal-500', 'bg-indigo-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]!.toUpperCase())
    .join('');
}

function UserAvatar({ name }: { name: string }) {
  const color = getAvatarColor(name);
  return (
    <div
      className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0 text-[11px] font-black text-white`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });

const fmtEntity = (e: string) =>
  e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

type OwnerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

const OWNER_STATUS_VARIANT: Record<OwnerStatus, 'success' | 'danger' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'danger',
  SUSPENDED: 'warning',
};

// ── Assign AO inline dropdown ────────────────────────────────────
interface AssignAOCellProps {
  client: OperationClient;
  aoUsers: AOUser[];
  onAssigned: (clientId: number, userId: string | null, name: string | null) => void;
}

function AssignAOCell({ client, aoUsers, onAssigned }: AssignAOCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filtered = aoUsers.filter((ao) =>
    ao.name.toLowerCase().includes(search.toLowerCase())
  );

  async function assign(userId: string | null, name: string | null) {
    setSaving(true);
    setOpen(false);
    setSearch('');
    try {
      const res = await fetch(`/api/operation/clients/${client.id}/assign-ao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Failed to assign AO', json.error ?? 'An error occurred.');
        return;
      }
      onAssigned(client.id, userId, name);
      success(
        userId ? 'Account Officer assigned' : 'Account Officer unassigned',
        userId
          ? `${name ?? ''} assigned to ${client.businessName}.`
          : `AO removed from ${client.businessName}.`
      );
    } catch {
      toastError('Failed to assign AO', 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { if (!saving) setOpen((v) => !v); }}
        disabled={saving}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm transition min-w-40 justify-between disabled:opacity-60"
      >
        <div className="flex items-center gap-2 min-w-0">
          {client.assignedAO ? (
            <>
              <UserAvatar name={client.assignedAO} />
              <span className="text-slate-800 font-medium text-sm truncate">{client.assignedAO}</span>
            </>
          ) : (
            <span className="text-slate-400 text-sm">Assign AO</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-slate-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Search bar */}
          <div className="p-2 border-b border-slate-100">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-slate-400 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search AO..."
                className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none flex-1"
              />
            </div>
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {/* Unassign */}
            <li>
              <button
                onClick={() => void assign(null, null)}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-400 hover:bg-slate-50 transition"
              >
                — Unassign
              </button>
            </li>

            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-slate-400 text-center">No matching AO</li>
            ) : (
              filtered.map((ao) => (
                <li key={ao.id}>
                  <button
                    onClick={() => void assign(ao.id, ao.name)}
                    className={`
                      w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition
                      hover:bg-amber-50 hover:text-amber-700
                      ${client.assignedAOId === ao.id
                        ? 'bg-amber-50 text-amber-700 font-bold'
                        : 'text-slate-700'
                      }
                    `}
                  >
                    <UserAvatar name={ao.name} />
                    {ao.name}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Main list component ──────────────────────────────────────────
export function OperationClientList() {
  const router = useRouter();
  const [clients, setClients] = useState<OperationClient[]>([]);
  const [aoUsers, setAoUsers] = useState<AOUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { error: toastError } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, employeesRes] = await Promise.all([
        fetch('/api/operation/clients'),
        fetch('/api/operation/employees'),
      ]);

      if (!clientsRes.ok) {
        toastError('Failed to load clients', 'Could not fetch the client list.');
        return;
      }

      const clientsJson = await clientsRes.json() as { data: OperationClient[] };
      setClients(clientsJson.data);

      if (employeesRes.ok) {
        const empJson = await employeesRes.json() as { data: AOUser[] };
        setAoUsers(empJson.data);
      }
    } catch {
      toastError('Failed to load data', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Reset to page 1 when search changes (adjust-state-during-render pattern)
  const [prevSearch, setPrevSearch] = useState('');
  if (prevSearch !== searchTerm) {
    setPrevSearch(searchTerm);
    setCurrentPage(1);
  }

  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assignedOM.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function handleAssigned(clientId: number, userId: string | null, name: string | null) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, assignedAOId: userId, assignedAO: name } : c
      )
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
              Client List
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              All active clients under Operations management
            </p>
          </div>
          <Badge variant="neutral">
            {filtered.length} client{filtered.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Search */}
        <Card className="p-4">
          <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 max-w-sm">
            <Search size={16} className="text-slate-400 shrink-0" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by business name or OM..."
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-border">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Business Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Assigned OM
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Assign AO
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Account Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Onboarded Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-black text-slate-500 uppercase tracking-widest">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      Loading clients…
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  paginated.map((client) => {
                    const ownerStatus = client.ownerStatus as OwnerStatus | null;
                    return (
                      <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                        {/* Business Name */}
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-900">{client.businessName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {fmtEntity(client.businessEntity)}
                          </p>
                        </td>

                        {/* Assigned OM */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {client.assignedOM && client.assignedOM !== '—' ? (
                              <>
                                <UserAvatar name={client.assignedOM} />
                                <span className="text-sm font-semibold text-slate-800">
                                  {client.assignedOM}
                                </span>
                              </>
                            ) : (
                              <span className="text-sm text-slate-400">—</span>
                            )}
                          </div>
                        </td>

                        {/* Assign AO — interactive dropdown */}
                        <td className="px-6 py-4">
                          <AssignAOCell
                            client={client}
                            aoUsers={aoUsers}
                            onAssigned={handleAssigned}
                          />
                        </td>

                        {/* Account Status */}
                        <td className="px-6 py-4">
                          {ownerStatus ? (
                            <Badge variant={OWNER_STATUS_VARIANT[ownerStatus]}>
                              {ownerStatus.charAt(0) + ownerStatus.slice(1).toLowerCase()}
                            </Badge>
                          ) : (
                            <Badge variant="neutral">No Account</Badge>
                          )}
                        </td>

                        {/* Onboarded Date */}
                        <td className="px-6 py-4 text-slate-500">
                          {fmtDate(client.onboardedDate)}
                        </td>

                        {/* Action */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => router.push(`/portal/operation/clients/${client.id}`)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                          >
                            <Eye size={13} />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
    </div>
  );
}
