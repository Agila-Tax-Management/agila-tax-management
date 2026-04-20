// src/components/operation/OperationClientViewModal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Card } from '@/components/UI/Card';
import {
  Building2, Calendar, User, FileText, Download,
  ExternalLink, Mail, ShieldCheck, ShieldOff,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

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
  // Owner portal account
  ownerAccountId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
  // Documents
  tsaUrl: string | null;
  jobOrderNumber: string | null;
  jobOrderUrl: string | null;
}

interface OperationClientViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: OperationClient | null;
  onOwnerStatusChanged: (clientId: number, newStatus: OperationClient['ownerStatus']) => void;
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

const fmtEntity = (e: string) =>
  e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// â”€â”€ Avatar helper (mirrors OperationClientList) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
  return name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]!.toUpperCase()).join('');
}
function OwnerAvatar({ name }: { name: string }) {
  const color = getAvatarColor(name);
  return (
    <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center shrink-0 text-sm font-black text-white`}>
      {getInitials(name)}
    </div>
  );
}

const OWNER_STATUS_VARIANT: Record<'ACTIVE' | 'INACTIVE' | 'SUSPENDED', 'success' | 'danger' | 'warning'> = {
  ACTIVE: 'success',
  INACTIVE: 'danger',
  SUSPENDED: 'warning',
};

export function OperationClientViewModal({
  isOpen,
  onClose,
  client,
  onOwnerStatusChanged,
}: OperationClientViewModalProps) {
  const [togglingStatus, setTogglingStatus] = useState(false);
  const { success, error: toastError } = useToast();

  if (!client) return null;

  async function toggleOwnerStatus() {
    if (!client?.ownerAccountId || !client.ownerStatus) return;
    const nextStatus: OperationClient['ownerStatus'] =
      client.ownerStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/admin/settings/client-users/${client.ownerAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Status update failed', json.error ?? 'Could not change account status.');
        return;
      }
      onOwnerStatusChanged(client.id, nextStatus);
      success(
        'Account status updated',
        `${client.ownerName ?? 'Owner'}'s account is now ${nextStatus.toLowerCase()}.`
      );
    } catch {
      toastError('Status update failed', 'An unexpected error occurred.');
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Client Details" size="2xl">
      <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* â”€â”€ CLIENT INFORMATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Client Information
          </p>
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={22} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900 truncate">{client.businessName}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <Badge variant="warning">{fmtEntity(client.businessEntity)}</Badge>
                  {client.clientNo && <Badge variant="info">#{client.clientNo}</Badge>}
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Assigned OM</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{client.assignedOM || 'â€”'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <User size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Assigned AO</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{client.assignedAO || 'â€”'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar size={14} className="text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">Date Onboarded</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{fmtDate(client.onboardedDate)}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* â”€â”€ OWNER INFORMATION â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Owner Account
          </p>
          <Card className="p-5">
            {client.ownerAccountId && client.ownerName ? (
              <div className="flex items-start gap-4">
                <OwnerAvatar name={client.ownerName} />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-sm font-black text-slate-900">{client.ownerName}</p>
                    {client.ownerStatus && (
                      <Badge variant={OWNER_STATUS_VARIANT[client.ownerStatus]}>
                        {client.ownerStatus.charAt(0) + client.ownerStatus.slice(1).toLowerCase()}
                      </Badge>
                    )}
                  </div>
                  {client.ownerEmail && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-500">{client.ownerEmail}</p>
                    </div>
                  )}

                  {/* Activate / Deactivate toggle */}
                  {client.ownerStatus && client.ownerStatus !== 'SUSPENDED' && (
                    <button
                      onClick={() => void toggleOwnerStatus()}
                      disabled={togglingStatus}
                      className={`
                        mt-3 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition disabled:opacity-50
                        ${client.ownerStatus === 'ACTIVE'
                          ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                          : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }
                      `}
                    >
                      {client.ownerStatus === 'ACTIVE'
                        ? <><ShieldOff size={13} /> Deactivate Account</>
                        : <><ShieldCheck size={13} /> Activate Account</>
                      }
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <User size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">No owner account linked</p>
                  <p className="text-xs text-slate-400 mt-0.5">No client portal user has been assigned as owner</p>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* â”€â”€ SIGNED TSA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Signed Tax Service Agreement (TSA)
          </p>
          <Card className="p-5">
            {client.tsaUrl ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      TSA_{client.businessName.replace(/\s+/g, '_')}.pdf
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Signed agreement document</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={client.tsaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                  >
                    <ExternalLink size={13} /> View
                  </a>
                  <a
                    href={client.tsaUrl}
                    download
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">No TSA uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Waiting for signed copy</p>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* â”€â”€ JOB ORDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <section>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Job Order
          </p>
          <Card className="p-5">
            {client.jobOrderNumber ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{client.jobOrderNumber}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Operations handover document</p>
                  </div>
                </div>
                {client.jobOrderUrl && (
                  <div className="flex items-center gap-2">
                    <a
                      href={client.jobOrderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                    >
                      <ExternalLink size={13} /> View
                    </a>
                    <a
                      href={client.jobOrderUrl}
                      download
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-500">No job order attached</p>
                  <p className="text-xs text-slate-400 mt-0.5">Not yet linked to a job order</p>
                </div>
              </div>
            )}
          </Card>
        </section>

      </div>
    </Modal>
  );
}
