'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { ROLE_PERMISSIONS } from '@/lib/constants';
import {
  Bell, Clock, Wallet, FileCheck, Globe, Settings,
  CheckCheck, X, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/UI/button';

type NotifCategory = 'timesheet' | 'payroll' | 'leave' | 'portal' | 'system';

interface Notification {
  id: string;
  category: NotifCategory;
  title: string;
  message: string;
  time: string;
  read: boolean;
  requiredPermission?: string;
  hrManagerOnly?: boolean;
  href?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'ts1', category: 'timesheet',
    title: 'Time In Reminder',
    message: "Don't forget to clock in! Office hours start at 8:00 AM.",
    time: '8 mins ago', read: false,
    requiredPermission: 'timesheet', href: '/dashboard/timesheet',
  },
  {
    id: 'ts2', category: 'timesheet',
    title: 'Cut-Off Day Reminder',
    message: 'Today is Friday — submit all pending timesheets by 12:00 NN.',
    time: '1 hr ago', read: false,
    requiredPermission: 'timesheet', href: '/dashboard/timesheet',
  },
  {
    id: 'pr1', category: 'payroll',
    title: 'Payroll Released',
    message: 'Your payslip for Feb 16–28, 2026 is now available.',
    time: '2 days ago', read: false,
    requiredPermission: 'payslips', href: '/dashboard/payslips',
  },
  {
    id: 'pr2', category: 'payroll',
    title: 'Upcoming Payroll: Mar 20',
    message: 'Next payroll release is on March 20, 2026.',
    time: '3 days ago', read: true,
    requiredPermission: 'payslips', href: '/dashboard/payslips',
  },
  {
    id: 'lv1', category: 'leave',
    title: 'Leave Approved',
    message: 'Your leave request for Mar 10–11 has been approved by HR.',
    time: '5 hrs ago', read: false,
    requiredPermission: 'hr-apps', href: '/dashboard/hr-apps',
  },
  {
    id: 'lv2', category: 'leave',
    title: '3 Leave Requests Pending',
    message: '3 leave requests are awaiting your approval in the HR portal.',
    time: '1 hr ago', read: false,
    hrManagerOnly: true, href: '/portals/hr/leaves',
  },
  {
    id: 'p1', category: 'portal',
    title: 'Sales Portal — New Leads',
    message: '5 new leads have been assigned to you today.',
    time: '30 mins ago', read: false,
    requiredPermission: 'asp', href: '/portals/sales',
  },
  {
    id: 'p2', category: 'portal',
    title: 'Compliance Portal — Due Soon',
    message: '2 filings are due within the next 3 days.',
    time: '2 hrs ago', read: false,
    requiredPermission: 'compliance', href: '/portals/compliance',
  },
  {
    id: 'p3', category: 'portal',
    title: 'Liaison Portal',
    message: 'A new client inquiry has been received from Cebu.',
    time: '4 hrs ago', read: true,
    requiredPermission: 'liaison', href: '/portals/liaison',
  },
  {
    id: 'p4', category: 'portal',
    title: 'PCF Portal',
    message: 'February budget report is ready for your review.',
    time: '1 day ago', read: true,
    requiredPermission: 'pcf', href: '/portals/pcf',
  },
  {
    id: 'p5', category: 'portal',
    title: 'HR Portal — Recruitment',
    message: '2 new applicants submitted their requirements for review.',
    time: '3 hrs ago', read: false,
    requiredPermission: 'teams', href: '/portals/hr/recruitment',
  },
  {
    id: 'sy1', category: 'system',
    title: 'System Update',
    message: "ATMS Hub v2.1 is live — new dashboard features and fixes.",
    time: '2 days ago', read: true,
  },
];

const CATEGORY_META: Record<
  NotifCategory,
  { icon: React.ReactNode; textColor: string; bgColor: string }
> = {
  timesheet: { icon: <Clock size={14} />,      textColor: 'text-sky-600',     bgColor: 'bg-sky-50'     },
  payroll:   { icon: <Wallet size={14} />,      textColor: 'text-amber-600',   bgColor: 'bg-amber-50'   },
  leave:     { icon: <FileCheck size={14} />,   textColor: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  portal:    { icon: <Globe size={14} />,       textColor: 'text-indigo-600',  bgColor: 'bg-indigo-50'  },
  system:    { icon: <Settings size={14} />,    textColor: 'text-slate-500',   bgColor: 'bg-slate-100'  },
};

export function NotificationDropdown() {
  const { role } = useRole();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const perms = ROLE_PERMISSIONS[role] ?? [];
  const isAdmin = perms.includes('*');
  const isHRManager = role === 'HR' || isAdmin;

  const visible = notifications.filter(n => {
    if (n.hrManagerOnly) return isHRManager;
    if (!n.requiredPermission) return true;
    return isAdmin || perms.includes(n.requiredPermission);
  });

  const displayed = filter === 'unread' ? visible.filter(n => !n.read) : visible;
  const unreadCount = visible.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen(o => !o)}>
        <div className="relative">
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-4 h-4 px-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell size={15} className="text-slate-500" />
              <span className="font-semibold text-slate-800 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded-full leading-none">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-100">
            {(['all', 'unread'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                    : 'text-slate-400 hover:text-slate-600 bg-slate-50'
                }`}
              >
                {f === 'all' ? `All (${visible.length})` : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          <div className="max-h-95 overflow-y-auto divide-y divide-slate-50">
            {displayed.length === 0 ? (
              <div className="py-14 text-center">
                <Bell size={28} className="mx-auto mb-2 text-slate-200" />
                <p className="text-xs text-slate-400">
                  No {filter === 'unread' ? 'unread ' : ''}notifications
                </p>
              </div>
            ) : (
              displayed.map(n => {
                const meta = CATEGORY_META[n.category];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50 transition-colors group ${
                      !n.read ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    <span
                      className={`mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${meta.bgColor} ${meta.textColor}`}
                    >
                      {meta.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-slate-800 truncate">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-2 shrink-0 w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5">
            <button
              onClick={() => { router.push('/dashboard/notifications'); setOpen(false); }}
              className="w-full text-[11px] text-center text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-1"
            >
              View all notifications <ChevronRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
