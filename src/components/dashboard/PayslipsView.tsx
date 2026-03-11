'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Eye, Download, Search, FileText } from 'lucide-react';
import { PayslipModal } from '@/components/UI/PayslipModal';
import { useRouter } from 'next/navigation';

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
    taxable: {
      basic: number;
      overtime: number;
      adjustments: number;
    };
    nonTaxable: {
      bonus: number;
      allowances: number;
      deMinimis: number;
    };
  };
  deductions: {
    taxesAndStatutories: {
      absences: number;
      undertime: number;
      tardiness: number;
      sss: number;
      phic: number;
      hdmf: number;
      withholdingTax: number;
    };
    loansAndOthers: {
      loan: number;
      cashAdvance: number;
      damages: number;
      adjustments: number;
    };
  };
  payment: {
    bank: string;
    accountName: string;
    accountNumber: string;
    referenceNumber: string;
  };
}

export const PayslipsView: React.FC = () => {
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const payslips: Payslip[] = [
    {
      id: 'PS-2025-001',
      period: 'December 16-31, 2025',
      date: 'Jan 15, 2026',
      amount: '₱4,000.00',
      employeeName: 'Genesis Edsrilon Jr.',
      designation: 'Jr. Website Developer',
      employeeCode: 'EMP-2025-001',
      sssNo: '34-1234567-8',
      philhealthNo: '12-345678901-2',
      hdmfNo: '1234-5678-9012',
      creditingDate: 'January 15, 2026',
      earnings: {
        taxable: { basic: 0, overtime: 0, adjustments: 0 },
        nonTaxable: { bonus: 0, allowances: 4000, deMinimis: 0 },
      },
      deductions: {
        taxesAndStatutories: { absences: 0, undertime: 0, tardiness: 0, sss: 0, phic: 0, hdmf: 0, withholdingTax: 0 },
        loansAndOthers: { loan: 0, cashAdvance: 0, damages: 0, adjustments: 0 },
      },
      payment: {
        bank: 'Hello Money',
        accountName: 'Genesis Edsrilon Jr.',
        accountNumber: '12312412314',
        referenceNumber: '1412ss1241vgf1231',
      },
    },
    {
      id: 'PS-2025-002',
      period: 'December 1-15, 2025',
      date: 'Dec 31, 2025',
      amount: '₱4,000.00',
      employeeName: 'Genesis Edsrilon Jr.',
      designation: 'Jr. Website Developer',
      employeeCode: 'EMP-2025-001',
      sssNo: '34-1234567-8',
      philhealthNo: '12-345678901-2',
      hdmfNo: '1234-5678-9012',
      creditingDate: 'December 31, 2025',
      earnings: {
        taxable: { basic: 0, overtime: 0, adjustments: 0 },
        nonTaxable: { bonus: 0, allowances: 4000, deMinimis: 0 },
      },
      deductions: {
        taxesAndStatutories: { absences: 0, undertime: 0, tardiness: 0, sss: 0, phic: 0, hdmf: 0, withholdingTax: 0 },
        loansAndOthers: { loan: 0, cashAdvance: 0, damages: 0, adjustments: 0 },
      },
      payment: {
        bank: 'Hello Money',
        accountName: 'Genesis Edsrilon Jr.',
        accountNumber: '12312412314',
        referenceNumber: 'REF123456789',
      },
    },
  ];

  const handleViewPayslip = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-foreground">My Payslips</h1>
          <p className="text-sm text-muted-foreground mt-1">View and download your salary statements</p>
        </div>
        <Badge variant="info" className="bg-amber-50 text-amber-700 font-black px-4 py-2">
          <FileText size={14} className="mr-2" />
          {payslips.length} Records
        </Badge>
      </div>

      {/* Payslips Table */}
      <Card className="p-4 sm:p-8 border-none shadow-sm rounded-[2.5rem] bg-card overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h2 className="font-black text-foreground uppercase tracking-tight">Earnings History</h2>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Filter by date..."
              className="w-full pl-10 h-10 bg-muted border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto sm:-mx-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-y border-border">
                <th className="p-6">Reference</th>
                <th className="p-6">Pay Period</th>
                <th className="p-6">Payout Date</th>
                <th className="p-6">Net Pay</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {payslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-muted/50 transition-colors group">
                  <td className="p-6 font-bold text-muted-foreground text-xs">#{slip.id}</td>
                  <td className="p-6 font-black text-foreground text-sm">{slip.period}</td>
                  <td className="p-6 text-muted-foreground text-sm">{slip.date}</td>
                  <td className="p-6 font-black text-amber-600 text-base">{slip.amount}</td>
                  <td className="p-6">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        className="rounded-xl group-hover:border-amber-300 group-hover:bg-amber-50 transition-all"
                        onClick={() => router.push(`/dashboard/payslips/computation?id=${slip.id}`)}
                      >
                        <Eye size={14} className="mr-2" /> View
                      </Button>
                      <Button
                        variant="primary"
                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                        onClick={() => {
                          handleViewPayslip(slip);
                          setTimeout(() => {
                            const downloadBtn = document.querySelector('[data-download-btn]') as HTMLButtonElement;
                            downloadBtn?.click();
                          }, 500);
                        }}
                      >
                        <Download size={14} className="mr-2" /> Download
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payslip Modal */}
      {selectedPayslip && (
        <PayslipModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          payslip={selectedPayslip}
        />
      )}
    </div>
  );
};
