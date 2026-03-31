'use client';

// src/components/hr/AttendanceTracking.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Loader2, Pencil, Trash2, Calendar } from 'lucide-react';
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
  lunchStart: string | null;
  lunchEnd: string | null;
  timeOut: string | null;
  hoursWorked: number;
  overtime: number;
  status: UIStatus;
  notes: string;
}

interface Department {
  id: number;
  name: string;
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
  Present:    'success',
  Late:       'warning',
  Absent:     'danger',
  'Half Day': 'neutral',
  'On Leave': 'info',
  'Day Off':  'neutral',
  Holiday:    'info',
};

function fmtIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ── 12H Time Helpers ─────────────────────────────────────────────────────────

interface TimeState {
  enabled: boolean;
  h: string;      // "1"–"12"
  m: string;      // "00"–"59"
  period: 'AM' | 'PM';
}

/** Parse an API "HH:MM" string into a 12H TimeState. */
function initTimeState(hhmm: string | null): TimeState {
  if (!hhmm) return { enabled: false, h: '8', m: '00', period: 'AM' };
  const [hStr, mStr] = hhmm.split(':');
  const h24 = parseInt(hStr ?? '0', 10);
  const m   = String(parseInt(mStr ?? '0', 10)).padStart(2, '0');
  if (isNaN(h24)) return { enabled: false, h: '8', m: '00', period: 'AM' };
  const period: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return { enabled: true, h: String(h12), m, period };
}

/** Convert a 12H TimeState to "HH:MM" 24H string for the API. */
function to24HString(ts: TimeState): string {
  let hour = parseInt(ts.h, 10);
  if (ts.period === 'AM' && hour === 12) hour = 0;
  else if (ts.period === 'PM' && hour !== 12) hour += 12;
  return `${String(hour).padStart(2, '0')}:${ts.m}`;
}

const TIME_HOURS   = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const;
const TIME_MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface TimeFieldProps {
  label: string;
  value: TimeState;
  onChange: (v: TimeState) => void;
}

function TimeField({ label, value: ts, onChange }: TimeFieldProps): React.ReactNode {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</span>
        <button
          type="button"
          onClick={() => onChange({ ...ts, enabled: !ts.enabled })}
          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
            ts.enabled
              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
          }`}
        >
          {ts.enabled ? 'Set' : 'Not set'}
        </button>
      </div>
      <div className={`flex items-center gap-1.5 transition-opacity ${ts.enabled ? '' : 'opacity-30 pointer-events-none'}`}>
        <select
          value={ts.h}
          onChange={e => onChange({ ...ts, h: e.target.value })}
          className="px-2 py-2.5 text-sm border border-slate-200 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-center"
        >
          {TIME_HOURS.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="text-slate-400 font-bold select-none">:</span>
        <select
          value={ts.m}
          onChange={e => onChange({ ...ts, m: e.target.value })}
          className="px-2 py-2.5 text-sm border border-slate-200 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-center"
        >
          {TIME_MINUTES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <button
          type="button"
          onClick={() => onChange({ ...ts, period: ts.period === 'AM' ? 'PM' : 'AM' })}
          className={`px-3 py-2.5 text-sm font-bold border rounded-lg transition-colors min-w-13 ${
            ts.period === 'AM'
              ? 'border-slate-200 text-slate-700 hover:bg-slate-50'
              : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
          }`}
        >
          {ts.period}
        </button>
      </div>
    </div>
  );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

interface EditModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onSaved: () => void;
}

function EditModal({ record, onClose, onSaved }: EditModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);

  const [timeIn,     setTimeIn]     = useState<TimeState>(() => initTimeState(record.timeIn));
  const [lunchStart, setLunchStart] = useState<TimeState>(() => initTimeState(record.lunchStart));
  const [lunchEnd,   setLunchEnd]   = useState<TimeState>(() => initTimeState(record.lunchEnd));
  const [timeOut,    setTimeOut]    = useState<TimeState>(() => initTimeState(record.timeOut));

  async function handleSave() {
    setSaving(true);
    try {
      // Convert each 12H TimeState to HH:MM 24H before sending to the API
      const body = {
        timeIn:     timeIn.enabled     ? to24HString(timeIn)     : null,
        lunchStart: lunchStart.enabled ? to24HString(lunchStart) : null,
        lunchEnd:   lunchEnd.enabled   ? to24HString(lunchEnd)   : null,
        timeOut:    timeOut.enabled    ? to24HString(timeOut)    : null,
      };
      const res = await fetch(`/api/hr/attendance/${record.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Failed to update', json.error ?? 'Something went wrong.');
        return;
      }
      success('Attendance updated', `${record.employeeName}'s punches have been saved.`);
      onSaved();
      onClose();
    } catch {
      toastError('Failed to update', 'Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Edit Attendance</h2>
          <p className="text-sm text-slate-500 mt-0.5">{record.employeeName}</p>
        </div>
        <div className="p-6 space-y-4">
          <TimeField label="Time In"     value={timeIn}     onChange={setTimeIn}     />
          <TimeField label="Lunch Start" value={lunchStart} onChange={setLunchStart} />
          <TimeField label="Lunch End"   value={lunchEnd}   onChange={setLunchEnd}   />
          <TimeField label="Time Out"    value={timeOut}    onChange={setTimeOut}    />
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="px-4 py-2 text-sm font-bold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

interface DeleteModalProps {
  record: AttendanceRecord;
  onClose: () => void;
  onDeleted: () => void;
}

function DeleteModal({ record, onClose, onDeleted }: DeleteModalProps): React.ReactNode {
  const { success, error: toastError } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canConfirm = confirmText === 'delete';

  async function handleDelete() {
    if (!canConfirm) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hr/attendance/${record.id}`, { method: 'DELETE' });
      const json = await res.json() as { error?: string };
      if (!res.ok) {
        toastError('Failed to delete', json.error ?? 'Something went wrong.');
        return;
      }
      success('Record deleted', `${record.employeeName}'s attendance record has been removed.`);
      onDeleted();
      onClose();
    } catch {
      toastError('Failed to delete', 'Network error. Please try again.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-red-600">Delete Attendance Record</h2>
          <p className="text-sm text-slate-500 mt-0.5">{record.employeeName}</p>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            This will permanently delete this attendance record. This action cannot be undone.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1 uppercase tracking-wider">
              Type <span className="text-red-600 font-mono">delete</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder="delete"
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500"
            />
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleting}
            className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleDelete()}
            disabled={!canConfirm || deleting}
            className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting && <Loader2 size={14} className="animate-spin" />}
            Delete Record
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AttendanceTracking(): React.ReactNode {
  const { error: toastError } = useToast();

  const [currentDate, setCurrentDate] = useState<string>(() => fmtIso(new Date()));
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('');

  const [departments, setDepartments] = useState<Department[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({ present: 0, late: 0, absent: 0, totalHours: 0, totalOvertime: 0 });
  const [isLoading, setIsLoading] = useState(false);

  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<AttendanceRecord | null>(null);

  const dateInputRef = useRef<HTMLInputElement>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- Hydration-safe: fetch on mount */
  useEffect(() => {
    void fetch('/api/hr/departments')
      .then(r => r.json())
      .then((json: { data?: Department[] }) => {
        if (json.data) setDepartments(json.data);
      });
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const fetchAttendance = useCallback(async (
    date: string,
    searchTerm: string,
    status: string,
    department: string,
  ) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ date, search: searchTerm, status, department });
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
    void fetchAttendance(currentDate, search, statusFilter, departmentFilter);
  }, [currentDate, search, statusFilter, departmentFilter, fetchAttendance]);

  function shiftDate(delta: number) {
    const [y, mo, d] = currentDate.split('-').map(Number);
    const next = new Date(y, mo - 1, d + delta);
    if (next > new Date()) return;
    setCurrentDate(fmtIso(next));
  }

  function handleDateInput(value: string) {
    if (!value) return;
    const chosen = new Date(value + 'T00:00:00');
    if (chosen > new Date()) return;
    setCurrentDate(value);
  }

  function openDatePicker() {
    dateInputRef.current?.showPicker();
  }

  const todayStr = fmtIso(new Date());
  const isToday = currentDate === todayStr;

  function refresh() {
    void fetchAttendance(currentDate, search, statusFilter, departmentFilter);
  }

  const hasRealId = (id: string) => !id.startsWith('no-ts-');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Attendance Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">View and manage employee attendance from timesheet records</p>
      </div>

      {/* Date Navigation & Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Card className="p-4 flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-1.5 rounded-lg hover:bg-slate-100"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Hidden date input — triggered programmatically */}
          <input
            ref={dateInputRef}
            type="date"
            value={currentDate}
            max={todayStr}
            onChange={e => handleDateInput(e.target.value)}
            className="sr-only"
          />
          <button
            onClick={openDatePicker}
            className="text-center min-w-36 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="flex items-center justify-center gap-1.5">
              <Calendar size={13} className="text-slate-400 shrink-0" />
              <p className="text-base font-black text-slate-900">{currentDate}</p>
            </div>
            <p className="text-[10px] text-slate-400 uppercase font-bold">
              {new Date(currentDate + 'T00:00:00').toLocaleDateString('en-PH', { weekday: 'long' })}
            </p>
          </button>

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
            { label: 'Present',     value: stats.present,                        color: 'text-emerald-600' },
            { label: 'Late',        value: stats.late,                           color: 'text-amber-600'   },
            { label: 'Absent',      value: stats.absent,                         color: 'text-red-600'     },
            { label: 'Total Hours', value: stats.totalHours.toFixed(1),          color: 'text-blue-600'    },
            { label: 'Overtime',    value: `${stats.totalOvertime.toFixed(1)}h`, color: 'text-violet-600'  },
          ].map(stat => (
            <Card key={stat.label} className="p-3 text-center">
              <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
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
              placeholder="Search by name..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none"
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name.toLowerCase()}>{d.name}</option>
              ))}
            </select>
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
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden xl:table-cell">Lunch In</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden xl:table-cell">Lunch Out</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Time Out</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden sm:table-cell">Hours</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider hidden lg:table-cell">OT</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Status</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600 text-xs uppercase tracking-wider">Actions</th>
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
                    <td className="px-4 py-3 text-center hidden xl:table-cell">
                      <span className="font-mono text-sm text-slate-500">{rec.lunchStart ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden xl:table-cell">
                      <span className="font-mono text-sm text-slate-500">{rec.lunchEnd ?? '—'}</span>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditRecord(rec)}
                          disabled={!hasRealId(rec.id)}
                          title={hasRealId(rec.id) ? 'Edit' : 'No timesheet record'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteRecord(rec)}
                          disabled={!hasRealId(rec.id)}
                          title={hasRealId(rec.id) ? 'Delete' : 'No timesheet record'}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {records.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                      No attendance records for this date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modals */}
      {editRecord && (
        <EditModal
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSaved={refresh}
        />
      )}
      {deleteRecord && (
        <DeleteModal
          record={deleteRecord}
          onClose={() => setDeleteRecord(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
