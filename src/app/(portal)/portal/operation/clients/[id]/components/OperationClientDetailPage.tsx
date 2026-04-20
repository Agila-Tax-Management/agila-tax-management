// src/app/(portal)/portal/operation/clients/[id]/components/OperationClientDetailPage.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, FileText, Users, UserCircle2,
  Loader2, Download, ExternalLink, Mail, ShieldCheck, ShieldOff,
  ChevronDown, Search, ClipboardList, MapPin, Edit3, Save, X,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { ClientDetail } from '@/types/client-gateway.types';

// ─── Operation overlay (from /api/operation/clients/[id]) ────────────────────

interface OperationOverlay {
  id: number;
  clientNo: string | null;
  businessName: string;
  businessEntity: string;
  active: boolean;
  onboardedDate: string;
  assignedOMId: string | null;
  assignedOM: string;
  assignedAOId: string | null;
  assignedAO: string | null;
  ownerAccountId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
  tsaUrl: string | null;
  jobOrderNumber: string | null;
  jobOrderUrl: string | null;
  jobOrderStatus: string | null;
}

interface AOUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (d: string | undefined | null) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtEntity = (e: string) =>
  e.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide';

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-border last:border-0">
      <span className={`${labelCls} sm:w-52 shrink-0`}>{label}</span>
      <span className="text-sm text-foreground font-medium flex-1">
        {value !== null && value !== undefined && value !== ''
          ? value
          : <span className="text-muted-foreground italic">—</span>}
      </span>
    </div>
  );
}

function EditableInfoRow({
  label,
  value,
  isEditing,
  name,
  formData,
  onChange,
  type = 'text',
  required = false,
}: {
  label: string;
  value: React.ReactNode;
  isEditing: boolean;
  name: string;
  formData: Record<string, unknown>;
  onChange: (name: string, value: string) => void;
  type?: 'text' | 'url' | 'date' | 'number' | 'email';
  required?: boolean;
}) {
  if (!isEditing) {
    return <InfoRow label={label} value={value} />;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-border last:border-0">
      <span className={`${labelCls} sm:w-52 shrink-0`}>{label}</span>
      <div className="flex-1">
        <input
          type={type}
          value={(formData[name] as string) ?? ''}
          onChange={(e) => onChange(name, e.target.value)}
          required={required}
          className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#25238e] focus:border-transparent"
        />
      </div>
    </div>
  );
}

function SectionDivider({ title }: { title: string }) {
  return (
    <div className="mt-5 pt-4 border-t border-border">
      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">{title}</p>
    </div>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

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

function UserAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const color = getAvatarColor(name);
  const dims = size === 'sm' ? 'w-8 h-8 text-[11px]' : 'w-10 h-10 text-xs';
  return (
    <div className={`${dims} rounded-full ${color} flex items-center justify-center shrink-0 font-black text-white`}>
      {getInitials(name)}
    </div>
  );
}

// ─── Generic Assignee Dropdown ────────────────────────────────────────────────

interface AssignDropdownProps {
  label: string;
  currentId: string | null;
  currentName: string | null;
  users: AOUser[];
  excludeId: string | null;
  patchUrl: string;
  onAssigned: (userId: string | null, name: string | null) => void;
}

function AssignDropdown({
  label, currentId, currentName, users, excludeId, patchUrl, onAssigned,
}: AssignDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = users.filter(
    (u) => u.id !== excludeId && u.name.toLowerCase().includes(search.toLowerCase())
  );

  async function assign(userId: string | null, name: string | null) {
    setSaving(true);
    setOpen(false);
    setSearch('');
    try {
      const res = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError(`Failed to assign ${label}`, json.error ?? 'An error occurred.');
        return;
      }
      onAssigned(userId, name);
      success(
        userId ? `${label} assigned` : `${label} unassigned`,
        userId ? `${name ?? ''} has been assigned as ${label}.` : `${label} removed.`
      );
    } catch {
      toastError(`Failed to assign ${label}`, 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => { if (!saving) setOpen((v) => !v); }}
        disabled={saving}
        className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-xl border border-border bg-background hover:bg-muted/50 transition disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : currentName ? (
          <>
            <UserAvatar name={currentName} size="sm" />
            <span className="font-semibold text-foreground">{currentName}</span>
          </>
        ) : (
          <span className="text-muted-foreground">Assign {label}</span>
        )}
        <ChevronDown size={13} className={`text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-border rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
              <Search size={13} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label}…`}
                className="bg-transparent text-xs text-foreground placeholder-muted-foreground outline-none flex-1"
              />
            </div>
          </div>
          <ul className="max-h-56 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            <li>
              <button
                onClick={() => void assign(null, null)}
                className="w-full text-left px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/50 transition"
              >
                — Unassign
              </button>
            </li>
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-muted-foreground text-center">No employees found</li>
            ) : (
              filtered.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => void assign(u.id, u.name)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition hover:bg-[#25238e]/5 hover:text-[#25238e] ${
                      currentId === u.id ? 'bg-[#25238e]/5 text-[#25238e] font-bold' : 'text-foreground'
                    }`}
                  >
                    <UserAvatar name={u.name} size="sm" />
                    <div className="min-w-0 text-left">
                      <p className="font-semibold truncate">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{u.role}</p>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Tab Definitions ──────────────────────────────────────────────────────────

type TabId =
  | 'core'
  | 'bir'
  | 'individual'
  | 'business'
  | 'corporate'
  | 'shareholders'
  | 'portal-users'
  | 'owner'
  | 'tsa'
  | 'job-order';

const ALL_TABS: { id: TabId; label: string; icon: React.ReactNode; alwaysShow: boolean }[] = [
  { id: 'core',         label: 'Core Info',          icon: <Building2 size={14} />,    alwaysShow: true  },
  { id: 'bir',          label: 'BIR Info',            icon: <FileText size={14} />,     alwaysShow: true  },
  { id: 'individual',   label: 'Owner / Individual',  icon: <UserCircle2 size={14} />,  alwaysShow: false },
  { id: 'business',     label: 'Business Operations', icon: <MapPin size={14} />,       alwaysShow: false },
  { id: 'corporate',    label: 'Corporate Details',   icon: <ShieldCheck size={14} />,  alwaysShow: false },
  { id: 'shareholders', label: 'Shareholders',        icon: <Users size={14} />,        alwaysShow: false },
  { id: 'portal-users', label: 'Portal Users',        icon: <Users size={14} />,        alwaysShow: true  },
  { id: 'owner',        label: 'Owner Account',       icon: <UserCircle2 size={14} />,  alwaysShow: true  },
  { id: 'tsa',          label: 'Signed TSA',          icon: <FileText size={14} />,     alwaysShow: true  },
  { id: 'job-order',    label: 'Job Order',           icon: <ClipboardList size={14} />, alwaysShow: true },
];

function getVisibleTabs(entity: string): TabId[] {
  return ALL_TABS
    .filter((t) => {
      if (t.alwaysShow) return true;
      if (t.id === 'individual') return entity === 'INDIVIDUAL' || entity === 'SOLE_PROPRIETORSHIP';
      if (t.id === 'business') return entity !== 'INDIVIDUAL';
      if (t.id === 'corporate') return entity === 'CORPORATION' || entity === 'COOPERATIVE';
      if (t.id === 'shareholders') return entity === 'CORPORATION';
      return false;
    })
    .map((t) => t.id);
}

// ─── Status styles ────────────────────────────────────────────────────────────

const OWNER_STATUS_STYLE: Record<'ACTIVE' | 'INACTIVE' | 'SUSPENDED', string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-slate-100 text-slate-500',
  SUSPENDED: 'bg-red-100 text-red-700',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function OperationClientDetailPage({ clientId }: { clientId: number }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [detail, setDetail] = useState<ClientDetail | null>(null);
  const [overlay, setOverlay] = useState<OperationOverlay | null>(null);
  const [employees, setEmployees] = useState<AOUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('core');
  const [togglingStatus, setTogglingStatus] = useState(false);
  
  // Edit mode states
  const [editingCore, setEditingCore] = useState(false);
  const [editingBir, setEditingBir] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState(false);
  const [editingIndividual, setEditingIndividual] = useState(false);
  
  // Form data states
  const [coreForm, setCoreForm] = useState<Record<string, unknown>>({});
  const [birForm, setBirForm] = useState<Record<string, unknown>>({});
  const [businessForm, setBusinessForm] = useState<Record<string, unknown>>({});
  const [corporateForm, setCorporateForm] = useState<Record<string, unknown>>({});
  const [individualForm, setIndividualForm] = useState<Record<string, unknown>>({});
  
  // Saving states
  const [savingCore, setSavingCore] = useState(false);
  const [savingBir, setSavingBir] = useState(false);
  const [savingBusiness, setSavingBusiness] = useState(false);
  const [savingCorporate, setSavingCorporate] = useState(false);
  const [savingIndividual, setSavingIndividual] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [detailRes, overlayRes, empRes] = await Promise.all([
        fetch(`/api/client-gateway/clients/${clientId}`),
        fetch(`/api/operation/clients/${clientId}`),
        fetch('/api/operation/employees'),
      ]);

      if (!overlayRes.ok) {
        toastError('Load failed', 'Could not fetch client details.');
        return;
      }

      const overlayJson = await overlayRes.json() as { data: OperationOverlay };
      setOverlay(overlayJson.data);

      if (detailRes.ok) {
        const detailJson = await detailRes.json() as { data: ClientDetail };
        setDetail(detailJson.data);
      }

      if (empRes.ok) {
        const empJson = await empRes.json() as { data: AOUser[] };
        setEmployees(empJson.data);
      }
    } catch {
      toastError('Load failed', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, [clientId, toastError]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  async function toggleOwnerStatus() {
    if (!overlay?.ownerAccountId || !overlay.ownerStatus) return;
    const nextStatus = (overlay.ownerStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE';
    setTogglingStatus(true);
    try {
      const res = await fetch(`/api/admin/settings/client-users/${overlay.ownerAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Status update failed', json.error ?? 'Could not update status.');
        return;
      }
      setOverlay((prev) => prev ? { ...prev, ownerStatus: nextStatus } : prev);
      success('Account updated', `Owner account is now ${nextStatus.toLowerCase()}.`);
    } catch {
      toastError('Status update failed', 'An unexpected error occurred.');
    } finally {
      setTogglingStatus(false);
    }
  }

  // ─── Form Handlers ────────────────────────────────────────────────────────

  function startEditCore() {
    setCoreForm({
      businessName: detail?.businessName ?? '',
      companyCode: detail?.companyCode ?? '',
      portalName: detail?.portalName ?? '',
      branchType: detail?.branchType ?? 'MAIN',
      timezone: detail?.timezone ?? 'Asia/Manila',
      dayResetTime: detail?.dayResetTime ?? '00:00:00',
      workingDayStarts: detail?.workingDayStarts ?? '09:00:00',
    });
    setEditingCore(true);
  }

  function startEditBir() {
    setBirForm({
      tin: detail?.birInfo?.tin ?? '',
      branchCode: detail?.birInfo?.branchCode ?? '0000',
      rdoCode: detail?.birInfo?.rdoCode ?? '',
      registeredAddress: detail?.birInfo?.registeredAddress ?? '',
      zipCode: detail?.birInfo?.zipCode ?? '',
      contactNumber: detail?.birInfo?.contactNumber ?? '',
      isWithholdingAgent: detail?.birInfo?.isWithholdingAgent ?? false,
      withholdingCategory: detail?.birInfo?.withholdingCategory ?? '',
      corUrl: detail?.birInfo?.corUrl ?? '',
    });
    setEditingBir(true);
  }

  function startEditBusiness() {
    setBusinessForm({
      tradeName: detail?.businessDetails?.tradeName ?? '',
      industry: detail?.businessDetails?.industry ?? '',
      lineOfBusiness: detail?.businessDetails?.lineOfBusiness ?? '',
      psicCode: detail?.businessDetails?.psicCode ?? '',
      businessAreaSqm: detail?.businessDetails?.businessAreaSqm ?? '',
      noOfManagers: detail?.businessDetails?.noOfManagers ?? 0,
      noOfSupervisors: detail?.businessDetails?.noOfSupervisors ?? 0,
      noOfRankAndFile: detail?.businessDetails?.noOfRankAndFile ?? 0,
      landlineNumber: detail?.businessDetails?.landlineNumber ?? '',
      faxNumber: detail?.businessDetails?.faxNumber ?? '',
      placeType: detail?.businessDetails?.placeType ?? 'RENTED',
      lessorName: detail?.businessDetails?.lessorName ?? '',
      lessorAddress: detail?.businessDetails?.lessorAddress ?? '',
      monthlyRent: detail?.businessDetails?.monthlyRent ?? '',
      isNotarized: detail?.businessDetails?.isNotarized ?? false,
      hasDocStamp: detail?.businessDetails?.hasDocStamp ?? false,
    });
    setEditingBusiness(true);
  }

  function startEditCorporate() {
    setCorporateForm({
      secRegistrationNo: detail?.corporateDetails?.secRegistrationNo ?? '',
      acronym: detail?.corporateDetails?.acronym ?? '',
      suffix: detail?.corporateDetails?.suffix ?? '',
      companyClassification: detail?.corporateDetails?.companyClassification ?? '',
      companySubclass: detail?.corporateDetails?.companySubclass ?? '',
      dateOfIncorporation: detail?.corporateDetails?.dateOfIncorporation ?? '',
      termOfExistence: detail?.corporateDetails?.termOfExistence ?? '',
      primaryPurpose: detail?.corporateDetails?.primaryPurpose ?? '',
      annualMeetingDate: detail?.corporateDetails?.annualMeetingDate ?? '',
      numberOfIncorporators: detail?.corporateDetails?.numberOfIncorporators ?? 0,
      authorizedCapital: detail?.corporateDetails?.authorizedCapital ?? '',
      subscribedCapital: detail?.corporateDetails?.subscribedCapital ?? '',
      paidUpCapital: detail?.corporateDetails?.paidUpCapital ?? '',
      presidentFirstName: detail?.corporateDetails?.presidentFirstName ?? '',
      presidentMiddleName: detail?.corporateDetails?.presidentMiddleName ?? '',
      presidentLastName: detail?.corporateDetails?.presidentLastName ?? '',
      presidentTin: detail?.corporateDetails?.presidentTin ?? '',
      presidentEmail: detail?.corporateDetails?.presidentEmail ?? '',
      treasurerFirstName: detail?.corporateDetails?.treasurerFirstName ?? '',
      treasurerMiddleName: detail?.corporateDetails?.treasurerMiddleName ?? '',
      treasurerLastName: detail?.corporateDetails?.treasurerLastName ?? '',
      treasurerTin: detail?.corporateDetails?.treasurerTin ?? '',
      treasurerEmail: detail?.corporateDetails?.treasurerEmail ?? '',
      secretaryFirstName: detail?.corporateDetails?.secretaryFirstName ?? '',
      secretaryMiddleName: detail?.corporateDetails?.secretaryMiddleName ?? '',
      secretaryLastName: detail?.corporateDetails?.secretaryLastName ?? '',
      secretaryTin: detail?.corporateDetails?.secretaryTin ?? '',
      secretaryEmail: detail?.corporateDetails?.secretaryEmail ?? '',
    });
    setEditingCorporate(true);
  }

  function startEditIndividual() {
    setIndividualForm({
      firstName: detail?.individualDetails?.firstName ?? '',
      middleName: detail?.individualDetails?.middleName ?? '',
      lastName: detail?.individualDetails?.lastName ?? '',
      dob: detail?.individualDetails?.dob ?? '',
      civilStatus: detail?.individualDetails?.civilStatus ?? '',
      gender: detail?.individualDetails?.gender ?? '',
      citizenship: detail?.individualDetails?.citizenship ?? 'Filipino',
      placeOfBirth: detail?.individualDetails?.placeOfBirth ?? '',
      residentialAddress: detail?.individualDetails?.residentialAddress ?? '',
      prcLicenseNo: detail?.individualDetails?.prcLicenseNo ?? '',
      primaryIdType: detail?.individualDetails?.primaryIdType ?? '',
      primaryIdNumber: detail?.individualDetails?.primaryIdNumber ?? '',
      personalEmail: detail?.individualDetails?.personalEmail ?? '',
      mobileNumber: detail?.individualDetails?.mobileNumber ?? '',
      telephoneNumber: detail?.individualDetails?.telephoneNumber ?? '',
      motherFirstName: detail?.individualDetails?.motherFirstName ?? '',
      motherMiddleName: detail?.individualDetails?.motherMiddleName ?? '',
      motherLastName: detail?.individualDetails?.motherLastName ?? '',
      fatherFirstName: detail?.individualDetails?.fatherFirstName ?? '',
      fatherMiddleName: detail?.individualDetails?.fatherMiddleName ?? '',
      fatherLastName: detail?.individualDetails?.fatherLastName ?? '',
      spouseFirstName: detail?.individualDetails?.spouseFirstName ?? '',
      spouseMiddleName: detail?.individualDetails?.spouseMiddleName ?? '',
      spouseLastName: detail?.individualDetails?.spouseLastName ?? '',
      spouseEmploymentStatus: detail?.individualDetails?.spouseEmploymentStatus ?? '',
      spouseTin: detail?.individualDetails?.spouseTin ?? '',
    });
    setEditingIndividual(true);
  }

  function handleFormChange(
    setter: React.Dispatch<React.SetStateAction<Record<string, unknown>>>,
    name: string,
    value: string
  ) {
    setter((prev) => ({ ...prev, [name]: value }));
  }

  async function saveCore() {
    setSavingCore(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/core`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(coreForm),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Save failed', json.error ?? 'Could not update core information.');
        return;
      }
      await fetchAll();
      setEditingCore(false);
      success('Core info updated', 'Client core information has been saved.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setSavingCore(false);
    }
  }

  async function saveBir() {
    setSavingBir(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/bir`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birForm),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Save failed', json.error ?? 'Could not update BIR information.');
        return;
      }
      await fetchAll();
      setEditingBir(false);
      success('BIR info updated', 'BIR information has been saved.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setSavingBir(false);
    }
  }

  async function saveBusiness() {
    setSavingBusiness(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/business`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessForm),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Save failed', json.error ?? 'Could not update business operations.');
        return;
      }
      await fetchAll();
      setEditingBusiness(false);
      success('Business info updated', 'Business operations have been saved.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setSavingBusiness(false);
    }
  }

  async function saveCorporate() {
    setSavingCorporate(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/corporate`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corporateForm),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Save failed', json.error ?? 'Could not update corporate details.');
        return;
      }
      await fetchAll();
      setEditingCorporate(false);
      success('Corporate info updated', 'Corporate details have been saved.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setSavingCorporate(false);
    }
  }

  async function saveIndividual() {
    setSavingIndividual(true);
    try {
      const res = await fetch(`/api/operation/clients/${clientId}/individual`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(individualForm),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        toastError('Save failed', json.error ?? 'Could not update individual details.');
        return;
      }
      await fetchAll();
      setEditingIndividual(false);
      success('Individual info updated', 'Individual details have been saved.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setSavingIndividual(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#25238e]" />
      </div>
    );
  }

  if (!overlay) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Client not found.</p>
        <button onClick={() => router.back()} className="text-sm text-[#25238e] underline">
          Go back
        </button>
      </div>
    );
  }

  const visibleTabs = getVisibleTabs(overlay.businessEntity);
  const displayName = detail?.businessName ?? overlay.businessName;
  const isActive = detail?.active ?? overlay.active;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-black text-foreground truncate">{displayName}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {overlay.clientNo && <span>{overlay.clientNo} &nbsp;·&nbsp;</span>}
              {detail?.companyCode && <span>{detail.companyCode} &nbsp;·&nbsp;</span>}
              <span>{fmtEntity(overlay.businessEntity)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div className="px-6 border-b border-border shrink-0 overflow-x-auto">
        <div className="flex gap-0">
          {ALL_TABS.filter((t) => visibleTabs.includes(t.id)).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-[#25238e] text-[#25238e]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-6 py-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* CORE INFO ───────────────────────────────────────────── */}
        {activeTab === 'core' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground text-base">Core Information</h3>
              <div className="flex items-center gap-2">
                {editingCore ? (
                  <>
                    <button
                      onClick={() => setEditingCore(false)}
                      disabled={savingCore}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition disabled:opacity-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={() => void saveCore()}
                      disabled={savingCore}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25238e] hover:bg-[#1e1b6f] rounded-xl transition disabled:opacity-50"
                    >
                      {savingCore ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingCore ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditCore}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#25238e] bg-[#25238e]/5 hover:bg-[#25238e]/10 rounded-xl transition"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
            <EditableInfoRow
              label="Business Name"
              value={displayName}
              isEditing={editingCore}
              name="businessName"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
              required
            />
            <EditableInfoRow
              label="Company Code"
              value={detail?.companyCode}
              isEditing={editingCore}
              name="companyCode"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
            />
            <InfoRow label="Client Number" value={overlay.clientNo} />
            <EditableInfoRow
              label="Portal Name"
              value={detail?.portalName}
              isEditing={editingCore}
              name="portalName"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
              required
            />
            <InfoRow label="Business Entity" value={fmtEntity(overlay.businessEntity)} />
            <InfoRow label="Branch Type" value={detail?.branchType} />
            <InfoRow
              label="Status"
              value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              }
            />
            <EditableInfoRow
              label="Timezone"
              value={detail?.timezone}
              isEditing={editingCore}
              name="timezone"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
            />
            <EditableInfoRow
              label="Day Reset Time"
              value={detail?.dayResetTime}
              isEditing={editingCore}
              name="dayResetTime"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
            />
            <EditableInfoRow
              label="Working Day Starts"
              value={detail?.workingDayStarts}
              isEditing={editingCore}
              name="workingDayStarts"
              formData={coreForm}
              onChange={(name, value) => handleFormChange(setCoreForm, name, value)}
            />
            <InfoRow label="Date Onboarded" value={fmtDate(overlay.onboardedDate)} />

            <SectionDivider title="Operations Assignment" />
            <InfoRow
              label="Operations Manager"
              value={
                <AssignDropdown
                  label="Operations Manager"
                  currentId={overlay.assignedOMId}
                  currentName={overlay.assignedOM !== '—' ? overlay.assignedOM : null}
                  users={employees}
                  excludeId={overlay.assignedAOId}
                  patchUrl={`/api/operation/clients/${clientId}/assign-om`}
                  onAssigned={(userId, name) =>
                    setOverlay((prev) => prev ? { ...prev, assignedOMId: userId, assignedOM: name ?? '—' } : prev)
                  }
                />
              }
            />
            <InfoRow
              label="Account Officer"
              value={
                <AssignDropdown
                  label="Account Officer"
                  currentId={overlay.assignedAOId}
                  currentName={overlay.assignedAO}
                  users={employees}
                  excludeId={overlay.assignedOMId}
                  patchUrl={`/api/operation/clients/${clientId}/assign-ao`}
                  onAssigned={(userId, name) =>
                    setOverlay((prev) => prev ? { ...prev, assignedAOId: userId, assignedAO: name } : prev)
                  }
                />
              }
            />
          </div>
        )}

        {/* BIR INFO ────────────────────────────────────────────── */}
        {activeTab === 'bir' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground text-base">BIR Information</h3>
              <div className="flex items-center gap-2">
                {editingBir ? (
                  <>
                    <button
                      onClick={() => setEditingBir(false)}
                      disabled={savingBir}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition disabled:opacity-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={() => void saveBir()}
                      disabled={savingBir}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25238e] hover:bg-[#1e1b6f] rounded-xl transition disabled:opacity-50"
                    >
                      {savingBir ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingBir ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditBir}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#25238e] bg-[#25238e]/5 hover:bg-[#25238e]/10 rounded-xl transition"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
            <EditableInfoRow
              label="TIN"
              value={detail?.birInfo?.tin ? <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{detail.birInfo.tin}</span> : null}
              isEditing={editingBir}
              name="tin"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
              required
            />
            <EditableInfoRow
              label="Branch Code"
              value={detail?.birInfo?.branchCode}
              isEditing={editingBir}
              name="branchCode"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            <EditableInfoRow
              label="RDO Code"
              value={detail?.birInfo?.rdoCode}
              isEditing={editingBir}
              name="rdoCode"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            <EditableInfoRow
              label="Registered Address"
              value={detail?.birInfo?.registeredAddress}
              isEditing={editingBir}
              name="registeredAddress"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            <EditableInfoRow
              label="Zip Code"
              value={detail?.birInfo?.zipCode}
              isEditing={editingBir}
              name="zipCode"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            <EditableInfoRow
              label="Contact Number"
              value={detail?.birInfo?.contactNumber}
              isEditing={editingBir}
              name="contactNumber"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            <InfoRow label="Withholding Agent" value={detail?.birInfo?.isWithholdingAgent != null ? (detail.birInfo.isWithholdingAgent ? 'Yes' : 'No') : null} />
            <EditableInfoRow
              label="Withholding Category"
              value={detail?.birInfo?.withholdingCategory}
              isEditing={editingBir}
              name="withholdingCategory"
              formData={birForm}
              onChange={(name, value) => handleFormChange(setBirForm, name, value)}
            />
            {editingBir ? (
              <EditableInfoRow
                label="COR Document URL"
                value={detail?.birInfo?.corUrl}
                isEditing={true}
                name="corUrl"
                formData={birForm}
                onChange={(name, value) => handleFormChange(setBirForm, name, value)}
                type="url"
              />
            ) : (
              <InfoRow
                label="COR Document"
                value={
                  detail?.birInfo?.corUrl
                    ? <a href={detail.birInfo.corUrl} target="_blank" rel="noopener noreferrer" className="text-[#25238e] underline text-xs flex items-center gap-1"><ExternalLink size={12} /> View Document</a>
                    : null
                }
              />
            )}
          </div>
        )}

        {/* OWNER / INDIVIDUAL ──────────────────────────────────── */}
        {activeTab === 'individual' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground text-base">Owner / Individual Details</h3>
              <div className="flex items-center gap-2">
                {editingIndividual ? (
                  <>
                    <button
                      onClick={() => setEditingIndividual(false)}
                      disabled={savingIndividual}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition disabled:opacity-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={() => void saveIndividual()}
                      disabled={savingIndividual}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25238e] hover:bg-[#1e1b6f] rounded-xl transition disabled:opacity-50"
                    >
                      {savingIndividual ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingIndividual ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditIndividual}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#25238e] bg-[#25238e]/5 hover:bg-[#25238e]/10 rounded-xl transition"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
            {editingIndividual ? (
              <>
                <EditableInfoRow label="First Name" value={detail?.individualDetails?.firstName} isEditing={true} name="firstName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} required />
                <EditableInfoRow label="Middle Name" value={detail?.individualDetails?.middleName} isEditing={true} name="middleName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Last Name" value={detail?.individualDetails?.lastName} isEditing={true} name="lastName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} required />
              </>
            ) : (
              <InfoRow
                label="Full Name"
                value={[
                  detail?.individualDetails?.firstName,
                  detail?.individualDetails?.middleName,
                  detail?.individualDetails?.lastName,
                ].filter(Boolean).join(' ') || null}
              />
            )}
            <EditableInfoRow label="Date of Birth" value={detail?.individualDetails?.dob} isEditing={editingIndividual} name="dob" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} type="date" />
            <EditableInfoRow label="Civil Status" value={detail?.individualDetails?.civilStatus} isEditing={editingIndividual} name="civilStatus" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Gender" value={detail?.individualDetails?.gender} isEditing={editingIndividual} name="gender" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Citizenship" value={detail?.individualDetails?.citizenship} isEditing={editingIndividual} name="citizenship" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Place of Birth" value={detail?.individualDetails?.placeOfBirth} isEditing={editingIndividual} name="placeOfBirth" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Residential Address" value={detail?.individualDetails?.residentialAddress} isEditing={editingIndividual} name="residentialAddress" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="PRC License No." value={detail?.individualDetails?.prcLicenseNo} isEditing={editingIndividual} name="prcLicenseNo" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Primary ID Type" value={detail?.individualDetails?.primaryIdType} isEditing={editingIndividual} name="primaryIdType" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Primary ID Number" value={detail?.individualDetails?.primaryIdNumber} isEditing={editingIndividual} name="primaryIdNumber" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Personal Email" value={detail?.individualDetails?.personalEmail} isEditing={editingIndividual} name="personalEmail" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} type="email" />
            <EditableInfoRow label="Mobile Number" value={detail?.individualDetails?.mobileNumber} isEditing={editingIndividual} name="mobileNumber" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Telephone Number" value={detail?.individualDetails?.telephoneNumber} isEditing={editingIndividual} name="telephoneNumber" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />

            <SectionDivider title="Family Background" />
            {editingIndividual ? (
              <>
                <EditableInfoRow label="Mother's First Name" value={detail?.individualDetails?.motherFirstName} isEditing={true} name="motherFirstName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Mother's Middle Name" value={detail?.individualDetails?.motherMiddleName} isEditing={true} name="motherMiddleName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Mother's Last Name" value={detail?.individualDetails?.motherLastName} isEditing={true} name="motherLastName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Mother's Name" value={[detail?.individualDetails?.motherFirstName, detail?.individualDetails?.motherMiddleName, detail?.individualDetails?.motherLastName].filter(Boolean).join(' ') || null} />
            )}
            {editingIndividual ? (
              <>
                <EditableInfoRow label="Father's First Name" value={detail?.individualDetails?.fatherFirstName} isEditing={true} name="fatherFirstName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Father's Middle Name" value={detail?.individualDetails?.fatherMiddleName} isEditing={true} name="fatherMiddleName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Father's Last Name" value={detail?.individualDetails?.fatherLastName} isEditing={true} name="fatherLastName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Father's Name" value={[detail?.individualDetails?.fatherFirstName, detail?.individualDetails?.fatherMiddleName, detail?.individualDetails?.fatherLastName].filter(Boolean).join(' ') || null} />
            )}
            {editingIndividual ? (
              <>
                <EditableInfoRow label="Spouse First Name" value={detail?.individualDetails?.spouseFirstName} isEditing={true} name="spouseFirstName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Spouse Middle Name" value={detail?.individualDetails?.spouseMiddleName} isEditing={true} name="spouseMiddleName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
                <EditableInfoRow label="Spouse Last Name" value={detail?.individualDetails?.spouseLastName} isEditing={true} name="spouseLastName" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Spouse Name" value={[detail?.individualDetails?.spouseFirstName, detail?.individualDetails?.spouseMiddleName, detail?.individualDetails?.spouseLastName].filter(Boolean).join(' ') || null} />
            )}
            <EditableInfoRow label="Spouse Employment" value={detail?.individualDetails?.spouseEmploymentStatus} isEditing={editingIndividual} name="spouseEmploymentStatus" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
            <EditableInfoRow label="Spouse TIN" value={detail?.individualDetails?.spouseTin} isEditing={editingIndividual} name="spouseTin" formData={individualForm} onChange={(name, value) => handleFormChange(setIndividualForm, name, value)} />
          </div>
        )}

        {/* BUSINESS OPERATIONS ─────────────────────────────────── */}
        {activeTab === 'business' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground text-base">Business Operations</h3>
              <div className="flex items-center gap-2">
                {editingBusiness ? (
                  <>
                    <button
                      onClick={() => setEditingBusiness(false)}
                      disabled={savingBusiness}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition disabled:opacity-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={() => void saveBusiness()}
                      disabled={savingBusiness}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25238e] hover:bg-[#1e1b6f] rounded-xl transition disabled:opacity-50"
                    >
                      {savingBusiness ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingBusiness ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditBusiness}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#25238e] bg-[#25238e]/5 hover:bg-[#25238e]/10 rounded-xl transition"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
            <EditableInfoRow label="Trade Name" value={detail?.businessDetails?.tradeName} isEditing={editingBusiness} name="tradeName" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <EditableInfoRow label="Industry" value={detail?.businessDetails?.industry} isEditing={editingBusiness} name="industry" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <EditableInfoRow label="Line of Business" value={detail?.businessDetails?.lineOfBusiness} isEditing={editingBusiness} name="lineOfBusiness" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <EditableInfoRow label="PSIC Code" value={detail?.businessDetails?.psicCode} isEditing={editingBusiness} name="psicCode" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <EditableInfoRow label="Business Area (sqm)" value={detail?.businessDetails?.businessAreaSqm} isEditing={editingBusiness} name="businessAreaSqm" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <InfoRow label="Place Type" value={detail?.businessDetails?.placeType} />
            <EditableInfoRow label="Landline" value={detail?.businessDetails?.landlineNumber} isEditing={editingBusiness} name="landlineNumber" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
            <EditableInfoRow label="Fax" value={detail?.businessDetails?.faxNumber} isEditing={editingBusiness} name="faxNumber" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />

            <SectionDivider title="Headcount" />
            <EditableInfoRow label="Managers" value={detail?.businessDetails?.noOfManagers?.toString()} isEditing={editingBusiness} name="noOfManagers" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} type="number" />
            <EditableInfoRow label="Supervisors" value={detail?.businessDetails?.noOfSupervisors?.toString()} isEditing={editingBusiness} name="noOfSupervisors" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} type="number" />
            <EditableInfoRow label="Rank & File" value={detail?.businessDetails?.noOfRankAndFile?.toString()} isEditing={editingBusiness} name="noOfRankAndFile" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} type="number" />

            {detail?.businessDetails?.placeType === 'RENTED' && (
              <>
                <SectionDivider title="Lease Details" />
                <EditableInfoRow label="Lessor Name" value={detail.businessDetails.lessorName} isEditing={editingBusiness} name="lessorName" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
                <EditableInfoRow label="Lessor Address" value={detail.businessDetails.lessorAddress} isEditing={editingBusiness} name="lessorAddress" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} />
                <EditableInfoRow label="Monthly Rent" value={detail.businessDetails.monthlyRent ? `₱${parseFloat(detail.businessDetails.monthlyRent).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} isEditing={editingBusiness} name="monthlyRent" formData={businessForm} onChange={(name, value) => handleFormChange(setBusinessForm, name, value)} type="number" />
                <InfoRow label="Notarized" value={detail.businessDetails.isNotarized ? 'Yes' : 'No'} />
                <InfoRow label="Documentary Stamp" value={detail.businessDetails.hasDocStamp ? 'Yes' : 'No'} />
              </>
            )}
          </div>
        )}

        {/* CORPORATE DETAILS ───────────────────────────────────── */}
        {activeTab === 'corporate' && (
          <div className="max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-foreground text-base">Corporate Details</h3>
              <div className="flex items-center gap-2">
                {editingCorporate ? (
                  <>
                    <button
                      onClick={() => setEditingCorporate(false)}
                      disabled={savingCorporate}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition disabled:opacity-50"
                    >
                      <X size={13} /> Cancel
                    </button>
                    <button
                      onClick={() => void saveCorporate()}
                      disabled={savingCorporate}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#25238e] hover:bg-[#1e1b6f] rounded-xl transition disabled:opacity-50"
                    >
                      {savingCorporate ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {savingCorporate ? 'Saving...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEditCorporate}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#25238e] bg-[#25238e]/5 hover:bg-[#25238e]/10 rounded-xl transition"
                  >
                    <Edit3 size={13} /> Edit
                  </button>
                )}
              </div>
            </div>
            <EditableInfoRow label="SEC Reg. No." value={detail?.corporateDetails?.secRegistrationNo} isEditing={editingCorporate} name="secRegistrationNo" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Acronym" value={detail?.corporateDetails?.acronym} isEditing={editingCorporate} name="acronym" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Suffix" value={detail?.corporateDetails?.suffix} isEditing={editingCorporate} name="suffix" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Classification" value={detail?.corporateDetails?.companyClassification} isEditing={editingCorporate} name="companyClassification" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Sub-class" value={detail?.corporateDetails?.companySubclass} isEditing={editingCorporate} name="companySubclass" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Date of Incorporation" value={detail?.corporateDetails?.dateOfIncorporation} isEditing={editingCorporate} name="dateOfIncorporation" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="date" />
            <EditableInfoRow label="Term of Existence" value={detail?.corporateDetails?.termOfExistence} isEditing={editingCorporate} name="termOfExistence" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Primary Purpose" value={detail?.corporateDetails?.primaryPurpose} isEditing={editingCorporate} name="primaryPurpose" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Annual Meeting Date" value={detail?.corporateDetails?.annualMeetingDate} isEditing={editingCorporate} name="annualMeetingDate" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="date" />
            <EditableInfoRow label="No. of Incorporators" value={detail?.corporateDetails?.numberOfIncorporators?.toString()} isEditing={editingCorporate} name="numberOfIncorporators" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="number" />
            <EditableInfoRow label="Authorized Capital" value={detail?.corporateDetails?.authorizedCapital ? `₱${parseFloat(detail.corporateDetails.authorizedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} isEditing={editingCorporate} name="authorizedCapital" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="number" />
            <EditableInfoRow label="Subscribed Capital" value={detail?.corporateDetails?.subscribedCapital ? `₱${parseFloat(detail.corporateDetails.subscribedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} isEditing={editingCorporate} name="subscribedCapital" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="number" />
            <EditableInfoRow label="Paid-Up Capital" value={detail?.corporateDetails?.paidUpCapital ? `₱${parseFloat(detail.corporateDetails.paidUpCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} isEditing={editingCorporate} name="paidUpCapital" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="number" />

            <SectionDivider title="President" />
            {editingCorporate ? (
              <>
                <EditableInfoRow label="First Name" value={detail?.corporateDetails?.presidentFirstName} isEditing={true} name="presidentFirstName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Middle Name" value={detail?.corporateDetails?.presidentMiddleName} isEditing={true} name="presidentMiddleName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Last Name" value={detail?.corporateDetails?.presidentLastName} isEditing={true} name="presidentLastName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Name" value={[detail?.corporateDetails?.presidentFirstName, detail?.corporateDetails?.presidentMiddleName, detail?.corporateDetails?.presidentLastName].filter(Boolean).join(' ') || null} />
            )}
            <EditableInfoRow label="TIN" value={detail?.corporateDetails?.presidentTin} isEditing={editingCorporate} name="presidentTin" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Email" value={detail?.corporateDetails?.presidentEmail} isEditing={editingCorporate} name="presidentEmail" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="email" />

            <SectionDivider title="Treasurer" />
            {editingCorporate ? (
              <>
                <EditableInfoRow label="First Name" value={detail?.corporateDetails?.treasurerFirstName} isEditing={true} name="treasurerFirstName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Middle Name" value={detail?.corporateDetails?.treasurerMiddleName} isEditing={true} name="treasurerMiddleName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Last Name" value={detail?.corporateDetails?.treasurerLastName} isEditing={true} name="treasurerLastName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Name" value={[detail?.corporateDetails?.treasurerFirstName, detail?.corporateDetails?.treasurerMiddleName, detail?.corporateDetails?.treasurerLastName].filter(Boolean).join(' ') || null} />
            )}
            <EditableInfoRow label="TIN" value={detail?.corporateDetails?.treasurerTin} isEditing={editingCorporate} name="treasurerTin" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Email" value={detail?.corporateDetails?.treasurerEmail} isEditing={editingCorporate} name="treasurerEmail" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="email" />

            <SectionDivider title="Secretary" />
            {editingCorporate ? (
              <>
                <EditableInfoRow label="First Name" value={detail?.corporateDetails?.secretaryFirstName} isEditing={true} name="secretaryFirstName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Middle Name" value={detail?.corporateDetails?.secretaryMiddleName} isEditing={true} name="secretaryMiddleName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
                <EditableInfoRow label="Last Name" value={detail?.corporateDetails?.secretaryLastName} isEditing={true} name="secretaryLastName" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
              </>
            ) : (
              <InfoRow label="Name" value={[detail?.corporateDetails?.secretaryFirstName, detail?.corporateDetails?.secretaryMiddleName, detail?.corporateDetails?.secretaryLastName].filter(Boolean).join(' ') || null} />
            )}
            <EditableInfoRow label="TIN" value={detail?.corporateDetails?.secretaryTin} isEditing={editingCorporate} name="secretaryTin" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} />
            <EditableInfoRow label="Email" value={detail?.corporateDetails?.secretaryEmail} isEditing={editingCorporate} name="secretaryEmail" formData={corporateForm} onChange={(name, value) => handleFormChange(setCorporateForm, name, value)} type="email" />
          </div>
        )}

        {/* SHAREHOLDERS ────────────────────────────────────────── */}
        {activeTab === 'shareholders' && (
          <div className="max-w-3xl">
            <h3 className="font-black text-foreground text-base mb-4">Shareholders</h3>
            {(detail?.shareholders ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No shareholders recorded.</p>
            ) : (
              <div className="space-y-3">
                {(detail?.shareholders ?? []).map((s, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-sm text-foreground">
                        {[s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')}
                      </p>
                      <span className="text-xs text-muted-foreground">#{i + 1}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-muted-foreground">
                      <span>TIN: {s.tin || '—'}</span>
                      <span>Gender: {s.gender || '—'}</span>
                      <span>Nationality: {s.nationality || '—'}</span>
                      <span>Shares: {s.numberOfShares}</span>
                      <span>Paid-up Capital: ₱{parseFloat(s.paidUpCapital || '0').toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      <span>Method: {s.methodOfPayment}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PORTAL USERS ────────────────────────────────────────── */}
        {activeTab === 'portal-users' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Portal Users</h3>
            {(detail?.portalUsers ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No portal users assigned.</p>
            ) : (
              <div className="space-y-3">
                {(detail?.portalUsers ?? []).map((u) => (
                  <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card">
                    <div className="w-9 h-9 rounded-full bg-[#25238e]/10 flex items-center justify-center shrink-0">
                      <Users size={16} className="text-[#25238e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-foreground">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#25238e]/10 text-[#25238e] font-semibold">{u.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* OWNER ACCOUNT ───────────────────────────────────────── */}
        {activeTab === 'owner' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Owner Account</h3>
            {overlay.ownerAccountId && overlay.ownerName ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start gap-4">
                  <UserAvatar name={overlay.ownerName} />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-black text-foreground">{overlay.ownerName}</p>
                      {overlay.ownerStatus && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${OWNER_STATUS_STYLE[overlay.ownerStatus]}`}>
                          {overlay.ownerStatus.charAt(0) + overlay.ownerStatus.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                    {overlay.ownerEmail && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Mail size={12} className="text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">{overlay.ownerEmail}</p>
                      </div>
                    )}
                    {overlay.ownerStatus && overlay.ownerStatus !== 'SUSPENDED' && (
                      <button
                        onClick={() => void toggleOwnerStatus()}
                        disabled={togglingStatus}
                        className={`mt-4 flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition disabled:opacity-50 ${
                          overlay.ownerStatus === 'ACTIVE'
                            ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                            : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingStatus ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : overlay.ownerStatus === 'ACTIVE' ? (
                          <><ShieldOff size={13} /> Deactivate Account</>
                        ) : (
                          <><ShieldCheck size={13} /> Activate Account</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <Users size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No owner account linked</p>
                <p className="text-xs text-muted-foreground">
                  No client portal user has been assigned as owner for this client.
                </p>
              </div>
            )}
          </div>
        )}

        {/* SIGNED TSA ──────────────────────────────────────────── */}
        {activeTab === 'tsa' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">
              Signed Tax Service Agreement (TSA)
            </h3>
            {overlay.tsaUrl ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        TSA_{displayName.replace(/\s+/g, '_')}.pdf
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Signed agreement document</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={overlay.tsaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition"
                    >
                      <ExternalLink size={13} /> View
                    </a>
                    <a
                      href={overlay.tsaUrl}
                      download
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <FileText size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No TSA uploaded yet</p>
                <p className="text-xs text-muted-foreground">
                  Waiting for the signed copy of the Tax Service Agreement.
                </p>
              </div>
            )}
          </div>
        )}

        {/* JOB ORDER ───────────────────────────────────────────── */}
        {activeTab === 'job-order' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Job Order</h3>
            {overlay.jobOrderNumber ? (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                      <ClipboardList size={18} className="text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{overlay.jobOrderNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Operations handover document</p>
                    </div>
                  </div>
                  {overlay.jobOrderUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={overlay.jobOrderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl transition"
                      >
                        <ExternalLink size={13} /> View
                      </a>
                      <a
                        href={overlay.jobOrderUrl}
                        download
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-muted-foreground bg-muted hover:bg-muted/80 rounded-xl transition"
                      >
                        <Download size={13} /> Download
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border bg-card p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <ClipboardList size={20} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">No job order attached</p>
                <p className="text-xs text-muted-foreground">
                  This client has not been linked to a job order yet.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

