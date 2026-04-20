// src/app/(portal)/portal/sales/lead-center/components/QuotationModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Package, Wrench, ChevronDown } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { Lead, LeadQuote } from './lead-types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceOption {
  id: number;
  name: string;
  billingType: 'RECURRING' | 'ONE_TIME';
  serviceRate: string;
  isVatable: boolean;
  frequency: string;
}

interface PackageItem {
  service: { id: number; name: string; billingType: string; serviceRate: string };
  overrideRate: string | null;
}

interface PackageOption {
  id: number;
  name: string;
  packageRate: string;
  isVatable: boolean;
  items: PackageItem[];
}

interface LineItemDraft {
  _key: string;
  serviceId: number;
  serviceName: string;
  billingType: 'RECURRING' | 'ONE_TIME';
  sourcePackageId: number | null;
  customName: string;
  quantity: number;
  negotiatedRate: string;
  isVatable: boolean;
}

interface QuotationModalProps {
  leadId: number;
  lead: Lead;
  existingQuote?: LeadQuote | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (quote: LeadQuote) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcTotals(items: LineItemDraft[]) {
  let subTotal = 0;
  let taxAmount = 0;
  for (const li of items) {
    const rate = parseFloat(li.negotiatedRate) || 0;
    const qty = li.quantity;
    const lineTotal = rate * qty;
    subTotal += lineTotal;
    if (li.isVatable) taxAmount += lineTotal * 0.12;
  }
  return { subTotal, taxAmount, grandTotal: subTotal + taxAmount };
}

function toKey(): string {
  return Math.random().toString(36).slice(2);
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

// ─── Component ────────────────────────────────────────────────────────────────

export function QuotationModal({
  leadId,
  lead,
  existingQuote,
  isOpen,
  onClose,
  onSaved,
}: QuotationModalProps): React.ReactNode {
  const { success, error } = useToast();

  const [mode, setMode] = useState<'package' | 'custom'>('custom');
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [packages, setPackages] = useState<PackageOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [saving, setSaving] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceDropOpen, setServiceDropOpen] = useState(false);

  // Populate from existing quote when editing
  useEffect(() => {
    if (!isOpen) return;
    if (existingQuote) {
      setLineItems(
        existingQuote.lineItems.map((li) => ({
          _key: toKey(),
          serviceId: li.serviceId,
          serviceName: li.service.name,
          billingType: li.service.billingType,
          sourcePackageId: li.sourcePackageId,
          customName: li.customName ?? '',
          quantity: li.quantity,
          negotiatedRate: li.negotiatedRate,
          isVatable: li.isVatable,
        })),
      );
      setNotes(existingQuote.notes ?? '');
      setValidUntil(existingQuote.validUntil ? existingQuote.validUntil.slice(0, 10) : '');

    } else {
      setLineItems([]);
      setNotes('');
      setValidUntil('');

    }
    setServiceSearch('');
  }, [isOpen, existingQuote]);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const [svcRes, pkgRes] = await Promise.all([
        fetch('/api/sales/services?status=ACTIVE'),
        fetch('/api/sales/services/packages'),
      ]);
      const svcData = (await svcRes.json()) as { data?: ServiceOption[] };
      const pkgData = (await pkgRes.json()) as { data?: PackageOption[] };
      if (svcRes.ok && svcData.data) setServices(svcData.data);
      if (pkgRes.ok && pkgData.data) setPackages(pkgData.data);
    } catch { /* non-critical */ } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) void loadOptions();
  }, [isOpen, loadOptions]);

  // ─── Package mode: select a package → populate line items ────────────────────
  const applyPackage = (pkg: PackageOption) => {
    const items: LineItemDraft[] = pkg.items.map((item) => ({
      _key: toKey(),
      serviceId: item.service.id,
      serviceName: item.service.name,
      billingType: item.service.billingType as 'RECURRING' | 'ONE_TIME',
      sourcePackageId: pkg.id,
      customName: '',
      quantity: 1,
      negotiatedRate: item.overrideRate ?? item.service.serviceRate,
      isVatable: pkg.isVatable,
    }));
    setLineItems(items);
  };

  // ─── Custom mode: add individual service ──────────────────────────────────────
  const addService = (svc: ServiceOption) => {
    setLineItems((prev) => [
      ...prev,
      {
        _key: toKey(),
        serviceId: svc.id,
        serviceName: svc.name,
        billingType: svc.billingType,
        sourcePackageId: null,
        customName: '',
        quantity: 1,
        negotiatedRate: svc.serviceRate,
        isVatable: svc.isVatable,
      },
    ]);
    setServiceSearch('');
    setServiceDropOpen(false);
  };

  const removeItem = (key: string) =>
    setLineItems((prev) => prev.filter((li) => li._key !== key));

  const updateItem = <K extends keyof LineItemDraft>(key: string, field: K, value: LineItemDraft[K]) =>
    setLineItems((prev) =>
      prev.map((li) => (li._key === key ? { ...li, [field]: value } : li)),
    );

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSave = async (status: 'DRAFT' | 'SENT_TO_CLIENT' | 'ACCEPTED') => {
    if (lineItems.length === 0) {
      error('No services added', 'Add at least one service to the quotation.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        lineItems: lineItems.map((li) => ({
          serviceId: li.serviceId,
          sourcePackageId: li.sourcePackageId ?? undefined,
          customName: li.customName.trim() || undefined,
          quantity: li.quantity,
          negotiatedRate: parseFloat(li.negotiatedRate) || 0,
          isVatable: li.isVatable,
        })),
        notes: notes.trim() || undefined,
        validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
        status,
      };

      let res: Response;
      if (existingQuote) {
        res = await fetch(`/api/sales/quotes/${existingQuote.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch(`/api/sales/leads/${leadId}/quotes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = (await res.json()) as { data?: LeadQuote; error?: string };
      if (!res.ok) {
        error('Save failed', data.error ?? 'Could not save quotation.');
        return;
      }
      success(
        existingQuote ? 'Quotation updated' : 'Quotation created',
        status === 'ACCEPTED'
          ? 'The quotation has been marked as accepted.'
          : status === 'SENT_TO_CLIENT'
          ? 'Quotation sent to client.'
          : 'Quotation saved as draft.',
      );
      onSaved(data.data!);
      onClose();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const { subTotal, taxAmount, grandTotal } = calcTotals(lineItems);

  const filteredServices = services.filter(
    (s) =>
      serviceSearch === '' ||
      s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const isReadonly =
    existingQuote?.status === 'ACCEPTED' || existingQuote?.status === 'REJECTED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingQuote ? `Edit Quotation — ${existingQuote.quoteNumber}` : 'New Quotation'}
      size="4xl"
    >
      <div className="flex h-[78vh] overflow-hidden">
        {/* Left — line items builder */}
        <div className="flex-7 border-r border-border overflow-y-auto px-6 py-5 space-y-5">
          {/* Lead info */}
          <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {lead.firstName} {lead.lastName}
            </span>
            {lead.businessName && <> &mdash; {lead.businessName}</>}
          </div>

          {/* Mode toggle (only when creating) */}
          {!existingQuote && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode('package')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'package'
                    ? 'bg-[#25238e] border-[#25238e] text-white'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Package size={14} /> From Package
              </button>
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  mode === 'custom'
                    ? 'bg-[#25238e] border-[#25238e] text-white'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wrench size={14} /> Custom
              </button>
            </div>
          )}

          {/* Package picker */}
          {mode === 'package' && !existingQuote && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Select a package to auto-populate line items
              </p>
              {loadingOptions ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 size={14} className="animate-spin" /> Loading packages…
                </div>
              ) : packages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No active packages available.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {packages.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => applyPackage(pkg)}
                      className="text-left p-3 rounded-xl border border-border bg-card hover:border-blue-500 hover:bg-blue-50/50 transition-colors"
                    >
                      <p className="text-sm font-semibold text-foreground">{pkg.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {pkg.items.length} service{pkg.items.length !== 1 ? 's' : ''} &middot; Base ₱
                        {Number(pkg.packageRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom service search */}
          {(mode === 'custom' || existingQuote) && !isReadonly && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Add Service</p>
              <div className="relative">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
                  <Plus size={14} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                    placeholder="Search service to add…"
                    value={serviceSearch}
                    onChange={(e) => { setServiceSearch(e.target.value); setServiceDropOpen(true); }}
                    onFocus={() => setServiceDropOpen(true)}
                    onBlur={() => setTimeout(() => setServiceDropOpen(false), 120)}
                  />
                  <ChevronDown size={13} className="text-muted-foreground shrink-0" />
                </div>
                {serviceDropOpen && filteredServices.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                    {filteredServices.map((svc) => (
                      <button
                        key={svc.id}
                        type="button"
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                        onMouseDown={(e) => { e.preventDefault(); addService(svc); }}
                      >
                        <span className="flex-1 text-left">{svc.name}</span>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${
                          svc.billingType === 'RECURRING'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {svc.billingType === 'RECURRING' ? 'Recurring' : 'One-Time'}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          ₱{Number(svc.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Line items table */}
          {lineItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Line Items</p>
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground">Service</th>
                      <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground w-16">Qty</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground w-28">Rate (₱)</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground w-16">VAT</th>
                      {!isReadonly && <th className="w-10" />}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {lineItems.map((li) => (
                      <tr key={li._key} className="bg-card">
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-foreground">{li.serviceName}</p>
                          {!isReadonly && (
                            <input
                              type="text"
                              className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              placeholder="Custom label (optional)"
                              value={li.customName}
                              onChange={(e) => updateItem(li._key, 'customName', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isReadonly ? (
                            <span className="text-foreground">{li.quantity}</span>
                          ) : (
                            <input
                              type="number"
                              min={1}
                              className="w-14 rounded border border-border bg-background px-2 py-1 text-sm text-center text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              value={li.quantity}
                              onChange={(e) =>
                                updateItem(li._key, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))
                              }
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {isReadonly ? (
                            <span className="text-foreground">
                              {Number(li.negotiatedRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className="w-28 rounded border border-border bg-background px-2 py-1 text-sm text-right text-foreground focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              value={li.negotiatedRate}
                              onChange={(e) => updateItem(li._key, 'negotiatedRate', e.target.value)}
                            />
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isReadonly ? (
                            <span className={`text-xs font-semibold ${li.isVatable ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                              {li.isVatable ? 'Yes' : 'No'}
                            </span>
                          ) : (
                            <input
                              type="checkbox"
                              checked={li.isVatable}
                              className="accent-emerald-600"
                              onChange={(e) => updateItem(li._key, 'isVatable', e.target.checked)}
                            />
                          )}
                        </td>
                        {!isReadonly && (
                          <td className="px-2 py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(li._key)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes + validity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
              <textarea
                className={inputClass + ' min-h-17 resize-none'}
                placeholder="Optional remarks…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                readOnly={isReadonly}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Valid Until</label>
              <input
                type="date"
                className={inputClass}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                readOnly={isReadonly}
              />
            </div>
          </div>
        </div>

        {/* Right — totals + actions */}
        <div className="flex-3 flex flex-col px-5 py-5 gap-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Summary
          </h4>

          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₱{subTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (12%)</span>
              <span>₱{taxAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground border-t border-border pt-2 mt-1">
              <span>Grand Total</span>
              <span>₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {isReadonly && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700">
              This quotation is <strong>{existingQuote?.status}</strong> and cannot be edited.
            </div>
          )}

          <div className="mt-auto space-y-2">
            {!isReadonly && (
              <>
                <Button
                  className="w-full bg-[#25238e] text-white hover:bg-[#1e1c7a]"
                  disabled={saving || lineItems.length === 0}
                  onClick={() => { void handleSave('DRAFT'); }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                  Save as Draft
                </Button>
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={saving || lineItems.length === 0}
                  onClick={() => { void handleSave('ACCEPTED'); }}
                >
                  Mark as Accepted
                </Button>
              </>
            )}
            <Button variant="outline" className="w-full" onClick={onClose} disabled={saving}>
              {isReadonly ? 'Close' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
