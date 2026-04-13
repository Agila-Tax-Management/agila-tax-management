// src/app/(portal)/portal/compliance/client-compliances/[clientId]/components/ComplianceDetailShell.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import { SubscriptionDetail } from '@/components/compliance/SubscriptionDetail';
import { EWTDetail } from '@/components/compliance/EWTDetail';
import { CWTDetail } from '@/components/compliance/CWTDetail';
import { SalesBookDetail } from '@/components/compliance/SalesBookDetail';
import { ExpensesBookDetail } from '@/components/compliance/ExpensesBookDetail';

// ─── Slug → compliance id map ─────────────────────────────────────────────────

const SLUG_TO_ID: Record<string, string> = {
  'subscription-fee':             'subscription',
  'expanded-withholding-tax':     'ewt',
  'compensation-withholding-tax': 'cwt',
  'sales-book':                   'sales-book',
  'expenses-book':                'expense-book',
  'percentage-tax':               'percentage-tax',
  'income-tax':                   'income-tax',
  'sss':                          'sss',
  'philhealth':                   'phic',
  'pagibig':                      'hdmf',
  'vat':                          'vat',
  'gis':                          'gis',
  'sec-afs':                      'sec-afs',
};

const COMPLIANCE_NAMES: Record<string, string> = {
  'subscription':   'Subscription Fee',
  'ewt':            'Expanded Withholding Tax (EWT)',
  'cwt':            'Compensation Withholding Tax (CWT)',
  'sales-book':     'Sales Book',
  'expense-book':   'Expenses Book',
  'percentage-tax': 'Percentage Tax',
  'income-tax':     'Income Tax',
  'sss':            'Social Security System',
  'phic':           'Philippine Health Insurance Corp. (PhilHealth)',
  'hdmf':           'Home Development Mutual Fund (Pag-IBIG)',
  'vat':            'Value-Added Tax (VAT)',
  'gis':            'General Information Sheet (GIS)',
  'sec-afs':        'SEC AFS Submission',
};

const YEAR_OPTIONS = [2024, 2025, 2026];

interface Props {
  clientId: string;
  complianceSlug: string;
  yearParam: string | undefined;
}

export function ComplianceDetailShell({ clientId, complianceSlug, yearParam }: Props): React.ReactNode {
  const router = useRouter();

  const client = MOCK_COMPLIANCE_CLIENTS.find(c => c.id === clientId) ?? null;

  const initialYear = yearParam ? parseInt(yearParam, 10) : 2026;
  const [selectedYear, setSelectedYear] = useState(
    YEAR_OPTIONS.includes(initialYear) ? initialYear : 2026,
  );

  function handleYearChange(y: number) {
    setSelectedYear(y);
    router.replace(
      `/portal/compliance/client-compliances/${clientId}/${complianceSlug}?year=${y}`,
      { scroll: false },
    );
  }

  function handleBack() {
    router.push(`/portal/compliance/client-compliances/${clientId}?year=${selectedYear}`);
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Client not found.
      </div>
    );
  }

  const complianceId = SLUG_TO_ID[complianceSlug];

  if (!complianceId) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Unknown compliance type.
      </div>
    );
  }

  // ── Detail components that have full implementations ──────────────────────

  if (complianceId === 'subscription') {
    return (
      <SubscriptionDetail
        client={client}
        year={selectedYear}
        onYearChange={handleYearChange}
      />
    );
  }

  if (complianceId === 'ewt') {
    return (
      <EWTDetail
        client={client}
        year={selectedYear}
        onYearChange={handleYearChange}
      />
    );
  }

  if (complianceId === 'cwt') {
    return (
      <CWTDetail
        client={client}
        year={selectedYear}
        onYearChange={handleYearChange}
      />
    );
  }

  if (complianceId === 'sales-book') {
    return (
      <SalesBookDetail
        client={client}
        year={selectedYear}
        onYearChange={handleYearChange}
      />
    );
  }

  if (complianceId === 'expense-book') {
    return (
      <ExpensesBookDetail
        client={client}
        year={selectedYear}
        onYearChange={handleYearChange}
      />
    );
  }

  // ── Placeholder for not-yet-implemented compliances ───────────────────────

  const complianceName = COMPLIANCE_NAMES[complianceId] ?? complianceSlug;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <button
        onClick={handleBack}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        ← Back to Working Paper
      </button>
      <Card className="p-6 border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
            <Building2 size={22} className="text-slate-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">
              {client.businessName} ({client.clientNo})
            </p>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{complianceName}</h1>
          </div>
        </div>
      </Card>
      <Card className="p-16 text-center border-dashed border-slate-200">
        <p className="text-sm text-slate-400">Detail view for this compliance is coming soon.</p>
      </Card>
    </div>
  );
}
