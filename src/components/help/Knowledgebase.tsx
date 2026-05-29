// src/components/help/Knowledgebase.tsx
'use client';

import React, { useState } from 'react';
import {
  BookOpen,
  Clock,
  FileText,
  Users,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Search,
  Lightbulb,
  CalendarDays,
  Banknote,
  ListChecks,
  CheckCircle2,
  AlertTriangle,
  Info,
  Timer,
  Tag,
} from 'lucide-react';

interface KBArticle {
  question: string;
  answer: string;
}

interface KBCategory {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  articles: KBArticle[];
}

// ── SOP Types ────────────────────────────────────────────────────────────────

type CalloutType = 'tip' | 'warning' | 'info';

interface SOPStep {
  title: string;
  detail: string;
  /** Optional callout attached to this step */
  callout?: { type: CalloutType; text: string };
  /** Optional sub-steps rendered as a bullet list */
  bullets?: string[];
}

interface SOPDoc {
  id: string;
  title: string;
  module: string;          // e.g. "HR Portal", "Accounting Portal"
  moduleColor: string;     // Tailwind badge classes
  estimatedMinutes: number;
  steps: SOPStep[];
}

// ── SOP Data ─────────────────────────────────────────────────────────────────

const SOPS: SOPDoc[] = [
  // ── Clock-in / Clock-out ─────────────────────────────────────────────────
  {
    id: 'sop-clock-in',
    title: 'How to Clock In and Clock Out',
    module: 'Dashboard',
    moduleColor: 'bg-blue-100 text-blue-700',
    estimatedMinutes: 2,
    steps: [
      {
        title: 'Open your Employee Dashboard',
        detail: 'Navigate to the main Dashboard at /dashboard. Your attendance widget is pinned at the top of the page.',
        callout: { type: 'info', text: 'The clock button is only visible during your assigned work schedule window.' },
      },
      {
        title: 'Click "Clock In"',
        detail: 'Press the green "Clock In" button. A confirmation dialog will appear showing the current timestamp.',
        bullets: [
          'Verify the displayed time is correct before confirming.',
          'If you are working from home, your IP address is still recorded.',
        ],
      },
      {
        title: 'Confirm the clock-in',
        detail: 'Click "Confirm" in the dialog. The button label changes to "Clock Out" and a running timer is displayed.',
        callout: { type: 'tip', text: 'Your clock-in time is locked once confirmed. Contact HR for manual adjustments.' },
      },
      {
        title: 'Clock out at end of shift',
        detail: 'When your shift ends, return to the Dashboard and click "Clock Out". Confirm the timestamp in the same dialog.',
        callout: { type: 'warning', text: 'Failing to clock out will mark your record as incomplete. HR may flag this for the payroll period.' },
      },
      {
        title: 'Verify your attendance record',
        detail: 'Go to Dashboard → Timesheet to confirm today\'s record shows both in/out times and the correct total hours.',
      },
    ],
  },

  // ── File a leave request ───────────────────────────────────────────────────
  {
    id: 'sop-leave-request',
    title: 'How to File a Leave Request',
    module: 'Dashboard',
    moduleColor: 'bg-emerald-100 text-emerald-700',
    estimatedMinutes: 5,
    steps: [
      {
        title: 'Go to HR Applications → Leave',
        detail: 'From the Dashboard sidebar, click HR Applications, then select Leave.',
      },
      {
        title: 'Click "New Leave Request"',
        detail: 'The request form opens. Fill in all required fields.',
        bullets: [
          'Leave Type: VL (Vacation Leave), SL (Sick Leave), or Emergency Leave.',
          'Date From / Date To: select the exact coverage dates.',
          'Reason: brief description for HR reference.',
        ],
      },
      {
        title: 'Review your leave balance',
        detail: 'The form shows your current available credits for the selected leave type. Ensure you have sufficient balance before submitting.',
        callout: { type: 'warning', text: 'Requests that exceed your available credits will be placed on hold pending HR approval.' },
      },
      {
        title: 'Submit the request',
        detail: 'Click "Submit". Your direct manager and HR will receive an in-app notification for approval.',
        callout: { type: 'tip', text: 'Submit leave requests at least 3 business days in advance for planned absences.' },
      },
      {
        title: 'Monitor approval status',
        detail: 'Return to the Leave page to track your request. Possible statuses: Pending → Approved / Rejected.',
        bullets: [
          'Approved: leave is confirmed and credits are deducted.',
          'Rejected: a reason will be shown; you may re-file with corrections.',
        ],
      },
    ],
  },

  // ── Submit a petty cash request ──────────────────────────────────────────
  {
    id: 'sop-petty-cash',
    title: 'How to Submit a Petty Cash Request',
    module: 'Dashboard',
    moduleColor: 'bg-violet-100 text-violet-700',
    estimatedMinutes: 5,
    steps: [
      {
        title: 'Navigate to Petty Cash',
        detail: 'From the Dashboard sidebar, click Petty Cash.',
      },
      {
        title: 'Click "New Request"',
        detail: 'The request form opens. Enter the purpose and date of the disbursement.',
      },
      {
        title: 'Add expense line items',
        detail: 'For each expense, click "Add Item" and fill in the fields.',
        bullets: [
          'Category: Employee Expense (operational costs) or Client Fund (charged against a specific client).',
          'Description: what the expense is for.',
          'Amount: exact peso value.',
          'For Client Fund items, select the applicable client from the dropdown.',
        ],
        callout: { type: 'info', text: 'Client Fund items draw from the client\'s pre-loaded fund balance. Ensure the client has sufficient balance before adding the item.' },
      },
      {
        title: 'Review totals and submit',
        detail: 'The form shows the total requested amount broken down by category. Click "Submit for Approval" to send the request to your custodian and accounting manager.',
        callout: { type: 'tip', text: 'Requests in DRAFT status are not yet visible to approvers. Click "Submit" to move the status to PENDING.' },
      },
      {
        title: 'Track approval progress',
        detail: 'Return to the Petty Cash page to monitor the status of your request.',
        bullets: [
          'PENDING: awaiting custodian review.',
          'APPROVED: custodian approved; awaiting disbursement.',
          'DISBURSED: funds have been released to you.',
          'LIQUIDATED: you have submitted receipts and the request is closed.',
          'REJECTED: a reason is shown; you may revise and resubmit.',
        ],
      },
    ],
  },

];

const CATEGORIES: KBCategory[] = [
  {
    id: 'timesheet',
    icon: <Clock className="w-5 h-5" />,
    title: 'Timesheets & Attendance',
    color: 'text-blue-600 bg-blue-50',
    articles: [
      {
        question: 'How do I clock in and out?',
        answer:
          'Navigate to your Dashboard and click the "Clock In" button at the top of the page. You will be prompted to confirm your clock-in time. To clock out, click the same button which now shows "Clock Out". Your attendance is automatically recorded.',
      },
      {
        question: 'What happens if I forget to clock in?',
        answer:
          'If you missed a clock-in, contact your direct manager or HR to request a manual time adjustment. Adjustments must be submitted within the same payroll period to be reflected in your payslip.',
      },
      {
        question: 'How do I view my attendance history?',
        answer:
          'Go to Dashboard → Timesheet. You can filter by date range to see your clock-in/out records, total hours, and any late or undertime entries.',
      },
      {
        question: 'What is considered late?',
        answer:
          'Lateness is computed based on your assigned work schedule. Any clock-in beyond the grace period of your scheduled start time is counted as late and may affect your daily pay computation.',
      },
    ],
  },
  {
    id: 'leaves',
    icon: <CalendarDays className="w-5 h-5" />,
    title: 'Leave Applications',
    color: 'text-emerald-600 bg-emerald-50',
    articles: [
      {
        question: 'How do I file a leave request?',
        answer:
          'Go to Dashboard → HR Applications → Leave. Click "New Leave Request", fill in the leave type, dates, and reason, then submit. Your manager will be notified for approval.',
      },
      {
        question: 'How many leave credits do I have?',
        answer:
          'Your leave balance is shown on the Leave page under "My Leave Balance". Credits accrue based on your employment type and company policy. Contact HR if you believe your balance is incorrect.',
      },
      {
        question: 'Can I cancel a leave request?',
        answer:
          'Yes, as long as the request is still in Pending status. Go to your leave application and click "Cancel". Once approved, you will need to coordinate directly with HR.',
      },
      {
        question: 'What leave types are available?',
        answer:
          'Agila offers Vacation Leave (VL), Sick Leave (SL), and Emergency Leave. Special leave types (e.g., maternity, paternity, solo parent) follow applicable Philippine labor laws.',
      },
    ],
  },
  {
    id: 'payslips',
    icon: <Banknote className="w-5 h-5" />,
    title: 'Payslips & Compensation',
    color: 'text-violet-600 bg-violet-50',
    articles: [
      {
        question: 'How do I view my payslips?',
        answer:
          'Go to Dashboard → Payslips. You will see a list of your payslips by period. Click any entry to view the full breakdown including earnings, deductions, and net pay.',
      },
      {
        question: 'What deductions appear on my payslip?',
        answer:
          'Standard deductions include SSS, PhilHealth, and Pag-IBIG contributions, as well as applicable withholding tax. Any approved cash advances or salary deductions will also be reflected.',
      },
      {
        question: 'When is the payroll cut-off?',
        answer:
          'Payroll cut-off dates are set by HR and can vary by schedule (semi-monthly or monthly). You can view the active payroll schedule in your Payslip page header or by asking HR.',
      },
      {
        question: 'Who do I contact if my payslip is incorrect?',
        answer:
          'Contact your HR or System Administrator directly through the internal portal. Always reference your payslip ID and the specific discrepancy so it can be corrected promptly.',
      },
    ],
  },
  {
    id: 'tasks',
    icon: <FileText className="w-5 h-5" />,
    title: 'Tasks & Compliance',
    color: 'text-amber-600 bg-amber-50',
    articles: [
      {
        question: 'How are tasks assigned to me?',
        answer:
          'Tasks are assigned by your supervisor or compliance officer and will appear in your Account Officer or Compliance module. You will receive an in-app notification when a new task is assigned.',
      },
      {
        question: 'How do I update the status of a task?',
        answer:
          'Open the task from your task board and use the status dropdown or the action buttons to move it through the workflow stages (e.g., In Progress → For Review → Done).',
      },
      {
        question: 'What are the BIR filing deadlines I should know?',
        answer:
          'Key BIR deadlines include: Monthly VAT (25th of the following month), Quarterly ITR (60 days after the quarter), Annual ITR (April 15 for calendar-year filers). Always verify with your compliance officer for client-specific deadlines.',
      },
    ],
  },
  {
    id: 'hr',
    icon: <Users className="w-5 h-5" />,
    title: 'HR & Employee Info',
    color: 'text-rose-600 bg-rose-50',
    articles: [
      {
        question: 'How do I update my personal information?',
        answer:
          'Go to Dashboard → Settings → Profile. You can update your contact details, emergency contact, and address. For changes to legal information (e.g., TIN, SSS number), please coordinate with HR directly.',
      },
      {
        question: 'How do I request a Certificate of Employment?',
        answer:
          'Submit a request through HR or through the internal HR applications page. Processing typically takes 3–5 business days. Specify the purpose (e.g., bank requirement, visa application).',
      },
      {
        question: 'Who should I contact for HR concerns?',
        answer:
          'Contact your HR team or System Administrator directly. You may message HR through the portal or approach them in person. All concerns are handled confidentially.',
      },
    ],
  },
  {
    id: 'billing',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Accounting & Billing',
    color: 'text-cyan-600 bg-cyan-50',
    articles: [
      {
        question: 'How are client invoices generated?',
        answer:
          'Invoices are generated by the Accounting team through the Accounting portal. Each invoice is tied to a client subscription or service plan and follows the billing schedule.',
      },
      {
        question: 'What does "Partially Paid" mean on a billing record?',
        answer:
          '"Partially Paid" means the client has made a payment but it does not cover the full invoice amount. The remaining balance is still outstanding and will be tracked by the Accounting team.',
      },
      {
        question: 'How do I record a payment received?',
        answer:
          'Go to the Accounting portal → Payments → New Payment. Select the client, the invoice(s) being applied, the payment mode, and the amount. Attach proof of transaction if required.',
      },
    ],
  },
  {
    id: 'security',
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Account & Security',
    color: 'text-slate-600 bg-slate-100',
    articles: [
      {
        question: 'How do I change my password?',
        answer:
          'Go to Dashboard → Settings → Account. Click "Change Password", enter your current password, then set a new one. Use a strong password with a mix of letters, numbers, and symbols.',
      },
      {
        question: 'What should I do if my account is compromised?',
        answer:
          'Immediately contact IT or your system administrator to suspend your account. Change your password as soon as access is restored and report the incident.',
      },
      {
        question: 'Who can access my data in the system?',
        answer:
          'Access is role-based. HR personnel can view HR-related data; Accounting can view billing records; Admins have broader access. Your personal payslip data is visible only to you and authorized HR/Admin roles.',
      },
    ],
  },
];

// ── Callout component ────────────────────────────────────────────────────────

function Callout({ type, text }: { type: CalloutType; text: string }): React.JSX.Element {
  if (type === 'warning') {
    return (
      <div className="flex items-start gap-2 mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800 leading-relaxed">{text}</p>
      </div>
    );
  }
  if (type === 'tip') {
    return (
      <div className="flex items-start gap-2 mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5">
        <Lightbulb className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
        <p className="text-xs text-emerald-800 leading-relaxed">{text}</p>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-2 mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
      <Info className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
      <p className="text-xs text-blue-800 leading-relaxed">{text}</p>
    </div>
  );
}

// ── SOP Card component ───────────────────────────────────────────────────────

function SOPCard({ sop }: { sop: SOPDoc }): React.JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-muted transition-colors group"
      >
        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
          <ListChecks className="w-4 h-4 text-slate-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground group-hover:text-blue-600 transition-colors">
            {sop.title}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${sop.moduleColor}`}>
              <Tag className="w-3 h-3" />
              {sop.module}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="w-3 h-3" />
              ~{sop.estimatedMinutes} min
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <ListChecks className="w-3 h-3" />
              {sop.steps.length} steps
            </span>
          </div>
        </div>
        {open
          ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
        }
      </button>

      {/* Step-by-step content */}
      {open && (
        <div className="px-5 pb-6 pt-1">
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-3.75 top-4 bottom-4 w-px bg-border" aria-hidden="true" />

            <ol className="space-y-0">
              {sop.steps.map((step, idx) => (
                <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Step circle */}
                  <div className="relative z-10 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {idx === sop.steps.length - 1
                      ? <CheckCircle2 className="w-4 h-4" />
                      : idx + 1
                    }
                  </div>

                  {/* Step body */}
                  <div className="flex-1 pt-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{step.detail}</p>

                    {/* Bullet sub-steps */}
                    {step.bullets && step.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1 pl-1">
                        {step.bullets.map((b, bi) => (
                          <li key={bi} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Callout */}
                    {step.callout && (
                      <Callout type={step.callout.type} text={step.callout.text} />
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function Knowledgebase(): React.ReactNode {
  const [search, setSearch] = useState('');
  const [openArticles, setOpenArticles] = useState<Record<string, boolean>>({});

  function toggleArticle(key: string) {
    setOpenArticles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // Filter FAQ categories by search
  const filteredFaq = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        search.trim() === '' ||
        a.question.toLowerCase().includes(search.toLowerCase()) ||
        a.answer.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.articles.length > 0);

  // Filter SOPs by search
  const filteredSops = SOPS.filter((sop) => {
    if (search.trim() === '') return true;
    const q = search.toLowerCase();
    return (
      sop.title.toLowerCase().includes(q) ||
      sop.module.toLowerCase().includes(q) ||
      sop.steps.some((s) => s.title.toLowerCase().includes(q) || s.detail.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-foreground">Knowledge Base</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Answers to common questions and step-by-step procedures for the Agila Tax Management System.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search articles and procedures…"
          className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Tip */}
      {search.trim() === '' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Can&apos;t find what you&apos;re looking for? Contact your <span className="font-semibold">HR or System Administrator</span> for any concerns regarding your account or the system.
          </p>
        </div>
      )}

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-bold text-foreground">Frequently Asked Questions</h2>
      </div>

      {filteredFaq.length === 0 && search.trim() !== '' ? null : (
        <div className="space-y-4">
          {filteredFaq.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  {cat.icon}
                </div>
                <h3 className="text-sm font-bold text-foreground">{cat.title}</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {cat.articles.length} article{cat.articles.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Articles */}
              <div className="divide-y divide-border">
                {cat.articles.map((article, idx) => {
                  const key = `${cat.id}-${idx}`;
                  const isOpen = !!openArticles[key];
                  return (
                    <div key={key}>
                      <button
                        onClick={() => toggleArticle(key)}
                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted transition-colors group"
                      >
                        {isOpen ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-sm font-medium text-foreground group-hover:text-blue-600 transition-colors">
                          {article.question}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 pl-12">
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {article.answer}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredFaq.length === 0 && search.trim() !== '' && filteredSops.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No articles or procedures match your search. Try different keywords.
        </div>
      )}

      {/* ── SOPs ────────────────────────────────────────────────────────────── */}
      {filteredSops.length > 0 && (
        <>
          <div className="flex items-center gap-2 pt-2">
            <ListChecks className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">Step-by-Step Procedures</h2>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {filteredSops.length}
            </span>
          </div>
          <div className="space-y-4">
            {filteredSops.map((sop) => (
              <SOPCard key={sop.id} sop={sop} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
