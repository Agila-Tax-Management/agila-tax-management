'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  Bell, CheckCheck, RefreshCw, MessageSquare,
  UserPlus, ArrowRightLeft, Filter,
} from 'lucide-react';
import { INITIAL_AO_NOTIFICATIONS } from '@/lib/mock-ao-data';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';
import type { AONotification } from '@/lib/types';

type NotifFilter = 'all' | 'unread' | 'status_change' | 'comment' | 'assignment' | 'message';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  status_change: { icon: ArrowRightLeft, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Status Change' },
  comment: { icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Comment' },
  assignment: { icon: UserPlus, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Assignment' },
  message: { icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Message' },
};

export function AONotifications() {
  const [notifications, setNotifications] = useState<AONotification[]>(INITIAL_AO_NOTIFICATIONS);
  const [filter, setFilter] = useState<NotifFilter>('all');

  const filteredNotifs = useMemo(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.isRead);
    return notifications.filter(n => n.type === filter);
  }, [notifications, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const getClientName = (clientId?: string) =>
    clientId ? INITIAL_CLIENTS.find(c => c.id === clientId)?.businessName ?? '' : '';

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date('2026-03-11T12:00:00Z');
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Notifications</h2>
          <p className="text-sm text-slate-500 font-medium">
            Stay updated on task changes, comments, and assignments.
            {unreadCount > 0 && <span className="text-[#25238e] font-bold ml-1">{unreadCount} unread</span>}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" className="text-xs font-bold" onClick={markAllRead}>
            <CheckCheck size={14} className="mr-1" /> Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={14} className="text-slate-400 shrink-0" />
          {[
            { value: 'all' as NotifFilter, label: 'All' },
            { value: 'unread' as NotifFilter, label: 'Unread' },
            { value: 'status_change' as NotifFilter, label: 'Status Changes' },
            { value: 'comment' as NotifFilter, label: 'Comments' },
            { value: 'assignment' as NotifFilter, label: 'Assignments' },
            { value: 'message' as NotifFilter, label: 'Messages' },
          ].map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                filter === f.value
                  ? 'bg-[#25238e] text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
              {f.value === 'unread' && unreadCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-[9px]">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </Card>

      {/* Notification List */}
      <Card className="border-none shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredNotifs.length === 0 && (
            <div className="py-16 text-center">
              <Bell size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-medium">No notifications to show.</p>
            </div>
          )}
          {filteredNotifs.map(notif => {
            const typeConfig = TYPE_CONFIG[notif.type];
            const Icon = typeConfig.icon;
            const clientName = getClientName(notif.clientId);
            return (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${
                  notif.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/30 hover:bg-blue-50/50'
                }`}
              >
                <div className={`w-10 h-10 ${typeConfig.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={typeConfig.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>
                      {notif.title}
                    </h4>
                    {!notif.isRead && <div className="w-2 h-2 bg-[#25238e] rounded-full shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{notif.message}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {clientName && (
                      <Badge variant="neutral" className="text-[9px]">{clientName}</Badge>
                    )}
                    <Badge variant={
                      notif.type === 'status_change' ? 'info' :
                      notif.type === 'comment' ? 'neutral' :
                      notif.type === 'assignment' ? 'warning' : 'success'
                    } className="text-[9px]">
                      {typeConfig.label}
                    </Badge>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-bold shrink-0 mt-0.5">{formatTime(notif.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
