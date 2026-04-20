// src/components/quick-links/LiaisonDepartment.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

const ORG_LEVELS = [
  { label: 'General Manager',    color: 'bg-slate-700 text-white'         },
  { label: 'Operations Manager', color: 'bg-teal-700 text-white'          },
  { label: 'Liaison Officer 3',  color: 'bg-cyan-600 text-white'          },
  { label: 'Liaison Officer 2',  color: 'bg-cyan-500 text-white'          },
  { label: 'Liaison Officer 1',  color: 'bg-cyan-400 text-slate-900'      },
];

interface DownloadLink { label: string; href: string }

const DOWNLOAD_GROUPS: Array<{ role: string; links: DownloadLink[] }> = [
  {
    role: 'Liaison Officer 2',
    links: [
      { label: 'Daily Field Progress Report',      href: 'Daily Field Progress Report.xlsx' },
      { label: 'Daily Paperwork Preparation Report', href: 'Daily Paperwork Preparation.xlsx' },
    ],
  },
  {
    role: 'Liaison Officer 3',
    links: [
      { label: 'Departmental Reports',  href: 'Departmental Report.xlsx' },
      { label: 'Audit of Daily Report', href: 'Audit of Daily Report.xlsx' },
    ],
  },
  {
    role: 'Operations Manager',
    links: [
      { label: 'Commission Report for Liaison Officer 1', href: 'Commission Report - LO1.xlsx' },
      { label: 'Commission Report for Liaison Officer 2', href: 'Commission Report - LO2.xlsx' },
    ],
  },
];

export function LiaisonDepartment() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 sm:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back */}
        <Link
          href="/dashboard/sop"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to SOP List
        </Link>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 flex flex-col gap-8">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-black text-foreground">Liaison Department</h1>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <p>Department: <span className="font-semibold text-foreground">Operations</span></p>
              <p>Effective Date: <span className="font-semibold text-foreground">March 09, 2026</span></p>
              <p>Approved By: <span className="font-semibold text-foreground">Management</span></p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section I */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-3">
              I. Department&#39;s Structure and Policy
            </h2>
            <p className="text-sm text-muted-foreground">
              You may download the company&#39;s official structure by clicking this{' '}
              <a
                href="Liaison Department Structure.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-cyan-600 hover:underline font-medium"
              >
                link <ExternalLink size={12} />
              </a>.
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* Section II — Org Chart */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-5">
              II. Organizational Structure
            </h2>
            <div className="flex flex-col items-center gap-1">
              {ORG_LEVELS.map((level, i) => (
                <React.Fragment key={level.label}>
                  <div className={`px-8 py-2.5 rounded-xl text-sm font-bold text-center min-w-50 ${level.color}`}>
                    {level.label}
                  </div>
                  {i < ORG_LEVELS.length - 1 && (
                    <span className="text-muted-foreground text-lg leading-none">↓</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Section III — Quick Links */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-2">
              III. Quick Links
            </h2>
            <p className="text-sm text-muted-foreground mb-5">Download Report Templates for:</p>
            <div className="flex flex-col gap-5">
              {DOWNLOAD_GROUPS.map((group) => (
                <div key={group.role}>
                  <p className="text-sm font-bold text-foreground mb-2">{group.role}</p>
                  <div className="flex flex-col gap-2 pl-3 border-l-2 border-cyan-200">
                    {group.links.map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 text-sm text-cyan-600 hover:underline"
                      >
                        <Download size={13} className="shrink-0" />
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-10 text-xs text-muted-foreground text-center">
          © 2025 Agila Tax Management Services — Internal Use Only
        </p>
      </div>
    </div>
  );
}
