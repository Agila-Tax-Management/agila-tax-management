// src/components/accounting/InvoicePDF.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { InvoiceRecord } from '@/types/accounting.types';

/* ── Color palette ─────────────────────────────────────────────── */
const C = {
  amber:     '#d97706',
  slate900:  '#0f172a',
  slate800:  '#1e293b',
  slate700:  '#334155',
  slate600:  '#475569',
  slate500:  '#64748b',
  slate400:  '#94a3b8',
  slate300:  '#cbd5e1',
  slate200:  '#e2e8f0',
  slate100:  '#f1f5f9',
  slate50:   '#f8fafc',
  white:     '#FFFFFF',
  emerald:   '#16a34a',
  red:       '#dc2626',
};

/* ── Status config ──────────────────────────────────────────────── */
const STATUS_STYLE: Record<string, { border: string; text: string; label: string }> = {
  DRAFT:          { border: C.slate300, text: C.slate500, label: 'DRAFT' },
  UNPAID:         { border: '#fcd34d', text: C.amber,    label: 'UNPAID' },
  PARTIALLY_PAID: { border: '#93c5fd', text: '#1d4ed8',  label: 'PARTIALLY PAID' },
  PAID:           { border: '#86efac', text: C.emerald,  label: 'PAID' },
  OVERDUE:        { border: '#fca5a5', text: C.red,      label: 'OVERDUE' },
  VOID:           { border: C.slate300, text: C.slate500, label: 'VOID' },
};

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Cash', BANK_TRANSFER: 'Bank Transfer',
  CHECK: 'Check', E_WALLET: 'E-Wallet', CREDIT_CARD: 'Credit Card',
};

/* ── Styles ─────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingHorizontal: 40,
    paddingVertical: 36,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.slate800,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: C.slate100,
    marginBottom: 16,
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  logoImg: {
    width: 28,
    height: 28,
    borderRadius: 5,
    marginRight: 7,
  },
  companyName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: C.slate900 },
  companyCity: { fontSize: 8, color: C.slate500 },
  companyContact: { fontSize: 7.5, color: C.slate400, marginTop: 3 },

  headerRight: { alignItems: 'flex-end' },
  invNumber: { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.amber },
  statusPill: {
    marginTop: 4, marginBottom: 5,
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 99, borderWidth: 1,
    alignSelf: 'flex-end',
  },
  statusText: { fontFamily: 'Helvetica-Bold', fontSize: 7 },
  metaLine: { flexDirection: 'row', marginTop: 2 },
  metaLabel: { fontFamily: 'Helvetica-Bold', color: C.slate500, fontSize: 8, marginRight: 3 },
  metaValue: { color: C.slate600, fontSize: 8 },

  /* Billed To */
  billedSection: {
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.slate100,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.slate400,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6,
  },
  billedName: { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.slate900, marginBottom: 2 },
  billedSub:  { fontSize: 9, color: C.slate700, marginBottom: 1 },
  billedMeta: { fontSize: 7.5, color: C.slate500 },

  /* Items Table */
  tableSection: {
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.slate100,
    marginBottom: 14,
  },
  tableHead: {
    flexDirection: 'row',
    borderBottomWidth: 1.5, borderBottomColor: C.slate200,
    paddingBottom: 5, marginBottom: 3,
  },
  th: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.4 },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5, borderBottomColor: C.slate50,
  },
  cDesc:    { flex: 1, paddingRight: 6 },
  cQty:     { width: 28, textAlign: 'center' },
  cRemarks: { width: 100, paddingLeft: 6 },
  cAmount:  { width: 76, textAlign: 'right' },
  td:       { fontSize: 9, color: C.slate700 },
  tdBold:   { fontFamily: 'Helvetica-Bold', color: C.slate900 },
  tdMuted:  { fontSize: 8, color: C.slate500 },

  /* Totals */
  totalsSection: {
    paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: C.slate100,
    marginBottom: 14,
    alignItems: 'flex-end',
  },
  totalsBlock: { width: 210 },
  totalRow:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  totalLbl:    { fontSize: 8.5, color: C.slate500 },
  totalVal:    { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.slate700 },
  grandRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 6, borderTopWidth: 1.5, borderTopColor: C.slate900, marginTop: 4,
  },
  grandLbl: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: C.slate900 },
  grandVal: { fontFamily: 'Helvetica-Bold', fontSize: 16, color: C.amber },

  /* Two-column */
  twoCol:  { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.slate100, marginBottom: 14 },
  colLeft: { flex: 1, paddingRight: 18 },
  colRight: { flex: 1 },
  pmBlock:  { marginBottom: 8 },
  pmTitle:  { fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: C.slate800, marginBottom: 2 },
  pmDesc:   { fontSize: 7.5, color: C.slate500, lineHeight: 1.4 },
  pmRecordedTitle: {
    fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.slate400,
    textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 10, marginBottom: 4,
  },
  pmRecordRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  pmRecordLabel: { fontSize: 7.5, color: C.slate600, flex: 1 },
  pmRecordAmt:   { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: C.emerald },
  notesText:     { fontSize: 8.5, color: C.slate700, lineHeight: 1.5 },
  noNotes:       { fontSize: 8.5, color: C.slate400, fontStyle: 'italic' },

  /* Footer */
  footer: { paddingTop: 10, borderTopWidth: 1, borderTopColor: C.slate200, alignItems: 'center' },
  footerLine:  { fontSize: 8, color: C.slate500, textAlign: 'center' },
  footerBold:  { fontFamily: 'Helvetica-Bold', color: C.slate700 },
  footerSub:   { fontSize: 7, color: C.slate400, textAlign: 'center', marginTop: 3 },
});

/* ── Helpers ────────────────────────────────────────────────────── */
function fmt(n: number) {
  // Use 'PHP ' instead of ₱ — Helvetica does not include the peso glyph (U+20B1)
  return 'PHP ' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
}
function getBilledTo(invoice: InvoiceRecord) {
  if (invoice.client) {
    return {
      fullName: invoice.client.businessName,
      businessName: null,
      businessType: invoice.client.businessEntity.replace(/_/g, ' '),
      clientNo: invoice.client.clientNo ?? null,
    };
  }
  if (invoice.lead) {
    const { firstName, middleName, lastName, businessName, businessType } = invoice.lead;
    const personName = [firstName, middleName, lastName].filter(Boolean).join(' ');
    return {
      // Prefer business name as the primary display; fall back to person name
      fullName: businessName ?? personName,
      // Show person name as subtitle only when business name is the primary
      businessName: businessName ? personName : null,
      businessType: businessType !== 'Not Specified' ? businessType : null,
      clientNo: null,
    };
  }
  return { fullName: 'N/A', businessName: null, businessType: null, clientNo: null };
}

/* ── PDF Document Component ─────────────────────────────────────── */
interface InvoicePDFProps {
  invoice: InvoiceRecord;
}

export function InvoicePDF({ invoice }: InvoicePDFProps) {
  const billed = getBilledTo(invoice);
  const st = STATUS_STYLE[invoice.status] ?? STATUS_STYLE.DRAFT;

  return (
    <Document
      title={invoice.invoiceNumber}
      author="Agila Tax Management System"
      subject={`Invoice for ${billed.fullName}`}
    >
      <Page size="A4" style={s.page}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={s.header}>
          {/* Left: Company info */}
          <View>
            <View style={s.logoRow}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt prop */}
              <Image src="/images/agila_logo.webp" style={s.logoImg} />
              <View>
                <Text style={s.companyName}>AGILA TAX MANAGEMENT</Text>
                <Text style={s.companyCity}>Cebu City, Philippines</Text>
              </View>
            </View>
            <Text style={s.companyContact}>accounting@agila.ph  ·  0912 312 313</Text>
          </View>

          {/* Right: Invoice number + status + dates */}
          <View style={s.headerRight}>
            <Text style={s.invNumber}>{invoice.invoiceNumber}</Text>
            <View style={[s.statusPill, { borderColor: st.border }]}>
              <Text style={[s.statusText, { color: st.text }]}>{st.label}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>Date Issued:</Text>
              <Text style={s.metaValue}>{fmtDate(invoice.issueDate)}</Text>
            </View>
            <View style={s.metaLine}>
              <Text style={s.metaLabel}>Due Date:</Text>
              <Text style={[s.metaValue, invoice.status === 'OVERDUE' ? { color: C.red, fontFamily: 'Helvetica-Bold' } : {}]}>
                {fmtDate(invoice.dueDate)}
              </Text>
            </View>
            {invoice.terms && (
              <View style={s.metaLine}>
                <Text style={s.metaLabel}>Terms:</Text>
                <Text style={s.metaValue}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Billed To ───────────────────────────────────────── */}
        <View style={s.billedSection}>
          <Text style={s.sectionTitle}>Billed To</Text>
          <Text style={s.billedName}>{billed.fullName}</Text>
          {billed.businessName && billed.businessName !== billed.fullName && (
            <Text style={s.billedSub}>{billed.businessName}</Text>
          )}
          {billed.businessType && (
            <Text style={s.billedMeta}>{billed.businessType}</Text>
          )}
          {billed.clientNo && (
            <Text style={s.billedMeta}>Client No. {billed.clientNo}</Text>
          )}
        </View>

        {/* ── Items Table ─────────────────────────────────────── */}
        <View style={s.tableSection}>
          <View style={s.tableHead}>
            <Text style={[s.th, s.cDesc]}>Description</Text>
            <Text style={[s.th, s.cQty]}>Qty</Text>
            <Text style={[s.th, s.cRemarks]}>Remarks</Text>
            <Text style={[s.th, s.cAmount]}>Amount</Text>
          </View>
          {invoice.items.map((item, idx) => (
            <View key={idx} style={s.tableRow}>
              <Text style={[s.td, s.cDesc]}>{item.description}</Text>
              <Text style={[s.td, s.cQty]}>{item.quantity}</Text>
              <Text style={[s.tdMuted, s.cRemarks]}>{item.remarks ?? '—'}</Text>
              <Text style={[s.td, s.tdBold, s.cAmount]}>{fmt(item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        {/* ── Totals ──────────────────────────────────────────── */}
        <View style={s.totalsSection}>
          <View style={s.totalsBlock}>
            {invoice.subTotal !== invoice.totalAmount && (
              <View style={s.totalRow}>
                <Text style={s.totalLbl}>Subtotal</Text>
                <Text style={s.totalVal}>{fmt(invoice.subTotal)}</Text>
              </View>
            )}
            {invoice.taxAmount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLbl}>Tax</Text>
                <Text style={s.totalVal}>{fmt(invoice.taxAmount)}</Text>
              </View>
            )}
            {invoice.discountAmount > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLbl}>Discount</Text>
                <Text style={[s.totalVal, { color: C.emerald }]}>-{fmt(invoice.discountAmount)}</Text>
              </View>
            )}
            <View style={s.grandRow}>
              <Text style={s.grandLbl}>TOTAL PAYABLE</Text>
              <Text style={s.grandVal}>{fmt(invoice.totalAmount)}</Text>
            </View>
            {invoice.payments.length > 0 && (
              <>
                <View style={[s.totalRow, { marginTop: 6 }]}>
                  <Text style={s.totalLbl}>Amount Paid</Text>
                  <Text style={[s.totalVal, { color: C.emerald }]}>
                    -{fmt(invoice.totalAmount - invoice.balanceDue)}
                  </Text>
                </View>
                <View style={s.totalRow}>
                  <Text style={[s.totalLbl, { fontFamily: 'Helvetica-Bold', color: C.slate700 }]}>Balance Due</Text>
                  <Text style={[s.totalVal, { fontSize: 10.5, color: invoice.balanceDue > 0 ? C.red : C.emerald }]}>
                    {fmt(invoice.balanceDue)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* ── Payment Methods + Notes ──────────────────────────── */}
        <View style={s.twoCol}>
          {/* Left: Payment Methods */}
          <View style={s.colLeft}>
            <Text style={s.sectionTitle}>Payment Methods</Text>
            <View style={s.pmBlock}>
              <Text style={s.pmTitle}>Cash</Text>
              <Text style={s.pmDesc}>Payable to Agila Tax Management System</Text>
            </View>
            <View style={s.pmBlock}>
              <Text style={s.pmTitle}>Bank Transfer</Text>
              <Text style={s.pmDesc}>BDO Savings Account</Text>
              <Text style={s.pmDesc}>Account Name: Agila Tax Management</Text>
              <Text style={s.pmDesc}>Account No: 0012 3456 7890</Text>
            </View>
            <View style={s.pmBlock}>
              <Text style={s.pmTitle}>GCash / Maya</Text>
              <Text style={s.pmDesc}>0912 312 313</Text>
            </View>
            {invoice.payments.length > 0 && (
              <View>
                <Text style={s.pmRecordedTitle}>Payments Recorded</Text>
                {invoice.payments.map((p, idx) => (
                  <View key={idx} style={s.pmRecordRow}>
                    <Text style={s.pmRecordLabel}>
                      {METHOD_LABELS[p.method] ?? p.method}
                      {p.referenceNumber ? ` · ${p.referenceNumber}` : ''}
                    </Text>
                    <Text style={s.pmRecordAmt}>{fmt(p.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right: Notes */}
          <View style={s.colRight}>
            <Text style={s.sectionTitle}>Notes</Text>
            {invoice.notes ? (
              <Text style={s.notesText}>{invoice.notes}</Text>
            ) : (
              <Text style={s.noNotes}>No additional notes.</Text>
            )}
          </View>
        </View>

        {/* ── Footer ──────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerLine}>
            If you have any questions, feel free to contact us at{' '}
            <Text style={s.footerBold}>0912 312 313</Text>
          </Text>
          <Text style={s.footerSub}>
            Thank you for your business with Agila Tax Management System
          </Text>
        </View>

      </Page>
    </Document>
  );
}
