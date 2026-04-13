'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Users, FolderOpen, BarChart3, UserCircle,
  DollarSign, BarChart2, FilePen, ChevronDown, Settings,
} from 'lucide-react';

const PAYMENT_CHILDREN = [
  { id: 'payment-monitoring', label: 'Payment Monitoring', href: '/portal/compliance/payment-monitoring', icon: BarChart2 },
  { id: 'payment-recording',  label: 'Payment Recording',  href: '/portal/compliance/payment-recording',  icon: FilePen  },
];

const COMPLIANCE_NAV_ITEMS = [
  { id: 'dashboard',           label: 'Dashboard',          icon: LayoutDashboard, href: '/portal/compliance' },
  { id: 'management',          label: 'MANAGEMENT',         isSection: true },
  { id: 'tasks',               label: 'Task Board System',  icon: ClipboardList,   href: '/portal/compliance/tasks' },
  { id: 'client-compliances',  label: 'Client Compliances', icon: Users,           href: '/portal/compliance/client-compliances' },
  { id: 'open-cases',          label: 'Open Cases',         icon: FolderOpen,      href: '/portal/compliance/open-case' },
  { id: 'analytics',           label: 'ANALYTICS',          isSection: true },
  { id: 'reports',             label: 'Reports',            icon: BarChart3,       href: '/portal/compliance/reports' },
];

interface ComplianceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComplianceSidebar({ isOpen, onClose }: ComplianceSidebarProps) {
  const pathname  = usePathname();
  const router    = useRouter();

  const isPaymentActive = PAYMENT_CHILDREN.some(c => pathname === c.href);
  const [paymentOpen, setPaymentOpen] = useState(isPaymentActive);

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
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
              <UserCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Compliance
              </h2>
              <p className="text-xs text-slate-500">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {COMPLIANCE_NAV_ITEMS.map((item) => {
            if (item.isSection) {
              return (
                <React.Fragment key={item.id}>
                  {/* Insert Payment System group just before the ANALYTICS section header */}
                  {item.id === 'analytics' && (
                    <div className="space-y-0.5">
                      <button
                        onClick={() => setPaymentOpen(o => !o)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${isPaymentActive
                            ? 'bg-emerald-600/10 text-emerald-700 font-bold'
                            : 'text-slate-600 hover:bg-slate-50 font-medium'
                          }
                        `}
                      >
                        <DollarSign size={18} />
                        <span className="text-sm flex-1 text-left">Payment System</span>
                        <ChevronDown
                          size={14}
                          className={`transition-transform duration-200 ${paymentOpen ? 'rotate-180' : ''}`}
                        />
                      </button>

                      {paymentOpen && (
                        <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
                          {PAYMENT_CHILDREN.map(child => {
                            const isChildActive = pathname === child.href;
                            const ChildIcon = child.icon;
                            return (
                              <button
                                key={child.id}
                                onClick={() => handleNavigation(child.href)}
                                className={`
                                  w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all text-left
                                  ${isChildActive
                                    ? 'bg-emerald-600/10 text-emerald-700 font-bold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                  }
                                `}
                              >
                                <ChildIcon size={15} />
                                <span className="text-sm">{child.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="pt-6 pb-2">
                    <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      {item.label}
                    </span>
                  </div>
                </React.Fragment>
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
                    ? 'bg-emerald-600/10 text-emerald-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer — Settings */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => handleNavigation('/portal/compliance/settings')}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${pathname.startsWith('/portal/compliance/settings')
                ? 'bg-emerald-600/10 text-emerald-700 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-50 font-medium'
              }
            `}
          >
            <Settings size={18} />
            <span className="text-sm flex-1 text-left">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
