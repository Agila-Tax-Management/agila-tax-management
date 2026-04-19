// src/components/task-management/TaskManagementSidebar.tsx
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard, ClipboardList, FolderKanban, Settings2,
  type LucideIcon,
} from 'lucide-react';
import { useTaskDepartments } from '@/context/TaskDepartmentsContext';
import { useTaskManagementRole } from '@/context/TaskManagementRoleContext';

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
  const searchParams = useSearchParams();
  const { departments } = useTaskDepartments();
  const { canAccessSettings } = useTaskManagementRole();

  // ── Real task counts from API ──────────────────────────────────────
  const [deptActiveCounts, setDeptActiveCounts] = useState<Map<number, number>>(new Map());
  const [totalActiveCount, setTotalActiveCount] = useState(0);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => r.ok ? r.json() : null)
      .then((json: { data: Array<{ currentStatus: { name: string } | null; currentDepartment: { id: number } | null }> } | null) => {
        if (!json) return;
        const active = json.data.filter(t => {
          const name = t.currentStatus?.name?.toLowerCase() ?? '';
          return !name.includes('done') && !name.includes('complet');
        });
        setTotalActiveCount(active.length);
        const map = new Map<number, number>();
        for (const t of active) {
          if (t.currentDepartment?.id) {
            map.set(t.currentDepartment.id, (map.get(t.currentDepartment.id) ?? 0) + 1);
          }
        }
        setDeptActiveCounts(map);
      })
      .catch(() => undefined);
  }, []);

  const navItems = useMemo((): SidebarItem[] => {
    const deptItems: NavItem[] = departments.map(dept => ({
      id: `dept-${dept.id}`,
      label: dept.name,
      icon: FolderKanban as LucideIcon,
      href: `/portal/task-management/tasks?dept=${dept.id}`,
      badge: deptActiveCounts.get(dept.id) ?? 0,
    }));
    return [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard as LucideIcon, href: '/portal/task-management', badge: 0 },
      { id: 'section-depts', label: 'DEPARTMENTS', isSection: true as const },
      { id: 'all-tasks', label: 'All Tasks', icon: FolderKanban as LucideIcon, href: '/portal/task-management/tasks', badge: totalActiveCount },
      ...deptItems,
    ];
  }, [departments, deptActiveCounts, totalActiveCount]);

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

            const Icon = item.icon;

            // All Tasks is active only when on /tasks with no dept query param.
            // Dept-fallback items (href has ?dept=) are active when pathname AND dept param both match.
            // All other items use exact pathname match.
            let isActive: boolean;
            if (item.href.includes('?dept=')) {
              const [hrefPath, hrefQuery] = item.href.split('?');
              const hrefDeptId = new URLSearchParams(hrefQuery).get('dept');
              isActive = pathname === hrefPath && searchParams.get('dept') === hrefDeptId;
            } else if (item.id === 'all-tasks') {
              isActive = pathname === item.href && !searchParams.get('dept');
            } else {
              isActive = pathname === item.href;
            }

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

        {/* Footer — Settings shortcut (only visible to SETTINGS role) */}
        {canAccessSettings && (
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
        )}
      </aside>
    </>
  );
}
