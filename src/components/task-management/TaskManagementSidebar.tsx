// src/components/task-management/TaskManagementSidebar.tsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Shield, Truck, FolderKanban, Settings2, Handshake, UserCog,
} from 'lucide-react';
import { ALL_TASKS } from '@/lib/mock-task-management-data';

const activeTasks = ALL_TASKS.filter(t => t.status !== 'Done');
const omBadge = ALL_TASKS.filter(t => t.source === 'om' && t.status !== 'Done').length;
const clientRelationsBadge = ALL_TASKS.filter(t => t.source === 'client-relations' && t.status !== 'Done').length;
const liaisonBadge = ALL_TASKS.filter(t => t.source === 'liaison' && t.status !== 'Done').length;
const complianceBadge = ALL_TASKS.filter(t => t.source === 'compliance' && t.status !== 'Done').length;

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/task-management', badge: 0 },
  {
    id: 'section-depts',
    label: 'DEPARTMENTS',
    isSection: true,
  },
  { id: 'all-tasks', label: 'All Tasks', icon: FolderKanban, href: '/portal/task-management/tasks', badge: activeTasks.length },
  { id: 'om-tasks', label: 'Operations Manager', icon: UserCog, href: '/portal/task-management/om', badge: omBadge },
  { id: 'client-relations', label: 'Client Relations', icon: Handshake, href: '/portal/task-management/client-relations', badge: clientRelationsBadge },
  { id: 'liaison-tasks', label: 'Liaison', icon: Truck, href: '/portal/task-management/liaison', badge: liaisonBadge },
  { id: 'compliance-tasks', label: 'Compliance', icon: Shield, href: '/portal/task-management/compliance', badge: complianceBadge },
  {
    id: 'section-settings',
    label: 'SETTINGS',
    isSection: true,
  },
  { id: 'settings', label: 'Task Settings', icon: Settings2, href: '/portal/task-management/settings', badge: 0 },
];

interface TaskManagementSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskManagementSidebar({ isOpen, onClose }: TaskManagementSidebarProps) {
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
            <div className="w-10 h-10 bg-[#0f766e] rounded-xl flex items-center justify-center">
              <ClipboardList size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Task Management
              </h2>
              <p className="text-xs text-slate-500">Unified Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
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
                    ? 'bg-[#0f766e]/10 text-[#0f766e] shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <span className="min-w-5 h-5 px-1.5 bg-[#0f766e] rounded-full flex items-center justify-center text-[10px] font-bold text-white">
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
