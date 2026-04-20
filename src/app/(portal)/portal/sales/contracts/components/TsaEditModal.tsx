// src/app/(portal)/portal/sales/contracts/components/TsaEditModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { TsaListItem } from '@/app/api/sales/tsa/route';

interface TsaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  tsa: TsaListItem;
  onSaved: (updated: TsaListItem) => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30';

export function TsaEditModal({ isOpen, onClose, tsa, onSaved }: TsaEditModalProps): React.ReactNode {
  const { success, error } = useToast();

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
  const [saving, setSaving] = useState(false);

  // Pre-fill from TsaListItem when modal opens — all fields are already present
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setBusinessName(tsa.businessName);
      setAuthorizedRep(tsa.authorizedRep);
      setDocumentDate(tsa.documentDate.slice(0, 10));
      setEmail(tsa.email ?? '');
      setPhone(tsa.phone ?? '');
      setTin(tsa.tin ?? '');
      setCivilStatus(tsa.civilStatus ?? '');
      setBusinessAddress(tsa.businessAddress ?? '');
      setResidenceAddress(tsa.residenceAddress ?? '');
      setIsBusinessRegistered(tsa.isBusinessRegistered);
      setLockInMonths(tsa.lockInMonths);
    }
  }

  // Also reset if the tsa prop changes while open
  useEffect(() => {
    if (!isOpen) return;
    setBusinessName(tsa.businessName);
    setAuthorizedRep(tsa.authorizedRep);
    setDocumentDate(tsa.documentDate.slice(0, 10));
    setEmail(tsa.email ?? '');
    setPhone(tsa.phone ?? '');
    setTin(tsa.tin ?? '');
    setCivilStatus(tsa.civilStatus ?? '');
    setBusinessAddress(tsa.businessAddress ?? '');
    setResidenceAddress(tsa.residenceAddress ?? '');
    setIsBusinessRegistered(tsa.isBusinessRegistered);
    setLockInMonths(tsa.lockInMonths);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tsa.id]);

  const handleSave = async () => {
    if (!businessName.trim() || !authorizedRep.trim()) {
      error('Required fields', 'Business name and authorized representative are required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/sales/tsa/${tsa.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
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
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to save', json.error ?? 'Please try again.');
        return;
      }
      success('TSA updated', 'Contract details have been saved.');
      // Merge the updated fields into the TsaListItem shape for the caller
      onSaved({
        ...tsa,
        businessName: businessName.trim(),
        authorizedRep: authorizedRep.trim(),
        documentDate: new Date(documentDate).toISOString(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        tin: tin.trim() || null,
        civilStatus: civilStatus.trim() || null,
        businessAddress: businessAddress.trim() || null,
        residenceAddress: residenceAddress.trim() || null,
        isBusinessRegistered,
        lockInMonths,
      });
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit TSA — ${tsa.referenceNumber}`} size="2xl">
      <div className="overflow-y-auto max-h-[80vh] px-6 py-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Business Name <span className="text-red-500">*</span>
            </label>
            <input type="text" className={inputClass} value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">
              Authorized Representative <span className="text-red-500">*</span>
            </label>
            <input type="text" className={inputClass} value={authorizedRep} onChange={(e) => setAuthorizedRep(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Document Date <span className="text-red-500">*</span></label>
            <input type="date" className={inputClass} value={documentDate} onChange={(e) => setDocumentDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">TIN</label>
            <input type="text" className={inputClass} placeholder="e.g. 123-456-789" value={tin} onChange={(e) => setTin(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Email</label>
            <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Phone</label>
            <input type="text" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Civil Status</label>
            <select className={inputClass} value={civilStatus} onChange={(e) => setCivilStatus(e.target.value)}>
              <option value="">— Select —</option>
              <option>Single</option>
              <option>Married</option>
              <option>Widowed</option>
              <option>Legally Separated</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Lock-in Period (months)</label>
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
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Business Address</label>
            <input type="text" className={inputClass} value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Residence Address</label>
            <input type="text" className={inputClass} value={residenceAddress} onChange={(e) => setResidenceAddress(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                className="rounded border-slate-300 accent-blue-600"
                checked={isBusinessRegistered}
                onChange={(e) => setIsBusinessRegistered(e.target.checked)}
              />
              <span className="text-sm text-slate-700">Business is registered (DTI / SEC)</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X size={14} className="mr-1.5" /> Cancel
          </Button>
          <Button
            className="bg-[#25238e] text-white hover:bg-[#1e1c7a]"
            disabled={saving || !businessName.trim() || !authorizedRep.trim()}
            onClick={() => { void handleSave(); }}
          >
            {saving
              ? <Loader2 size={14} className="animate-spin mr-2" />
              : <Save size={14} className="mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
