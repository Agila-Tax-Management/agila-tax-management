// src/app/(portal)/portal/sales/job-orders/components/JobOrderFormModal.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, Plus, Trash2, Search, ChevronDown, Loader2,
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import type { JobOrderRecord } from './JobOrders';

// ─── Types ────────────────────────────────────────────────────────

interface LeadOption {
  id: number;
  firstName: string;
  lastName: string;
  businessName: string | null;
  businessType: string;
  contactNumber: string | null;
}

interface ServicePlanOption {
  id: number;
  name: string;
  serviceRate: string;
}

interface ServiceOneTimeOption {
  id: number;
  name: string;
  serviceRate: string;
}

interface LineItem {
  _key: string;
  itemType: 'SUBSCRIPTION' | 'ONE_TIME';
  serviceName: string;
  rate: number;
  discount: number;
  total: number;
  remarks: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData: JobOrderRecord | null;
  onSuccess: (jo: JobOrderRecord) => void;
}

let _keyCounter = 0;
function nextKey() {
  return String(++_keyCounter);
}

function calcTotal(rate: number, discount: number): number {
  return Math.max(0, rate - discount);
}

// ─── Component ────────────────────────────────────────────────────

export function JobOrderFormModal({ isOpen, onClose, editData, onSuccess }: Props): React.ReactNode {
  const { success, error } = useToast();
  const isEdit = !!editData;

  // ── Data ──────────────────────────────────────────────────────────
  const [leads, setLeads] = useState<LeadOption[]>([]);
  const [servicePlans, setServicePlans] = useState<ServicePlanOption[]>([]);
  const [oneTimeServices, setOneTimeServices] = useState<ServiceOneTimeOption[]>([]);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // ── Form state ───────────────────────────────────────────────────
  const [selectedLead, setSelectedLead] = useState<LeadOption | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [showLeadDropdown, setShowLeadDropdown] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [subscriptionItems, setSubscriptionItems] = useState<LineItem[]>([]);
  const [oneTimeItems, setOneTimeItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ── One-time service search ───────────────────────────────────────
  const [oneTimeSearch, setOneTimeSearch] = useState('');
  const [showOneTimeDropdown, setShowOneTimeDropdown] = useState(false);

  const leadDropdownRef = useRef<HTMLDivElement>(null);
  const oneTimeDropdownRef = useRef<HTMLDivElement>(null);

  // ── Reset on open / set edit data ─────────────────────────────────
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (editData) {
        // Populate from edit data
        setSelectedLead({
          id: editData.lead.id,
          firstName: editData.lead.firstName,
          lastName: editData.lead.lastName,
          businessName: editData.lead.businessName,
          businessType: editData.lead.businessType,
          contactNumber: editData.lead.contactNumber,
        });
        setLeadSearch(`${editData.lead.firstName} ${editData.lead.lastName}`);
        setNotes(editData.notes ?? '');

        const subItems = editData.items
          .filter((i) => i.itemType === 'SUBSCRIPTION')
          .map((i): LineItem => ({
            _key: nextKey(),
            itemType: 'SUBSCRIPTION',
            serviceName: i.serviceName,
            rate: parseFloat(i.rate),
            discount: parseFloat(i.discount),
            total: parseFloat(i.total),
            remarks: i.remarks ?? '',
          }));

        const otItems = editData.items
          .filter((i) => i.itemType === 'ONE_TIME')
          .map((i): LineItem => ({
            _key: nextKey(),
            itemType: 'ONE_TIME',
            serviceName: i.serviceName,
            rate: parseFloat(i.rate),
            discount: parseFloat(i.discount),
            total: parseFloat(i.total),
            remarks: i.remarks ?? '',
          }));

        setSubscriptionItems(subItems);
        setOneTimeItems(otItems);
        setSelectedPlanId(null);
      } else {
        setSelectedLead(null);
        setLeadSearch('');
        setNotes('');
        setSubscriptionItems([]);
        setOneTimeItems([]);
        setSelectedPlanId(null);
      }
      setOneTimeSearch('');
      setShowLeadDropdown(false);
      setShowOneTimeDropdown(false);
    }
  }

  // ── Fetch supporting data ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsFetchingData(true);
    try {
      const [leadsRes, plansRes, otRes] = await Promise.all([
        fetch('/api/sales/leads'),
        fetch('/api/sales/service-plans'),
        fetch('/api/sales/service-one-time'),
      ]);
      if (leadsRes.ok) {
        const j = await leadsRes.json() as { data: LeadOption[] };
        setLeads(j.data);
      }
      if (plansRes.ok) {
        const j = await plansRes.json() as { data: ServicePlanOption[] };
        setServicePlans(j.data);
      }
      if (otRes.ok) {
        const j = await otRes.json() as { data: ServiceOneTimeOption[] };
        setOneTimeServices(j.data);
      }
    } catch {
      // non-blocking
    } finally {
      setIsFetchingData(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void fetchData();
  }, [isOpen, fetchData]);

  // ── Close dropdowns on outside click ──────────────────────────────
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (leadDropdownRef.current && !leadDropdownRef.current.contains(e.target as Node)) {
        setShowLeadDropdown(false);
      }
      if (oneTimeDropdownRef.current && !oneTimeDropdownRef.current.contains(e.target as Node)) {
        setShowOneTimeDropdown(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  // ── Lead search filter ────────────────────────────────────────────
  const filteredLeads = leads.filter((l) => {
    const q = leadSearch.toLowerCase();
    return (
      `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
      (l.businessName ?? '').toLowerCase().includes(q)
    );
  });

  // ── One-time search filter ────────────────────────────────────────
  const filteredOneTime = oneTimeServices.filter((s) =>
    s.name.toLowerCase().includes(oneTimeSearch.toLowerCase()),
  );

  // ── Service plan selection → add subscription row ─────────────────
  const handlePlanSelect = (planId: number) => {
    const plan = servicePlans.find((p) => p.id === planId);
    if (!plan) return;
    const rate = parseFloat(plan.serviceRate);
    const existing = subscriptionItems.find((i) => i.serviceName === plan.name);
    if (existing) return; // prevent duplicate
    setSubscriptionItems((prev) => [
      ...prev,
      {
        _key: nextKey(),
        itemType: 'SUBSCRIPTION',
        serviceName: plan.name,
        rate,
        discount: 0,
        total: rate,
        remarks: '',
      },
    ]);
    setSelectedPlanId(planId);
  };

  // ── Add one-time service ──────────────────────────────────────────
  const handleAddOneTime = (svc: ServiceOneTimeOption) => {
    const rate = parseFloat(svc.serviceRate);
    setOneTimeItems((prev) => [
      ...prev,
      {
        _key: nextKey(),
        itemType: 'ONE_TIME',
        serviceName: svc.name,
        rate,
        discount: 0,
        total: rate,
        remarks: '',
      },
    ]);
    setOneTimeSearch('');
    setShowOneTimeDropdown(false);
  };

  // ── Add blank custom one-time row ─────────────────────────────────
  const handleAddBlankOneTime = () => {
    setOneTimeItems((prev) => [
      ...prev,
      { _key: nextKey(), itemType: 'ONE_TIME', serviceName: '', rate: 0, discount: 0, total: 0, remarks: '' },
    ]);
  };

  // ── Update subscription row ───────────────────────────────────────
  const updateSubItem = (key: string, field: keyof LineItem, value: string | number) => {
    setSubscriptionItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: value };
        if (field === 'rate' || field === 'discount') {
          updated.total = calcTotal(
            field === 'rate' ? Number(value) : item.rate,
            field === 'discount' ? Number(value) : item.discount,
          );
        }
        return updated;
      }),
    );
  };

  // ── Update one-time row ───────────────────────────────────────────
  const updateOtItem = (key: string, field: keyof LineItem, value: string | number) => {
    setOneTimeItems((prev) =>
      prev.map((item) => {
        if (item._key !== key) return item;
        const updated = { ...item, [field]: value };
        if (field === 'rate' || field === 'discount') {
          updated.total = calcTotal(
            field === 'rate' ? Number(value) : item.rate,
            field === 'discount' ? Number(value) : item.discount,
          );
        }
        return updated;
      }),
    );
  };

  // ── Totals ────────────────────────────────────────────────────────
  const subTotal = subscriptionItems.reduce((s, i) => s + i.total, 0);
  const otTotal = oneTimeItems.reduce((s, i) => s + i.total, 0);
  const grandTotal = subTotal + otTotal;

  const fmt = (n: number) =>
    '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead) {
      error('Missing field', 'Please select a lead.');
      return;
    }

    const allItems = [...subscriptionItems, ...oneTimeItems].map((item) => ({
      itemType: item.itemType,
      serviceName: item.serviceName,
      rate: item.rate,
      discount: item.discount,
      total: item.total,
      remarks: item.remarks || null,
    }));

    setIsSaving(true);
    try {
      let res: Response;
      if (isEdit && editData) {
        res = await fetch(`/api/sales/job-orders/${editData.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update',
            leadId: selectedLead.id,
            notes: notes || null,
            items: allItems,
          }),
        });
      } else {
        res = await fetch('/api/sales/job-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leadId: selectedLead.id,
            notes: notes || null,
            items: allItems,
          }),
        });
      }

      if (!res.ok) {
        const json = await res.json() as { error?: string };
        error('Failed to save', json.error ?? 'An error occurred.');
        return;
      }

      const json = await res.json() as { data: JobOrderRecord };
      success(
        isEdit ? 'Job order updated' : 'Job order created',
        isEdit
          ? `${json.data.jobOrderNumber} has been updated.`
          : `${json.data.jobOrderNumber} has been created.`,
      );
      onSuccess(json.data);
      onClose();
    } catch {
      error('Network error', 'Could not save job order. Check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              {isEdit ? `Edit Job Order — ${editData?.jobOrderNumber}` : 'New Job Order'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEdit ? 'Edit this draft job order' : 'Fill in the details for the operations handover'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="p-6 space-y-8">

          {/* ── Section 1: Lead Info ─────────────────────────────── */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
              Client / Lead Information
            </h3>

            <div ref={leadDropdownRef} className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Lead <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isFetchingData ? 'Loading leads…' : 'Search lead by name or business…'}
                  value={leadSearch}
                  onChange={(e) => {
                    setLeadSearch(e.target.value);
                    setShowLeadDropdown(true);
                    if (!e.target.value) setSelectedLead(null);
                  }}
                  onFocus={() => setShowLeadDropdown(true)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {showLeadDropdown && filteredLeads.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                  {filteredLeads.slice(0, 20).map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setSelectedLead(lead);
                        setLeadSearch(`${lead.firstName} ${lead.lastName}`);
                        setShowLeadDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-slate-800">
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.businessName && (
                        <p className="text-xs text-slate-500">{lead.businessName}</p>
                      )}
                      <p className="text-xs text-slate-400">{lead.businessType}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedLead && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Contact Person</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLead.firstName} {selectedLead.lastName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Business Name</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLead.businessName ?? '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">Business Type</p>
                  <p className="text-sm font-semibold text-slate-800">{selectedLead.businessType}</p>
                </div>
              </div>
            )}
          </section>

          {/* ── Section 2: Subscription Services ────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                Subscription Services
              </h3>
            </div>

            {/* Plan dropdown */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedPlanId ?? ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) handlePlanSelect(val);
                  }}
                  className="w-full appearance-none pr-8 pl-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-slate-700"
                >
                  <option value="">— Select a service plan to add —</option>
                  {servicePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₱{parseFloat(p.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}/mo
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {subscriptionItems.length > 0 ? (
              <ServiceTable
                items={subscriptionItems}
                onUpdate={updateSubItem}
                onRemove={(key) => setSubscriptionItems((prev) => prev.filter((i) => i._key !== key))}
              />
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No subscription service added. Select a plan above.
              </p>
            )}
          </section>

          {/* ── Section 3: One-Time Services ────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                One-Time Services
              </h3>
            </div>

            {/* Search dropdown */}
            <div ref={oneTimeDropdownRef} className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search one-time service to add…"
                    value={oneTimeSearch}
                    onChange={(e) => {
                      setOneTimeSearch(e.target.value);
                      setShowOneTimeDropdown(true);
                    }}
                    onFocus={() => setShowOneTimeDropdown(true)}
                    className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddBlankOneTime}
                  className="flex items-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors whitespace-nowrap"
                >
                  <Plus size={13} /> Custom Row
                </button>
              </div>

              {showOneTimeDropdown && filteredOneTime.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredOneTime.slice(0, 15).map((svc) => (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => handleAddOneTime(svc)}
                      className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 flex justify-between items-center transition-colors"
                    >
                      <span className="text-sm font-semibold text-slate-800">{svc.name}</span>
                      <span className="text-xs text-indigo-600 font-semibold">
                        ₱{parseFloat(svc.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {oneTimeItems.length > 0 ? (
              <ServiceTable
                items={oneTimeItems}
                onUpdate={updateOtItem}
                onRemove={(key) => setOneTimeItems((prev) => prev.filter((i) => i._key !== key))}
              />
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                No one-time services added. Search above or add a custom row.
              </p>
            )}
          </section>

          {/* ── Grand Total ───────────────────────────────────────── */}
          {(subscriptionItems.length > 0 || oneTimeItems.length > 0) && (
            <div className="flex justify-end">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1.5 min-w-55">
                {subscriptionItems.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subscription subtotal</span>
                    <span className="font-semibold">{fmt(subTotal)}</span>
                  </div>
                )}
                {oneTimeItems.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>One-time subtotal</span>
                    <span className="font-semibold">{fmt(otTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-800 border-t border-slate-200 pt-1.5">
                  <span>Grand Total</span>
                  <span className="text-indigo-700">{fmt(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Notes ─────────────────────────────────────────────── */}
          <section>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Notes / Special Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions or remarks for operations…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
            />
          </section>

          {/* ── Actions ───────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedLead}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
            >
              {isSaving && <Loader2 size={15} className="animate-spin" />}
              {isEdit ? 'Update Job Order' : 'Create Job Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Service Table ────────────────────────────────────────────────

interface ServiceTableProps {
  items: LineItem[];
  onUpdate: (key: string, field: keyof LineItem, value: string | number) => void;
  onRemove: (key: string) => void;
}

function ServiceTable({ items, onUpdate, onRemove }: ServiceTableProps): React.ReactNode {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-wider min-w-45">
              Service Name
            </th>
            <th className="text-right px-3 py-2 font-black text-slate-500 uppercase tracking-wider w-28">
              Rate (₱)
            </th>
            <th className="text-right px-3 py-2 font-black text-slate-500 uppercase tracking-wider w-28">
              Disc. (₱)
            </th>
            <th className="text-right px-3 py-2 font-black text-slate-500 uppercase tracking-wider w-28">
              Total (₱)
            </th>
            <th className="text-left px-3 py-2 font-black text-slate-500 uppercase tracking-wider min-w-35">
              Remarks
            </th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item._key} className="hover:bg-slate-50/60">
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={item.serviceName}
                  onChange={(e) => onUpdate(item._key, 'serviceName', e.target.value)}
                  placeholder="Service name"
                  className="w-full px-2 py-1 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-transparent"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => onUpdate(item._key, 'rate', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-md text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-transparent"
                />
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.discount}
                  onChange={(e) => onUpdate(item._key, 'discount', parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-md text-xs text-right focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-transparent"
                />
              </td>
              <td className="px-2 py-1.5 text-right font-semibold text-indigo-700 text-xs pr-3">
                {item.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-2 py-1.5">
                <input
                  type="text"
                  value={item.remarks}
                  onChange={(e) => onUpdate(item._key, 'remarks', e.target.value)}
                  placeholder="Remarks"
                  className="w-full px-2 py-1 border border-transparent hover:border-slate-200 focus:border-indigo-400 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-transparent"
                />
              </td>
              <td className="px-2 py-1.5">
                <button
                  type="button"
                  onClick={() => onRemove(item._key)}
                  className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
