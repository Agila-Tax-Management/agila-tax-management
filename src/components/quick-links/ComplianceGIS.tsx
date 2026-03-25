// src/components/quick-links/ComplianceGIS.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink } from 'lucide-react';

export function ComplianceGIS() {
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
            <h1 className="text-2xl font-black text-foreground">General Information Sheet (GIS) SOP</h1>
            <div className="mt-3 text-sm text-muted-foreground space-y-1">
              <p>Department: <span className="font-semibold text-foreground">Compliance Team</span></p>
              <p>Effective Date: <span className="font-semibold text-foreground">February 02, 2026</span></p>
              <p>Approved By: <span className="font-semibold text-foreground">Management</span></p>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* 1. Purpose */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-2">1. Purpose</h2>
            <p className="text-sm text-muted-foreground">
              To provide a guide on how to create the General Information Sheet (GIS).
            </p>
          </div>

          <div className="h-px bg-border" />

          {/* 2. Who are required */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-3">2. Who are required?</h2>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                All <strong className="text-foreground">CORPORATIONS</strong> are required to submit their General Information Sheet annually:
                <ul className="mt-1 ml-6 space-y-1 list-[circle] list-inside">
                  <li>Stock Corporation — Domestic or Foreign</li>
                  <li>Non-Stock Corporation — Domestic or Foreign</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="h-px bg-border" />

          {/* 3. Deadline */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-3">3. Deadline</h2>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                Thirty (30) days after the scheduled{' '}
                <strong className="text-foreground">&ldquo;actual&rdquo; annual meeting date</strong>.
              </li>
              <li>
                Annual Meeting Date schedule can be found in{' '}
                <strong className="text-foreground italic">By Laws, section II.</strong>
              </li>
            </ul>
          </div>

          <div className="h-px bg-border" />

          {/* 4. Step by Step */}
          <div>
            <h2 className="text-base font-black text-foreground uppercase tracking-wide mb-5">
              4. Step by Step Process
            </h2>

            {/* Step 1 */}
            <div className="mb-6">
              <div className="h-px bg-border mb-4" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide mb-3">
                Step 1. GIS Format
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Download the GIS Format and save it to the Client&#39;s Folder:
              </p>
              <div className="flex flex-col gap-2 pl-3 border-l-2 border-violet-200">
                <a
                  href="GIS Format Stock.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 text-sm text-violet-600 hover:underline"
                >
                  <Download size={13} className="shrink-0" />
                  GIS for Stock Corporation
                </a>
                <a
                  href="GIS Format Non Stock.xlsx"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 text-sm text-violet-600 hover:underline"
                >
                  <Download size={13} className="shrink-0" />
                  GIS for Non-Stock Corporation
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div>
              <div className="h-px bg-border mb-4" />
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide mb-3">
                Step 2. Fill-out the GIS
              </h3>
              <p className="text-sm text-muted-foreground">
                Watch this{' '}
                <a
                  href="https://www.awesomescreenshot.com/video/49154455?key=d3925a52fa26b0acca55c5768663d5c1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-violet-600 hover:underline font-medium"
                >
                  training video <ExternalLink size={12} />
                </a>.
              </p>
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
