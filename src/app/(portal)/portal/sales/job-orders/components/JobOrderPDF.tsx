// src/app/(portal)/portal/sales/job-orders/components/JobOrderPDF.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import type { JobOrderRecord } from './JobOrders';

/* ── Palette ─────────────────────────────────────────────────────── */
const C = {
  indigo:   '#4338ca',
  slate900: '#0f172a',
  slate800: '#1e293b',
  slate700: '#334155',
  slate600: '#475569',
  slate500: '#64748b',
  slate400: '#94a3b8',
  slate300: '#cbd5e1',
  slate200: '#e2e8f0',
  slate100: '#f1f5f9',
  slate50:  '#f8fafc',
  white:    '#FFFFFF',
  amber:    '#d97706',
  amber50:  '#fffbeb',
  amberBdr: '#fde68a',
};

/* ── Styles ──────────────────────────────────────────────────────── */
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
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: C.slate800,
    marginBottom: 16,
  },
  companyLogoRow: { flexDirection: 'row', alignItems: 'center' },
  logoImg:        { width: 36, height: 36, borderRadius: 4, marginRight: 8 },
  companyName:    { fontFamily: 'Helvetica-Bold', fontSize: 12, color: C.slate900 },
  companyTagline: { fontSize: 8, color: C.slate500, marginTop: 3 },
  joTitle:   { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.indigo, textTransform: 'uppercase', letterSpacing: 2 },
  joNumber:  { fontFamily: 'Helvetica-Bold', fontSize: 10, color: C.slate700, marginTop: 4, textAlign: 'right' },
  joDate:    { fontSize: 8, color: C.slate500, marginTop: 2, textAlign: 'right' },

  /* Client Info */
  clientSection: {
    flexDirection: 'row',
    backgroundColor: C.slate50,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 6,
    padding: 12,
    marginBottom: 16,
  },
  clientCol:  { flex: 1 },
  infoRow:    { flexDirection: 'row', marginBottom: 5 },
  infoLabel:  { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.slate400, width: 90 },
  infoValue:  { flex: 1, fontFamily: 'Helvetica-Bold', fontSize: 8.5, color: C.slate800 },

  /* Section label */
  servicesHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableSectionLabelSubscription: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.indigo,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tableSectionLabelOneTime: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 4,
  },

  /* Table */
  tableContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 4,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: C.slate50,
    borderBottomWidth: 1,
    borderBottomColor: C.slate200,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  th: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: C.slate100,
  },
  td:       { fontSize: 8.5, color: C.slate700 },
  tdBold:   { fontFamily: 'Helvetica-Bold', color: C.slate900 },
  tdMuted:  { fontSize: 8, color: C.slate500 },
  tdIndigo: { fontFamily: 'Helvetica-Bold', color: C.indigo },
  cService: { flex: 1, paddingRight: 4 },
  cRate:    { width: 64, textAlign: 'right' },
  cDisc:    { width: 52, textAlign: 'right' },
  cTotal:   { width: 72, textAlign: 'right' },
  cRemarks: { width: 90, paddingLeft: 8 },
  subtotalRow: {
    flexDirection: 'row',
    backgroundColor: C.slate50,
    borderTopWidth: 1,
    borderTopColor: C.slate200,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  subtotalLabel: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.slate500,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'right',
    paddingRight: 4,
  },
  subtotalValue: {
    width: 72,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: C.slate700,
  },

  /* Grand Total */
  grandTotalSection: { alignItems: 'flex-end', marginBottom: 14 },
  grandTotalBox: {
    borderWidth: 2,
    borderColor: C.slate800,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    width: 240,
  },
  grandSubRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  grandSubLabel: { fontSize: 8, color: C.slate500 },
  grandSubValue: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.slate600 },
  /* Grand total uses column layout so the large amount never fights the label for horizontal space */
  grandRow:      { flexDirection: 'column', alignItems: 'flex-end', marginTop: 6 },
  grandLabel:    { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  grandValue:    { fontFamily: 'Helvetica-Bold', fontSize: 20, color: C.indigo },

  /* Notes */
  notesSection: {
    backgroundColor: C.amber50,
    borderWidth: 1,
    borderColor: C.amberBdr,
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  notesLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.amber,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: { fontSize: 8.5, color: C.slate700, lineHeight: 1.5 },

  /* Signatures */
  sigSection: {
    borderTopWidth: 2,
    borderTopColor: C.slate200,
    paddingTop: 16,
    marginTop: 4,
  },
  sigSectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    color: C.slate400,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  /* gap is not reliably supported in react-pdf — use paddingHorizontal on each block instead */
  sigRow:    { flexDirection: 'row' },
  sigBlock:  { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  /* alignSelf: stretch ensures the line fills its parent without relying on width: '100%' */
  sigLine:   { alignSelf: 'stretch', borderBottomWidth: 2, borderBottomColor: C.slate300, height: 32, marginBottom: 6 },
  sigName:   { fontFamily: 'Helvetica-Bold', fontSize: 8, color: C.slate800, textAlign: 'center' },
  /* fontStyle: 'italic' is not valid for Helvetica — use Helvetica-Oblique */
  sigAwaiting: { fontSize: 8, color: C.slate300, fontFamily: 'Helvetica-Oblique', textAlign: 'center' },
  sigRole:   { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.slate500, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 },
  sigDate:   { fontSize: 7, color: C.slate400, textAlign: 'center', marginTop: 2 },
});

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmt(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  // Use 'PHP ' instead of ₱ — Helvetica does not include the peso glyph (U+20B1)
  return 'PHP ' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtDateShort(val: string | null | undefined): string {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ── PDF Component ───────────────────────────────────────────────── */
interface JobOrderPDFProps {
  jobOrder: JobOrderRecord;
}

export function JobOrderPDF({ jobOrder: jo }: JobOrderPDFProps) {
  const clientName =
    jo.client?.businessName ??
    jo.lead.businessName ??
    `${jo.lead.firstName} ${jo.lead.lastName}`;

  const subscriptionItems = jo.items.filter((i) => i.itemType === 'SUBSCRIPTION');
  const oneTimeItems       = jo.items.filter((i) => i.itemType === 'ONE_TIME');

  const subTotal   = subscriptionItems.reduce((acc, i) => acc + parseFloat(i.total), 0);
  const otTotal    = oneTimeItems.reduce((acc, i) => acc + parseFloat(i.total), 0);
  const grandTotal = subTotal + otTotal;
  const showSubtotals = subscriptionItems.length > 0 && oneTimeItems.length > 0;

  const sigs = [
    { role: 'Prepared By',              name: jo.preparedBy?.name,        date: jo.datePrepared },
    { role: 'Operations Manager',       name: jo.operationsManager?.name, date: jo.dateOperationsManagerAck },
    { role: 'Account Officer',          name: jo.accountManager?.name,    date: jo.dateAccountManagerAck },
    { role: 'Approved by (Executive)',  name: jo.executive?.name,         date: jo.dateExecutiveAck },
  ];

  return (
    <Document title={jo.jobOrderNumber} author="Agila Tax Management System" subject={`Job Order for ${clientName}`}>
      <Page size="A4" style={s.page}>

        {/* ── Header ──────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.companyLogoRow}>
            <Image src="/images/agila_logo.webp" style={s.logoImg} />
            <View>
              <Text style={s.companyName}>AGILA TAX AND BUSINESS SOLUTIONS</Text>
              <Text style={s.companyTagline}>Tax Compliance &amp; Business Registration Services</Text>
            </View>
          </View>
          <View>
            <Text style={s.joTitle}>Job Order</Text>
            <Text style={s.joNumber}>{jo.jobOrderNumber}</Text>
            <Text style={s.joDate}>Date: {fmtDate(jo.date)}</Text>
          </View>
        </View>

        {/* ── Client Info ─────────────────────────────────────── */}
        <View style={s.clientSection}>
          <View style={s.clientCol}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Business / Client:</Text>
              <Text style={s.infoValue}>{clientName}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Contact Person:</Text>
              <Text style={s.infoValue}>{jo.lead.firstName} {jo.lead.lastName}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Business Type:</Text>
              <Text style={s.infoValue}>{jo.lead.businessType}</Text>
            </View>
          </View>
          <View style={s.clientCol}>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Contact Number:</Text>
              <Text style={s.infoValue}>{jo.lead.contactNumber ?? '—'}</Text>
            </View>
            <View style={s.infoRow}>
              <Text style={s.infoLabel}>Date Prepared:</Text>
              <Text style={s.infoValue}>{fmtDate(jo.datePrepared)}</Text>
            </View>
          </View>
        </View>

        {/* ── Services Header ─────────────────────────────────── */}
        <Text style={s.servicesHeader}>The following are the services to be rendered:</Text>

        {/* ── Subscription Table ──────────────────────────────── */}
        {subscriptionItems.length > 0 && (
          <View style={s.tableContainer}>
            <Text style={s.tableSectionLabelSubscription}>Subscription / Recurring Services</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cService]}>Service Name</Text>
              <Text style={[s.th, s.cRate]}>Rate</Text>
              <Text style={[s.th, s.cDisc]}>Disc.</Text>
              <Text style={[s.th, s.cTotal]}>Total</Text>
              <Text style={[s.th, s.cRemarks]}>Remarks</Text>
            </View>
            {subscriptionItems.map((item, idx) => (
              <View key={idx} style={s.tableRow}>
                <Text style={[s.td, s.tdBold, s.cService]}>{item.serviceName}</Text>
                <Text style={[s.td, s.cRate]}>
                  {parseFloat(item.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[s.td, s.tdMuted, s.cDisc]}>
                  {parseFloat(item.discount) > 0
                    ? parseFloat(item.discount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                    : '—'}
                </Text>
                <Text style={[s.td, s.tdIndigo, s.cTotal]}>
                  PHP {parseFloat(item.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[s.tdMuted, s.cRemarks]}>{item.remarks ?? '—'}</Text>
              </View>
            ))}
            {showSubtotals && (
              <View style={s.subtotalRow}>
                <Text style={s.subtotalLabel}>Subtotal</Text>
                <Text style={s.subtotalValue}>
                  PHP {subTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <View style={s.cRemarks} />
              </View>
            )}
          </View>
        )}

        {/* ── One-Time Table ──────────────────────────────────── */}
        {oneTimeItems.length > 0 && (
          <View style={s.tableContainer}>
            <Text style={s.tableSectionLabelOneTime}>One-Time Services</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, s.cService]}>Service Name</Text>
              <Text style={[s.th, s.cRate]}>Rate</Text>
              <Text style={[s.th, s.cDisc]}>Disc.</Text>
              <Text style={[s.th, s.cTotal]}>Total</Text>
              <Text style={[s.th, s.cRemarks]}>Remarks</Text>
            </View>
            {oneTimeItems.map((item, idx) => (
              <View key={idx} style={s.tableRow}>
                <Text style={[s.td, s.tdBold, s.cService]}>{item.serviceName}</Text>
                <Text style={[s.td, s.cRate]}>
                  {parseFloat(item.rate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[s.td, s.tdMuted, s.cDisc]}>
                  {parseFloat(item.discount) > 0
                    ? parseFloat(item.discount).toLocaleString('en-PH', { minimumFractionDigits: 2 })
                    : '—'}
                </Text>
                <Text style={[s.td, s.tdIndigo, s.cTotal]}>
                  PHP {parseFloat(item.total).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[s.tdMuted, s.cRemarks]}>{item.remarks ?? '—'}</Text>
              </View>
            ))}
            {showSubtotals && (
              <View style={s.subtotalRow}>
                <Text style={s.subtotalLabel}>Subtotal</Text>
                <Text style={s.subtotalValue}>
                  PHP {otTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </Text>
                <View style={s.cRemarks} />
              </View>
            )}
          </View>
        )}

        {/* ── Grand Total ─────────────────────────────────────── */}
        {(subscriptionItems.length > 0 || oneTimeItems.length > 0) && (
          <View style={s.grandTotalSection}>
            <View style={s.grandTotalBox}>
              {showSubtotals && (
                <>
                  <View style={s.grandSubRow}>
                    <Text style={s.grandSubLabel}>Subscription subtotal:</Text>
                    <Text style={s.grandSubValue}>{fmt(subTotal)}</Text>
                  </View>
                  <View style={[s.grandSubRow, { marginBottom: 6 }]}>
                    <Text style={s.grandSubLabel}>One-time subtotal:</Text>
                    <Text style={s.grandSubValue}>{fmt(otTotal)}</Text>
                  </View>
                </>
              )}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>Grand Total</Text>
                <Text style={s.grandValue}>{fmt(grandTotal)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Notes ───────────────────────────────────────────── */}
        {jo.notes && (
          <View style={s.notesSection}>
            <Text style={s.notesLabel}>Notes / Special Instructions</Text>
            <Text style={s.notesText}>{jo.notes}</Text>
          </View>
        )}

        {/* ── Signatures ──────────────────────────────────────── */}
        <View style={s.sigSection}>
          <Text style={s.sigSectionLabel}>Received and Acknowledged By</Text>
          <View style={s.sigRow}>
            {sigs.map((sig, i) => (
              <View key={i} style={s.sigBlock}>
                <View style={s.sigLine} />
                {sig.name
                  ? <Text style={s.sigName}>{sig.name}</Text>
                  : <Text style={s.sigAwaiting}>Awaiting</Text>
                }
                <Text style={s.sigRole}>{sig.role}</Text>
                {sig.date && <Text style={s.sigDate}>{fmtDateShort(sig.date)}</Text>}
              </View>
            ))}
          </View>
        </View>

      </Page>
    </Document>
  );
}
