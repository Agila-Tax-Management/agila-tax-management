'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Users, FolderOpen, BarChart3, UserCircle
} from 'lucide-react';

const COMPLIANCE_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/compliance' },
  {
    id: 'management',
    label: 'MANAGEMENT',
    isSection: true,
  },
  { id: 'tasks', label: 'Task Board System', icon: ClipboardList, href: '/portal/compliance/tasks' },
  { id: 'client-compliances', label: 'Client Compliances', icon: Users, href: '/portal/compliance/client-compliances' },
  { id: 'open-cases', label: 'Open Cases', icon: FolderOpen, href: '/portal/compliance/open-case' },
  {
    id: 'analytics',
    label: 'ANALYTICS',
    isSection: true,
  },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/portal/compliance/reports' },
];

interface ComplianceSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ComplianceSidebar({ isOpen, onClose }: ComplianceSidebarProps) {
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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {COMPLIANCE_NAV_ITEMS.map((item) => {
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
      </aside>
    </>
  );
}
