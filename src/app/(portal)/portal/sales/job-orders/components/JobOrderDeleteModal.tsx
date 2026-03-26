// src/app/(portal)/portal/sales/job-orders/components/JobOrderDeleteModal.tsx
'use client';

import React, { useState } from 'react';
import { Trash2, Loader2, X, AlertTriangle } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { JobOrderRecord } from './JobOrders';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  jobOrder: JobOrderRecord;
  onSuccess: (id: string) => void;
}

export function JobOrderDeleteModal({ isOpen, onClose, jobOrder, onSuccess }: Props): React.ReactNode {
  const { success, error } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sales/job-orders/${jobOrder.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        error('Delete failed', json.error ?? 'Could not delete this job order.');
        return;
      }
      success('Deleted', `Job order ${jobOrder.jobOrderNumber} has been deleted.`);
      onSuccess(jobOrder.id);
    } catch {
      error('Network error', 'Could not delete job order. Check your connection.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-rose-100 rounded-xl flex items-center justify-center">
              <Trash2 size={18} className="text-rose-600" />
            </div>
            <h2 className="text-base font-black text-slate-900">Delete Job Order</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-100 rounded-xl">
            <AlertTriangle size={18} className="text-rose-500 shrink-0 mt-0.5" />
            <div className="text-sm text-rose-700">
              <p className="font-semibold">This action cannot be undone.</p>
              <p className="text-xs text-rose-500 mt-0.5">
                All items attached to this job order will also be permanently deleted.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600">
            Are you sure you want to delete job order{' '}
            <span className="font-mono font-bold text-slate-800">{jobOrder.jobOrderNumber}</span>
            {' '}for{' '}
            <span className="font-semibold text-slate-800">
              {jobOrder.lead.businessName ?? `${jobOrder.lead.firstName} ${jobOrder.lead.lastName}`}
            </span>?
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete Job Order
          </button>
        </div>
      </div>
    </div>
  );
}
