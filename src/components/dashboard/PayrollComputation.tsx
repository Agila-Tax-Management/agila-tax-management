'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import {
  ArrowLeft, Download, Printer,
  User, Info, Calendar, TrendingUp, AlertCircle,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type DayType =
  | 'workday'
  | 'rest'
  | 'absent'
  | 'special_holiday'
  | 'special_holiday_rest'
  | 'regular_holiday'
  | 'regular_holiday_rest';

interface TimeEntry {
  date: string;
  day: string;
  timeIn: string;
  lunchStart: string;
  lunchEnd: string;
  timeOut: string;
  dayType: DayType;
}

interface PayrollMeta {
  employeeName: string;
  employeeNo: string;
  designation: string;
  hireDate: string;
  monthlyRate: number;
  payType: string;
  payPeriod: string;
  approvedBy: string;
  acknowledgedBy: string;
  payslipStatus: 'Approved' | 'Pending' | 'Draft';
  shiftStartMin: number;
  shiftEndMin: number;
  allowance: number;
  sss: number;
  philhealth: number;
  pagibig: number;
  pagibigLoan: number;
  cashAdvance: number;
  entries: TimeEntry[];
}

interface ComputedRow {
  date: string;
  day: string;
  timeIn: string;
  lunchStart: string;
  lunchEnd: string;
  timeOut: string;
  status: string;
  regPay: number;
  lateMin: number;
  lateAmt: number;
  underMin: number;
  underAmt: number;
  gross: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const toMin = (t: string): number | null => {
  if (!t || t === '-') return null;
  const [clock, mer] = t.trim().split(' ');
  const [hs, ms] = clock.split(':').map(Number);
  let h = hs;
  if (mer?.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (mer?.toLowerCase() === 'am' && h === 12) h = 0;
  return h * 60 + ms;
};

const fmtPeso = (n: number, showZero = false): string => {
  if (n === 0 && !showZero) return '-';
  const [int, dec] = n.toFixed(2).split('.');
  return `₱${int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${dec}`;
};

const fmtDeduct = (n: number): string => {
  if (n === 0) return '-';
  return n.toFixed(2);
};

const dailyRate = (monthlyRate: number) =>
  parseFloat((monthlyRate / 21.75).toFixed(2));

const DAY_STATUS: Record<DayType, string> = {
  workday:               'Present',
  rest:                  'Rest Day',
  absent:                'Absent',
  special_holiday:       'Special Holiday',
  special_holiday_rest:  'Special Holiday Rest Day',
  regular_holiday:       'Regular Holiday',
  regular_holiday_rest:  'Regular Holiday Rest Day',
};

const STATUS_CLS: Record<string, string> = {
  'Present':                    'bg-emerald-600 text-white',
  'Rest Day':                   'bg-slate-700 text-white',
  'Absent':                     'bg-rose-600 text-white',
  'Special Holiday':            'bg-sky-500 text-white',
  'Special Holiday Rest Day':   'bg-sky-400 text-white',
  'Regular Holiday':            'bg-blue-600 text-white',
  'Regular Holiday Rest Day':   'bg-blue-400 text-white',
};

function computeRow(e: TimeEntry, rate: number, shiftStart: number, shiftEnd: number): ComputedRow {
  const base: ComputedRow = {
    date: e.date, day: e.day,
    timeIn: e.timeIn, lunchStart: e.lunchStart, lunchEnd: e.lunchEnd, timeOut: e.timeOut,
    status: DAY_STATUS[e.dayType],
    regPay: 0, lateMin: 0, lateAmt: 0, underMin: 0, underAmt: 0, gross: 0,
  };

  if (e.dayType !== 'workday') return base;

  const inMin  = toMin(e.timeIn);
  const outMin = toMin(e.timeOut);
  if (inMin === null || outMin === null) return { ...base, status: 'Absent' };

  const perMin   = rate / 480;
  const lateMin  = Math.max(0, inMin - shiftStart);
  const underMin = Math.max(0, shiftEnd - outMin);
  const lateAmt  = parseFloat((lateMin  * perMin).toFixed(2));
  const underAmt = parseFloat((underMin * perMin).toFixed(2));
  const gross    = parseFloat(Math.max(0, rate - lateAmt - underAmt).toFixed(2));

  return { ...base, regPay: rate, lateMin, lateAmt, underMin, underAmt, gross };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────
const MOCK: Record<string, PayrollMeta> = {
  'PS-2025-001': {
    employeeName: 'Genesis Esdrilon',
    employeeNo: 'EMP-10002',
    designation: 'Jr. Website Developer',
    hireDate: 'Mar 05, 2026',
    monthlyRate: 14000,
    payType: 'Fixed Pay',
    payPeriod: 'Feb 16, 2026 – Feb 28, 2026',
    approvedBy: 'Jade Christian Quitorio',
    acknowledgedBy: 'Genesis Esdrilon',
    payslipStatus: 'Approved',
    shiftStartMin: 8 * 60,
    shiftEndMin: 17 * 60,
    allowance: 0,
    sss: 0, philhealth: 0, pagibig: 0, pagibigLoan: 0, cashAdvance: 0,
    entries: [
      { date: 'Feb 16', day: 'Mon', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'               },
      { date: 'Feb 17', day: 'Tue', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'special_holiday_rest'},
      { date: 'Feb 18', day: 'Wed', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'               },
      { date: 'Feb 19', day: 'Thu', timeIn: '09:44 am', lunchStart: '12:05 pm', lunchEnd: '01:00 pm', timeOut: '06:47 pm', dayType: 'workday'            },
      { date: 'Feb 20', day: 'Fri', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'absent'             },
      { date: 'Feb 21', day: 'Sat', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'               },
      { date: 'Feb 22', day: 'Sun', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'               },
      { date: 'Feb 23', day: 'Mon', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '12:54 pm', timeOut: '05:02 pm', dayType: 'workday'            },
      { date: 'Feb 24', day: 'Tue', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'special_holiday'    },
      { date: 'Feb 25', day: 'Wed', timeIn: '08:00 am', lunchStart: '12:04 pm', lunchEnd: '01:02 pm', timeOut: '05:01 pm', dayType: 'workday'            },
      { date: 'Feb 26', day: 'Thu', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:04 pm', timeOut: '05:00 pm', dayType: 'workday'            },
      { date: 'Feb 27', day: 'Fri', timeIn: '07:45 am', lunchStart: '12:01 pm', lunchEnd: '12:53 pm', timeOut: '05:02 pm', dayType: 'workday'            },
      { date: 'Feb 28', day: 'Sat', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'               },
    ],
  },
  'PS-2025-002': {
    employeeName: 'Genesis Esdrilon',
    employeeNo: 'EMP-10002',
    designation: 'Jr. Website Developer',
    hireDate: 'Mar 05, 2026',
    monthlyRate: 14000,
    payType: 'Fixed Pay',
    payPeriod: 'Dec 1, 2025 – Dec 15, 2025',
    approvedBy: 'Jade Christian Quitorio',
    acknowledgedBy: 'Genesis Esdrilon',
    payslipStatus: 'Approved',
    shiftStartMin: 8 * 60,
    shiftEndMin: 17 * 60,
    allowance: 0,
    sss: 0, philhealth: 0, pagibig: 0, pagibigLoan: 0, cashAdvance: 0,
    entries: [
      { date: 'Dec 01', day: 'Mon', timeIn: '08:05 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 02', day: 'Tue', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 03', day: 'Wed', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 04', day: 'Thu', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 05', day: 'Fri', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 06', day: 'Sat', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'           },
      { date: 'Dec 07', day: 'Sun', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'           },
      { date: 'Dec 08', day: 'Mon', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'regular_holiday'},
      { date: 'Dec 09', day: 'Tue', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 10', day: 'Wed', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 11', day: 'Thu', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 12', day: 'Fri', timeIn: '08:15 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
      { date: 'Dec 13', day: 'Sat', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'           },
      { date: 'Dec 14', day: 'Sun', timeIn: '-',        lunchStart: '-',        lunchEnd: '-',        timeOut: '-',        dayType: 'rest'           },
      { date: 'Dec 15', day: 'Mon', timeIn: '08:00 am', lunchStart: '12:00 pm', lunchEnd: '01:00 pm', timeOut: '05:00 pm', dayType: 'workday'        },
    ],
  },
};

const FALLBACK = 'PS-2025-001';

// ── Component ─────────────────────────────────────────────────────────────────
export const PayrollComputation: React.FC = () => {
  const router = useRouter();
  const params = useSearchParams();

  const payslipId = params.get('id') ?? FALLBACK;
  const meta      = MOCK[payslipId] ?? MOCK[FALLBACK];
  const rate      = dailyRate(meta.monthlyRate);

  const rows = useMemo(
    () => meta.entries.map(e => computeRow(e, rate, meta.shiftStartMin, meta.shiftEndMin)),
    [meta, rate],
  );

  const totals = useMemo(() => {
    const grossTotal  = rows.reduce((s, r) => s + r.gross, 0);
    const lateTotal   = rows.reduce((s, r) => s + r.lateAmt, 0);
    const underTotal  = rows.reduce((s, r) => s + r.underAmt, 0);
    const regPayTotal = rows.reduce((s, r) => s + r.regPay, 0);
    const deductions  = meta.sss + meta.philhealth + meta.pagibig
                      + meta.pagibigLoan + meta.cashAdvance;
    const netPay      = Math.max(0, grossTotal + meta.allowance - deductions);
    return { grossTotal, lateTotal, underTotal, regPayTotal, deductions, netPay };
  }, [rows, meta]);

  const TABLE_HEADERS = [
    'Date','Day','Time In','Lunch Start','Lunch End','Time Out','Status',
    'Reg Pay','RD Ex Pay','PL CH','PL MH','Late','Under','Break',
    'Reg OT','RD OT','RD OT Ex','SH','SH OT','SH RD','SH RD OT',
    'RH','RH OT','RH RD','RH RD OT','Gross',
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-400 mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl shadow-sm border border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="h-10 w-10 p-0 rounded-xl hover:bg-muted text-muted-foreground"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Payroll Computation</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {payslipId} — employee payroll breakdown
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Pay Period</span>
          <span className="text-sm font-bold text-foreground">{meta.payPeriod}</span>
        </div>
      </div>

      {/* Employee Info */}
      <Card className="p-0 border-none shadow-sm overflow-hidden bg-card rounded-3xl">
        <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Employee Information</h2>
          <div className="ml-auto">
            <Button className="h-8 px-4 bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest rounded-lg">
              <Printer size={14} className="mr-2" /> Generate
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-6">
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Personal</h3>
            <div className="space-y-2">
              <Row label="Name"         value={<span className="font-bold text-foreground">{meta.employeeName}</span>} />
              <Row label="Employee No." value={<Badge variant="neutral" className="bg-blue-50 text-blue-600 font-bold">{meta.employeeNo}</Badge>} />
              <Row label="Hire Date"    value={<span className="font-bold text-foreground">{meta.hireDate}</span>} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Payroll</h3>
            <div className="space-y-2">
              <Row label="Agreed Salary Rate" value={<span className="font-bold text-foreground">{fmtPeso(meta.monthlyRate, true)}</span>} />
              <Row label="Daily Rate"         value={<span className="font-bold text-foreground">{fmtPeso(rate, true)}</span>} />
              <Row label="Payslip Status"     value={
                <Badge variant={meta.payslipStatus === 'Approved' ? 'success' : 'warning'}
                  className={meta.payslipStatus === 'Approved' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-amber-50 text-amber-600 font-bold'}>
                  {meta.payslipStatus}
                </Badge>
              }/>
              <Row label="Pay Type" value={<span className="font-bold text-foreground">{meta.payType}</span>} />
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Approval</h3>
            <div className="space-y-2">
              <Row label="Work Schedule"   value={<button onClick={() => router.push(`/dashboard/payslips/schedule?emp=${meta.employeeNo}`)} className="text-blue-600 font-bold hover:underline">View</button>} />
              <Row label="Compensation"    value={<button onClick={() => router.push(`/dashboard/payslips/compensation?emp=${meta.employeeNo}`)} className="text-blue-600 font-bold hover:underline">View</button>} />
              <Row label="Approved by"     value={<span className="font-bold text-foreground">{meta.approvedBy}</span>} />
              <Row label="Acknowledged by" value={<span className="font-bold text-foreground">{meta.acknowledgedBy}</span>} />
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Breakdown Table */}
      <Card className="p-0 border-none shadow-sm overflow-hidden bg-card rounded-3xl">
        <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center gap-2">
          <Calendar size={16} className="text-blue-600" />
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Daily Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-450">
            <thead>
              <tr className="bg-slate-900 text-[9px] font-black text-white uppercase tracking-tighter">
                {TABLE_HEADERS.map(h => (
                  <th key={h} className={[
                    'px-2 py-3 border-r border-white/10',
                    h === 'Late' || h === 'Under' ? 'text-rose-400' : '',
                    h === 'Gross' ? 'bg-emerald-600 border-none' : '',
                  ].join(' ')}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/50 transition-colors text-[9px] font-bold text-muted-foreground">
                  <td className="px-2 py-2 border-r border-border whitespace-nowrap">{row.date}</td>
                  <td className="px-2 py-2 border-r border-border">{row.day}</td>
                  <td className="px-2 py-2 border-r border-border font-mono">{row.timeIn}</td>
                  <td className="px-2 py-2 border-r border-border font-mono">{row.lunchStart}</td>
                  <td className="px-2 py-2 border-r border-border font-mono">{row.lunchEnd}</td>
                  <td className="px-2 py-2 border-r border-border font-mono">{row.timeOut}</td>
                  <td className="px-2 py-2 border-r border-border">
                    <Badge variant="neutral" className={`text-[7px] font-black uppercase px-1 py-0.5 rounded whitespace-nowrap ${STATUS_CLS[row.status] ?? 'bg-muted text-muted-foreground'}`}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-2 py-2 border-r border-border text-foreground">{fmtPeso(row.regPay)}</td>
                  {[0,1,2].map(j => <td key={j} className="px-2 py-2 border-r border-border">-</td>)}
                  <td className="px-2 py-2 border-r border-border text-rose-500">{fmtDeduct(row.lateAmt)}</td>
                  <td className="px-2 py-2 border-r border-border text-rose-500">{fmtDeduct(row.underAmt)}</td>
                  {Array.from({length: 12}).map((_, j) => <td key={j} className="px-2 py-2 border-r border-border">-</td>)}
                  <td className="px-2 py-2 font-black text-emerald-600">{fmtPeso(row.gross)}</td>
                </tr>
              ))}

              <tr className="bg-blue-50/50 font-black text-[9px] text-foreground border-t-2 border-border">
                <td colSpan={7} className="px-2 py-3 text-center uppercase tracking-widest text-muted-foreground">Totals</td>
                <td className="px-2 py-3 border-r border-border text-foreground">{fmtPeso(totals.regPayTotal)}</td>
                {[0,1,2].map(j => <td key={j} className="px-2 py-3 border-r border-border">-</td>)}
                <td className="px-2 py-3 border-r border-border text-rose-500">{fmtDeduct(totals.lateTotal)}</td>
                <td className="px-2 py-3 border-r border-border text-rose-500">{fmtDeduct(totals.underTotal)}</td>
                {Array.from({length: 12}).map((_, j) => <td key={j} className="px-2 py-3 border-r border-border">-</td>)}
                <td className="px-2 py-3 bg-blue-500 text-white text-center font-black">{fmtPeso(totals.grossTotal, true)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">

          <Card className="p-0 border-none shadow-sm overflow-hidden bg-card rounded-3xl">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Earnings & Additionals</h2>
              </div>
              <Badge variant="neutral" className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest">+ Credits</Badge>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Gross Pay',  value: fmtPeso(totals.grossTotal, true) },
                { label: 'Allowance', value: fmtPeso(meta.allowance, true) },
              ].map(item => (
                <div key={item.label} className="p-5 bg-muted/50 rounded-2xl border border-border flex flex-col items-start">
                  <span className="text-emerald-600 font-black text-xl tracking-tighter">{item.value}</span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-0 border-none shadow-sm overflow-hidden bg-card rounded-3xl">
            <div className="bg-muted/50 px-6 py-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
                <h2 className="text-[10px] font-black text-foreground uppercase tracking-widest">Deductions</h2>
              </div>
              <Badge variant="neutral" className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase tracking-widest">- Debits</Badge>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Late Deductions',        value: totals.lateTotal  },
                { label: 'Undertime Deductions',   value: totals.underTotal },
                { label: 'SSS',                    value: meta.sss          },
                { label: 'PhilHealth',             value: meta.philhealth   },
                { label: 'PAG-IBIG',               value: meta.pagibig      },
                { label: 'PAG-IBIG Loan',          value: meta.pagibigLoan  },
                { label: 'Cash Advance Repayment', value: meta.cashAdvance  },
              ].map(item => (
                <div key={item.label} className="p-5 bg-muted/50 rounded-2xl border border-border flex flex-col items-start">
                  <span className="text-rose-600 font-black text-sm tracking-tight">{fmtPeso(item.value, true)}</span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">{item.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card className="h-full border-none shadow-2xl bg-slate-900 text-white rounded-4xl flex flex-col p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Final Payout</span>
                <h2 className="text-sm font-bold text-slate-400">Net Take-home Pay</h2>
              </div>
              <div className="py-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-500">₱</span>
                  <span className="text-6xl font-black tracking-tighter text-white">
                    {totals.netPay.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-1 w-12 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verified Computation</span>
                </div>
              </div>
              <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20">
                <Download size={14} className="mr-2" /> Download Payslip
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Legend */}
      <Card className="p-0 border-none shadow-sm overflow-hidden bg-card rounded-3xl">
        <div className="bg-muted/50 px-6 py-3 border-b border-border flex items-center gap-2">
          <Info size={16} className="text-blue-600" />
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Pay Rates & Legend</h2>
        </div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest border-b border-blue-50 pb-2">Holiday Rates</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                { code: 'SH',       label: 'Special Holiday (+30%)'       },
                { code: 'SH OT',    label: 'SH Overtime (+30% +30%)'      },
                { code: 'SH RD',    label: 'SH Rest Day (+50%)'           },
                { code: 'SH RD OT', label: 'SH RD Overtime (+50% +30%)'   },
                { code: 'RH',       label: 'Regular Holiday (+100%)'      },
                { code: 'RH OT',    label: 'RH Overtime (+200% +30%)'     },
                { code: 'RH RD',    label: 'RH Rest Day (+200% +30%)'     },
                { code: 'RH RD OT', label: 'RH RD OT (+200% +30% +30%)'  },
              ].map(item => (
                <div key={item.code} className="flex items-center gap-3">
                  <Badge className="w-14 h-6 flex items-center justify-center text-[8px] font-black bg-blue-600 text-white border-none rounded-md shrink-0">{item.code}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xs font-black text-emerald-600 uppercase tracking-widest border-b border-emerald-50 pb-2">Status & Overtime</h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { label: 'Present',         cls: 'bg-emerald-600 text-white' },
                { label: 'Paid Leave',      cls: 'bg-emerald-500 text-white' },
                { label: 'Day Off',         cls: 'bg-slate-500 text-white'   },
                { label: 'Regular Holiday', cls: 'bg-blue-600 text-white'    },
                { label: 'Special Holiday', cls: 'bg-blue-500 text-white'    },
                { label: 'Absent',          cls: 'bg-rose-600 text-white'    },
                { label: 'Incomplete',      cls: 'bg-amber-500 text-white'   },
              ].map(s => (
                <Badge key={s.label} className={`text-[8px] font-black uppercase px-2 py-1 rounded-md border-none ${s.cls}`}>{s.label}</Badge>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {[
                { code: 'Reg OT',   label: 'Regular Overtime (+25%)'    },
                { code: 'RD OT',    label: 'Rest Day Overtime (+30%)'   },
                { code: 'RD OT Ex', label: 'RD OT Excess (+30% +30%)'  },
              ].map(item => (
                <div key={item.code} className="flex items-center gap-3">
                  <Badge className="w-14 h-6 flex items-center justify-center text-[8px] font-black bg-emerald-600 text-white border-none rounded-md shrink-0">{item.code}</Badge>
                  <span className="text-[10px] font-bold text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground font-medium">{label}:</span>
      {value}
    </div>
  );
}
