// src/components/hr/contracts/SalaryAttachmentTab.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';

interface SalaryDeduction {
  id: string;
  name: string;
  type: 'Mandatory' | 'Voluntary';
  employeeShare: number;
  employerShare: number;
}

interface PayrollAttachment {
  id: string;
  payPeriod: string;
  grossPay: number;
  deductions: number;
  netPay: number;
  status: 'Processed' | 'Pending' | 'Draft';
}

interface SalaryAdjustment {
  id: string;
  effectiveDate: string;
  type: 'Increase' | 'Decrease' | 'Bonus' | 'Allowance Change';
  previousAmount: number;
  newAmount: number;
  reason: string;
  approvedBy: string;
}

const MOCK_DEDUCTIONS: SalaryDeduction[] = [
  { id: 'ded-1', name: 'SSS Contribution', type: 'Mandatory', employeeShare: 900, employerShare: 1760 },
  { id: 'ded-2', name: 'PhilHealth Contribution', type: 'Mandatory', employeeShare: 500, employerShare: 500 },
  { id: 'ded-3', name: 'Pag-IBIG Contribution', type: 'Mandatory', employeeShare: 200, employerShare: 200 },
  { id: 'ded-4', name: 'Withholding Tax', type: 'Mandatory', employeeShare: 2500, employerShare: 0 },
  { id: 'ded-5', name: 'SSS Loan', type: 'Voluntary', employeeShare: 1500, employerShare: 0 },
  { id: 'ded-6', name: 'Pag-IBIG Loan', type: 'Voluntary', employeeShare: 800, employerShare: 0 },
];

const MOCK_PAYROLL: PayrollAttachment[] = [
  { id: 'pay-1', payPeriod: 'Mar 1–15, 2026', grossPay: 22500, deductions: 3300, netPay: 19200, status: 'Processed' },
  { id: 'pay-2', payPeriod: 'Feb 16–28, 2026', grossPay: 22500, deductions: 3300, netPay: 19200, status: 'Processed' },
  { id: 'pay-3', payPeriod: 'Feb 1–15, 2026', grossPay: 22500, deductions: 3300, netPay: 19200, status: 'Processed' },
  { id: 'pay-4', payPeriod: 'Jan 16–31, 2026', grossPay: 22500, deductions: 3300, netPay: 19200, status: 'Processed' },
  { id: 'pay-5', payPeriod: 'Jan 1–15, 2026', grossPay: 22500, deductions: 3300, netPay: 19200, status: 'Processed' },
];

const MOCK_ADJUSTMENTS: SalaryAdjustment[] = [
  { id: 'adj-1', effectiveDate: '2026-01-01', type: 'Increase', previousAmount: 40000, newAmount: 45000, reason: 'Annual salary increase', approvedBy: 'Rosa Mendoza' },
  { id: 'adj-2', effectiveDate: '2025-07-01', type: 'Allowance Change', previousAmount: 3000, newAmount: 4500, reason: 'Transportation allowance adjustment', approvedBy: 'Rosa Mendoza' },
  { id: 'adj-3', effectiveDate: '2025-01-01', type: 'Increase', previousAmount: 35000, newAmount: 40000, reason: 'Regularization salary adjustment', approvedBy: 'Elena Torres' },
];

const PAYROLL_STATUS_VARIANT: Record<PayrollAttachment['status'], 'success' | 'warning' | 'neutral'> = {
  Processed: 'success',
  Pending: 'warning',
  Draft: 'neutral',
};

const ADJUSTMENT_VARIANT: Record<SalaryAdjustment['type'], 'success' | 'danger' | 'info' | 'warning'> = {
  Increase: 'success',
  Decrease: 'danger',
  Bonus: 'info',
  'Allowance Change': 'warning',
};

interface SalaryAttachmentTabProps {
  _employeeId?: string;
}

export function SalaryAttachmentTab({ _employeeId }: SalaryAttachmentTabProps) {
  const [deductions] = useState(MOCK_DEDUCTIONS);
  const [payroll] = useState(MOCK_PAYROLL);
  const [adjustments] = useState(MOCK_ADJUSTMENTS);

  const totalEmployeeDeductions = deductions.reduce((s, d) => s + d.employeeShare, 0);
  const totalEmployerDeductions = deductions.reduce((s, d) => s + d.employerShare, 0);

  return (
    <div className="space-y-6">
      {/* Salary Deductions */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Salary Deductions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Deduction</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Type</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Employee Share</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Employer Share</th>
              </tr>
            </thead>
            <tbody>
              {deductions.map(d => (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-foreground">{d.name}</td>
                  <td className="px-5 py-2.5">
                    <Badge variant={d.type === 'Mandatory' ? 'info' : 'neutral'}>{d.type}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right text-foreground">₱{d.employeeShare.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right text-foreground">₱{d.employerShare.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 font-bold">
                <td className="px-5 py-2.5 text-foreground" colSpan={2}>Total</td>
                <td className="px-5 py-2.5 text-right text-foreground">₱{totalEmployeeDeductions.toLocaleString()}</td>
                <td className="px-5 py-2.5 text-right text-foreground">₱{totalEmployerDeductions.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Linked Payroll Attachments */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Linked Payroll Attachments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Pay Period</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Gross Pay</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Deductions</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Net Pay</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {payroll.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-foreground">{p.payPeriod}</td>
                  <td className="px-5 py-2.5 text-right text-foreground">₱{p.grossPay.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right text-red-500">-₱{p.deductions.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-foreground">₱{p.netPay.toLocaleString()}</td>
                  <td className="px-5 py-2.5">
                    <Badge variant={PAYROLL_STATUS_VARIANT[p.status]}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Salary Adjustments */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Salary Adjustments</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Effective Date</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Type</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Previous</th>
                <th className="text-right px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">New</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Reason</th>
                <th className="text-left px-5 py-2.5 text-xs font-bold text-muted-foreground uppercase">Approved By</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map(a => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-2.5 font-medium text-foreground">{a.effectiveDate}</td>
                  <td className="px-5 py-2.5">
                    <Badge variant={ADJUSTMENT_VARIANT[a.type]}>{a.type}</Badge>
                  </td>
                  <td className="px-5 py-2.5 text-right text-muted-foreground">₱{a.previousAmount.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-right font-semibold text-foreground">₱{a.newAmount.toLocaleString()}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{a.reason}</td>
                  <td className="px-5 py-2.5 text-muted-foreground">{a.approvedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
