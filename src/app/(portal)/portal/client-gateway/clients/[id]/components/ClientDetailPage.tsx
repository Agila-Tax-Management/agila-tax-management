// src/app/(portal)/portal/client-gateway/clients/[id]/components/ClientDetailPage.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, FileText, MapPin, Users, UserCircle2,
  Pencil, Check, X, Loader2, ShieldCheck, Plus, Trash2, ChevronUp, ChevronDown,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type {
  ClientDetail, BusinessEntity, BirInfoData, BusinessDetailsData,
  CorporateDetailsData, IndividualDetailsData, ShareholderData, PlaceType,
} from '@/types/client-gateway.types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ENTITY_LABELS: Record<BusinessEntity, string> = {
  INDIVIDUAL: 'Individual / Professional',
  SOLE_PROPRIETORSHIP: 'Sole Proprietorship',
  PARTNERSHIP: 'Partnership',
  CORPORATION: 'Corporation',
  COOPERATIVE: 'Cooperative',
};

const inputCls =
  'w-full px-3 py-2 text-sm rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const labelCls = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide';

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={labelCls}>
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sm:w-48 shrink-0">{label}</span>
      <span className="text-sm text-foreground font-medium flex-1">{value || <span className="text-muted-foreground italic">—</span>}</span>
    </div>
  );
}

function SectionHeader({ title, onEdit, editing, saving }: {
  title: string; onEdit: () => void; editing: boolean; saving: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-black text-foreground text-base">{title}</h3>
      {!editing ? (
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#25238e] border border-[#25238e]/30 rounded-xl hover:bg-[#25238e]/5 transition-colors"
        >
          <Pencil size={12} /> Edit
        </button>
      ) : (
        <div className="flex items-center gap-2">
          {saving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        </div>
      )}
    </div>
  );
}

// ─── Empty default factories ──────────────────────────────────────────────────

function emptyBir(): BirInfoData {
  return { tin: '', branchCode: '0000', rdoCode: '', registeredAddress: '', zipCode: '', contactNumber: '', isWithholdingAgent: false, withholdingCategory: '', corUrl: '' };
}
function emptyBusiness(): BusinessDetailsData {
  return { tradeName: '', industry: '', lineOfBusiness: '', psicCode: '', businessAreaSqm: '', noOfManagers: 0, noOfSupervisors: 0, noOfRankAndFile: 0, noOfElevators: 0, noOfEscalators: 0, noOfAircons: 0, hasCctv: false, signboardLength: '', hasSignboardLight: false, landlineNumber: '', faxNumber: '', placeType: 'RENTED', lessorName: '', lessorAddress: '', monthlyRent: '', rentContractUrl: '', isNotarized: false, hasDocStamp: false, propertyOwner: '', ownedDocsUrl: '', ownedReason: '', noRentReason: '' };
}
function emptyCorporate(): CorporateDetailsData {
  return { secRegistrationNo: '', acronym: '', suffix: '', companyClassification: '', companySubclass: '', dateOfIncorporation: '', termOfExistence: '', primaryPurpose: '', annualMeetingDate: '', numberOfIncorporators: null, hasBoardOfDirectors: true, authorizedCapital: '', subscribedCapital: '', paidUpCapital: '', primaryEmail: '', secondaryEmail: '', primaryContactNo: '', secondaryContactNo: '', contactPerson: '', authRepFirstName: '', authRepMiddleName: '', authRepLastName: '', authRepPosition: '', authRepTin: '', authRepDob: '', presidentFirstName: '', presidentMiddleName: '', presidentLastName: '', presidentGender: '', presidentNationality: '', presidentAddress: '', presidentTin: '', presidentEmail: '', presidentDob: '', treasurerFirstName: '', treasurerMiddleName: '', treasurerLastName: '', treasurerGender: '', treasurerNationality: '', treasurerAddress: '', treasurerTin: '', treasurerEmail: '', treasurerDob: '', secretaryFirstName: '', secretaryMiddleName: '', secretaryLastName: '', secretaryGender: '', secretaryNationality: '', secretaryAddress: '', secretaryTin: '', secretaryEmail: '', secretaryDob: '' };
}
function emptyIndividual(): IndividualDetailsData {
  return { firstName: '', middleName: '', lastName: '', dob: '', civilStatus: '', gender: '', citizenship: 'Filipino', placeOfBirth: '', residentialAddress: '', prcLicenseNo: '', primaryIdType: '', primaryIdNumber: '', personalEmail: '', mobileNumber: '', telephoneNumber: '', motherFirstName: '', motherMiddleName: '', motherLastName: '', fatherFirstName: '', fatherMiddleName: '', fatherLastName: '', spouseFirstName: '', spouseMiddleName: '', spouseLastName: '', spouseEmploymentStatus: '', spouseTin: '', spouseEmployerName: '', spouseEmployerTin: '' };
}
function emptyShareholder(): ShareholderData {
  return { firstName: '', middleName: '', lastName: '', dob: '', nationality: 'Filipino', gender: 'Male', tin: '', numberOfShares: '0', paidUpCapital: '0', methodOfPayment: 'CASH', orderSequence: 0 };
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

type TabId = 'core' | 'bir' | 'individual' | 'business' | 'corporate' | 'shareholders' | 'portal-users';

function getAvailableTabs(entity: BusinessEntity): TabId[] {
  const tabs: TabId[] = ['core', 'bir'];
  if (entity === 'INDIVIDUAL' || entity === 'SOLE_PROPRIETORSHIP') tabs.push('individual');
  if (entity !== 'INDIVIDUAL') tabs.push('business');
  if (entity === 'CORPORATION' || entity === 'COOPERATIVE') tabs.push('corporate');
  if (entity === 'CORPORATION') tabs.push('shareholders');
  tabs.push('portal-users');
  return tabs;
}

const TAB_META: Record<TabId, { label: string; icon: React.ReactNode }> = {
  core: { label: 'Core Info', icon: <Building2 size={14} /> },
  bir: { label: 'BIR Info', icon: <FileText size={14} /> },
  individual: { label: 'Owner / Individual', icon: <UserCircle2 size={14} /> },
  business: { label: 'Business Operations', icon: <MapPin size={14} /> },
  corporate: { label: 'Corporate Details', icon: <ShieldCheck size={14} /> },
  shareholders: { label: 'Shareholders', icon: <Users size={14} /> },
  'portal-users': { label: 'Portal Users', icon: <Users size={14} /> },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ClientDetailPage({ clientId }: { clientId: number }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('core');

  // Edit states per section
  const [editingCore, setEditingCore] = useState(false);
  const [editingBir, setEditingBir] = useState(false);
  const [editingIndividual, setEditingIndividual] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [editingCorporate, setEditingCorporate] = useState(false);
  const [editingShareholders, setEditingShareholders] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form states
  const [coreForm, setCoreForm] = useState({ businessName: '', companyCode: '', clientNo: '', portalName: '', active: true, timezone: 'Asia/Manila', branchType: 'MAIN' as 'MAIN' | 'BRANCH' });
  const [birForm, setBirForm] = useState<BirInfoData>(emptyBir());
  const [individualForm, setIndividualForm] = useState<IndividualDetailsData>(emptyIndividual());
  const [businessForm, setBusinessForm] = useState<BusinessDetailsData>(emptyBusiness());
  const [corporateForm, setCorporateForm] = useState<CorporateDetailsData>(emptyCorporate());
  const [shareholdersForm, setShareholdersForm] = useState<ShareholderData[]>([]);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/client-gateway/clients/${clientId}`);
      if (!res.ok) throw new Error('Failed to load client');
      const json = await res.json() as { data: ClientDetail };
      setClient(json.data);
      // Populate forms
      setCoreForm({
        businessName: json.data.businessName,
        companyCode: json.data.companyCode ?? '',
        clientNo: json.data.clientNo ?? '',
        portalName: json.data.portalName,
        active: json.data.active,
        timezone: json.data.timezone,
        branchType: json.data.branchType,
      });
      setBirForm(json.data.birInfo ?? emptyBir());
      setIndividualForm(json.data.individualDetails ?? emptyIndividual());
      setBusinessForm(json.data.businessDetails ?? emptyBusiness());
      setCorporateForm(json.data.corporateDetails ?? emptyCorporate());
      setShareholdersForm(json.data.shareholders ?? []);
    } catch {
      toastError('Load failed', 'Could not fetch client details.');
    } finally {
      setLoading(false);
    }
  }, [clientId, toastError]);

  useEffect(() => {
    void fetchClient();
  }, [fetchClient]);

  async function save(payload: Record<string, unknown>) {
    setSaving(true);
    try {
      const res = await fetch(`/api/client-gateway/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json() as { error?: string };
        throw new Error(json.error ?? 'Save failed');
      }
      success('Saved', 'Changes saved successfully.');
      await fetchClient();
    } catch (err) {
      toastError('Save failed', err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={28} className="animate-spin text-[#25238e]" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-muted-foreground">Client not found.</p>
        <button onClick={() => router.back()} className="text-sm text-[#25238e] underline">Go back</button>
      </div>
    );
  }

  const availableTabs = getAvailableTabs(client.businessEntity);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
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
              <h1 className="text-2xl font-black text-foreground truncate">{client.businessName}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${client.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {client.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {client.clientNo && <span>{client.clientNo} &nbsp;·&nbsp;</span>}
              {client.companyCode && <span>{client.companyCode} &nbsp;·&nbsp;</span>}
              <span>{ENTITY_LABELS[client.businessEntity]}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border shrink-0 overflow-x-auto">
        <div className="flex gap-0">
          {availableTabs.map((tab) => {
            const meta = TAB_META[tab];
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-[#25238e] text-[#25238e]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {meta.icon} {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto px-6 py-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

        {/* ── Core Info ─────────────────────────────── */}
        {activeTab === 'core' && (
          <div className="max-w-2xl">
            <SectionHeader title="Core Information" onEdit={() => setEditingCore(true)} editing={editingCore} saving={saving} />
            {!editingCore ? (
              <div>
                <InfoRow label="Business Name" value={client.businessName} />
                <InfoRow label="Company Code" value={client.companyCode} />
                <InfoRow label="Client Number" value={client.clientNo} />
                <InfoRow label="Portal Name" value={client.portalName} />
                <InfoRow label="Business Entity" value={ENTITY_LABELS[client.businessEntity]} />
                <InfoRow label="Branch Type" value={client.branchType} />
                <InfoRow label="Status" value={
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${client.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {client.active ? 'Active' : 'Inactive'}
                  </span>
                } />
                <InfoRow label="Timezone" value={client.timezone} />
                <InfoRow label="Day Reset Time" value={client.dayResetTime} />
                <InfoRow label="Working Day Starts" value={client.workingDayStarts} />
                <InfoRow label="Created" value={new Date(client.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Business Name" required>
                    <input className={inputCls} value={coreForm.businessName} onChange={(e) => setCoreForm((p) => ({ ...p, businessName: e.target.value }))} />
                  </Field>
                  <Field label="Company Code">
                    <input className={inputCls} value={coreForm.companyCode} onChange={(e) => setCoreForm((p) => ({ ...p, companyCode: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Client Number">
                    <input className={inputCls} value={coreForm.clientNo} onChange={(e) => setCoreForm((p) => ({ ...p, clientNo: e.target.value }))} />
                  </Field>
                  <Field label="Portal Name">
                    <input className={inputCls} value={coreForm.portalName} onChange={(e) => setCoreForm((p) => ({ ...p, portalName: e.target.value }))} />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Branch Type">
                    <select className={inputCls} value={coreForm.branchType} onChange={(e) => setCoreForm((p) => ({ ...p, branchType: e.target.value as 'MAIN' | 'BRANCH' }))}>
                      <option value="MAIN">Main</option>
                      <option value="BRANCH">Branch</option>
                    </select>
                  </Field>
                  <Field label="Status">
                    <select className={inputCls} value={coreForm.active ? 'active' : 'inactive'} onChange={(e) => setCoreForm((p) => ({ ...p, active: e.target.value === 'active' }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </Field>
                </div>
                <Field label="Timezone">
                  <input className={inputCls} value={coreForm.timezone} onChange={(e) => setCoreForm((p) => ({ ...p, timezone: e.target.value }))} />
                </Field>
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setEditingCore(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors">
                    <X size={14} className="inline mr-1" />Cancel
                  </button>
                  <button
                    disabled={saving}
                    onClick={async () => { await save({ core: coreForm }); setEditingCore(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── BIR Info ──────────────────────────────── */}
        {activeTab === 'bir' && (
          <div className="max-w-2xl">
            <SectionHeader title="BIR Information" onEdit={() => setEditingBir(true)} editing={editingBir} saving={saving} />
            {!editingBir ? (
              <div>
                <InfoRow label="TIN" value={<span className="font-mono bg-muted px-2 py-0.5 rounded text-xs">{client.birInfo?.tin || '—'}</span>} />
                <InfoRow label="Branch Code" value={client.birInfo?.branchCode} />
                <InfoRow label="RDO Code" value={client.birInfo?.rdoCode} />
                <InfoRow label="Registered Address" value={client.birInfo?.registeredAddress} />
                <InfoRow label="Zip Code" value={client.birInfo?.zipCode} />
                <InfoRow label="Contact Number" value={client.birInfo?.contactNumber} />
                <InfoRow label="Withholding Agent" value={client.birInfo?.isWithholdingAgent ? 'Yes' : 'No'} />
                <InfoRow label="Withholding Category" value={client.birInfo?.withholdingCategory} />
                <InfoRow label="COR URL" value={client.birInfo?.corUrl ? <a href={client.birInfo.corUrl} target="_blank" rel="noopener noreferrer" className="text-[#25238e] underline text-xs">View Document</a> : null} />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="TIN" required><input className={inputCls} value={birForm.tin} onChange={(e) => setBirForm((p) => ({ ...p, tin: e.target.value }))} /></Field>
                  <Field label="Branch Code"><input className={inputCls} value={birForm.branchCode} onChange={(e) => setBirForm((p) => ({ ...p, branchCode: e.target.value }))} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="RDO Code" required><input className={inputCls} value={birForm.rdoCode} onChange={(e) => setBirForm((p) => ({ ...p, rdoCode: e.target.value }))} /></Field>
                  <Field label="Zip Code" required><input className={inputCls} value={birForm.zipCode} onChange={(e) => setBirForm((p) => ({ ...p, zipCode: e.target.value }))} /></Field>
                </div>
                <Field label="Registered Address" required>
                  <textarea className={inputCls} rows={2} value={birForm.registeredAddress} onChange={(e) => setBirForm((p) => ({ ...p, registeredAddress: e.target.value }))} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Contact Number"><input className={inputCls} value={birForm.contactNumber} onChange={(e) => setBirForm((p) => ({ ...p, contactNumber: e.target.value }))} /></Field>
                  <Field label="COR URL"><input className={inputCls} value={birForm.corUrl} onChange={(e) => setBirForm((p) => ({ ...p, corUrl: e.target.value }))} /></Field>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer">
                    <input type="checkbox" className="rounded" checked={birForm.isWithholdingAgent} onChange={(e) => setBirForm((p) => ({ ...p, isWithholdingAgent: e.target.checked }))} />
                    Is Withholding Agent
                  </label>
                </div>
                {birForm.isWithholdingAgent && (
                  <Field label="Withholding Category">
                    <input className={inputCls} value={birForm.withholdingCategory} onChange={(e) => setBirForm((p) => ({ ...p, withholdingCategory: e.target.value }))} />
                  </Field>
                )}
                <div className="flex gap-3 justify-end pt-2">
                  <button onClick={() => setEditingBir(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
                  <button disabled={saving} onClick={async () => { await save({ birInfo: birForm }); setEditingBir(false); }} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Individual / Owner ────────────────────── */}
        {activeTab === 'individual' && (
          <div className="max-w-2xl">
            <SectionHeader title="Owner / Individual Details" onEdit={() => setEditingIndividual(true)} editing={editingIndividual} saving={saving} />
            {!editingIndividual ? (
              <div>
                <InfoRow label="Full Name" value={[client.individualDetails?.firstName, client.individualDetails?.middleName, client.individualDetails?.lastName].filter(Boolean).join(' ')} />
                <InfoRow label="Date of Birth" value={client.individualDetails?.dob} />
                <InfoRow label="Civil Status" value={client.individualDetails?.civilStatus} />
                <InfoRow label="Gender" value={client.individualDetails?.gender} />
                <InfoRow label="Citizenship" value={client.individualDetails?.citizenship} />
                <InfoRow label="Place of Birth" value={client.individualDetails?.placeOfBirth} />
                <InfoRow label="Residential Address" value={client.individualDetails?.residentialAddress} />
                <InfoRow label="PRC License No." value={client.individualDetails?.prcLicenseNo} />
                <InfoRow label="Primary ID Type" value={client.individualDetails?.primaryIdType} />
                <InfoRow label="Primary ID Number" value={client.individualDetails?.primaryIdNumber} />
                <InfoRow label="Personal Email" value={client.individualDetails?.personalEmail} />
                <InfoRow label="Mobile Number" value={client.individualDetails?.mobileNumber} />
                <InfoRow label="Telephone Number" value={client.individualDetails?.telephoneNumber} />
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Family Background</p>
                  <InfoRow label="Mother's Name" value={[client.individualDetails?.motherFirstName, client.individualDetails?.motherMiddleName, client.individualDetails?.motherLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="Father's Name" value={[client.individualDetails?.fatherFirstName, client.individualDetails?.fatherMiddleName, client.individualDetails?.fatherLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="Spouse Name" value={[client.individualDetails?.spouseFirstName, client.individualDetails?.spouseMiddleName, client.individualDetails?.spouseLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="Spouse Employment" value={client.individualDetails?.spouseEmploymentStatus} />
                  <InfoRow label="Spouse TIN" value={client.individualDetails?.spouseTin} />
                </div>
              </div>
            ) : (
              <IndividualForm form={individualForm} setForm={setIndividualForm} saving={saving} onCancel={() => setEditingIndividual(false)} onSave={async () => { await save({ individualDetails: individualForm }); setEditingIndividual(false); }} inputCls={inputCls} />
            )}
          </div>
        )}

        {/* ── Business Operations ───────────────────── */}
        {activeTab === 'business' && (
          <div className="max-w-2xl">
            <SectionHeader title="Business Operations" onEdit={() => setEditingBusiness(true)} editing={editingBusiness} saving={saving} />
            {!editingBusiness ? (
              <div>
                <InfoRow label="Trade Name" value={client.businessDetails?.tradeName} />
                <InfoRow label="Industry" value={client.businessDetails?.industry} />
                <InfoRow label="Line of Business" value={client.businessDetails?.lineOfBusiness} />
                <InfoRow label="PSIC Code" value={client.businessDetails?.psicCode} />
                <InfoRow label="Business Area (sqm)" value={client.businessDetails?.businessAreaSqm} />
                <InfoRow label="Place Type" value={client.businessDetails?.placeType} />
                <InfoRow label="Landline" value={client.businessDetails?.landlineNumber} />
                <InfoRow label="Fax" value={client.businessDetails?.faxNumber} />
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Headcount</p>
                  <InfoRow label="Managers" value={client.businessDetails?.noOfManagers?.toString()} />
                  <InfoRow label="Supervisors" value={client.businessDetails?.noOfSupervisors?.toString()} />
                  <InfoRow label="Rank & File" value={client.businessDetails?.noOfRankAndFile?.toString()} />
                </div>
                {client.businessDetails?.placeType === 'RENTED' && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Lease Details</p>
                    <InfoRow label="Lessor Name" value={client.businessDetails.lessorName} />
                    <InfoRow label="Lessor Address" value={client.businessDetails.lessorAddress} />
                    <InfoRow label="Monthly Rent" value={client.businessDetails.monthlyRent ? `₱${parseFloat(client.businessDetails.monthlyRent).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : undefined} />
                    <InfoRow label="Notarized" value={client.businessDetails.isNotarized ? 'Yes' : 'No'} />
                    <InfoRow label="Documentary Stamp" value={client.businessDetails.hasDocStamp ? 'Yes' : 'No'} />
                  </div>
                )}
              </div>
            ) : (
              <BusinessForm form={businessForm} setForm={setBusinessForm} saving={saving} onCancel={() => setEditingBusiness(false)} onSave={async () => { await save({ businessDetails: businessForm }); setEditingBusiness(false); }} inputCls={inputCls} />
            )}
          </div>
        )}

        {/* ── Corporate Details ─────────────────────── */}
        {activeTab === 'corporate' && (
          <div className="max-w-2xl">
            <SectionHeader title="Corporate Details" onEdit={() => setEditingCorporate(true)} editing={editingCorporate} saving={saving} />
            {!editingCorporate ? (
              <div>
                <InfoRow label="SEC Reg. No." value={client.corporateDetails?.secRegistrationNo} />
                <InfoRow label="Acronym" value={client.corporateDetails?.acronym} />
                <InfoRow label="Suffix" value={client.corporateDetails?.suffix} />
                <InfoRow label="Classification" value={client.corporateDetails?.companyClassification} />
                <InfoRow label="Sub-class" value={client.corporateDetails?.companySubclass} />
                <InfoRow label="Date of Incorporation" value={client.corporateDetails?.dateOfIncorporation} />
                <InfoRow label="Term of Existence" value={client.corporateDetails?.termOfExistence} />
                <InfoRow label="Primary Purpose" value={client.corporateDetails?.primaryPurpose} />
                <InfoRow label="Annual Meeting Date" value={client.corporateDetails?.annualMeetingDate} />
                <InfoRow label="No. of Incorporators" value={client.corporateDetails?.numberOfIncorporators?.toString()} />
                <InfoRow label="Authorized Capital" value={client.corporateDetails?.authorizedCapital ? `₱${parseFloat(client.corporateDetails.authorizedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : undefined} />
                <InfoRow label="Subscribed Capital" value={client.corporateDetails?.subscribedCapital ? `₱${parseFloat(client.corporateDetails.subscribedCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : undefined} />
                <InfoRow label="Paid-Up Capital" value={client.corporateDetails?.paidUpCapital ? `₱${parseFloat(client.corporateDetails.paidUpCapital).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : undefined} />
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">President</p>
                  <InfoRow label="Name" value={[client.corporateDetails?.presidentFirstName, client.corporateDetails?.presidentMiddleName, client.corporateDetails?.presidentLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="TIN" value={client.corporateDetails?.presidentTin} />
                  <InfoRow label="Email" value={client.corporateDetails?.presidentEmail} />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Treasurer</p>
                  <InfoRow label="Name" value={[client.corporateDetails?.treasurerFirstName, client.corporateDetails?.treasurerMiddleName, client.corporateDetails?.treasurerLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="TIN" value={client.corporateDetails?.treasurerTin} />
                  <InfoRow label="Email" value={client.corporateDetails?.treasurerEmail} />
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Secretary</p>
                  <InfoRow label="Name" value={[client.corporateDetails?.secretaryFirstName, client.corporateDetails?.secretaryMiddleName, client.corporateDetails?.secretaryLastName].filter(Boolean).join(' ')} />
                  <InfoRow label="TIN" value={client.corporateDetails?.secretaryTin} />
                  <InfoRow label="Email" value={client.corporateDetails?.secretaryEmail} />
                </div>
              </div>
            ) : (
              <CorporateForm form={corporateForm} setForm={setCorporateForm} saving={saving} onCancel={() => setEditingCorporate(false)} onSave={async () => { await save({ corporateDetails: corporateForm }); setEditingCorporate(false); }} inputCls={inputCls} />
            )}
          </div>
        )}

        {/* ── Shareholders ──────────────────────────── */}
        {activeTab === 'shareholders' && (
          <div className="max-w-3xl">
            <SectionHeader title="Shareholders" onEdit={() => setEditingShareholders(true)} editing={editingShareholders} saving={saving} />
            {!editingShareholders ? (
              <div className="space-y-3">
                {(client.shareholders ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No shareholders recorded.</p>
                ) : (
                  (client.shareholders ?? []).map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-border bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-sm text-foreground">{[s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')}</p>
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
                  ))
                )}
              </div>
            ) : (
              <ShareholdersForm
                form={shareholdersForm}
                setForm={setShareholdersForm}
                saving={saving}
                onCancel={() => setEditingShareholders(false)}
                onSave={async () => { await save({ shareholders: shareholdersForm }); setEditingShareholders(false); }}
                inputCls={inputCls}
              />
            )}
          </div>
        )}

        {/* ── Portal Users ──────────────────────────── */}
        {activeTab === 'portal-users' && (
          <div className="max-w-2xl">
            <h3 className="font-black text-foreground text-base mb-4">Portal Users</h3>
            {client.portalUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No portal users assigned.</p>
            ) : (
              <div className="space-y-3">
                {client.portalUsers.map((u) => (
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

      </div>
    </div>
  );
}

// ─── Individual Form ──────────────────────────────────────────────────────────

function IndividualForm({ form, setForm, saving, onCancel, onSave, inputCls }: {
  form: IndividualDetailsData;
  setForm: React.Dispatch<React.SetStateAction<IndividualDetailsData>>;
  saving: boolean; onCancel: () => void; onSave: () => Promise<void>; inputCls: string;
}) {
  function set(k: keyof IndividualDetailsData, v: string) { setForm((p) => ({ ...p, [k]: v })); }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Field label="First Name" required><input className={inputCls} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
        <Field label="Middle Name"><input className={inputCls} value={form.middleName} onChange={(e) => set('middleName', e.target.value)} /></Field>
        <Field label="Last Name" required><input className={inputCls} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Birth" required><input type="date" className={inputCls} value={form.dob} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="Place of Birth"><input className={inputCls} value={form.placeOfBirth} onChange={(e) => set('placeOfBirth', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Civil Status" required>
          <select className={inputCls} value={form.civilStatus} onChange={(e) => set('civilStatus', e.target.value)}>
            {['Single', 'Married', 'Widowed', 'Legally Separated', 'Annulled'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Gender" required>
          <select className={inputCls} value={form.gender} onChange={(e) => set('gender', e.target.value)}>
            <option>Male</option><option>Female</option>
          </select>
        </Field>
        <Field label="Citizenship"><input className={inputCls} value={form.citizenship} onChange={(e) => set('citizenship', e.target.value)} /></Field>
      </div>
      <Field label="Residential Address"><textarea className={inputCls} rows={2} value={form.residentialAddress} onChange={(e) => set('residentialAddress', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="PRC License No."><input className={inputCls} value={form.prcLicenseNo} onChange={(e) => set('prcLicenseNo', e.target.value)} /></Field>
        <Field label="Primary ID Type"><input className={inputCls} value={form.primaryIdType} onChange={(e) => set('primaryIdType', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary ID Number"><input className={inputCls} value={form.primaryIdNumber} onChange={(e) => set('primaryIdNumber', e.target.value)} /></Field>
        <Field label="Personal Email"><input type="email" className={inputCls} value={form.personalEmail} onChange={(e) => set('personalEmail', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Mobile Number"><input className={inputCls} value={form.mobileNumber} onChange={(e) => set('mobileNumber', e.target.value)} /></Field>
        <Field label="Telephone Number"><input className={inputCls} value={form.telephoneNumber} onChange={(e) => set('telephoneNumber', e.target.value)} /></Field>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Mother&apos;s Information</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Name"><input className={inputCls} value={form.motherFirstName} onChange={(e) => set('motherFirstName', e.target.value)} /></Field>
          <Field label="Middle Name"><input className={inputCls} value={form.motherMiddleName} onChange={(e) => set('motherMiddleName', e.target.value)} /></Field>
          <Field label="Last Name"><input className={inputCls} value={form.motherLastName} onChange={(e) => set('motherLastName', e.target.value)} /></Field>
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Father&apos;s Information</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Name"><input className={inputCls} value={form.fatherFirstName} onChange={(e) => set('fatherFirstName', e.target.value)} /></Field>
          <Field label="Middle Name"><input className={inputCls} value={form.fatherMiddleName} onChange={(e) => set('fatherMiddleName', e.target.value)} /></Field>
          <Field label="Last Name"><input className={inputCls} value={form.fatherLastName} onChange={(e) => set('fatherLastName', e.target.value)} /></Field>
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Spouse Information</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Name"><input className={inputCls} value={form.spouseFirstName} onChange={(e) => set('spouseFirstName', e.target.value)} /></Field>
          <Field label="Middle Name"><input className={inputCls} value={form.spouseMiddleName} onChange={(e) => set('spouseMiddleName', e.target.value)} /></Field>
          <Field label="Last Name"><input className={inputCls} value={form.spouseLastName} onChange={(e) => set('spouseLastName', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Field label="Employment Status"><input className={inputCls} value={form.spouseEmploymentStatus} onChange={(e) => set('spouseEmploymentStatus', e.target.value)} /></Field>
          <Field label="Spouse TIN"><input className={inputCls} value={form.spouseTin} onChange={(e) => set('spouseTin', e.target.value)} /></Field>
          <Field label="Employer Name"><input className={inputCls} value={form.spouseEmployerName} onChange={(e) => set('spouseEmployerName', e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="Employer TIN"><input className={inputCls} value={form.spouseEmployerTin} onChange={(e) => set('spouseEmployerTin', e.target.value)} /></Field>
        </div>
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
        <button disabled={saving} onClick={onSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
      </div>
    </div>
  );
}

// ─── Business Form ────────────────────────────────────────────────────────────

function BusinessForm({ form, setForm, saving, onCancel, onSave, inputCls }: {
  form: BusinessDetailsData;
  setForm: React.Dispatch<React.SetStateAction<BusinessDetailsData>>;
  saving: boolean; onCancel: () => void; onSave: () => Promise<void>; inputCls: string;
}) {
  function set(k: keyof BusinessDetailsData, v: string | number | boolean) { setForm((p) => ({ ...p, [k]: v })); }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Trade Name"><input className={inputCls} value={form.tradeName} onChange={(e) => set('tradeName', e.target.value)} /></Field>
        <Field label="Industry"><input className={inputCls} value={form.industry} onChange={(e) => set('industry', e.target.value)} /></Field>
      </div>
      <Field label="Line of Business"><textarea className={inputCls} rows={2} value={form.lineOfBusiness} onChange={(e) => set('lineOfBusiness', e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="PSIC Code"><input className={inputCls} value={form.psicCode} onChange={(e) => set('psicCode', e.target.value)} /></Field>
        <Field label="Business Area (sqm)"><input type="number" className={inputCls} value={form.businessAreaSqm} onChange={(e) => set('businessAreaSqm', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Landline"><input className={inputCls} value={form.landlineNumber} onChange={(e) => set('landlineNumber', e.target.value)} /></Field>
        <Field label="Fax"><input className={inputCls} value={form.faxNumber} onChange={(e) => set('faxNumber', e.target.value)} /></Field>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Headcount</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Managers"><input type="number" min="0" className={inputCls} value={form.noOfManagers} onChange={(e) => set('noOfManagers', parseInt(e.target.value) || 0)} /></Field>
          <Field label="Supervisors"><input type="number" min="0" className={inputCls} value={form.noOfSupervisors} onChange={(e) => set('noOfSupervisors', parseInt(e.target.value) || 0)} /></Field>
          <Field label="Rank & File"><input type="number" min="0" className={inputCls} value={form.noOfRankAndFile} onChange={(e) => set('noOfRankAndFile', parseInt(e.target.value) || 0)} /></Field>
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Facilities</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Elevators"><input type="number" min="0" className={inputCls} value={form.noOfElevators} onChange={(e) => set('noOfElevators', parseInt(e.target.value) || 0)} /></Field>
          <Field label="Escalators"><input type="number" min="0" className={inputCls} value={form.noOfEscalators} onChange={(e) => set('noOfEscalators', parseInt(e.target.value) || 0)} /></Field>
          <Field label="Aircons"><input type="number" min="0" className={inputCls} value={form.noOfAircons} onChange={(e) => set('noOfAircons', parseInt(e.target.value) || 0)} /></Field>
        </div>
        <div className="flex gap-6 mt-3">
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasCctv} onChange={(e) => set('hasCctv', e.target.checked)} /> Has CCTV</label>
          <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasSignboardLight} onChange={(e) => set('hasSignboardLight', e.target.checked)} /> Lighted Signboard</label>
        </div>
        <div className="mt-4">
          <Field label="Signboard Length"><input className={inputCls} value={form.signboardLength} onChange={(e) => set('signboardLength', e.target.value)} /></Field>
        </div>
      </div>
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">Place of Business</p>
        <Field label="Place Type">
          <select className={inputCls} value={form.placeType} onChange={(e) => set('placeType', e.target.value as PlaceType)}>
            <option value="RENTED">Rented</option>
            <option value="OWNED">Owned</option>
            <option value="FREE_USE">Free Use</option>
          </select>
        </Field>
        {form.placeType === 'RENTED' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Lessor Name"><input className={inputCls} value={form.lessorName} onChange={(e) => set('lessorName', e.target.value)} /></Field>
              <Field label="Monthly Rent (₱)"><input type="number" className={inputCls} value={form.monthlyRent} onChange={(e) => set('monthlyRent', e.target.value)} /></Field>
            </div>
            <Field label="Lessor Address"><textarea className={inputCls} rows={2} value={form.lessorAddress} onChange={(e) => set('lessorAddress', e.target.value)} /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rent Contract URL"><input className={inputCls} value={form.rentContractUrl} onChange={(e) => set('rentContractUrl', e.target.value)} /></Field>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isNotarized} onChange={(e) => set('isNotarized', e.target.checked)} /> Notarized</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.hasDocStamp} onChange={(e) => set('hasDocStamp', e.target.checked)} /> Documentary Stamp</label>
            </div>
          </div>
        )}
        {form.placeType === 'OWNED' && (
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Property Owner"><input className={inputCls} value={form.propertyOwner} onChange={(e) => set('propertyOwner', e.target.value)} /></Field>
              <Field label="Owned Docs URL"><input className={inputCls} value={form.ownedDocsUrl} onChange={(e) => set('ownedDocsUrl', e.target.value)} /></Field>
            </div>
            <Field label="Reason / Notes"><textarea className={inputCls} rows={2} value={form.ownedReason} onChange={(e) => set('ownedReason', e.target.value)} /></Field>
          </div>
        )}
        {form.placeType === 'FREE_USE' && (
          <div className="mt-4">
            <Field label="Reason for Free Use"><textarea className={inputCls} rows={2} value={form.noRentReason} onChange={(e) => set('noRentReason', e.target.value)} /></Field>
          </div>
        )}
      </div>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
        <button disabled={saving} onClick={onSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
      </div>
    </div>
  );
}

// ─── Corporate Form ───────────────────────────────────────────────────────────

function CorporateForm({ form, setForm, saving, onCancel, onSave, inputCls }: {
  form: CorporateDetailsData;
  setForm: React.Dispatch<React.SetStateAction<CorporateDetailsData>>;
  saving: boolean; onCancel: () => void; onSave: () => Promise<void>; inputCls: string;
}) {
  function set(k: keyof CorporateDetailsData, v: string | number | boolean | null) { setForm((p) => ({ ...p, [k]: v })); }

  type OfficerPrefix = 'president' | 'treasurer' | 'secretary';
  function OfficerFields({ prefix, label }: { prefix: OfficerPrefix; label: string }) {
    const fk = `${prefix}FirstName` as keyof CorporateDetailsData;
    const mk = `${prefix}MiddleName` as keyof CorporateDetailsData;
    const lk = `${prefix}LastName` as keyof CorporateDetailsData;
    const gk = `${prefix}Gender` as keyof CorporateDetailsData;
    const nk = `${prefix}Nationality` as keyof CorporateDetailsData;
    const ak = `${prefix}Address` as keyof CorporateDetailsData;
    const tk = `${prefix}Tin` as keyof CorporateDetailsData;
    const ek = `${prefix}Email` as keyof CorporateDetailsData;
    const dk = `${prefix}Dob` as keyof CorporateDetailsData;
    return (
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
        <div className="grid grid-cols-3 gap-4">
          <Field label="First Name"><input className={inputCls} value={form[fk] as string} onChange={(e) => set(fk, e.target.value)} /></Field>
          <Field label="Middle Name"><input className={inputCls} value={form[mk] as string} onChange={(e) => set(mk, e.target.value)} /></Field>
          <Field label="Last Name"><input className={inputCls} value={form[lk] as string} onChange={(e) => set(lk, e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <Field label="Gender"><select className={inputCls} value={form[gk] as string} onChange={(e) => set(gk, e.target.value)}><option value="">—</option><option>Male</option><option>Female</option></select></Field>
          <Field label="Nationality"><input className={inputCls} value={form[nk] as string} onChange={(e) => set(nk, e.target.value)} /></Field>
          <Field label="Date of Birth"><input type="date" className={inputCls} value={form[dk] as string} onChange={(e) => set(dk, e.target.value)} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <Field label="TIN"><input className={inputCls} value={form[tk] as string} onChange={(e) => set(tk, e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={form[ek] as string} onChange={(e) => set(ek, e.target.value)} /></Field>
        </div>
        <div className="mt-4">
          <Field label="Address"><textarea className={inputCls} rows={2} value={form[ak] as string} onChange={(e) => set(ak, e.target.value)} /></Field>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="SEC Registration No."><input className={inputCls} value={form.secRegistrationNo} onChange={(e) => set('secRegistrationNo', e.target.value)} /></Field>
        <Field label="Acronym"><input className={inputCls} value={form.acronym} onChange={(e) => set('acronym', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Suffix"><input className={inputCls} value={form.suffix} onChange={(e) => set('suffix', e.target.value)} /></Field>
        <Field label="Classification"><input className={inputCls} value={form.companyClassification} onChange={(e) => set('companyClassification', e.target.value)} /></Field>
        <Field label="Sub-class"><input className={inputCls} value={form.companySubclass} onChange={(e) => set('companySubclass', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date of Incorporation"><input type="date" className={inputCls} value={form.dateOfIncorporation} onChange={(e) => set('dateOfIncorporation', e.target.value)} /></Field>
        <Field label="Annual Meeting Date"><input type="date" className={inputCls} value={form.annualMeetingDate} onChange={(e) => set('annualMeetingDate', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Term of Existence"><input className={inputCls} value={form.termOfExistence} onChange={(e) => set('termOfExistence', e.target.value)} /></Field>
        <Field label="No. of Incorporators"><input type="number" min="0" className={inputCls} value={form.numberOfIncorporators ?? ''} onChange={(e) => set('numberOfIncorporators', parseInt(e.target.value) || null)} /></Field>
      </div>
      <Field label="Primary Purpose"><textarea className={inputCls} rows={2} value={form.primaryPurpose} onChange={(e) => set('primaryPurpose', e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Authorized Capital (₱)"><input type="number" className={inputCls} value={form.authorizedCapital} onChange={(e) => set('authorizedCapital', e.target.value)} /></Field>
        <Field label="Subscribed Capital (₱)"><input type="number" className={inputCls} value={form.subscribedCapital} onChange={(e) => set('subscribedCapital', e.target.value)} /></Field>
        <Field label="Paid-Up Capital (₱)"><input type="number" className={inputCls} value={form.paidUpCapital} onChange={(e) => set('paidUpCapital', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary Email"><input type="email" className={inputCls} value={form.primaryEmail} onChange={(e) => set('primaryEmail', e.target.value)} /></Field>
        <Field label="Secondary Email"><input type="email" className={inputCls} value={form.secondaryEmail} onChange={(e) => set('secondaryEmail', e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Primary Contact No."><input className={inputCls} value={form.primaryContactNo} onChange={(e) => set('primaryContactNo', e.target.value)} /></Field>
        <Field label="Secondary Contact No."><input className={inputCls} value={form.secondaryContactNo} onChange={(e) => set('secondaryContactNo', e.target.value)} /></Field>
      </div>
      <OfficerFields prefix="president" label="President" />
      <OfficerFields prefix="treasurer" label="Treasurer" />
      <OfficerFields prefix="secretary" label="Secretary" />
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
        <button disabled={saving} onClick={onSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
        </button>
      </div>
    </div>
  );
}

// ─── Shareholders Form ────────────────────────────────────────────────────────

function ShareholdersForm({ form, setForm, saving, onCancel, onSave, inputCls }: {
  form: ShareholderData[];
  setForm: React.Dispatch<React.SetStateAction<ShareholderData[]>>;
  saving: boolean; onCancel: () => void; onSave: () => Promise<void>; inputCls: string;
}) {
  function update(i: number, k: keyof ShareholderData, v: string | number) {
    setForm((prev) => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  }
  function add() { setForm((prev) => [...prev, { ...emptyShareholder(), orderSequence: prev.length }]); }
  function remove(i: number) { setForm((prev) => prev.filter((_, idx) => idx !== i)); }
  function moveUp(i: number) {
    if (i === 0) return;
    setForm((prev) => {
      const next = [...prev];
      [next[i - 1], next[i]] = [next[i]!, next[i - 1]!];
      return next.map((s, idx) => ({ ...s, orderSequence: idx }));
    });
  }
  function moveDown(i: number) {
    setForm((prev) => {
      if (i >= prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + 1]] = [next[i + 1]!, next[i]!];
      return next.map((s, idx) => ({ ...s, orderSequence: idx }));
    });
  }

  return (
    <div className="space-y-4">
      {form.map((s, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Shareholder #{i + 1}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => moveUp(i)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground" title="Move up"><ChevronUp size={14} /></button>
              <button onClick={() => moveDown(i)} className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground" title="Move down"><ChevronDown size={14} /></button>
              <button onClick={() => remove(i)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-500" title="Remove"><Trash2 size={14} /></button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="First Name" required><input className={inputCls} value={s.firstName} onChange={(e) => update(i, 'firstName', e.target.value)} /></Field>
            <Field label="Middle Name"><input className={inputCls} value={s.middleName} onChange={(e) => update(i, 'middleName', e.target.value)} /></Field>
            <Field label="Last Name" required><input className={inputCls} value={s.lastName} onChange={(e) => update(i, 'lastName', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Date of Birth"><input type="date" className={inputCls} value={s.dob} onChange={(e) => update(i, 'dob', e.target.value)} /></Field>
            <Field label="Gender"><select className={inputCls} value={s.gender} onChange={(e) => update(i, 'gender', e.target.value)}><option>Male</option><option>Female</option></select></Field>
            <Field label="Nationality"><input className={inputCls} value={s.nationality} onChange={(e) => update(i, 'nationality', e.target.value)} /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="TIN"><input className={inputCls} value={s.tin} onChange={(e) => update(i, 'tin', e.target.value)} /></Field>
            <Field label="No. of Shares" required><input type="number" className={inputCls} value={s.numberOfShares} onChange={(e) => update(i, 'numberOfShares', e.target.value)} /></Field>
            <Field label="Paid-Up Capital (₱)" required><input type="number" className={inputCls} value={s.paidUpCapital} onChange={(e) => update(i, 'paidUpCapital', e.target.value)} /></Field>
          </div>
          <Field label="Method of Payment">
            <select className={inputCls} value={s.methodOfPayment} onChange={(e) => update(i, 'methodOfPayment', e.target.value)}>
              <option value="CASH">Cash</option>
              <option value="NON-CASH">Non-Cash</option>
            </select>
          </Field>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[#25238e] border border-[#25238e]/30 rounded-xl hover:bg-[#25238e]/5 transition-colors w-full justify-center">
        <Plus size={14} /> Add Shareholder
      </button>
      <div className="flex gap-3 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 text-sm font-semibold text-muted-foreground border border-border rounded-xl hover:bg-muted transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
        <button disabled={saving} onClick={onSave} className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors disabled:opacity-60">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save All Shareholders
        </button>
      </div>
    </div>
  );
}
