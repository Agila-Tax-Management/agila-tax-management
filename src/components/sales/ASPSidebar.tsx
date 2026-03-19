'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, Briefcase, List, Wallet,
  ShoppingBag, BarChart3, ChevronDown, ChevronUp,
  CalendarClock, FileText, TicketPercent, Settings
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon?: typeof LayoutDashboard;
  href?: string;
  isSection?: boolean;
  isDropdown?: boolean;
  children?: { id: string; label: string; icon: typeof LayoutDashboard; href: string }[];
}

const ASP_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/sales' },
  {
    id: 'management',
    label: 'MANAGEMENT',
    isSection: true,
  },
  { id: 'leads', label: 'Leads Center', icon: Users, href: '/portal/sales/lead-center' },
  {
    id: 'services',
    label: 'Services',
    icon: Briefcase,
    isDropdown: true,
    children: [
      { id: 'monthly-services', label: 'Monthly Service Plans', icon: CalendarClock, href: '/portal/sales/services/monthly' },
      { id: 'one-time-services', label: 'One-Time Service Plans', icon: FileText, href: '/portal/sales/services/one-time' },
      { id: 'promotions', label: 'Promotions', icon: TicketPercent, href: '/portal/sales/services/promotions' },
    ],
  },
  { id: 'client-list', label: 'Client List', icon: List, href: '/portal/sales/client-list' },
  { id: 'commissions', label: 'Commissions', icon: Wallet, href: '/portal/sales/commissions' },
  { id: 'after-sales', label: 'After Sales', icon: ShoppingBag, href: '/portal/sales/after-sales' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/portal/sales/reports' },
];

interface ASPSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ASPSidebar({ isOpen, onClose }: ASPSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [servicesOpen, setServicesOpen] = useState(pathname.startsWith('/portal/sales/services'));

  const handleNavigation = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* ASP Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          w-64 bg-white border-r border-slate-200 transition-transform duration-300
          flex flex-col h-full overflow-hidden
        `}
      >
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                ASP Sales
              </h2>
              <p className="text-xs text-slate-500">Sales Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {ASP_NAV_ITEMS.map((item) => {
            if (item.isSection) {
              return (
                <div key={item.id} className="pt-6 pb-2">
                  <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              );
            }

            // Dropdown item (Services, etc.)
            if (item.isDropdown && item.children) {
              const Icon = item.icon!;
              const isChildActive = item.children.some(c => pathname === c.href);
              const isOpen = item.id === 'services' ? servicesOpen : false;
              const toggleOpen = item.id === 'services' ? setServicesOpen : null;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => toggleOpen && toggleOpen(prev => !prev)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${isChildActive
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }
                    `}
                  >
                    <Icon size={18} />
                    <span className="text-sm flex-1 text-left">{item.label}</span>
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {isOpen && (
                    <div className="ml-7 mt-1 space-y-1">
                      {item.children.map(child => {
                        const ChildIcon = child.icon;
                        const isActive = pathname === child.href;
                        return (
                          <button
                            key={child.id}
                            onClick={() => handleNavigation(child.href)}
                            className={`
                              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left
                              ${isActive
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                              }
                            `}
                          >
                            <ChildIcon size={16} />
                            <span className="text-xs">{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon!;

            return (
              <button
                key={item.id}
                onClick={() => item.href && handleNavigation(item.href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-blue-50 text-blue-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Settings Footer */}
        <div className="border-t border-slate-200 p-4 shrink-0">
          <button
            onClick={() => handleNavigation('/portal/sales/settings')}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${pathname === '/portal/sales/settings'
                ? 'bg-blue-50 text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-50 font-medium'
              }
            `}
          >
            <Settings size={18} />
            <span className="text-sm">Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
