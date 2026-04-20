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
import type { NotificationType } from '@/generated/prisma/client';

type NotifCategory = 'timesheet' | 'payroll' | 'leave' | 'portal' | 'system';

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=20');
      if (res.ok) {
        const json = (await res.json()) as { data: Notification[]; unreadCount: number };
        setNotifications(json.data);
        setUnreadCount(json.unreadCount);
      }
    } catch (err) {
      console.error('[NotificationDropdown] fetch error:', err);
    }
  };

  // Initial fetch
  useEffect(() => {
    void fetchNotifications();
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const perms = ROLE_PERMISSIONS[role] ?? [];
  const _isAdmin = perms.includes('*');

  const displayed = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const markRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationDropdown] mark read error:', err);
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
      console.error('[NotificationDropdown] mark all read error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (n: Notification) => {
    void markRead(n.id);
    if (n.linkUrl) router.push(n.linkUrl);
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
                  onClick={() => { void markAllRead(); }}
                  disabled={loading}
                  className="flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
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
                {f === 'all' ? `All (${notifications.length})` : `Unread (${unreadCount})`}
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
                const category = mapTypeToCategory(n.type);
                const meta = CATEGORY_META[category];
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-slate-50 transition-colors group ${
                      !n.isRead ? 'bg-indigo-50/30' : ''
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
                        <span className="text-[10px] text-slate-400 shrink-0">{formatRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                    {!n.isRead && (
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
