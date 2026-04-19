// src/components/accounting/InvoiceTemplate.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import type { InvoiceRecord } from '@/types/accounting.types';

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'DRAFT',
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  VOID: 'VOID',
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-300',
  UNPAID: 'bg-amber-50 text-amber-700 border-amber-300',
  PARTIALLY_PAID: 'bg-blue-50 text-blue-700 border-blue-300',
  PAID: 'bg-emerald-50 text-emerald-700 border-emerald-300',
  OVERDUE: 'bg-red-50 text-red-700 border-red-300',
  VOID: 'bg-slate-100 text-slate-500 border-slate-300',
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check',
  E_WALLET: 'E-Wallet (GCash / Maya)',
  CREDIT_CARD: 'Credit Card',
};

function fmt(n: number) {
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getBilledTo(invoice: InvoiceRecord): {
  fullName: string;
  businessName: string | null;
  businessType: string | null;
} {
  if (invoice.client) {
    return {
      fullName: invoice.client.businessName,
      businessName: invoice.client.businessName,
      businessType: invoice.client.businessEntity.replace(/_/g, ' '),
    };
  }
  if (invoice.lead) {
    const { firstName, middleName, lastName, businessName, businessType } = invoice.lead;
    const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    return {
      fullName,
      businessName: businessName ?? null,
      businessType: businessType !== 'Not Specified' ? businessType : null,
    };
  }
  return { fullName: 'N/A', businessName: null, businessType: null };
}

interface InvoiceTemplateProps {
  invoice: InvoiceRecord;
  /** When true, wraps in a plain white paper-style container (for print view). */
  printMode?: boolean;
  className?: string;
}

export function InvoiceTemplate({ invoice, printMode = false, className = '' }: InvoiceTemplateProps) {
  const billed = getBilledTo(invoice);
  const statusColor = STATUS_COLORS[invoice.status] ?? STATUS_COLORS.DRAFT;

  const wrapper = printMode
    ? 'w-full max-w-3xl mx-auto bg-white text-slate-900'
    : 'w-full bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-900';

  return (
    <div className={`${wrapper} ${className}`} id="invoice-print-area">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between px-8 pt-8 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Image
              src="/images/agila_logo.webp"
              alt="Agila Tax Management"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <p className="font-black text-slate-900 text-base leading-tight">AGILA TAX MANAGEMENT</p>
              <p className="text-xs text-slate-500">Cebu City, Philippines</p>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            accounting@agila.ph · 0912 312 313
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-amber-600 tracking-tight">{invoice.invoiceNumber}</p>
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${statusColor}`}>
            {STATUS_LABELS[invoice.status] ?? invoice.status}
          </div>
          <div className="mt-3 space-y-0.5 text-xs text-slate-600">
            <p><span className="font-bold text-slate-500">Date Issued:</span> {fmtDate(invoice.issueDate)}</p>
            <p><span className="font-bold text-slate-500">Due Date:</span> <span className={invoice.status === 'OVERDUE' ? 'text-red-600 font-bold' : ''}>{fmtDate(invoice.dueDate)}</span></p>
            {invoice.terms && (
              <p><span className="font-bold text-slate-500">Terms:</span> {invoice.terms}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Billed To ──────────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
        <p className="font-black text-slate-900 text-base">{billed.fullName}</p>
        {billed.businessName && billed.businessName !== billed.fullName && (
          <p className="text-sm text-slate-700 font-medium mt-0.5">{billed.businessName}</p>
        )}
        {billed.businessType && (
          <p className="text-xs text-slate-500 mt-0.5">{billed.businessType}</p>
        )}
        {invoice.client?.clientNo && (
          <p className="text-xs text-slate-400 mt-1">Client No. {invoice.client.clientNo}</p>
        )}
      </div>

      {/* ── Items Table ────────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-slate-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                Description
              </th>
              <th className="text-center pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16">
                Qty
              </th>
              <th className="text-left pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-32">
                Category
              </th>
              <th className="text-left pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-36">
                Remarks
              </th>
              <th className="text-right pb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-28">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {invoice.items.map((item) => {
              const categoryConfig = {
                SERVICE_FEE: { label: 'Service Fee', color: 'bg-purple-100 text-purple-700' },
                TAX_REIMBURSEMENT: { label: 'Tax Reimb.', color: 'bg-amber-100 text-amber-700' },
                GOV_FEE_REIMBURSEMENT: { label: 'Gov Fee Reimb.', color: 'bg-blue-100 text-blue-700' },
                OUT_OF_POCKET: { label: 'Out of Pocket', color: 'bg-slate-100 text-slate-700' },
              };
              const category = item.category ?? 'SERVICE_FEE';
              const cfg = categoryConfig[category] ?? categoryConfig.SERVICE_FEE;

              return (
                <tr key={item.id}>
                  <td className="py-3 text-slate-800 font-medium pr-4">{item.description}</td>
                  <td className="py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">{item.remarks ?? '—'}</td>
                  <td className="py-3 text-right font-bold text-slate-900">{fmt(item.unitPrice)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals ─────────────────────────────────────────────── */}
      <div className="px-8 py-5 border-b border-slate-100">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            {invoice.subTotal !== invoice.totalAmount && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-800">{fmt(invoice.subTotal)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tax</span>
                <span className="font-medium text-slate-800">{fmt(invoice.taxAmount)}</span>
              </div>
            )}
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Discount</span>
                <span className="font-medium text-emerald-600">-{fmt(invoice.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t-2 border-slate-900">
              <span className="font-black text-slate-900 text-sm">TOTAL PAYABLE</span>
              <span className="font-black text-xl text-amber-600">{fmt(invoice.totalAmount)}</span>
            </div>
            {invoice.payments.length > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Amount Paid</span>
                  <span className="font-bold text-emerald-600">
                    -{fmt(invoice.totalAmount - invoice.balanceDue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-slate-700">Balance Due</span>
                  <span className={`font-black text-base ${invoice.balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {fmt(invoice.balanceDue)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Payment Methods + Notes ────────────────────────────── */}
      <div className="px-8 py-5 border-b border-slate-100 grid grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Payment Methods
          </p>
          <div className="space-y-2 text-xs text-slate-700">
            <div>
              <p className="font-bold text-slate-800">Cash</p>
              <p className="text-slate-500">Payable to Agila Tax Management System</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Bank Transfer</p>
              <p className="text-slate-500">BDO Savings Account</p>
              <p className="text-slate-500">Account Name: Agila Tax Management</p>
              <p className="text-slate-500">Account No: 0012 3456 7890</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">GCash / Maya</p>
              <p className="text-slate-500">0912 312 313</p>
            </div>
          </div>
          {/* Payments recorded */}
          {invoice.payments.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Payments Recorded
              </p>
              <div className="space-y-1">
                {invoice.payments.map((p) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-slate-600">
                      {METHOD_LABELS[p.method] ?? p.method}
                      {p.referenceNumber ? ` · ${p.referenceNumber}` : ''}
                    </span>
                    <span className="font-bold text-emerald-600">{fmt(p.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Notes</p>
          {invoice.notes ? (
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{invoice.notes}</p>
          ) : (
            <p className="text-xs text-slate-400 italic">No additional notes.</p>
          )}
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="px-8 py-4 bg-slate-50 rounded-b-2xl">
        <p className="text-xs text-center text-slate-500">
          If you have any questions, feel free to contact us at{' '}
          <span className="font-bold text-slate-700">0912 312 313</span>
        </p>
        <p className="text-[10px] text-center text-slate-400 mt-1">
          Thank you for your business with Agila Tax Management System
        </p>
      </div>
    </div>
  );
}
