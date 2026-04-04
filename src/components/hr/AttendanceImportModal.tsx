'use client';

// src/components/hr/AttendanceImportModal.tsx
import React, { useState, useRef } from 'react';
import { Upload, Download, Loader2, X, AlertCircle, CheckCircle2, ChevronLeft, ArrowRight } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ParsedRow {
  rowNum: number;
  employeeNo: string;
  date: string;
  timeIn: string;
  timeOut: string;
  lunchStart: string;
  lunchEnd: string;
  clientError?: string;
  // Server-enriched after preview API call:
  enriched: boolean;
  lunchFromSchedule: boolean;
  regularHours: number;
  otHours: number;
  lateMinutes: number;
  dailyGrossPay: number;
  willOverwrite: boolean;
  serverError?: string;
}

interface PreviewApiRow {
  rowNum: number;
  lunchStart: string | null;
  lunchEnd: string | null;
  lunchFromSchedule: boolean;
  regularHours: number;
  otHours: number;
  lateMinutes: number;
  dailyGrossPay: number;
  willOverwrite: boolean;
  error?: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; employeeNo: string; error: string }[];
}

interface AttendanceImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

const TEMPLATE_HEADERS = ['employeeNo', 'date', 'timeIn', 'timeOut', 'lunchStart', 'lunchEnd'];
const TEMPLATE_EXAMPLE_ROWS = [
  ['EMP-00001', '2026-04-01', '08:00', '17:00', '12:00', '13:00'],
  ['EMP-00002', '2026-04-01', '09:00', '18:00', '', ''],
];

// ── Normalization helpers ─────────────────────────────────────────────────────

function excelSerialToDateStr(serial: number): string {
  // Excel serial 25569 = 1970-01-01 (Unix epoch)
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function excelFractionToTimeStr(fraction: number): string {
  const totalMins = Math.round(fraction * 24 * 60);
  const h = Math.floor(totalMins / 60);
  const min = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function normalizeDate(raw: unknown): string {
  if (typeof raw === 'number' && raw > 1) return excelSerialToDateStr(raw);
  const str = String(raw ?? '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const mdy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    return `${mdy[3]!}-${String(mdy[1]).padStart(2, '0')}-${String(mdy[2]).padStart(2, '0')}`;
  }
  return str;
}

function normalizeTime(raw: unknown): string {
  if (raw === null || raw === undefined || raw === '') return '';
  if (typeof raw === 'number') {
    const frac = raw % 1;
    return frac > 0 ? excelFractionToTimeStr(frac) : '';
  }
  const str = String(raw).trim();
  if (!str) return '';
  if (/^\d{2}:\d{2}$/.test(str)) return str;
  // H:MM AM/PM
  const amPm = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (amPm) {
    let h = parseInt(amPm[1]!, 10);
    const min = amPm[2]!;
    const period = amPm[3]!.toUpperCase();
    if (period === 'AM' && h === 12) h = 0;
    else if (period === 'PM' && h !== 12) h += 12;
    return `${String(h).padStart(2, '0')}:${min}`;
  }
  // H:MM without AM/PM
  const hm = str.match(/^(\d{1,2}):(\d{2})$/);
  if (hm) return `${String(parseInt(hm[1]!, 10)).padStart(2, '0')}:${hm[2]}`;
  return '';
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AttendanceImportModal({ onClose, onImported }: AttendanceImportModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [step, setStep] = useState<'landing' | 'preview' | 'result'>('landing');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  const rowsWithError = parsedRows.filter(r => r.clientError ?? r.serverError);
  const validRows = parsedRows.filter(r => !r.clientError && !r.serverError);
  const overwriteRows = validRows.filter(r => r.willOverwrite);

  async function handleDownloadTemplate() {
    setDownloadingTemplate(true);
    try {
      const { utils, writeFile } = await import('xlsx');
      const data = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE_ROWS];
      const ws = utils.aoa_to_sheet(data);
      ws['!cols'] = [
        { wch: 14 }, // employeeNo
        { wch: 12 }, // date
        { wch: 8 },  // timeIn
        { wch: 8 },  // timeOut
        { wch: 12 }, // lunchStart
        { wch: 10 }, // lunchEnd
      ];
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Attendance');
      writeFile(wb, 'attendance_template.xlsx');
    } catch {
      toastError('Download failed', 'Could not generate the template file.');
    } finally {
      setDownloadingTemplate(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]!]!;
      const rawRows = utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

      if (rawRows.length === 0) {
        toastError('Empty file', 'No data rows found in the uploaded file.');
        return;
      }

      // ── Client-side parse + validate ──────────────────────────────────────
      const clientRows: ParsedRow[] = rawRows.map((raw, idx) => {
        const lc: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(raw)) {
          lc[k.toLowerCase().replace(/\s+/g, '')] = v;
        }

        const empNo = String(lc['employeeno'] ?? '').trim();
        const date = normalizeDate(lc['date']);
        const timeIn = normalizeTime(lc['timein']);
        const timeOut = normalizeTime(lc['timeout']);
        const lunchStart = normalizeTime(lc['lunchstart']);
        const lunchEnd = normalizeTime(lc['lunchend']);

        let clientError: string | undefined;
        if (!empNo) clientError = 'Missing employee number';
        else if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) clientError = 'Invalid date format';
        else if (!timeIn) clientError = 'Missing or invalid Time In';
        else if (!timeOut) clientError = 'Missing or invalid Time Out';

        return {
          rowNum: idx + 2,
          employeeNo: empNo,
          date,
          timeIn,
          timeOut,
          lunchStart,
          lunchEnd,
          clientError,
          enriched: false,
          lunchFromSchedule: false,
          regularHours: 0,
          otHours: 0,
          lateMinutes: 0,
          dailyGrossPay: 0,
          willOverwrite: false,
        };
      });

      // Transition immediately to preview; server enrichment starts next
      const clientValidRows = clientRows.filter(r => !r.clientError);
      setParsedRows(clientRows);
      setStep('preview');

      if (clientValidRows.length === 0) {
        setPreviewing(false);
        return;
      }

      // ── Server preview: compute hours, detect overwrites ──────────────────
      setPreviewing(true);
      const res = await fetch('/api/hr/attendance/import/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: clientValidRows.map(r => ({
            rowNum: r.rowNum,
            employeeNo: r.employeeNo,
            date: r.date,
            timeIn: r.timeIn,
            timeOut: r.timeOut,
            lunchStart: r.lunchStart || null,
            lunchEnd: r.lunchEnd || null,
          })),
        }),
      });

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Preview failed', json.error ?? 'Could not compute attendance fields.');
        setPreviewing(false);
        return;
      }

      const json = await res.json() as { data: PreviewApiRow[] };
      const enrichedByRowNum = new Map(json.data.map(r => [r.rowNum, r]));

      // Merge enriched data back into rows by rowNum
      setParsedRows(prev =>
        prev.map(row => {
          if (row.clientError) return row;
          const enriched = enrichedByRowNum.get(row.rowNum);
          if (!enriched) return row;
          return {
            ...row,
            enriched: true,
            lunchStart: enriched.lunchStart ?? row.lunchStart,
            lunchEnd: enriched.lunchEnd ?? row.lunchEnd,
            lunchFromSchedule: enriched.lunchFromSchedule,
            regularHours: enriched.regularHours,
            otHours: enriched.otHours,
            lateMinutes: enriched.lateMinutes,
            dailyGrossPay: enriched.dailyGrossPay,
            willOverwrite: enriched.willOverwrite,
            serverError: enriched.error,
          };
        }),
      );

      setPreviewing(false);
    } catch {
      toastError('Parse error', 'Could not read the file. Ensure it is a valid CSV or Excel file.');
      setPreviewing(false);
    }
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    try {
      const res = await fetch('/api/hr/attendance/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: validRows.map(r => ({
            employeeNo: r.employeeNo,
            date: r.date,
            timeIn: r.timeIn,
            timeOut: r.timeOut,
            lunchStart: r.lunchStart || null,
            lunchEnd: r.lunchEnd || null,
          })),
        }),
      });

      const json = await res.json() as { data?: ImportResult; error?: string };
      if (!res.ok) {
        toastError('Import failed', json.error ?? 'Something went wrong.');
        return;
      }

      const result = json.data!;
      setImportResult(result);
      setStep('result');
      success('Import complete', `${result.imported} record${result.imported !== 1 ? 's' : ''} imported successfully.`);
      onImported();
    } catch {
      toastError('Import failed', 'Network error. Please try again.');
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {step === 'preview' && !previewing && (
              <button
                onClick={() => { setStep('landing'); setParsedRows([]); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 mr-1"
              >
                <ChevronLeft size={18} />
              </button>
            )}
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {step === 'landing' && 'Import Attendance'}
                {step === 'preview' && (previewing ? 'Calculating…' : 'Preview Import')}
                {step === 'result' && 'Import Complete'}
              </h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {step === 'landing' && 'Upload a CSV or Excel file to bulk-import timesheet records.'}
                {step === 'preview' && !previewing && `${parsedRows.length} rows parsed · ${validRows.length} valid · ${rowsWithError.length} with errors`}
                {step === 'preview' && previewing && 'Computing hours and pay from work schedules…'}
                {step === 'result' && `${importResult?.imported ?? 0} imported · ${importResult?.skipped ?? 0} skipped`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* ── Landing ─────────────────────────────────────────────────────── */}
          {step === 'landing' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
                <p className="font-bold">Required columns</p>
                <ul className="space-y-1 text-blue-700">
                  <li>
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">employeeNo</span>
                    {' '}— e.g. <span className="font-mono">EMP-00001</span> <span className="text-blue-500">(required)</span>
                  </li>
                  <li>
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">date</span>
                    {' '}— <span className="font-mono">YYYY-MM-DD</span> or <span className="font-mono">MM/DD/YYYY</span> <span className="text-blue-500">(required)</span>
                  </li>
                  <li>
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">timeIn</span>
                    {' / '}
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">timeOut</span>
                    {' '}— <span className="font-mono">HH:MM</span> (24h) or <span className="font-mono">H:MM AM/PM</span> <span className="text-blue-500">(required)</span>
                  </li>
                  <li>
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">lunchStart</span>
                    {' / '}
                    <span className="font-mono font-bold bg-blue-100 px-1 rounded">lunchEnd</span>
                    {' '}— optional; auto-filled from the employee&apos;s work schedule break
                  </li>
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => void handleDownloadTemplate()}
                  disabled={downloadingTemplate}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all disabled:opacity-60 group text-left"
                >
                  {downloadingTemplate
                    ? <Loader2 size={32} className="text-slate-400 animate-spin" />
                    : <Download size={32} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                  }
                  <div className="text-center">
                    <p className="font-bold text-slate-800">Download Template</p>
                    <p className="text-xs text-slate-500 mt-0.5">Get the Excel template with example rows</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex flex-col items-center gap-3 p-6 border-2 border-dashed border-rose-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all group text-left"
                >
                  <Upload size={32} className="text-rose-400 group-hover:text-rose-600 transition-colors" />
                  <div className="text-center">
                    <p className="font-bold text-slate-800">Import File</p>
                    <p className="text-xs text-slate-500 mt-0.5">Upload a .csv, .xlsx, or .xls file</p>
                  </div>
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={e => void handleFileChange(e)}
                className="sr-only"
              />
            </div>
          )}

          {/* ── Preview ─────────────────────────────────────────────────────── */}
          {step === 'preview' && (
            previewing ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin text-rose-400" />
                <p className="text-sm font-medium text-slate-500">Calculating attendance fields from work schedules…</p>
                <p className="text-xs text-slate-400">This may take a moment for large files</p>
              </div>
            ) : (
              <div className="space-y-4">

                {/* Overwrite warning card */}
                {overwriteRows.length > 0 && (
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-bold text-amber-800">
                        {overwriteRows.length} row{overwriteRows.length !== 1 ? 's' : ''} will overwrite existing timesheet records
                      </p>
                      <p className="text-amber-700 mt-0.5">
                        These employees already have attendance data for the specified date. Importing will replace their punches and recalculate all computed hours.
                      </p>
                    </div>
                  </div>
                )}

                {/* Error warning card */}
                {rowsWithError.length > 0 && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-800">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <p>
                      <span className="font-bold">{rowsWithError.length} row{rowsWithError.length !== 1 ? 's' : ''}</span>
                      {' '}have errors and will be skipped. Fix and re-upload to include them.
                    </p>
                  </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm min-w-195">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-10">#</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Employee No</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Time In → Out</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Lunch</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Reg h</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">OT h</th>
                        <th className="px-3 py-2.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">₱ Gross</th>
                        <th className="px-3 py-2.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.map(row => {
                        const hasError = !!(row.clientError ?? row.serverError);
                        const errorMsg = row.clientError ?? row.serverError;
                        return (
                          <tr
                            key={row.rowNum}
                            className={`border-b border-slate-100 last:border-0 ${
                              hasError ? 'bg-red-50' : row.willOverwrite ? 'bg-amber-50/60' : ''
                            }`}
                          >
                            <td className="px-3 py-2.5 text-slate-400 font-mono text-xs">{row.rowNum}</td>
                            <td className="px-3 py-2.5 font-mono font-bold text-slate-800">{row.employeeNo || '—'}</td>
                            <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">{row.date || '—'}</td>
                            <td className="px-3 py-2.5">
                              {row.timeIn && row.timeOut ? (
                                <span className="font-mono text-xs text-slate-700 whitespace-nowrap">
                                  {row.timeIn}
                                  <ArrowRight size={10} className="inline mx-1 text-slate-400" />
                                  {row.timeOut}
                                </span>
                              ) : '—'}
                            </td>
                            <td className="px-3 py-2.5">
                              {row.lunchStart && row.lunchEnd ? (
                                <span className="font-mono text-xs text-slate-600 whitespace-nowrap">
                                  {row.lunchStart}–{row.lunchEnd}
                                  {row.lunchFromSchedule && (
                                    <span className="ml-1 text-blue-400 text-[10px] font-sans not-italic">sched</span>
                                  )}
                                </span>
                              ) : (
                                <span className="text-slate-300 text-xs italic">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-700">
                              {!hasError && row.enriched ? row.regularHours.toFixed(2) : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold">
                              {!hasError && row.enriched
                                ? row.otHours > 0
                                  ? <span className="text-violet-600">{row.otHours.toFixed(2)}</span>
                                  : <span className="text-slate-300">—</span>
                                : '—'
                              }
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-slate-700 whitespace-nowrap">
                              {!hasError && row.enriched && row.dailyGrossPay > 0
                                ? `₱${row.dailyGrossPay.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                : '—'
                              }
                            </td>
                            <td className="px-3 py-2.5">
                              {hasError ? (
                                <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                                  <AlertCircle size={11} className="shrink-0" />
                                  {errorMsg}
                                </span>
                              ) : row.willOverwrite ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 whitespace-nowrap">
                                  Will Update
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 whitespace-nowrap">
                                  <CheckCircle2 size={10} />
                                  Will Create
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ── Result ──────────────────────────────────────────────────────── */}
          {step === 'result' && importResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-emerald-700">{importResult.imported}</p>
                  <p className="text-xs text-emerald-600 font-bold uppercase tracking-wider mt-1">Imported</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-amber-700">{importResult.skipped}</p>
                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider mt-1">Skipped</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                  <p className="text-3xl font-black text-red-700">{importResult.errors.length}</p>
                  <p className="text-xs text-red-600 font-bold uppercase tracking-wider mt-1">Errors</p>
                </div>
              </div>

              {importResult.errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Error Details</p>
                  <div className="border border-red-200 rounded-xl overflow-hidden">
                    {importResult.errors.map((e, i) => (
                      <div
                        key={i}
                        className={`px-4 py-2.5 flex items-center gap-3 text-sm ${i > 0 ? 'border-t border-red-100' : ''}`}
                      >
                        <AlertCircle size={14} className="text-red-500 shrink-0" />
                        <span className="font-mono font-bold text-slate-600 shrink-0">Row {e.row}</span>
                        <span className="font-mono text-slate-700 shrink-0">{e.employeeNo}</span>
                        <span className="text-red-600 ml-auto text-right">{e.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
          {step === 'landing' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
            >
              Cancel
            </button>
          )}
          {step === 'preview' && (
            <>
              <button
                onClick={() => { setStep('landing'); setParsedRows([]); }}
                disabled={importing}
                className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={() => void handleImport()}
                disabled={validRows.length === 0 || importing || previewing}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
              >
                {importing && <Loader2 size={14} className="animate-spin" />}
                Import {validRows.length} Row{validRows.length !== 1 ? 's' : ''}
              </button>
            </>
          )}
          {step === 'result' && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
