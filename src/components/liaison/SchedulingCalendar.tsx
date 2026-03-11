'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  MapPin, Clock, User, Building2, FileText,
  Plus,
} from 'lucide-react';
import { INITIAL_CALENDAR_EVENTS, LIAISON_TEAM, type CalendarEvent } from '@/lib/mock-liaison-data';
import { Input } from '@/components/UI/Input';
import { INITIAL_CLIENTS } from '@/lib/mock-clients';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EVENT_TYPE_CONFIG: Record<CalendarEvent['type'], { label: string; color: string; bg: string; badge: 'info' | 'warning' | 'success' | 'danger' | 'neutral' }> = {
  filing:   { label: 'Filing',    color: 'bg-blue-500',   bg: 'bg-blue-50 border-blue-200 text-blue-800',    badge: 'info' },
  pickup:   { label: 'Pickup',    color: 'bg-amber-500',  bg: 'bg-amber-50 border-amber-200 text-amber-800', badge: 'warning' },
  'on-site':{ label: 'On-Site',   color: 'bg-emerald-500',bg: 'bg-emerald-50 border-emerald-200 text-emerald-800', badge: 'success' },
  meeting:  { label: 'Meeting',   color: 'bg-violet-500', bg: 'bg-violet-50 border-violet-200 text-violet-800', badge: 'neutral' },
  deadline: { label: 'Deadline',  color: 'bg-red-500',    bg: 'bg-red-50 border-red-200 text-red-800',       badge: 'danger' },
};

type ViewType = 'month' | 'week' | 'agenda';

export function SchedulingCalendar() {
  const today = new Date(2026, 2, 11); // March 11, 2026
  const [currentDate, setCurrentDate] = useState(today);
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_CALENDAR_EVENTS);
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '', date: '', startTime: '09:00', endTime: '10:00',
    type: 'filing' as CalendarEvent['type'], location: '', clientId: '',
    assigneeId: LIAISON_TEAM[0].id, notes: '',
  });

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      if (filterAssignee !== 'all' && e.assigneeId !== filterAssignee) return false;
      if (filterType !== 'all' && e.type !== filterType) return false;
      return true;
    });
  }, [events, filterAssignee, filterType]);

  // ── Calendar Grid helpers ─────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    // Prev month tail
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ date: new Date(year, month, d), isCurrentMonth: true });
    }
    // Next month fill to 42
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false });
    }
    return days;
  }, [year, month, firstDay, daysInMonth, prevMonthDays]);

  const getDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const getEventsForDate = (dateStr: string) => filteredEvents.filter(e => e.date === dateStr);

  const isToday = (d: Date) =>
    d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  // ── Week view helpers ─────────────────────────────────────
  const getWeekDays = useMemo(() => {
    const dayOfWeek = currentDate.getDay();
    const start = new Date(currentDate);
    start.setDate(start.getDate() - dayOfWeek);
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [currentDate]);

  // ── Navigation ────────────────────────────────────────────
  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (viewType === 'month') d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + 7 * dir);
    setCurrentDate(d);
  };

  const goToday = () => setCurrentDate(today);

  // ── Agenda view ───────────────────────────────────────────
  const upcomingEvents = useMemo(() => {
    const todayStr = getDateStr(today);
    return filteredEvents
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
  }, [filteredEvents]);

  // ── Stats ─────────────────────────────────────────────────
  const todayEvents = getEventsForDate(getDateStr(today));
  const weekEvents = filteredEvents.filter(e => {
    const d = new Date(e.date);
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return d >= start && d <= end;
  });

  // ── Create Event ──────────────────────────────────────────
  const handleCreateEvent = () => {
    if (!newEvent.title || !newEvent.date) return;
    const assignee = LIAISON_TEAM.find(m => m.id === newEvent.assigneeId);
    const client = INITIAL_CLIENTS.find(c => c.id === newEvent.clientId);
    const evt: CalendarEvent = {
      id: `evt-${Date.now()}`,
      title: newEvent.title,
      date: newEvent.date,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      type: newEvent.type,
      location: newEvent.location || undefined,
      clientId: newEvent.clientId || undefined,
      clientName: client?.businessName,
      assigneeId: newEvent.assigneeId,
      assigneeName: assignee?.name ?? '',
      notes: newEvent.notes || undefined,
    };
    setEvents(prev => [...prev, evt]);
    setIsCreateOpen(false);
    setNewEvent({
      title: '', date: '', startTime: '09:00', endTime: '10:00',
      type: 'filing', location: '', clientId: '',
      assigneeId: LIAISON_TEAM[0].id, notes: '',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Schedule Calendar</h2>
          <p className="text-sm text-slate-500 font-medium">Plan and track liaison field schedules, filings, and deadlines.</p>
        </div>
        <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setIsCreateOpen(true)}>
          <Plus size={16} /> New Event
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-violet-50 p-3 rounded-xl text-violet-600 mb-3 w-fit"><CalendarIcon size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Today&apos;s Events</p>
          <p className="text-2xl font-black text-slate-900">{todayEvents.length}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 mb-3 w-fit"><FileText size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">This Week</p>
          <p className="text-2xl font-black text-slate-900">{weekEvents.length}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-red-50 p-3 rounded-xl text-red-600 mb-3 w-fit"><Clock size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Upcoming Deadlines</p>
          <p className="text-2xl font-black text-slate-900">{filteredEvents.filter(e => e.type === 'deadline').length}</p>
        </Card>
        <Card className="p-5 border-slate-200 shadow-sm">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600 mb-3 w-fit"><MapPin size={18} /></div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">On-Site Visits</p>
          <p className="text-2xl font-black text-slate-900">{filteredEvents.filter(e => e.type === 'on-site').length}</p>
        </Card>
      </div>

      {/* Toolbar */}
      <Card className="p-4 border-none shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Nav */}
          <div className="flex items-center gap-2">
            <Button variant="outline" className="h-9 w-9 p-0" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="outline" className="h-9 px-4 text-xs font-bold" onClick={goToday}>
              Today
            </Button>
            <Button variant="outline" className="h-9 w-9 p-0" onClick={() => navigate(1)}>
              <ChevronRight size={16} />
            </Button>
            <h3 className="text-sm font-black text-slate-800 ml-2">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
          </div>

          {/* Right: View toggle + filters */}
          <div className="flex items-center gap-2">
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">All Team</option>
              {LIAISON_TEAM.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="h-9 px-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none"
            >
              <option value="all">All Types</option>
              {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {(['month', 'week', 'agenda'] as const).map(v => (
                <button
                  key={v}
                  onClick={() => setViewType(v)}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition ${viewType === v ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Month View ──────────────────────────────────────── */}
      {viewType === 'month' && (
        <Card className="border-none shadow-sm overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
            {DAYS.map(d => (
              <div key={d} className="p-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map(({ date, isCurrentMonth }, idx) => {
              const dateStr = getDateStr(date);
              const dayEvents = getEventsForDate(dateStr);
              const dayIsToday = isToday(date);
              return (
                <div
                  key={idx}
                  className={`min-h-28 border-b border-r border-slate-100 p-1.5 cursor-pointer hover:bg-slate-50 transition-colors ${
                    !isCurrentMonth ? 'bg-slate-50/50' : ''
                  }`}
                  onClick={() => setSelectedDate(dateStr)}
                >
                  <div className={`text-xs font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${
                    dayIsToday
                      ? 'bg-violet-600 text-white'
                      : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(evt => {
                      const cfg = EVENT_TYPE_CONFIG[evt.type];
                      return (
                        <div
                          key={evt.id}
                          onClick={e => { e.stopPropagation(); setSelectedEvent(evt); }}
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border truncate cursor-pointer hover:opacity-80 ${cfg.bg}`}
                        >
                          {evt.startTime !== evt.endTime && <span className="mr-1">{evt.startTime}</span>}
                          {evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] text-slate-400 font-bold pl-1.5">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Week View ───────────────────────────────────────── */}
      {viewType === 'week' && (
        <Card className="border-none shadow-sm overflow-hidden">
          <div className="grid grid-cols-7">
            {getWeekDays.map(date => {
              const dateStr = getDateStr(date);
              const dayEvents = getEventsForDate(dateStr);
              const dayIsToday = isToday(date);
              return (
                <div key={dateStr} className={`border-r border-slate-100 last:border-r-0 ${dayIsToday ? 'bg-violet-50/30' : ''}`}>
                  <div className={`p-3 text-center border-b border-slate-200 ${dayIsToday ? 'bg-violet-50' : 'bg-slate-50'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{DAYS[date.getDay()]}</p>
                    <p className={`text-lg font-black mt-0.5 ${dayIsToday ? 'text-violet-700' : 'text-slate-700'}`}>{date.getDate()}</p>
                  </div>
                  <div className="p-2 min-h-72 space-y-1.5">
                    {dayEvents.map(evt => {
                      const cfg = EVENT_TYPE_CONFIG[evt.type];
                      return (
                        <div
                          key={evt.id}
                          onClick={() => setSelectedEvent(evt)}
                          className={`p-2 rounded-lg border cursor-pointer hover:opacity-80 transition ${cfg.bg}`}
                        >
                          <p className="text-[10px] font-black truncate">{evt.title}</p>
                          <p className="text-[9px] opacity-70 mt-0.5">
                            {evt.startTime !== evt.endTime ? `${evt.startTime} – ${evt.endTime}` : 'All day'}
                          </p>
                          {evt.location && (
                            <p className="text-[9px] opacity-60 mt-0.5 flex items-center gap-0.5 truncate">
                              <MapPin size={8} /> {evt.location}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {dayEvents.length === 0 && (
                      <p className="text-[9px] text-slate-300 text-center pt-8">No events</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Agenda View ─────────────────────────────────────── */}
      {viewType === 'agenda' && (
        <Card className="border-none shadow-sm">
          <div className="divide-y divide-slate-100">
            {upcomingEvents.length === 0 ? (
              <div className="p-12 text-center text-sm text-slate-400">No upcoming events.</div>
            ) : (
              upcomingEvents.map(evt => {
                const cfg = EVENT_TYPE_CONFIG[evt.type];
                const d = new Date(evt.date);
                return (
                  <div
                    key={evt.id}
                    className="flex items-start gap-4 p-5 hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedEvent(evt)}
                  >
                    {/* Date chip */}
                    <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                      getDateStr(d) === getDateStr(today) ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <span className="text-[9px] font-black uppercase">{DAYS[d.getDay()]}</span>
                      <span className="text-lg font-black">{d.getDate()}</span>
                    </div>

                    {/* Event info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${cfg.color}`} />
                        <h4 className="text-sm font-black text-slate-800 truncate">{evt.title}</h4>
                        <Badge variant={cfg.badge} className="text-[8px] uppercase shrink-0">{cfg.label}</Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock size={10} />
                          {evt.startTime !== evt.endTime ? `${evt.startTime} – ${evt.endTime}` : 'Deadline'}
                        </span>
                        {evt.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={10} /> {evt.location}
                          </span>
                        )}
                        {evt.clientName && (
                          <span className="flex items-center gap-1">
                            <Building2 size={10} /> {evt.clientName}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <User size={10} /> {evt.assigneeName}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      )}

      {/* ── Event Detail Modal ──────────────────────────────── */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title="Event Details"
        size="md"
      >
        {selectedEvent && (() => {
          const cfg = EVENT_TYPE_CONFIG[selectedEvent.type];
          const d = new Date(selectedEvent.date);
          return (
            <div className="p-6 space-y-5">
              {/* Type badge + title */}
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg.split(' ')[0]}`}>
                  <div className={`w-3 h-3 rounded-full ${cfg.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">{selectedEvent.title}</h3>
                  <Badge variant={cfg.badge} className="text-[9px] mt-1 uppercase">{cfg.label}</Badge>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CalendarIcon size={16} className="text-slate-400 shrink-0" />
                  <span className="font-bold text-slate-700">
                    {DAYS[d.getDay()]}, {MONTHS[d.getMonth()]} {d.getDate()}, {d.getFullYear()}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={16} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">
                    {selectedEvent.startTime !== selectedEvent.endTime
                      ? `${selectedEvent.startTime} – ${selectedEvent.endTime}`
                      : 'All-day deadline'}
                  </span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-3 text-sm">
                    <MapPin size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700">{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.clientName && (
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 size={16} className="text-slate-400 shrink-0" />
                    <span className="text-slate-700">{selectedEvent.clientName}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <User size={16} className="text-slate-400 shrink-0" />
                  <span className="text-slate-700">{selectedEvent.assigneeName}</span>
                </div>
              </div>

              {/* Notes */}
              {selectedEvent.notes && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Notes</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{selectedEvent.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedEvent(null)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── Day Detail Modal (click on date cell) ───────────── */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={selectedDate ? `Events — ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}` : ''}
        size="md"
      >
        {selectedDate && (() => {
          const dayEvents = getEventsForDate(selectedDate);
          return (
            <div className="p-6">
              {dayEvents.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No events scheduled for this day.</p>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map(evt => {
                    const cfg = EVENT_TYPE_CONFIG[evt.type];
                    return (
                      <div
                        key={evt.id}
                        onClick={() => { setSelectedDate(null); setSelectedEvent(evt); }}
                        className={`p-4 rounded-xl border cursor-pointer hover:opacity-80 transition ${cfg.bg}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-black">{evt.title}</h4>
                          <Badge variant={cfg.badge} className="text-[8px] uppercase">{cfg.label}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] opacity-70">
                          <span className="flex items-center gap-1 font-bold">
                            <Clock size={10} />
                            {evt.startTime !== evt.endTime ? `${evt.startTime} – ${evt.endTime}` : 'Deadline'}
                          </span>
                          {evt.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={10} /> {evt.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <User size={10} /> {evt.assigneeName}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </Modal>

      {/* ── Create Event Modal ──────────────────────────────── */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Calendar Event" size="lg">
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Title *</label>
            <Input value={newEvent.title} onChange={e => setNewEvent(p => ({ ...p, title: e.target.value }))} placeholder="e.g. BIR Filing at RDO 044" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Date *</label>
              <Input type="date" value={newEvent.date} onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Start Time</label>
              <Input type="time" value={newEvent.startTime} onChange={e => setNewEvent(p => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">End Time</label>
              <Input type="time" value={newEvent.endTime} onChange={e => setNewEvent(p => ({ ...p, endTime: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Type</label>
              <select
                value={newEvent.type}
                onChange={e => setNewEvent(p => ({ ...p, type: e.target.value as CalendarEvent['type'] }))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Assignee</label>
              <select
                value={newEvent.assigneeId}
                onChange={e => setNewEvent(p => ({ ...p, assigneeId: e.target.value }))}
                className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {LIAISON_TEAM.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Client (optional)</label>
            <select
              value={newEvent.clientId}
              onChange={e => setNewEvent(p => ({ ...p, clientId: e.target.value }))}
              className="w-full h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="">— None —</option>
              {INITIAL_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.businessName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Location</label>
            <Input value={newEvent.location} onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} placeholder="e.g. BIR RDO 044, Makati" />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Notes</label>
            <textarea
              value={newEvent.notes}
              onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))}
              placeholder="Additional details..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-20 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
              onClick={handleCreateEvent}
              disabled={!newEvent.title || !newEvent.date}
            >
              Create Event
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
