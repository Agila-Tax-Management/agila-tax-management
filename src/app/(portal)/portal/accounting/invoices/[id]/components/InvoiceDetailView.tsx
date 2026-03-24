// src/app/(portal)/portal/accounting/invoices/[id]/components/InvoiceDetailView.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { InvoiceTemplate } from '@/components/accounting/InvoiceTemplate';

async function openInvoicePDF(invoice: import('@/types/accounting.types').InvoiceRecord) {
  const [{ pdf }, { InvoicePDF }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('@/components/accounting/InvoicePDF'),
  ]);
  const el = React.createElement(InvoicePDF, { invoice }) as Parameters<typeof pdf>[0];
  const blob = await pdf(el).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
import {
  ArrowLeft, Printer, Pencil, CheckCircle2, Loader2,
  Plus, Trash2, ChevronDown, Search, Clock,
  AlertTriangle, FileText, XCircle, CircleDot,
  CreditCard, Save, X,
} from 'lucide-react';
import type { ServiceOption } from '@/types/accounting.types';
import type {
  InvoiceRecord,
  InvoiceItemInput,
  PaymentMethodType,
  InvoiceStatus,
} from '@/types/accounting.types';

/* ── Helpers ──────────────────────────────────────────────────── */
function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { badge: 'info' | 'success' | 'danger' | 'warning' | 'neutral'; label: string; icon: React.ReactNode }
> = {
  DRAFT:          { badge: 'neutral',  label: 'Draft',           icon: <FileText size={10} /> },
  UNPAID:         { badge: 'warning',  label: 'Unpaid',          icon: <Clock size={10} /> },
  PARTIALLY_PAID: { badge: 'info',     label: 'Partially Paid',  icon: <CircleDot size={10} /> },
  PAID:           { badge: 'success',  label: 'Paid',            icon: <CheckCircle2 size={10} /> },
  OVERDUE:        { badge: 'danger',   label: 'Overdue',         icon: <AlertTriangle size={10} /> },
  VOID:           { badge: 'neutral',  label: 'Void',            icon: <XCircle size={10} /> },
};

const METHOD_LABELS: Record<PaymentMethodType, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  E_WALLET: 'E-Wallet (GCash / Maya)',
  CREDIT_CARD: 'Credit Card',
};

/* ── Edit Item Row ────────────────────────────────────────────── */
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

/* ── Main Component ───────────────────────────────────────────── */
interface InvoiceDetailViewProps {
  id: string;
}

export function InvoiceDetailView({ id }: InvoiceDetailViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: toastError } = useToast();

  const [invoice, setInvoice] = useState<InvoiceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit mode
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [editDueDate, setEditDueDate] = useState('');
  const [editTerms, setEditTerms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<ItemRow[]>([]);
  const [editStatus, setEditStatus] = useState<InvoiceStatus>('UNPAID');
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Payment recording
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payMethod, setPayMethod] = useState<PaymentMethodType>('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  // Print
  // Service picker for edit mode
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const servicePickerRef = useRef<HTMLDivElement>(null);

  // Load invoice
  /* eslint-disable react-hooks/set-state-in-effect -- API fetch on mount */
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/accounting/invoices/${id}`);
        if (!res.ok) { toastError('Not found', 'Invoice could not be loaded.'); return; }
        const data = await res.json();
        setInvoice(data.data);
      } catch {
        toastError('Error', 'Failed to load invoice.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [id, toastError]);

  // Load services for edit mode
  useEffect(() => {
    if (!isEditing || services.length > 0) return;
    fetch('/api/accounting/invoices/services')
      .then((r) => r.json())
      .then((d) => setServices(d.data ?? []))
      .catch(console.error);
  }, [isEditing, services.length]);

  // Close service picker on outside click
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (servicePickerRef.current && !servicePickerRef.current.contains(e.target as Node)) {
        setShowServicePicker(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Populate edit fields when entering edit mode
  const enterEditMode = useCallback(() => {
    if (!invoice) return;
    setEditDueDate(invoice.dueDate.split('T')[0]);
    setEditTerms(invoice.terms ?? '');
    setEditNotes(invoice.notes ?? '');
    setEditStatus(invoice.status);
    setEditItems(
      invoice.items.map((it) => ({
        _key: crypto.randomUUID(),
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        total: it.total,
        remarks: it.remarks ?? '',
      })),
    );
    setIsEditing(true);
  }, [invoice]);

  const cancelEdit = () => setIsEditing(false);

  // Item update helpers
  const updateEditItem = (key: string, field: keyof ItemRow, value: string | number) => {
    setEditItems((prev) =>
      prev.map((row) => {
        if (row._key !== key) return row;
        const updated = { ...row, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          const qty = field === 'quantity' ? Number(value) : row.quantity;
          const price = field === 'unitPrice' ? Number(value) : row.unitPrice;
          updated.total = Math.round(qty * price * 100) / 100;
        }
        return updated;
      }),
    );
  };

  const removeEditItem = (key: string) => {
    setEditItems((prev) => (prev.length > 1 ? prev.filter((r) => r._key !== key) : prev));
  };

  const addServiceToEdit = (svc: ServiceOption) => {
    setEditItems((prev) => [
      ...prev,
      newRow({ description: svc.name, unitPrice: svc.rate, quantity: 1, total: svc.rate }),
    ]);
    setShowServicePicker(false);
    setServiceSearch('');
  };

  const editSubTotal = editItems.reduce((s, it) => s + it.total, 0);

  // Save edits
  const handleSaveEdit = async () => {
    if (editItems.some((it) => !it.description.trim())) {
      toastError('Validation', 'All items must have a description.');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/accounting/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dueDate: new Date(editDueDate).toISOString(),
          notes: editNotes || null,
          terms: editTerms || null,
          status: editStatus,
          items: editItems.map(({ _key: _, ...it }) => it),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toastError('Save failed', data.error ?? 'An error occurred.'); return; }
      setInvoice(data.data);
      setIsEditing(false);
      success('Saved', 'Invoice updated successfully.');
    } catch {
      toastError('Save failed', 'An unexpected error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  // Record payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoice) return;
    setIsRecording(true);
    try {
      const res = await fetch(`/api/accounting/invoices/${id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          paymentDate: new Date(payDate).toISOString(),
          method: payMethod,
          referenceNumber: payRef || undefined,
          notes: payNotes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toastError('Payment failed', data.error ?? 'An error occurred.'); return; }

      success('Payment recorded', `₱${Number(payAmount).toLocaleString('en-PH')} recorded successfully.`);
      setShowPaymentForm(false);
      setPayAmount(''); setPayRef(''); setPayNotes('');

      // Refresh invoice
      const invRes = await fetch(`/api/accounting/invoices/${id}`);
      if (invRes.ok) { const d = await invRes.json(); setInvoice(d.data); }
    } catch {
      toastError('Payment failed', 'An unexpected error occurred.');
    } finally {
      setIsRecording(false);
    }
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-amber-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Invoice not found.</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[invoice.status];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* ── Top Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push('/portal/accounting/invoices')} className="text-slate-500">
            <ArrowLeft size={16} className="mr-1" /> Invoices
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-slate-800">{invoice.invoiceNumber}</h2>
              <Badge variant={statusCfg.badge} className="text-[10px] uppercase flex items-center gap-1">
                {statusCfg.icon} {statusCfg.label}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Issued: {fmtDate(invoice.issueDate)} · Due: {fmtDate(invoice.dueDate)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              <Button
                variant="outline"
                className="gap-1.5 text-sm"
                disabled={isPrinting}
                onClick={() => {
                  setIsPrinting(true);
                  openInvoicePDF(invoice).catch(() => toastError('PDF Error', 'Could not generate PDF.')).finally(() => setIsPrinting(false));
                }}
              >
                {isPrinting ? <Loader2 size={14} className="animate-spin" /> : <Printer size={15} />}
                {isPrinting ? 'Generating...' : 'Print'}
              </Button>
              <Button
                variant="default"
                className="gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white"
                onClick={enterEditMode}
              >
                <Pencil size={15} /> Edit Invoice
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="gap-1.5 text-sm" onClick={cancelEdit} disabled={isSaving}>
                <X size={15} /> Cancel
              </Button>
              <Button
                className="gap-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => void handleSaveEdit()}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── VIEW MODE: Invoice Template ─────────────────────── */}
      {!isEditing && <InvoiceTemplate invoice={invoice} />}

      {/* ── EDIT MODE ───────────────────────────────────────── */}
      {isEditing && (
        <div className="space-y-5">
          {/* Edit Meta */}
          <Card className="p-6 border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Invoice Number</label>
                <input readOnly value={invoice.invoiceNumber} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-amber-700 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Status</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as InvoiceStatus)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500">
                  {(Object.keys(STATUS_CONFIG) as InvoiceStatus[]).map((k) => (
                    <option key={k} value={k}>{STATUS_CONFIG[k].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Due Date</label>
                <input type="date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">Terms</label>
                <select value={editTerms} onChange={(e) => setEditTerms(e.target.value)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-amber-500">
                  <option value="">None</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                  <option value="Due on Receipt">Due on Receipt</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Edit Items */}
          <Card className="p-6 border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Items</h3>
              <div className="flex gap-2">
                <div className="relative" ref={servicePickerRef}>
                  <Button type="button" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setShowServicePicker((v) => !v)}>
                    Add from Service <ChevronDown size={12} />
                  </Button>
                  {showServicePicker && (
                    <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                      <div className="p-2 border-b border-slate-100">
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} placeholder="Search services..." className="w-full h-8 pl-7 pr-3 bg-slate-50 rounded-lg text-xs outline-none" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredServices.length === 0 ? (
                          <p className="px-4 py-3 text-xs text-slate-400">No services found.</p>
                        ) : filteredServices.map((svc) => (
                          <button key={`${svc.type}-${svc.id}`} type="button" onClick={() => addServiceToEdit(svc)} className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
                            <div className="text-left">
                              <p className="text-xs font-bold text-slate-800">{svc.name}</p>
                              <p className="text-[10px] text-slate-400 capitalize">{svc.type}</p>
                            </div>
                            <span className="text-xs font-black text-amber-700">₱{svc.rate.toLocaleString('en-PH')}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Button type="button" variant="outline" className="gap-1.5 text-xs h-8" onClick={() => setEditItems((p) => [...p, newRow()])}>
                  <Plus size={12} /> Add Item
                </Button>
              </div>
            </div>
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
                  {editItems.map((row) => (
                    <tr key={row._key}>
                      <td className="py-2 pr-3">
                        <input type="text" value={row.description} onChange={(e) => updateEditItem(row._key, 'description', e.target.value)} className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                      </td>
                      <td className="py-2">
                        <input type="number" min={1} value={row.quantity} onChange={(e) => updateEditItem(row._key, 'quantity', Number(e.target.value))} className="w-14 h-9 px-2 text-center bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                      </td>
                      <td className="py-2">
                        <input type="number" min={0} step="0.01" value={row.unitPrice} onChange={(e) => updateEditItem(row._key, 'unitPrice', Number(e.target.value))} className="w-28 h-9 px-3 text-right bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                      </td>
                      <td className="py-2 px-2">
                        <input type="text" value={row.remarks} onChange={(e) => updateEditItem(row._key, 'remarks', e.target.value)} className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500" />
                      </td>
                      <td className="py-2 text-right"><span className="font-bold text-slate-900">{fmt(row.total)}</span></td>
                      <td className="py-2 pl-2">
                        <button type="button" onClick={() => removeEditItem(row._key)} disabled={editItems.length === 1} className="h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between items-center text-sm border-t border-slate-200 pt-2">
                  <span className="font-black text-slate-800">TOTAL</span>
                  <span className="font-black text-xl text-amber-600">{fmt(editSubTotal)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Edit Notes */}
          <Card className="p-6 border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-3">Notes</h3>
            <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </Card>
        </div>
      )}

      {/* ── Payments Section (always visible in view mode) ─── */}
      {!isEditing && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-slate-800">Payments</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Balance Due: <span className={`font-black ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{fmt(invoice.balanceDue)}</span>
              </p>
            </div>
            {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
              <Button
                variant="default"
                className="gap-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setShowPaymentForm(true)}
              >
                <CreditCard size={14} /> Record Payment
              </Button>
            )}
          </div>

          {/* Payment list */}
          {invoice.payments.length === 0 ? (
            <div className="px-5 py-8 text-center text-slate-400 text-sm">No payments recorded yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {invoice.payments.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <CreditCard size={16} className="text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{METHOD_LABELS[p.method]}</p>
                    <p className="text-[10px] text-slate-400">
                      {fmtDateTime(p.paymentDate)}
                      {p.referenceNumber && ` · Ref: ${p.referenceNumber}`}
                      {p.recordedBy && ` · by ${p.recordedBy.name}`}
                    </p>
                    {p.notes && <p className="text-xs text-slate-500 mt-0.5">{p.notes}</p>}
                  </div>
                  <span className="font-black text-emerald-600">{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ── Audit History ────────────────────────────────────── */}
      {!isEditing && invoice.historyLogs.length > 0 && (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-800">Activity Log</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {invoice.historyLogs.map((h) => (
              <div key={h.id} className="px-5 py-3 flex items-start gap-3">
                <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                  <Clock size={12} className="text-slate-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-700">
                    <span className="font-bold">{h.actor?.name ?? 'System'}</span>{' '}
                    <span className="text-slate-500">{h.changeType.replace(/_/g, ' ').toLowerCase()}</span>
                    {h.oldValue && h.newValue && (
                      <span className="text-slate-500"> · {h.oldValue} → <span className="font-bold text-slate-700">{h.newValue}</span></span>
                    )}
                    {(!h.oldValue && h.newValue) && (
                      <span className="text-slate-500"> · {h.newValue}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fmtDateTime(h.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Record Payment Modal ──────────────────────────────── */}
      <Modal isOpen={showPaymentForm} onClose={() => setShowPaymentForm(false)} title="Record Payment" size="md">
        <form
          onSubmit={(e) => void handleRecordPayment(e)}
          className="p-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Amount<span className="text-red-500"> *</span></label>
              <input
                type="number" min="0.01" step="0.01" required
                value={payAmount} onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 mb-1.5 block">Payment Date<span className="text-red-500"> *</span></label>
              <input
                type="date" required
                value={payDate} onChange={(e) => setPayDate(e.target.value)}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Payment Method<span className="text-red-500"> *</span></label>
            <select value={payMethod} onChange={(e) => setPayMethod(e.target.value as PaymentMethodType)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500">
              {(Object.entries(METHOD_LABELS) as [PaymentMethodType, string][]).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Reference Number</label>
            <input type="text" value={payRef} onChange={(e) => setPayRef(e.target.value)} placeholder="Bank transfer ref, check no., etc." className="w-full h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1.5 block">Notes</label>
            <textarea value={payNotes} onChange={(e) => setPayNotes(e.target.value)} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setShowPaymentForm(false)} disabled={isRecording}>Cancel</Button>
            <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2" disabled={isRecording}>
              {isRecording ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {isRecording ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
