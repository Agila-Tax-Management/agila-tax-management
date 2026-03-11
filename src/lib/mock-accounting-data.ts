// ── Accounting Portal Mock Data ────────────────────────────
// Centralized payments, invoices, and billing for all portals.

export interface AccountingTeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
}

export const ACCOUNTING_TEAM: AccountingTeamMember[] = [
  { id: 'acct-1', name: 'Elena Navarro', email: 'elena.n@agilatax.ph', avatar: 'EN', role: 'Lead Accountant' },
  { id: 'acct-2', name: 'Gabriel Flores', email: 'gabriel.f@agilatax.ph', avatar: 'GF', role: 'Billing Specialist' },
  { id: 'acct-3', name: 'Maria Lourdes Tan', email: 'mltan@agilatax.ph', avatar: 'MT', role: 'Junior Accountant' },
];

export const CURRENT_ACCOUNTANT = ACCOUNTING_TEAM[0];

// ── Payment Statuses ────────────────────────────────────────
export type PaymentStatus = 'Pending' | 'Confirmed' | 'Overdue' | 'Partially Paid' | 'Refunded';
export type PaymentMethod = 'Bank Transfer' | 'GCash' | 'Maya' | 'Cash' | 'Check' | 'Credit Card';
export type PaymentSource = 'Sales' | 'Account Officer' | 'Compliance' | 'Liaison' | 'Direct';

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientNo: string;
  description: string;
  amount: number;
  amountPaid: number;
  status: PaymentStatus;
  method: PaymentMethod | null;
  source: PaymentSource;
  dueDate: string;
  paidDate: string | null;
  referenceNo: string | null;
  invoiceId: string;
  notes: string;
  createdAt: string;
}

// ── Invoice Types ───────────────────────────────────────────
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled' | 'Partially Paid';

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNo: string;
  clientId: string;
  clientName: string;
  clientNo: string;
  clientEmail: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  notes: string;
  createdBy: string;
  createdAt: string;
}

// ── Billing Types ───────────────────────────────────────────
export type BillingCycle = 'Monthly' | 'Quarterly' | 'Annually';
export type BillingStatus = 'Active' | 'Overdue' | 'Paused' | 'Cancelled';

export interface BillingRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientNo: string;
  planName: string;
  billingCycle: BillingCycle;
  amount: number;
  nextBillingDate: string;
  lastPaymentDate: string | null;
  status: BillingStatus;
  totalBilled: number;
  totalPaid: number;
  startDate: string;
}

// ── Mock Payments ───────────────────────────────────────────
export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-001',
    clientId: 'client-4',
    clientName: 'Cruz Enterprises Inc.',
    clientNo: '2026-0004',
    description: 'Agila360 (Non-VAT) – Monthly Plan',
    amount: 5000,
    amountPaid: 0,
    status: 'Pending',
    method: null,
    source: 'Sales',
    dueDate: '2026-03-15',
    paidDate: null,
    referenceNo: null,
    invoiceId: 'inv-004',
    notes: 'Transferred from Sales pipeline (Waiting for Payment). New client onboarding.',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'pay-002',
    clientId: 'client-7',
    clientName: 'Santos Food Corporation',
    clientNo: '2026-0007',
    description: 'Essentials (Non-VAT) – Monthly Plan',
    amount: 2500,
    amountPaid: 0,
    status: 'Pending',
    method: null,
    source: 'Sales',
    dueDate: '2026-03-12',
    paidDate: null,
    referenceNo: null,
    invoiceId: 'inv-007',
    notes: 'Transferred from Sales pipeline. Books of Account Registration included.',
    createdAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'pay-003',
    clientId: 'client-10',
    clientName: 'Dimaculangan Import/Export',
    clientNo: '2026-0010',
    description: 'Initial Setup Fee',
    amount: 15000,
    amountPaid: 0,
    status: 'Overdue',
    method: null,
    source: 'Sales',
    dueDate: '2026-03-05',
    paidDate: null,
    referenceNo: null,
    invoiceId: 'inv-010',
    notes: 'Client from Sales pipeline – no plan selected yet. Import/Export license inquiry.',
    createdAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'pay-004',
    clientId: 'client-1',
    clientName: 'Villanueva Trading Co.',
    clientNo: '2026-0001',
    description: 'Essentials (Non-VAT) – March 2026',
    amount: 2500,
    amountPaid: 2500,
    status: 'Confirmed',
    method: 'Bank Transfer',
    source: 'Direct',
    dueDate: '2026-03-01',
    paidDate: '2026-02-28',
    referenceNo: 'BT-2026-0228-001',
    invoiceId: 'inv-001',
    notes: 'Recurring monthly payment. Auto-debit from BDO.',
    createdAt: '2026-02-25T09:00:00Z',
  },
  {
    id: 'pay-005',
    clientId: 'client-2',
    clientName: 'Lim Holdings Corporation',
    clientNo: '2026-0002',
    description: 'Agila360 (VAT) – March 2026 + Upsell Service',
    amount: 11500,
    amountPaid: 11500,
    status: 'Confirmed',
    method: 'GCash',
    source: 'Account Officer',
    dueDate: '2026-03-01',
    paidDate: '2026-03-01',
    referenceNo: 'GC-2026-0301-045',
    invoiceId: 'inv-002',
    notes: 'Monthly plan ₱6,500 + upsell ₱5,000. Confirmed by AO Camille.',
    createdAt: '2026-02-26T14:30:00Z',
  },
  {
    id: 'pay-006',
    clientId: 'client-5',
    clientName: 'Aquino Tech Solutions',
    clientNo: '2026-0005',
    description: 'VIP Plan – March 2026',
    amount: 15000,
    amountPaid: 15000,
    status: 'Confirmed',
    method: 'Bank Transfer',
    source: 'Direct',
    dueDate: '2026-03-01',
    paidDate: '2026-02-27',
    referenceNo: 'BT-2026-0227-003',
    invoiceId: 'inv-005',
    notes: 'VIP client. Auto-debit from Metrobank.',
    createdAt: '2026-02-24T10:00:00Z',
  },
  {
    id: 'pay-007',
    clientId: 'client-3',
    clientName: 'Tan & Associates Law Firm',
    clientNo: '2026-0003',
    description: 'Essentials (VAT) – March 2026',
    amount: 4500,
    amountPaid: 4500,
    status: 'Confirmed',
    method: 'Maya',
    source: 'Direct',
    dueDate: '2026-03-05',
    paidDate: '2026-03-04',
    referenceNo: 'MY-2026-0304-012',
    invoiceId: 'inv-003',
    notes: 'Paid via Maya e-wallet.',
    createdAt: '2026-02-28T11:00:00Z',
  },
  {
    id: 'pay-008',
    clientId: 'client-9',
    clientName: 'Pascual Manufacturing Inc.',
    clientNo: '2026-0009',
    description: 'Agila360 (VAT) – March 2026',
    amount: 6500,
    amountPaid: 3000,
    status: 'Partially Paid',
    method: 'Check',
    source: 'Account Officer',
    dueDate: '2026-03-10',
    paidDate: null,
    referenceNo: 'CHK-2026-0305-001',
    invoiceId: 'inv-009',
    notes: 'Partial payment received via post-dated check. Balance ₱3,500 due March 10.',
    createdAt: '2026-02-27T08:00:00Z',
  },
  {
    id: 'pay-009',
    clientId: 'client-11',
    clientName: 'Garcia Construction Corp.',
    clientNo: '2026-0011',
    description: 'Essentials (VAT) – March 2026 + Annual ITR Filing',
    amount: 12500,
    amountPaid: 12500,
    status: 'Confirmed',
    method: 'Bank Transfer',
    source: 'Compliance',
    dueDate: '2026-03-08',
    paidDate: '2026-03-07',
    referenceNo: 'BT-2026-0307-008',
    invoiceId: 'inv-011',
    notes: 'Monthly ₱4,500 + Annual ITR ₱8,000. Compliance-requested billing.',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'pay-010',
    clientId: 'client-6',
    clientName: 'Reyes Law Office',
    clientNo: '2026-0006',
    description: 'Starter Plan – March 2026',
    amount: 1500,
    amountPaid: 1500,
    status: 'Confirmed',
    method: 'GCash',
    source: 'Direct',
    dueDate: '2026-03-01',
    paidDate: '2026-03-01',
    referenceNo: 'GC-2026-0301-019',
    invoiceId: 'inv-006',
    notes: 'Monthly recurring. Client prefers GCash.',
    createdAt: '2026-02-26T09:00:00Z',
  },
  {
    id: 'pay-011',
    clientId: 'client-8',
    clientName: 'Bautista Retail Shop',
    clientNo: '2026-0008',
    description: 'Starter Plan – March 2026',
    amount: 1500,
    amountPaid: 1500,
    status: 'Confirmed',
    method: 'Cash',
    source: 'Liaison',
    dueDate: '2026-03-05',
    paidDate: '2026-03-03',
    referenceNo: 'CASH-2026-0303-002',
    invoiceId: 'inv-008',
    notes: 'Paid cash upon liaison visit. Received by Bianca Torres.',
    createdAt: '2026-02-28T13:00:00Z',
  },
  {
    id: 'pay-012',
    clientId: 'client-12',
    clientName: 'Mendoza Digital Agency',
    clientNo: '2026-0012',
    description: 'Starter Plan – March 2026 + Annual Registration Fee',
    amount: 3000,
    amountPaid: 0,
    status: 'Pending',
    method: null,
    source: 'Compliance',
    dueDate: '2026-03-15',
    paidDate: null,
    referenceNo: null,
    invoiceId: 'inv-012',
    notes: 'Monthly ₱1,500 + Annual Reg Fee ₱1,500. Compliance-initiated billing.',
    createdAt: '2026-03-05T09:00:00Z',
  },
];

// ── Mock Invoices ───────────────────────────────────────────
export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-001',
    invoiceNo: 'INV-2026-0001',
    clientId: 'client-1',
    clientName: 'Villanueva Trading Co.',
    clientNo: '2026-0001',
    clientEmail: 'roberto.v@villanuevatrading.ph',
    status: 'Paid',
    issueDate: '2026-02-25',
    dueDate: '2026-03-01',
    lineItems: [
      { id: 'li-1', description: 'Essentials (Non-VAT) – Monthly Plan', quantity: 1, rate: 2500, amount: 2500 },
    ],
    subtotal: 2500,
    tax: 0,
    total: 2500,
    amountPaid: 2500,
    notes: 'Recurring monthly service plan.',
    createdBy: 'acct-1',
    createdAt: '2026-02-25T09:00:00Z',
  },
  {
    id: 'inv-002',
    invoiceNo: 'INV-2026-0002',
    clientId: 'client-2',
    clientName: 'Lim Holdings Corporation',
    clientNo: '2026-0002',
    clientEmail: 'patricia.lim@limholdings.ph',
    status: 'Paid',
    issueDate: '2026-02-26',
    dueDate: '2026-03-01',
    lineItems: [
      { id: 'li-2', description: 'Agila360 (VAT) – Monthly Plan', quantity: 1, rate: 6500, amount: 6500 },
      { id: 'li-3', description: 'Upsell – Additional Services', quantity: 1, rate: 5000, amount: 5000 },
    ],
    subtotal: 11500,
    tax: 0,
    total: 11500,
    amountPaid: 11500,
    notes: 'Includes upsell services.',
    createdBy: 'acct-2',
    createdAt: '2026-02-26T14:30:00Z',
  },
  {
    id: 'inv-003',
    invoiceNo: 'INV-2026-0003',
    clientId: 'client-3',
    clientName: 'Tan & Associates Law Firm',
    clientNo: '2026-0003',
    clientEmail: 'marco.tan@tanlaw.ph',
    status: 'Paid',
    issueDate: '2026-02-28',
    dueDate: '2026-03-05',
    lineItems: [
      { id: 'li-4', description: 'Essentials (VAT) – Monthly Plan', quantity: 1, rate: 4500, amount: 4500 },
    ],
    subtotal: 4500,
    tax: 0,
    total: 4500,
    amountPaid: 4500,
    notes: '',
    createdBy: 'acct-1',
    createdAt: '2026-02-28T11:00:00Z',
  },
  {
    id: 'inv-004',
    invoiceNo: 'INV-2026-0004',
    clientId: 'client-4',
    clientName: 'Cruz Enterprises Inc.',
    clientNo: '2026-0004',
    clientEmail: 'isabella.cruz@cruzenterprises.ph',
    status: 'Sent',
    issueDate: '2026-03-01',
    dueDate: '2026-03-15',
    lineItems: [
      { id: 'li-5', description: 'Agila360 (Non-VAT) – Monthly Plan', quantity: 1, rate: 5000, amount: 5000 },
    ],
    subtotal: 5000,
    tax: 0,
    total: 5000,
    amountPaid: 0,
    notes: 'New client from Sales pipeline.',
    createdBy: 'acct-2',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'inv-005',
    invoiceNo: 'INV-2026-0005',
    clientId: 'client-5',
    clientName: 'Aquino Tech Solutions',
    clientNo: '2026-0005',
    clientEmail: 'diego.aquino@aquinotech.ph',
    status: 'Paid',
    issueDate: '2026-02-24',
    dueDate: '2026-03-01',
    lineItems: [
      { id: 'li-6', description: 'VIP Plan – Monthly Service', quantity: 1, rate: 15000, amount: 15000 },
    ],
    subtotal: 15000,
    tax: 0,
    total: 15000,
    amountPaid: 15000,
    notes: 'VIP tier premium client.',
    createdBy: 'acct-1',
    createdAt: '2026-02-24T10:00:00Z',
  },
  {
    id: 'inv-006',
    invoiceNo: 'INV-2026-0006',
    clientId: 'client-6',
    clientName: 'Reyes Law Office',
    clientNo: '2026-0006',
    clientEmail: 'carmen.reyes@reyeslaw.ph',
    status: 'Paid',
    issueDate: '2026-02-26',
    dueDate: '2026-03-01',
    lineItems: [
      { id: 'li-7', description: 'Starter Plan – Monthly Service', quantity: 1, rate: 1500, amount: 1500 },
    ],
    subtotal: 1500,
    tax: 0,
    total: 1500,
    amountPaid: 1500,
    notes: '',
    createdBy: 'acct-3',
    createdAt: '2026-02-26T09:00:00Z',
  },
  {
    id: 'inv-007',
    invoiceNo: 'INV-2026-0007',
    clientId: 'client-7',
    clientName: 'Santos Food Corporation',
    clientNo: '2026-0007',
    clientEmail: 'angelo.santos@santosfood.ph',
    status: 'Sent',
    issueDate: '2026-02-28',
    dueDate: '2026-03-12',
    lineItems: [
      { id: 'li-8', description: 'Essentials (Non-VAT) – Monthly Plan', quantity: 1, rate: 2500, amount: 2500 },
    ],
    subtotal: 2500,
    tax: 0,
    total: 2500,
    amountPaid: 0,
    notes: 'New client – Books of Account Registration included in plan.',
    createdBy: 'acct-2',
    createdAt: '2026-02-28T10:00:00Z',
  },
  {
    id: 'inv-008',
    invoiceNo: 'INV-2026-0008',
    clientId: 'client-8',
    clientName: 'Bautista Retail Shop',
    clientNo: '2026-0008',
    clientEmail: 'sofia.b@bautistaretail.ph',
    status: 'Paid',
    issueDate: '2026-02-28',
    dueDate: '2026-03-05',
    lineItems: [
      { id: 'li-9', description: 'Starter Plan – Monthly Service', quantity: 1, rate: 1500, amount: 1500 },
    ],
    subtotal: 1500,
    tax: 0,
    total: 1500,
    amountPaid: 1500,
    notes: 'Cash payment collected on-site.',
    createdBy: 'acct-3',
    createdAt: '2026-02-28T13:00:00Z',
  },
  {
    id: 'inv-009',
    invoiceNo: 'INV-2026-0009',
    clientId: 'client-9',
    clientName: 'Pascual Manufacturing Inc.',
    clientNo: '2026-0009',
    clientEmail: 'enrique.p@pascualmfg.ph',
    status: 'Partially Paid',
    issueDate: '2026-02-27',
    dueDate: '2026-03-10',
    lineItems: [
      { id: 'li-10', description: 'Agila360 (VAT) – Monthly Plan', quantity: 1, rate: 6500, amount: 6500 },
    ],
    subtotal: 6500,
    tax: 0,
    total: 6500,
    amountPaid: 3000,
    notes: 'Post-dated check received. Balance due March 10.',
    createdBy: 'acct-1',
    createdAt: '2026-02-27T08:00:00Z',
  },
  {
    id: 'inv-010',
    invoiceNo: 'INV-2026-0010',
    clientId: 'client-10',
    clientName: 'Dimaculangan Import/Export',
    clientNo: '2026-0010',
    clientEmail: 'lucia.d@dimaculangan.ph',
    status: 'Overdue',
    issueDate: '2026-03-01',
    dueDate: '2026-03-05',
    lineItems: [
      { id: 'li-11', description: 'Import/Export License Application', quantity: 1, rate: 15000, amount: 15000 },
    ],
    subtotal: 15000,
    tax: 0,
    total: 15000,
    amountPaid: 0,
    notes: 'One-time service engagement. Payment overdue.',
    createdBy: 'acct-2',
    createdAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'inv-011',
    invoiceNo: 'INV-2026-0011',
    clientId: 'client-11',
    clientName: 'Garcia Construction Corp.',
    clientNo: '2026-0011',
    clientEmail: 'carlos.jr@garciaconstruction.ph',
    status: 'Paid',
    issueDate: '2026-03-01',
    dueDate: '2026-03-08',
    lineItems: [
      { id: 'li-12', description: 'Essentials (VAT) – Monthly Plan', quantity: 1, rate: 4500, amount: 4500 },
      { id: 'li-13', description: 'Annual ITR Filing (1701)', quantity: 1, rate: 8000, amount: 8000 },
    ],
    subtotal: 12500,
    tax: 0,
    total: 12500,
    amountPaid: 12500,
    notes: 'Compliance-initiated billing for ITR filing.',
    createdBy: 'acct-1',
    createdAt: '2026-03-01T08:00:00Z',
  },
  {
    id: 'inv-012',
    invoiceNo: 'INV-2026-0012',
    clientId: 'client-12',
    clientName: 'Mendoza Digital Agency',
    clientNo: '2026-0012',
    clientEmail: 'rafael.m@mendozadigital.ph',
    status: 'Sent',
    issueDate: '2026-03-05',
    dueDate: '2026-03-15',
    lineItems: [
      { id: 'li-14', description: 'Starter Plan – Monthly Service', quantity: 1, rate: 1500, amount: 1500 },
      { id: 'li-15', description: 'Annual Registration Fee (0605)', quantity: 1, rate: 1500, amount: 1500 },
    ],
    subtotal: 3000,
    tax: 0,
    total: 3000,
    amountPaid: 0,
    notes: 'Compliance-initiated billing for annual registration.',
    createdBy: 'acct-3',
    createdAt: '2026-03-05T09:00:00Z',
  },
];

// ── Mock Billing Records ────────────────────────────────────
export const INITIAL_BILLING: BillingRecord[] = [
  { id: 'bill-001', clientId: 'client-1', clientName: 'Villanueva Trading Co.',      clientNo: '2026-0001', planName: 'Essentials (Non-VAT)', billingCycle: 'Monthly', amount: 2500,  nextBillingDate: '2026-04-01', lastPaymentDate: '2026-02-28', status: 'Active',  totalBilled: 12500, totalPaid: 12500, startDate: '2025-10-15' },
  { id: 'bill-002', clientId: 'client-2', clientName: 'Lim Holdings Corporation',    clientNo: '2026-0002', planName: 'Agila360 (VAT)',        billingCycle: 'Monthly', amount: 6500,  nextBillingDate: '2026-04-01', lastPaymentDate: '2026-03-01', status: 'Active',  totalBilled: 45500, totalPaid: 45500, startDate: '2025-08-22' },
  { id: 'bill-003', clientId: 'client-3', clientName: 'Tan & Associates Law Firm',   clientNo: '2026-0003', planName: 'Essentials (VAT)',       billingCycle: 'Monthly', amount: 4500,  nextBillingDate: '2026-04-05', lastPaymentDate: '2026-03-04', status: 'Active',  totalBilled: 18000, totalPaid: 18000, startDate: '2025-11-05' },
  { id: 'bill-004', clientId: 'client-4', clientName: 'Cruz Enterprises Inc.',       clientNo: '2026-0004', planName: 'Agila360 (Non-VAT)',     billingCycle: 'Monthly', amount: 5000,  nextBillingDate: '2026-03-15', lastPaymentDate: null,         status: 'Active',  totalBilled: 5000,  totalPaid: 0,     startDate: '2026-01-10' },
  { id: 'bill-005', clientId: 'client-5', clientName: 'Aquino Tech Solutions',        clientNo: '2026-0005', planName: 'VIP',                    billingCycle: 'Monthly', amount: 15000, nextBillingDate: '2026-04-01', lastPaymentDate: '2026-02-27', status: 'Active',  totalBilled: 135000, totalPaid: 135000, startDate: '2025-06-01' },
  { id: 'bill-006', clientId: 'client-6', clientName: 'Reyes Law Office',            clientNo: '2026-0006', planName: 'Starter',                billingCycle: 'Monthly', amount: 1500,  nextBillingDate: '2026-04-01', lastPaymentDate: '2026-03-01', status: 'Active',  totalBilled: 4500,  totalPaid: 4500,  startDate: '2025-12-20' },
  { id: 'bill-007', clientId: 'client-7', clientName: 'Santos Food Corporation',     clientNo: '2026-0007', planName: 'Essentials (Non-VAT)',   billingCycle: 'Monthly', amount: 2500,  nextBillingDate: '2026-03-12', lastPaymentDate: null,         status: 'Active',  totalBilled: 2500,  totalPaid: 0,     startDate: '2026-02-01' },
  { id: 'bill-008', clientId: 'client-8', clientName: 'Bautista Retail Shop',        clientNo: '2026-0008', planName: 'Starter',                billingCycle: 'Monthly', amount: 1500,  nextBillingDate: '2026-04-05', lastPaymentDate: '2026-03-03', status: 'Active',  totalBilled: 9000,  totalPaid: 9000,  startDate: '2025-09-15' },
  { id: 'bill-009', clientId: 'client-9', clientName: 'Pascual Manufacturing Inc.',  clientNo: '2026-0009', planName: 'Agila360 (VAT)',         billingCycle: 'Monthly', amount: 6500,  nextBillingDate: '2026-03-10', lastPaymentDate: null,         status: 'Overdue', totalBilled: 52000, totalPaid: 48500, startDate: '2025-07-10' },
  { id: 'bill-010', clientId: 'client-10', clientName: 'Dimaculangan Import/Export', clientNo: '2026-0010', planName: '—',                      billingCycle: 'Monthly', amount: 0,     nextBillingDate: '—',          lastPaymentDate: null,         status: 'Paused', totalBilled: 15000, totalPaid: 0,     startDate: '2026-03-01' },
  { id: 'bill-011', clientId: 'client-11', clientName: 'Garcia Construction Corp.',  clientNo: '2026-0011', planName: 'Essentials (VAT)',       billingCycle: 'Monthly', amount: 4500,  nextBillingDate: '2026-04-08', lastPaymentDate: '2026-03-07', status: 'Active',  totalBilled: 45000, totalPaid: 45000, startDate: '2025-05-18' },
  { id: 'bill-012', clientId: 'client-12', clientName: 'Mendoza Digital Agency',     clientNo: '2026-0012', planName: 'Starter',                billingCycle: 'Monthly', amount: 1500,  nextBillingDate: '2026-03-15', lastPaymentDate: null,         status: 'Active',  totalBilled: 6000,  totalPaid: 4500,  startDate: '2025-11-25' },
];
