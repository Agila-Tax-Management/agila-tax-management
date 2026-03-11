// ── Mock Compliance Data ─────────────────────────────────
// Frontend-only mock data for the Compliance portal.
// Will be replaced by API calls when the backend is ready.

import { INITIAL_CLIENTS } from './mock-clients';

// ── Types (local to mock) ─────────────────────────────────
export interface MockComplianceStatus {
  bir: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  sec: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  mayorsPermit: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  dti: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  birDeadline?: string;
  secDeadline?: string;
  mayorsPermitDeadline?: string;
  dtiDeadline?: string;
}

export interface MockClientWithCompliance {
  id: string;
  clientNo: string;
  businessName: string;
  authorizedRep: string;
  email: string;
  phone: string;
  tin: string;
  businessAddress: string;
  isBusinessRegistered: boolean;
  isPaid: boolean;
  planDetails: any;
  finalAmount: number;
  createdAt: string;
  status: string;
  complianceStatus: MockComplianceStatus;
  lastAudit: string;
  nextDeadline: string;
}

export interface MockStoredCase {
  id: string;
  agency: string;
  type: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'In Progress' | 'Pending Client' | 'Action Required' | 'Resolved';
  assignedTo: string;
  notes: string;
  createdAt: string;
  dueDate?: string;
}

export interface MockAgent {
  id: string;
  name: string;
  role: string;
}

// ── Compliance Agents ─────────────────────────────────────
export const COMPLIANCE_AGENTS: MockAgent[] = [
  { id: 'comp-1', name: 'Maria Santos', role: 'Compliance Manager' },
  { id: 'comp-2', name: 'Juan Dela Cruz', role: 'Compliance Specialist' },
  { id: 'comp-3', name: 'Ana Reyes', role: 'Compliance Officer' },
  { id: 'comp-4', name: 'Carlos Mendoza', role: 'Liaison Officer' },
];

// ── Per-client compliance statuses ────────────────────────
const COMPLIANCE_MAP: Record<string, MockComplianceStatus> = {
  'client-1': {
    bir: 'COMPLIANT',
    sec: 'PENDING',
    mayorsPermit: 'COMPLIANT',
    dti: 'COMPLIANT',
    birDeadline: '2026-04-15',
    secDeadline: '2026-04-30',
    mayorsPermitDeadline: '2027-01-15',
    dtiDeadline: '2027-06-20',
  },
  'client-2': {
    bir: 'COMPLIANT',
    sec: 'COMPLIANT',
    mayorsPermit: 'COMPLIANT',
    dti: 'COMPLIANT',
    birDeadline: '2026-04-15',
    secDeadline: '2026-05-15',
    mayorsPermitDeadline: '2027-01-15',
    dtiDeadline: '2027-06-20',
  },
  'client-3': {
    bir: 'OVERDUE',
    sec: 'COMPLIANT',
    mayorsPermit: 'PENDING',
    dti: 'COMPLIANT',
    birDeadline: '2026-02-28',
    secDeadline: '2026-06-30',
    mayorsPermitDeadline: '2026-03-31',
    dtiDeadline: '2027-01-10',
  },
  'client-4': {
    bir: 'PENDING',
    sec: 'PENDING',
    mayorsPermit: 'PENDING',
    dti: 'PENDING',
    birDeadline: '2026-04-15',
    secDeadline: '2026-05-01',
    mayorsPermitDeadline: '2026-04-30',
    dtiDeadline: '2026-04-30',
  },
  'client-5': {
    bir: 'COMPLIANT',
    sec: 'COMPLIANT',
    mayorsPermit: 'OVERDUE',
    dti: 'COMPLIANT',
    birDeadline: '2026-04-15',
    secDeadline: '2026-07-15',
    mayorsPermitDeadline: '2026-01-31',
    dtiDeadline: '2027-03-15',
  },
  'client-6': {
    bir: 'OVERDUE',
    sec: 'OVERDUE',
    mayorsPermit: 'PENDING',
    dti: 'COMPLIANT',
    birDeadline: '2026-01-15',
    secDeadline: '2026-02-15',
    mayorsPermitDeadline: '2026-04-15',
    dtiDeadline: '2026-12-31',
  },
  'client-7': {
    bir: 'COMPLIANT',
    sec: 'COMPLIANT',
    mayorsPermit: 'COMPLIANT',
    dti: 'COMPLIANT',
    birDeadline: '2026-04-15',
    secDeadline: '2026-09-30',
    mayorsPermitDeadline: '2027-01-15',
    dtiDeadline: '2027-06-20',
  },
  'client-8': {
    bir: 'PENDING',
    sec: 'COMPLIANT',
    mayorsPermit: 'COMPLIANT',
    dti: 'OVERDUE',
    birDeadline: '2026-03-25',
    secDeadline: '2026-08-15',
    mayorsPermitDeadline: '2027-01-15',
    dtiDeadline: '2026-02-10',
  },
};

// ── TIN & Address enrichment (simulated) ──────────────────
const EXTRA_INFO: Record<string, { tin: string; businessAddress: string }> = {
  'client-1': { tin: '123-456-789-000', businessAddress: '123 Rizal Ave, Makati City' },
  'client-2': { tin: '234-567-890-001', businessAddress: '456 Ayala Blvd, Taguig City' },
  'client-3': { tin: '345-678-901-002', businessAddress: '789 EDSA, Quezon City' },
  'client-4': { tin: '456-789-012-003', businessAddress: '321 Shaw Blvd, Mandaluyong City' },
  'client-5': { tin: '567-890-123-004', businessAddress: '555 Ortigas Ave, Pasig City' },
  'client-6': { tin: '678-901-234-005', businessAddress: '100 Roxas Blvd, Manila' },
  'client-7': { tin: '789-012-345-006', businessAddress: '88 Jupiter St, Makati City' },
  'client-8': { tin: '890-123-456-007', businessAddress: '77 McKinley Pkwy, Taguig City' },
};

// ── Build enriched client list ────────────────────────────
export const MOCK_COMPLIANCE_CLIENTS: MockClientWithCompliance[] = INITIAL_CLIENTS
  .filter(c => COMPLIANCE_MAP[c.id])
  .map(c => ({
    id: c.id,
    clientNo: c.clientNo,
    businessName: c.businessName,
    authorizedRep: c.authorizedRep,
    email: c.email,
    phone: c.phone,
    tin: EXTRA_INFO[c.id]?.tin ?? '—',
    businessAddress: EXTRA_INFO[c.id]?.businessAddress ?? '—',
    isBusinessRegistered: true,
    isPaid: c.isPaid,
    planDetails: c.planDetails,
    finalAmount: c.finalAmount,
    createdAt: c.createdAt,
    status: c.status ?? 'Active',
    complianceStatus: COMPLIANCE_MAP[c.id],
    lastAudit: '2026-03-01T10:00:00Z',
    nextDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
  }));

// ── Manual Open Cases ─────────────────────────────────────
export const MOCK_STORED_CASES: Record<string, MockStoredCase[]> = {
  'client-3': [
    {
      id: 'C-2026-0003-A1',
      agency: 'BIR',
      type: 'BIR Late Filing Penalty',
      priority: 'HIGH',
      status: 'In Progress',
      assignedTo: 'Maria Santos',
      notes: 'Client missed the Feb 28 deadline. Penalty computation in progress.',
      createdAt: '2026-03-02T09:00:00Z',
      dueDate: '2026-03-20',
    },
  ],
  'client-5': [
    {
      id: 'C-2026-0005-B1',
      agency: "Mayor's Permit",
      type: "Mayor's Permit Renewal Delay",
      priority: 'MEDIUM',
      status: 'Pending Client',
      assignedTo: 'Carlos Mendoza',
      notes: 'Waiting for updated barangay clearance from client.',
      createdAt: '2026-02-15T14:00:00Z',
      dueDate: '2026-03-15',
    },
  ],
  'client-6': [
    {
      id: 'C-2026-0006-C1',
      agency: 'BIR',
      type: 'BIR Registration Discrepancy',
      priority: 'HIGH',
      status: 'Action Required',
      assignedTo: 'Ana Reyes',
      notes: 'BIR COR shows incorrect RDO code. Need client to visit RDO 044.',
      createdAt: '2026-01-20T11:00:00Z',
      dueDate: '2026-02-28',
    },
    {
      id: 'C-2026-0006-C2',
      agency: 'SEC',
      type: 'SEC GIS Late Filing',
      priority: 'HIGH',
      status: 'In Progress',
      assignedTo: 'Juan Dela Cruz',
      notes: 'GIS was due Feb 15. Drafting the amended report now.',
      createdAt: '2026-02-16T08:00:00Z',
      dueDate: '2026-03-10',
    },
  ],
  'client-8': [
    {
      id: 'C-2026-0008-D1',
      agency: 'DTI',
      type: 'DTI Certificate Expired',
      priority: 'MEDIUM',
      status: 'In Progress',
      assignedTo: 'Juan Dela Cruz',
      notes: 'DTI certificate expired Feb 10. Renewal application submitted online.',
      createdAt: '2026-02-12T10:00:00Z',
      dueDate: '2026-03-12',
    },
  ],
};
