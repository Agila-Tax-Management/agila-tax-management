// src/components/client-gateway/ImportClientsModal.tsx
'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  SkipForward,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ImportRowResult {
  row: number;
  businessName: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
}

interface ImportSummary {
  total: number;
  imported: number;
  errors: number;
  skipped: number;
  results: ImportRowResult[];
}

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'upload' | 'importing' | 'done';

export function ImportClientsModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportClientsModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [step, setStep] = useState<Step>('upload');
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── "Adjust state during render" pattern to reset when modal opens/closes ──
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setSummary(null);
      setDragOver(false);
    }
  }

  function validateFile(f: File): string | null {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(f.type) && !f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      return 'Only .xlsx / .xls files are accepted.';
    }
    if (f.size > 5 * 1024 * 1024) {
      return 'File is too large (max 5 MB).';
    }
    return null;
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f);
    if (err) {
      toastError('Invalid file', err);
      return;
    }
    setFile(f);
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  if (!isOpen) return null;

  async function handleImport() {
    if (!file) return;
    setStep('importing');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/client-gateway/clients/import', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json() as { data?: ImportSummary; error?: string };

      if (!res.ok) {
        toastError('Import failed', json.error ?? 'Could not import clients.');
        setStep('upload');
        return;
      }

      setSummary(json.data!);
      setStep('done');

      if (json.data && json.data.imported > 0) {
        success(
          'Import complete',
          `${json.data.imported} of ${json.data.total} clients imported.`,
        );
        onSuccess();
      } else {
        toastError('Nothing imported', 'All rows had errors or were skipped.');
      }
    } catch {
      toastError('Import failed', 'An unexpected error occurred.');
      setStep('upload');
    }
  }

  function downloadTemplate() {
    // Build an XLSX template entirely client-side via the xlsx package
    void (async () => {
      const XLSX = await import('xlsx');
      const headers = [
        ['Business Name', 'Business Entity', 'Portal Name', 'Branch Type', 'Client #', 'Company Code', 'Owner Name', 'Owner Email'],
        // Example row
        ['Acme Corporation', 'CORPORATION', 'acme-corp', 'MAIN', '2025-0001', 'ACME-001', 'Juan dela Cruz', 'juan@acme.com'],
      ];
      const ws = XLSX.utils.aoa_to_sheet(headers);
      ws['!cols'] = [
        { wch: 34 }, // Business Name
        { wch: 22 }, // Business Entity
        { wch: 22 }, // Portal Name
        { wch: 14 }, // Branch Type
        { wch: 14 }, // Client #
        { wch: 16 }, // Company Code
        { wch: 28 }, // Owner Name
        { wch: 30 }, // Owner Email
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'clients-import-template.xlsx';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    })();
  }

  const handleClose = () => {
    if (step === 'importing') return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card rounded-2xl shadow-2xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <Upload size={18} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="font-black text-foreground text-sm">Import Clients</h3>
              <p className="text-xs text-muted-foreground">From XLSX spreadsheet</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {/* ── UPLOAD STEP ── */}
          {(step === 'upload' || step === 'importing') && (
            <div className="flex flex-col gap-4">
              {/* Template download */}
              <div className="flex items-center justify-between rounded-xl bg-blue-50 border border-blue-200 dark:border-blue-800 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-700">
                    Use the template to ensure column headers match exactly.
                  </p>
                </div>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 ml-3 shrink-0 text-xs font-semibold text-blue-700 hover:underline"
                >
                  <Download size={12} /> Template
                </button>
              </div>

              {/* Required columns info */}
              <div className="rounded-xl bg-muted/50 border border-border p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Required columns:</p>
                <p>
                  <span className="font-mono bg-muted px-1 rounded">Business Name</span>{' '}
                  <span className="font-mono bg-muted px-1 rounded">Business Entity</span>{' '}
                  <span className="font-mono bg-muted px-1 rounded">Portal Name</span>
                </p>
                <p className="mt-1 font-semibold text-foreground">Valid Business Entity values:</p>
                <p className="font-mono">
                  INDIVIDUAL · SOLE_PROPRIETORSHIP · PARTNERSHIP · CORPORATION · COOPERATIVE
                </p>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8 px-4 ${
                  dragOver
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                    : file
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10'
                    : 'border-border hover:border-emerald-300 hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                    e.target.value = '';
                  }}
                />
                {file ? (
                  <>
                    <FileSpreadsheet size={32} className="text-emerald-500" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground break-all">{file.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · Click to change
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Upload size={28} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Drop your XLSX file here
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground">.xlsx / .xls · max 5 MB · max 500 rows</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── DONE STEP ── */}
          {step === 'done' && summary && (
            <div className="flex flex-col gap-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                  <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{summary.imported}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">Imported</p>
                </div>
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 text-center">
                  <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{summary.skipped}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-0.5">Skipped</p>
                </div>
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 text-center">
                  <p className="text-2xl font-black text-red-700 dark:text-red-300">{summary.errors}</p>
                  <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-0.5">Errors</p>
                </div>
              </div>

              {/* Row results */}
              {summary.results.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden">
                  <div className="bg-muted/60 border-b border-border px-3 py-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Row Results
                    </p>
                  </div>
                  <div className="divide-y divide-border max-h-48 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
                    {summary.results.map((r) => (
                      <div key={r.row} className="flex items-start gap-2.5 px-3 py-2.5">
                        {r.status === 'ok' && (
                          <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                        )}
                        {r.status === 'error' && (
                          <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                        )}
                        {r.status === 'skipped' && (
                          <SkipForward size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            Row {r.row} — {r.businessName}
                          </p>
                          {r.error && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{r.error}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={step === 'importing'}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-60"
          >
            {step === 'done' ? 'Close' : 'Cancel'}
          </button>

          {step !== 'done' && (
            <button
              onClick={handleImport}
              disabled={!file || step === 'importing'}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {step === 'importing' ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Importing…
                </>
              ) : (
                <>
                  <Upload size={14} /> Import Clients
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
