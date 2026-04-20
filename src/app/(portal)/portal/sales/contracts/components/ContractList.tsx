// src/app/(portal)/portal/sales/contracts/components/ContractList.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, Download, Trash2, Loader2, Search, X, FileText,
  ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Clock,
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { TsaListItem } from '@/app/api/sales/tsa/route';
import type { ContractData } from '@/components/UI/TSAContractPDF';
import type { PortalRole } from '@/generated/prisma/client';

// ── Flag helper (mirrors TsaModal / ContractGenerator) ───────────────────────

type FlagFields = Omit<ContractData,
  'clientNo' | 'businessName' | 'authorizedRep' | 'email' | 'phone' | 'tin' |
  'businessAddress' | 'residenceAddress' | 'civilStatus' | 'isBusinessRegistered' |
  'tosDate' | 'planName' | 'planPrice' | 'actualMonthlySubscription' | 'headerSrc' |
  'planServices' | 'additionalServices'
>;

function buildFlagsFromNames(names: string[]): FlagFields {
  const has = (...kw: string[]) =>
    names.some((n) => kw.some((k) => n.toLowerCase().includes(k.toLowerCase())));
  return {
    isDTI: has('DTI', 'Department of Trade', 'Business Name'),
    isDTIReg: has('DTI Registration', 'DTI Certificate'),
    isDTIClosure: has('DTI Closure', 'Business Name Closure'),
    isBMBE: has('BMBE'),
    isSEC: has('SEC', 'Securities', 'Corporation'),
    isSECReg: has('SEC Registration', 'Corporate Registration', 'Incorporation'),
    isEfast: has('eFast', 'Efast'),
    isStockTransfer: has('Stock Transfer'),
    isSECAmendments: has('SEC Amendment', 'Amendment'),
    isAppointment: has('Appointment of Officers', 'One-Person Corporation'),
    isGIS: has('GIS', 'General Information Sheet'),
    isAFS: has('AFS', 'Audited Financial', 'Financial Statement'),
    isLGU: has('Mayor', 'Permit', 'LGU', 'Business Permit'),
    isMayorReg: has("Mayor's Permit Registration", 'Mayor Permit Processing'),
    isMayorRenewal: has("Mayor's Permit Renewal", 'Permit Renewal'),
    isMayorClosure: has('Mayor', 'Closure', 'Retirement'),
    isTempPermit: has('Temporary Permit'),
    isSanitary: has('Sanitary Permit'),
    isFire: has('Fire', 'Fire Safety', 'FSIC'),
    isCCENRO: has('CCENRO', 'Environmental Certificate'),
    isProfessionalTax: has('Professional Tax', 'Occupational Tax', 'Cedula'),
    isBIR: has('BIR', 'Bureau of Internal Revenue'),
    isBIRReg: has('BIR Registration', 'BIR Business Registration', 'Certificate of Registration', '2303'),
    isBIRBranch: has('Add Branch', 'Branch Registration'),
    isBIRClosure: has('BIR Closure'),
    isORUS: has('ORUS'),
    isBooksReg: has('Books Registration', 'Register Books'),
    isInvoicePrint: has('Invoice Printing', 'Official Receipt', 'Sales Invoice'),
    isAddTaxType: has('Add Tax Type', 'Tax Type'),
    isRentalDocStamp: has('Rental', 'Doc Stamp', 'Documentary Stamp'),
    isStocksDocStamp: has('Stocks', 'Doc Stamp'),
    isAuditorsReport: has("Auditor's Report", 'Auditors Report'),
    isOpenCase: has('Open Case', 'Case Report'),
    isBIRCompliance: has('Tax Return', 'ITR', 'VAT', 'Withholding', 'BIR Compliance', 'Filing'),
    isEWT: has('Expanded Withholding', 'EWT'),
    isFWT: has('Final Withholding', 'FWT'),
    isCWT: has('Compensation Withholding', 'CWT'),
    isPercentageTax: has('Percentage Tax'),
    isVATReturn: has('VAT Return', 'Value-Added Tax'),
    isITR: has('Income Tax Return', 'ITR'),
    isEmployerReg: has('Employer Registration', 'SSS', 'PhilHealth', 'PAGIBIG', 'Pag-IBIG', 'DOLE'),
    isSSS: has('SSS', 'Social Security'),
    isPhilHealth: has('PhilHealth', 'PHIC'),
    isPagibig: has('PAGIBIG', 'Pag-IBIG', 'HDMF'),
    isBIREmployer: has('BIR Employer'),
    isDOLE: has('DOLE', 'Department of Labor'),
    isRemittances: has('Remittance', 'Contribution', 'Government Remittance'),
  };
}

// ── PDF blob builder (same pattern as ContractGenerator) ─────────────────────

async function buildPdfBlobFromTsa(tsa: TsaListItem): Promise<Blob> {
  const contractData: ContractData = {
    clientNo: tsa.referenceNumber,
    businessName: tsa.businessName,
    authorizedRep: tsa.authorizedRep,
    email: tsa.email ?? '',
    phone: tsa.phone ?? '',
    tin: tsa.tin ?? '',
    businessAddress: tsa.businessAddress ?? '',
    residenceAddress: tsa.residenceAddress ?? '',
    civilStatus: tsa.civilStatus ?? 'single',
    isBusinessRegistered: tsa.isBusinessRegistered,
    tosDate: tsa.documentDate.slice(0, 10),
    planName: tsa.packageName ?? '',
    planPrice: '',
    actualMonthlySubscription: tsa.totalMonthlyRecurring.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
    planServices: [...tsa.recurringServiceNames, ...tsa.freeOneTimeServiceNames],
    additionalServices: tsa.oneTimeServicesWithPricing,
    headerSrc: '',
    ...buildFlagsFromNames(tsa.serviceNames),
  };

  // Transcode header WebP → PNG for react-pdf
  let headerSrc = '';
  try {
    const imgBlob = await fetch('/images/header.webp').then((r) => r.blob());
    const bitmapUrl = URL.createObjectURL(imgBlob);
    headerSrc = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No 2d context')); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
        URL.revokeObjectURL(bitmapUrl);
      };
      img.onerror = () => { URL.revokeObjectURL(bitmapUrl); reject(new Error('Image load failed')); };
      img.src = bitmapUrl;
    });
  } catch { /* proceed without header */ }

  const [{ pdf }, { TSAContractPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/UI/TSAContractPDF'),
  ]);
  const el = React.createElement(
    TSAContractPDF,
    { data: { ...contractData, headerSrc } },
  ) as Parameters<typeof pdf>[0];
  return pdf(el).toBlob();
}

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SENT_TO_CLIENT: 'Sent to Client',
  SIGNED: 'Signed',
  VOID: 'Void',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT_TO_CLIENT: 'bg-indigo-100 text-indigo-700',
  SIGNED: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-red-100 text-red-600',
};

const DELETABLE_STATUSES = new Set(['DRAFT', 'PENDING_APPROVAL']);

const ALL_STATUSES = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT_TO_CLIENT', 'SIGNED', 'VOID'];

// ── Service pill list ─────────────────────────────────────────────────────────

function ServicePills({ names }: { names: string[] }) {
  if (names.length === 0) return <span className="text-xs text-slate-400 italic">No services</span>;
  const visible = names.slice(0, 3);
  const rest = names.length - 3;
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((n) => (
        <span key={n} className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium truncate max-w-30">
          {n}
        </span>
      ))}
      {rest > 0 && (
        <span className="inline-block text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
          +{rest} more
        </span>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContractList(): React.ReactNode {
  const { success, error } = useToast();

  const [rows, setRows] = useState<TsaListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // PDF action state: key = tsaId, value = 'view' | 'download'
  const [pdfAction, setPdfAction] = useState<Record<string, 'view' | 'download'>>({});
  // Delete state: key = tsaId
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});
  // Confirm delete dialog
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Portal access control
  const [canEdit, setCanEdit] = useState(false);

  // Fetch portal access to determine delete permissions
  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch('/api/auth/portal-access');
        if (res.ok) {
          const data = await res.json() as {
            userRole: string;
            portals: Array<{ portal: string; role: PortalRole }>;
          };
          const salesAccess = data.portals.find((p) => p.portal === 'SALES');
          const hasEditAccess =
            data.userRole === 'SUPER_ADMIN' ||
            data.userRole === 'ADMIN' ||
            salesAccess?.role === 'ADMIN' ||
            salesAccess?.role === 'SETTINGS';
          setCanEdit(hasEditAccess);
        }
      } catch {
        setCanEdit(false);
      }
    };
    void fetchAccess();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Reset to page 1 when filters change
  const [prevFilters, setPrevFilters] = useState({ debouncedSearch, statusFilter });
  if (prevFilters.debouncedSearch !== debouncedSearch || prevFilters.statusFilter !== statusFilter) {
    setPrevFilters({ debouncedSearch, statusFilter });
    setPage(1);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/sales/tsa?${params.toString()}`);
      const json = (await res.json()) as { data: TsaListItem[]; total: number };
      if (res.ok) { setRows(json.data); setTotal(json.total); }
    } catch {
      error('Load failed', 'Could not fetch contracts.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, error]);

  useEffect(() => { void load(); }, [load]);

  // ── PDF actions ──────────────────────────────────────────────────────────────
  const handlePdf = async (tsa: TsaListItem, mode: 'view' | 'download') => {
    setPdfAction((prev) => ({ ...prev, [tsa.id]: mode }));
    try {
      const blob = await buildPdfBlobFromTsa(tsa);
      const url = URL.createObjectURL(blob);
      if (mode === 'view') {
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        success('Contract ready', 'Opened in the browser PDF viewer.');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `TSA-${tsa.referenceNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        success('Downloaded', `Saved as "TSA-${tsa.referenceNumber}.pdf".`);
      }
    } catch {
      error('PDF Error', 'Failed to generate contract PDF. Please try again.');
    } finally {
      setPdfAction((prev) => { const n = { ...prev }; delete n[tsa.id]; return n; });
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string, refNo: string) => {
    setConfirmDeleteId(null);
    setDeleting((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`/api/sales/tsa/${id}`, { method: 'DELETE' });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) { error('Delete failed', json.error ?? 'Could not delete contract.'); return; }
      success('Contract deleted', `${refNo} has been removed.`);
      setRows((prev) => prev.filter((r) => r.id !== id));
      setTotal((prev) => prev - 1);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setDeleting((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm">
        <div className="relative flex-1 min-w-50">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by business name or reference..."
            className="w-full pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s] ?? s}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => void load()}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <span className="text-xs text-slate-500 shrink-0">{total} contract{total !== 1 ? 's' : ''}</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading contracts...</span>
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm font-medium">No contracts found</p>
            {(search || statusFilter) && (
              <button type="button" onClick={() => { setSearch(''); setStatusFilter(''); }} className="text-xs text-blue-600 hover:underline mt-1">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left text-xs font-black uppercase tracking-wider text-slate-500 px-5 py-3">Reference</th>
                  <th className="text-left text-xs font-black uppercase tracking-wider text-slate-500 px-4 py-3">Business</th>
                  <th className="text-left text-xs font-black uppercase tracking-wider text-slate-500 px-4 py-3">Services</th>
                  <th className="text-left text-xs font-black uppercase tracking-wider text-slate-500 px-4 py-3">Date</th>
                  <th className="text-left text-xs font-black uppercase tracking-wider text-slate-500 px-4 py-3">Status</th>
                  <th className="text-right text-xs font-black uppercase tracking-wider text-slate-500 px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((tsa) => {
                  const isPdfBusy = tsa.id in pdfAction;
                  const isDeleting = deleting[tsa.id] ?? false;
                  const canDelete = DELETABLE_STATUSES.has(tsa.status);
                  return (
                    <tr key={tsa.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-mono text-xs font-bold text-slate-800">{tsa.referenceNumber}</div>
                        {tsa.quoteNumber && (
                          <div className="text-[10px] text-slate-400 mt-0.5">Quote: {tsa.quoteNumber}</div>
                        )}
                        {tsa.lead && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {tsa.lead.firstName} {tsa.lead.lastName}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-45">
                        <div className="font-semibold text-slate-900 truncate">{tsa.businessName}</div>
                        <div className="text-xs text-slate-500 truncate">{tsa.authorizedRep}</div>
                        {tsa.totalMonthlyRecurring > 0 && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            ₱{tsa.totalMonthlyRecurring.toLocaleString('en-PH', { minimumFractionDigits: 2 })}/mo
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 max-w-50">
                        <ServicePills names={tsa.serviceNames} />
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs text-slate-700">
                          {new Date(tsa.documentDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        {tsa.status === 'SIGNED' && tsa.clientSignedAt && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-0.5">
                            <CheckCircle2 size={10} />
                            Signed {new Date(tsa.clientSignedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {tsa.status === 'PENDING_APPROVAL' && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-600 mt-0.5">
                            <Clock size={10} />
                            Awaiting approval
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_COLOR[tsa.status] ?? 'bg-slate-100 text-slate-700'}`}>
                          {STATUS_LABEL[tsa.status] ?? tsa.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <Button
                            variant="outline"
                            className="gap-1.5 text-xs h-auto py-1.5 px-2.5"
                            disabled={isPdfBusy || isDeleting}
                            onClick={() => void handlePdf(tsa, 'view')}
                            title="Preview PDF"
                          >
                            {isPdfBusy && pdfAction[tsa.id] === 'view'
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Eye size={12} />}
                            View
                          </Button>
                          {/* Download */}
                          <Button
                            variant="outline"
                            className="gap-1.5 text-xs h-auto py-1.5 px-2.5"
                            disabled={isPdfBusy || isDeleting}
                            onClick={() => void handlePdf(tsa, 'download')}
                            title="Download PDF"
                          >
                            {isPdfBusy && pdfAction[tsa.id] === 'download'
                              ? <Loader2 size={12} className="animate-spin" />
                              : <Download size={12} />}
                            PDF
                          </Button>
                          {/* Delete — only for DRAFT / PENDING_APPROVAL */}
                          {canDelete && canEdit && (
                            <Button
                              variant="outline"
                              className="gap-1.5 text-xs h-auto py-1.5 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                              disabled={isPdfBusy || isDeleting}
                              onClick={() => setConfirmDeleteId(tsa.id)}
                              title="Delete contract"
                            >
                              {isDeleting
                                ? <Loader2 size={12} className="animate-spin" />
                                : <Trash2 size={12} />}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-slate-500">
            Page {page} of {totalPages} · {total} total
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Delete confirmation dialog ── */}
      {confirmDeleteId && (() => {
        const tsa = rows.find((r) => r.id === confirmDeleteId);
        if (!tsa) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmDeleteId(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 max-w-sm w-full mx-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-xl shrink-0">
                  <Trash2 size={18} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Delete Contract?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{tsa.referenceNumber}</span> — {tsa.businessName}
                  </p>
                  <p className="text-xs text-red-600 mt-2">This action cannot be undone.</p>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="text-sm" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  className="text-sm bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => void handleDelete(tsa.id, tsa.referenceNumber)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
