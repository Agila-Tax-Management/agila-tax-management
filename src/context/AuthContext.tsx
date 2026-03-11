'use client';

import React, { createContext, useContext, useState } from 'react';

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
}

const MOCK_LOGS: AttendanceLog[] = [
  { id: 'LOG-010', date: 'Tue, Mar 10, 2026', isoDate: '2026-03-10', clockIn: '08:02:00', clockOut: '17:00:00', lunchStart: '12:01:00', lunchEnd: '13:00:00', totalHours: '7.95', status: 'Completed' },
  { id: 'LOG-009', date: 'Mon, Mar 9, 2026',  isoDate: '2026-03-09', clockIn: '08:00:00', clockOut: '17:03:00', lunchStart: '12:00:00', lunchEnd: '13:02:00', totalHours: '8.02', status: 'Completed' },
  { id: 'LOG-008', date: 'Fri, Mar 6, 2026',  isoDate: '2026-03-06', clockIn: '08:10:00', clockOut: '17:05:00', lunchStart: '12:05:00', lunchEnd: '13:00:00', totalHours: '7.83', status: 'Completed' },
  { id: 'LOG-007', date: 'Thu, Mar 5, 2026',  isoDate: '2026-03-05', clockIn: '08:00:00', clockOut: '17:00:00', lunchStart: '12:00:00', lunchEnd: '13:00:00', totalHours: '8.00', status: 'Completed' },
  { id: 'LOG-006', date: 'Wed, Mar 4, 2026',  isoDate: '2026-03-04', clockIn: '07:55:00', clockOut: '17:01:00', lunchStart: '12:00:00', lunchEnd: '12:55:00', totalHours: '8.02', status: 'Completed' },
  { id: 'LOG-005', date: 'Tue, Mar 3, 2026',  isoDate: '2026-03-03', clockIn: '08:05:00', clockOut: '17:00:00', lunchStart: '12:02:00', lunchEnd: '13:00:00', totalHours: '7.88', status: 'Completed' },
  { id: 'LOG-004', date: 'Mon, Mar 2, 2026',  isoDate: '2026-03-02', clockIn: '08:00:00', clockOut: '17:02:00', lunchStart: '12:00:00', lunchEnd: '13:00:00', totalHours: '8.03', status: 'Completed' },
  { id: 'LOG-003', date: 'Fri, Feb 27, 2026', isoDate: '2026-02-27', clockIn: '07:45:00', clockOut: '17:02:00', lunchStart: '12:01:00', lunchEnd: '12:53:00', totalHours: '8.23', status: 'Completed' },
  { id: 'LOG-002', date: 'Thu, Feb 26, 2026', isoDate: '2026-02-26', clockIn: '08:00:00', clockOut: '17:00:00', lunchStart: '12:00:00', lunchEnd: '13:04:00', totalHours: '7.93', status: 'Completed' },
  { id: 'LOG-001', date: 'Wed, Feb 25, 2026', isoDate: '2026-02-25', clockIn: '08:00:00', clockOut: '17:01:00', lunchStart: '12:04:00', lunchEnd: '13:02:00', totalHours: '8.02', status: 'Completed' },
];

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>({
    name: 'Genesis Esdrilon',
    role: 'Jr. Website Developer',
    employeeId: 'EMP-10002',
    department: 'IT Operations',
    isClockedIn: false,
    isOnLunch: false,
    clockInTime: null,
    lunchStartTime: null,
  });

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(MOCK_LOGS);

  const updateClockedIn = (val: boolean) => setUser(prev => ({ ...prev, isClockedIn: val }));
  const updateLunchStatus = (val: boolean) => setUser(prev => ({ ...prev, isOnLunch: val }));
  const updateClockInTime = (val: string | null) => setUser(prev => ({ ...prev, clockInTime: val }));
  const updateLunchStartTime = (val: string | null) => setUser(prev => ({ ...prev, lunchStartTime: val }));

  return (
    <AuthContext.Provider value={{
      user,
      attendanceLogs,
      setAttendanceLogs,
      updateClockedIn,
      updateLunchStatus,
      updateClockInTime,
      updateLunchStartTime,
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
