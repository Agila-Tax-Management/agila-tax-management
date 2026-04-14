// src/components/client-gateway/ClientEditModal.tsx
'use client';

import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { GatewayClient, ClientStatus } from '@/lib/mock-client-gateway-data';

interface ClientEditModalProps {
  client: GatewayClient | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: GatewayClient) => void;
}

type Section = 'contact' | 'business' | 'place' | 'bir';

const SECTION_LABELS: { id: Section; label: string }[] = [
  { id: 'contact',  label: 'Contact Info' },
  { id: 'business', label: 'Business Details' },
  { id: 'place',    label: 'Place of Business' },
  { id: 'bir',      label: 'BIR Details' },
];

function Field({
  label, children, required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50 transition-all';
const selectCls =
  'w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#25238e]/30 focus:border-[#25238e]/50 transition-all appearance-none cursor-pointer';

export function ClientEditModal({ client, isOpen, onClose, onSave }: ClientEditModalProps) {
  const [activeSection, setActiveSection] = useState<Section>('contact');
  const [form, setForm] = useState<GatewayClient | null>(null);
  const [prevClient, setPrevClient] = useState<GatewayClient | null>(null);

  // Sync form when client changes (adjust during render pattern)
  if (client !== prevClient) {
    setPrevClient(client);
    setForm(client ? { ...client } : null);
    setActiveSection('contact');
  }

  if (!isOpen || !form) return null;

  function set<K extends keyof GatewayClient>(key: K, value: GatewayClient[K]) {
    setForm((prev) => prev ? { ...prev, [key]: value } : prev);
  }

  function handleSave() {
    if (form) onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-black text-slate-900">Edit Client</h2>
            <p className="text-xs text-slate-500 mt-0.5">{form.clientNumber} · {form.businessName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
            <X size={18} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="px-6 border-b border-slate-200 flex gap-0 overflow-x-auto shrink-0">
          {SECTION_LABELS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`px-4 py-2.5 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                activeSection === s.id
                  ? 'border-[#25238e] text-[#25238e]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Form body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

          {activeSection === 'contact' && (
            <>
              <Field label="Primary Contact Name" required>
                <input
                  className={inputCls}
                  value={form.primaryContactName}
                  onChange={(e) => set('primaryContactName', e.target.value)}
                />
              </Field>
              <Field label="Email" required>
                <input
                  type="email"
                  className={inputCls}
                  value={form.primaryContactEmail}
                  onChange={(e) => set('primaryContactEmail', e.target.value)}
                />
              </Field>
              <Field label="Phone" required>
                <input
                  className={inputCls}
                  value={form.primaryContactPhone}
                  onChange={(e) => set('primaryContactPhone', e.target.value)}
                />
              </Field>
              <Field label="Alternate Phone">
                <input
                  className={inputCls}
                  value={form.alternatePhone ?? ''}
                  onChange={(e) => set('alternatePhone', e.target.value || undefined)}
                />
              </Field>
            </>
          )}

          {activeSection === 'business' && (
            <>
              <Field label="Business Name" required>
                <input
                  className={inputCls}
                  value={form.businessName}
                  onChange={(e) => set('businessName', e.target.value)}
                />
              </Field>
              <Field label="Business Type" required>
                <select className={selectCls} value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                  <option>Sole Proprietorship</option>
                  <option>Corporation</option>
                  <option>Partnership</option>
                  <option>Cooperative</option>
                </select>
              </Field>
              <Field label="Industry" required>
                <input
                  className={inputCls}
                  value={form.industry}
                  onChange={(e) => set('industry', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="TIN" required>
                  <input
                    className={inputCls}
                    value={form.taxIdentificationNumber}
                    onChange={(e) => set('taxIdentificationNumber', e.target.value)}
                  />
                </Field>
                <Field label="Date of Registration" required>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.dateOfRegistration}
                    onChange={(e) => set('dateOfRegistration', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="Service Plan" required>
                <select className={selectCls} value={form.servicePlan} onChange={(e) => set('servicePlan', e.target.value)}>
                  <option>Starter</option>
                  <option>Essentials (VAT)</option>
                  <option>Essentials (Non-VAT)</option>
                  <option>Agila360 (VAT)</option>
                  <option>Agila360 (Non-VAT)</option>
                  <option>VIP (VAT)</option>
                  <option>VIP (Non-VAT)</option>
                </select>
              </Field>
              <Field label="Status" required>
                <select
                  className={selectCls}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as ClientStatus)}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </Field>
            </>
          )}

          {activeSection === 'place' && (
            <>
              <Field label="Street Address" required>
                <input
                  className={inputCls}
                  value={form.streetAddress}
                  onChange={(e) => set('streetAddress', e.target.value)}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Barangay" required>
                  <input
                    className={inputCls}
                    value={form.barangay}
                    onChange={(e) => set('barangay', e.target.value)}
                  />
                </Field>
                <Field label="City" required>
                  <input
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Province" required>
                  <input
                    className={inputCls}
                    value={form.province}
                    onChange={(e) => set('province', e.target.value)}
                  />
                </Field>
                <Field label="Zip Code" required>
                  <input
                    className={inputCls}
                    value={form.zipCode}
                    onChange={(e) => set('zipCode', e.target.value)}
                  />
                </Field>
              </div>
            </>
          )}

          {activeSection === 'bir' && (
            <>
              <Field label="BIR Registration Number" required>
                <input
                  className={inputCls}
                  value={form.birRegistrationNumber}
                  onChange={(e) => set('birRegistrationNumber', e.target.value)}
                />
              </Field>
              <Field label="BIR Registration Date" required>
                <input
                  type="date"
                  className={inputCls}
                  value={form.birRegistrationDate}
                  onChange={(e) => set('birRegistrationDate', e.target.value)}
                />
              </Field>
              <Field label="Certificate of Registration (URL)">
                <input
                  type="url"
                  className={inputCls}
                  placeholder="https://example.com/cor.pdf"
                  value={form.corUrl ?? ''}
                  onChange={(e) => set('corUrl', e.target.value || undefined)}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Provide a cloud storage link to the BIR Certificate of Registration (e.g., Cloudinary, Google Drive)
                </p>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Tax Type" required>
                  <select className={selectCls} value={form.taxType} onChange={(e) => set('taxType', e.target.value)}>
                    <option value="VAT">VAT</option>
                    <option value="Non-VAT">Non-VAT</option>
                  </select>
                </Field>
                <Field label="Revenue District Office" required>
                  <input
                    className={inputCls}
                    value={form.rdo}
                    onChange={(e) => set('rdo', e.target.value)}
                  />
                </Field>
              </div>
              <Field label="BIR Forms (comma-separated)" required>
                <input
                  className={inputCls}
                  value={form.birFormsSeries.join(', ')}
                  onChange={(e) =>
                    set('birFormsSeries', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))
                  }
                />
              </Field>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">All fields marked <span className="text-red-500 font-bold">*</span> are required.</p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-[#25238e] text-white rounded-xl hover:bg-[#1e1c7a] transition-colors shadow-sm shadow-[#25238e]/20"
            >
              <Save size={14} /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
