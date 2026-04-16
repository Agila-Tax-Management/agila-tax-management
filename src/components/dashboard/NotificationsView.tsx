'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { ROLE_PERMISSIONS } from '@/lib/constants';
import {
  Bell, Clock, Wallet, FileCheck, Globe, Settings,
  CheckCheck, Trash2, ArrowLeft, Loader2,
} from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';
import type { NotificationType } from '@/generated/prisma/client';

type NotifCategory = 'timesheet' | 'payroll' | 'leave' | 'portal' | 'system';
type FilterTab = 'all' | 'unread' | NotifCategory;

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  linkUrl: string | null;
  isRead: boolean;
  createdAt: string;
  priority: string;
}

// Map database NotificationType to UI category for icon/color selection
function mapTypeToCategory(type: NotificationType): NotifCategory {
  switch (type) {
    case 'HR':
      return 'leave';
    case 'PAYROLL':
      return 'payroll';
    case 'TASK':
      return 'portal';
    case 'DOCUMENT':
      return 'portal';
    case 'ANNOUNCEMENT':
      return 'system';
    case 'SYSTEM':
    default:
      return 'system';
  }
}

// Format relative time
function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} mins ago`;
  if (diffHours === 1) return '1 hr ago';
  if (diffHours < 24) return `${diffHours} hrs ago`;
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=50');
      if (res.ok) {
        const json = (await res.json()) as { data: Notification[]; unreadCount: number };
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (err) {
      console.error('[NotificationsView] fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, []);

  const perms = ROLE_PERMISSIONS[role] ?? [];
  const isAdmin = perms.includes('*');

  const displayed = (() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => mapTypeToCategory(n.type) === filter);
  })();

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationsView] mark read error:', err);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationsView] mark all read error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications/clear-all', { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => !n.isRead));
      void fetchNotifications(); // Refresh to get accurate state
    } catch (err) {
      console.error('[NotificationsView] clear read error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (n: Notification) => {
    void markRead(n.id);
    if (n.linkUrl) router.push(n.linkUrl);
  };

  const getCategoryCount = (cat: FilterTab) => {
    if (cat === 'all') return notifications.length;
    if (cat === 'unread') return unreadCount;
    return notifications.filter(n => mapTypeToCategory(n.type) === cat).length;
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
              onClick={() => { void markAllRead(); }}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
              Mark all as read
            </Button>
          )}
          {notifications.some(n => n.isRead) && (
            <Button
              variant="outline"
              className="text-xs h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => { void clearRead(); }}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
            {loading ? (
              <Loader2 size={40} className="mx-auto mb-3 text-muted-foreground/30 animate-spin" />
            ) : (
              <Bell size={40} className="mx-auto mb-3 text-muted-foreground/30" />
            )}
            <p className="text-sm font-medium text-muted-foreground">
              {loading ? 'Loading notifications...' : `No ${filter === 'unread' ? 'unread ' : filter !== 'all' ? `${filter} ` : ''}notifications`}
            </p>
            {!loading && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                {filter !== 'all'
                  ? 'Try selecting a different filter.'
                  : "You're all caught up!"}
              </p>
            )}
          </div>
        ) : (
          displayed.map(n => {
            const category = mapTypeToCategory(n.type);
            const meta = CATEGORY_META[category];
            return (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-5 py-4 flex gap-4 items-start transition-colors group ${
                  !n.isRead
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
                  <p className="text-[11px] text-muted-foreground/60 mt-1.5">{formatRelativeTime(n.createdAt)}</p>
                </div>

                {/* Unread dot */}
                {!n.isRead && (
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
