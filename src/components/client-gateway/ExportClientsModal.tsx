// src/components/client-gateway/ExportClientsModal.tsx
'use client';

import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileCode2, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ExportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalClients: number;
}

type ExportFormat = 'xlsx' | 'sql';

export function ExportClientsModal({
  isOpen,
  onClose,
  totalClients,
}: ExportClientsModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [downloading, setDownloading] = useState(false);
  const [done, setDone] = useState(false);

  if (!isOpen) return null;

  async function handleExport() {
    setDownloading(true);
    setDone(false);
    try {
      const res = await fetch(`/api/client-gateway/clients/export?format=${format}`);
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Export failed', json.error ?? 'Could not export clients.');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-export-${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);

      setDone(true);
      success('Export complete', `${totalClients} clients exported as ${format.toUpperCase()}.`);
    } catch {
      toastError('Export failed', 'An unexpected error occurred.');
    } finally {
      setDownloading(false);
    }
  }

  function handleClose() {
    if (downloading) return;
    setDone(false);
    setFormat('xlsx');
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Download size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-sm">Export Clients</h3>
              <p className="text-xs text-muted-foreground">{totalClients} records</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={downloading}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Choose a format to download all clients from the client registry.
          </p>

          {/* Format selector */}
          <div className="grid grid-cols-2 gap-3">
            {/* XLSX */}
            <button
              onClick={() => setFormat('xlsx')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                format === 'xlsx'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-border bg-background hover:border-indigo-200'
              }`}
            >
              <FileSpreadsheet
                size={28}
                className={format === 'xlsx' ? 'text-indigo-600' : 'text-muted-foreground'}
              />
              <span
                className={`text-xs font-bold ${
                  format === 'xlsx' ? 'text-indigo-700 dark:text-indigo-300' : 'text-muted-foreground'
                }`}
              >
                XLSX
              </span>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                Excel spreadsheet<br />easy to edit
              </span>
            </button>

            {/* SQL */}
            <button
              onClick={() => setFormat('sql')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                format === 'sql'
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-border bg-background hover:border-indigo-200'
              }`}
            >
              <FileCode2
                size={28}
                className={format === 'sql' ? 'text-indigo-600' : 'text-muted-foreground'}
              />
              <span
                className={`text-xs font-bold ${
                  format === 'sql' ? 'text-indigo-700 dark:text-indigo-300' : 'text-muted-foreground'
                }`}
              >
                SQL
              </span>
              <span className="text-[10px] text-center text-muted-foreground leading-tight">
                INSERT statements<br />for migration
              </span>
            </button>
          </div>

          {/* What's included */}
          <div className="rounded-xl bg-muted/50 border border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-1.5">Includes:</p>
            <ul className="text-xs text-muted-foreground space-y-0.5">
              <li>• Client #, Business Name, Company Code</li>
              <li>• Business Entity, Branch Type, Portal Name</li>
              <li>• Status, Owner Name, Owner Email, Date Added</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={downloading}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Exporting…
              </>
            ) : done ? (
              <>
                <CheckCircle2 size={14} /> Downloaded
              </>
            ) : (
              <>
                <Download size={14} /> Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
