'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Users, CalendarDays, Star,
  Clock, Wallet, Landmark, FileQuestion, Heart,
} from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { getPendingLeaves, getOpenRequests } from '@/lib/mock-hr-data';

const pendingLeaves = getPendingLeaves().length;
const openRequests = getOpenRequests().length;

const HR_NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/portal/hr' },
  {
    id: 'people',
    label: 'PEOPLE',
    isSection: true,
  },
  { id: 'employees', label: 'Employee Management', icon: Users, href: '/portal/hr/employee-management' },
  { id: 'leaves', label: 'Leave Management', icon: CalendarDays, href: '/portal/hr/leave-management', badge: pendingLeaves },
  { id: 'performance', label: 'Performance', icon: Star, href: '/portal/hr/performance-management' },
  {
    id: 'operations',
    label: 'OPERATIONS',
    isSection: true,
  },
  { id: 'attendance', label: 'Attendance Tracking', icon: Clock, href: '/portal/hr/attendance-tracking' },
  { id: 'payroll', label: 'Payroll Coordination', icon: Wallet, href: '/portal/hr/payroll-coordination' },
  { id: 'gov-compliance', label: 'Gov Compliance', icon: Landmark, href: '/portal/hr/gov-compliance-tracking' },
  {
    id: 'support',
    label: 'SUPPORT',
    isSection: true,
  },
  { id: 'hr-requests', label: 'HR Requests', icon: FileQuestion, href: '/portal/hr/hr-request', badge: openRequests },
];

interface HRSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HRSidebar({ isOpen, onClose }: HRSidebarProps) {
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
            <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                Human Resources
              </h2>
              <p className="text-xs text-slate-500">HR Portal</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {HR_NAV_ITEMS.map((item) => {
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
                    ? 'bg-rose-600/10 text-rose-700 shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-50 font-medium'
                  }
                `}
              >
                {Icon && <Icon size={18} />}
                <span className="text-sm flex-1 text-left">{item.label}</span>
                {'badge' in item && item.badge !== undefined && item.badge > 0 && (
                  <Badge variant="danger" className="text-[9px] px-1.5 py-0.5">
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
