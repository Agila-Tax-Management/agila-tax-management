// src/app/(portal)/portal/compliance/settings/components/ComplianceSettings.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Settings, UserCheck, Save } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { useToast } from '@/context/ToastContext';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface DefaultApprovers {
  preparedBy:         string;
  verifiedBy:         string;
  paymentProceededBy: string;
  paymentApprovedBy:  string;
  finalApprovedBy:    string;
}

const STORAGE_KEY = 'atms-compliance-default-approvers';

const SIGNATORY_FIELDS: {
  key: keyof DefaultApprovers;
  label:  string;
  role:   string;
  step:   number;
}[] = [
  { key: 'preparedBy',         label: 'Prepared By',           role: 'Compliance Officer', step: 1 },
  { key: 'verifiedBy',         label: 'Verified By',           role: 'Compliance TL',      step: 2 },
  { key: 'paymentProceededBy', label: 'Payment Proceeded By',  role: 'Finance Officer',    step: 3 },
  { key: 'paymentApprovedBy',  label: 'Payment Approved By',   role: 'Finance Manager',    step: 4 },
  { key: 'finalApprovedBy',    label: 'Final Approved By',     role: 'Executive / Admin',  step: 5 },
];

const DEFAULT_VALUES: DefaultApprovers = {
  preparedBy:         '',
  verifiedBy:         '',
  paymentProceededBy: '',
  paymentApprovedBy:  '',
  finalApprovedBy:    '',
};

// ─── Hydration-safe localStorage read ─────────────────────────────────────────

function loadFromStorage(): DefaultApprovers {
  if (typeof window === 'undefined') return DEFAULT_VALUES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VALUES;
    return { ...DEFAULT_VALUES, ...(JSON.parse(raw) as Partial<DefaultApprovers>) };
  } catch {
    return DEFAULT_VALUES;
  }
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function ComplianceSettings(): React.ReactNode {
  const { success, error } = useToast();

  const [mounted,    setMounted]    = useState(false);
  const [approvers,  setApprovers]  = useState<DefaultApprovers>(DEFAULT_VALUES);
  const [isDirty,    setIsDirty]    = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- Hydration-safe: must read localStorage after mount */
  useEffect(() => {
    setApprovers(loadFromStorage());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleChange(key: keyof DefaultApprovers, value: string) {
    setApprovers(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  }

  function handleSave() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(approvers));
      setIsDirty(false);
      success('Settings saved', 'Default working paper signatories have been updated.');
    } catch {
      error('Failed to save', 'Could not save settings. Please try again.');
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">

      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0">
          <Settings size={20} className="text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Settings</h2>
          <p className="text-sm text-slate-500 mt-0.5">Configure default values for compliance working papers.</p>
        </div>
      </div>

      {/* Signatories card */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
          <UserCheck size={15} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-700">
              Default Working Paper Signatories
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              These names will appear as default signatories on all new working papers.
            </p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {SIGNATORY_FIELDS.map(({ key, label, role, step }) => (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-3 items-start gap-3">
              {/* Left: step + label */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-600/10 flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-black text-emerald-700">{step}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{label}</p>
                  <p className="text-[11px] text-slate-400">{role}</p>
                </div>
              </div>

              {/* Right: input */}
              <div className="sm:col-span-2">
                <input
                  type="text"
                  placeholder={`Enter default name for ${label.toLowerCase()}…`}
                  value={mounted ? approvers[key] : ''}
                  onChange={e => handleChange(key, e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Save footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
          <button
            onClick={handleSave}
            disabled={!isDirty}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Save size={14} />
            Save Changes
          </button>
        </div>
      </Card>
    </div>
  );
}
