// src/lib/mock-task-management-data.ts
// ── Mock Task Management Data ─────────────────────────────
// Unified task view for the Operations Manager portal.
// Combines tasks from three departments:
//   - Client Relations (Account Officer)
//   - Liaison
//   - Compliance

import { INITIAL_AO_TASKS, AO_TEAM_MEMBERS } from './mock-ao-data';
import { INITIAL_LIAISON_TASKS, LIAISON_TEAM } from './mock-liaison-data';
import type { AOTask, AOTeamMember } from './types';

// ── Source type ───────────────────────────────────────────
export type TaskSource = 'client-relations' | 'liaison' | 'compliance' | 'om' | 'admin' | 'accounting' | 'hr' | 'it';

export interface UnifiedTask extends AOTask {
  source: TaskSource;
}

// ── Operations Manager personal mock tasks ──────────────
const OM_TASKS: AOTask[] = [
  {
    id: 'om-1',
    title: 'Monthly Performance Review – March 2026',
    description: 'Review KPIs and output metrics for Client Relations, Liaison, and Compliance.',
    status: 'In Progress',
    priority: 'High',
    clientId: 'client-1',
    assigneeId: 'ao-1',
    dueDate: '2026-03-31',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    comments: [],
    tags: ['Monthly', 'Review'],
  },
  {
    id: 'om-2',
    title: 'Q1 2026 Compliance Summary Report',
    description: 'Compile Q1 summary of all compliance filings and outstanding deadlines for presentation.',
    status: 'To Do',
    priority: 'Urgent',
    clientId: 'client-2',
    assigneeId: 'ao-1',
    dueDate: '2026-04-10',
    createdAt: '2026-03-18T08:00:00Z',
    updatedAt: '2026-03-18T08:00:00Z',
    comments: [],
    tags: ['Q1', 'Report'],
  },
  {
    id: 'om-3',
    title: 'April Cross-Department Coordination Meeting',
    description: 'Schedule and lead the cross-department planning session for April priorities.',
    status: 'To Do',
    priority: 'Medium',
    clientId: 'client-1',
    assigneeId: 'ao-1',
    dueDate: '2026-04-03',
    createdAt: '2026-03-22T09:00:00Z',
    updatedAt: '2026-03-22T09:00:00Z',
    comments: [],
    tags: ['Meeting', 'Planning'],
  },
  {
    id: 'om-4',
    title: 'Client Escalation – ABC Enterprises',
    description: 'Follow up on escalated client concern and coordinate resolution timeline with all departments.',
    status: 'Review',
    priority: 'Urgent',
    clientId: 'client-3',
    assigneeId: 'ao-1',
    dueDate: '2026-03-28',
    createdAt: '2026-03-20T11:00:00Z',
    updatedAt: '2026-03-21T14:00:00Z',
    comments: [],
    tags: ['Escalation', 'Client'],
  },
];

// ── Compliance department mock tasks ─────────────────────
const COMPLIANCE_TASKS: AOTask[] = [
  {
    id: 'comp-1',
    title: 'BIR 1701Q Q1 2026 Filing',
    description: 'Prepare and file the BIR 1701Q quarterly income tax return for Q1 2026. Reconcile books with CAS.',
    status: 'In Progress',
    priority: 'High',
    clientId: 'client-1',
    assigneeId: 'ao-2',
    dueDate: '2026-04-15',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-15T09:00:00Z',
    comments: [
      { id: 'cc-1', authorId: 'ao-2', authorName: 'Daniel Magsaysay', content: 'Books reconciled. Preparing schedules.', createdAt: '2026-03-15T09:00:00Z' },
    ],
    tags: ['BIR', 'Income Tax', 'Quarterly'],
  },
  {
    id: 'comp-2',
    title: 'GSIS Employer Remittance – March',
    description: 'Process and submit GSIS employer and employee remittance for March 2026.',
    status: 'To Do',
    priority: 'Medium',
    clientId: 'client-3',
    assigneeId: 'ao-5',
    dueDate: '2026-03-31',
    createdAt: '2026-03-10T08:00:00Z',
    updatedAt: '2026-03-10T08:00:00Z',
    comments: [],
    tags: ['GSIS', 'Remittance'],
  },
  {
    id: 'comp-3',
    title: 'BIR 2550M VAT Filing – February',
    description: 'File monthly VAT return (BIR Form 2550M) for February 2026.',
    status: 'Done',
    priority: 'Medium',
    clientId: 'client-2',
    assigneeId: 'ao-2',
    dueDate: '2026-03-20',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-03-19T15:00:00Z',
    comments: [
      { id: 'cc-2', authorId: 'ao-2', authorName: 'Daniel Magsaysay', content: 'Filed on March 19. OR No. 2026-BIR-1188.', createdAt: '2026-03-19T15:00:00Z' },
    ],
    tags: ['BIR', 'VAT', 'Monthly'],
  },
  {
    id: 'comp-4',
    title: 'Pag-IBIG Monthly Remittance – March',
    description: 'Submit Pag-IBIG Fund contribution remittances for all enrolled employees for March 2026.',
    status: 'In Progress',
    priority: 'Medium',
    clientId: 'client-4',
    assigneeId: 'ao-5',
    dueDate: '2026-03-25',
    createdAt: '2026-03-10T09:00:00Z',
    updatedAt: '2026-03-18T11:00:00Z',
    comments: [],
    tags: ['Pag-IBIG', 'Remittance', 'Monthly'],
  },
  {
    id: 'comp-5',
    title: 'Audited Financial Statements – FY2025',
    description: 'Complete the AFS for FY2025. Coordinate with external auditor for notes and sign-off.',
    status: 'Review',
    priority: 'Urgent',
    clientId: 'client-2',
    assigneeId: 'ao-2',
    dueDate: '2026-04-30',
    createdAt: '2026-02-15T08:00:00Z',
    updatedAt: '2026-03-20T10:00:00Z',
    comments: [
      { id: 'cc-3', authorId: 'ao-2', authorName: 'Daniel Magsaysay', content: 'Draft AFS sent to auditor. Awaiting review comments.', createdAt: '2026-03-20T10:00:00Z' },
    ],
    tags: ['Audit', 'AFS', 'Annual'],
  },
];

// ── Merge team members (deduplicated by id) ───────────────
export const ALL_TEAM_MEMBERS: AOTeamMember[] = (() => {
  const map = new Map<string, AOTeamMember>();
  for (const m of [...AO_TEAM_MEMBERS, ...LIAISON_TEAM]) {
    if (!map.has(m.id)) map.set(m.id, m);
  }
  return Array.from(map.values());
})();

// ── Merge tasks with source discriminator ─────────────────
export const ALL_TASKS: UnifiedTask[] = [
  ...INITIAL_AO_TASKS.map(t => ({ ...t, source: 'client-relations' as TaskSource })),
  ...INITIAL_LIAISON_TASKS.map(t => ({ ...t, source: 'liaison' as TaskSource })),
  ...COMPLIANCE_TASKS.map(t => ({ ...t, source: 'compliance' as TaskSource })),
  ...OM_TASKS.map(t => ({ ...t, source: 'om' as TaskSource })),
];

// ── Source display config ─────────────────────────────────
export const SOURCE_CONFIG: Record<TaskSource, { label: string; color: string; bg: string; textColor: string }> = {
  'client-relations': { label: 'Client Relations',    color: 'bg-rose-500',    bg: 'bg-rose-50',    textColor: 'text-rose-700'    },
  liaison:            { label: 'Liaison',              color: 'bg-cyan-500',    bg: 'bg-cyan-50',    textColor: 'text-cyan-700'    },
  compliance:         { label: 'Compliance',           color: 'bg-violet-500',  bg: 'bg-violet-50',  textColor: 'text-violet-700'  },
  om:                 { label: 'Operations',          color: 'bg-teal-500',    bg: 'bg-teal-50',    textColor: 'text-teal-700'    },
  admin:              { label: 'Admin',                color: 'bg-slate-500',   bg: 'bg-slate-50',   textColor: 'text-slate-700'   },
  accounting:         { label: 'Accounting',           color: 'bg-emerald-500', bg: 'bg-emerald-50', textColor: 'text-emerald-700' },
  hr:                 { label: 'Human Resources',      color: 'bg-orange-500',  bg: 'bg-orange-50',  textColor: 'text-orange-700'  },
  it:                 { label: 'IT',                   color: 'bg-indigo-500',  bg: 'bg-indigo-50',  textColor: 'text-indigo-700'  },
};
