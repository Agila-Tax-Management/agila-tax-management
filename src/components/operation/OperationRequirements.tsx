// src/components/operation/OperationRequirements.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import {
  Search, Building2, FileText, ChevronDown, ChevronUp,
  AlertCircle, CheckSquare,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────
interface Requirement {
  label: string;
  note?: string;
}

interface RequirementGroup {
  groupLabel: string;
  items: Requirement[];
}

interface ServiceRequirement {
  id: number;
  name: string;
  govAgency: string;
  category: 'REGISTRATION' | 'RENEWAL' | 'COMPLIANCE' | 'PAYROLL';
  description: string;
  requirements: RequirementGroup[];
  notes?: string;
}

// ── Document checklists per service ─────────────────────────────
const SERVICE_REQUIREMENTS: ServiceRequirement[] = [
  // ── REGISTRATION ──────────────────────────────────────────────
  {
    id: 1,
    name: "Mayor's Permit (New Business)",
    govAgency: "Mayor's Office / LGU",
    category: 'REGISTRATION',
    description: "Required documents to obtain a new Mayor's/Business Permit from the Local Government Unit.",
    requirements: [
      {
        groupLabel: 'Primary Requirements',
        items: [
          { label: 'Accomplished Business Permit Application Form', note: 'Available at the City Hall / LGU business permit office' },
          { label: 'DTI Business Name Registration Certificate', note: 'For Sole Proprietorship' },
          { label: 'SEC Certificate of Incorporation', note: 'For Corporations / Partnerships' },
          { label: 'Community Tax Certificate (Cedula)', note: 'Must be current year' },
          { label: 'Proof of Business Address (Contract of Lease / Title)', note: 'If rented, submit notarized lease contract' },
        ],
      },
      {
        groupLabel: 'Additional Requirements',
        items: [
          { label: 'Barangay Business Clearance', note: "Must be obtained before applying for Mayor's Permit" },
          { label: 'Locational / Zoning Clearance', note: 'From the City Planning & Development Office' },
          { label: '2x2 ID Photo of Owner / Authorized Representative' },
          { label: 'Valid Government-Issued ID of Owner' },
          { label: 'Sketch / Location Map of the Business' },
        ],
      },
      {
        groupLabel: 'For Specific Business Types',
        items: [
          { label: 'Sanitary Permit (for food-related businesses)', note: 'From the City Health Office' },
          { label: 'Fire Safety Inspection Certificate (FSIC)', note: 'From the Bureau of Fire Protection (BFP)' },
          { label: 'Environmental Compliance Certificate (if applicable)', note: 'From DENR for businesses with environmental impact' },
        ],
      },
    ],
    notes: "Barangay Clearance must be secured first before proceeding to the City Hall.",
  },
  {
    id: 2,
    name: "Mayor's Permit (Annual Renewal)",
    govAgency: "Mayor's Office / LGU",
    category: 'RENEWAL',
    description: "Documents needed to renew an existing Business Permit. Deadline is January 20 each year.",
    requirements: [
      {
        groupLabel: 'Primary Requirements',
        items: [
          { label: 'Accomplished Business Permit Renewal Form' },
          { label: "Previous Year's Business Permit (original or photocopy)" },
          { label: 'Community Tax Certificate (Cedula) — current year' },
          { label: 'Barangay Clearance — current year' },
          { label: 'Proof of Payment of Real Property Tax (if business owner)' },
        ],
      },
      {
        groupLabel: 'Financial Documents',
        items: [
          { label: 'Audited Financial Statements (AFS) — previous year', note: 'Or BIR-received ITR if AFS is not required' },
          { label: 'Quarterly Percentage Tax Returns (2551Q) or VAT Returns (2550Q)', note: 'Previous year filings' },
          { label: 'Annual Income Tax Return (1701 / 1702)', note: 'Previous year' },
        ],
      },
      {
        groupLabel: 'Additional (if applicable)',
        items: [
          { label: 'Fire Safety Inspection Certificate (FSIC) renewal' },
          { label: 'Sanitary Permit renewal (food businesses)' },
          { label: 'Updated Lease Contract', note: 'If the existing contract has expired' },
        ],
      },
    ],
    notes: "Renew before January 20 to avoid surcharges and penalties.",
  },
  {
    id: 3,
    name: 'BIR Registration (New Business)',
    govAgency: 'BIR',
    category: 'REGISTRATION',
    description: 'Requirements to register a new business with the Bureau of Internal Revenue and obtain a Certificate of Registration (COR / Form 2303).',
    requirements: [
      {
        groupLabel: 'Core Requirements',
        items: [
          { label: 'BIR Form 1901 (Sole Proprietor / Professional) or 1903 (Corporation / Partnership)', note: 'Accomplished and signed' },
          { label: 'DTI Certificate of Business Name Registration', note: 'For Sole Proprietorship' },
          { label: 'SEC Certificate of Incorporation / Partnership', note: 'For Corporations / Partnerships' },
          { label: "Mayor's Permit or Application for Mayor's Permit", note: 'Photocopy acceptable for initial registration' },
          { label: 'Proof of Business Address (Lease Contract / Title)', note: 'Notarized if rented' },
        ],
      },
      {
        groupLabel: 'Identification & Personal Documents',
        items: [
          { label: 'PSA Birth Certificate', note: 'For individual / sole proprietor' },
          { label: 'Valid Government-Issued ID (at least 2 valid IDs)' },
          { label: '1x1 or 2x2 ID Photo' },
          { label: 'Marriage Contract (if applicable)' },
        ],
      },
      {
        groupLabel: 'Books of Accounts',
        items: [
          { label: 'Journals and Ledgers (manually-kept books)', note: 'For manual bookkeeping' },
          { label: 'Permit to Use Computerized Accounting System (CAS)', note: 'If using software-based accounting' },
          { label: 'Loose-Leaf Books of Accounts Permit', note: 'If using loose-leaf / printed forms' },
        ],
      },
      {
        groupLabel: 'For Corporations / Partnerships',
        items: [
          { label: 'Articles of Incorporation and By-Laws (certified true copy)' },
          { label: 'Board Resolution authorizing the representative to register' },
          { label: 'TIN of all incorporators / partners' },
        ],
      },
    ],
    notes: "Registration must be done at the Revenue District Office (RDO) with jurisdiction over the business address.",
  },
  {
    id: 4,
    name: 'DTI Business Name Registration',
    govAgency: 'DTI',
    category: 'REGISTRATION',
    description: 'Requirements to register a business name for a Sole Proprietorship with the Department of Trade and Industry.',
    requirements: [
      {
        groupLabel: 'Requirements',
        items: [
          { label: 'Accomplished DTI Business Name Registration Form (online via DTI BNRS portal)' },
          { label: 'Valid Government-Issued ID of the applicant' },
          { label: 'Proof of Filipino Citizenship (PSA Birth Certificate)', note: 'If not apparent on the ID' },
          { label: 'Authorization Letter and ID of authorized representative', note: 'If filing on behalf of the owner' },
          { label: 'Payment of Registration Fee', note: 'Fee varies based on territorial scope (Barangay, City, Regional, National)' },
        ],
      },
    ],
    notes: "Registration can be done online via the DTI BNRS portal (bnrs.dti.gov.ph). Registration is valid for 5 years.",
  },
  {
    id: 5,
    name: 'SEC Corporation / Partnership Registration',
    govAgency: 'SEC',
    category: 'REGISTRATION',
    description: 'Requirements to register a new Corporation or Partnership with the Securities and Exchange Commission.',
    requirements: [
      {
        groupLabel: 'Core Documents',
        items: [
          { label: 'Articles of Incorporation (for Corporation) or Articles of Partnership', note: 'Notarized and signed by all incorporators' },
          { label: 'By-Laws of the Corporation', note: 'Notarized' },
          { label: 'SEC Cover Sheet (Form F-100)' },
          { label: 'Name Reservation Confirmation', note: 'From SEC online name search' },
          { label: "Treasurer's Affidavit (Corporation)", note: 'Certifying paid-up capital' },
        ],
      },
      {
        groupLabel: 'Identity & Background',
        items: [
          { label: 'Valid Government-Issued ID of all incorporators / partners' },
          { label: 'TIN of all incorporators / partners' },
          { label: 'Proof of Address of the Registered Office (Lease Contract / Title)' },
        ],
      },
      {
        groupLabel: 'For Foreign Equity (if applicable)',
        items: [
          { label: 'SEC Foreign Equity Declaration' },
          { label: 'Passport copies of foreign incorporators' },
          { label: 'Apostilled / Authenticated Documents from country of origin' },
        ],
      },
    ],
    notes: "Minimum paid-up capital for a Corporation is ₱5,000 (domestic). Foreign corporations may have higher requirements.",
  },
  {
    id: 6,
    name: 'BIR Annual Income Tax Filing (1701 / 1702)',
    govAgency: 'BIR',
    category: 'COMPLIANCE',
    description: 'Documents required for the annual filing of the Income Tax Return — deadline is April 15 each year.',
    requirements: [
      {
        groupLabel: 'Financial Records',
        items: [
          { label: 'Audited Financial Statements (AFS) — Balance Sheet, Income Statement', note: 'With independent CPA signature for corporations' },
          { label: 'Summary of Sales / Receipts for the taxable year' },
          { label: 'Summary of Purchases / Expenses for the taxable year' },
          { label: 'Books of Accounts (Journals and Ledgers)' },
        ],
      },
      {
        groupLabel: 'BIR Forms & Previous Filings',
        items: [
          { label: 'Quarterly Income Tax Returns (1701Q / 1702Q) — all 4 quarters', note: 'With proof of payment' },
          { label: 'BIR Form 2307 (Certificate of Creditable Tax Withheld)', note: 'From clients / customers who withheld taxes' },
          { label: "Prior Year's ITR (for comparison)", note: 'If applicable' },
        ],
      },
      {
        groupLabel: 'Identification Documents',
        items: [
          { label: 'BIR Certificate of Registration (Form 2303)' },
          { label: 'TIN of the taxpayer / company' },
        ],
      },
    ],
    notes: "Deadline: April 15. Late filing is subject to 25% surcharge, 12% interest per annum, and compromise penalty.",
  },
  {
    id: 7,
    name: 'SSS, PhilHealth & PAGIBIG Registration (Employer)',
    govAgency: 'SSS / PhilHealth / PAGIBIG',
    category: 'REGISTRATION',
    description: 'Requirements to register a business as an employer with the three mandatory government benefit agencies.',
    requirements: [
      {
        groupLabel: 'SSS Employer Registration (SS Form R-1)',
        items: [
          { label: 'Accomplished SS Form R-1 (Employer Registration)' },
          { label: 'DTI / SEC / CDA Registration Certificate' },
          { label: "Mayor's Permit or BIR Certificate of Registration" },
          { label: 'Valid ID of the Owner / Authorized Officer' },
          { label: 'Business Address Proof (Lease Contract / Title)' },
        ],
      },
      {
        groupLabel: 'PhilHealth Employer Registration (PBER Form)',
        items: [
          { label: 'Accomplished PhilHealth Employer Registration Form' },
          { label: 'DTI / SEC / CDA Certificate' },
          { label: 'BIR Certificate of Registration (Form 2303)' },
          { label: "Mayor's Permit" },
          { label: 'Valid ID of Owner / Authorized Representative' },
        ],
      },
      {
        groupLabel: 'PAGIBIG (Pag-IBIG) Employer Registration',
        items: [
          { label: "Accomplished Employer's Data Form (EDF)" },
          { label: 'DTI / SEC Certificate' },
          { label: 'BIR Certificate of Registration' },
          { label: "Mayor's Permit" },
          { label: 'List of employees with TIN and addresses' },
        ],
      },
    ],
    notes: "Employer registration must be done before the first payroll. Employees must be registered within 30 days of hiring.",
  },
  {
    id: 8,
    name: 'Barangay Business Clearance',
    govAgency: 'Barangay / LGU',
    category: 'REGISTRATION',
    description: "First-step clearance required before applying for a Mayor's Permit.",
    requirements: [
      {
        groupLabel: 'Requirements',
        items: [
          { label: 'Accomplished Barangay Business Clearance Application Form', note: 'Available at the Barangay Hall' },
          { label: "Proof of Business Address (Lease Contract / Title / Deed of Sale)", note: "To confirm the business is within the barangay's jurisdiction" },
          { label: 'Community Tax Certificate (Cedula) — current year' },
          { label: 'Valid Government-Issued ID of the owner' },
          { label: 'Proof of ownership or authorization to use the premises' },
          { label: 'Payment of Barangay Clearance Fee', note: 'Amount varies per barangay' },
        ],
      },
    ],
    notes: "Must be renewed annually. Required before going to the City Hall for Mayor's Permit application or renewal.",
  },
];

// ── Category config ──────────────────────────────────────────────
const CATEGORY_CONFIG = {
  REGISTRATION: { label: 'Registration',   variant: 'info'    as const, color: 'text-blue-600',    bg: 'bg-blue-50'    },
  RENEWAL:      { label: 'Annual Renewal',  variant: 'warning' as const, color: 'text-amber-600',   bg: 'bg-amber-50'   },
  COMPLIANCE:   { label: 'Compliance',      variant: 'success' as const, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  PAYROLL:      { label: 'Payroll',         variant: 'neutral' as const, color: 'text-slate-600',   bg: 'bg-slate-100'  },
};

type CategoryFilter = 'ALL' | keyof typeof CATEGORY_CONFIG;

// ── Requirement card (collapsible) ───────────────────────────────
function RequirementCard({ service }: { service: ServiceRequirement }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = CATEGORY_CONFIG[service.category];
  const totalItems = service.requirements.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <Card className="overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors"
      >
        <div className={`w-11 h-11 ${cfg.bg} rounded-xl flex items-center justify-center shrink-0`}>
          <FileText size={20} className={cfg.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="text-sm font-black text-slate-900">{service.name}</p>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Building2 size={12} className="text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">{service.govAgency}</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{service.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <Badge variant="neutral">{totalItems} items</Badge>
          {expanded
            ? <ChevronUp size={16} className="text-slate-400" />
            : <ChevronDown size={16} className="text-slate-400" />
          }
        </div>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="border-t border-border">
          <div className="p-5 space-y-5">
            {service.requirements.map((group, gi) => (
              <div key={gi}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  {group.groupLabel}
                </p>
                <ul className="space-y-2">
                  {group.items.map((item, ii) => (
                    <li key={ii} className="flex items-start gap-2.5">
                      <CheckSquare size={15} className={`${cfg.color} shrink-0 mt-0.5`} />
                      <div>
                        <p className="text-sm text-slate-800 font-medium">{item.label}</p>
                        {item.note && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.note}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Notes */}
            {service.notes && (
              <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-2">
                <AlertCircle size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 leading-relaxed">{service.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Main Component ───────────────────────────────────────────────
const TAB_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: 'ALL',          label: 'All' },
  { key: 'REGISTRATION', label: 'Registration' },
  { key: 'RENEWAL',      label: 'Renewal' },
  { key: 'COMPLIANCE',   label: 'Compliance' },
];

export function OperationRequirements() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab]   = useState<CategoryFilter>('ALL');

  const filtered = SERVICE_REQUIREMENTS.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.govAgency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'ALL' || s.category === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
          List of Requirements
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Document checklists required per service — registration, renewals, and compliance filings
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 flex-1 max-w-sm">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search services or agencies..."
            className="bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none flex-1"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 text-xs font-bold rounded-xl transition
                ${activeTab === tab.key
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
          <Badge variant="neutral">{filtered.length} service{filtered.length !== 1 ? 's' : ''}</Badge>
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <p className="text-sm">No services match your search.</p>
          <button
            onClick={() => { setSearchTerm(''); setActiveTab('ALL'); }}
            className="mt-3 text-xs font-bold text-amber-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((service) => (
            <RequirementCard key={service.id} service={service} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400 text-center pb-4">
        Click on any service card to expand and view the full document checklist.
      </p>
    </div>
  );
}
