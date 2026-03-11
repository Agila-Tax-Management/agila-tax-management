'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  LogIn, LogOut, Utensils, Coffee,
  Calendar, Activity, ChevronLeft, ChevronRight,
  Info, ArrowUpRight, Download, History, Timer,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { AttendanceLog } from '@/context/AuthContext';

// ── Date/Time helpers (no locale) ────────────────────────────────────────────
const MS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MF  = ['January','February','March','April','May','June',
             'July','August','September','October','November','December'];
const DS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const fmtClock   = (d: Date) =>
  `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;

const fmtTime    = (d: Date) => fmtClock(d);

const fmtLogDate = (d: Date) =>
  `${DS[d.getDay()]}, ${MS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

const fmtIso     = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

// ── Period helpers ───────────────────────────────────────────────────────────
const getWeekRange = (offset: number) => {
  const today = new Date(); today.setHours(0,0,0,0);
  const day   = today.getDay();
  const diff  = day === 0 ? -6 : 1 - day;
  const mon   = new Date(today); mon.setDate(today.getDate() + diff + offset * 7);
  const sun   = new Date(mon);   sun.setDate(mon.getDate() + 6);
  return { start: mon, end: sun };
};

const getMonthRange = (offset: number) => {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return { start, end };
};

const periodLabel = (mode: 'week'|'month', offset: number) => {
  if (mode === 'week') {
    const { start, end } = getWeekRange(offset);
    return `${MS[start.getMonth()]} ${start.getDate()} – ${MS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  }
  const now = new Date();
  const d   = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  return `${MF[d.getMonth()]} ${d.getFullYear()}`;
};

// ── Component ────────────────────────────────────────────────────────────────
export const TimesheetView: React.FC = () => {
  const {
    user,
    attendanceLogs,
    setAttendanceLogs,
    updateClockedIn,
    updateLunchStatus,
    updateClockInTime,
    updateLunchStartTime,
  } = useAuth();

  const [isClient,     setIsClient]     = useState(false);
  const [currentTime,  setCurrentTime]  = useState(new Date());
  const [lunchMins,    setLunchMins]    = useState(0);
  const [liveHours,    setLiveHours]    = useState('0.00');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [viewMode, setViewMode] = useState<'week'|'month'>('week');
  const [offset,   setOffset]   = useState(0);

  const status: 'Clocked Out'|'Clocked In'|'On Lunch' =
    !user?.isClockedIn   ? 'Clocked Out' :
    user?.isOnLunch      ? 'On Lunch'    : 'Clocked In';

  const clockInTime   = user?.clockInTime   ? new Date(user.clockInTime)   : null;
  const lunchStartCtx = user?.lunchStartTime ? new Date(user.lunchStartTime) : null;

  useEffect(() => {
    setIsClient(true);
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (status === 'Clocked Out') { setLiveHours('0.00'); return; }
    const id = setInterval(() => {
      if (!clockInTime) return;
      const now  = new Date();
      let   lunch = lunchMins;
      if (status === 'On Lunch' && lunchStartCtx)
        lunch += Math.floor((now.getTime() - lunchStartCtx.getTime()) / 60000);
      const work = Math.floor((now.getTime() - clockInTime.getTime()) / 60000) - lunch;
      setLiveHours(Math.max(0, work / 60).toFixed(2));
    }, 1000);
    return () => clearInterval(id);
  }, [status, clockInTime, lunchMins, lunchStartCtx]);

  const filtered = React.useMemo(() => {
    const range = viewMode === 'week' ? getWeekRange(offset) : getMonthRange(offset);
    return [...attendanceLogs]
      .filter(l => {
        const [y, mo, d] = l.isoDate.split('-').map(Number);
        const ld = new Date(y, mo - 1, d);
        return ld >= range.start && ld <= range.end;
      })
      .sort((a, b) => b.isoDate.localeCompare(a.isoDate));
  }, [attendanceLogs, viewMode, offset]);

  const periodTotals = React.useMemo(() => {
    const done = filtered.filter(l => l.status === 'Completed');
    const hrs  = done.reduce((s, l) => s + parseFloat(l.totalHours), 0);
    const ot   = done.reduce((s, l) => {
      const x = parseFloat(l.totalHours) - 8;
      return s + (x > 0 ? x : 0);
    }, 0);
    return { hrs: hrs.toFixed(1), days: filtered.length, ot: ot.toFixed(1) };
  }, [filtered]);

  // ── Mock-data driven actions (no API calls) ─────────────────────────────
  const handleAction = async (action: 'IN'|'OUT'|'LUNCH_START'|'LUNCH_END') => {
    if (!user) return;
    const now = new Date();
    const ts  = fmtTime(now);
    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      if (action === 'IN') {
        if (status !== 'Clocked Out') { alert('Already clocked in.'); return; }

        updateClockedIn(true);
        updateClockInTime(now.toISOString());
        setLunchMins(0);
        setOffset(0);

        const newLog: AttendanceLog = {
          id: `LOG-${Date.now()}`,
          date: fmtLogDate(now),
          isoDate: fmtIso(now),
          clockIn: ts,
          clockOut: '-',
          lunchStart: '-',
          lunchEnd: '-',
          totalHours: '0.00',
          status: 'In Progress',
        };
        setAttendanceLogs(prev => [newLog, ...prev]);

      } else if (action === 'LUNCH_START') {
        if (status !== 'Clocked In') { alert('Clock in first.'); return; }

        updateLunchStatus(true);
        updateLunchStartTime(now.toISOString());
        setAttendanceLogs(p => p.map((l, i) => i === 0 ? { ...l, lunchStart: ts } : l));

      } else if (action === 'LUNCH_END') {
        if (status !== 'On Lunch') { alert('Not on lunch.'); return; }

        if (lunchStartCtx)
          setLunchMins(p => p + Math.floor((now.getTime() - lunchStartCtx.getTime()) / 60000));

        updateLunchStatus(false);
        updateLunchStartTime(null);
        setAttendanceLogs(p => p.map((l, i) => i === 0 ? { ...l, lunchEnd: ts } : l));

      } else if (action === 'OUT') {
        if (status === 'Clocked Out') { alert('Already clocked out.'); return; }
        if (status === 'On Lunch')    { alert('End lunch break first.'); return; }
        if (!clockInTime)             { alert('Clock-in time not found.'); return; }

        const work       = Math.floor((now.getTime() - clockInTime.getTime()) / 60000) - lunchMins;
        const totalHours = Math.max(0, work / 60).toFixed(2);

        updateClockedIn(false);
        updateClockInTime(null);
        updateLunchStartTime(null);

        setLunchMins(0);
        setLiveHours('0.00');
        setAttendanceLogs(p =>
          p.map((l, i) => i === 0 ? { ...l, clockOut: ts, status: 'Completed' as const, totalHours } : l)
        );
      }
    } catch (err) {
      console.error(`Action ${action} failed:`, err);
      alert(`Failed to record ${action}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayIso = fmtIso(new Date());

  const displayName = user?.name ?? 'Employee';
  const initials    = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const stats = [
    { label: 'Period Hours',  value: periodTotals.hrs,         sub: 'Tracked this period',   icon: <Timer size={20} />,        color: 'text-blue-600',    bg: 'bg-blue-50'    },
    { label: 'Days Present',  value: String(periodTotals.days), sub: 'Logged entries',        icon: <Calendar size={20} />,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Attendance',    value: '98.2%',                   sub: 'Excellent rating',      icon: <Activity size={20} />,     color: 'text-amber-600',   bg: 'bg-amber-50'   },
    { label: 'Overtime',      value: periodTotals.ot,           sub: 'Extra hours',           icon: <ArrowUpRight size={20} />, color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20 max-w-350 mx-auto px-4 sm:px-6">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px]">
            <ShieldCheck size={14} /> Secure Session Active
          </div>
          <h1 className="text-5xl font-black text-foreground tracking-tighter leading-none">
            TIMESHEET<span className="text-blue-600">.</span>
          </h1>
          <p className="text-muted-foreground font-medium text-sm max-w-md">
            Precision attendance tracking and performance metrics for the current billing cycle.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Current System Time</p>
            <p className="text-2xl font-black text-foreground tabular-nums font-mono" suppressHydrationWarning>
              {isClient ? fmtClock(currentTime) : '00:00:00'}
            </p>
          </div>
          <div className="h-12 w-px bg-border mx-2 hidden sm:block" />
          <Button variant="outline" className="h-12 px-6 rounded-xl border-2 font-bold flex gap-2">
            <Download size={18} /> Export Report
          </Button>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-6 border-none bg-card shadow-sm hover:shadow-md transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
            </div>
            <p className="text-3xl font-black text-foreground tracking-tight">{s.value}</p>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest mt-1">{s.label}</p>
            <p className="text-[10px] font-medium text-muted-foreground mt-2">{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ── Left: Controls + Profile ───────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-6">

          {/* Session Controls — first on mobile for quick clock in/out access */}
          <Card className="p-6 border-none bg-card shadow-sm space-y-3">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-1">
              <Activity size={14} className="text-blue-600" /> Session Controls
            </h3>

            <button
              onClick={() => handleAction('IN')}
              disabled={status !== 'Clocked Out' || isSubmitting}
              className={`w-full h-14 rounded-xl font-black uppercase text-xs flex items-center justify-between px-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                status === 'Clocked Out'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-3"><LogIn size={18} /> Clock In</span>
              <ChevronRight size={16} />
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleAction('LUNCH_START')}
                disabled={status !== 'Clocked In' || isSubmitting}
                className={`h-14 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  status === 'Clocked In'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Utensils size={16} /> Lunch Start
              </button>
              <button
                onClick={() => handleAction('LUNCH_END')}
                disabled={status !== 'On Lunch' || isSubmitting}
                className={`h-14 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                  status === 'On Lunch'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <Coffee size={16} /> Lunch End
              </button>
            </div>

            <button
              onClick={() => handleAction('OUT')}
              disabled={status === 'Clocked Out' || isSubmitting}
              className={`w-full h-14 rounded-xl font-black uppercase text-xs flex items-center justify-between px-6 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${
                status !== 'Clocked Out'
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-black'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-3"><LogOut size={18} /> Clock Out</span>
              <ChevronRight size={16} />
            </button>

            {isSubmitting && (
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-pulse">
                  Syncing with server...
                </span>
              </div>
            )}

            {status !== 'Clocked Out' && (
              <div className="mt-2 p-4 bg-muted rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Session Total</span>
                <span className="text-lg font-black text-blue-600 tabular-nums font-mono" suppressHydrationWarning>
                  {liveHours} hrs
                </span>
              </div>
            )}
          </Card>

          {/* Profile */}
          <Card className="p-6 border-none bg-slate-900 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-xl shadow-blue-900/40">
                {initials}
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">{displayName}</h2>
                <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{user?.role ?? '—'}</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 relative z-10">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Employee ID</p>
                <p className="text-sm font-bold font-mono mt-1 text-white">{user?.employeeId ?? '—'}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Department</p>
                <p className="text-sm font-bold mt-1 text-white">{user?.department ?? '—'}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  status === 'Clocked In' ? 'bg-emerald-500' :
                  status === 'On Lunch'   ? 'bg-amber-500'   : 'bg-slate-500'
                }`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{status}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right: History Table ──────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <Card className="border-none bg-card shadow-sm flex flex-col">

            {/* Table toolbar */}
            <div className="p-6 border-b border-border flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-muted rounded-lg text-muted-foreground">
                  <History size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-tight">Attendance History</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  {(['week', 'month'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => { setViewMode(m); setOffset(0); }}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                        viewMode === m ? 'bg-slate-900 text-white' : 'bg-card text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" onClick={() => setOffset(p => p - 1)}
                    className="h-9 w-9 p-0 rounded-lg border border-border">
                    <ChevronLeft size={16} />
                  </Button>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wide px-2 min-w-37 text-center">
                    {periodLabel(viewMode, offset)}
                  </span>
                  <Button variant="ghost"
                    onClick={() => setOffset(p => Math.min(p + 1, 0))}
                    disabled={offset >= 0}
                    className="h-9 w-9 p-0 rounded-lg border border-border disabled:opacity-40">
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto flex-1 min-h-80">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                  <Calendar size={48} className="mb-4" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-500">No records for this period</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-1">Navigate to a previous period to view history</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      {['Date','Shift','Lunch','Total','Status'].map((h, i) => (
                        <th key={h} className={`px-6 py-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest ${i === 4 ? 'text-right' : ''}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map(log => {
                      const isToday = log.isoDate === todayIso;
                      return (
                        <tr key={log.id} className="group hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-foreground block">{log.date.split(',')[0]}</span>
                            <span className="text-[10px] font-bold text-muted-foreground">{log.date.split(',').slice(1).join(',').trim()}</span>
                            {isToday && <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mt-0.5">Today</span>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase block">IN</span>
                                <span className="text-xs font-bold font-mono text-foreground">{log.clockIn}</span>
                              </div>
                              <div className="w-4 h-px bg-border" />
                              <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase block">OUT</span>
                                <span className="text-xs font-bold font-mono text-foreground">{log.clockOut}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase block">S</span>
                                <span className="text-xs font-bold font-mono text-foreground">{log.lunchStart}</span>
                              </div>
                              <div className="w-4 h-px bg-border" />
                              <div>
                                <span className="text-[10px] font-black text-muted-foreground uppercase block">E</span>
                                <span className="text-xs font-bold font-mono text-slate-700">{log.lunchEnd}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-blue-600 font-mono">
                              {isToday && status !== 'Clocked Out' ? liveHours : log.totalHours} hrs
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Badge
                              variant={log.status === 'Completed' ? 'success' : 'warning'}
                              className={`font-black uppercase tracking-widest text-[9px] px-3 py-1 rounded-lg ${
                                log.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {log.status}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/80 border-t-2 border-border">
                      <td colSpan={3} className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Period Total
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-sm font-black text-foreground font-mono">{periodTotals.hrs} hrs</span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                          {filtered.filter(l => l.status === 'Completed').length}/{filtered.length} Complete
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div className="p-4 bg-muted/50 border-t border-border flex items-center justify-center gap-2">
              <Info size={14} className="text-muted-foreground" />
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                All logs are synchronized with the central payroll server in real-time.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
