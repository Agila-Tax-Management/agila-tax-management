// src/app/(portal)/portal/sales/quotations/components/QuotationViewModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, FileSignature, Briefcase } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { authClient } from '@/lib/auth-client';
import { ClientTsaModal, type ClientTsaInfo } from './ClientTsaModal';

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
  tsaContract: ClientTsaInfo | null;
  invoice: { id: string; invoiceNumber: string; status: string; totalAmount: string | number; balanceDue: string | number; dueDate: string | null } | null;
  jobOrders: { id: string; jobOrderNumber: string; status: string }[];
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
  const { data: session } = authClient.useSession();
  const [quote, setQuote] = useState<QuoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [tsaModalOpen, setTsaModalOpen] = useState(false);
  const [creatingJobOrder, setCreatingJobOrder] = useState(false);

  const [prevIsOpen, setPrevIsOpen] = useState(false);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) setQuote(null);
  }

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/quotes/${quoteId}`);
      const json = await res.json() as { data?: QuoteDetail };
      if (res.ok && json.data) setQuote(json.data);
    } catch { /* non-critical */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void fetchQuote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, quoteId]);

  // Permission check: ADMIN / SETTINGS role on SALES, or system ADMIN/SUPER_ADMIN
  const user = session?.user as { role?: string } | undefined;
  const portalRoles = session?.user as { portalRoles?: Record<string, string | null> } | undefined;
  const salesRole = portalRoles?.portalRoles?.SALES;
  const canManageTsa =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    salesRole === 'ADMIN' ||
    salesRole === 'SETTINGS';

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

  async function handleCreateJobOrder() {
    if (!quote) return;
    setCreatingJobOrder(true);
    try {
      const res = await fetch(`/api/sales/quotes/${quoteId}/job-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json() as { data?: { jobOrderNumber: string }; error?: string; warning?: string };
      if (!res.ok) {
        toastError('Failed to create Job Order', json.error ?? 'Please try again.');
        return;
      }
      success('Job Order created', `${json.data?.jobOrderNumber ?? 'Job Order'} has been created.`);
      if (json.warning) toastError('Configuration notice', json.warning);
      await fetchQuote();
    } catch {
      toastError('Network error', 'Could not connect to the server.');
    } finally {
      setCreatingJobOrder(false);
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

          {/* ── TSA / Invoice / Job Order lifecycle (client quotes only) ── */}
          {quote.status === 'ACCEPTED' && quote.client && (
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Contract & Onboarding
              </p>

              {/* TSA row */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <FileSignature size={15} className="text-muted-foreground" />
                  <span className="font-medium text-foreground">TSA Contract</span>
                  {quote.tsaContract ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.tsaContract.status === 'SIGNED' ? 'bg-emerald-100 text-emerald-700' :
                      quote.tsaContract.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                      quote.tsaContract.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                      quote.tsaContract.status === 'SENT_TO_CLIENT' ? 'bg-indigo-100 text-indigo-700' :
                      quote.tsaContract.status === 'VOID' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {quote.tsaContract.status.replace(/_/g, ' ')}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Not created</span>
                  )}
                </div>
                {canManageTsa && (
                  <button
                    type="button"
                    onClick={() => setTsaModalOpen(true)}
                    className="text-xs font-semibold text-[#25238e] hover:underline"
                  >
                    {quote.tsaContract ? 'Manage' : 'Create TSA'}
                  </button>
                )}
              </div>

              {/* Invoice row */}
              <div className="flex items-center justify-between gap-3 py-2 border-b border-border">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={15} className="text-muted-foreground" />
                  <span className="font-medium text-foreground">Invoice</span>
                  {quote.invoice ? (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      quote.invoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' :
                      quote.invoice.status === 'OVERDUE' ? 'bg-red-100 text-red-600' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {quote.invoice.invoiceNumber} · {quote.invoice.status}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {quote.tsaContract?.status === 'SIGNED' ? 'Invoice not yet created' : 'Generated after TSA is signed'}
                    </span>
                  )}
                </div>
              </div>

              {/* Job Order row */}
              <div className="flex items-center justify-between gap-3 py-2">
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase size={15} className="text-muted-foreground" />
                  <span className="font-medium text-foreground">Job Order</span>
                  {quote.jobOrders[0] ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {quote.jobOrders[0].jobOrderNumber} · {quote.jobOrders[0].status}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {quote.invoice?.status === 'PAID' ? 'Ready to create' : 'Available after invoice is paid'}
                    </span>
                  )}
                </div>
                {canManageTsa && !quote.jobOrders[0] && quote.invoice?.status === 'PAID' && (
                  <button
                    type="button"
                    disabled={creatingJobOrder}
                    onClick={() => { void handleCreateJobOrder(); }}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#25238e] hover:underline disabled:opacity-60"
                  >
                    {creatingJobOrder ? <Loader2 size={12} className="animate-spin" /> : null}
                    Create Job Order
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TSA Modal (outside the main scroll area) */}
      {quote?.client && (
        <ClientTsaModal
          quoteId={quoteId}
          quoteNumber={quoteNumber}
          client={quote.client}
          tsa={quote.tsaContract}
          isOpen={tsaModalOpen}
          onClose={() => setTsaModalOpen(false)}
          onUpdated={() => { void fetchQuote(); }}
        />
      )}
    </Modal>
  );
}
