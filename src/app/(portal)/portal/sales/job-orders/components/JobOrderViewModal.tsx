// src/app/(portal)/portal/sales/job-orders/components/JobOrderViewModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X, Pencil, Loader2, CheckCircle2, Clock, AlertCircle,
  FileCheck, XCircle, Printer, Ban,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { JobOrderRecord, JobOrderStatus } from './JobOrders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: JobOrderRecord;
  onUpdate: (updated: JobOrderRecord) => void;
  onEdit: () => void;
}

// ─── Status Badge ─────────────────────────────────────────────────

const STATUS_CONFIG: Record<JobOrderStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  DRAFT:                   { label: 'Draft',                      color: 'text-slate-600',  bg: 'bg-slate-100',  icon: <Clock size={12} /> },
  PENDING_OPERATIONS_ACK:  { label: 'Pending Ops Approval',      color: 'text-blue-700',   bg: 'bg-blue-50',    icon: <AlertCircle size={12} /> },
  PENDING_ACCOUNT_ACK:     { label: 'Pending Account Approval',  color: 'text-indigo-700', bg: 'bg-indigo-50',  icon: <AlertCircle size={12} /> },
  PENDING_EXECUTIVE_ACK:   { label: 'Pending Executive Approval',color: 'text-purple-700', bg: 'bg-purple-50',  icon: <AlertCircle size={12} /> },
  APPROVED:                { label: 'Approved',                  color: 'text-emerald-700',bg: 'bg-emerald-50', icon: <CheckCircle2 size={12} /> },
  IN_PROGRESS:             { label: 'In Progress',               color: 'text-amber-700',  bg: 'bg-amber-50',   icon: <FileCheck size={12} /> },
  COMPLETED:               { label: 'Completed',                 color: 'text-teal-700',   bg: 'bg-teal-50',    icon: <CheckCircle2 size={12} /> },
  CANCELLED:               { label: 'Cancelled',                 color: 'text-rose-700',   bg: 'bg-rose-50',    icon: <XCircle size={12} /> },
};

function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function fmtDateShort(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

// ─── Component ────────────────────────────────────────────────────

export function JobOrderViewModal({ isOpen, onClose, jobOrder: jo, onUpdate, onEdit }: Props): React.ReactNode {
  const { success, error } = useToast();
  const [isActing, setIsActing] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  if (!isOpen) return null;

  const cfg = STATUS_CONFIG[jo.status];

  const subscriptionItems = jo.items.filter((i) => i.itemType === 'SUBSCRIPTION');
  const oneTimeItems = jo.items.filter((i) => i.itemType === 'ONE_TIME');

  const subTotal = subscriptionItems.reduce((s, i) => s + parseFloat(i.total), 0);
  const otTotal  = oneTimeItems.reduce((s, i) => s + parseFloat(i.total), 0);
  const grandTotal = subTotal + otTotal;

  const clientName = jo.client?.businessName
    ?? jo.lead.businessName
    ?? `${jo.lead.firstName} ${jo.lead.lastName}`;

  // ── Workflow state helpers ───────────────────────────────────────
  const canSubmit           = jo.status === 'DRAFT';
  const canApproveOps       = jo.status === 'PENDING_OPERATIONS_ACK' && !jo.actualOperationsManagerId;
  const canApproveAccount   = jo.status === 'PENDING_ACCOUNT_ACK' && !jo.actualAccountManagerId;
  const canApproveExec      = jo.status === 'PENDING_EXECUTIVE_ACK' && !jo.actualExecutiveId;
  const canCancel           = !['COMPLETED', 'CANCELLED', 'APPROVED'].includes(jo.status);

  // ── Action handler ───────────────────────────────────────────────
  const doAction = async (action: string, label: string) => {
    setIsActing(action);
    try {
      const res = await fetch(`/api/sales/job-orders/${jo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        error('Action failed', json.error ?? 'Could not complete this action.');
        return;
      }
      const json = await res.json() as { data: JobOrderRecord };
      success('Done', `${label} completed successfully.`);
      onUpdate(json.data);
    } catch {
      error('Network error', 'Could not complete this action. Check your connection.');
    } finally {
      setIsActing(null);
    }
  };

  // ── Print ────────────────────────────────────────────────────────
  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      const [{ pdf }, { JobOrderPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./JobOrderPDF'),
      ]);
      const el = React.createElement(JobOrderPDF, { jobOrder: jo }) as Parameters<typeof pdf>[0];
      const blob = await pdf(el).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      error('Print failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setIsPrinting(false);
    }
  };

  // ── Signature block helper ───────────────────────────────────────
  const SignatureBlock = ({
    role,
    name,
    date,
    pending,
    actionKey,
    actionLabel,
    canAck,
    isOverride = false,
  }: {
    role: string;
    name?: string | null;
    date?: string | null;
    pending: boolean;
    actionKey: string;
    actionLabel: string;
    canAck: boolean;
    isOverride?: boolean;
  }) => (
    <div className="flex flex-col items-center text-center min-w-0 flex-1">
      {/* Signature line */}
      <div className="w-full border-b-2 border-slate-300 mb-2 min-w-25 h-10 flex items-end justify-center pb-1 px-2">
        {name ? (
          <div className="flex flex-col items-center">
            <span className="text-xs font-semibold text-slate-800 leading-tight wrap-break-word">{name}</span>
            {isOverride && (
              <span className="text-[9px] text-orange-600 font-semibold italic mt-0.5">Override</span>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-300 italic">
            {pending ? 'Awaiting' : '—'}
          </span>
        )}
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider leading-tight">{role}</p>
      {date && <p className="text-[10px] text-slate-400 mt-0.5">{fmtDateShort(date)}</p>}
      {canAck && (
        <button
          onClick={() => void doAction(actionKey, actionLabel)}
          disabled={!!isActing}
          className="mt-2.5 flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-[10px] font-bold rounded-lg transition-colors"
        >
          {isActing === actionKey ? (
            <Loader2 size={10} className="animate-spin" />
          ) : (
            <CheckCircle2 size={10} />
          )}
          {actionLabel}
        </button>
      )}
      {!canAck && pending && jo.status !== 'CANCELLED' && (
        <span className="mt-2 text-[9px] text-slate-400 italic">Pending prior step</span>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-6">

        {/* Modal Toolbar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
              {cfg.icon}
              {cfg.label}
            </span>
            <span className="font-mono font-bold text-indigo-700 text-sm">{jo.jobOrderNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void handlePrint()}
              disabled={isPrinting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-white disabled:opacity-60 transition-colors"
              title="Generate PDF"
            >
              {isPrinting ? <Loader2 size={13} className="animate-spin" /> : <Printer size={13} />}
              {isPrinting ? 'Generating...' : 'Print'}
            </button>
            {jo.status === 'DRAFT' && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-white transition-colors"
              >
                <Pencil size={13} />
                Edit
              </button>
            )}
            {canSubmit && (
              <button
                onClick={() => void doAction('submit', 'Submit for acknowledgment')}
                disabled={!!isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold transition-colors"
              >
                {isActing === 'submit' ? <Loader2 size={13} className="animate-spin" /> : <AlertCircle size={13} />}
                Submit
              </button>
            )}
            {canCancel && (
              <button
                onClick={() => void doAction('cancel', 'Cancel job order')}
                disabled={!!isActing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-60 text-xs transition-colors"
              >
                {isActing === 'cancel' ? <Loader2 size={13} className="animate-spin" /> : <Ban size={13} />}
                Cancel JO
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── JO Document Body ─────────────────────────────────────── */}
        <div className="p-8 space-y-6 print:p-4">

          {/* Company Header */}
          <div className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-4">
            <div>
              <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-tight">
                Agila Tax and Business Solutions
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Tax Compliance &amp; Business Registration Services
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-black text-indigo-700 uppercase tracking-widest leading-none">
                Job Order
              </p>
              <p className="font-mono font-bold text-slate-700 text-sm mt-1">{jo.jobOrderNumber}</p>
              <p className="text-xs text-slate-500 mt-0.5">Date: {fmtDate(jo.date)}</p>
            </div>
          </div>

          {/* Warning if approvers not configured */}
          {(!jo.assignedOperationsManagerId || !jo.assignedAccountManagerId || !jo.assignedExecutiveId) && jo.status === 'DRAFT' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800">
                <span className="font-semibold">Approvers not fully configured.</span> Please assign default approvers in Sales Settings before submitting this job order.
              </div>
            </div>
          )}

          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="space-y-2">
              <InfoRow label="Business / Client Name" value={clientName} />
              <InfoRow
                label="Contact Person"
                value={`${jo.lead.firstName} ${jo.lead.lastName}`}
              />
              <InfoRow label="Business Type" value={jo.lead.businessType} />
            </div>
            <div className="space-y-2">
              <InfoRow label="Contact Number" value={jo.lead.contactNumber ?? '—'} />
              <InfoRow label="Date Prepared" value={fmtDate(jo.datePrepared)} />
            </div>
          </div>

          {/* Services Header */}
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">
            The following are the services to be rendered:
          </p>

          {/* Subscription Services Table */}
          {subscriptionItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                Subscription / Recurring Services
              </p>
              <ViewTable items={subscriptionItems} showSubtotal={oneTimeItems.length > 0} subtotal={subTotal} />
            </div>
          )}

          {/* One-Time Services Table */}
          {oneTimeItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">
                One-Time Services
              </p>
              <ViewTable items={oneTimeItems} showSubtotal={subscriptionItems.length > 0} subtotal={otTotal} />
            </div>
          )}

          {/* No items */}
          {subscriptionItems.length === 0 && oneTimeItems.length === 0 && (
            <p className="text-xs text-slate-400 italic text-center py-6">
              No services have been added to this job order.
            </p>
          )}

          {/* Grand Total */}
          {(subscriptionItems.length > 0 || oneTimeItems.length > 0) && (
            <div className="flex justify-end">
              <div className="border-2 border-slate-800 rounded-xl px-6 py-3 min-w-55">
                {subscriptionItems.length > 0 && oneTimeItems.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Subscription subtotal:</span>
                    <span className="font-semibold">{fmt(subTotal)}</span>
                  </div>
                )}
                {subscriptionItems.length > 0 && oneTimeItems.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span>One-time subtotal:</span>
                    <span className="font-semibold">{fmt(otTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-black text-slate-600 uppercase tracking-wider">Grand Total</span>
                  <span className="text-xl font-black text-indigo-700">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {jo.notes && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
                Notes / Special Instructions
              </p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{jo.notes}</p>
            </div>
          )}

          {/* ── Signatures / Acknowledgment ───────────────────────── */}
          <div className="border-t-2 border-slate-200 pt-6 space-y-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Received and Acknowledged By
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {/* Prepared By */}
              <SignatureBlock
                role="Prepared By"
                name={jo.preparedBy?.name}
                date={jo.datePrepared}
                pending={!jo.preparedBy}
                actionKey="__none__"
                actionLabel=""
                canAck={false}
                isOverride={false}
              />
              {/* Operations Manager (acks first) */}
              <SignatureBlock
                role="Operations Manager"
                name={jo.actualOperationsManager?.name ?? jo.assignedOperationsManager?.name}
                date={jo.dateOperationsManagerAck}
                pending={!jo.actualOperationsManagerId}
                actionKey="approve_operations"
                actionLabel="Approve (Ops)"
                canAck={canApproveOps}
                isOverride={!!jo.actualOperationsManagerId && jo.actualOperationsManagerId !== jo.assignedOperationsManagerId}
              />
              {/* Account Manager (approves second) */}
              <SignatureBlock
                role="Account Manager"
                name={jo.actualAccountManager?.name ?? jo.assignedAccountManager?.name}
                date={jo.dateAccountManagerAck}
                pending={!jo.actualAccountManagerId}
                actionKey="approve_account"
                actionLabel="Approve (Account)"
                canAck={canApproveAccount}
                isOverride={!!jo.actualAccountManagerId && jo.actualAccountManagerId !== jo.assignedAccountManagerId}
              />
              {/* Executive */}
              <SignatureBlock
                role="Executive"
                name={jo.actualExecutive?.name ?? jo.assignedExecutive?.name}
                date={jo.dateExecutiveAck}
                pending={!jo.actualExecutiveId}
                actionKey="approve_executive"
                actionLabel="Approve (Exec)"
                canAck={canApproveExec}
                isOverride={!!jo.actualExecutiveId && jo.actualExecutiveId !== jo.assignedExecutiveId}
              />
            </div>
          </div>

          {/* Workflow Progress Bar */}
          <WorkflowProgress jo={jo} />

        </div>
      </div>
    </div>
  );

}

// ─── View Table ───────────────────────────────────────────────────

function ViewTable({
  items,
  showSubtotal,
  subtotal,
}: {
  items: JobOrderRecord['items'];
  showSubtotal: boolean;
  subtotal: number;
}): React.ReactNode {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-4 py-2 font-black text-slate-500 uppercase tracking-wider">
              Service Name
            </th>
            <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-wider w-28">
              Rate
            </th>
            <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-wider w-24">
              Disc.
            </th>
            <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-wider w-28">
              Total
            </th>
            <th className="text-left px-4 py-2 font-black text-slate-500 uppercase tracking-wider">
              Remarks
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="px-4 py-2.5 font-medium text-slate-800">{item.serviceName}</td>
              <td className="px-4 py-2.5 text-right text-slate-600">
                {parseFloat(item.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-500">
                {parseFloat(item.discount) > 0
                  ? parseFloat(item.discount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                  : '—'}
              </td>
              <td className="px-4 py-2.5 text-right font-semibold text-indigo-700">
                ₱{parseFloat(item.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2.5 text-slate-500">{item.remarks ?? '—'}</td>
            </tr>
          ))}
        </tbody>
        {showSubtotal && (
          <tfoot>
            <tr className="bg-slate-50 border-t border-slate-200">
              <td colSpan={3} className="px-4 py-2 text-right text-xs font-black text-slate-500 uppercase tracking-wider">
                Subtotal
              </td>
              <td className="px-4 py-2 text-right font-black text-slate-700">
                ₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

// ─── Workflow Progress ────────────────────────────────────────────

function WorkflowProgress({ jo }: { jo: JobOrderRecord }): React.ReactNode {
  const steps = [
    { label: 'Created', done: true, name: jo.preparedBy?.name, date: jo.datePrepared },
    { label: 'Submitted', done: jo.status !== 'DRAFT', name: null, date: null },
    { label: 'Ops Approved', done: !!jo.actualOperationsManagerId, name: jo.actualOperationsManager?.name, date: jo.dateOperationsManagerAck },
    { label: 'Account Approved', done: !!jo.actualAccountManagerId, name: jo.actualAccountManager?.name, date: jo.dateAccountManagerAck },
    { label: 'Executive Approved', done: !!jo.actualExecutiveId, name: jo.actualExecutive?.name, date: jo.dateExecutiveAck },
  ];

  const cancelledIdx = jo.status === 'CANCELLED'
    ? steps.findIndex((s) => !s.done)
    : -1;

  return (
    <div className="mt-4">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
        Workflow Progress
      </p>
      <div className="flex items-center gap-0">
        {steps.map((step, i) => {
          const isCancelled = jo.status === 'CANCELLED' && i >= (cancelledIdx >= 0 ? cancelledIdx : steps.length);
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center text-center flex-1 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-colors ${
                    isCancelled
                      ? 'bg-rose-100 border-rose-300 text-rose-400'
                      : step.done
                      ? 'bg-emerald-500 border-emerald-600 text-white'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {isCancelled ? '✕' : step.done ? '✓' : i + 1}
                </div>
                <p className={`text-[9px] font-semibold mt-1 leading-tight ${
                  isCancelled ? 'text-rose-400' : step.done ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </p>
                {step.name && (
                  <p className="text-[9px] text-slate-400 leading-tight truncate max-w-20">{step.name}</p>
                )}
                {step.date && (
                  <p className="text-[9px] text-slate-400">
                    {new Date(step.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 transition-colors ${
                    steps[i + 1]?.done ? 'bg-emerald-400' : 'bg-slate-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Info Row ─────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }): React.ReactNode {
  return (
    <div className="flex gap-2 text-xs">
      <span className="text-slate-400 font-semibold whitespace-nowrap min-w-27.5">{label}:</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </div>
  );
}
