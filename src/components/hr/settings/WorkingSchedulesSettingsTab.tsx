// src/components/hr/settings/WorkingSchedulesSettingsTab.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp, X, Building2, Home, Layers } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';

/* ─── Types ──────────────────────────────────────────────────────── */

type LocationType = 'OFFICE' | 'WFH' | 'HYBRID';

interface ScheduleDay {
  dayOfWeek: number;
  startTime: string | null;
  endTime: string | null;
  breakStart: string | null;
  breakEnd: string | null;
  isWorkingDay: boolean;
  locationType: string;
  isFlexible: boolean;
  requiredHours: number | null;
}

interface WorkSchedule {
  id: number;
  name: string;
  timezone: string;
  days: ScheduleDay[];
}

interface DayFormState {
  dayOfWeek: number;
  label: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
  breakStart: string;
  breakEnd: string;
  locationType: LocationType;
  isFlexible: boolean;
  requiredHours: number;
}

const DAY_LABELS: Record<number, string> = {
  0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday',
  4: 'Thursday', 5: 'Friday', 6: 'Saturday',
};

const WEEK_DAYS = [1, 2, 3, 4, 5, 6, 0];

const DEFAULT_DAY = (d: number): DayFormState => ({
  dayOfWeek: d,
  label: DAY_LABELS[d] ?? String(d),
  enabled: d >= 1 && d <= 5,
  startTime: '08:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  locationType: 'OFFICE',
  isFlexible: false,
  requiredHours: 8,
});

const DEFAULT_DAYS: DayFormState[] = WEEK_DAYS.map(DEFAULT_DAY);

const LOCATION_OPTIONS: { value: LocationType; label: string; icon: React.ReactNode }[] = [
  { value: 'OFFICE', label: 'Office', icon: <Building2 size={11} /> },
  { value: 'WFH', label: 'WFH', icon: <Home size={11} /> },
  { value: 'HYBRID', label: 'Hybrid', icon: <Layers size={11} /> },
];

const LOCATION_COLOR: Record<LocationType, string> = {
  OFFICE: 'bg-blue-100 text-blue-700 border-blue-300',
  WFH: 'bg-green-100 text-green-700 border-green-300',
  HYBRID: 'bg-purple-100 text-purple-700 border-purple-300',
};

const TABLE_LOCATION_COLOR: Record<string, string> = {
  Office: 'bg-blue-100 text-blue-700',
  WFH: 'bg-green-100 text-green-700',
  Hybrid: 'bg-purple-100 text-purple-700',
  Mixed: 'bg-amber-100 text-amber-700',
};

const inputCls =
  'w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500';
const labelCls = 'block text-xs font-semibold text-muted-foreground mb-1.5';

/* ─── Helpers ───────────────────────────────────────────────────── */

function formatTime(t: string | null | undefined): string {
  if (!t) return '—';
  const [h, m] = t.split(':');
  const hour = parseInt(h ?? '0', 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m ?? '00'} ${ampm}`;
}

function workingDaysLabel(days: ScheduleDay[]): string {
  const working = days.filter((d) => d.isWorkingDay).map((d) => (DAY_LABELS[d.dayOfWeek] ?? '').slice(0, 3));
  return working.length > 0 ? working.join(', ') : 'No working days';
}

function hoursDisplay(days: ScheduleDay[]): string {
  const working = days.filter((d) => d.isWorkingDay);
  if (working.length === 0) return '—';
  const allFlex = working.every((d) => d.isFlexible);
  const anyFlex = working.some((d) => d.isFlexible);
  if (allFlex) {
    const hrs = working[0]?.requiredHours;
    return hrs != null ? `Flexible (${hrs}h)` : 'Flexible';
  }
  if (anyFlex) return 'Mixed';
  const first = working[0];
  return first ? `${formatTime(first.startTime)} – ${formatTime(first.endTime)}` : '—';
}

function locationDisplay(days: ScheduleDay[]): string {
  const working = days.filter((d) => d.isWorkingDay);
  const types = new Set(working.map((d) => d.locationType ?? 'OFFICE'));
  if (types.size === 0) return '—';
  if (types.size === 1) {
    const t = [...types][0];
    if (t === 'WFH') return 'WFH';
    if (t === 'HYBRID') return 'Hybrid';
    return 'Office';
  }
  return 'Mixed';
}

function scheduleToFormDays(schedule: WorkSchedule): DayFormState[] {
  return WEEK_DAYS.map((d) => {
    const existing = schedule.days.find((sd) => sd.dayOfWeek === d);
    if (!existing || !existing.isWorkingDay) return DEFAULT_DAY(d);
    return {
      dayOfWeek: d,
      label: DAY_LABELS[d] ?? String(d),
      enabled: true,
      startTime: existing.startTime ?? '08:00',
      endTime: existing.endTime ?? '17:00',
      breakStart: existing.breakStart ?? '12:00',
      breakEnd: existing.breakEnd ?? '13:00',
      locationType: (existing.locationType ?? 'OFFICE') as LocationType,
      isFlexible: existing.isFlexible,
      requiredHours: existing.requiredHours ?? 8,
    };
  });
}

/* ─── Component ─────────────────────────────────────────────────── */

export function WorkingSchedulesSettingsTab(): React.ReactNode {
  const { success, error } = useToast();

  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDays, setNewDays] = useState<DayFormState[]>(DEFAULT_DAYS);

  const [editTarget, setEditTarget] = useState<WorkSchedule | null>(null);
  const [editName, setEditName] = useState('');
  const [editDays, setEditDays] = useState<DayFormState[]>(DEFAULT_DAYS);
  const [deleteTarget, setDeleteTarget] = useState<WorkSchedule | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const updateDay = (idx: number, patch: Partial<DayFormState>) => {
    setNewDays((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx]!, ...patch };
      return updated;
    });
  };

  const updateEditDay = (idx: number, patch: Partial<DayFormState>) => {
    setEditDays((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx]!, ...patch };
      return updated;
    });
  };

  const openEdit = (sched: WorkSchedule) => {
    setEditTarget(sched);
    setEditName(sched.name);
    setEditDays(scheduleToFormDays(sched));
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
            startTime: d.isFlexible ? null : d.startTime,
            endTime: d.isFlexible ? null : d.endTime,
            breakStart: d.isFlexible ? null : (d.breakStart || null),
            breakEnd: d.isFlexible ? null : (d.breakEnd || null),
            isWorkingDay: true,
            locationType: d.locationType,
            isFlexible: d.isFlexible,
            requiredHours: d.isFlexible ? d.requiredHours : null,
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

  const handleEdit = async () => {
    if (!editTarget) return;
    if (!editName.trim()) {
      error('Missing name', 'Please enter a schedule name.');
      return;
    }
    const workingDays = editDays.filter((d) => d.enabled);
    if (workingDays.length === 0) {
      error('No working days', 'Please enable at least one working day.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/work-schedules/${editTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          timezone: 'Asia/Manila',
          days: workingDays.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            startTime: d.isFlexible ? null : d.startTime,
            endTime: d.isFlexible ? null : d.endTime,
            breakStart: d.isFlexible ? null : (d.breakStart || null),
            breakEnd: d.isFlexible ? null : (d.breakEnd || null),
            isWorkingDay: true,
            locationType: d.locationType,
            isFlexible: d.isFlexible,
            requiredHours: d.isFlexible ? d.requiredHours : null,
          })),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to save', data.error ?? 'An error occurred.');
        return;
      }
      success('Schedule updated', `"${editName.trim()}" has been updated successfully.`);
      setEditTarget(null);
      void fetchSchedules();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/work-schedules/${deleteTarget.id}`, { method: 'DELETE' });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Cannot delete', data.error ?? 'An error occurred.');
        return;
      }
      success('Schedule deleted', `"${deleteTarget.name}" has been removed.`);
      setDeleteTarget(null);
      void fetchSchedules();
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setDeleting(false);
    }
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
                <th className="text-left px-4 py-3 font-black uppercase text-xs tracking-wider hidden lg:table-cell">Location</th>
                <th className="text-right px-4 py-3 font-black uppercase text-xs tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchedules.map((sched) => {
                const locLabel = locationDisplay(sched.days);
                return (
                  <React.Fragment key={sched.id}>
                    <tr className="border-t border-border/70 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{sched.name}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">
                        {workingDaysLabel(sched.days)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell text-xs">
                        {hoursDisplay(sched.days)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {locLabel !== '—' ? (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${TABLE_LOCATION_COLOR[locLabel] ?? ''}`}>
                            {locLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title="Edit schedule"
                            onClick={() => openEdit(sched)}
                            className="inline-flex items-center justify-center rounded-md bg-slate-100 p-1.5 text-slate-600 dark:text-foreground hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            title="Delete schedule"
                            onClick={() => setDeleteTarget(sched)}
                            className="inline-flex items-center justify-center rounded-md bg-slate-100 p-1.5 text-slate-600 dark:text-foreground hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedId(expandedId === sched.id ? null : sched.id)}
                            className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-foreground hover:bg-slate-200"
                          >
                            {expandedId === sched.id ? <><ChevronUp size={13} /> Hide</> : <><ChevronDown size={13} /> View</>}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded day details */}
                    {expandedId === sched.id && (
                      <tr className="border-t border-border/40 bg-muted/10">
                        <td colSpan={5} className="px-4 py-3">
                          <div className="space-y-2">
                            {sched.days
                              .filter((d) => d.isWorkingDay)
                              .map((d) => {
                                const loc = (d.locationType ?? 'OFFICE') as LocationType;
                                return (
                                  <div key={d.dayOfWeek} className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className="w-24 font-semibold text-foreground shrink-0">{DAY_LABELS[d.dayOfWeek]}</span>
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${LOCATION_COLOR[loc] ?? ''}`}>
                                      {loc === 'WFH' ? <Home size={10} /> : loc === 'HYBRID' ? <Layers size={10} /> : <Building2 size={10} />}
                                      {loc === 'WFH' ? 'WFH' : loc === 'HYBRID' ? 'Hybrid' : 'Office'}
                                    </span>
                                    {d.isFlexible ? (
                                      <span className="text-muted-foreground">
                                        Flexible — render <span className="font-semibold text-foreground">{d.requiredHours ?? '?'}h</span>
                                      </span>
                                    ) : (
                                      <>
                                        <span className="text-muted-foreground">
                                          {formatTime(d.startTime)} – {formatTime(d.endTime)}
                                        </span>
                                        {d.breakStart && d.breakEnd && (
                                          <span className="text-muted-foreground/70">
                                            Break: {formatTime(d.breakStart)} – {formatTime(d.breakEnd)}
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
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
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
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
              <div key={day.dayOfWeek} className="rounded-lg border border-border p-3 space-y-2.5">
                {/* Row 1: toggle + day name + location pills + mode toggle */}
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateDay(idx, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border shrink-0"
                  />
                  <span className={`text-xs font-bold w-20 shrink-0 ${day.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {day.label}
                  </span>

                  {day.enabled && (
                    <>
                      {/* Location type pills */}
                      <div className="flex items-center gap-1">
                        {LOCATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateDay(idx, { locationType: opt.value })}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              day.locationType === opt.value
                                ? LOCATION_COLOR[opt.value]
                                : 'border-border text-muted-foreground hover:border-rose-400 hover:text-foreground'
                            }`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>

                      {/* Fixed / Flexible mode toggle */}
                      <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto">
                        <button
                          type="button"
                          onClick={() => updateDay(idx, { isFlexible: false })}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            !day.isFlexible
                              ? 'bg-rose-600 text-white'
                              : 'bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Fixed Time
                        </button>
                        <button
                          type="button"
                          onClick={() => updateDay(idx, { isFlexible: true })}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            day.isFlexible
                              ? 'bg-rose-600 text-white'
                              : 'bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Flexible
                        </button>
                      </div>
                    </>
                  )}

                  {!day.enabled && (
                    <span className="text-xs text-muted-foreground italic">Day off</span>
                  )}
                </div>

                {/* Row 2: time inputs or required hours */}
                {day.enabled && (
                  <div className="pl-7 flex items-center gap-2 flex-wrap">
                    {day.isFlexible ? (
                      <>
                        <span className="text-xs text-muted-foreground">Required hours:</span>
                        <select
                          value={day.requiredHours}
                          onChange={(e) => updateDay(idx, { requiredHours: parseInt(e.target.value, 10) })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        >
                          {[4, 5, 6, 7, 8, 9].map((h) => (
                            <option key={h} value={h}>{h} hours</option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground italic">(no fixed clock-in/out)</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateDay(idx, { startTime: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateDay(idx, { endTime: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground ml-2">Break:</span>
                        <input
                          type="time"
                          value={day.breakStart}
                          onChange={(e) => updateDay(idx, { breakStart: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) => updateDay(idx, { breakEnd: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                      </>
                    )}
                  </div>
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
      {/* Edit Schedule Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Work Schedule" size="lg">
        <div className="p-6 space-y-5">
          <div>
            <label className={labelCls}>Schedule Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Standard Office Hours"
            />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Weekly Schedule</p>
            {editDays.map((day, idx) => (
              <div key={day.dayOfWeek} className="rounded-lg border border-border p-3 space-y-2.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="checkbox"
                    checked={day.enabled}
                    onChange={(e) => updateEditDay(idx, { enabled: e.target.checked })}
                    className="h-4 w-4 rounded border-border shrink-0"
                  />
                  <span className={`text-xs font-bold w-20 shrink-0 ${day.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {day.label}
                  </span>

                  {day.enabled && (
                    <>
                      <div className="flex items-center gap-1">
                        {LOCATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => updateEditDay(idx, { locationType: opt.value })}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                              day.locationType === opt.value
                                ? LOCATION_COLOR[opt.value]
                                : 'border-border text-muted-foreground hover:border-rose-400 hover:text-foreground'
                            }`}
                          >
                            {opt.icon} {opt.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center rounded-lg border border-border overflow-hidden ml-auto">
                        <button
                          type="button"
                          onClick={() => updateEditDay(idx, { isFlexible: false })}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            !day.isFlexible ? 'bg-rose-600 text-white' : 'bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Fixed Time
                        </button>
                        <button
                          type="button"
                          onClick={() => updateEditDay(idx, { isFlexible: true })}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${
                            day.isFlexible ? 'bg-rose-600 text-white' : 'bg-background text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          Flexible
                        </button>
                      </div>
                    </>
                  )}

                  {!day.enabled && (
                    <span className="text-xs text-muted-foreground italic">Day off</span>
                  )}
                </div>

                {day.enabled && (
                  <div className="pl-7 flex items-center gap-2 flex-wrap">
                    {day.isFlexible ? (
                      <>
                        <span className="text-xs text-muted-foreground">Required hours:</span>
                        <select
                          value={day.requiredHours}
                          onChange={(e) => updateEditDay(idx, { requiredHours: parseInt(e.target.value, 10) })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        >
                          {[4, 5, 6, 7, 8, 9].map((h) => (
                            <option key={h} value={h}>{h} hours</option>
                          ))}
                        </select>
                        <span className="text-xs text-muted-foreground italic">(no fixed clock-in/out)</span>
                      </>
                    ) : (
                      <>
                        <input
                          type="time"
                          value={day.startTime}
                          onChange={(e) => updateEditDay(idx, { startTime: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">to</span>
                        <input
                          type="time"
                          value={day.endTime}
                          onChange={(e) => updateEditDay(idx, { endTime: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground ml-2">Break:</span>
                        <input
                          type="time"
                          value={day.breakStart}
                          onChange={(e) => updateEditDay(idx, { breakStart: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                        <span className="text-xs text-muted-foreground">–</span>
                        <input
                          type="time"
                          value={day.breakEnd}
                          onChange={(e) => updateEditDay(idx, { breakEnd: e.target.value })}
                          className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground"
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={saving}>
              <X size={14} className="mr-1.5" /> Cancel
            </Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Pencil size={14} className="mr-1.5" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Work Schedule" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete{' '}
            <span className="font-semibold">&ldquo;{deleteTarget?.name}&rdquo;</span>?{' '}
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Trash2 size={14} className="mr-1.5" />}
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}