// src/app/(portal)/portal/sales/lead-center/components/LeadDetailModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, User, Trash2, Save, ChevronDown, UserPlus, CheckCircle2, ExternalLink, Clock, FileText } from 'lucide-react';
import Image from 'next/image';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { BUSINESS_TYPES, LEAD_SOURCES } from '@/lib/constants';
import { LeadHistoryTimeline, type LeadCommentEntry, type LeadHistoryEntry } from './LeadHistoryTimeline';
import { ProvisionAccountModal } from './ProvisionAccountModal';
import { CreateJobOrderModal } from './CreateJobOrderModal';
import type { Lead, LeadStatus, LeadPromo } from './lead-types';

export type { Lead } from './lead-types';

interface FullLead extends Lead {
  comments: LeadCommentEntry[];
  historyLogs: LeadHistoryEntry[];
}

interface LeadDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
  statuses: LeadStatus[];
  onUpdated: (lead: Lead) => void;
  onDeleted: (leadId: number) => void;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

function toLocalDatetime(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getInitials(name: string | null, email: string): string {
  const src = name?.trim() ?? '';
  if (src) {
    const parts = src.split(/\s+/);
    return parts.length >= 2
      ? `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
      : src.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function LeadDetailModal({ isOpen, onClose, lead, statuses, onUpdated, onDeleted }: LeadDetailModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [fullLead, setFullLead] = useState<FullLead | null>(null);
  const [loadingFull, setLoadingFull] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isJobOrderOpen, setIsJobOrderOpen] = useState(false);
  const [tsaUrl, setTsaUrl] = useState('');
  const [tsaEditMode, setTsaEditMode] = useState(false);
  const [savingTsa, setSavingTsa] = useState(false);
  const [signingTsa, setSigningTsa] = useState(false);
  const [agents, setAgents] = useState<{ id: string; name: string | null; email: string; image: string | null }[]>([]);
  const [servicePlans, setServicePlans] = useState<{ id: number; name: string; serviceRate: string; recurring: string }[]>([]);
  const [serviceOneTime, setServiceOneTime] = useState<{ id: number; name: string; serviceRate: string }[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedOneTimeIds, setSelectedOneTimeIds] = useState<number[]>([]);
  const [promos, setPromos] = useState<LeadPromo[]>([]);
  const [selectedPromoId, setSelectedPromoId] = useState<number | null>(null);
  const [agentOpen, setAgentOpen] = useState(false);
  const [promoSearch, setPromoSearch] = useState('');
  const [promoOpen, setPromoOpen] = useState(false);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/sales/agents');
        const data = (await res.json()) as { data?: { id: string; name: string | null; email: string; image: string | null }[] };
        if (res.ok && data.data) setAgents(data.data);
      } catch { /* non-critical */ }
    };
    void fetchAgents();

    const fetchServices = async () => {
      try {
        const [plansRes, oneTimeRes, promosRes] = await Promise.all([
          fetch('/api/sales/service-plans'),
          fetch('/api/sales/service-one-time'),
          fetch('/api/sales/promos?active=true'),
        ]);
        const plansData = (await plansRes.json()) as { data?: { id: number; name: string; serviceRate: string; recurring: string }[] };
        const oneTimeData = (await oneTimeRes.json()) as { data?: { id: number; name: string; serviceRate: string }[] };
        const promosData = (await promosRes.json()) as { data?: LeadPromo[] };
        if (plansRes.ok && plansData.data) setServicePlans(plansData.data);
        if (oneTimeRes.ok && oneTimeData.data) setServiceOneTime(oneTimeData.data);
        if (promosRes.ok && promosData.data) setPromos(promosData.data);
      } catch { /* non-critical */ }
    };
    void fetchServices();
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    businessName: '',
    contactNumber: '',
    businessType: BUSINESS_TYPES[0] ?? 'Not Specified',
    leadSource: LEAD_SOURCES[0] ?? 'Manual',
    address: '',
    notes: '',
    statusId: 0,
    assignedAgentId: '',
    isCallRequest: false,
    phoneCallSchedule: '',
    isOfficeVisit: false,
    officeVisitSchedule: '',
    isClientVisit: false,
    clientVisitSchedule: '',
    clientVisitLocation: '',
    isVirtualMeeting: false,
    virtualMeetingSchedule: '',
    onboardingSchedule: '',
  });

  const populateForm = useCallback((l: Lead) => {
    setForm({
      firstName: l.firstName,
      middleName: l.middleName ?? '',
      lastName: l.lastName,
      businessName: l.businessName ?? '',
      contactNumber: l.contactNumber ?? '',
      businessType: l.businessType,
      leadSource: l.leadSource,
      address: l.address ?? '',
      notes: l.notes ?? '',
      statusId: l.statusId,
      assignedAgentId: l.assignedAgentId ?? '',
      isCallRequest: l.isCallRequest,
      phoneCallSchedule: toLocalDatetime(l.phoneCallSchedule),
      isOfficeVisit: l.isOfficeVisit,
      officeVisitSchedule: toLocalDatetime(l.officeVisitSchedule),
      isClientVisit: l.isClientVisit,
      clientVisitSchedule: toLocalDatetime(l.clientVisitSchedule),
      clientVisitLocation: l.clientVisitLocation ?? '',
      isVirtualMeeting: l.isVirtualMeeting,
      virtualMeetingSchedule: toLocalDatetime(l.virtualMeetingSchedule),
      onboardingSchedule: toLocalDatetime(l.onboardingSchedule),
    });
    setSelectedPlanId(l.servicePlans[0]?.id ?? null);
    setSelectedOneTimeIds(l.serviceOneTimePlans.map((s) => s.id));
    setSelectedPromoId(l.promo?.id ?? null);
    setTsaUrl(l.signedTsaUrl ?? '');
    setTsaEditMode(false);
  }, []);

  useEffect(() => {
    if (!isOpen || !lead) {
      setFullLead(null);
      return;
    }
    populateForm(lead);
    const fetchFull = async () => {
      setLoadingFull(true);
      try {
        const res = await fetch(`/api/sales/leads/${lead.id}`);
        const data = (await res.json()) as { data?: FullLead; error?: string };
        if (res.ok && data.data) {
          setFullLead(data.data);
          populateForm(data.data);
        }
      } finally {
        setLoadingFull(false);
      }
    };
    void fetchFull();
  }, [isOpen, lead, populateForm]);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim() || null,
        lastName: form.lastName.trim(),
        businessName: form.businessName.trim() || null,
        contactNumber: form.contactNumber.trim() || null,
        businessType: form.businessType,
        leadSource: form.leadSource,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
        assignedAgentId: form.assignedAgentId || null,
        statusId: form.statusId,
        servicePlanIds: selectedPlanId !== null ? [selectedPlanId] : [],
        serviceOneTimeIds: selectedOneTimeIds,
        promoId: selectedPromoId,
        isCallRequest: form.isCallRequest,
        phoneCallSchedule: form.isCallRequest && form.phoneCallSchedule ? new Date(form.phoneCallSchedule).toISOString() : null,
        isOfficeVisit: form.isOfficeVisit,
        officeVisitSchedule: form.isOfficeVisit && form.officeVisitSchedule ? new Date(form.officeVisitSchedule).toISOString() : null,
        isClientVisit: form.isClientVisit,
        clientVisitSchedule: form.isClientVisit && form.clientVisitSchedule ? new Date(form.clientVisitSchedule).toISOString() : null,
        clientVisitLocation: form.isClientVisit ? form.clientVisitLocation.trim() || null : null,
        isVirtualMeeting: form.isVirtualMeeting,
        virtualMeetingSchedule: form.isVirtualMeeting && form.virtualMeetingSchedule ? new Date(form.virtualMeetingSchedule).toISOString() : null,
        onboardingSchedule: form.onboardingSchedule ? new Date(form.onboardingSchedule).toISOString() : null,
      };

      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { data?: Lead; error?: string };
      if (!res.ok) { error('Save failed', data.error ?? 'Could not save changes.'); return; }
      success('Changes saved', `${data.data!.firstName} ${data.data!.lastName} has been updated.`);
      onUpdated(data.data!);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    if (!confirm(`Delete lead "${lead.firstName} ${lead.lastName}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, { method: 'DELETE' });
      if (!res.ok) { error('Delete failed', 'Could not delete the lead.'); return; }
      success('Lead deleted', `${lead.firstName} ${lead.lastName} has been removed.`);
      onDeleted(lead.id);
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setDeleting(false);
    }
  };

  if (!lead) return null;

  const handleCreateAccount = () => {
    if (lead.servicePlans.length === 0 && lead.serviceOneTimePlans.length === 0) {
      error(
        'Cannot create account',
        'No services or plans attached to this lead.',
      );
      return;
    }
    setIsProvisionOpen(true);
  };

  const handleProvisioned = (updatedLead: Lead) => {
    onUpdated(updatedLead);
  };

  const handleSaveTsaUrl = async () => {
    if (!lead) return;
    if (lead.servicePlans.length === 0 && lead.serviceOneTimePlans.length === 0) {
      error('Cannot save TSA', 'Please attach at least one service or plan to this lead first.');
      return;
    }
    setSavingTsa(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedTsaUrl: tsaUrl.trim() || null }),
      });
      const data = (await res.json()) as { data?: Lead; error?: string };
      if (!res.ok) { error('Save failed', data.error ?? 'Could not save TSA URL.'); return; }
      success('TSA URL saved', 'The TSA document URL has been saved.');
      onUpdated(data.data!);
      setTsaEditMode(false);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSavingTsa(false);
    }
  };

  const handleSignTsa = async () => {
    if (!lead) return;
    setSigningTsa(true);
    try {
      const res = await fetch(`/api/sales/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSignedTSA: true }),
      });
      const data = (await res.json()) as { data?: Lead; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'Could not mark TSA as signed.'); return; }
      success('TSA Signed', 'The TSA has been marked as signed and recorded in the timeline.');
      onUpdated(data.data!);
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSigningTsa(false);
    }
  };

  const appliedPromo = selectedPromoId !== null ? (promos.find((p) => p.id === selectedPromoId) ?? null) : null;
  const selectedAgent = agents.find((a) => a.id === form.assignedAgentId) ?? null;
  const primaryInvoice = (fullLead ?? lead).invoices?.[0] ?? null;
  const invoicePaid = primaryInvoice?.status === 'PAID';
  const filteredPromos = promos
    .filter((p) =>
      p.promoFor === 'BOTH' ||
      (p.promoFor === 'SERVICE_PLAN' && selectedPlanId !== null) ||
      (p.promoFor === 'SERVICE_ONE_TIME' && selectedOneTimeIds.length > 0)
    )
    .filter((p) =>
      promoSearch === '' ||
      p.name.toLowerCase().includes(promoSearch.toLowerCase()) ||
      (p.code?.toLowerCase().includes(promoSearch.toLowerCase()) ?? false)
    );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${lead.firstName} ${lead.lastName}`}
      size="4xl"
    >
      <div className="flex h-[78vh] overflow-hidden">
        {/* Left panel — 70% — editable lead details */}
        <div className="flex-[7] border-r border-border overflow-y-auto px-6 py-5 space-y-5">
          {/* Header with status badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600/10 flex items-center justify-center shrink-0">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pipeline stage</p>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                style={{ backgroundColor: lead.status.color ?? '#64748b' }}
              >
                {lead.status.name}
              </span>
            </div>
            <div className="ml-auto">
              <select
                className="text-xs rounded-lg border border-border bg-background px-2 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                value={form.statusId}
                onChange={(e) => set('statusId', parseInt(e.target.value, 10))}
              >
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
              Contact Information
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">First Name</label>
                <input type="text" className={inputClass} value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Middle Name</label>
                <input type="text" className={inputClass} value={form.middleName} onChange={(e) => set('middleName', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Last Name</label>
                <input type="text" className={inputClass} value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Business Name</label>
              <input type="text" className={inputClass} value={form.businessName} placeholder="Optional" onChange={(e) => set('businessName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contact Number</label>
              <input type="text" className={inputClass} value={form.contactNumber} placeholder="09xxxxxxxxx" onChange={(e) => set('contactNumber', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Business Type</label>
              <select className={inputClass} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Lead Source</label>
              <select className={inputClass} value={form.leadSource} onChange={(e) => set('leadSource', e.target.value)}>
                {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Address</label>
            <input type="text" className={inputClass} value={form.address} placeholder="Street, Barangay, City" onChange={(e) => set('address', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
            <textarea
              className={inputClass + ' min-h-[72px] resize-none'}
              value={form.notes}
              placeholder="Optional notes..."
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Assigned Sales</label>
            <div className="relative">
              <button
                type="button"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 flex items-center gap-2"
                onClick={() => setAgentOpen((v) => !v)}
                onBlur={() => setTimeout(() => setAgentOpen(false), 100)}
              >
                {selectedAgent ? (
                  <>
                    {selectedAgent.image ? (
                      <Image
                        src={selectedAgent.image}
                        alt={selectedAgent.name ?? selectedAgent.email}
                        width={22}
                        height={22}
                        className="rounded-full shrink-0 object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="w-5.5 h-5.5 rounded-full bg-blue-600/15 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-400 shrink-0">
                        {getInitials(selectedAgent.name, selectedAgent.email)}
                      </span>
                    )}
                    <span className="flex-1 text-left">{selectedAgent.name ?? selectedAgent.email}</span>
                  </>
                ) : (
                  <span className="flex-1 text-left text-muted-foreground">— Unassigned —</span>
                )}
                <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
              </button>
              {agentOpen && (
                <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
                  <div className="max-h-48 overflow-y-auto">
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
                      onMouseDown={(e) => { e.preventDefault(); set('assignedAgentId', ''); setAgentOpen(false); }}
                    >
                      <span className="w-6 h-6 rounded-full border border-dashed border-muted-foreground/30 shrink-0" />
                      <span>— Unassigned —</span>
                    </button>
                    {agents.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); set('assignedAgentId', a.id); setAgentOpen(false); }}
                      >
                        {a.image ? (
                          <Image
                            src={a.image}
                            alt={a.name ?? a.email}
                            width={24}
                            height={24}
                            className="rounded-full shrink-0 object-cover"
                            unoptimized
                          />
                        ) : (
                          <span className="w-6 h-6 rounded-full bg-blue-600/15 flex items-center justify-center text-[10px] font-bold text-blue-700 dark:text-blue-400 shrink-0">
                            {getInitials(a.name, a.email)}
                          </span>
                        )}
                        <span>{a.name ?? a.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Scheduling */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 pt-1 border-t border-border">
              Scheduling &amp; Engagements
            </h4>
            <div className="space-y-3">
              {/* Phone Call */}
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                  <input type="checkbox" className="rounded border-border accent-blue-600" checked={form.isCallRequest} onChange={(e) => set('isCallRequest', e.target.checked)} />
                  <span className="text-sm font-medium text-foreground">Phone Call</span>
                </label>
                {form.isCallRequest && (
                  <input type="datetime-local" className={inputClass} value={form.phoneCallSchedule} onChange={(e) => set('phoneCallSchedule', e.target.value)} />
                )}
              </div>
              {/* Office Visit */}
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                  <input type="checkbox" className="rounded border-border accent-blue-600" checked={form.isOfficeVisit} onChange={(e) => set('isOfficeVisit', e.target.checked)} />
                  <span className="text-sm font-medium text-foreground">Office Visit</span>
                </label>
                {form.isOfficeVisit && (
                  <input type="datetime-local" className={inputClass} value={form.officeVisitSchedule} onChange={(e) => set('officeVisitSchedule', e.target.value)} />
                )}
              </div>
              {/* Client Visit */}
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                  <input type="checkbox" className="rounded border-border accent-blue-600" checked={form.isClientVisit} onChange={(e) => set('isClientVisit', e.target.checked)} />
                  <span className="text-sm font-medium text-foreground">Client Visit</span>
                </label>
                {form.isClientVisit && (
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="datetime-local" className={inputClass} value={form.clientVisitSchedule} onChange={(e) => set('clientVisitSchedule', e.target.value)} />
                    <input type="text" className={inputClass} placeholder="Visit location" value={form.clientVisitLocation} onChange={(e) => set('clientVisitLocation', e.target.value)} />
                  </div>
                )}
              </div>
              {/* Virtual Meeting */}
              <div className="flex items-start gap-3">
                <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                  <input type="checkbox" className="rounded border-border accent-blue-600" checked={form.isVirtualMeeting} onChange={(e) => set('isVirtualMeeting', e.target.checked)} />
                  <span className="text-sm font-medium text-foreground">Virtual Meeting</span>
                </label>
                {form.isVirtualMeeting && (
                  <input type="datetime-local" className={inputClass} value={form.virtualMeetingSchedule} onChange={(e) => set('virtualMeetingSchedule', e.target.value)} />
                )}
              </div>
              {/* Onboarding */}
              <div className="flex items-start gap-3">
                <span className="text-sm font-medium text-foreground pt-2 min-w-[160px]">Onboarding Schedule</span>
                <input type="datetime-local" className={inputClass} value={form.onboardingSchedule} onChange={(e) => set('onboardingSchedule', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Services Interested In */}
          <div className="border-t border-border pt-5 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
              Services Interested In
            </h4>

            {/* Recurring Plan — single select via radio */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Recurring Plan <span className="font-normal">(one only)</span>
              </p>
              {servicePlans.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No active recurring plans available.</p>
              ) : (
                <div className="space-y-1.5">
                  {servicePlans.map((plan) => (
                    <label key={plan.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="detailLeadPlan"
                        className="accent-blue-600 shrink-0"
                        checked={selectedPlanId === plan.id}
                        onChange={() => { setSelectedPlanId(plan.id); setSelectedPromoId(null); }}
                      />
                      <span className="text-sm text-foreground group-hover:text-blue-600 transition-colors">{plan.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">
                        ₱{Number(plan.serviceRate).toLocaleString()}/{plan.recurring.toLowerCase()}
                      </span>
                    </label>
                  ))}
                  {selectedPlanId !== null && (
                    <button
                      type="button"
                      onClick={() => { setSelectedPlanId(null); setSelectedPromoId(null); }}
                      className="text-xs text-muted-foreground hover:text-red-500 transition-colors mt-0.5"
                    >
                      ✕ Clear plan
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* One-Time Services — multi-select */}
            {serviceOneTime.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">One-Time Services</p>
                <div className="space-y-1.5">
                  {serviceOneTime.map((svc) => (
                    <label key={svc.id} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="rounded border-border accent-blue-600 shrink-0"
                        checked={selectedOneTimeIds.includes(svc.id)}
                        onChange={(e) =>
                          setSelectedOneTimeIds((prev) =>
                            e.target.checked ? [...prev, svc.id] : prev.filter((x) => x !== svc.id)
                          )
                        }
                      />
                      <span className="text-sm text-foreground group-hover:text-blue-600 transition-colors">{svc.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground shrink-0">₱{Number(svc.serviceRate).toLocaleString()}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Promo — visible only when at least one service is chosen */}
            {(selectedPlanId !== null || selectedOneTimeIds.length > 0) && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  Apply Promo <span className="font-normal">(optional, one only)</span>
                </p>
                <div className="relative">
                  {selectedPromoId !== null ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-sm">
                      <span className="flex-1 text-foreground">
                        {appliedPromo?.name}{appliedPromo?.code ? ` (${appliedPromo.code})` : ''}
                      </span>
                      <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:text-green-400 text-xs font-semibold">
                        {appliedPromo?.discountType === 'PERCENTAGE'
                          ? `−${appliedPromo.discountRate}%`
                          : `−₱${Number(appliedPromo?.discountRate).toLocaleString()}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => { setSelectedPromoId(null); setPromoSearch(''); }}
                        className="text-muted-foreground hover:text-red-500 transition-colors ml-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Search by promo name or code..."
                        value={promoSearch}
                        onChange={(e) => { setPromoSearch(e.target.value); setPromoOpen(true); }}
                        onFocus={() => setPromoOpen(true)}
                        onBlur={() => setTimeout(() => setPromoOpen(false), 100)}
                      />
                      {promoOpen && filteredPromos.length > 0 && (
                        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredPromos.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted/50 transition-colors"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setSelectedPromoId(p.id);
                                setPromoSearch('');
                                setPromoOpen(false);
                              }}
                            >
                              <span>{p.name}{p.code ? ` (${p.code})` : ''}</span>
                              <span className="shrink-0 text-xs font-semibold text-green-600 dark:text-green-400">
                                {p.discountType === 'PERCENTAGE'
                                  ? `−${p.discountRate}%`
                                  : `−₱${Number(p.discountRate).toLocaleString()}`}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pipeline Documents — TSA */}
          <div className="border-t border-border pt-5">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
              Pipeline Documents
            </h4>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Signed TSA URL
              </label>
              {lead.isSignedTSA ? (
                /* ── Signed & locked ── */
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <a
                    href={lead.signedTsaUrl ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {lead.signedTsaUrl}
                  </a>
                  <ExternalLink size={12} className="text-blue-600 shrink-0" />
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:text-green-400 text-[11px] font-semibold shrink-0">
                    <CheckCircle2 size={10} /> TSA Signed
                  </span>
                </div>
              ) : lead.signedTsaUrl && !tsaEditMode ? (
                /* ── Has URL, not signed, view mode ── */
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <a
                    href={lead.signedTsaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 text-sm text-blue-600 hover:underline truncate"
                  >
                    {lead.signedTsaUrl}
                  </a>
                  <ExternalLink size={12} className="text-blue-600 shrink-0" />
                  <button
                    type="button"
                    onClick={() => setTsaEditMode(true)}
                    className="text-xs font-medium text-muted-foreground hover:text-foreground px-2 py-1 rounded border border-border transition-colors shrink-0"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => { void handleSignTsa(); }}
                    disabled={signingTsa}
                    className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0 flex items-center gap-1"
                  >
                    {signingTsa ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                    Signed
                  </button>
                </div>
              ) : (
                /* ── No URL or edit mode — show input + save ── */
                <div className="flex gap-2">
                  <input
                    type="url"
                    className={inputClass}
                    placeholder="https://drive.google.com/..."
                    value={tsaUrl}
                    onChange={(e) => setTsaUrl(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => { void handleSaveTsaUrl(); }}
                    disabled={savingTsa || !tsaUrl.trim()}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#25238e] text-white hover:bg-[#1e1c7a] disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                  >
                    {savingTsa ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    Save
                  </button>
                  {lead.signedTsaUrl && tsaEditMode && (
                    <button
                      type="button"
                      onClick={() => { setTsaUrl(lead.signedTsaUrl ?? ''); setTsaEditMode(false); }}
                      className="text-xs text-muted-foreground px-2 py-1 rounded-lg border border-border hover:text-foreground transition-colors shrink-0"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <Button
              variant="outline"
              onClick={() => { void handleDelete(); }}
              disabled={deleting || saving}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              {deleting ? <Loader2 size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
              Delete Lead
            </Button>
            <div className="flex items-center gap-2">
            {lead.status.isOnboarding && (
                lead.isAccountCreated ? (
                  lead.isSignedTSA && invoicePaid ? (
                    lead.isCreatedJobOrder ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 border border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400 text-xs font-semibold">
                        <CheckCircle2 size={13} /> Job Order Created
                        {(fullLead ?? lead).jobOrders?.[0] && (
                          <a
                            href="/portal/sales/job-orders"
                            className="ml-1.5 underline underline-offset-2 hover:text-violet-900 dark:hover:text-violet-200 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View &rarr;
                          </a>
                        )}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-blue-50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 text-xs font-semibold">
                        <Clock size={13} /> Ready for Turn Over
                      </span>
                    )
                  ) : (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                      invoicePaid
                        ? 'bg-blue-50 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                        : 'bg-amber-50 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                    }`}>
                      <Clock size={13} /> {invoicePaid ? 'Ready for Turn Over' : 'Waiting for Payment'}
                    </span>
                  )
                ) : (
                  <Button
                    onClick={handleCreateAccount}
                    disabled={saving || deleting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <UserPlus size={14} className="mr-2" />
                    Create Account
                  </Button>
                )
              )}
              {lead.isAccountCreated && lead.isSignedTSA && invoicePaid && !lead.isCreatedJobOrder && (
                <Button
                  onClick={() => setIsJobOrderOpen(true)}
                  disabled={saving || deleting}
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  <FileText size={14} className="mr-2" />
                  Create Job Order
                </Button>
              )}
              <Button
                onClick={() => { void handleSave(); }}
                disabled={saving || deleting}
                className="bg-[#25238e] text-white"
              >
                {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>

        {/* Right panel — 30% — comments + history */}
        <div className="flex-[3] flex flex-col px-5 py-5">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 shrink-0">
            Activity &amp; Comments
          </h4>
          {loadingFull ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 size={18} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <LeadHistoryTimeline
              leadId={lead.id}
              initialComments={fullLead?.comments ?? []}
              initialHistory={fullLead?.historyLogs ?? []}
              invoices={(fullLead ?? lead).invoices ?? []}
            />
          )}
        </div>
      </div>

      {/* Account Provisioning Modal */}
      {isProvisionOpen && (
        <ProvisionAccountModal
          isOpen={isProvisionOpen}
          onClose={() => setIsProvisionOpen(false)}
          lead={lead}
          onProvisioned={(updatedLead) => {
            handleProvisioned(updatedLead);
            setIsProvisionOpen(false);
          }}
        />
      )}

      {/* Create Job Order Modal */}
      {isJobOrderOpen && (
        <CreateJobOrderModal
          isOpen={isJobOrderOpen}
          onClose={() => setIsJobOrderOpen(false)}
          lead={lead}
          onCreated={(updatedLead: Lead) => {
            onUpdated(updatedLead);
            setIsJobOrderOpen(false);
          }}
        />
      )}
    </Modal>
  );
}
