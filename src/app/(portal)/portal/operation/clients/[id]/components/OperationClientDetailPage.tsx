// src/app/(portal)/portal/operation/clients/[id]/components/OperationClientDetailPage.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, FileText, Users, UserCircle2,
  Loader2, Download, ExternalLink, Mail, ShieldCheck, ShieldOff,
  ChevronDown, Search, ClipboardList, MapPin,
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
        <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
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
            <h3 className="font-black text-foreground text-base mb-4">Core Information</h3>
            <InfoRow label="Business Name" value={displayName} />
            <InfoRow label="Company Code" value={detail?.companyCode} />
            <InfoRow label="Client Number" value={overlay.clientNo} />
            <InfoRow label="Portal Name" value={detail?.portalName} />
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
            <InfoRow label="Timezone" value={detail?.timezone} />
            <InfoRow label="Day Reset Time" value={detail?.dayResetTime} />
            <InfoRow label="Working Day Starts" value={detail?.workingDayStarts} />
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
            <h3 className="font-black text-foreground text-base mb-4">BIR Information</h3>
            <InfoRow label="TIN" value={detail?.birInfo?.tin ? <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{detail.birInfo.tin}</span> : null} />
            <InfoRow label="Branch Code" value={detail?.birInfo?.branchCode} />
            <InfoRow label="RDO Code" value={detail?.birInfo?.rdoCode} />
            <InfoRow label="Registered Address" value={detail?.birInfo?.registeredAddress} />
            <InfoRow label="Zip Code" value={detail?.birInfo?.zipCode} />
            <InfoRow label="Contact Number" value={detail?.birInfo?.contactNumber} />
            <InfoRow label="Withholding Agent" value={detail?.birInfo?.isWithholdingAgent != null ? (detail.birInfo.isWithholdingAgent ? 'Yes' : 'No') : null} />
            <InfoRow label="Withholding Category" value={detail?.birInfo?.withholdingCategory} />
            <InfoRow
              label="COR Document"
              value={
                detail?.birInfo?.corUrl
                  ? <a href={detail.birInfo.corUrl} target="_blank" rel="noopener noreferrer" className="text-[#25238e] underline text-xs">View Document</a>
                  : null
              }
            />
          </div>
        )}

        {/* OWNER / INDIVIDUAL ──────────────────────────────────── */}
        {activeTab === 'individual' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Owner / Individual Details</h3>
            <InfoRow
              label="Full Name"
              value={[
                detail?.individualDetails?.firstName,
                detail?.individualDetails?.middleName,
                detail?.individualDetails?.lastName,
              ].filter(Boolean).join(' ') || null}
            />
            <InfoRow label="Date of Birth" value={detail?.individualDetails?.dob} />
            <InfoRow label="Civil Status" value={detail?.individualDetails?.civilStatus} />
            <InfoRow label="Gender" value={detail?.individualDetails?.gender} />
            <InfoRow label="Citizenship" value={detail?.individualDetails?.citizenship} />
            <InfoRow label="Place of Birth" value={detail?.individualDetails?.placeOfBirth} />
            <InfoRow label="Residential Address" value={detail?.individualDetails?.residentialAddress} />
            <InfoRow label="PRC License No." value={detail?.individualDetails?.prcLicenseNo} />
            <InfoRow label="Primary ID Type" value={detail?.individualDetails?.primaryIdType} />
            <InfoRow label="Primary ID Number" value={detail?.individualDetails?.primaryIdNumber} />
            <InfoRow label="Personal Email" value={detail?.individualDetails?.personalEmail} />
            <InfoRow label="Mobile Number" value={detail?.individualDetails?.mobileNumber} />
            <InfoRow label="Telephone Number" value={detail?.individualDetails?.telephoneNumber} />

            <SectionDivider title="Family Background" />
            <InfoRow label="Mother's Name" value={[detail?.individualDetails?.motherFirstName, detail?.individualDetails?.motherMiddleName, detail?.individualDetails?.motherLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="Father's Name" value={[detail?.individualDetails?.fatherFirstName, detail?.individualDetails?.fatherMiddleName, detail?.individualDetails?.fatherLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="Spouse Name" value={[detail?.individualDetails?.spouseFirstName, detail?.individualDetails?.spouseMiddleName, detail?.individualDetails?.spouseLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="Spouse Employment" value={detail?.individualDetails?.spouseEmploymentStatus} />
            <InfoRow label="Spouse TIN" value={detail?.individualDetails?.spouseTin} />
          </div>
        )}

        {/* BUSINESS OPERATIONS ─────────────────────────────────── */}
        {activeTab === 'business' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Business Operations</h3>
            <InfoRow label="Trade Name" value={detail?.businessDetails?.tradeName} />
            <InfoRow label="Industry" value={detail?.businessDetails?.industry} />
            <InfoRow label="Line of Business" value={detail?.businessDetails?.lineOfBusiness} />
            <InfoRow label="PSIC Code" value={detail?.businessDetails?.psicCode} />
            <InfoRow label="Business Area (sqm)" value={detail?.businessDetails?.businessAreaSqm} />
            <InfoRow label="Place Type" value={detail?.businessDetails?.placeType} />
            <InfoRow label="Landline" value={detail?.businessDetails?.landlineNumber} />
            <InfoRow label="Fax" value={detail?.businessDetails?.faxNumber} />

            <SectionDivider title="Headcount" />
            <InfoRow label="Managers" value={detail?.businessDetails?.noOfManagers?.toString()} />
            <InfoRow label="Supervisors" value={detail?.businessDetails?.noOfSupervisors?.toString()} />
            <InfoRow label="Rank & File" value={detail?.businessDetails?.noOfRankAndFile?.toString()} />

            {detail?.businessDetails?.placeType === 'RENTED' && (
              <>
                <SectionDivider title="Lease Details" />
                <InfoRow label="Lessor Name" value={detail.businessDetails.lessorName} />
                <InfoRow label="Lessor Address" value={detail.businessDetails.lessorAddress} />
                <InfoRow label="Monthly Rent" value={detail.businessDetails.monthlyRent ? `₱${parseFloat(detail.businessDetails.monthlyRent).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} />
                <InfoRow label="Notarized" value={detail.businessDetails.isNotarized ? 'Yes' : 'No'} />
                <InfoRow label="Documentary Stamp" value={detail.businessDetails.hasDocStamp ? 'Yes' : 'No'} />
              </>
            )}
          </div>
        )}

        {/* CORPORATE DETAILS ───────────────────────────────────── */}
        {activeTab === 'corporate' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Corporate Details</h3>
            <InfoRow label="SEC Reg. No." value={detail?.corporateDetails?.secRegistrationNo} />
            <InfoRow label="Acronym" value={detail?.corporateDetails?.acronym} />
            <InfoRow label="Suffix" value={detail?.corporateDetails?.suffix} />
            <InfoRow label="Classification" value={detail?.corporateDetails?.companyClassification} />
            <InfoRow label="Sub-class" value={detail?.corporateDetails?.companySubclass} />
            <InfoRow label="Date of Incorporation" value={detail?.corporateDetails?.dateOfIncorporation} />
            <InfoRow label="Term of Existence" value={detail?.corporateDetails?.termOfExistence} />
            <InfoRow label="Primary Purpose" value={detail?.corporateDetails?.primaryPurpose} />
            <InfoRow label="Annual Meeting Date" value={detail?.corporateDetails?.annualMeetingDate} />
            <InfoRow label="No. of Incorporators" value={detail?.corporateDetails?.numberOfIncorporators?.toString()} />
            <InfoRow label="Authorized Capital" value={detail?.corporateDetails?.authorizedCapital ? `₱${parseFloat(detail.corporateDetails.authorizedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} />
            <InfoRow label="Subscribed Capital" value={detail?.corporateDetails?.subscribedCapital ? `₱${parseFloat(detail.corporateDetails.subscribedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} />
            <InfoRow label="Paid-Up Capital" value={detail?.corporateDetails?.paidUpCapital ? `₱${parseFloat(detail.corporateDetails.paidUpCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : null} />

            <SectionDivider title="President" />
            <InfoRow label="Name" value={[detail?.corporateDetails?.presidentFirstName, detail?.corporateDetails?.presidentMiddleName, detail?.corporateDetails?.presidentLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="TIN" value={detail?.corporateDetails?.presidentTin} />
            <InfoRow label="Email" value={detail?.corporateDetails?.presidentEmail} />

            <SectionDivider title="Treasurer" />
            <InfoRow label="Name" value={[detail?.corporateDetails?.treasurerFirstName, detail?.corporateDetails?.treasurerMiddleName, detail?.corporateDetails?.treasurerLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="TIN" value={detail?.corporateDetails?.treasurerTin} />
            <InfoRow label="Email" value={detail?.corporateDetails?.treasurerEmail} />

            <SectionDivider title="Secretary" />
            <InfoRow label="Name" value={[detail?.corporateDetails?.secretaryFirstName, detail?.corporateDetails?.secretaryMiddleName, detail?.corporateDetails?.secretaryLastName].filter(Boolean).join(' ') || null} />
            <InfoRow label="TIN" value={detail?.corporateDetails?.secretaryTin} />
            <InfoRow label="Email" value={detail?.corporateDetails?.secretaryEmail} />
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

