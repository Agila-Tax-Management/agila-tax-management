// src/components/hr/contracts/GovernmentComplianceTab.tsx
'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Employee } from '@/lib/mock-hr-data';

const STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
  Complete: 'success',
  Processing: 'warning',
  Verified: 'info',
  Missing: 'danger',
};

interface GovernmentComplianceTabProps {
  employee: Employee;
}

export function GovernmentComplianceTab({ employee }: GovernmentComplianceTabProps): React.ReactNode {
  const complianceItems = [
    {
      label: 'SSS Registration',
      value: employee.sssNo || 'Not provided',
      status: employee.sssNo ? 'Complete' : 'Missing',
      notes: 'Social Security System membership and remittance reference.',
    },
    {
      label: 'PhilHealth Registration',
      value: employee.philHealthNo || 'Not provided',
      status: employee.philHealthNo ? 'Complete' : 'Missing',
      notes: 'Health insurance enrollment and contribution account.',
    },
    {
      label: 'Pag-IBIG Registration',
      value: employee.pagIbigNo || 'Not provided',
      status: employee.pagIbigNo ? 'Complete' : 'Missing',
      notes: 'HDMF membership record for contribution and loan tracking.',
    },
    {
      label: 'TIN Verification',
      value: employee.tinNo || 'Not provided',
      status: employee.tinNo ? 'Verified' : 'Missing',
      notes: 'Taxpayer Identification Number used for payroll tax filing.',
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 space-y-5">
        <div>
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Government Compliance Overview</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Review statutory registration and payroll compliance information for this employee.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {complianceItems.map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-background p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                </div>
                <Badge variant={STATUS_VARIANT[item.status] ?? 'neutral'} className="text-[10px]">
                  {item.status}
                </Badge>
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Reference</p>
                <p className="text-sm font-semibold text-foreground mt-1">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Compliance Timeline</h3>

        <div className="divide-y divide-border">
          {[
            { label: 'Employee onboarding requirements submitted', date: employee.dateHired, status: 'Complete' },
            { label: 'Payroll government numbers validated', date: '2025-02-10', status: 'Verified' },
            { label: 'Monthly remittance alignment check', date: '2025-03-01', status: 'Processing' },
          ].map((entry) => (
            <div key={entry.label} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{entry.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{entry.date}</p>
              </div>
              <Badge variant={STATUS_VARIANT[entry.status] ?? 'neutral'} className="text-[10px]">
                {entry.status}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}