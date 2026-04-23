// src/app/(portal)/portal/sales/quotations/components/NewQuotationModal.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, Package, Wrench, ChevronDown, Search, X } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import type { SalesQuoteListItem } from '@/lib/data/sales/quotes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientOption {
  id: number;
  businessName: string;
  clientNo: string | null;
}

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (quote: SalesQuoteListItem) => void;
  existingQuote?: SalesQuoteListItem | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toKey(): string {
  return crypto.randomUUID();
}

function calcTotals(items: LineItemDraft[]) {
  let subTotal = 0;
  let taxAmount = 0;
  for (const li of items) {
    const rate = parseFloat(li.negotiatedRate) || 0;
    const lineTotal = rate * li.quantity;
    subTotal += lineTotal;
    if (li.isVatable) taxAmount += lineTotal * 0.12;
  }
  return { subTotal, taxAmount, grandTotal: subTotal + taxAmount };
}

const inputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30';

// ─── Component ────────────────────────────────────────────────────────────────

export function NewQuotationModal({ isOpen, onClose, onSuccess, existingQuote }: Props): React.ReactNode {
  const { error: toastError } = useToast();

  // Step: 'client' | 'items' — only shown when creating new (no existingQuote)
  const [step, setStep] = useState<'client' | 'items'>('client');

  // Client selection
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<ClientOption[]>([]);
  const [clientLoading, setClientLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);

  // Line-item builder
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

  const isEditing = existingQuote != null;
  const isReadonly =
    existingQuote?.status === 'ACCEPTED' || existingQuote?.status === 'REJECTED';

  // ─── Reset when modal opens ───────────────────────────────────────────────
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (isEditing && existingQuote) {
        setStep('items');
        // Pre-fill from existing quote — will be handled in effect below
      } else {
        setStep('client');
        setSelectedClient(null);
        setClientSearch('');
        setClientResults([]);
        setLineItems([]);
        setNotes('');
        setValidUntil('');
      }
      setServiceSearch('');
      setMode('custom');
    }
  }

  // Pre-fill line items when editing
  useEffect(() => {
    if (!isOpen || !isEditing || !existingQuote) return;
    // Fetch full quote to get line items
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/sales/quotes/${existingQuote.id}`);
        const json = await res.json() as {
          data?: {
            lineItems: Array<{
              id: string;
              serviceId: number;
              service: { id: number; name: string; billingType: string; frequency: string };
              sourcePackageId: number | null;
              customName: string | null;
              quantity: number;
              negotiatedRate: string;
              isVatable: boolean;
            }>;
            notes: string | null;
            validUntil: string | null;
          };
        };
        if (res.ok && json.data) {
          setLineItems(
            json.data.lineItems.map((li) => ({
              _key: toKey(),
              serviceId: li.serviceId,
              serviceName: li.service.name,
              billingType: li.service.billingType as 'RECURRING' | 'ONE_TIME',
              sourcePackageId: li.sourcePackageId,
              customName: li.customName ?? '',
              quantity: li.quantity,
              negotiatedRate: li.negotiatedRate,
              isVatable: li.isVatable,
            })),
          );
          setNotes(json.data.notes ?? '');
          setValidUntil(json.data.validUntil ? json.data.validUntil.slice(0, 10) : '');
        }
      } catch { /* non-critical */ }
    };
    void fetchQuote();
  }, [isOpen, isEditing, existingQuote]);

  // ─── Load services + packages ─────────────────────────────────────────────
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
    if (isOpen && step === 'items') void loadOptions();
  }, [isOpen, step, loadOptions]);

  // ─── Client search ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || step !== 'client') return;
    if (clientSearch.trim().length < 1) { setClientResults([]); return; }
    const timer = setTimeout(async () => {
      setClientLoading(true);
      try {
        const res = await fetch(`/api/sales/clients?search=${encodeURIComponent(clientSearch)}&limit=10&status=active`);
        const json = await res.json() as { data?: { clients?: ClientOption[] }; clients?: ClientOption[] };
        // Handle both response shapes
        const list: ClientOption[] = (json.data as { clients?: ClientOption[] } | undefined)?.clients
          ?? (json as { clients?: ClientOption[] }).clients
          ?? (Array.isArray(json.data) ? (json.data as ClientOption[]) : []);
        setClientResults(list);
      } catch { /* non-critical */ } finally {
        setClientLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [isOpen, step, clientSearch]);

  // ─── Package apply ────────────────────────────────────────────────────────
  function applyPackage(pkg: PackageOption) {
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
  }

  function addService(svc: ServiceOption) {
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
  }

  const removeItem = (key: string) =>
    setLineItems((prev) => prev.filter((li) => li._key !== key));

  const updateItem = <K extends keyof LineItemDraft>(key: string, field: K, value: LineItemDraft[K]) =>
    setLineItems((prev) =>
      prev.map((li) => (li._key === key ? { ...li, [field]: value } : li)),
    );

  // ─── Save ─────────────────────────────────────────────────────────────────
  async function handleSave(status: 'DRAFT' | 'ACCEPTED') {
    if (lineItems.length === 0) {
      toastError('No services added', 'Add at least one service to the quotation.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        ...(isEditing ? {} : { clientId: selectedClient!.id }),
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

      const res = isEditing
        ? await fetch(`/api/sales/quotes/${existingQuote!.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
        : await fetch('/api/sales/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      const data = await res.json() as { data?: Record<string, unknown>; error?: string };
      if (!res.ok) {
        toastError('Save failed', data.error ?? 'Could not save quotation.');
        return;
      }

      // Map API response to SalesQuoteListItem shape
      const raw = data.data!;
      const saved: SalesQuoteListItem = {
        id: raw.id as string,
        quoteNumber: raw.quoteNumber as string,
        status: raw.status as SalesQuoteListItem['status'],
        grandTotal: String(raw.grandTotal),
        subTotal: String(raw.subTotal),
        totalDiscount: String(raw.totalDiscount ?? 0),
        validUntil: raw.validUntil ? String(raw.validUntil) : null,
        notes: (raw.notes as string | null) ?? null,
        lineItemCount: Array.isArray(raw.lineItems) ? (raw.lineItems as unknown[]).length : 0,
        sourceType: isEditing ? existingQuote!.sourceType : 'CLIENT',
        leadId: (raw.leadId as number | null) ?? null,
        lead: (raw.lead as SalesQuoteListItem['lead']) ?? (isEditing ? existingQuote!.lead : null),
        clientId: (raw.clientId as number | null) ?? null,
        client: (raw.client as SalesQuoteListItem['client']) ?? (isEditing ? existingQuote!.client : null),
        tsaStatus: isEditing ? (existingQuote!.tsaStatus ?? null) : null,
        invoiceStatus: isEditing ? (existingQuote!.invoiceStatus ?? null) : null,
        jobOrderStatus: isEditing ? (existingQuote!.jobOrderStatus ?? null) : null,
        createdAt: String(raw.createdAt),
        updatedAt: String(raw.updatedAt),
      };

      onSuccess(saved);
    } catch {
      toastError('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  }

  const { subTotal, taxAmount, grandTotal } = calcTotals(lineItems);
  const filteredServices = services.filter(
    (s) => serviceSearch === '' || s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  const title = isEditing
    ? `Edit Quotation — ${existingQuote!.quoteNumber}`
    : step === 'client'
      ? 'New Quotation — Select Client'
      : `New Quotation — ${selectedClient?.businessName ?? ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="4xl">
      {/* ─── Step 1: Client picker (create mode only) ─────────────────────── */}
      {!isEditing && step === 'client' && (
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Search for the client you want to create a quotation for.
          </p>

          {/* Search input */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
              <Search size={14} className="text-muted-foreground shrink-0" />
              <input
                type="text"
                className="flex-1 bg-transparent text-sm text-foreground focus:outline-none placeholder:text-muted-foreground"
                placeholder="Type client name or client number…"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                autoFocus
              />
              {clientLoading && <Loader2 size={13} className="text-muted-foreground animate-spin shrink-0" />}
            </div>

            {clientResults.length > 0 && (
              <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-background border border-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                {clientResults.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full flex items-start justify-between gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      setSelectedClient(c);
                      setClientSearch(c.businessName);
                      setClientResults([]);
                    }}
                  >
                    <span className="text-left font-medium">{c.businessName}</span>
                    {c.clientNo && (
                      <span className="text-xs text-muted-foreground shrink-0 font-mono">{c.clientNo}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected client chip */}
          {selectedClient && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200">
              <span className="text-sm font-semibold text-indigo-800 flex-1">{selectedClient.businessName}</span>
              {selectedClient.clientNo && (
                <span className="text-xs text-indigo-500 font-mono">{selectedClient.clientNo}</span>
              )}
              <button
                type="button"
                onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                className="text-indigo-400 hover:text-indigo-600"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Proceed */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              className="bg-[#25238e] text-white hover:bg-[#1e1c7a]"
              disabled={!selectedClient}
              onClick={() => { setStep('items'); void loadOptions(); }}
            >
              Next — Add Services
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Line-item builder ─────────────────────────────────────── */}
      {(isEditing || step === 'items') && (
        <div className="flex h-[78vh] overflow-hidden">
          {/* Left — builder */}
          <div className="flex-7 border-r border-border overflow-y-auto px-6 py-5 space-y-5">
            {/* Context info */}
            <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-sm text-muted-foreground">
              {isEditing ? (
                <>
                  {existingQuote!.sourceType === 'CLIENT' ? (
                    <span className="font-semibold text-foreground">{existingQuote!.client?.businessName}</span>
                  ) : (
                    <span className="font-semibold text-foreground">
                      {existingQuote!.lead?.firstName} {existingQuote!.lead?.lastName}
                      {existingQuote!.lead?.businessName && ` — ${existingQuote!.lead.businessName}`}
                    </span>
                  )}
                </>
              ) : (
                <span className="font-semibold text-foreground">{selectedClient?.businessName}</span>
              )}
            </div>

            {/* Mode toggle (create only) */}
            {!isEditing && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode('package')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    mode === 'package' ? 'bg-[#25238e] border-[#25238e] text-white' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Package size={14} /> From Package
                </button>
                <button
                  type="button"
                  onClick={() => setMode('custom')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    mode === 'custom' ? 'bg-[#25238e] border-[#25238e] text-white' : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Wrench size={14} /> Custom
                </button>
              </div>
            )}

            {/* Package picker */}
            {mode === 'package' && !isEditing && (
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
                          {pkg.items.length} service{pkg.items.length !== 1 ? 's' : ''} · Base ₱
                          {Number(pkg.packageRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Service search */}
            {(mode === 'custom' || isEditing) && !isReadonly && (
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
                            svc.billingType === 'RECURRING' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
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

            {/* Line items */}
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

          {/* Right — summary + actions */}
          <div className="flex-3 flex flex-col px-5 py-5 gap-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Summary</h4>

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
              {!isEditing && (
                <Button variant="outline" className="w-full" onClick={() => setStep('client')} disabled={saving}>
                  ← Back
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={onClose} disabled={saving}>
                {isReadonly ? 'Close' : 'Cancel'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
