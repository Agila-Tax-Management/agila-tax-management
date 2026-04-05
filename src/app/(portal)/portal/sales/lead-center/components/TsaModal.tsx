// src/app/(portal)/portal/sales/lead-center/components/TsaModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Loader2,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  FileSignature,
  Ban,
  Eye,
  Download,
} from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { ContractData } from '@/components/UI/TSAContractPDF';
import type { Lead, LeadTsaInfo, LeadQuote } from './lead-types';

// ─── Full TSA detail (returned by GET /api/sales/tsa/[id]) ────────────────────

interface FullTsaLineItem {
  negotiatedRate: string | number;
  service: { name: string; billingType: string };
  sourcePackage: { name: string } | null;
}

interface FullTsaDetail {
  id: string;
  referenceNumber: string;
  businessName: string;
  authorizedRep: string;
  email: string | null;
  phone: string | null;
  tin: string | null;
  civilStatus: string | null;
  businessAddress: string | null;
  residenceAddress: string | null;
  isBusinessRegistered: boolean;
  documentDate: string;
  quote: { lineItems: FullTsaLineItem[] } | null;
}

// ─── Service name → boolean flag helper ───────────────────────────────────────

function buildFlagsFromNames(names: string[]): Omit<ContractData,
  'clientNo' | 'businessName' | 'authorizedRep' | 'email' | 'phone' | 'tin' |
  'businessAddress' | 'residenceAddress' | 'civilStatus' | 'isBusinessRegistered' |
  'tosDate' | 'planName' | 'planPrice' | 'actualMonthlySubscription' | 'headerSrc' |
  'planServices' | 'additionalServices'
> {
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

// ─── Types ────────────────────────────────────────────────────────────────────

interface TsaModalProps {
  lead: Lead;
  tsa: LeadTsaInfo | null;
  acceptedQuote: LeadQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedLead: Lead) => void;
}

type TsaStatus = LeadTsaInfo['status'];

const STATUS_LABEL: Record<TsaStatus, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SENT_TO_CLIENT: 'Sent to Client',
  SIGNED: 'Signed',
  VOID: 'Void',
};

const STATUS_COLOR: Record<TsaStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT_TO_CLIENT: 'bg-indigo-100 text-indigo-700',
  SIGNED: 'bg-emerald-100 text-emerald-700',
  VOID: 'bg-red-100 text-red-600',
};

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

// ─── Component ────────────────────────────────────────────────────────────────

export function TsaModal({
  lead,
  tsa,
  acceptedQuote,
  isOpen,
  onClose,
  onUpdated,
}: TsaModalProps): React.ReactNode {
  const { success, error } = useToast();

  // ─── Create form state ───────────────────────────────────────────────────────
  const [businessName, setBusinessName] = useState('');
  const [authorizedRep, setAuthorizedRep] = useState('');
  const [documentDate, setDocumentDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tin, setTin] = useState('');
  const [civilStatus, setCivilStatus] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [residenceAddress, setResidenceAddress] = useState('');
  const [isBusinessRegistered, setIsBusinessRegistered] = useState(true);
  const [lockInMonths, setLockInMonths] = useState(6);
  const [billingCycleStart, setBillingCycleStart] = useState(1);

  // ─── Workflow state ──────────────────────────────────────────────────────────
  const [clientSignerName, setClientSignerName] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState<'view' | 'download' | null>(null);

  // Populate defaults from lead when opening (create mode)
  useEffect(() => {
    if (!isOpen) return;
    setBusinessName(lead.businessName ?? `${lead.firstName} ${lead.lastName}`);
    setAuthorizedRep(`${lead.firstName} ${lead.lastName}`);
    setDocumentDate(new Date().toISOString().slice(0, 10));
    setEmail('');
    setPhone(lead.contactNumber ?? '');
    setTin('');
    setCivilStatus('');
    setBusinessAddress(lead.address ?? '');
    setResidenceAddress('');
    setIsBusinessRegistered(true);
    setLockInMonths(6);
    setBillingCycleStart(1);
    setClientSignerName('');
    setPdfUrl(tsa?.pdfUrl ?? '');
  }, [isOpen, lead, tsa]);

  // ─── Refetch the lead and propagate ─────────────────────────────────────────
  const refreshLead = async (): Promise<Lead | null> => {
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`);
      const data = (await res.json()) as { data?: Lead };
      return data.data ?? null;
    } catch {
      return null;
    }
  };

  // ─── Create TSA ───────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!acceptedQuote) {
      error('No accepted quote', 'An accepted quotation is required before creating a TSA.');
      return;
    }
    if (!businessName.trim() || !authorizedRep.trim()) {
      error('Required fields', 'Business name and authorized representative are required.');
      return;
    }

    setActionLoading('create');
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}/tsa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: acceptedQuote.id,
          documentDate: new Date(documentDate).toISOString(),
          businessName: businessName.trim(),
          authorizedRep: authorizedRep.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          tin: tin.trim() || null,
          civilStatus: civilStatus.trim() || null,
          businessAddress: businessAddress.trim() || null,
          residenceAddress: residenceAddress.trim() || null,
          isBusinessRegistered,
          lockInMonths,
          billingCycleStart,
        }),
      });
      const data = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) { error('Failed to create TSA', data.error ?? 'Please try again.'); return; }
      success('TSA created', `TSA has been created and is in Draft status.`);
      const updated = await refreshLead();
      if (updated) onUpdated(updated);
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Generic action for workflow steps ───────────────────────────────────────
  const handleAction = async (action: string, extra?: Record<string, unknown>) => {
    if (!tsa) return;
    setActionLoading(action);
    try {
      const res = await fetch(`/api/sales/tsa/${tsa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = (await res.json()) as { data?: unknown; error?: string };
      if (!res.ok) { error('Action failed', data.error ?? 'Please try again.'); return; }

      const actionLabels: Record<string, string> = {
        submit_for_approval: 'TSA submitted for approval.',
        approve: 'TSA approved.',
        send_to_client: 'TSA sent to client.',
        mark_signed: 'TSA marked as signed.',
        void: 'TSA has been voided.',
      };
      success('TSA updated', actionLabels[action] ?? 'TSA has been updated.');
      const updated = await refreshLead();
      if (updated) onUpdated(updated);
      if (action === 'mark_signed') onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setActionLoading(null);
    }
  };

  const isLoading = actionLoading !== null;

  // ─── Generate PDF (preview or download) ──────────────────────────────────────
  const handleGeneratePdf = async (mode: 'view' | 'download') => {
    if (!tsa) return;
    setGeneratingPdf(mode);
    try {
      // 1. Fetch full TSA details
      const res = await fetch(`/api/sales/tsa/${tsa.id}`);
      const json = (await res.json()) as { data?: FullTsaDetail; error?: string };
      if (!res.ok || !json.data) {
        error('Failed to load TSA', json.error ?? 'Could not fetch contract details.');
        return;
      }
      const fullTsa = json.data;

      // 2. Build ContractData
      const lineItems = fullTsa.quote?.lineItems ?? [];
      const serviceNames = lineItems.map((li) => li.service.name);
      const recurringTotal = lineItems
        .filter((li) => li.service.billingType === 'RECURRING')
        .reduce((sum, li) => sum + Number(li.negotiatedRate), 0);

      const contractData: ContractData = {
        clientNo: fullTsa.referenceNumber,
        businessName: fullTsa.businessName,
        authorizedRep: fullTsa.authorizedRep,
        email: fullTsa.email ?? '',
        phone: fullTsa.phone ?? '',
        tin: fullTsa.tin ?? '',
        businessAddress: fullTsa.businessAddress ?? '',
        residenceAddress: fullTsa.residenceAddress ?? '',
        civilStatus: fullTsa.civilStatus ?? 'single',
        isBusinessRegistered: fullTsa.isBusinessRegistered,
        tosDate: new Date(fullTsa.documentDate).toISOString().slice(0, 10),
        planName: lineItems.find((li) => li.sourcePackage)?.sourcePackage?.name ?? '',
        planPrice: '',
        actualMonthlySubscription: recurringTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
        planServices: lineItems
          .filter((li) => li.service.billingType === 'RECURRING')
          .map((li) => li.service.name),
        additionalServices: lineItems
          .filter((li) => li.service.billingType === 'ONE_TIME')
          .map((li) => li.service.name),
        headerSrc: '',
        ...buildFlagsFromNames(serviceNames),
      };

      // 3. Transcode header WebP → PNG for react-pdf
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

      // 4. Generate PDF blob
      const [{ pdf }, { TSAContractPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/UI/TSAContractPDF'),
      ]);
      const el = React.createElement(
        TSAContractPDF,
        { data: { ...contractData, headerSrc } },
      ) as Parameters<typeof pdf>[0];
      const blob = await pdf(el).toBlob();

      // 5. View or download
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
        success('Contract downloaded', `Saved as "TSA-${tsa.referenceNumber}.pdf".`);
      }
    } catch {
      error('PDF Error', 'Failed to generate contract PDF. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tsa ? `TSA Contract — ${tsa.referenceNumber}` : 'Create TSA Contract'}
      size="3xl"
    >
      <div className="overflow-y-auto max-h-[80vh] px-6 py-5 space-y-5">
        {/* Client Info */}
        <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {lead.firstName} {lead.lastName}
          </span>
          {lead.businessName && <> &mdash; {lead.businessName}</>}
          {acceptedQuote && (
            <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
              Quote: {acceptedQuote.quoteNumber}
            </span>
          )}
        </div>

        {/* ── Status & Workflow (existing TSA) ── */}
        {tsa ? (
          <div className="space-y-4">
            {/* Status badge + PDF actions */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${STATUS_COLOR[tsa.status]}`}>
                {tsa.status === 'SIGNED' && <CheckCircle2 size={14} />}
                {tsa.status === 'PENDING_APPROVAL' && <Clock size={14} />}
                {STATUS_LABEL[tsa.status]}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="gap-1.5 text-xs h-auto py-1.5 px-2.5"
                  disabled={generatingPdf !== null}
                  onClick={() => { void handleGeneratePdf('view'); }}
                >
                  {generatingPdf === 'view'
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Eye size={12} />}
                  Preview Contract
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5 text-xs h-auto py-1.5 px-2.5"
                  disabled={generatingPdf !== null}
                  onClick={() => { void handleGeneratePdf('download'); }}
                >
                  {generatingPdf === 'download'
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Download size={12} />}
                  Download PDF
                </Button>
              </div>
            </div>

            {/* Workflow actions */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Workflow Actions
              </p>

              {tsa.status === 'DRAFT' && (
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                  disabled={isLoading}
                  onClick={() => { void handleAction('submit_for_approval'); }}
                >
                  {actionLoading === 'submit_for_approval'
                    ? <Loader2 size={14} className="animate-spin mr-2" />
                    : <Send size={14} className="mr-2" />}
                  Submit for Approval
                </Button>
              )}

              {tsa.status === 'PENDING_APPROVAL' && (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                  onClick={() => { void handleAction('approve'); }}
                >
                  {actionLoading === 'approve'
                    ? <Loader2 size={14} className="animate-spin mr-2" />
                    : <UserCheck size={14} className="mr-2" />}
                  Approve TSA
                </Button>
              )}

              {tsa.status === 'APPROVED' && (
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={isLoading}
                  onClick={() => { void handleAction('send_to_client'); }}
                >
                  {actionLoading === 'send_to_client'
                    ? <Loader2 size={14} className="animate-spin mr-2" />
                    : <Send size={14} className="mr-2" />}
                  Send to Client
                </Button>
              )}

              {tsa.status === 'SENT_TO_CLIENT' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      Client Signer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Full name as signed"
                      value={clientSignerName}
                      onChange={(e) => setClientSignerName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                      PDF URL <span className="font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      className={inputClass}
                      placeholder="https://drive.google.com/…"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                    />
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={isLoading || !clientSignerName.trim()}
                    onClick={() => {
                      void handleAction('mark_signed', {
                        clientSignerName: clientSignerName.trim(),
                        pdfUrl: pdfUrl.trim() || undefined,
                      });
                    }}
                  >
                    {actionLoading === 'mark_signed'
                      ? <Loader2 size={14} className="animate-spin mr-2" />
                      : <FileSignature size={14} className="mr-2" />}
                    Mark as Signed
                  </Button>
                </div>
              )}

              {tsa.status === 'SIGNED' && (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 size={16} />
                  <span>
                    Signed by <strong>{tsa.clientSignedAt ? new Date(tsa.clientSignedAt).toLocaleDateString('en-PH') : '—'}</strong>
                  </span>
                </div>
              )}

              {/* Void — available unless already signed or void */}
              {tsa.status !== 'SIGNED' && tsa.status !== 'VOID' && (
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  disabled={isLoading}
                  onClick={() => {
                    if (!confirm('Are you sure you want to void this TSA? This cannot be undone.')) return;
                    void handleAction('void');
                  }}
                >
                  {actionLoading === 'void'
                    ? <Loader2 size={14} className="animate-spin mr-2" />
                    : <Ban size={14} className="mr-2" />}
                  Void TSA
                </Button>
              )}
            </div>

            {/* Read-only snapshot */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2 text-sm">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">
                Contract Details
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Business Name</span>
                  <p className="font-medium text-foreground">{tsa.businessName}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Document Date</span>
                  <p className="font-medium text-foreground">
                    {new Date(tsa.documentDate).toLocaleDateString('en-PH')}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Reference No.</span>
                  <p className="font-medium text-foreground">{tsa.referenceNumber}</p>
                </div>
                {tsa.quoteId && (
                  <div>
                    <span className="text-xs text-muted-foreground">Linked Quote</span>
                    <p className="font-medium text-foreground">{tsa.quoteId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ── Create form ── */
          <div className="space-y-4">
            {!acceptedQuote && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
                <strong>No accepted quotation found.</strong> Please create and accept a quotation before issuing the TSA.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input type="text" className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Authorized Representative <span className="text-red-500">*</span>
                </label>
                <input type="text" className={inputClass} value={authorizedRep} onChange={(e) => setAuthorizedRep(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Document Date <span className="text-red-500">*</span></label>
                <input type="date" className={inputClass} value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TIN</label>
                <input type="text" className={inputClass} placeholder="e.g. 123-456-789" value={tin} onChange={(e) => setTin(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
                <input type="text" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Civil Status</label>
                <select className={inputClass} value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)}>
                  <option value="">— Select —</option>
                  <option>Single</option>
                  <option>Married</option>
                  <option>Widowed</option>
                  <option>Legally Separated</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Lock-in Period (months)</label>
                <input
                  type="number"
                  min={1}
                  max={36}
                  className={inputClass}
                  value={lockInMonths}
                  onChange={(e) => setLockInMonths(Math.max(1, parseInt(e.target.value, 10) || 6))}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Business Address</label>
                <input type="text" className={inputClass} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Residence Address</label>
                <input type="text" className={inputClass} value={residenceAddress} onChange={(e) => setResidenceAddress(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-border accent-blue-600"
                    checked={isBusinessRegistered}
                    onChange={(e) => setIsBusinessRegistered(e.target.checked)}
                  />
                  <span className="text-sm text-foreground">Business is registered (DTI / SEC)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button
                className="bg-[#25238e] text-white hover:bg-[#1e1c7a]"
                disabled={isLoading || !acceptedQuote || !businessName.trim() || !authorizedRep.trim()}
                onClick={() => { void handleCreate(); }}
              >
                {actionLoading === 'create'
                  ? <Loader2 size={14} className="animate-spin mr-2" />
                  : <FileSignature size={14} className="mr-2" />}
                Create TSA
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
