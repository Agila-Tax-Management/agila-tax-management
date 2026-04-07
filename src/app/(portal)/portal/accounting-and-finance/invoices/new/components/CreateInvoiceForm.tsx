// src/app/(portal)/portal/accounting-and-finance/invoices/new/components/CreateInvoiceForm.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';
import {
  Plus, Trash2, ChevronDown, Search,
  FileText, Users, Loader2,
} from 'lucide-react';
import type { ClientOption, ServiceOption, InvoiceItemInput } from '@/types/accounting.types';

/* -- Item row state ------------------------------------------------ */
interface ItemRow extends InvoiceItemInput {
  _key: string;
}

function newRow(partial?: Partial<InvoiceItemInput>): ItemRow {
  return {
    _key: crypto.randomUUID(),
    description: partial?.description ?? '',
    quantity: partial?.quantity ?? 1,
    unitPrice: partial?.unitPrice ?? 0,
    total: partial?.total ?? 0,
    remarks: partial?.remarks ?? '',
  };
}

function calcTotal(qty: number, price: number) {
  return Math.round(qty * price * 100) / 100;
}

function fmt(n: number) {
  return '?' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}

/* -- Component ---------------------------------------------------- */
export function CreateInvoiceForm() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  // Invoice metadata
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [issueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [terms, setTerms] = useState('');
  const [notes, setNotes] = useState('');

  // Items
  const [items, setItems] = useState<ItemRow[]>([newRow()]);

  // Client selector
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<ClientOption[]>([]);
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [isSearchingClients, setIsSearchingClients] = useState(false);

  // Service plan picker
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Load next invoice number + services on mount
   
  useEffect(() => {
    const load = async () => {
      const [numRes, svcRes] = await Promise.all([
        fetch('/api/accounting/invoices/next-number'),
        fetch('/api/accounting/invoices/services'),
      ]);
      if (numRes.ok) {
        const d = await numRes.json();
        setInvoiceNumber(d.data?.invoiceNumber ?? '');
      }
      if (svcRes.ok) {
        const d = await svcRes.json();
        setServices(d.data ?? []);
      }
    };
    void load();
  }, []);

  // Close client dropdown on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(e.target as Node)) {
        setIsClientDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
   

  // Client search fetch (debounced, called from event handler — not useEffect)
  const fetchClients = useCallback(async (query: string) => {
    setIsSearchingClients(true);
    try {
      const res = await fetch(
        `/api/accounting/invoices/clients?search=${encodeURIComponent(query)}`,
      );
      if (res.ok) {
        const d = await res.json();
        setClientOptions(d.data ?? []);
      }
    } finally {
      setIsSearchingClients(false);
    }
  }, []);

  const handleClientSearchChange = (value: string) => {
    setClientSearch(value);
    setIsClientDropdownOpen(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (value.trim()) {
      searchTimerRef.current = setTimeout(() => void fetchClients(value), 300);
    } else {
      setClientOptions([]);
    }
  };

  const handleClientFocus = () => {
    setIsClientDropdownOpen(true);
    if (!clientSearch && clientOptions.length === 0) {
      void fetchClients('');
    }
  };

  const selectClient = (opt: ClientOption) => {
    setSelectedClient(opt);
    setClientSearch(opt.label);
    setIsClientDropdownOpen(false);
    setClientOptions([]);
  };

  // Item management
  const updateItem = (key: string, field: keyof ItemRow, value: string | number) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row._key !== key) return row;
        const updated = { ...row, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = calcTotal(
            field === 'quantity' ? Number(value) : row.quantity,
            field === 'unitPrice' ? Number(value) : row.unitPrice,
          );
        }
        return updated;
      }),
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev));
  };

  const addServiceItem = (svc: ServiceOption) => {
    setItems((prev) => [
      ...prev,
      newRow({ description: svc.name, unitPrice: svc.rate, quantity: 1, total: svc.rate }),
    ]);
    setShowServicePicker(false);
    setServiceSearch('');
  };

  // Totals
  const subTotal = items.reduce((s, it) => s + it.total, 0);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) { toastError('Validation', 'Please select a client or lead.'); return; }
    if (!dueDate) { toastError('Validation', 'Please set a due date.'); return; }
    if (items.some((it) => !it.description.trim())) {
      toastError('Validation', 'All items must have a description.');
      return;
    }

    setIsSubmitting(true);
    try {
      const body = {
        ...(selectedClient.type === 'client'
          ? { clientId: selectedClient.id }
          : { leadId: selectedClient.id }),
        dueDate: new Date(dueDate).toISOString(),
        notes: notes || undefined,
        terms: terms || undefined,
        items: items.map(({ _key: _, ...it }) => it),
      };

      const res = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) { toastError('Failed to create', data.error ?? 'An error occurred.'); return; }

      success('Invoice created', `${data.data.invoiceNumber} has been saved.`);
      router.push(`/portal/accounting-and-finance/invoices/${data.data.id}`);
    } catch {
      toastError('Failed to create', 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Invoice</h2>
        <p className="text-sm text-slate-500">Create and issue a new invoice.</p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
        {/* Invoice Meta */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Invoice Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Invoice Number */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Invoice Number</label>
              <input
                readOnly
                value={invoiceNumber || 'Generating...'}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-amber-700 outline-none"
              />
            </div>
            {/* Issue Date */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Date Issued</label>
              <input
                readOnly
                value={issueDate}
                className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none"
              />
            </div>
            {/* Due Date */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                min={issueDate}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            {/* Terms */}
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Terms</label>
              <select
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">None</option>
                <option value="Net 7">Net 7</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Due on Receipt">Due on Receipt</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Billed To */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Billed To</h3>
          <div className="relative" ref={clientDropdownRef}>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">
              Client / Lead <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={clientSearch}
                onChange={(e) => handleClientSearchChange(e.target.value)}
                onFocus={handleClientFocus}
                placeholder="Search by name, business, or client no..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
              />
              {isSearchingClients && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
              )}
            </div>

            {/* Dropdown */}
            {isClientDropdownOpen && (
              <div className="absolute z-50 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                {clientOptions.length === 0 ? (
                  <div className="px-4 py-3 text-sm text-slate-400">
                    {clientSearch ? 'No results found.' : 'Type to search clients and leads...'}
                  </div>
                ) : (
                  clientOptions.map((opt) => (
                    <button
                      key={`${opt.type}-${opt.id}`}
                      type="button"
                      onClick={() => selectClient(opt)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 text-[10px] font-black shrink-0">
                        {opt.type === 'client' ? <Users size={14} /> : <FileText size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{opt.label}</p>
                        <p className="text-[10px] text-slate-400 truncate">{opt.subLabel}</p>
                      </div>
                      <Badge variant={opt.type === 'client' ? 'success' : 'info'} className="text-[9px] shrink-0">
                        {opt.type === 'client' ? 'Client' : 'Lead'}
                      </Badge>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected client preview */}
          {selectedClient && (
            <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-200 rounded-xl flex items-center justify-center text-amber-800 font-black text-sm">
                {selectedClient.fullName.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-800">{selectedClient.fullName}</p>
                {selectedClient.businessName && selectedClient.businessName !== selectedClient.fullName && (
                  <p className="text-xs text-slate-600">{selectedClient.businessName}</p>
                )}
                {selectedClient.businessType && (
                  <p className="text-xs text-slate-500">{selectedClient.businessType}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => { setSelectedClient(null); setClientSearch(''); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Change
              </button>
            </div>
          )}
        </Card>

        {/* Invoice Items */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Items</h3>
            <div className="flex gap-2">
              {/* Add from service */}
              <div className="relative">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-1.5 text-xs h-8"
                  onClick={() => setShowServicePicker((v) => !v)}
                >
                  Add from Service <ChevronDown size={12} />
                </Button>
                {showServicePicker && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={serviceSearch}
                          onChange={(e) => setServiceSearch(e.target.value)}
                          placeholder="Search services..."
                          className="w-full h-8 pl-7 pr-3 bg-slate-50 rounded-lg text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredServices.length === 0 ? (
                        <p className="px-4 py-3 text-xs text-slate-400">No services found.</p>
                      ) : (
                        filteredServices.map((svc) => (
                          <button
                            key={`${svc.type}-${svc.id}`}
                            type="button"
                            onClick={() => addServiceItem(svc)}
                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors"
                          >
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">{svc.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{svc.type.replace('-', ' ')}</p>
                            </div>
                            <span className="text-xs font-black text-amber-700">
                              ?{svc.rate.toLocaleString('en-PH')}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              {/* Add blank row */}
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 text-xs h-8"
                onClick={() => setItems((prev) => [...prev, newRow()])}
              >
                <Plus size={12} /> Add Item
              </Button>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest pr-3">Description</th>
                  <th className="text-center pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Qty</th>
                  <th className="text-right pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Unit Price</th>
                  <th className="text-left pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 px-2">Remarks</th>
                  <th className="text-right pb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest w-28">Amount</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((row) => (
                  <tr key={row._key}>
                    <td className="py-2 pr-3">
                      <input
                        type="text"
                        value={row.description}
                        onChange={(e) => updateItem(row._key, 'description', e.target.value)}
                        placeholder="Service or item description"
                        required
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="number"
                        min={1}
                        value={row.quantity}
                        onChange={(e) => updateItem(row._key, 'quantity', Number(e.target.value))}
                        className="w-14 h-9 px-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.unitPrice}
                        onChange={(e) => updateItem(row._key, 'unitPrice', Number(e.target.value))}
                        className="w-28 h-9 px-3 text-right bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 px-2">
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(e) => updateItem(row._key, 'remarks', e.target.value)}
                        placeholder="e.g., March 2026"
                        className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <span className="font-bold text-slate-900">{fmt(row.total)}</span>
                    </td>
                    <td className="py-2 text-right pl-2">
                      <button
                        type="button"
                        onClick={() => removeItem(row._key)}
                        disabled={items.length === 1}
                        className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotal */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-bold text-slate-800">{fmt(subTotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                <span className="font-black text-slate-800">TOTAL</span>
                <span className="font-black text-xl text-amber-600">{fmt(subTotal)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6 border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Additional notes visible on the invoice..."
            rows={3}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          />
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center gap-3 pb-8">
          <Button variant="outline" type="button" onClick={() => router.back()} className="flex-1 md:flex-none md:w-32">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 md:flex-none md:w-40 bg-amber-600 hover:bg-amber-700 text-white gap-2"
          >
            {isSubmitting ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : (
              <><FileText size={14} /> Create Invoice</>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
