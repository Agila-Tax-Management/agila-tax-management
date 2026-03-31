'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import {
  CalendarRange,
  CircleCheckBig,
  ChartPie,
  Clock3,
  AlertTriangle,
  OctagonAlert,
} from 'lucide-react';

type BadgeVariant = 'neutral' | 'info' | 'warning' | 'success' | 'danger';

type PeriodMode = 'day' | 'week' | 'month';

interface LiaisonReportData {
  cards: {
    done: number;
    inProgress: number;
    delayed: number;
    overdue: number;
  };
  statusBreakdown: Array<{
    name: string;
    count: number;
    percentage: number;
    color: string;
    variant: BadgeVariant;
  }>;
  employeeSummary: Array<{
    id: number;
    name: string;
    done: number;
    inProgress: number;
    delayed: number;
    overdue: number;
    total: number;
  }>;
  tasks: Array<{
    id: number;
    name: string;
    assigneeName: string;
    dueDate: string | null;
    statusName: string;
    statusColor: string;
    statusVariant: BadgeVariant;
  }>;
}

const EMPTY_REPORT_DATA: LiaisonReportData = {
  cards: {
    done: 0,
    inProgress: 0,
    delayed: 0,
    overdue: 0,
  },
  statusBreakdown: [],
  employeeSummary: [],
  tasks: [],
};

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toMonthInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseDateInput(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function parseMonthInput(value: string): Date {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, 1);
}

function startOfWeek(date: Date): Date {
  const result = new Date(date);
  const dayIndex = result.getDay();
  const diffToMonday = (dayIndex + 6) % 7;
  result.setDate(result.getDate() - diffToMonday);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function fmtDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function statusVariant(name: string): 'neutral' | 'info' | 'warning' | 'success' | 'danger' {
  const lower = name.toLowerCase();
  if (/done|complet|finish/.test(lower)) return 'success';
  if (/progress|doing|active|ongoing/.test(lower)) return 'info';
  if (/review|pending|wait|hold/.test(lower)) return 'warning';
  if (/cancel|block|reject|fail/.test(lower)) return 'danger';
  return 'neutral';
}

export function LiaisonReports() {
  const [mode, setMode] = useState<PeriodMode>('day');
  const [dayValue, setDayValue] = useState<string>(() => toDateInputValue(new Date()));
  const [weekAnchorValue, setWeekAnchorValue] = useState<string>(() => toDateInputValue(new Date()));
  const [monthValue, setMonthValue] = useState<string>(() => toMonthInputValue(new Date()));
  const [data, setData] = useState<LiaisonReportData>(EMPTY_REPORT_DATA);
  const [isLoading, setIsLoading] = useState(true);

  const selectedRangeLabel = useMemo(() => {
    if (mode === 'day') {
      return fmtDate(parseDateInput(dayValue));
    }

    if (mode === 'week') {
      const anchor = parseDateInput(weekAnchorValue);
      const start = startOfWeek(anchor);
      const end = endOfWeek(anchor);
      return `${fmtDate(start)} - ${fmtDate(end)}`;
    }

    const month = parseMonthInput(monthValue);
    return new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(month);
  }, [mode, dayValue, weekAnchorValue, monthValue]);

  /* eslint-disable react-hooks/set-state-in-effect -- fetching liaison report data from API */
  useEffect(() => {
    async function loadReport(): Promise<void> {
      setIsLoading(true);

      const searchParams = new URLSearchParams({ mode });
      if (mode === 'month') {
        searchParams.set('month', monthValue);
      } else if (mode === 'week') {
        searchParams.set('date', weekAnchorValue);
      } else {
        searchParams.set('date', dayValue);
      }

      try {
        const response = await fetch(`/api/liaison/reports?${searchParams.toString()}`, { cache: 'no-store' });
        if (!response.ok) {
          setData(EMPTY_REPORT_DATA);
          return;
        }

        const json = (await response.json()) as { data?: LiaisonReportData };
        setData(json.data ?? EMPTY_REPORT_DATA);
      } catch {
        setData(EMPTY_REPORT_DATA);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReport();
  }, [mode, dayValue, weekAnchorValue, monthValue]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Liaison Reports</h2>
        <p className="text-sm text-slate-500 font-medium">Track liaison task statuses by day, week, or month.</p>
      </div>

      <Card className="p-5 border-none shadow-sm bg-white space-y-4">
        <div className="flex items-center gap-2">
          <CalendarRange size={16} className="text-slate-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Report Period</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={mode === 'day' ? 'primary' : 'outline'}
            className="rounded-xl"
            onClick={() => setMode('day')}
          >
            Day
          </Button>
          <Button
            type="button"
            variant={mode === 'week' ? 'primary' : 'outline'}
            className="rounded-xl"
            onClick={() => setMode('week')}
          >
            Week
          </Button>
          <Button
            type="button"
            variant={mode === 'month' ? 'primary' : 'outline'}
            className="rounded-xl"
            onClick={() => setMode('month')}
          >
            Month
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          {mode === 'day' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Select Day</label>
              <Input
                type="date"
                value={dayValue}
                onChange={(event) => setDayValue(event.target.value)}
                className="bg-white border-slate-200 rounded-xl"
              />
            </div>
          )}

          {mode === 'week' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Select Week (Anchor Date)</label>
              <Input
                type="date"
                value={weekAnchorValue}
                onChange={(event) => setWeekAnchorValue(event.target.value)}
                className="bg-white border-slate-200 rounded-xl"
              />
            </div>
          )}

          {mode === 'month' && (
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500">Select Month</label>
              <Input
                type="month"
                value={monthValue}
                onChange={(event) => setMonthValue(event.target.value)}
                className="bg-white border-slate-200 rounded-xl"
              />
            </div>
          )}

          <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selected Range</p>
            <p className="text-sm font-bold text-slate-700 mt-1">{selectedRangeLabel}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Done</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.done}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CircleCheckBig size={20} className="text-emerald-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">In Progress</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.inProgress}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
              <Clock3 size={20} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Delayed</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.delayed}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5 border-none shadow-sm bg-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Overdue</p>
              <p className="text-3xl font-black text-slate-800 mt-2">{data.cards.overdue}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center">
              <OctagonAlert size={20} className="text-rose-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-5 border-none shadow-sm bg-white">
        <div className="flex items-center gap-2 mb-4">
          <ChartPie size={16} className="text-slate-500" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-500">Task Status Breakdown</h3>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">Loading liaison task report...</p>
          </div>
        ) : data.statusBreakdown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No liaison tasks found in the selected period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-widest font-black">
                <tr>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Count</th>
                  <th className="text-right px-4 py-3">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.statusBreakdown.map((status) => (
                  <tr key={status.name}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: status.color }}
                        />
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.name}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{status.count}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{status.percentage.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5 border-none shadow-sm bg-white">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Liaison Employee Task Summary</h3>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">Loading employee task summary...</p>
          </div>
        ) : data.employeeSummary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No employees found under Liaison department.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-widest font-black">
                <tr>
                  <th className="text-left px-4 py-3">Employee</th>
                  <th className="text-right px-4 py-3">Done</th>
                  <th className="text-right px-4 py-3">In Progress</th>
                  <th className="text-right px-4 py-3">Delayed</th>
                  <th className="text-right px-4 py-3">Overdue</th>
                  <th className="text-right px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employeeSummary.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-semibold text-slate-700">{row.name}</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-700">{row.done}</td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">{row.inProgress}</td>
                    <td className="px-4 py-3 text-right font-bold text-amber-700">{row.delayed}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-700">{row.overdue}</td>
                    <td className="px-4 py-3 text-right font-bold text-slate-700">{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card className="p-5 border-none shadow-sm bg-white">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Tasks In Selected Range</h3>

        {isLoading ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">Loading tasks...</p>
          </div>
        ) : data.tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
            <p className="text-sm text-slate-500 font-medium">No tasks due in this selected range.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.tasks
              .slice()
              .sort((a, b) => {
                const left = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                const right = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                return left - right;
              })
              .map((task) => {
                return (
                  <div key={task.id} className="rounded-xl border border-slate-200 px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{task.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{task.assigneeName}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={task.statusVariant} className="text-[10px]">
                        {task.statusName}
                      </Badge>
                      <span className="text-xs font-semibold text-slate-500">
                        Due {task.dueDate ? fmtDate(new Date(task.dueDate)) : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </Card>
    </div>
  );
}
