// src/lib/mock-client-gateway-data.ts

export type ClientStatus = 'Active' | 'Inactive' | 'Suspended';

export interface GatewayClient {
  id: string;
  clientNumber: string;      // e.g. CLT-2024-0001
  businessName: string;
  companyCode: string;       // e.g. ACME-001
  status: ClientStatus;
  portalLink: string;        // URL to client portal (under construction)
  // Contact Info
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
  alternatePhone?: string;
  // Business Details
  businessType: string;      // Sole Proprietorship / Corporation / Partnership
  industry: string;
  taxIdentificationNumber: string;
  dateOfRegistration: string;
  servicePlan: string;
  // Related Personas
  personas: {
    id: string;
    name: string;
    role: string;            // Owner / Director / Accountant / Liaison
    email: string;
    phone: string;
  }[];
  // Place of Business
  streetAddress: string;
  barangay: string;
  city: string;
  province: string;
  zipCode: string;
  // BIR Details
  birRegistrationDate: string;
  birRegistrationNumber: string;
  taxType: string;           // VAT / Non-VAT
  rdo: string;               // Revenue District Office
  birFormsSeries: string[];  // Forms filed e.g. ['2550M', '1701Q']
  createdAt: string;
}

export const MOCK_GATEWAY_CLIENTS: GatewayClient[] = [
  {
    id: '1',
    clientNumber: 'CLT-2024-0001',
    businessName: 'Dela Cruz General Merchandise',
    companyCode: 'DCGM-001',
    status: 'Active',
    portalLink: '/client-portal/DCGM-001',
    primaryContactName: 'Juan Dela Cruz',
    primaryContactEmail: 'juan@dcgm.ph',
    primaryContactPhone: '+63 917 123 4567',
    alternatePhone: '+63 32 234 5678',
    businessType: 'Sole Proprietorship',
    industry: 'Retail / General Merchandise',
    taxIdentificationNumber: '123-456-789-000',
    dateOfRegistration: '2022-03-15',
    servicePlan: 'Essentials (Non-VAT)',
    personas: [
      { id: 'p1', name: 'Juan Dela Cruz', role: 'Owner', email: 'juan@dcgm.ph', phone: '+63 917 123 4567' },
      { id: 'p2', name: 'Maria Santos', role: 'Accountant', email: 'maria.acct@email.com', phone: '+63 918 234 5678' },
    ],
    streetAddress: '123 Colon St.',
    barangay: 'Barangay Parian',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2022-03-18',
    birRegistrationNumber: 'BIR-RC-2022-001234',
    taxType: 'Non-VAT',
    rdo: 'RDO 83 – Cebu City North',
    birFormsSeries: ['2551M', '1701Q', '1701'],
    createdAt: '2024-01-10T08:30:00Z',
  },
  {
    id: '2',
    clientNumber: 'CLT-2024-0002',
    businessName: 'Agila Digital Solutions Inc.',
    companyCode: 'ADS-002',
    status: 'Active',
    portalLink: '/client-portal/ADS-002',
    primaryContactName: 'Angela Reyes',
    primaryContactEmail: 'angela@agila-digital.ph',
    primaryContactPhone: '+63 919 345 6789',
    businessType: 'Corporation',
    industry: 'Information Technology',
    taxIdentificationNumber: '234-567-890-001',
    dateOfRegistration: '2021-06-01',
    servicePlan: 'Agila360 (VAT)',
    personas: [
      { id: 'p3', name: 'Angela Reyes', role: 'President', email: 'angela@agila-digital.ph', phone: '+63 919 345 6789' },
      { id: 'p4', name: 'Carlo Mendoza', role: 'Corporate Secretary', email: 'carlo@agila-digital.ph', phone: '+63 916 456 7890' },
      { id: 'p5', name: 'Liza Tan', role: 'Treasurer', email: 'liza@agila-digital.ph', phone: '+63 912 567 8901' },
    ],
    streetAddress: '4F Skyrise 4B, Asiatown IT Park',
    barangay: 'Barangay Apas',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2021-06-10',
    birRegistrationNumber: 'BIR-RC-2021-004567',
    taxType: 'VAT',
    rdo: 'RDO 83 – Cebu City North',
    birFormsSeries: ['2550M', '2550Q', '1702Q', '1702', '1601C', '1604E'],
    createdAt: '2024-01-15T09:00:00Z',
  },
  {
    id: '3',
    clientNumber: 'CLT-2024-0003',
    businessName: 'Sunshine Bakery & Café',
    companyCode: 'SBC-003',
    status: 'Active',
    portalLink: '/client-portal/SBC-003',
    primaryContactName: 'Rosa Fernandez',
    primaryContactEmail: 'rosa@sunshinebakery.ph',
    primaryContactPhone: '+63 920 456 7890',
    businessType: 'Sole Proprietorship',
    industry: 'Food & Beverage',
    taxIdentificationNumber: '345-678-901-002',
    dateOfRegistration: '2023-01-20',
    servicePlan: 'Starter',
    personas: [
      { id: 'p6', name: 'Rosa Fernandez', role: 'Owner', email: 'rosa@sunshinebakery.ph', phone: '+63 920 456 7890' },
    ],
    streetAddress: '78 General Maxilom Ave.',
    barangay: 'Barangay Kamputhaw',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2023-01-25',
    birRegistrationNumber: 'BIR-RC-2023-007890',
    taxType: 'Non-VAT',
    rdo: 'RDO 82 – Cebu City South',
    birFormsSeries: ['2551M', '1701'],
    createdAt: '2024-02-01T10:00:00Z',
  },
  {
    id: '4',
    clientNumber: 'CLT-2024-0004',
    businessName: 'Pacific Freight Logistics Corp.',
    companyCode: 'PFL-004',
    status: 'Inactive',
    portalLink: '/client-portal/PFL-004',
    primaryContactName: 'Roberto Villanueva',
    primaryContactEmail: 'roberto@pacificfreight.ph',
    primaryContactPhone: '+63 921 567 8901',
    businessType: 'Corporation',
    industry: 'Logistics & Transportation',
    taxIdentificationNumber: '456-789-012-003',
    dateOfRegistration: '2019-09-05',
    servicePlan: 'Agila360 (Non-VAT)',
    personas: [
      { id: 'p7', name: 'Roberto Villanueva', role: 'CEO', email: 'roberto@pacificfreight.ph', phone: '+63 921 567 8901' },
      { id: 'p8', name: 'Anna Cruz', role: 'CFO', email: 'anna@pacificfreight.ph', phone: '+63 922 678 9012' },
    ],
    streetAddress: '15 M. Velez St., North Reclamation Area',
    barangay: 'Barangay Mambaling',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2019-09-12',
    birRegistrationNumber: 'BIR-RC-2019-011223',
    taxType: 'Non-VAT',
    rdo: 'RDO 83 – Cebu City North',
    birFormsSeries: ['2551M', '1702Q', '1702'],
    createdAt: '2024-02-15T11:00:00Z',
  },
  {
    id: '5',
    clientNumber: 'CLT-2024-0005',
    businessName: 'Dr. Maria Santos Medical Clinic',
    companyCode: 'MSM-005',
    status: 'Suspended',
    portalLink: '/client-portal/MSM-005',
    primaryContactName: 'Dr. Maria Santos',
    primaryContactEmail: 'drsantos@medclinic.ph',
    primaryContactPhone: '+63 923 678 9012',
    businessType: 'Sole Proprietorship',
    industry: 'Healthcare / Medical Services',
    taxIdentificationNumber: '567-890-123-004',
    dateOfRegistration: '2020-11-11',
    servicePlan: 'Essentials (VAT)',
    personas: [
      { id: 'p9', name: 'Dr. Maria Santos', role: 'Owner / Physician', email: 'drsantos@medclinic.ph', phone: '+63 923 678 9012' },
      { id: 'p10', name: 'Pedro Santos', role: 'Clinic Manager', email: 'pedro@medclinic.ph', phone: '+63 924 789 0123' },
    ],
    streetAddress: '22 Don Gil Garcia St.',
    barangay: 'Barangay Capitol Site',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2020-11-18',
    birRegistrationNumber: 'BIR-RC-2020-014556',
    taxType: 'VAT',
    rdo: 'RDO 82 – Cebu City South',
    birFormsSeries: ['2550M', '2550Q', '1701Q', '1701'],
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: '6',
    clientNumber: 'CLT-2024-0006',
    businessName: 'Cebu Homeworks Construction',
    companyCode: 'CHC-006',
    status: 'Active',
    portalLink: '/client-portal/CHC-006',
    primaryContactName: 'Benjamin Uy',
    primaryContactEmail: 'ben@cebuhomeworks.ph',
    primaryContactPhone: '+63 925 789 0123',
    businessType: 'Sole Proprietorship',
    industry: 'Construction',
    taxIdentificationNumber: '678-901-234-005',
    dateOfRegistration: '2021-04-22',
    servicePlan: 'Essentials (Non-VAT)',
    personas: [
      { id: 'p11', name: 'Benjamin Uy', role: 'Owner', email: 'ben@cebuhomeworks.ph', phone: '+63 925 789 0123' },
    ],
    streetAddress: '55 Osmeña Blvd.',
    barangay: 'Barangay Guadalupe',
    city: 'Cebu City',
    province: 'Cebu',
    zipCode: '6000',
    birRegistrationDate: '2021-04-28',
    birRegistrationNumber: 'BIR-RC-2021-017889',
    taxType: 'Non-VAT',
    rdo: 'RDO 82 – Cebu City South',
    birFormsSeries: ['2551M', '1701Q', '1701'],
    createdAt: '2024-03-10T09:30:00Z',
  },
];

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  audience: 'All Clients' | 'Active Only' | 'VAT Clients' | 'Non-VAT Clients';
  priority: 'Normal' | 'High' | 'Urgent';
  publishedAt: string;
  author: string;
}

export const MOCK_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann-1',
    title: 'BIR Deadline Reminder: March 20 VAT Filing',
    content: 'This is a reminder that the monthly VAT declaration (BIR Form 2550M) for the month of February is due on March 20, 2026. Please coordinate with your account officer to ensure timely submission.',
    audience: 'VAT Clients',
    priority: 'Urgent',
    publishedAt: '2026-03-18T08:00:00Z',
    author: 'Compliance Team',
  },
  {
    id: 'ann-2',
    title: 'Client Gateway Portal — Coming Soon',
    content: 'We are excited to announce that our new Client Gateway Portal is currently under development. This portal will allow you to view your compliance status, download documents, and communicate with your account officer directly online.',
    audience: 'All Clients',
    priority: 'Normal',
    publishedAt: '2026-03-15T10:00:00Z',
    author: 'Agila Team',
  },
  {
    id: 'ann-3',
    title: 'Annual ITR Filing Season — April 15 Deadline',
    content: 'The deadline for Annual Income Tax Return filing is on April 15, 2026. Our compliance team will start processing ITR filings by March 25. Kindly prepare and submit all required financial documents to your account officer as soon as possible.',
    audience: 'All Clients',
    priority: 'High',
    publishedAt: '2026-03-12T09:00:00Z',
    author: 'Compliance Team',
  },
  {
    id: 'ann-4',
    title: 'New Service Plan Pricing Effective May 2026',
    content: 'Please be informed that there will be an adjustment in our service plan pricing effective May 1, 2026. Your account officer will reach out to discuss the changes and how they affect your current plan.',
    audience: 'All Clients',
    priority: 'Normal',
    publishedAt: '2026-03-10T14:00:00Z',
    author: 'Management',
  },
  {
    id: 'ann-5',
    title: 'SSS Contribution Rate Update — January 2026',
    content: 'The SSS contribution rate has been updated as of January 2026. The new employer contribution is 9.5% and employee contribution is 4.5%. Please ensure payroll is updated accordingly. Our HR compliance team will process the adjustments for enrolled clients.',
    audience: 'All Clients',
    priority: 'High',
    publishedAt: '2026-01-05T08:00:00Z',
    author: 'HR Compliance Team',
  },
];

export interface ActivityLogItem {
  id: string;
  clientNumber: string;
  clientName: string;
  action: string;
  performedBy: string;
  details: string;
  timestamp: string;
  category: 'Document' | 'Status' | 'Account' | 'Portal' | 'Filing';
}

export const MOCK_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'log-1',
    clientNumber: 'CLT-2024-0001',
    clientName: 'Dela Cruz General Merchandise',
    action: 'Document Generated',
    performedBy: 'John Compliance',
    details: 'Generated Certificate of Registration copy for client records.',
    timestamp: '2026-03-24T10:30:00Z',
    category: 'Document',
  },
  {
    id: 'log-2',
    clientNumber: 'CLT-2024-0002',
    clientName: 'Agila Digital Solutions Inc.',
    action: 'Portal Access Invited',
    performedBy: 'Admin System',
    details: 'Portal invitation sent to angela@agila-digital.ph.',
    timestamp: '2026-03-24T09:15:00Z',
    category: 'Portal',
  },
  {
    id: 'log-3',
    clientNumber: 'CLT-2024-0003',
    clientName: 'Sunshine Bakery & Café',
    action: 'Filing Submitted',
    performedBy: 'Maria Compliance',
    details: 'BIR Form 2551M for February 2026 submitted successfully.',
    timestamp: '2026-03-23T15:45:00Z',
    category: 'Filing',
  },
  {
    id: 'log-4',
    clientNumber: 'CLT-2024-0004',
    clientName: 'Pacific Freight Logistics Corp.',
    action: 'Status Changed',
    performedBy: 'Admin User',
    details: 'Client status changed from Active to Inactive.',
    timestamp: '2026-03-22T11:00:00Z',
    category: 'Status',
  },
  {
    id: 'log-5',
    clientNumber: 'CLT-2024-0005',
    clientName: 'Dr. Maria Santos Medical Clinic',
    action: 'Account Suspended',
    performedBy: 'Admin User',
    details: 'Account suspended pending resolution of outstanding balance.',
    timestamp: '2026-03-21T14:20:00Z',
    category: 'Status',
  },
  {
    id: 'log-6',
    clientNumber: 'CLT-2024-0002',
    clientName: 'Agila Digital Solutions Inc.',
    action: 'Client Info Updated',
    performedBy: 'Account Officer',
    details: 'Updated primary contact phone number.',
    timestamp: '2026-03-20T10:00:00Z',
    category: 'Account',
  },
  {
    id: 'log-7',
    clientNumber: 'CLT-2024-0001',
    clientName: 'Dela Cruz General Merchandise',
    action: 'Filing Submitted',
    performedBy: 'John Compliance',
    details: 'BIR Form 2551M for February 2026 submitted successfully.',
    timestamp: '2026-03-20T09:30:00Z',
    category: 'Filing',
  },
  {
    id: 'log-8',
    clientNumber: 'CLT-2024-0006',
    clientName: 'Cebu Homeworks Construction',
    action: 'Document Generated',
    performedBy: 'Maria Compliance',
    details: 'Printed official receipt for March 2026 service fee.',
    timestamp: '2026-03-19T16:00:00Z',
    category: 'Document',
  },
];
