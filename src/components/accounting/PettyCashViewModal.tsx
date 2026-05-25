// src/components/accounting/PettyCashViewModal.tsx
'use client';

import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import type { PettyCashRecord } from './PettyCashFund';

// ── Status badge styles ───────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  DRAFT:      'bg-gray-100   text-gray-600',
  PENDING:    'bg-yellow-100 text-yellow-700',
  APPROVED:   'bg-blue-100   text-blue-700',
  DISBURSED:  'bg-green-100  text-green-700',
  LIQUIDATED: 'bg-purple-100 text-purple-700',
  REJECTED:   'bg-red-100    text-red-700',
  VOID:       'bg-gray-100   text-gray-500',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface PettyCashViewModalProps {
  record: PettyCashRecord;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PettyCashViewModal({ record, onClose }: PettyCashViewModalProps): React.ReactNode {
  const fmt = (n: number) =>
    `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                  Petty Cash Fund
                </p>
                <h2 className="text-lg font-bold text-foreground">{record.pcfNo}</h2>
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[record.status]}`}
              >
                {record.status}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition rounded-lg p-1 hover:bg-muted"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] space-y-6">

          {/* Basic info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Date</p>
              <p className="text-foreground font-medium">{fmtDate(record.date)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Client</p>
              <p className="text-foreground font-medium">{record.client?.businessName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Requested by</p>
              <p className="text-foreground font-medium">{record.requestedBy.name}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-0.5">Purpose</p>
              <p className="text-foreground">{record.purpose}</p>
            </div>
          </div>

          {/* Items table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Items
            </p>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Category
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Description
                    </th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {record.items.map((item) => (
                    <tr key={item.id} className="bg-card">
                      <td className="px-3 py-2 text-xs text-muted-foreground">
                        {item.category === 'CLIENT_FUND' ? 'Client Fund' : 'Employee Expense'}
                      </td>
                      <td className="px-3 py-2 text-foreground">{item.description}</td>
                      <td className="px-3 py-2 text-right font-medium text-foreground">
                        {fmt(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30">
                  <tr>
                    <td
                      colSpan={2}
                      className="px-3 py-2 text-xs font-semibold text-muted-foreground text-right"
                    >
                      Total
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-foreground">
                      {fmt(record.totalRequestedAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Approval chain */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Approval Chain
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 size={12} />
                  <span>Submitted</span>
                </div>
                <p className="text-xs text-muted-foreground">Prepared by</p>
                <p className="text-foreground font-medium">{record.requestedBy.name}</p>
              </div>
              <div className="flex flex-col gap-1">
                {record.custodianApprovedAt && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 size={12} />
                    <span>Approved</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Petty Cash Custodian</p>
                <p className="text-foreground font-medium">{record.custodian?.name ?? '—'}</p>
              </div>
              <div className="flex flex-col gap-1">
                {record.accountingManagerApprovedAt && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle2 size={12} />
                    <span>Approved</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Accounting Manager</p>
                <p className="text-foreground font-medium">{record.accountingManager?.name ?? '—'}</p>
              </div>
            </div>
          </div>

          {/* Rejection reason */}
          {record.rejectionReason && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">
                Rejection Reason
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">{record.rejectionReason}</p>
            </div>
          )}

          {/* Notes */}
          {(record.custodianNotes ?? record.managerNotes) && (
            <div className="space-y-3">
              {record.custodianNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Custodian Notes</p>
                  <p className="text-sm text-foreground">{record.custodianNotes}</p>
                </div>
              )}
              {record.managerNotes && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Manager Notes</p>
                  <p className="text-sm text-foreground">{record.managerNotes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-6 pt-4 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
