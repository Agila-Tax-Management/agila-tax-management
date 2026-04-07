// src/components/UI/Breadcrumb.tsx
'use client';

import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }): React.ReactNode {
  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 flex-wrap">
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight size={12} className="text-slate-300 shrink-0" />}
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="text-sm text-slate-400 hover:text-slate-700 font-medium transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="text-sm text-slate-800 font-semibold">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
