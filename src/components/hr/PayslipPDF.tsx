// src/components/hr/PayslipPDF.tsx
import React from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';

// ─── Types ────────────────────────────────────────────────────────

interface PayslipData {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNo: string | null;
    position?: { title: string } | null;
    department?: { name: string } | null;
  };
  payrollPeriod: {
    startDate: string;
    endDate: string;
    payoutDate: string;
    status: string;
    payrollSchedule: { name: string; frequency: string } | null;
  };
  basicPay: string;
  holidayPay: string;
  overtimePay: string;
  paidLeavePay: string;
  allowance: string;
  grossPay: string;
  sssDeduction: string;
  philhealthDeduction: string;
  pagibigDeduction: string;
  withholdingTax: string;
  lateUndertimeDeduction: string;
  pagibigLoan: string;
  sssLoan: string;
  cashAdvanceRepayment: string;
  totalDeductions: string;
  netPay: string;
  preparedAt?: string | null;
  approvedAt?: string | null;
  acknowledgedAt: string | null;
  preparedBy: { name: string } | null;
  approvedBy: { name: string } | null;
  acknowledgedBy: { name: string } | null;
}

interface Props {
  payslip: PayslipData;
}

// ─── Styles ───────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 8,
    color: '#111827',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 32,
    backgroundColor: '#ffffff',
  },
  copyBadge: {
    position: 'absolute',
    top: 10,
    right: 32,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    borderWidth: 0.5,
    borderColor: '#d1d5db',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 2,
  },
  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1d4ed8',
    marginBottom: 12,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 28,
    height: 28,
    borderRadius: 4,
    marginRight: 7,
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  companySubtitle: {
    fontSize: 6.5,
    color: '#6b7280',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  payslipTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#374151',
  },
  payslipPeriod: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 2,
  },
  // ── Info Grid ──
  infoGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    padding: 7,
  },
  infoLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#9ca3af',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
  },
  infoValueSub: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 1,
  },
  // ── Two-column body ──
  twoCol: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  col: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  table: {
    borderWidth: 0.5,
    borderColor: '#e5e7eb',
    borderRadius: 3,
  },
  tableRow: {
    flexDirection: 'row',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
  },
  tableRowLast: {
    flexDirection: 'row',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  colLabel: {
    flex: 1,
    fontSize: 7,
    color: '#374151',
  },
  colAmount: {
    fontSize: 7,
    color: '#374151',
    textAlign: 'right',
  },
  colAmountRed: {
    fontSize: 7,
    color: '#dc2626',
    textAlign: 'right',
  },
  totalRowGreen: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#16a34a',
  },
  totalRowRed: {
    flexDirection: 'row',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#dc2626',
  },
  totalLabelGreen: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#166534',
  },
  totalAmountGreen: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#16a34a',
    textAlign: 'right',
  },
  totalLabelRed: {
    flex: 1,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#991b1b',
  },
  totalAmountRed: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#dc2626',
    textAlign: 'right',
  },
  // ── Net Pay ──
  netPayRow: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 3,
    alignItems: 'center',
    marginBottom: 12,
  },
  netPayLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#1e40af',
    letterSpacing: 1,
  },
  netPayAmount: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#1d4ed8',
  },
  // ── Signatures ──
  sigRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  sigBox: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: '#9ca3af',
    paddingTop: 5,
    marginTop: 16,
  },
  sigLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  sigName: {
    fontSize: 7.5,
    color: '#374151',
  },
  sigDate: {
    fontSize: 6.5,
    color: '#9ca3af',
    marginTop: 1,
  },
  // ── Footer ──
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
    fontSize: 6.5,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

// ─── Helpers ──────────────────────────────────────────────────────

function amt(v: string | number): string {
  const n = Number(v) || 0;
  return `PHP ${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function fmtMonthYear(d: string): string {
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
}

// ─── Single Page ──────────────────────────────────────────────────

function PayslipPage({
  payslip,
  copy,
}: {
  payslip: PayslipData;
  copy: 'EMPLOYEE COPY' | 'EMPLOYER COPY';
}) {
  const startDate = fmtDate(payslip.payrollPeriod.startDate);
  const endDate = fmtDate(payslip.payrollPeriod.endDate);
  const payoutDate = fmtDate(payslip.payrollPeriod.payoutDate);
  const period = fmtMonthYear(payslip.payrollPeriod.startDate);

  const earnings = [
    { label: 'Basic Pay', value: payslip.basicPay },
    { label: 'Holiday Pay', value: payslip.holidayPay },
    { label: 'Overtime Pay', value: payslip.overtimePay },
    { label: 'Paid Leave Pay', value: payslip.paidLeavePay },
    { label: 'Allowance', value: payslip.allowance },
  ].filter((e) => (Number(e.value) || 0) !== 0);

  const deductions = [
    { label: 'SSS', value: payslip.sssDeduction },
    { label: 'PhilHealth', value: payslip.philhealthDeduction },
    { label: 'Pag-IBIG', value: payslip.pagibigDeduction },
    { label: 'Withholding Tax', value: payslip.withholdingTax },
    { label: 'Late / Undertime', value: payslip.lateUndertimeDeduction },
    { label: 'SSS Loan', value: payslip.sssLoan },
    { label: 'Pag-IBIG Loan', value: payslip.pagibigLoan },
    { label: 'Cash Advance', value: payslip.cashAdvanceRepayment },
  ].filter((d) => (Number(d.value) || 0) !== 0);

  return (
    <Page size="A4" style={s.page}>
      {/* Copy badge */}
      <Text style={s.copyBadge}>{copy}</Text>

      {/* Header */}
      <View style={s.header}>
        <View style={s.logoRow}>
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image does not support alt prop */}
          <Image src="/images/agila_logo.webp" style={s.logoImg} />
          <View>
            <Text style={s.companyName}>AGILA TAX MANAGEMENT</Text>
            <Text style={s.companySubtitle}>Tax Consulting & Business Solutions · Cebu City, Philippines</Text>
          </View>
        </View>
        <View style={s.headerRight}>
          <Text style={s.payslipTitle}>Payslip</Text>
          <Text style={s.payslipPeriod}>{period}</Text>
        </View>
      </View>

      {/* Info Grid */}
      <View style={s.infoGrid}>
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Employee</Text>
          <Text style={s.infoValue}>{payslip.employee.firstName} {payslip.employee.lastName}</Text>
          {payslip.employee.employeeNo ? <Text style={s.infoValueSub}>{payslip.employee.employeeNo}</Text> : null}
          {payslip.employee.position ? <Text style={s.infoValueSub}>{payslip.employee.position.title}</Text> : null}
          {payslip.employee.department ? <Text style={s.infoValueSub}>{payslip.employee.department.name}</Text> : null}
        </View>
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Schedule</Text>
          <Text style={s.infoValue}>{payslip.payrollPeriod.payrollSchedule?.name ?? '—'}</Text>
          <Text style={s.infoValueSub}>{startDate} – {endDate}</Text>
        </View>
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>Payout Date</Text>
          <Text style={s.infoValue}>{payoutDate}</Text>
        </View>
      </View>

      {/* Earnings + Deductions side by side */}
      <View style={s.twoCol}>
        <View style={s.col}>
          <Text style={s.sectionTitle}>Earnings</Text>
          <View style={s.table}>
            {earnings.length === 0 ? (
              <View style={s.tableRowLast}>
                <Text style={[s.colLabel, { color: '#9ca3af' }]}>No earnings recorded</Text>
              </View>
            ) : (
              earnings.map((e, i) => (
                <View key={e.label} style={i < earnings.length - 1 ? s.tableRow : s.tableRowLast}>
                  <Text style={s.colLabel}>{e.label}</Text>
                  <Text style={s.colAmount}>{amt(e.value)}</Text>
                </View>
              ))
            )}
            <View style={s.totalRowGreen}>
              <Text style={s.totalLabelGreen}>Gross Pay</Text>
              <Text style={s.totalAmountGreen}>{amt(payslip.grossPay)}</Text>
            </View>
          </View>
        </View>

        <View style={s.col}>
          <Text style={s.sectionTitle}>Deductions</Text>
          <View style={s.table}>
            {deductions.length === 0 ? (
              <View style={s.tableRowLast}>
                <Text style={[s.colLabel, { color: '#9ca3af' }]}>No deductions recorded</Text>
              </View>
            ) : (
              deductions.map((d, i) => (
                <View key={d.label} style={i < deductions.length - 1 ? s.tableRow : s.tableRowLast}>
                  <Text style={s.colLabel}>{d.label}</Text>
                  <Text style={s.colAmountRed}>{amt(d.value)}</Text>
                </View>
              ))
            )}
            <View style={s.totalRowRed}>
              <Text style={s.totalLabelRed}>Total Deductions</Text>
              <Text style={s.totalAmountRed}>{amt(payslip.totalDeductions)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Net Pay */}
      <View style={s.netPayRow}>
        <Text style={s.netPayLabel}>NET PAY</Text>
        <Text style={s.netPayAmount}>{amt(payslip.netPay)}</Text>
      </View>

      {/* Signatures */}
      <View style={s.sigRow}>
        <View style={s.sigBox}>
          <Text style={s.sigLabel}>Prepared By</Text>
          <Text style={s.sigName}>{payslip.preparedBy?.name ?? '______________________'}</Text>
          {payslip.preparedAt ? <Text style={s.sigDate}>{fmtDate(payslip.preparedAt)}</Text> : null}
        </View>
        <View style={s.sigBox}>
          <Text style={s.sigLabel}>Approved By</Text>
          <Text style={s.sigName}>{payslip.approvedBy?.name ?? '______________________'}</Text>
          {payslip.approvedAt ? <Text style={s.sigDate}>{fmtDate(payslip.approvedAt)}</Text> : null}
        </View>
        <View style={s.sigBox}>
          <Text style={s.sigLabel}>Received / Acknowledged By</Text>
          <Text style={s.sigName}>{payslip.acknowledgedBy?.name ?? '______________________'}</Text>
          {payslip.acknowledgedAt ? <Text style={s.sigDate}>{fmtDate(payslip.acknowledgedAt)}</Text> : null}
        </View>
      </View>

      <Text style={s.footer}>
        This is a computer-generated payslip. · Agila Tax Management System
      </Text>
    </Page>
  );
}

// ─── Document ─────────────────────────────────────────────────────

export function PayslipPDF({ payslip }: Props) {
  return (
    <Document title={`Payslip — ${payslip.employee.firstName} ${payslip.employee.lastName}`}>
      <PayslipPage payslip={payslip} copy="EMPLOYEE COPY" />
      <PayslipPage payslip={payslip} copy="EMPLOYER COPY" />
    </Document>
  );
}
