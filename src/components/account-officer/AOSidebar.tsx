'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Users,
  UserCircle,
} from 'lucide-react';
const AO_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/account-officer' },
  {
    id: 'management',
    label: 'MANAGEMENT',
    isSection: true,
  },
  { id: 'tasks', label: 'Task Board', icon: ClipboardList, href: '/portal/account-officer/tasks' },
  { id: 'clients', label: 'Clients', icon: Users, href: '/portal/account-officer/clients' },
];

interface AOSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AOSidebar({ isOpen, onClose }: AOSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [openTasksCount, setOpenTasksCount] = useState(0);

  useEffect(() => {
    fetch('/api/account-officer/sidebar', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (d.data?.openTasksCount) setOpenTasksCount(d.data.openTasksCount); })
      .catch(() => {});
  }, []);

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
            <div className="w-10 h-10 bg-[#25238e] rounded-xl flex items-center justify-center">
              <UserCircle size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Account Officer
              </h2>
              <p className="text-xs text-slate-500">Management Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {AO_NAV_ITEMS.map((item) => {
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
                    ? 'bg-[#25238e]/10 text-[#25238e] shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.id === 'tasks' && openTasksCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 bg-[#25238e] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {openTasksCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
