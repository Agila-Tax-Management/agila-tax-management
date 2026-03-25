'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AttendanceLog {
  id: string;
  date: string;
  isoDate: string;
  clockIn: string;
  clockOut: string;
  lunchStart: string;
  lunchEnd: string;
  totalHours: string;
  status: 'Completed' | 'In Progress';
}

interface User {
  name: string;
  role: string;
  employeeId: string;
  department: string;
  isClockedIn: boolean;
  isOnLunch: boolean;
  clockInTime: string | null;
  lunchStartTime: string | null;
}

interface AuthContextType {
  user: User | null;
  attendanceLogs: AttendanceLog[];
  setAttendanceLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  updateClockedIn: (val: boolean) => void;
  updateLunchStatus: (val: boolean) => void;
  updateClockInTime: (val: string | null) => void;
  updateLunchStartTime: (val: string | null) => void;
  hasActiveContract: boolean;
  hasActiveCompensation: boolean;
  isLoadingEmployee: boolean;
}

// ── Internal API types ───────────────────────────────────────────────────────
interface ApiTimesheetRecord {
  id: string;
  isoDate: string;
  status: string;
  timeIn: string | null;
  lunchStart: string | null;
  lunchEnd: string | null;
  timeOut: string | null;
  regularHours: string;
}

interface TimesheetApiData {
  employee: {
    firstName: string;
    middleName: string | null;
    lastName: string;
    nameExtension: string | null;
    employeeNo: string | null;
    department: string | null;
    position: string | null;
  };
  hasActiveContract: boolean;
  hasActiveCompensation: boolean;
  todayRecord: ApiTimesheetRecord | null;
  records: ApiTimesheetRecord[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_SHORT   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function fmtLogDate(d: Date): string {
  return `${DAY_SHORT[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtTime(d: Date): string {
  return [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map(n => String(n).padStart(2, '0'))
    .join(':');
}

function mapApiRecord(r: ApiTimesheetRecord): AttendanceLog {
  return {
    id: r.id,
    date: fmtLogDate(new Date(`${r.isoDate}T00:00:00`)),
    isoDate: r.isoDate,
    clockIn:    r.timeIn     ? fmtTime(new Date(r.timeIn))     : '-',
    clockOut:   r.timeOut    ? fmtTime(new Date(r.timeOut))    : '-',
    lunchStart: r.lunchStart ? fmtTime(new Date(r.lunchStart)) : '-',
    lunchEnd:   r.lunchEnd   ? fmtTime(new Date(r.lunchEnd))   : '-',
    totalHours: r.regularHours ?? '0.00',
    status:     r.timeOut    ? 'Completed' : 'In Progress',
  };
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,                  setUser]                  = useState<User | null>(null);
  const [attendanceLogs,        setAttendanceLogs]        = useState<AttendanceLog[]>([]);
  const [hasActiveContract,     setHasActiveContract]     = useState(false);
  const [hasActiveCompensation, setHasActiveCompensation] = useState(false);
  const [isLoadingEmployee,     setIsLoadingEmployee]     = useState(true);

  /* eslint-disable react-hooks/set-state-in-effect -- Seeds real employee data from API after mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/dashboard/timesheet/me');
        if (!res.ok || cancelled) { setIsLoadingEmployee(false); return; }
        const json = (await res.json()) as { data?: TimesheetApiData };
        if (cancelled) return;
        const d = json.data;
        if (!d) { setIsLoadingEmployee(false); return; }
        const { employee, hasActiveContract: hac, hasActiveCompensation: hacp, todayRecord, records } = d;
        const nameParts = [
          employee.firstName,
          employee.middleName ? `${employee.middleName[0]}.` : null,
          employee.lastName,
          employee.nameExtension,
        ].filter(Boolean);
        setUser({
          name:          nameParts.join(' '),
          role:          employee.position   ?? 'Employee',
          employeeId:    employee.employeeNo ?? '',
          department:    employee.department ?? '',
          isClockedIn:   !!todayRecord?.timeIn && !todayRecord?.timeOut,
          isOnLunch:     !!todayRecord?.lunchStart && !todayRecord?.lunchEnd,
          clockInTime:   todayRecord?.timeIn    ?? null,
          lunchStartTime:todayRecord?.lunchStart ?? null,
        });
        setHasActiveContract(hac);
        setHasActiveCompensation(hacp);
        setAttendanceLogs(records.map(mapApiRecord));
      } catch {
        // silent — UI handles null user
      } finally {
        if (!cancelled) setIsLoadingEmployee(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const updateClockedIn      = (val: boolean)       => setUser(p => p ? { ...p, isClockedIn:    val } : p);
  const updateLunchStatus    = (val: boolean)       => setUser(p => p ? { ...p, isOnLunch:       val } : p);
  const updateClockInTime    = (val: string | null) => setUser(p => p ? { ...p, clockInTime:     val } : p);
  const updateLunchStartTime = (val: string | null) => setUser(p => p ? { ...p, lunchStartTime:  val } : p);

  return (
    <AuthContext.Provider value={{
      user,
      attendanceLogs,
      setAttendanceLogs,
      updateClockedIn,
      updateLunchStatus,
      updateClockInTime,
      updateLunchStartTime,
      hasActiveContract,
      hasActiveCompensation,
      isLoadingEmployee,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
