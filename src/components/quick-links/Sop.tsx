// src/components/quick-links/Sop.tsx
import React from 'react';
import Link from 'next/link';
import { BookOpen, ExternalLink } from 'lucide-react';

interface SopCard {
  title: string;
  description: string;
  href: string;
  internal?: boolean;
}

interface SopSection {
  heading: string;
  cards: SopCard[];
}

const SECTIONS: SopSection[] = [
  {
    heading: 'OPERATIONS DEPARTMENT',
    cards: [
      {
        title: 'LIAISON DEPARTMENT',
        description: 'Showing the structure for the Department of Liaison Officers and the job responsibilities for all members involved.',
        href: '/dashboard/sop/liaison',
        internal: true,
      },
      {
        title: 'COMPLIANCE DEPARTMENT',
        description: 'Showing the structure for the Department of Compliance Officers and the job responsibilities for all members involved.',
        href: '/dashboard/sop/gis',
        internal: true,
      },
      {
        title: 'CLIENT RELATIONS DEPARTMENT',
        description: 'Showing the structure for the Department of Account Officers and the job responsibilities for all members involved.',
        href: '',
      },
    ],
  },
  {
    heading: 'Operations Guidelines',
    cards: [
      {
        title: 'Account Officers',
        description: 'This SOP is to guide the Account Officers do their tasks and responsibilities.',
        href: 'operations/account_officers/ao_gate.html',
      },
      {
        title: 'Compliance - GIS',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        href: 'operations/compliance_projects/gis.html',
      },
      {
        title: 'Acting Operations Manager',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        href: '',
      },
      {
        title: 'Management',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        href: 'management/mgmt_gate.html',
      },
    ],
  },
  {
    heading: 'Accounting and HR Department',
    cards: [
      {
        title: 'Petty Cash Fund SOP',
        description: 'This SOP establishes the procedures for Petty Cash Fund.',
        href: 'accounting_and_hr/petty_cash_fund/sop-pcf.html',
      },
      {
        title: 'Client Collections SOP',
        description: 'This SOP applies to all client payment requests and invoicing activities.',
        href: 'accounting_and_hr/client_payments/sop-clientpayments.html',
      },
      {
        title: '------',
        description: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.',
        href: '',
      },
    ],
  },
  {
    heading: 'Engagement and Documentations',
    cards: [
      {
        title: 'Client Turn Over SOP',
        description: 'To ensure that all client documents are properly acknowledged during turnover.',
        href: 'engagement_and_documentation/client_turn_over/sop-clientturnover.html',
      },
      {
        title: 'Client Receiving SOP',
        description: 'To ensure that all documents forwarded by clients are properly received and acknowledged.',
        href: 'engagement_and_documentation/client_receiving/sop-clientreceiving.html',
      },
      {
        title: 'Key Holders SOP',
        description: 'To ensure control of all office keys by defining how keys are issued, used, returned, and monitored.',
        href: 'engagement_and_documentation/key_holders/sop_keyholders.html',
      },
      {
        title: 'Client Communication SOP',
        description: 'To establish a consistent, professional, and client-centered approach in all client communications.',
        href: 'engagement_and_documentation/client_comms/sop_clientcomms.html',
      },
      {
        title: 'Forms and Formats',
        description: 'For easy access to ready-to-use forms.',
        href: 'engagement_and_documentation/forms/forms.html',
      },
    ],
  },
  {
    heading: 'Sales and Marketing',
    cards: [
      {
        title: 'Client Acquisition SOP',
        description: 'To ensure that we acquire client the way how Agila would do it.',
        href: 'sales_and_marketing/client_acquisition/sop_clientacquisition.html',
      },
      {
        title: 'New Client Onboarding SOP',
        description: 'This is to ensure proper Onboarding Orientation for all new clients.',
        href: 'sales_and_marketing/client_onboarding/sop_newclientonboarding.html',
      },
      {
        title: 'New Client Turnover SOP',
        description: 'This is to ensure that the client will be properly turned over to the assigned officer.',
        href: 'sales_and_marketing/client_turnover/sop_newclientturnover.html',
      },
    ],
  },
];

function SopCardItem({ card }: { card: SopCard }) {
  if (!card.href) {
    return (
      <div className="flex flex-col gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 p-5 cursor-not-allowed opacity-60">
        <span className="text-sm font-bold text-foreground tracking-wide">{card.title}</span>
        <span className="text-sm text-muted-foreground leading-relaxed">{card.description}</span>
        <span className="mt-1 text-xs font-medium text-muted-foreground">Coming soon</span>
      </div>
    );
  }

  const cardClass = 'group flex flex-col gap-1.5 rounded-xl border border-border bg-card p-5 hover:border-emerald-500 hover:shadow-sm transition-all';
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-bold text-foreground tracking-wide group-hover:text-emerald-600 transition-colors">
          {card.title}
        </span>
        <ExternalLink size={14} className="shrink-0 mt-0.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
      </div>
      <span className="text-sm text-muted-foreground leading-relaxed">{card.description}</span>
    </>
  );

  if (card.internal) {
    return (
      <Link href={card.href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return (
    <a href={card.href} target="_blank" rel="noopener noreferrer" className={cardClass}>
      {inner}
    </a>
  );
}

export function Sop() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      {/* Page header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-foreground">Standard Operating Procedures</h1>
          <p className="text-sm text-muted-foreground">Internal use only — Agila Tax Management Services</p>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-10 max-w-5xl">
        {SECTIONS.map((section) => (
          <div key={section.heading}>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-base font-black text-foreground uppercase tracking-wide whitespace-nowrap">
                {section.heading}
              </h2>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.cards.map((card) => (
                <SopCardItem key={card.title} card={card} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-16 text-xs text-muted-foreground">
        © 2025 Agila Tax Management Services — Internal Use Only
      </p>
    </div>
  );
}
