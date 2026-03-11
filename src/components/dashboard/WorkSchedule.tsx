'use client';

import React, { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  Calendar, User, Clock, ChevronLeft, ChevronRight,
  ArrowLeft, Utensils,
} from 'lucide-react';

// ── Date helpers (no locale) ──────────────────────────────────────────────────
const MS   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

const fmtShort = (d: Date) => `${MS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const isoOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const getWeekDates = (offset: number): Date[] => {
  const today = new Date(); today.setHours(0,0,0,0);
  const dow   = today.getDay();
  const diff  = dow === 0 ? -6 : 1 - dow;
  const mon   = new Date(today);
  mon.setDate(today.getDate() + diff + offset * 7);
  const sun = new Date(mon); sun.setDate(mon.getDate() - 1);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sun); d.setDate(sun.getDate() + i); return d;
  });
};

// ── Types ─────────────────────────────────────────────────────────────────────
type RestDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface ScheduleMeta {
  employeeName: string;
  employeeNo: string;
  department: string;
  shiftStart: string;
  shiftEnd: string;
  lunchStart: string;
  lunchEnd: string;
  restDays: RestDay[];
  hoursPerDay: number;
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK_SCHEDULES: Record<string, ScheduleMeta> = {
  'EMP-10002': {
    employeeName: 'Genesis Esdrilon',
    employeeNo:   'EMP-10002',
    department:   'IT Operations',
    shiftStart:   '8:00 AM',
    shiftEnd:     '5:00 PM',
    lunchStart:   '12:00 PM',
    lunchEnd:     '1:00 PM',
    restDays:     [0, 6],
    hoursPerDay:  8,
  },
};

const FALLBACK_EMP = 'EMP-10002';

// ── Component ─────────────────────────────────────────────────────────────────
export const WorkSchedule: React.FC = () => {
  const router  = useRouter();
  const params  = useSearchParams();
  const empNo   = params.get('emp') ?? FALLBACK_EMP;
  const meta    = MOCK_SCHEDULES[empNo] ?? MOCK_SCHEDULES[FALLBACK_EMP];

  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today     = todayIso();

  const weekLabel = (() => {
    const start = weekDates[0];
    const end   = weekDates[6];
    if (start.getMonth() === end.getMonth())
      return `${MS[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${end.getFullYear()}`;
    return `${MS[start.getMonth()]} ${start.getDate()} – ${MS[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  })();

  const scheduleRows = weekDates.map(d => ({
    date:       d,
    iso:        isoOf(d),
    dayName:    DS[d.getDay()],
    dateLabel:  fmtShort(d),
    isRestDay:  meta.restDays.includes(d.getDay() as RestDay),
    isToday:    isoOf(d) === today,
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-350 mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 p-0 rounded-xl hover:bg-slate-100 text-slate-500"
          >
            <ArrowLeft size={20} />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Work Schedule</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                {empNo} — weekly schedule & rest days
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Employee',     value: meta.employeeName,  icon: <User size={18}/>,     bg: 'bg-blue-50',    color: 'text-blue-600'    },
          { label: 'Department',   value: meta.department,    icon: <User size={18}/>,     bg: 'bg-slate-50',   color: 'text-slate-600'   },
          { label: 'Shift Hours',  value: `${meta.shiftStart} – ${meta.shiftEnd}`, icon: <Clock size={18}/>, bg: 'bg-emerald-50', color: 'text-emerald-600' },
          { label: 'Lunch Break',  value: `${meta.lunchStart} – ${meta.lunchEnd}`, icon: <Utensils size={18}/>, bg: 'bg-amber-50', color: 'text-amber-600' },
        ].map(c => (
          <Card key={c.label} className="p-4 border-none shadow-sm bg-white rounded-2xl flex items-center gap-4">
            <div className={`w-10 h-10 ${c.bg} ${c.color} rounded-xl flex items-center justify-center shrink-0`}>
              {c.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.label}</p>
              <p className="text-sm font-bold text-slate-900 truncate">{c.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setWeekOffset(p => p - 1)}
          className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-blue-100 rounded-lg px-4 h-10"
        >
          <ChevronLeft size={16} /> Previous Week
        </Button>
        <div className="text-center">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{weekLabel}</h2>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-[10px] font-bold text-blue-500 hover:underline mt-0.5"
            >
              Back to current week
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          onClick={() => setWeekOffset(p => p + 1)}
          className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2 border border-blue-100 rounded-lg px-4 h-10"
        >
          Next Week <ChevronRight size={16} />
        </Button>
      </div>

      {/* Weekly Day Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {scheduleRows.map((row, i) => (
          <Card
            key={i}
            className={`p-4 border-none shadow-sm rounded-2xl flex flex-col items-center text-center space-y-3 transition-all hover:shadow-md relative ${
              row.isToday ? 'ring-2 ring-blue-600' : ''
            } ${row.isRestDay ? 'bg-rose-50' : 'bg-white'}`}
          >
            {row.isToday && (
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Today
              </span>
            )}
            <div className="space-y-0.5 mt-1">
              <p className={`text-xs font-black uppercase tracking-widest ${row.isRestDay ? 'text-rose-600' : 'text-slate-900'}`}>
                {row.dayName.slice(0, 3)}
              </p>
              <p className="text-[10px] font-bold text-slate-400">
                {MS[row.date.getMonth()]} {row.date.getDate()}
              </p>
            </div>

            {row.isRestDay ? (
              <div className="py-3">
                <Badge className="bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-md">
                  <Clock size={9} className="mr-1" /> Rest Day
                </Badge>
              </div>
            ) : (
              <div className="w-full space-y-2">
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time In</span>
                  <span className="text-[10px] font-bold text-blue-600">{meta.shiftStart}</span>
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Time Out</span>
                  <span className="text-[10px] font-bold text-blue-600">{meta.shiftEnd}</span>
                </div>
                <div className="flex flex-col items-start border-t border-slate-100 pt-2">
                  <div className="flex items-center gap-1">
                    <Utensils size={9} className="text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Lunch</span>
                  </div>
                  <span className="text-[9px] font-bold text-amber-600">{meta.lunchStart} – {meta.lunchEnd}</span>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Detail Table */}
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Calendar size={18} className="text-blue-600" />
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Schedule Details</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                {['Day','Time In','Lunch Start','Lunch End','Time Out','Rest Day','Total Hours'].map((h, i) => (
                  <th key={h} className={`p-6 ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {scheduleRows.map((row, i) => (
                <tr key={i} className={`hover:bg-slate-50/50 transition-colors group ${row.isToday ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-6">
                    <p className="font-black text-slate-900 text-sm">{row.dayName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-bold text-slate-400">{row.dateLabel}</span>
                      {row.isToday && (
                        <Badge className="bg-blue-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Today</Badge>
                      )}
                      {row.isRestDay && (
                        <Badge className="bg-rose-500 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Rest Day</Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-6 font-bold text-blue-600 text-xs">{row.isRestDay ? '-' : meta.shiftStart}</td>
                  <td className="p-6 font-bold text-amber-600 text-xs">{row.isRestDay ? '-' : meta.lunchStart}</td>
                  <td className="p-6 font-bold text-amber-600 text-xs">{row.isRestDay ? '-' : meta.lunchEnd}</td>
                  <td className="p-6 font-bold text-blue-600 text-xs">{row.isRestDay ? '-' : meta.shiftEnd}</td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-5 rounded-full relative transition-colors ${row.isRestDay ? 'bg-rose-500' : 'bg-slate-200'}`}>
                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow transition-all ${row.isRestDay ? 'right-1' : 'left-1'}`} />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${row.isRestDay ? 'text-rose-500' : 'text-slate-400'}`}>
                        {row.isRestDay ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 text-right">
                    <Badge className={`font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg ${row.isRestDay ? 'bg-slate-200 text-slate-500' : 'bg-emerald-600 text-white'}`}>
                      <Clock size={10} className="mr-1" />
                      {row.isRestDay ? '0h' : `${meta.hoursPerDay}h`}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-100">
                <td colSpan={6} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Weekly Total ({7 - meta.restDays.length} workdays)
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-sm font-black text-emerald-600">
                    {(7 - meta.restDays.length) * meta.hoursPerDay}h / week
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  );
};
