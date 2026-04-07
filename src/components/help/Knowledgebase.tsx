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
          'Send a message to HR through the internal portal or raise your concern via the Workplace Care Line. Always reference your payslip ID and specific discrepancy.',
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
          'You may raise concerns through the Workplace Care Line available in this Help section, or directly message the HR team through the portal. All submissions are handled confidentially.',
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

export function Knowledgebase(): React.ReactNode {
  const [search, setSearch] = useState('');
  const [openArticles, setOpenArticles] = useState<Record<string, boolean>>({});

  function toggleArticle(key: string) {
    setOpenArticles((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const filtered = CATEGORIES.map((cat) => ({
    ...cat,
    articles: cat.articles.filter(
      (a) =>
        search.trim() === '' ||
        a.question.toLowerCase().includes(search.toLowerCase()) ||
        a.answer.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((cat) => cat.articles.length > 0);

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
            Answers to common questions about using the Agila Tax Management System.
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
          placeholder="Search knowledge base..."
          className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        />
      </div>

      {/* Tip */}
      {search.trim() === '' && (
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
          <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">
            Can&apos;t find what you&apos;re looking for? Use the <span className="font-semibold">Workplace Care Line</span> to reach HR directly.
          </p>
        </div>
      )}

      {/* Categories */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No articles match your search. Try different keywords.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((cat) => (
            <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden">
              {/* Category header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-border">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cat.color}`}>
                  {cat.icon}
                </div>
                <h2 className="text-sm font-bold text-foreground">{cat.title}</h2>
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
    </div>
  );
}
