// src/components/it/ITSidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Ticket, ShieldCheck, Activity,
  ClipboardList, HardDrive, Settings, Monitor, FileClock,
  ChevronDown, Users, History, ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/UI/Badge';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  href?: string;
  isSection?: boolean;
  isGroup?: boolean;
  children?: NavItem[];
}

const IT_NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/it' },
  { id: 'section-ops', label: 'OPERATIONS', isSection: true },
  { id: 'tickets', label: 'Ticketing System', icon: Ticket, href: '/portal/it/tickets' },
  {
    id: 'access-management',
    label: 'Access Management',
    icon: ShieldCheck,
    isGroup: true,
    children: [
      { id: 'access-requests', label: 'Requests', icon: ShieldAlert, href: '/portal/it/access-requests' },
      { id: 'access-active', label: 'Active Access', icon: Users, href: '/portal/it/access-management/active' },
      { id: 'access-history', label: 'Access History', icon: History, href: '/portal/it/access-management/history' },
    ],
  },
  { id: 'system-status', label: 'System Status', icon: Activity, href: '/portal/it/system-status' },
  { id: 'section-mgmt', label: 'MANAGEMENT', isSection: true },
  { id: 'task-board', label: 'Task Board', icon: ClipboardList, href: '/portal/it/task-board' },
  { id: 'assets', label: 'Asset Management', icon: HardDrive, href: '/portal/it/assets' },
  { id: 'audit', label: 'Audit Monitoring', icon: FileClock, href: '/portal/it/audit' },
];

interface ITSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ITSidebar({ isOpen, onClose }: ITSidebarProps) {
  const [canAccessSettings, setCanAccessSettings] = useState(false);

  useEffect(() => {
    fetch('/api/auth/portal-access?portal=IT_MANAGEMENT')
      .then((r) => (r.ok ? r.json() : null))
      .then((json: { role: string | null; userRole: string } | null) => {
        if (json && (json.userRole === 'SUPER_ADMIN' || json.userRole === 'ADMIN')) {
          setCanAccessSettings(true);
        }
      })
      .catch(() => { /* hide by default */ });
  }, []);
  const pathname = usePathname();
  const router = useRouter();
  const [openTickets, setOpenTickets] = useState(0);
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0);

  // auto-expand Access Management group when on any of its child routes
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => ({
    'access-management':
      pathname.startsWith('/portal/it/access-requests') ||
      pathname.startsWith('/portal/it/access-management'),
  }));

  useEffect(() => {
    fetch('/api/it/sidebar', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setOpenTickets(d.data.openTickets ?? 0);
          setPendingAccessRequests(d.data.pendingAccessRequests ?? 0);
        }
      })
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
        {/* Header */}
        <div className="p-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-700 rounded-xl flex items-center justify-center">
              <Monitor size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                IT Portal
              </h2>
              <p className="text-xs text-slate-500">IT Management</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {IT_NAV_ITEMS.map((item) => {
            // Section header
            if (item.isSection) {
              return (
                <div key={item.id} className="pt-6 pb-2">
                  <span className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              );
            }

            // Collapsible group
            if (item.isGroup) {
              const GroupIcon = item.icon;
              const isExpanded = expandedGroups[item.id] ?? false;
              const hasActiveChild = item.children?.some((c) =>
                c.href && pathname.startsWith(c.href),
              ) ?? false;

              return (
                <div key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedGroups((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                    }
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${hasActiveChild
                        ? 'bg-cyan-700/10 text-cyan-800 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 font-medium'
                      }
                    `}
                  >
                    {GroupIcon && <GroupIcon size={18} />}
                    <span className="text-sm flex-1 text-left">{item.label}</span>
                    {item.id === 'access-management' && pendingAccessRequests > 0 && (
                      <Badge variant="warning" className="text-[9px] px-1.5 py-0.5">
                        {pendingAccessRequests}
                      </Badge>
                    )}
                    <ChevronDown
                      size={15}
                      className={`transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="mt-0.5 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                      {item.children?.map((child) => {
                        const childHref = child.href ?? '';
                        const childActive = childHref.startsWith('/portal/it/access-management/')
                          ? pathname.startsWith(childHref)
                          : pathname === childHref || pathname.startsWith(childHref + '/');
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => { router.push(childHref); onClose(); }}
                            className={`
                              w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all
                              ${childActive
                                ? 'bg-cyan-700/10 text-cyan-800 font-semibold'
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700 font-medium'
                              }
                            `}
                          >
                            {ChildIcon && <ChildIcon size={15} />}
                            <span className="text-xs flex-1 text-left">{child.label}</span>
                            {child.id === 'access-requests' && pendingAccessRequests > 0 && (
                              <Badge variant="warning" className="text-[9px] px-1.5 py-0.5">
                                {pendingAccessRequests}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Regular nav item
            const href = item.href ?? '';
            const isActive =
              href === '/portal/it' ? pathname === href : pathname.startsWith(href);
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => href && handleNavigation(href)}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${isActive
                    ? 'bg-cyan-700/10 text-cyan-800 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {item.id === 'tickets' && openTickets > 0 && (
                  <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                    {openTickets}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Settings footer */}
        {canAccessSettings && (
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            onClick={() => handleNavigation('/portal/it/settings')}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
              ${pathname === '/portal/it/settings'
                ? 'bg-cyan-700/10 text-cyan-800 shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-50 font-medium'
              }
            `}
          >
            <Settings size={18} />
            <span className="text-sm flex-1 text-left">Settings</span>
          </button>
        </div>
        )}
      </aside>
    </>
  );
}
