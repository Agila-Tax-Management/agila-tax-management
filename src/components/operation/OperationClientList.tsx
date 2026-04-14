// src/components/operation/OperationClientList.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Input } from '@/components/UI/Input';
import { Search, X, Eye, Loader2 } from 'lucide-react';
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

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const color = getAvatarColor(name);
  const dims = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${dims} rounded-full ${color} flex items-center justify-center shrink-0 font-black text-white`}
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

// ── Assignment Input Field with Search Dropdown ──────────────────
interface AssignmentInputFieldProps {
  label: string;
  clientId: number;
  clientName: string;
  currentId: string | null;
  currentName: string | null;
  users: AOUser[];
  patchUrl: string;
  onAssigned: (clientId: number, userId: string | null, name: string | null) => void;
  placeholder: string;
}

function AssignmentInputField({
  label,
  clientId,
  clientName,
  currentId,
  currentName,
  users,
  patchUrl,
  onAssigned,
  placeholder,
}: AssignmentInputFieldProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => { setMounted(true); }, []);

  const openDropdown = () => {
    if (saving) return;
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
    setOpen(true);
    setSearch('');
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        inputRef.current && !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  async function assign(userId: string | null, name: string | null) {
    setSaving(true);
    setOpen(false);
    setSearch('');
    try {
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError(`Failed to assign ${label}`, json.error ?? 'An error occurred.');
        return;
      }
      onAssigned(clientId, userId, name);
      success(
        userId ? `${label} assigned` : `${label} unassigned`,
        userId
          ? `${name ?? ''} assigned to ${clientName}.`
          : `${label} removed from ${clientName}.`
      );
    } catch {
      toastError(`Failed to assign ${label}`, 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  const dropdown = mounted && open ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{ top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width }}
      className="fixed bg-white border border-slate-200 rounded-lg shadow-xl z-9999 overflow-hidden"
    >
      {/* Search bar */}
      <div className="p-2 border-b border-slate-100">
        <div className="flex items-center gap-2 bg-slate-50 rounded-md px-3 py-2">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label.toLowerCase()}...`}
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* Options list */}
      <ul className="max-h-56 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filtered.length === 0 ? (
          <li className="px-4 py-6 text-sm text-slate-400 text-center">No employees found</li>
        ) : (
          filtered.map((u) => (
            <li key={u.id}>
              <button
                onClick={() => void assign(u.id, u.name)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition hover:bg-slate-50 ${
                  currentId === u.id ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-slate-700'
                }`}
              >
                <UserAvatar name={u.name} size="sm" />
                <div className="flex-1 text-left min-w-0">
                  <p className="truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.role}</p>
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>,
    document.body,
  ) : null;

  return (
    <div className="relative">
      <div
        ref={inputRef}
        onClick={openDropdown}
        className={`flex items-center gap-2 h-11 px-3 rounded-lg border border-slate-200 bg-white cursor-pointer transition ${
          saving ? 'opacity-60 cursor-not-allowed' : 'hover:border-slate-300'
        }`}
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin text-slate-400" />
            <span className="text-sm text-slate-400">Saving...</span>
          </>
        ) : currentName ? (
          <>
            <UserAvatar name={currentName} size="sm" />
            <span className="text-sm text-slate-900 font-medium truncate flex-1">{currentName}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                void assign(null, null);
              }}
              className="shrink-0 w-5 h-5 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
              title="Unassign"
            >
              <X size={14} className="text-slate-400 hover:text-slate-600" />
            </button>
          </>
        ) : (
          <span className="text-sm text-slate-400">{placeholder}</span>
        )}
      </div>
      {dropdown}
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

  function handleOMAssigned(clientId: number, userId: string | null, name: string | null) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, assignedOMId: userId, assignedOM: name ?? '—' } : c
      )
    );
  }

  function handleAOAssigned(clientId: number, userId: string | null, name: string | null) {
    setClients((prev) =>
      prev.map((c) =>
        c.id === clientId ? { ...c, assignedAOId: userId, assignedAO: name } : c
      )
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
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
        <Card className="p-6 border-slate-200">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            <Input
              className="pl-10 h-12 bg-slate-50 border-slate-200 rounded-xl"
              placeholder="Search by business name, client no, or operations manager..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Table */}
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Business Name
                  </th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Operations Manager
                  </th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Account Officer
                  </th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Account Status
                  </th>
                  <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Onboarded Date
                  </th>
                  <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <Loader2 size={24} className="mx-auto animate-spin text-slate-400" />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-sm text-slate-400">
                      No clients found
                    </td>
                  </tr>
                ) : (
                  paginated.map((client) => {
                    const ownerStatus = client.ownerStatus as OwnerStatus | null;
                    return (
                      <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                        {/* Business Name */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900 text-sm">{client.businessName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fmtEntity(client.businessEntity)}
                          </p>
                        </td>

                        {/* Operations Manager */}
                        <td className="px-5 py-4">
                          <AssignmentInputField
                            label="Operations Manager"
                            clientId={client.id}
                            clientName={client.businessName}
                            currentId={client.assignedOMId}
                            currentName={client.assignedOM !== '—' ? client.assignedOM : null}
                            users={aoUsers}
                            patchUrl={`/api/operation/clients/${client.id}/assign-om`}
                            onAssigned={handleOMAssigned}
                            placeholder="Assign OM"
                          />
                        </td>

                        {/* Account Officer */}
                        <td className="px-5 py-4">
                          <AssignmentInputField
                            label="Account Officer"
                            clientId={client.id}
                            clientName={client.businessName}
                            currentId={client.assignedAOId}
                            currentName={client.assignedAO}
                            users={aoUsers}
                            patchUrl={`/api/operation/clients/${client.id}/assign-ao`}
                            onAssigned={handleAOAssigned}
                            placeholder="Assign AO"
                          />
                        </td>

                        {/* Account Status */}
                        <td className="px-5 py-4">
                          {ownerStatus ? (
                            <Badge variant={OWNER_STATUS_VARIANT[ownerStatus]}>
                              {ownerStatus.charAt(0) + ownerStatus.slice(1).toLowerCase()}
                            </Badge>
                          ) : (
                            <Badge variant="neutral">No Account</Badge>
                          )}
                        </td>

                        {/* Onboarded Date */}
                        <td className="px-5 py-4 text-slate-500 text-sm">
                          {fmtDate(client.onboardedDate)}
                        </td>

                        {/* Action */}
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => router.push(`/portal/operation/clients/${client.id}`)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                          >
                            <Eye size={14} />
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
            <div className="px-5 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50">
              <p className="text-xs text-slate-500 font-medium">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
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
