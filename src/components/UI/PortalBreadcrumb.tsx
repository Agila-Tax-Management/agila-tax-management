// src/components/UI/PortalBreadcrumb.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

const MODULE_LABELS: Record<string, string> = {
  sales: 'Sales Portal',
  compliance: 'Compliance Portal',
  accounting: 'Accounting Portal',
  hr: 'HR Portal',
  liaison: 'Liaison Portal',
  'account-officer': 'Account Officer Portal',
  'task-management': 'Task Management Portal',
};

function toLabel(segment: string): string {
  if (MODULE_LABELS[segment]) return MODULE_LABELS[segment];
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function PortalBreadcrumb() {
  const pathname = usePathname();

  const parts = pathname.split('/').filter(Boolean);
  const portalIndex = parts.indexOf('portal');
  if (portalIndex === -1) return null;

  const segments = parts.slice(portalIndex + 1);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => {
    const path = '/' + parts.slice(0, portalIndex + 1 + i + 1).join('/');
    const label = i === 0 ? (MODULE_LABELS[segment] ?? toLabel(segment)) : toLabel(segment);
    const isLast = i === segments.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1 min-w-0">
          {i > 0 && <ChevronRight size={14} className="text-slate-400 shrink-0" />}
          {crumb.isLast ? (
            <span className="text-slate-700 font-medium truncate">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.path}
              className="text-slate-500 hover:text-slate-700 transition-colors truncate"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
