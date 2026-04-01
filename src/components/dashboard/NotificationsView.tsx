'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { ROLE_PERMISSIONS } from '@/lib/constants';
import {
  Bell, Clock, Wallet, FileCheck, Globe, Settings,
  CheckCheck, Trash2, ArrowLeft,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';

type NotifCategory = 'timesheet' | 'payroll' | 'leave' | 'portal' | 'system';
type FilterTab = 'all' | 'unread' | NotifCategory;

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
  { label: string; icon: React.ReactNode; textColor: string; bgColor: string; badgeVariant: 'info' | 'warning' | 'success' | 'neutral' | 'danger' }
> = {
  timesheet: { label: 'Timesheet', icon: <Clock size={16} />,    textColor: 'text-sky-600',     bgColor: 'bg-sky-50',     badgeVariant: 'info'    },
  payroll:   { label: 'Payroll',   icon: <Wallet size={16} />,    textColor: 'text-amber-600',   bgColor: 'bg-amber-50',   badgeVariant: 'warning' },
  leave:     { label: 'Leave',     icon: <FileCheck size={16} />, textColor: 'text-emerald-600', bgColor: 'bg-emerald-50', badgeVariant: 'success' },
  portal:    { label: 'Portal',    icon: <Globe size={16} />,     textColor: 'text-indigo-600',  bgColor: 'bg-indigo-50',  badgeVariant: 'info'    },
  system:    { label: 'System',    icon: <Settings size={16} />,  textColor: 'text-slate-500',   bgColor: 'bg-slate-100',  badgeVariant: 'neutral' },
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'timesheet', label: 'Timesheet' },
  { key: 'payroll', label: 'Payroll' },
  { key: 'leave', label: 'Leave' },
  { key: 'portal', label: 'Portal' },
  { key: 'system', label: 'System' },
];

export function NotificationsView() {
  const { role } = useRole();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const perms = ROLE_PERMISSIONS[role] ?? [];
  const isAdmin = perms.includes('*');
  const isHRManager = role === 'HR' || isAdmin;

  const visible = notifications.filter(n => {
    if (n.hrManagerOnly) return isHRManager;
    if (!n.requiredPermission) return true;
    return isAdmin || perms.includes(n.requiredPermission);
  });

  const displayed = (() => {
    if (filter === 'all') return visible;
    if (filter === 'unread') return visible.filter(n => !n.read);
    return visible.filter(n => n.category === filter);
  })();

  const unreadCount = visible.filter(n => !n.read).length;

  const markRead = (id: string) =>
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const clearRead = () =>
    setNotifications(prev => prev.filter(n => !n.read));

  const handleClick = (n: Notification) => {
    markRead(n.id);
    if (n.href) router.push(n.href);
  };

  const getCategoryCount = (cat: FilterTab) => {
    if (cat === 'all') return visible.length;
    if (cat === 'unread') return unreadCount;
    return visible.filter(n => n.category === cat).length;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-9 w-9 p-0"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h2 className="text-2xl font-black text-foreground">Notifications</h2>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              className="text-xs h-9 gap-1.5"
              onClick={markAllRead}
            >
              <CheckCheck size={14} />
              Mark all as read
            </Button>
          )}
          {visible.some(n => n.read) && (
            <Button
              variant="outline"
              className="text-xs h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={clearRead}
            >
              <Trash2 size={14} />
              Clear read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <Card className="p-1.5 border-border">
        <div className="flex gap-1 overflow-x-auto">
          {FILTER_TABS.map(tab => {
            const count = getCategoryCount(tab.key);
            const isActive = filter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.label}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Notification List */}
      <Card className="border-border overflow-hidden divide-y divide-border">
        {displayed.length === 0 ? (
          <div className="py-20 text-center">
            <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">
              No {filter === 'unread' ? 'unread ' : filter !== 'all' ? `${filter} ` : ''}notifications
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {filter !== 'all'
                ? 'Try selecting a different filter.'
                : "You're all caught up!"}
            </p>
          </div>
        ) : (
          displayed.map(n => {
            const meta = CATEGORY_META[n.category];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-5 py-4 flex gap-4 items-start transition-colors group ${
                  !n.read
                    ? 'bg-indigo-50/40 hover:bg-indigo-50/70'
                    : 'hover:bg-muted/50'
                }`}
              >
                {/* Category Icon */}
                <span
                  className={`mt-0.5 shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${meta.bgColor} ${meta.textColor}`}
                >
                  {meta.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {n.title}
                    </span>
                    <Badge variant={meta.badgeVariant} className="text-[10px] shrink-0">
                      {meta.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">{n.time}</p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <span className="mt-3 shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-500" />
                )}
              </button>
            );
          })
        )}
      </Card>
    </div>
  );
}
