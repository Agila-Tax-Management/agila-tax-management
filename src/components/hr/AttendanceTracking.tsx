'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';

type UIStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'On Leave' | 'Day Off' | 'Holiday';

interface AttendanceRecord {
  id: string;
  employeeId: number;
  employeeName: string;
  department: string;
  timeIn: string | null;
  timeOut: string | null;
  hoursWorked: number;
  overtime: number;
  status: UIStatus;
  notes: string;
}

interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  totalHours: number;
  totalOvertime: number;
}

interface ApiResponse {
  data: {
    records: AttendanceRecord[];
    stats: AttendanceStats;
  };
}

const STATUS_VARIANT: Record<UIStatus, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  Present: 'success',
  Late: 'warning',
  Absent: 'danger',
  'Half Day': 'neutral',
  'On Leave': 'info',
  'Day Off': 'neutral',
  Holiday: 'info',
};

function fmtIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function AttendanceTracking(): React.ReactNode {
  const { error: toastError } = useToast();

  const [currentDate, setCurrentDate] = useState<string>(() => fmtIso(new Date()));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, late: 0, absent: 0, totalHours: 0, totalOvertime: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchAttendance = useCallback(async (date: string, search: string, status: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ date, search, status });
      const res = await fetch(`/api/hr/attendance?${params.toString()}`);
      const json = (await res.json()) as ApiResponse & { error?: string };
      if (!res.ok) {
        toastError('Failed to load attendance', json.error ?? 'Something went wrong.');
        return;
      }
      setRecords(json.data.records);
      setStats(json.data.stats);
    } catch {
      toastError('Failed to load attendance', 'Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchAttendance(currentDate, search, statusFilter);
  }, [currentDate, search, statusFilter, fetchAttendance]);

  function shiftDate(delta: number) {
    const [y, mo, d] = currentDate.split('-').map(Number);
    const next = new Date(y, mo - 1, d + delta);
    // Don't navigate past today
    if (next > new Date()) return;
    setCurrentDate(fmtIso(next));
  }

  const isToday = currentDate === fmtIso(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Attendance Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">View employee attendance from timesheet records</p>
      </div>

      {/* Date Navigation & Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="p-4 flex items-center gap-3">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center min-w-32">
            <p className="text-lg font-black text-slate-900">{currentDate}</p>
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long' })}
            </p>
          </div>
          <button
            onClick={() => shiftDate(1)}
            disabled={isToday}
            className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={18} />
          </button>
        </Card>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 flex-1">
          {[
            { label: 'Present',    value: stats.present,                     color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Late',       value: stats.late,                        color: 'text-amber-600 bg-amber-50'   },
            { label: 'Absent',     value: stats.absent,                      color: 'text-red-600 bg-red-50'        },
            { label: 'Total Hours',value: stats.totalHours.toFixed(1),       color: 'text-blue-600 bg-blue-50'      },
            { label: 'Overtime',   value: `${stats.totalOvertime.toFixed(1)}h`, color: 'text-violet-600 bg-violet-50' },
          ].map(stat => (
            <Card key={stat.label} className="p-3 text-center">
              <p className={`text-lg font-black ${stat.color.split(' ')[0]}`}>{stat.value}</p>
              <p className="text-[9px] text-slate-400 uppercase font-bold">{stat.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or department..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Half Day">Half Day</option>
              <option value="On Leave">On Leave</option>
              <option value="Day Off">Day Off</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm font-medium">Loading attendance…</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden md:table-cell">Department</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Time In</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Time Out</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Hours</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">OT</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {records.map(rec => (
                  <tr key={rec.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-900 text-sm">{rec.employeeName}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{rec.department}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-sm">{rec.timeIn ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono text-sm">{rec.timeOut ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 hidden sm:table-cell">
                      {rec.hoursWorked > 0 ? rec.hoursWorked.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {rec.overtime > 0 ? (
                        <span className="text-violet-600 font-bold">{rec.overtime.toFixed(1)}h</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[rec.status]}>{rec.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400 hidden lg:table-cell max-w-48 truncate">
                      {rec.notes || '—'}
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      No attendance records for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
