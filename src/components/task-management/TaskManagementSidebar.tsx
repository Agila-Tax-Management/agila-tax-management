// src/components/task-management/TaskManagementSidebar.tsx
'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, Shield, Truck, FolderKanban, Settings2, Handshake, UserCog,
  Building2, Calculator, Users,
  type LucideIcon,
} from 'lucide-react';
import { ALL_TASKS } from '@/lib/mock-task-management-data';
import type { TaskSource } from '@/lib/mock-task-management-data';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';

const activeTasks = ALL_TASKS.filter(t => t.status !== 'Done');

const DEPT_TO_NAV_RAW: Array<{ aliases: string[]; route: string; icon: LucideIcon; source: TaskSource }> = [
  { aliases: ['operations manager', 'om'],              route: '/portal/task-management/om',               icon: UserCog,    source: 'om' },
  { aliases: ['client relations', 'client-relations'],  route: '/portal/task-management/client-relations', icon: Handshake,  source: 'client-relations' },
  { aliases: ['liaison'],                               route: '/portal/task-management/liaison',          icon: Truck,      source: 'liaison' },
  { aliases: ['compliance'],                            route: '/portal/task-management/compliance',       icon: Shield,     source: 'compliance' },
  { aliases: ['admin', 'administration', 'administrator'], route: '/portal/task-management/admin',         icon: Building2,  source: 'admin' },
  { aliases: ['accounting', 'accounts'],                route: '/portal/task-management/accounting',       icon: Calculator, source: 'accounting' },
  { aliases: ['human resources', 'hr', 'human resource'], route: '/portal/task-management/hr',             icon: Users,      source: 'hr' },
];

// Build a flat lowercase-keyed lookup map
const DEPT_NAV_MAP = new Map<string, { route: string; icon: LucideIcon; source: TaskSource }>();
for (const entry of DEPT_TO_NAV_RAW) {
  const { aliases, ...cfg } = entry;
  for (const alias of aliases) DEPT_NAV_MAP.set(alias, cfg);
}

function lookupDeptNav(name: string) {
  return DEPT_NAV_MAP.get(name.toLowerCase().trim());
}

type SectionItem = { id: string; label: string; isSection: true };
type NavItem   = { id: string; label: string; icon: LucideIcon; href: string; badge: number; isSection?: never };
type SidebarItem = SectionItem | NavItem;

interface TaskManagementSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskManagementSidebar({ isOpen, onClose }: TaskManagementSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { departments } = useTaskDepartments();

  const navItems = useMemo((): SidebarItem[] => {
    const deptItems = departments.map(dept => {
      const cfg = lookupDeptNav(dept.name);
      const badge = cfg
        ? ALL_TASKS.filter(t => t.source === cfg.source && t.status !== 'Done').length
        : 0;
      return {
        id: `dept-${dept.id}`,
        label: dept.name,
        icon: (cfg?.icon ?? FolderKanban) as LucideIcon,
        href: cfg?.route ?? `/portal/task-management/tasks?dept=${dept.id}`,
        badge,
      };
    });
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard as LucideIcon, href: '/portal/task-management', badge: 0 },
      { id: 'section-depts', label: 'DEPARTMENTS', isSection: true as const },
      { id: 'all-tasks', label: 'All Tasks', icon: FolderKanban as LucideIcon, href: '/portal/task-management/tasks', badge: activeTasks.length },
      ...deptItems,
    ];
  }, [departments]);

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

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {navItems.map((item) => {
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

        {/* Footer — Settings shortcut */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            onClick={() => handleNavigation('/portal/task-management/settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              pathname === '/portal/task-management/settings'
                ? 'bg-[#0f766e]/10 text-[#0f766e] font-bold'
                : 'text-slate-500 hover:bg-slate-50 font-medium'
            }`}
          >
            <Settings2 size={18} />
            <span className="text-sm">Task Settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
