import React from 'react';
import { Zap, TrendingUp, Sparkles, Crown } from 'lucide-react';
import type { ServiceItem } from './types';

// ── Plan Types ──────────────────────────────────────────────
export type ServicePlan =
  | 'starter'
  | 'essentials-non-vat'
  | 'essentials-vat'
  | 'agila360-non-vat'
  | 'agila360-vat'
  | 'vip';

export interface PlanDetails {
  id: ServicePlan;
  name: string;
  displayName: string;
  price: string;
  currency: string;
  period: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  badge?: string;
  badgeColor?: string;
  featuresIncluded: string[];
  featuresNotIncluded: string[];
  featuresMore?: string[];
  designedFor: string[];
  freebies: string[];
  highlights: string[];
}

// ── Shared Freebies ────────────────────────────────────────
const SHARED_FREEBIES = [
  'Free Tax Calendar & Reminders',
  'Free Compliance Checklist',
  'Free Business Registration Guide',
  'Free Tax Consultation (1st Session)',
];

// ── Plan Data ───────────────────────────────────────────────
export const PLAN_DATA: Record<ServicePlan, PlanDetails> = {
  'starter': {
    id: 'starter',
    name: 'Agila Starter Plan',
    displayName: 'Starter',
    price: '1,500',
    currency: '₱',
    period: 'month',
    description: 'Compliance made simple, friendly, and stress-free for micro and newly registered businesses.',
    icon: React.createElement(Zap, { className: 'w-5 h-5' }),
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    badge: 'Best for Micro Businesses',
    badgeColor: 'bg-blue-100 text-blue-700',
    featuresIncluded: [
      'DTI Registration',
      'Mayor\'s Permit Processing',
      'BIR Business Registration',
      'BIR Compliance Filing Services',
      'Annual Mayor\'s Permit Renewal',
      'Annual Income Tax Return',
    ],
    featuresNotIncluded: [
      'SSS Registration / Remittances',
      'PhilHealth Registration / Remittances',
      'PAGIBIG Registration / Remittances',
      'DOLE Registration',
      'Payroll Services',
      'Monthly On-Site Check Up',
    ],
    designedFor: [
      'New and Micro Businesses',
      'Sole Proprietorship Entities only',
      'Cebu City Businesses only',
      'Monthly Sales less than 100K / month',
    ],
    freebies: SHARED_FREEBIES,
    highlights: [
      'Perfect for startups',
      'Essential compliance covered',
      'Cebu City focused',
    ],
  },
  'essentials-non-vat': {
    id: 'essentials-non-vat',
    name: 'Agila Essentials Plan - Non-VAT',
    displayName: 'Essentials (Non-VAT)',
    price: '2,500',
    currency: '₱',
    period: 'month',
    description: 'Compliance made simple, friendly, and stress-free for micro and newly registered businesses.',
    icon: React.createElement(TrendingUp, { className: 'w-5 h-5' }),
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badge: 'Best for New Micro to Small Businesses',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    featuresIncluded: [
      'DTI / SEC Registration',
      'Mayor\'s Permit Processing',
      'BIR Business Registration',
      'BIR Compliance Filing Services',
      'Annual Mayor\'s Permit Renewal',
      'Annual Income Tax Return',
    ],
    featuresNotIncluded: [
      'SSS Registration / Remittances',
      'PhilHealth Registration / Remittances',
      'PAGIBIG Registration / Remittances',
      'DOLE Registration',
      'Payroll Services',
      'Monthly On-Site Check Up',
    ],
    designedFor: [
      'Micro to Small Businesses',
      'Non-VAT Entities',
      'Available for Sole Proprietorships and Corporations',
      'Available in Cebu City, Talisay City, Mandaue City, and Lapu-Lapu City',
    ],
    freebies: SHARED_FREEBIES,
    highlights: [
      'Complete statutory compliance',
      'Multi-city coverage',
      'Best value for SMEs',
    ],
  },
  'essentials-vat': {
    id: 'essentials-vat',
    name: 'Agila Essentials Plan - VAT',
    displayName: 'Essentials (VAT)',
    price: '4,500',
    currency: '₱',
    period: 'month',
    description: 'Compliance made simple, friendly, and stress-free for micro and newly registered businesses.',
    icon: React.createElement(TrendingUp, { className: 'w-5 h-5' }),
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    badge: 'Best for New Micro to Small Businesses',
    badgeColor: 'bg-emerald-100 text-emerald-700',
    featuresIncluded: [
      'DTI / SEC Registration',
      'Mayor\'s Permit Processing',
      'BIR Business Registration',
      'BIR Compliance Filing Services',
      'Annual Mayor\'s Permit Renewal',
      'Annual Income Tax Return',
    ],
    featuresNotIncluded: [
      'SSS Registration / Remittances',
      'PhilHealth Registration / Remittances',
      'PAGIBIG Registration / Remittances',
      'DOLE Registration',
      'Payroll Services',
      'Monthly On-Site Check Up',
    ],
    designedFor: [
      'Micro to Small Businesses',
      'VAT Entities',
      'Available for Sole Proprietorships and Corporations',
      'Available in Cebu City, Talisay City, Mandaue City, and Lapu-Lapu City',
    ],
    freebies: SHARED_FREEBIES,
    highlights: [
      'VAT compliance included',
      'Full tax filing coverage',
      'Scalable for growth',
    ],
  },
  'agila360-non-vat': {
    id: 'agila360-non-vat',
    name: 'Agila360 Plan - Non-VAT',
    displayName: 'Agila360 (Non-VAT)',
    price: '5,000',
    currency: '₱',
    period: 'month',
    description: 'Compliance made simple, friendly, and stress-free for small to medium businesses.',
    icon: React.createElement(Sparkles, { className: 'w-5 h-5' }),
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: 'Best for Small to Medium Businesses',
    badgeColor: 'bg-purple-100 text-purple-700',
    featuresIncluded: [
      'DTI / SEC Registration',
      'Mayor\'s Permit Processing',
      'BIR Business Registration',
      'BIR Compliance Filing Services',
      'Annual Mayor\'s Permit Renewal',
      'Annual Income Tax Return',
    ],
    featuresNotIncluded: [],
    featuresMore: [
      'SSS Registration / Remittances',
      'PhilHealth Registration / Remittances',
      'PAGIBIG Registration / Remittances',
      'DOLE Registration',
      'Payroll Services',
      'Monthly On-Site Check Up',
    ],
    designedFor: [
      'Micro to Small Businesses',
      'Non-VAT Entities',
      'Available for Sole Proprietorships and Corporations',
      'Available in Cebu City, Talisay City, Mandaue City, and Lapu-Lapu City',
    ],
    freebies: SHARED_FREEBIES,
    highlights: [
      'Complete business automation',
      'Full HR & payroll covered',
      'On-site support included',
    ],
  },
  'agila360-vat': {
    id: 'agila360-vat',
    name: 'Agila360 Plan - VAT',
    displayName: 'Agila360 (VAT)',
    price: '6,500',
    currency: '₱',
    period: 'month',
    description: 'Compliance made simple, friendly, and stress-free for small to medium businesses.',
    icon: React.createElement(Sparkles, { className: 'w-5 h-5' }),
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    badge: 'MOST COMPLETE',
    badgeColor: 'bg-purple-100 text-purple-700',
    featuresIncluded: [
      'DTI / SEC Registration',
      'Mayor\'s Permit Processing',
      'BIR Business Registration',
      'BIR Compliance Filing Services',
      'Annual Mayor\'s Permit Renewal',
      'Annual Income Tax Return',
    ],
    featuresNotIncluded: [],
    featuresMore: [
      'SSS Registration / Remittances',
      'PhilHealth Registration / Remittances',
      'PAGIBIG Registration / Remittances',
      'DOLE Registration',
      'Payroll Services',
      'Monthly On-Site Check Up',
    ],
    designedFor: [
      'Micro to Small Businesses',
      'Non-VAT Entities',
      'Available for Sole Proprietorships and Corporations',
      'Available in Cebu City, Talisay City, Mandaue City, and Lapu-Lapu City',
    ],
    freebies: SHARED_FREEBIES,
    highlights: [
      'Complete VAT compliance',
      'Full business automation',
      'Priority support 24/7',
    ],
  },
  'vip': {
    id: 'vip',
    name: 'Agila VIP Plan',
    displayName: 'VIP',
    price: '15,000',
    currency: '₱',
    period: 'month',
    description: 'Liaison, Bookkeeping Human Resource, and Marketing ALL IN ONE PLATFORM',
    icon: React.createElement(Crown, { className: 'w-5 h-5' }),
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    badge: 'ENTERPRISE',
    badgeColor: 'bg-amber-100 text-amber-700',
    featuresIncluded: [
      'Everything in Agila360',
      'Unlimited Users',
      'Dedicated Account Manager',
      '24/7 Priority Support',
      'Custom Features & Integrations',
      'White-label Options',
    ],
    featuresMore: [
      'Multi-branch Management',
      'Weekly On-Site Consultation',
      'Dedicated Development Team',
      'Custom Reporting Dashboard',
      'API Access for Integrations',
      'Advanced Security Features',
    ],
    featuresNotIncluded: [],
    designedFor: [
      'Large enterprises',
      '50+ employees',
      'Multi-location businesses',
      'Need custom solutions',
      'High-volume transactions',
    ],
    freebies: [
      ...SHARED_FREEBIES,
      'Free Custom System Development',
      'Free Annual Strategic Planning',
      'Free Executive Training Programs',
      'VIP Client Portal Access',
      'Free Industry Compliance Updates',
    ],
    highlights: [
      'Fully customizable platform',
      'Dedicated support team',
      'Enterprise-grade security',
    ],
  },
};

/**
 * MOCK SERVICE DATA
 * 64 predefined services for Philippine tax management.
 * BACKEND HOOK: Replace with GET /api/services
 */
export const MOCK_SERVICES: ServiceItem[] = [
  // ── BIR Services ──────────────────────────────────────────
  { id: 'svc-01', name: 'BIR Registration (New Business)', teamInCharge: 'Liaison', government: 'BIR', rate: 5000 },
  { id: 'svc-02', name: 'BIR Registration Update (0605)', teamInCharge: 'Liaison', government: 'BIR', rate: 3000 },
  { id: 'svc-03', name: 'Annual Registration Fee (0605)', teamInCharge: 'Compliance', government: 'BIR', rate: 1500 },
  { id: 'svc-04', name: 'TIN Application', teamInCharge: 'Liaison', government: 'BIR', rate: 2000 },
  { id: 'svc-05', name: 'Books of Account Registration', teamInCharge: 'Liaison', government: 'BIR', rate: 2500 },
  { id: 'svc-06', name: 'Authority to Print (ATP)', teamInCharge: 'Liaison', government: 'BIR', rate: 2000 },
  { id: 'svc-07', name: 'Loose Leaf Registration', teamInCharge: 'Liaison', government: 'BIR', rate: 2000 },
  { id: 'svc-08', name: 'CAS/POS Permit to Use', teamInCharge: 'Liaison', government: 'BIR', rate: 3500 },
  { id: 'svc-09', name: 'Monthly VAT Filing (2550M)', teamInCharge: 'Compliance', government: 'BIR', rate: 3000 },
  { id: 'svc-10', name: 'Quarterly VAT Filing (2550Q)', teamInCharge: 'Compliance', government: 'BIR', rate: 4000 },
  { id: 'svc-11', name: 'Monthly Percentage Tax (2551M)', teamInCharge: 'Compliance', government: 'BIR', rate: 2500 },
  { id: 'svc-12', name: 'Annual ITR Filing (1701)', teamInCharge: 'Compliance', government: 'BIR', rate: 8000 },
  { id: 'svc-13', name: 'Annual ITR Filing (1702)', teamInCharge: 'Compliance', government: 'BIR', rate: 10000 },
  { id: 'svc-14', name: 'Quarterly ITR Filing (1701Q)', teamInCharge: 'Compliance', government: 'BIR', rate: 5000 },
  { id: 'svc-15', name: 'Quarterly ITR Filing (1702Q)', teamInCharge: 'Compliance', government: 'BIR', rate: 6000 },
  { id: 'svc-16', name: 'Monthly Withholding Tax (0619E)', teamInCharge: 'Compliance', government: 'BIR', rate: 3000 },
  { id: 'svc-17', name: 'Annual Withholding Tax (1604E)', teamInCharge: 'Compliance', government: 'BIR', rate: 5000 },
  { id: 'svc-18', name: 'Withholding Tax on Compensation (1601C)', teamInCharge: 'Compliance', government: 'BIR', rate: 3000 },
  { id: 'svc-19', name: 'Annual Alpha List Preparation', teamInCharge: 'Compliance', government: 'BIR', rate: 5000 },
  { id: 'svc-20', name: 'BIR Tax Clearance', teamInCharge: 'Liaison', government: 'BIR', rate: 4000 },
  { id: 'svc-21', name: 'SLSP Filing', teamInCharge: 'Compliance', government: 'BIR', rate: 3500 },
  { id: 'svc-22', name: 'BIR Certificate of Registration (COR) Update', teamInCharge: 'Liaison', government: 'BIR', rate: 2500 },

  // ── SEC Services ──────────────────────────────────────────
  { id: 'svc-23', name: 'SEC Registration (Corporation)', teamInCharge: 'Liaison', government: 'SEC', rate: 15000 },
  { id: 'svc-24', name: 'SEC Registration (Partnership)', teamInCharge: 'Liaison', government: 'SEC', rate: 12000 },
  { id: 'svc-25', name: 'SEC Registration (OPC)', teamInCharge: 'Liaison', government: 'SEC', rate: 10000 },
  { id: 'svc-26', name: 'SEC Annual Report (GIS)', teamInCharge: 'Compliance', government: 'SEC', rate: 5000 },
  { id: 'svc-27', name: 'SEC Annual Financial Statements (AFS)', teamInCharge: 'Accounting', government: 'SEC', rate: 8000 },
  { id: 'svc-28', name: 'SEC Amendment of Articles', teamInCharge: 'Liaison', government: 'SEC', rate: 8000 },
  { id: 'svc-29', name: 'SEC Compliance Certificate', teamInCharge: 'Compliance', government: 'SEC', rate: 4000 },
  { id: 'svc-30', name: 'SEC Name Reservation', teamInCharge: 'Liaison', government: 'SEC', rate: 1500 },

  // ── DTI Services ──────────────────────────────────────────
  { id: 'svc-31', name: 'DTI Business Name Registration', teamInCharge: 'Liaison', government: 'DTI', rate: 3000 },
  { id: 'svc-32', name: 'DTI Registration Renewal', teamInCharge: 'Liaison', government: 'DTI', rate: 2000 },

  // ── LGU/Permits Services ─────────────────────────────────
  { id: 'svc-33', name: 'Business Permit - New Application', teamInCharge: 'Liaison', government: 'LGU', rate: 8000 },
  { id: 'svc-34', name: 'Business Permit - Renewal', teamInCharge: 'Liaison', government: 'LGU', rate: 5000 },
  { id: 'svc-35', name: 'Barangay Business Clearance', teamInCharge: 'Liaison', government: 'LGU', rate: 2000 },
  { id: 'svc-36', name: 'Fire Safety Inspection Certificate', teamInCharge: 'Liaison', government: 'BFP', rate: 3000 },
  { id: 'svc-37', name: 'Sanitary Permit', teamInCharge: 'Liaison', government: 'LGU', rate: 2000 },
  { id: 'svc-38', name: 'Zoning Clearance', teamInCharge: 'Liaison', government: 'LGU', rate: 2500 },
  { id: 'svc-39', name: 'Occupancy Permit', teamInCharge: 'Liaison', government: 'LGU', rate: 4000 },

  // ── SSS / PhilHealth / Pag-IBIG ───────────────────────────
  { id: 'svc-40', name: 'SSS Employer Registration', teamInCharge: 'Liaison', government: 'SSS', rate: 3000 },
  { id: 'svc-41', name: 'SSS Monthly Contributions Filing', teamInCharge: 'Compliance', government: 'SSS', rate: 2000 },
  { id: 'svc-42', name: 'PhilHealth Employer Registration', teamInCharge: 'Liaison', government: 'PhilHealth', rate: 3000 },
  { id: 'svc-43', name: 'PhilHealth Monthly Contributions Filing', teamInCharge: 'Compliance', government: 'PhilHealth', rate: 2000 },
  { id: 'svc-44', name: 'Pag-IBIG Employer Registration', teamInCharge: 'Liaison', government: 'Pag-IBIG', rate: 3000 },
  { id: 'svc-45', name: 'Pag-IBIG Monthly Contributions Filing', teamInCharge: 'Compliance', government: 'Pag-IBIG', rate: 2000 },

  // ── Accounting / Bookkeeping ──────────────────────────────
  { id: 'svc-46', name: 'Monthly Bookkeeping', teamInCharge: 'Accounting', government: 'N/A', rate: 5000 },
  { id: 'svc-47', name: 'Financial Statement Preparation', teamInCharge: 'Accounting', government: 'N/A', rate: 10000 },
  { id: 'svc-48', name: 'Trial Balance Preparation', teamInCharge: 'Accounting', government: 'N/A', rate: 4000 },
  { id: 'svc-49', name: 'Bank Reconciliation', teamInCharge: 'Accounting', government: 'N/A', rate: 3000 },
  { id: 'svc-50', name: 'Payroll Processing', teamInCharge: 'Accounting', government: 'N/A', rate: 5000 },
  { id: 'svc-51', name: 'Payroll Tax Compliance', teamInCharge: 'Compliance', government: 'BIR', rate: 4000 },
  { id: 'svc-52', name: 'Chart of Accounts Setup', teamInCharge: 'Accounting', government: 'N/A', rate: 3000 },
  { id: 'svc-53', name: 'Accounts Receivable Management', teamInCharge: 'Accounting', government: 'N/A', rate: 3500 },
  { id: 'svc-54', name: 'Accounts Payable Management', teamInCharge: 'Accounting', government: 'N/A', rate: 3500 },

  // ── Special / Consulting ──────────────────────────────────
  { id: 'svc-55', name: 'PEZA Registration', teamInCharge: 'Liaison', government: 'PEZA', rate: 25000 },
  { id: 'svc-56', name: 'BOI Registration', teamInCharge: 'Liaison', government: 'BOI', rate: 20000 },
  { id: 'svc-57', name: 'Import/Export License Application', teamInCharge: 'Liaison', government: 'BOC', rate: 15000 },
  { id: 'svc-58', name: 'DOLE Compliance Reporting', teamInCharge: 'Compliance', government: 'DOLE', rate: 4000 },
  { id: 'svc-59', name: 'Tax Consultation (Per Session)', teamInCharge: 'Accounting', government: 'N/A', rate: 5000 },
  { id: 'svc-60', name: 'Tax Audit Assistance', teamInCharge: 'Accounting', government: 'BIR', rate: 15000 },
  { id: 'svc-61', name: 'Business Closure Processing', teamInCharge: 'Liaison', government: 'BIR', rate: 10000 },
  { id: 'svc-62', name: 'Change of Business Address', teamInCharge: 'Liaison', government: 'BIR', rate: 4000 },
  { id: 'svc-63', name: 'Change of Business Name', teamInCharge: 'Liaison', government: 'DTI', rate: 3500 },
  { id: 'svc-64', name: 'Annual Compliance Calendar Setup', teamInCharge: 'Compliance', government: 'N/A', rate: 3000 },
];

/**
 * GOVERNMENT AGENCY OPTIONS
 * Used for filter dropdowns and form selects.
 */
export const GOVERNMENT_AGENCIES = [
  'All',
  'BIR',
  'SEC',
  'DTI',
  'LGU',
  'BFP',
  'SSS',
  'PhilHealth',
  'Pag-IBIG',
  'PEZA',
  'BOI',
  'BOC',
  'DOLE',
  'N/A',
] as const;

/**
 * TEAM OPTIONS
 * Used for filter dropdowns and form selects.
 */
export const TEAM_OPTIONS = [
  'All',
  'Liaison',
  'Compliance',
  'Accounting',
] as const;
