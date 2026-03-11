'use client';

import React, { useRef } from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/UI/button';

interface Payslip {
  id: string;
  period: string;
  date: string;
  amount: string;
  employeeName: string;
  designation: string;
  employeeCode: string;
  sssNo: string;
  philhealthNo: string;
  hdmfNo: string;
  creditingDate: string;
  earnings: {
    taxable: { basic: number; overtime: number; adjustments: number };
    nonTaxable: { bonus: number; allowances: number; deMinimis: number };
  };
  deductions: {
    taxesAndStatutories: {
      absences: number; undertime: number; tardiness: number;
      sss: number; phic: number; hdmf: number; withholdingTax: number;
    };
    loansAndOthers: { loan: number; cashAdvance: number; damages: number; adjustments: number };
  };
  payment: { bank: string; accountName: string; accountNumber: string; referenceNumber: string };
}

interface PayslipModalProps {
  isOpen: boolean;
  onClose: () => void;
  payslip: Payslip;
}

const fmt = (n: number) => `₱${n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

export function PayslipModal({ isOpen, onClose, payslip }: PayslipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const e = payslip.earnings;
  const d = payslip.deductions;

  const totalTaxable    = e.taxable.basic + e.taxable.overtime + e.taxable.adjustments;
  const totalNonTaxable = e.nonTaxable.bonus + e.nonTaxable.allowances + e.nonTaxable.deMinimis;
  const grossEarnings   = totalTaxable + totalNonTaxable;

  const totalStatutory = d.taxesAndStatutories.absences + d.taxesAndStatutories.undertime +
    d.taxesAndStatutories.tardiness + d.taxesAndStatutories.sss + d.taxesAndStatutories.phic +
    d.taxesAndStatutories.hdmf + d.taxesAndStatutories.withholdingTax;
  const totalLoans = d.loansAndOthers.loan + d.loansAndOthers.cashAdvance +
    d.loansAndOthers.damages + d.loansAndOthers.adjustments;
  const totalDeductions = totalStatutory + totalLoans;
  const netPay = grossEarnings - totalDeductions;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Payslip - ${payslip.id}</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        td, th { padding: 6px 12px; text-align: left; font-size: 12px; }
        .section-title { font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #94a3b8; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .amount { text-align: right; font-weight: 700; }
        .total-row td { border-top: 2px solid #1e293b; font-weight: 900; }
        .net-pay { font-size: 24px; font-weight: 900; text-align: center; padding: 16px; background: #f8fafc; border-radius: 8px; margin-top: 16px; }
        h1 { font-size: 18px; margin-bottom: 4px; }
        .header-info { font-size: 11px; color: #64748b; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${content.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 border-b border-border gap-3">
          <h2 className="text-lg font-bold text-foreground truncate">Payslip — {payslip.id}</h2>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" className="rounded-xl text-xs" onClick={handlePrint} data-download-btn>
              <Download size={14} className="mr-1" /> <span className="hidden sm:inline">Download</span>
            </Button>
            <Button variant="ghost" className="rounded-xl text-xs" onClick={handlePrint}>
              <Printer size={14} className="mr-1" /> <span className="hidden sm:inline">Print</span>
            </Button>
            <button onClick={onClose} className="p-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-4rem)]" ref={printRef}>
          {/* Employee Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Employee</p>
              <p className="text-sm font-bold text-foreground">{payslip.employeeName}</p>
              <p className="text-xs text-muted-foreground">{payslip.designation}</p>
              <p className="text-xs text-muted-foreground font-mono">{payslip.employeeCode}</p>
            </div>
            <div className="space-y-2 text-right">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pay Period</p>
              <p className="text-sm font-bold text-foreground">{payslip.period}</p>
              <p className="text-xs text-muted-foreground">Crediting: {payslip.creditingDate}</p>
            </div>
          </div>

          {/* Government IDs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-muted rounded-xl mb-6">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">SSS No.</p>
              <p className="text-xs font-bold text-foreground font-mono">{payslip.sssNo}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">PhilHealth No.</p>
              <p className="text-xs font-bold text-foreground font-mono">{payslip.philhealthNo}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">HDMF No.</p>
              <p className="text-xs font-bold text-foreground font-mono">{payslip.hdmfNo}</p>
            </div>
          </div>

          {/* Earnings */}
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3">Earnings</p>
          <div className="space-y-4 mb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Taxable</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Basic', value: e.taxable.basic },
                  { label: 'Overtime', value: e.taxable.overtime },
                  { label: 'Adjustments', value: e.taxable.adjustments },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-emerald-700">{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Non-Taxable</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Bonus', value: e.nonTaxable.bonus },
                  { label: 'Allowances', value: e.nonTaxable.allowances },
                  { label: 'De Minimis', value: e.nonTaxable.deMinimis },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-emerald-50 rounded-lg">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-emerald-700">{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between p-3 bg-emerald-100 rounded-lg">
              <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Total Earnings</span>
              <span className="text-sm font-black text-emerald-800">{fmt(grossEarnings)}</span>
            </div>
          </div>

          {/* Deductions */}
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3">Deductions</p>
          <div className="space-y-4 mb-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Taxes & Statutories</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Absences', value: d.taxesAndStatutories.absences },
                  { label: 'Undertime', value: d.taxesAndStatutories.undertime },
                  { label: 'Tardiness', value: d.taxesAndStatutories.tardiness },
                  { label: 'SSS', value: d.taxesAndStatutories.sss },
                  { label: 'PhilHealth', value: d.taxesAndStatutories.phic },
                  { label: 'HDMF', value: d.taxesAndStatutories.hdmf },
                  { label: 'Withholding Tax', value: d.taxesAndStatutories.withholdingTax },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-rose-700">{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Loans & Others</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Loan', value: d.loansAndOthers.loan },
                  { label: 'Cash Advance', value: d.loansAndOthers.cashAdvance },
                  { label: 'Damages', value: d.loansAndOthers.damages },
                  { label: 'Adjustments', value: d.loansAndOthers.adjustments },
                ].map(item => (
                  <div key={item.label} className="p-3 bg-rose-50 rounded-lg">
                    <p className="text-[9px] font-black text-muted-foreground uppercase">{item.label}</p>
                    <p className="text-sm font-bold text-rose-700">{fmt(item.value)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between p-3 bg-rose-100 rounded-lg">
              <span className="text-xs font-black text-rose-800 uppercase tracking-widest">Total Deductions</span>
              <span className="text-sm font-black text-rose-800">{fmt(totalDeductions)}</span>
            </div>
          </div>

          {/* Net Pay */}
          <div className="p-6 bg-slate-900 rounded-2xl text-center mb-6">
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Net Take-Home Pay</p>
            <p className="text-3xl font-black text-white">{fmt(netPay)}</p>
          </div>

          {/* Payment Info */}
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">Payment Method</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted rounded-xl">
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase">Bank</p>
              <p className="text-xs font-bold text-foreground">{payslip.payment.bank}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase">Account Name</p>
              <p className="text-xs font-bold text-foreground">{payslip.payment.accountName}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase">Account No.</p>
              <p className="text-xs font-bold text-foreground font-mono">{payslip.payment.accountNumber}</p>
            </div>
            <div>
              <p className="text-[9px] font-black text-muted-foreground uppercase">Reference No.</p>
              <p className="text-xs font-bold text-foreground font-mono">{payslip.payment.referenceNumber}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
