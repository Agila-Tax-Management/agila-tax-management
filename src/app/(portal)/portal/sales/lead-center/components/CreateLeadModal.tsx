// src/app/(portal)/portal/sales/lead-center/components/CreateLeadModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { BUSINESS_TYPES, LEAD_SOURCES } from '@/lib/constants';

interface LeadStatus {
  id: number;
  name: string;
  color: string | null;
  sequence: number;
  isOnboarding: boolean;
  isConverted: boolean;
}

interface AssignedAgent { id: string; name: string; email: string; }

interface Lead {
  id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  businessName: string | null;
  contactNumber: string | null;
  businessType: string;
  leadSource: string;
  address: string | null;
  notes: string | null;
  statusId: number;
  status: LeadStatus;
  assignedAgentId: string | null;
  assignedAgent: AssignedAgent | null;
  isAccountCreated: boolean;
  isCallRequest: boolean;
  phoneCallSchedule: string | null;
  isOfficeVisit: boolean;
  officeVisitSchedule: string | null;
  isClientVisit: boolean;
  clientVisitSchedule: string | null;
  clientVisitLocation: string | null;
  isVirtualMeeting: boolean;
  virtualMeetingSchedule: string | null;
  onboardingSchedule: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

const emptyForm = {
  firstName: '',
  middleName: '',
  lastName: '',
  businessName: '',
  contactNumber: '',
  businessType: BUSINESS_TYPES[0] ?? 'Not Specified',
  leadSource: LEAD_SOURCES[0] ?? 'Manual',
  address: '',
  notes: '',
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
};

interface AgentOption { id: string; name: string | null; email: string; }

export function CreateLeadModal({ isOpen, onClose, onSaved }: CreateLeadModalProps): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [agents, setAgents] = useState<AgentOption[]>([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const res = await fetch('/api/sales/agents');
        const data = (await res.json()) as { data?: AgentOption[] };
        if (res.ok && data.data) setAgents(data.data);
      } catch { /* non-critical */ }
    };
    void fetchAgents();
  }, []);

  const set = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = 'First name is required';
    if (!form.lastName.trim()) errs.lastName = 'Last name is required';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
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

      const res = await fetch('/api/sales/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { data?: Lead; error?: string };
      if (!res.ok) { error('Failed to create', data.error ?? 'An error occurred.'); return; }
      success('Lead added', `${form.firstName} ${form.lastName} has been added.`);
      onSaved(data.data!);
      setForm(emptyForm);
      setFormErrors({});
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setFormErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Opportunity" size="lg">
      <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
        {/* Name row */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
            Contact Information
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="Juan"
                value={form.firstName}
                onChange={(e) => set('firstName', e.target.value)}
              />
              {formErrors.firstName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Middle Name
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="(optional)"
                value={form.middleName}
                onChange={(e) => set('middleName', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={inputClass}
                placeholder="dela Cruz"
                value={form.lastName}
                onChange={(e) => set('lastName', e.target.value)}
              />
              {formErrors.lastName && (
                <p className="mt-1 text-xs text-red-500">{formErrors.lastName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Business info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Business Name
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="Optional"
              value={form.businessName}
              onChange={(e) => set('businessName', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Contact Number
            </label>
            <input
              type="text"
              className={inputClass}
              placeholder="09xxxxxxxxx"
              value={form.contactNumber}
              onChange={(e) => set('contactNumber', e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Business Type
            </label>
            <select
              className={inputClass}
              value={form.businessType}
              onChange={(e) => set('businessType', e.target.value)}
            >
              {BUSINESS_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Lead Source
            </label>
            <select
              className={inputClass}
              value={form.leadSource}
              onChange={(e) => set('leadSource', e.target.value)}
            >
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Address
          </label>
          <input
            type="text"
            className={inputClass}
            placeholder="Street, Barangay, City"
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Notes
          </label>
          <textarea
            className={inputClass + ' min-h-[72px] resize-none'}
            placeholder="Optional notes..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Assigned Sales
          </label>
          <select
            className={inputClass}
            value={form.assignedAgentId}
            onChange={(e) => set('assignedAgentId', e.target.value)}
          >
            <option value="">— Unassigned —</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name ?? a.email}</option>
            ))}
          </select>
        </div>

        {/* Scheduling section */}
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 pt-1 border-t border-border">
            Scheduling &amp; Engagements
          </h4>
          <div className="space-y-3">
            {/* Phone Call */}
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                <input
                  type="checkbox"
                  className="rounded border-border accent-blue-600"
                  checked={form.isCallRequest}
                  onChange={(e) => set('isCallRequest', e.target.checked)}
                />
                <span className="text-sm font-medium text-foreground">Phone Call</span>
              </label>
              {form.isCallRequest && (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.phoneCallSchedule}
                  onChange={(e) => set('phoneCallSchedule', e.target.value)}
                />
              )}
            </div>

            {/* Office Visit */}
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                <input
                  type="checkbox"
                  className="rounded border-border accent-blue-600"
                  checked={form.isOfficeVisit}
                  onChange={(e) => set('isOfficeVisit', e.target.checked)}
                />
                <span className="text-sm font-medium text-foreground">Office Visit</span>
              </label>
              {form.isOfficeVisit && (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.officeVisitSchedule}
                  onChange={(e) => set('officeVisitSchedule', e.target.value)}
                />
              )}
            </div>

            {/* Client Visit */}
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                <input
                  type="checkbox"
                  className="rounded border-border accent-blue-600"
                  checked={form.isClientVisit}
                  onChange={(e) => set('isClientVisit', e.target.checked)}
                />
                <span className="text-sm font-medium text-foreground">Client Visit</span>
              </label>
              {form.isClientVisit && (
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.clientVisitSchedule}
                    onChange={(e) => set('clientVisitSchedule', e.target.value)}
                  />
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="Visit location"
                    value={form.clientVisitLocation}
                    onChange={(e) => set('clientVisitLocation', e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Virtual Meeting */}
            <div className="flex items-start gap-3">
              <label className="flex items-center gap-2 pt-2 cursor-pointer select-none min-w-[160px]">
                <input
                  type="checkbox"
                  className="rounded border-border accent-blue-600"
                  checked={form.isVirtualMeeting}
                  onChange={(e) => set('isVirtualMeeting', e.target.checked)}
                />
                <span className="text-sm font-medium text-foreground">Virtual Meeting</span>
              </label>
              {form.isVirtualMeeting && (
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={form.virtualMeetingSchedule}
                  onChange={(e) => set('virtualMeetingSchedule', e.target.value)}
                />
              )}
            </div>

            {/* Onboarding Schedule */}
            <div className="flex items-start gap-3">
              <span className="text-sm font-medium text-foreground pt-2 min-w-[160px]">
                Onboarding Schedule
              </span>
              <input
                type="datetime-local"
                className={inputClass}
                value={form.onboardingSchedule}
                onChange={(e) => set('onboardingSchedule', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={() => { void handleSubmit(); }}
            disabled={saving}
            className="bg-[#25238e] text-white"
          >
            {saving && <Loader2 size={14} className="animate-spin mr-2" />}
            Add Lead
          </Button>
        </div>
      </div>
    </Modal>
  );
}
