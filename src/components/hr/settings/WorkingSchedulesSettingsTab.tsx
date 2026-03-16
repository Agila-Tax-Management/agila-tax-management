// src/components/hr/settings/WorkingSchedulesSettingsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Loader2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

/* ─── Types ──────────────────────────────────────────────────────── */

interface ScheduleDay {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  isWorkingDay: boolean;
}

interface WorkSchedule {
  id: number;
  name: string;
  timezone: string;
  days: ScheduleDay[];
}

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_DAYS = WEEK_DAYS.map((d) => ({
  dayOfWeek: d,
  label: DAY_LABELS[d],
  enabled: d >= 1 && d <= 5,
  startTime: '08:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
}));

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

/* ─── Component ─────────────────────────────────────────────────── */

export function WorkingSchedulesSettingsTab(): React.ReactNode {
  const { success, error } = useToast();

  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Add modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState(DEFAULT_DAYS);

  /* ─── Fetch ─────────────────────────────────────────────────────── */

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/work-schedules');
      const data = (await res.json()) as { data?: WorkSchedule[]; error?: string };
      if (!res.ok) {
        error('Failed to load schedules', data.error ?? 'An error occurred.');
        return;
      }
      setSchedules(data.data ?? []);
    } catch {
      error('Network error', 'Could not load work schedules.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    void fetchSchedules();
  }, [fetchSchedules]);

  /* ─── Filter / sort ─────────────────────────────────────────────── */

  const filteredSchedules = schedules
    .filter((s) => s.name.toLowerCase().includes(filterText.toLowerCase()))
    .sort((a, b) => {
      if (groupBy === 'name') return a.name.localeCompare(b.name);
      if (groupBy === 'days') {
        const aWorking = a.days.filter((d) => d.isWorkingDay).length;
        const bWorking = b.days.filter((d) => d.isWorkingDay).length;
        return bWorking - aWorking;
      }
      return a.id - b.id;
    });

  /* ─── Add schedule ─────────────────────────────────────────────── */

  const openAdd = () => {
    setNewName('');
    setNewDays(DEFAULT_DAYS);
    setIsAddOpen(true);
  };

  const handleAdd = async () => {
    if (!newName.trim()) {
      error('Missing name', 'Please enter a schedule name.');
      return;
    }
    const workingDays = newDays.filter((d) => d.enabled);
    if (workingDays.length === 0) {
      error('No working days', 'Please enable at least one working day.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/hr/work-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          timezone: 'Asia/Manila',
          days: workingDays.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            startTime: d.startTime,
            endTime: d.endTime,
            breakStart: d.breakStart || null,
            breakEnd: d.breakEnd || null,
            isWorkingDay: true,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to save', data.error ?? 'An error occurred.');
        return;
      }
      success('Schedule created', `"${newName.trim()}" has been saved successfully.`);
      setIsAddOpen(false);
      void fetchSchedules();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  /* ─── Helpers ───────────────────────────────────────────────────── */

  const formatTime = (t: string) => {
    const [h, m] = t.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const display = hour % 12 === 0 ? 12 : hour % 12;
    return `${display}:${m} ${ampm}`;
  };

  const workingDaysLabel = (days: ScheduleDay[]) => {
    const working = days.filter((d) => d.isWorkingDay).map((d) => DAY_LABELS[d.dayOfWeek].slice(0, 3));
    return working.length > 0 ? working.join(', ') : 'No working days';
  };

  /* ─── Render ────────────────────────────────────────────────────── */

  return (
    <Card className="p-6 sm:p-7 space-y-6">
      <div>
        <h2 className="text-lg font-black text-foreground">Working Schedules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage work schedule templates assigned to employee contracts.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <input
            type="text"
            placeholder="Search schedules..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:w-60"
          />
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          >
            <option value="none">Sort: Default</option>
            <option value="name">Sort: Name A–Z</option>
            <option value="days">Sort: Most Working Days</option>
          </select>
        </div>
        <Button className="bg-rose-600 hover:bg-rose-700 text-white shrink-0" onClick={openAdd}>
          <Plus size={15} className="mr-2" /> Add Schedule
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
          <Loader2 size={18} className="animate-spin" /> Loading schedules...
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider">Schedule Name</th>
                <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider hidden sm:table-cell">Working Days</th>
                <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider hidden md:table-cell">Hours</th>
                <th className="text-right px-4 py-3 font-black uppercase text-xs tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((sched) => {
                const workDay = sched.days.find((d) => d.isWorkingDay);
                return (
                  <React.Fragment key={sched.id}>
                    <tr className="border-t border-border/70 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{sched.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                        {workingDaysLabel(sched.days)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {workDay ? `${formatTime(workDay.startTime)} – ${formatTime(workDay.endTime)}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setExpandedId(expandedId === sched.id ? null : sched.id)}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-muted px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-200 dark:hover:bg-muted/80"
                        >
                          {expandedId === sched.id ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> View</>}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded day details */}
                    {expandedId === sched.id && (
                      <tr className="border-t border-border/40 bg-muted/10">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="space-y-1.5">
                            {sched.days
                              .filter((d) => d.isWorkingDay)
                              .map((d) => (
                                <div key={d.dayOfWeek} className="flex items-center gap-4 text-xs">
                                  <span className="w-24 font-semibold text-foreground">{DAY_LABELS[d.dayOfWeek]}</span>
                                  <span className="text-muted-foreground">
                                    {formatTime(d.startTime)} – {formatTime(d.endTime)}
                                  </span>
                                  {d.breakStart && d.breakEnd && (
                                    <span className="text-muted-foreground/70">
                                      Break: {formatTime(d.breakStart)} – {formatTime(d.breakEnd)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            {sched.days.filter((d) => d.isWorkingDay).length === 0 && (
                              <p className="text-xs text-muted-foreground">No working days configured.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredSchedules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {filterText ? 'No schedules match your search.' : 'No work schedules found. Add one to get started.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Showing <span className="font-bold text-foreground">{filteredSchedules.length}</span> of{' '}
        <span className="font-bold text-foreground">{schedules.length}</span> schedule(s)
      </p>

      {/* Add Schedule Modal */}
      <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add Work Schedule" size="lg">
        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Schedule Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Standard Office Hours"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weekly Schedule</p>
            {newDays.map((day, idx) => (
              <div key={day.dayOfWeek} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => {
                      const updated = [...newDays];
                      updated[idx] = { ...day, enabled: e.target.checked };
                      setNewDays(updated);
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                  <span className={`text-xs font-medium ${day.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {day.label}
                  </span>
                </div>
                {day.enabled && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input type="time" value={day.startTime}
                      onChange={(e) => { const u = [...newDays]; u[idx] = { ...day, startTime: e.target.value }; setNewDays(u); }}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                    <span className="text-xs text-muted-foreground">to</span>
                    <input type="time" value={day.endTime}
                      onChange={(e) => { const u = [...newDays]; u[idx] = { ...day, endTime: e.target.value }; setNewDays(u); }}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                    <span className="text-xs text-muted-foreground ml-2">Break:</span>
                    <input type="time" value={day.breakStart ?? ''}
                      onChange={(e) => { const u = [...newDays]; u[idx] = { ...day, breakStart: e.target.value }; setNewDays(u); }}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                    <span className="text-xs text-muted-foreground">–</span>
                    <input type="time" value={day.breakEnd ?? ''}
                      onChange={(e) => { const u = [...newDays]; u[idx] = { ...day, breakEnd: e.target.value }; setNewDays(u); }}
                      className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                  </div>
                )}
                {!day.enabled && (
                  <span className="text-xs text-muted-foreground italic">Day off</span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={saving}>
              <X size={14} className="mr-1.5" /> Cancel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Plus size={14} className="mr-1.5" />}
              Save Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}
