'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Users, MessageSquare,
  Bell, UserCircle, DollarSign
} from 'lucide-react';
import { INITIAL_AO_TASKS, INITIAL_AO_NOTIFICATIONS, INITIAL_AO_DISCUSSIONS } from '@/lib/mock-ao-data';

// Mock badge counts derived from mock data
const TASK_BADGE_COUNT = INITIAL_AO_TASKS.filter(t => t.status !== 'Done').length;
const NOTIF_BADGE_COUNT = INITIAL_AO_NOTIFICATIONS.filter(n => !n.isRead).length;
const DISCUSSION_BADGE_COUNT = (() => {
  // Count client messages that came after the last AO reply per thread
  const clientIds = [...new Set(INITIAL_AO_DISCUSSIONS.map(m => m.clientId))];
  let total = 0;
  for (const cid of clientIds) {
    const msgs = INITIAL_AO_DISCUSSIONS.filter(m => m.clientId === cid);
    const lastAO = msgs
      .filter(m => m.senderRole === 'account-officer')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    if (!lastAO) {
      total += msgs.filter(m => m.senderRole === 'client').length;
    } else {
      total += msgs.filter(m => m.senderRole === 'client' && new Date(m.createdAt) > new Date(lastAO.createdAt)).length;
    }
  }
  return total;
})();

const AO_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/account-officer', badge: 0 },
  {
    id: 'management',
    label: 'MANAGEMENT',
    isSection: true,
  },
  { id: 'tasks', label: 'Task Board', icon: ClipboardList, href: '/portal/account-officer/tasks', badge: TASK_BADGE_COUNT },
  { id: 'clients', label: 'Clients', icon: Users, href: '/portal/account-officer/clients', badge: 0 },
];

interface AOSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AOSidebar({ isOpen, onClose }: AOSidebarProps) {
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
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <span className="min-w-5 h-5 px-1.5 bg-[#25238e] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
                    {item.badge}
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
