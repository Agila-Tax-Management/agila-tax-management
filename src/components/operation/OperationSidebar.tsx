// src/components/operation/OperationSidebar.tsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, ClipboardList, FileText, Cog } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type NavSection = { id: string; label: string; isSection: true };
type NavLink = { id: string; label: string; icon: LucideIcon; href: string; isSection?: never };
type SidebarItem = NavSection | NavLink;

const NAV_ITEMS: SidebarItem[] = [
  { id: 'dashboard',    label: 'Dashboard',              icon: LayoutDashboard, href: '/portal/operation' },
  { id: 'section-mgmt', label: 'MANAGEMENT',             isSection: true },
  { id: 'client-list',  label: 'Client List',            icon: Users,           href: '/portal/operation/client-list' },
  { id: 'all-task',     label: 'All Tasks',              icon: ClipboardList,   href: '/portal/operation/all-task' },
  { id: 'requirements', label: 'List of Requirements',   icon: FileText,        href: '/portal/operation/list-of-requirements' },
];

interface OperationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OperationSidebar({ isOpen, onClose }: OperationSidebarProps) {
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
        {/* Logo Header */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-600 rounded-xl flex items-center justify-center">
              <Cog size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Operations
              </h2>
              <p className="text-xs text-slate-500">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {NAV_ITEMS.map((item) => {
            if ('isSection' in item && item.isSection) {
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
                onClick={() => handleNavigation(item.href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-amber-600/10 text-amber-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                <Icon size={18} />
                <span className="text-sm flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
