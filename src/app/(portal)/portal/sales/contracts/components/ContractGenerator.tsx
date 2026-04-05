// src/app/(portal)/portal/sales/contracts/components/ContractGenerator.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Download, Eye, FileText, RotateCcw,
  ChevronDown, ChevronUp, Search, X, Loader2, UserCheck,
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/Card';
import { useToast } from '@/context/ToastContext';
import type { ContractData } from '@/components/UI/TSAContractPDF';
import type { ContractClientResult } from '@/app/api/sales/contracts/clients/route';
import type { TsaContractSearchResult } from '@/app/api/sales/contracts/leads/route';
import type { ServicePlanOption } from '@/types/accounting.types';

// ── Empty defaults ───────────────────────────────────────────────────────────

const EMPTY: ContractData = {
  clientNo: '',
  businessName: '',
  authorizedRep: '',
  email: '',
  phone: '',
  tin: '',
  businessAddress: '',
  residenceAddress: '',
  civilStatus: 'single',
  isBusinessRegistered: true,
  tosDate: new Date().toISOString().split('T')[0],
  planName: '',
  planPrice: '',
  actualMonthlySubscription: '',
  planServices: [],
  additionalServices: [],
  headerSrc: '',
  isDTI: false, isDTIReg: false, isDTIClosure: false, isBMBE: false,
  isSEC: false, isSECReg: false, isEfast: false, isStockTransfer: false,
  isSECAmendments: false, isAppointment: false, isGIS: false, isAFS: false,
  isLGU: false, isMayorReg: false, isMayorRenewal: false, isMayorClosure: false,
  isTempPermit: false, isSanitary: false, isFire: false, isCCENRO: false, isProfessionalTax: false,
  isBIR: false, isBIRReg: false, isBIRBranch: false, isBIRClosure: false,
  isORUS: false, isBooksReg: false, isInvoicePrint: false, isAddTaxType: false,
  isRentalDocStamp: false, isStocksDocStamp: false, isAuditorsReport: false, isOpenCase: false,
  isBIRCompliance: false, isEWT: false, isFWT: false, isCWT: false,
  isPercentageTax: false, isVATReturn: false, isITR: false,
  isEmployerReg: false, isSSS: false, isPhilHealth: false, isPagibig: false,
  isBIREmployer: false, isDOLE: false,
  isRemittances: false,
};

// ── Section collapse state ────────────────────────────────────────────────────

type SectionKey = 'client' | 'plan' | 'dti' | 'sec' | 'lgu' | 'bir' | 'birc' | 'emp' | 'rem';
// ── Service name → boolean flag helper ──────────────────────────────────

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
// ── Client search combobox ────────────────────────────────────────────────────

interface ClientSearchProps {
  onSelect: (client: ContractClientResult) => void;
}

function ClientSearchDropdown({ onSelect }: ClientSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ContractClientResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchClients = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales/contracts/clients?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json() as { data: ContractClientResult[] };
        setResults(json.data);
        setIsOpen(true);
      }
    } catch {
      // silently ignore network errors on search
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedLabel('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchClients(value.trim()), 300);
  }

  function handleSelect(client: ContractClientResult) {
    setSelectedLabel(`${client.businessName}${client.clientNo ? ` (${client.clientNo})` : ''}`);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(client);
  }

  function handleClear() {
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel>Search &amp; Auto-fill from Existing Client</FieldLabel>
      <div className="relative">
        {selectedLabel ? (
          <div className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border border-blue-300 bg-blue-50 text-blue-900">
            <UserCheck size={14} className="text-blue-600 shrink-0" />
            <span className="flex-1 truncate font-medium">{selectedLabel}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-blue-400 hover:text-blue-700 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {isLoading && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder="Type business name or client no..."
              className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {results.map((client) => (
              <button
                key={client.id}
                type="button"
                onClick={() => handleSelect(client)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{client.businessName}</p>
                    {client.authorizedRep && (
                      <p className="text-xs text-slate-500 truncate">{client.authorizedRep}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    {client.clientNo && (
                      <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {client.clientNo}
                      </span>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">{client.businessEntity.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && !isLoading && results.length === 0 && query.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-500">
            No clients found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

// ── Lead / TSA search combobox ────────────────────────────────────────────────

const TSA_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  SENT_TO_CLIENT: 'Sent to Client',
  SIGNED: 'Signed',
};

const TSA_STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  SENT_TO_CLIENT: 'bg-indigo-100 text-indigo-700',
  SIGNED: 'bg-emerald-100 text-emerald-700',
};

interface LeadSearchProps {
  onSelect: (result: TsaContractSearchResult) => void;
}

function LeadSearchDropdown({ onSelect }: LeadSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TsaContractSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTsas = useCallback(async (search: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sales/contracts/leads?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const json = await res.json() as { data: TsaContractSearchResult[] };
        setResults(json.data);
        setIsOpen(true);
      }
    } catch {
      // silently ignore network errors on search
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(value: string) {
    setQuery(value);
    setSelectedLabel('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => fetchTsas(value.trim()), 300);
  }

  function handleSelect(result: TsaContractSearchResult) {
    setSelectedLabel(`${result.businessName} (${result.referenceNumber})`);
    setQuery('');
    setResults([]);
    setIsOpen(false);
    onSelect(result);
  }

  function handleClear() {
    setSelectedLabel('');
    setQuery('');
    setResults([]);
    setIsOpen(false);
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <FieldLabel>Search &amp; Auto-fill from TSA / Lead Contract</FieldLabel>
      <div className="relative">
        {selectedLabel ? (
          <div className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-900">
            <UserCheck size={14} className="text-emerald-600 shrink-0" />
            <span className="flex-1 truncate font-medium">{selectedLabel}</span>
            <button
              type="button"
              onClick={handleClear}
              className="text-emerald-400 hover:text-emerald-700 transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            {isLoading && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin pointer-events-none" />
            )}
            <input
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => query.trim() && setIsOpen(true)}
              placeholder="Type business name or TSA reference no..."
              className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        )}

        {isOpen && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-64 overflow-y-auto">
            {results.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-3 hover:bg-emerald-50 transition-colors border-b border-slate-100 last:border-0"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{result.businessName}</p>
                    {result.authorizedRep && (
                      <p className="text-xs text-slate-500 truncate">{result.authorizedRep}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right space-y-0.5">
                    <span className="block text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {result.referenceNumber}
                    </span>
                    <span className={`block text-xs px-2 py-0.5 rounded font-medium ${TSA_STATUS_COLOR[result.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {TSA_STATUS_LABEL[result.status] ?? result.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {isOpen && !isLoading && results.length === 0 && query.trim().length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm text-slate-500">
            No TSA contracts found for &ldquo;{query}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

// ── PDF generation helper ─────────────────────────────────────────────────────

async function buildPdfBlob(data: ContractData): Promise<Blob> {
  // @react-pdf/renderer does NOT support WebP. We fetch the header image and
  // transcode it to PNG via an offscreen <canvas> before passing it in.
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
  } catch {
    // Header image unavailable — PDF will render without it
  }

  const [{ pdf }, { TSAContractPDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/UI/TSAContractPDF'),
  ]);
  const contractData: ContractData = { ...data, headerSrc };
  const el = React.createElement(TSAContractPDF, { data: contractData }) as Parameters<typeof pdf>[0];
  return pdf(el).toBlob();
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{children}</label>;
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
  );
}

function SelectInput({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function CheckboxRow({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 shrink-0"
      />
      <span className="text-sm text-slate-700 group-hover:text-slate-900">{label}</span>
    </label>
  );
}

function SectionHeader({
  title, open, onToggle, description,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  description?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
    >
      <div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h3>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      {open ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ContractGenerator() {
  const [data, setData] = useState<ContractData>(EMPTY);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    client: true, plan: true,
    dti: false, sec: false, lgu: false, bir: false, birc: false, emp: false, rem: false,
  });
  const [isViewing, setIsViewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [servicePlans, setServicePlans] = useState<ServicePlanOption[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    setIsLoadingPlans(true);
    fetch('/api/sales/service-plans')
      .then((r) => r.json() as Promise<{ data: ServicePlanOption[] }>)
      .then((j) => setServicePlans(j.data ?? []))
      .catch(() => { /* non-blocking */ })
      .finally(() => setIsLoadingPlans(false));
  }, []);

  function set<K extends keyof ContractData>(key: K, value: ContractData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function toggle(section: SectionKey) {
    setOpen((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function resetForm() {
    setData({ ...EMPTY, tosDate: new Date().toISOString().split('T')[0] });
  }

  function handleClientSelect(client: ContractClientResult) {
    setData((prev) => ({
      ...prev,
      clientNo: client.clientNo,
      businessName: client.businessName,
      authorizedRep: client.authorizedRep,
      email: client.email,
      phone: client.phone,
      tin: client.tin,
      businessAddress: client.businessAddress,
      residenceAddress: client.residenceAddress,
      civilStatus: client.civilStatus || 'single',
      isBusinessRegistered: client.isBusinessRegistered,
    }));
    setOpen((prev) => ({ ...prev, client: true }));
  }

  function handleLeadSelect(result: TsaContractSearchResult) {
    const flags = buildFlagsFromNames(result.serviceNames);
    setData((prev) => ({
      ...prev,
      clientNo: result.referenceNumber,
      businessName: result.businessName,
      authorizedRep: result.authorizedRep,
      email: result.email ?? '',
      phone: result.phone ?? '',
      tin: result.tin ?? '',
      businessAddress: result.businessAddress ?? '',
      residenceAddress: result.residenceAddress ?? '',
      civilStatus: result.civilStatus ?? 'single',
      isBusinessRegistered: result.isBusinessRegistered,
      tosDate: result.documentDate.slice(0, 10),
      planName: result.packageName ?? '',
      actualMonthlySubscription: result.totalMonthlyRecurring.toLocaleString('en-PH', { minimumFractionDigits: 2 }),
      planServices: result.recurringServiceNames,
      additionalServices: result.oneTimeServiceNames,
      ...flags,
    }));
    setOpen({ client: true, plan: true, dti: true, sec: true, lgu: true, bir: true, birc: true, emp: true, rem: true });
  }

  function validate(): boolean {
    if (!data.clientNo || !data.businessName || !data.authorizedRep) {
      error('Required fields missing', 'Please fill in Client No., Business Name, and Authorized Representative.');
      return false;
    }
    return true;
  }

  async function handleView() {
    if (!validate()) return;
    setIsViewing(true);
    try {
      const blob = await buildPdfBlob(data);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      success('Contract ready', 'Opened in the browser PDF viewer.');
    } catch (err) {
      console.error(err);
      error('View failed', 'Could not render the contract PDF. Please try again.');
    } finally {
      setIsViewing(false);
    }
  }

  async function handleDownload() {
    if (!validate()) return;
    setIsDownloading(true);
    try {
      const blob = await buildPdfBlob(data);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = `TSA_${data.clientNo || 'contract'}_${data.tosDate}.pdf`;
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      success('Contract downloaded', `Saved as "${filename}".`);
    } catch (err) {
      console.error(err);
      error('Download failed', 'Could not generate the contract PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  }

  const isBusy = isViewing || isDownloading;

  return (
    <div className="max-w-4xl mx-auto space-y-4">

      {/* ── Action bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <FileText size={20} className="text-purple-600" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">Contract Generator</h2>
            <p className="text-xs text-slate-500">Search a client or fill in details manually, then generate PDF</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="outline" onClick={resetForm} className="gap-2 text-sm" disabled={isBusy}>
            <RotateCcw size={14} />
            Reset
          </Button>
          <Button
            variant="outline"
            onClick={handleView}
            disabled={isBusy}
            className="gap-2 text-sm border-purple-300 text-purple-700 hover:bg-purple-50"
          >
            {isViewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
            {isViewing ? 'Opening...' : 'View PDF'}
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isBusy}
            className="gap-2 bg-purple-600 hover:bg-purple-700 text-sm"
          >
            {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isDownloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────────────── */}
      <Card className="border-slate-200 p-5 space-y-4">
        {/* Lead / TSA search — populates client info AND service checkboxes */}
        <LeadSearchDropdown onSelect={handleLeadSelect} />
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-slate-200" />
          <span className="text-xs text-slate-400 shrink-0">or search existing client</span>
          <hr className="flex-1 border-slate-200" />
        </div>
        <ClientSearchDropdown onSelect={handleClientSelect} />
        <p className="text-xs text-slate-400">
          Selecting a TSA auto-fills all fields and checks the applicable services. Selecting a client only fills in the contact info.
        </p>
      </Card>

      {/* ── Client Information ─────────────────────────────────────────── */}
      <Card className="border-slate-200 overflow-hidden">
        <SectionHeader title="Client Information" open={open.client} onToggle={() => toggle('client')} />
        {open.client && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              <div>
                <FieldLabel>Client No. *</FieldLabel>
                <TextInput value={data.clientNo} onChange={(v) => set('clientNo', v)} placeholder="e.g. ATMS-2026-001" />
              </div>
              <div>
                <FieldLabel>Document Date</FieldLabel>
                <TextInput type="date" value={data.tosDate} onChange={(v) => set('tosDate', v)} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Business Name *</FieldLabel>
                <TextInput value={data.businessName} onChange={(v) => set('businessName', v)} placeholder="Registered business name" />
              </div>
              <div>
                <FieldLabel>Authorized Representative *</FieldLabel>
                <TextInput value={data.authorizedRep} onChange={(v) => set('authorizedRep', v)} placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Email</FieldLabel>
                <TextInput type="email" value={data.email} onChange={(v) => set('email', v)} placeholder="client@email.com" />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <TextInput value={data.phone} onChange={(v) => set('phone', v)} placeholder="09xx-xxx-xxxx" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>TIN</FieldLabel>
                <TextInput value={data.tin} onChange={(v) => set('tin', v)} placeholder="000-000-000-000" />
              </div>
              <div>
                <FieldLabel>Civil Status</FieldLabel>
                <SelectInput
                  value={data.civilStatus}
                  onChange={(v) => set('civilStatus', v)}
                  options={[
                    { value: 'single', label: 'Single' },
                    { value: 'married', label: 'Married' },
                    { value: 'widowed', label: 'Widowed' },
                    { value: 'divorced', label: 'Divorced' },
                  ]}
                />
              </div>
            </div>
            <div>
              <FieldLabel>Business Address</FieldLabel>
              <TextInput value={data.businessAddress} onChange={(v) => set('businessAddress', v)} placeholder="Complete business address" />
            </div>
            <div>
              <FieldLabel>Residence Address</FieldLabel>
              <TextInput value={data.residenceAddress} onChange={(v) => set('residenceAddress', v)} placeholder="Complete residence address" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="bizRegistered"
                checked={data.isBusinessRegistered}
                onChange={(e) => set('isBusinessRegistered', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="bizRegistered" className="text-sm text-slate-700 cursor-pointer">
                Business is registered
              </label>
            </div>
          </div>
        )}
      </Card>

      {/* ── Plan & Billing ─────────────────────────────────────────────── */}
      <Card className="border-slate-200 overflow-hidden">
        <SectionHeader title="Plan & Billing" open={open.plan} onToggle={() => toggle('plan')} description="Subscription plan details shown in Section I" />
        {open.plan && (
          <div className="px-5 pb-5 space-y-4 border-t border-slate-100 pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Plan Name</FieldLabel>
                {isLoadingPlans ? (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-400 border border-slate-200 rounded-lg bg-white">
                    <Loader2 size={13} className="animate-spin" />
                    Loading plans...
                  </div>
                ) : (
                  <SelectInput
                    value={data.planName}
                    onChange={(v) => {
                      set('planName', v);
                      const plan = servicePlans.find((p) => p.name === v);
                      if (plan) {
                        set('planPrice', Number(plan.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 }));
                      }
                    }}
                    options={[
                      { value: '', label: '— Select plan —' },
                      ...servicePlans.map((p) => ({ value: p.name, label: p.name })),
                    ]}
                  />
                )}
              </div>
              <div>
                <FieldLabel>Base Plan Price (Php)</FieldLabel>
                <TextInput value={data.planPrice} onChange={(v) => set('planPrice', v)} placeholder="e.g. 1,500.00" />
              </div>
            </div>
            <div>
              <FieldLabel>Actual Monthly Subscription (Php)</FieldLabel>
              <TextInput value={data.actualMonthlySubscription} onChange={(v) => set('actualMonthlySubscription', v)} placeholder="e.g. 1,500.00" />
            </div>
          </div>
        )}
      </Card>

      {/* ── Services ──────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <p className="text-xs font-black uppercase tracking-widest text-slate-400 px-1 pb-1">
          Section II — Scope of Services
        </p>

        {/* DTI */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Department of Trade and Industry (DTI)" open={open.dti} onToggle={() => toggle('dti')} />
          {open.dti && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="Business Name Registration" checked={data.isDTI} onChange={(v) => set('isDTI', v)} />
              <CheckboxRow label="DTI Certificate of Registration" checked={data.isDTIReg} onChange={(v) => set('isDTIReg', v)} />
              <CheckboxRow label="Business Name Closure" checked={data.isDTIClosure} onChange={(v) => set('isDTIClosure', v)} />
              <CheckboxRow label="BMBE Registration" checked={data.isBMBE} onChange={(v) => set('isBMBE', v)} />
            </div>
          )}
        </Card>

        {/* SEC */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Securities and Exchange Commission (SEC)" open={open.sec} onToggle={() => toggle('sec')} />
          {open.sec && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="Corporate Registration" checked={data.isSEC} onChange={(v) => set('isSEC', v)} />
              <CheckboxRow label="SEC Registration (Certificates)" checked={data.isSECReg} onChange={(v) => set('isSECReg', v)} />
              <CheckboxRow label="eFast Registration" checked={data.isEfast} onChange={(v) => set('isEfast', v)} />
              <CheckboxRow label="Stock Transfer Book" checked={data.isStockTransfer} onChange={(v) => set('isStockTransfer', v)} />
              <CheckboxRow label="SEC Amendments" checked={data.isSECAmendments} onChange={(v) => set('isSECAmendments', v)} />
              <CheckboxRow label="Appointment of Officers (OPC)" checked={data.isAppointment} onChange={(v) => set('isAppointment', v)} />
              <CheckboxRow label="General Information Sheet (GIS)" checked={data.isGIS} onChange={(v) => set('isGIS', v)} />
              <CheckboxRow label="Audited Financial Statement (AFS)" checked={data.isAFS} onChange={(v) => set('isAFS', v)} />
            </div>
          )}
        </Card>

        {/* LGU */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Local Government Unit (LGU) / Mayor's Permit" open={open.lgu} onToggle={() => toggle('lgu')} />
          {open.lgu && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="Mayor's Permit Registration (full)" checked={data.isLGU} onChange={(v) => set('isLGU', v)} />
              <CheckboxRow label="Mayor's Permit Registration" checked={data.isMayorReg} onChange={(v) => set('isMayorReg', v)} />
              <CheckboxRow label="Mayor's Permit Renewal" checked={data.isMayorRenewal} onChange={(v) => set('isMayorRenewal', v)} />
              <CheckboxRow label="Mayor's Permit Retirement (Closure)" checked={data.isMayorClosure} onChange={(v) => set('isMayorClosure', v)} />
              <CheckboxRow label="Temporary Permit" checked={data.isTempPermit} onChange={(v) => set('isTempPermit', v)} />
              <CheckboxRow label="Sanitary Permit" checked={data.isSanitary} onChange={(v) => set('isSanitary', v)} />
              <CheckboxRow label="Fire Safety Inspection Certificate" checked={data.isFire} onChange={(v) => set('isFire', v)} />
              <CheckboxRow label="Environmental Certificate (CCENRO)" checked={data.isCCENRO} onChange={(v) => set('isCCENRO', v)} />
              <CheckboxRow label="Professional / Occupational Tax Receipt & Cedula" checked={data.isProfessionalTax} onChange={(v) => set('isProfessionalTax', v)} />
            </div>
          )}
        </Card>

        {/* BIR */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Bureau of Internal Revenue (BIR) — Registration" open={open.bir} onToggle={() => toggle('bir')} />
          {open.bir && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="BIR Business Registration" checked={data.isBIR} onChange={(v) => set('isBIR', v)} />
              <CheckboxRow label="Certificate of Registration (Form 2303)" checked={data.isBIRReg} onChange={(v) => set('isBIRReg', v)} />
              <CheckboxRow label="Add Branch" checked={data.isBIRBranch} onChange={(v) => set('isBIRBranch', v)} />
              <CheckboxRow label="Closure of Main / Branch" checked={data.isBIRClosure} onChange={(v) => set('isBIRClosure', v)} />
              <CheckboxRow label="ORUS Registration" checked={data.isORUS} onChange={(v) => set('isORUS', v)} />
              <CheckboxRow label="Books Registration" checked={data.isBooksReg} onChange={(v) => set('isBooksReg', v)} />
              <CheckboxRow label="Invoice Printing / Reprinting" checked={data.isInvoicePrint} onChange={(v) => set('isInvoicePrint', v)} />
              <CheckboxRow label="Add Tax Type" checked={data.isAddTaxType} onChange={(v) => set('isAddTaxType', v)} />
              <CheckboxRow label="Rental Documentary Stamp" checked={data.isRentalDocStamp} onChange={(v) => set('isRentalDocStamp', v)} />
              <CheckboxRow label="Stocks Documentary Stamp" checked={data.isStocksDocStamp} onChange={(v) => set('isStocksDocStamp', v)} />
              <CheckboxRow label="Auditor's Report for AFS" checked={data.isAuditorsReport} onChange={(v) => set('isAuditorsReport', v)} />
              <CheckboxRow label="Open Case Report Checking" checked={data.isOpenCase} onChange={(v) => set('isOpenCase', v)} />
            </div>
          )}
        </Card>

        {/* BIR Compliance */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Bureau of Internal Revenue (BIR) — Tax Compliance" open={open.birc} onToggle={() => toggle('birc')} />
          {open.birc && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="BIR Compliance (all applicable)" checked={data.isBIRCompliance} onChange={(v) => set('isBIRCompliance', v)} />
              <CheckboxRow label="Expanded Withholding Tax (EWT)" checked={data.isEWT} onChange={(v) => set('isEWT', v)} />
              <CheckboxRow label="Final Withholding Tax (FWT)" checked={data.isFWT} onChange={(v) => set('isFWT', v)} />
              <CheckboxRow label="Compensation Withholding Tax (CWT)" checked={data.isCWT} onChange={(v) => set('isCWT', v)} />
              <CheckboxRow label="Percentage Tax" checked={data.isPercentageTax} onChange={(v) => set('isPercentageTax', v)} />
              <CheckboxRow label="Value-Added Tax Return (VAT)" checked={data.isVATReturn} onChange={(v) => set('isVATReturn', v)} />
              <CheckboxRow label="Income Tax Return (ITR)" checked={data.isITR} onChange={(v) => set('isITR', v)} />
            </div>
          )}
        </Card>

        {/* Employer Registration */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Employer Registration & Government Contributions" open={open.emp} onToggle={() => toggle('emp')} />
          {open.emp && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxRow label="Employer Registration (all agencies)" checked={data.isEmployerReg} onChange={(v) => set('isEmployerReg', v)} />
              <CheckboxRow label="Social Security System (SSS)" checked={data.isSSS} onChange={(v) => set('isSSS', v)} />
              <CheckboxRow label="PhilHealth (PHIC)" checked={data.isPhilHealth} onChange={(v) => set('isPhilHealth', v)} />
              <CheckboxRow label="PAGIBIG (HDMF)" checked={data.isPagibig} onChange={(v) => set('isPagibig', v)} />
              <CheckboxRow label="BIR (Employer)" checked={data.isBIREmployer} onChange={(v) => set('isBIREmployer', v)} />
              <CheckboxRow label="Department of Labor and Employment (DOLE)" checked={data.isDOLE} onChange={(v) => set('isDOLE', v)} />
            </div>
          )}
        </Card>

        {/* Remittances */}
        <Card className="border-slate-200 overflow-hidden">
          <SectionHeader title="Government Remittances" open={open.rem} onToggle={() => toggle('rem')} />
          {open.rem && (
            <div className="px-5 pb-5 border-t border-slate-100 pt-4">
              <CheckboxRow
                label="Include Government Remittances section (SSS, PhilHealth, PAGIBIG, BIR contributions)"
                checked={data.isRemittances}
                onChange={(v) => set('isRemittances', v)}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Bottom download button */}
      {/* ── Bottom action row ──────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-end gap-3 pt-2">
        <Button variant="outline" onClick={resetForm} disabled={isBusy} className="gap-2">
          <RotateCcw size={14} />
          Reset Form
        </Button>
        <Button
          variant="outline"
          onClick={handleView}
          disabled={isBusy}
          className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
        >
          {isViewing ? <Loader2 size={14} className="animate-spin" /> : <Eye size={14} />}
          {isViewing ? 'Opening...' : 'View PDF'}
        </Button>
        <Button
          onClick={handleDownload}
          disabled={isBusy}
          className="gap-2 bg-purple-600 hover:bg-purple-700"
        >
          {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={16} />}
          {isDownloading ? 'Downloading...' : 'Download Contract PDF'}
        </Button>
      </div>
    </div>
  );
}
