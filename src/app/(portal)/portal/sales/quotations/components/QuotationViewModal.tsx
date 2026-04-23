// src/app/(portal)/portal/sales/quotations/components/QuotationViewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

interface LineItem {
  id: string;
  serviceId: number;
  service: { id: number; name: string; billingType: string; frequency: string };
  sourcePackage: { id: number; name: string } | null;
  customName: string | null;
  quantity: number;
  negotiatedRate: string;
  isVatable: boolean;
}

interface QuoteDetail {
  id: string;
  quoteNumber: string;
  status: string;
  subTotal: string;
  totalDiscount: string;
  grandTotal: string;
  validUntil: string | null;
  notes: string | null;
  lineItems: LineItem[];
  lead: { id: number; firstName: string; lastName: string; businessName: string | null } | null;
  client: { id: number; businessName: string; clientNo: string | null } | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SENT_TO_CLIENT: 'Sent to Client',
  NEGOTIATING: 'Negotiating',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
};

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  SENT_TO_CLIENT: 'bg-blue-100 text-blue-700',
  NEGOTIATING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-600',
};

interface Props {
  quoteId: string;
  quoteNumber: string;
  isOpen: boolean;
  onClose: () => void;
  onAccepted?: (quoteId: string) => void;
}

export function QuotationViewModal({ quoteId, quoteNumber, isOpen, onClose, onAccepted }: Props): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setQuote(null);
  }

  useEffect(() => {
    if (!isOpen) return;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/quotes/${quoteId}`);
        const json = await res.json() as { data?: QuoteDetail };
        if (res.ok && json.data) setQuote(json.data);
      } catch { /* non-critical */ } finally {
        setLoading(false);
      }
    };
    void fetchDetail();
  }, [isOpen, quoteId]);

  const subTotal = quote ? Number(quote.subTotal) : 0;
  const vatAmount = quote
    ? quote.lineItems.reduce((acc, li) => {
        const line = Number(li.negotiatedRate) * li.quantity;
        return acc + (li.isVatable ? line * 0.12 : 0);
      }, 0)
    : 0;
  const grandTotal = quote ? Number(quote.grandTotal) : 0;

  async function handleAccept() {
    if (!quote) return;
    setAccepting(true);
    try {
      const res = await fetch(`/api/sales/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACCEPTED' }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Update failed', json.error ?? 'Could not mark quotation as accepted.');
        return;
      }
      setQuote((prev) => prev ? { ...prev, status: 'ACCEPTED' } : prev);
      success('Quotation accepted', `${quote.quoteNumber} has been marked as accepted.`);
      onAccepted?.(quoteId);
    } catch {
      toastError('Network error', 'Could not connect to the server.');
    } finally {
      setAccepting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Quotation — ${quoteNumber}`} size="2xl">
      {loading || !quote ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* Meta */}
          <div className="flex flex-wrap gap-4 items-start justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Source</p>
              {quote.client ? (
                <p className="text-sm font-semibold text-foreground">{quote.client.businessName}
                  {quote.client.clientNo && <span className="text-muted-foreground font-normal ml-1">· {quote.client.clientNo}</span>}
                </p>
              ) : quote.lead ? (
                <p className="text-sm font-semibold text-foreground">
                  {quote.lead.firstName} {quote.lead.lastName}
                  {quote.lead.businessName && <span className="text-muted-foreground font-normal ml-1">· {quote.lead.businessName}</span>}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[quote.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {STATUS_LABELS[quote.status] ?? quote.status}
              </span>
              <p className="text-xs text-muted-foreground">
                Created {new Date(quote.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
              {quote.validUntil && (
                <p className="text-xs text-muted-foreground">
                  Valid until {new Date(quote.validUntil).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-muted-foreground">Service</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground w-16">Qty</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground w-28">Rate</th>
                  <th className="px-3 py-2 text-right text-xs font-bold text-muted-foreground w-28">Total</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-muted-foreground w-16">VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {quote.lineItems.map((li) => (
                  <tr key={li.id} className="bg-card">
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-foreground">{li.service.name}</p>
                      {li.customName && <p className="text-xs text-muted-foreground mt-0.5">{li.customName}</p>}
                      {li.sourcePackage && (
                        <p className="text-xs text-blue-500 mt-0.5">From: {li.sourcePackage.name}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-center text-foreground">{li.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-foreground">
                      ₱{Number(li.negotiatedRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right text-foreground">
                      ₱{(Number(li.negotiatedRate) * li.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`text-xs font-semibold ${li.isVatable ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {li.isVatable ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm ml-auto max-w-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>₱{subTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (12%)</span>
              <span>₱{vatAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground border-t border-border pt-2">
              <span>Grand Total</span>
              <span>₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Notes</p>
              <p className="text-sm text-foreground bg-muted/30 rounded-xl px-4 py-3 border border-border">
                {quote.notes}
              </p>
            </div>
          )}

          {/* Actions */}
          {quote.status !== 'ACCEPTED' && quote.status !== 'REJECTED' && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                disabled={accepting}
                onClick={() => { void handleAccept(); }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60"
              >
                {accepting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <CheckCircle2 size={14} />}
                {accepting ? 'Updating…' : 'Mark as Accepted'}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
