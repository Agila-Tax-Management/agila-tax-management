'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, CreditCard, FileText, Receipt,
  BarChart3, Calculator,
} from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { INITIAL_PAYMENTS } from '@/lib/mock-accounting-data';

const pendingCount = INITIAL_PAYMENTS.filter(p => p.status === 'Pending' || p.status === 'Overdue').length;

const ACCOUNTING_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/accounting' },
  {
    id: 'operations',
    label: 'OPERATIONS',
    isSection: true,
  },
  { id: 'payments', label: 'Payments', icon: CreditCard, href: '/portal/accounting/payments', badge: pendingCount },
  { id: 'invoices', label: 'Invoices', icon: FileText, href: '/portal/accounting/invoices' },
  { id: 'billing', label: 'Billing', icon: Receipt, href: '/portal/accounting/billing' },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    isSection: true,
  },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/portal/accounting/reports' },
];

interface AccountingSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountingSidebar({ isOpen, onClose }: AccountingSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 bg-white border-r border-slate-200 transition-transform duration-300
          flex flex-col h-full overflow-hidden
        `}
      >
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
              <Calculator size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Accounting
              </h2>
              <p className="text-xs text-slate-500">Finance Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {ACCOUNTING_NAV_ITEMS.map((item) => {
            if (item.isSection) {
              return (
                <div key={item.id} className="pt-6 pb-2">
                  <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => item.href && handleNavigation(item.href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-amber-600/10 text-amber-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
