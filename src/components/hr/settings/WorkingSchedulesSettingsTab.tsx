'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';

interface ScheduleFormState {
  templateName: string;
  timeIn: string;
  timeOut: string;
  breakMinutes: number;
  gracePeriodMinutes: number;
  workingDays: {
    mon: boolean;
    tue: boolean;
    wed: boolean;
    thu: boolean;
    fri: boolean;
    sat: boolean;
    sun: boolean;
  };
}

const INITIAL_STATE: ScheduleFormState = {
  templateName: 'Standard Office Schedule',
  timeIn: '08:00',
  timeOut: '17:00',
  breakMinutes: 60,
  gracePeriodMinutes: 15,
  workingDays: {
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: false,
    sun: false,
  },
};

const DAY_OPTIONS: Array<{ key: keyof ScheduleFormState['workingDays']; label: string }> = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

export function WorkingSchedulesSettingsTab(): React.ReactNode {
  const { success, error } = useToast();
  const [form, setForm] = useState<ScheduleFormState>(INITIAL_STATE);

  const handleSave = () => {
    if (!form.templateName.trim()) {
      error('Failed to save', 'Template name is required.');
      return;
    }

    if (form.timeIn >= form.timeOut) {
      error('Failed to save', 'Time out must be later than time in.');
      return;
    }

    const enabledDays = Object.values(form.workingDays).filter(Boolean).length;
    if (enabledDays === 0) {
      error('Failed to save', 'Select at least one working day.');
      return;
    }

    success('Working schedule updated', 'Schedule settings have been saved.');
  };

  return (
    <Card className="p-6 sm:p-7 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">Working Schedules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure default working schedule template used in HR operations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="text-sm font-semibold text-foreground">
          Template Name
          <input
            type="text"
            value={form.templateName}
            onChange={(event) => setForm((prev) => ({ ...prev, templateName: event.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>

        <label className="text-sm font-semibold text-foreground">
          Break (minutes)
          <input
            type="number"
            min={0}
            value={form.breakMinutes}
            onChange={(event) => setForm((prev) => ({ ...prev, breakMinutes: Number(event.target.value) || 0 }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="text-sm font-semibold text-foreground">
          Time In
          <input
            type="time"
            value={form.timeIn}
            onChange={(event) => setForm((prev) => ({ ...prev, timeIn: event.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>

        <label className="text-sm font-semibold text-foreground">
          Time Out
          <input
            type="time"
            value={form.timeOut}
            onChange={(event) => setForm((prev) => ({ ...prev, timeOut: event.target.value }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>

        <label className="text-sm font-semibold text-foreground">
          Grace Period (minutes)
          <input
            type="number"
            min={0}
            value={form.gracePeriodMinutes}
            onChange={(event) => setForm((prev) => ({ ...prev, gracePeriodMinutes: Number(event.target.value) || 0 }))}
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </label>
      </div>

      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Working Days</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {DAY_OPTIONS.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => setForm((prev) => ({
                ...prev,
                workingDays: {
                  ...prev.workingDays,
                  [day.key]: !prev.workingDays[day.key],
                },
              }))}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                form.workingDays[day.key]
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {day.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={handleSave}>
          Save Working Schedule
        </Button>
      </div>
    </Card>
  );
}
