'use client';

import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import {
  CheckCircle2, Clock, FileText, SendHorizontal, Plus,
  ClipboardEdit, Timer, CalendarDays, ChevronRight
} from 'lucide-react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (iso: string) => { const d = new Date(iso); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };

type AppType = 'COA' | 'Overtime' | 'Leave';
type Status = 'Approved' | 'Pending' | 'Rejected';

interface ApplicationRequest {
  id: string;
  type: string;
  date: string;
  duration: string;
  description: string;
  status: Status;
}

const MOCK_REQUESTS: ApplicationRequest[] = [
  { id: 'APP-001', type: 'Leave',    date: 'Nov 15, 2024', duration: '3 Days',       description: 'Family emergency',   status: 'Approved' },
  { id: 'APP-002', type: 'Overtime', date: 'Nov 10, 2024', duration: '18:00–22:00',  description: 'System deployment',  status: 'Approved' },
  { id: 'APP-003', type: 'COA',      date: 'Nov 8, 2024',  duration: 'Time In',      description: 'Network outage',     status: 'Pending'  },
];

const APP_TYPES: { type: AppType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { type: 'COA',      label: 'Correction of Attendance', desc: 'Fix missed or incorrect time entries', icon: <ClipboardEdit size={22} />, color: 'bg-blue-600'   },
  { type: 'Overtime', label: 'Overtime Application',     desc: 'File regular or rest day overtime',    icon: <Timer size={22} />,         color: 'bg-violet-600' },
  { type: 'Leave',    label: 'Leave Application',        desc: 'Vacation, sick, emergency, and more',  icon: <CalendarDays size={22} />,   color: 'bg-teal-600'   },
];

interface COAData   { dateAffected: string; action: string; reason: string; }
interface OTData    { dateOT: string; otType: string; timeFrom: string; timeTo: string; reason: string; }
interface LeaveData { leaveType: string; dateFrom: string; dateTo: string; isHalfDay: boolean; halfDayTime: string; reason: string; }

const LABEL    = 'text-[10px] font-black text-muted-foreground uppercase tracking-widest';
const FIELD    = 'w-full h-11 bg-muted border border-border rounded-xl px-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-teal-500 focus:border-transparent';
const TEXTAREA = 'w-full min-h-[90px] bg-muted border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-muted-foreground resize-none';

// ── COA Form ─────────────────────────────────────────────────────────
const COAForm: React.FC<{ data: COAData; set: React.Dispatch<React.SetStateAction<COAData>> }> = ({ data, set }) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <label className={LABEL}>Date Affected</label>
      <Input type="date" className="bg-muted border-border rounded-xl text-foreground" value={data.dateAffected} onChange={e => set(d => ({ ...d, dateAffected: e.target.value }))} />
    </div>
    <div className="space-y-1.5">
      <label className={LABEL}>Action to Correct</label>
      <select className={FIELD} value={data.action} onChange={e => set(d => ({ ...d, action: e.target.value }))}>
        <option value="">Select action...</option>
        <option value="Time In">Time In</option>
        <option value="Lunch Break">Lunch Break</option>
        <option value="Lunch Break End">Lunch Break End</option>
        <option value="Time Out">Time Out</option>
      </select>
    </div>
    <div className="space-y-1.5">
      <label className={LABEL}>Reason</label>
      <textarea className={TEXTAREA} placeholder="Explain why the correction is needed..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
    </div>
  </div>
);

// ── OT Form ──────────────────────────────────────────────────────────
const OTForm: React.FC<{ data: OTData; set: React.Dispatch<React.SetStateAction<OTData>> }> = ({ data, set }) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <label className={LABEL}>Date of Overtime</label>
      <Input type="date" className="bg-muted border-border rounded-xl text-foreground" value={data.dateOT} onChange={e => set(d => ({ ...d, dateOT: e.target.value }))} />
    </div>
    <div className="space-y-1.5">
      <label className={LABEL}>Overtime Type</label>
      <select className={FIELD} value={data.otType} onChange={e => set(d => ({ ...d, otType: e.target.value }))}>
        <option value="">Select type...</option>
        <option value="Regular Overtime">Regular Overtime</option>
        <option value="Rest Day Overtime">Rest Day Overtime</option>
      </select>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className={LABEL}>Time Coverage — From</label>
        <Input type="time" className="bg-muted border-border rounded-xl text-foreground" value={data.timeFrom} onChange={e => set(d => ({ ...d, timeFrom: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Time Coverage — To</label>
        <Input type="time" className="bg-muted border-border rounded-xl text-foreground" value={data.timeTo} onChange={e => set(d => ({ ...d, timeTo: e.target.value }))} />
      </div>
    </div>
    <div className="space-y-1.5">
      <label className={LABEL}>Reason</label>
      <textarea className={TEXTAREA} placeholder="Describe the nature of work requiring overtime..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
    </div>
  </div>
);

// ── Leave Form ───────────────────────────────────────────────────────
const LEAVE_TYPES = ['Vacation Leave', 'Sick Leave', 'Emergency Leave', 'Maternity/Paternity Leave', 'Special Leave'];

const LeaveForm: React.FC<{ data: LeaveData; set: React.Dispatch<React.SetStateAction<LeaveData>> }> = ({ data, set }) => (
  <div className="space-y-4">
    <div className="space-y-1.5">
      <label className={LABEL}>Leave Type</label>
      <select className={FIELD} value={data.leaveType} onChange={e => set(d => ({ ...d, leaveType: e.target.value }))}>
        <option value="">Select leave type...</option>
        {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <label className={LABEL}>Date From</label>
        <Input type="date" className="bg-muted border-border rounded-xl text-foreground" value={data.dateFrom} onChange={e => set(d => ({ ...d, dateFrom: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Date To</label>
        <Input type="date" className="bg-muted border-border rounded-xl text-foreground" value={data.dateTo} onChange={e => set(d => ({ ...d, dateTo: e.target.value }))} />
      </div>
    </div>

    <div className="flex items-center gap-3 p-4 bg-muted rounded-xl border border-border">
      <input
        type="checkbox"
        id="halfday"
        className="w-4 h-4 accent-teal-600"
        checked={data.isHalfDay}
        onChange={e => set(d => ({ ...d, isHalfDay: e.target.checked, halfDayTime: '' }))}
      />
      <label htmlFor="halfday" className="text-sm font-bold text-foreground cursor-pointer">Half Day</label>
    </div>

    {data.isHalfDay && (
      <div className="space-y-1.5">
        <label className={LABEL}>Half Day — Which Half?</label>
        <select className={FIELD} value={data.halfDayTime} onChange={e => set(d => ({ ...d, halfDayTime: e.target.value }))}>
          <option value="">Select...</option>
          <option value="AM (Morning)">AM — Morning (first half)</option>
          <option value="PM (Afternoon)">PM — Afternoon (second half)</option>
        </select>
      </div>
    )}

    <div className="space-y-1.5">
      <label className={LABEL}>Reason</label>
      <textarea className={TEXTAREA} placeholder="Briefly state the reason for your leave..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────
const BLANK_COA:   COAData   = { dateAffected: '', action: '', reason: '' };
const BLANK_OT:    OTData    = { dateOT: '', otType: '', timeFrom: '', timeTo: '', reason: '' };
const BLANK_LEAVE: LeaveData = { leaveType: '', dateFrom: '', dateTo: '', isHalfDay: false, halfDayTime: '', reason: '' };

export const ApplicationsView: React.FC = () => {
  const [requests, setRequests] = useState<ApplicationRequest[]>(MOCK_REQUESTS);
  const [step, setStep]         = useState<'select' | 'form'>('select');
  const [isOpen, setIsOpen]     = useState(false);
  const [appType, setAppType]   = useState<AppType | null>(null);
  const [coa,   setCoa]         = useState<COAData>(BLANK_COA);
  const [ot,    setOt]          = useState<OTData>(BLANK_OT);
  const [leave, setLeave]       = useState<LeaveData>(BLANK_LEAVE);

  const openModal  = () => { setStep('select'); setAppType(null); setCoa(BLANK_COA); setOt(BLANK_OT); setLeave(BLANK_LEAVE); setIsOpen(true); };
  const closeModal = () => setIsOpen(false);
  const selectType = (type: AppType) => { setAppType(type); setStep('form'); };

  const canSubmit = () => {
    if (appType === 'COA')      return !!(coa.dateAffected && coa.action && coa.reason.trim());
    if (appType === 'Overtime') return !!(ot.dateOT && ot.otType && ot.timeFrom && ot.timeTo && ot.reason.trim());
    if (appType === 'Leave')    return !!(leave.leaveType && leave.dateFrom && leave.dateTo && leave.reason.trim() && (!leave.isHalfDay || leave.halfDayTime));
    return false;
  };

  const handleSubmit = () => {
    if (!appType || !canSubmit()) return;
    const id = `APP-${String(requests.length + 1).padStart(3, '0')}`;
    let entry: ApplicationRequest;

    if (appType === 'COA') {
      entry = { id, type: 'COA', date: fmtDate(coa.dateAffected), duration: coa.action, description: coa.reason, status: 'Pending' };
    } else if (appType === 'Overtime') {
      entry = { id, type: `Overtime (${ot.otType})`, date: fmtDate(ot.dateOT), duration: `${ot.timeFrom} – ${ot.timeTo}`, description: ot.reason, status: 'Pending' };
    } else {
      const days = leave.isHalfDay ? `Half Day (${leave.halfDayTime})` : `${leave.dateFrom} – ${leave.dateTo}`;
      entry = { id, type: leave.leaveType, date: fmtDate(leave.dateFrom), duration: days, description: leave.reason, status: 'Pending' };
    }

    setRequests(prev => [entry, ...prev]);
    closeModal();
  };

  const modalTitle = step === 'select' ? 'New Application' : APP_TYPES.find(a => a.type === appType)?.label ?? '';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-600 rounded-2xl text-white shadow-xl shadow-teal-600/20">
            <SendHorizontal size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight uppercase">HR Applications</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Submit and track your requests</p>
          </div>
        </div>
        <Button onClick={openModal} className="shrink-0 bg-teal-600 hover:bg-teal-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-teal-600/20">
          <Plus size={16} className="mr-2" /> New Application
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-teal-50 text-teal-600 rounded-xl"><CheckCircle2 size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Available Leave</p>
            <p className="text-2xl font-black text-foreground">12.5 Days</p>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Clock size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pending Review</p>
            <p className="text-2xl font-black text-foreground">{requests.filter(r => r.status === 'Pending').length}</p>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-violet-50 text-violet-600 rounded-xl"><FileText size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">YTD Applications</p>
            <p className="text-2xl font-black text-foreground">{requests.length + 21}</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-black text-foreground uppercase tracking-tight text-sm">Recent Submissions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-muted border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Duration / Coverage</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map(req => (
                <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                        <FileText size={15} />
                      </div>
                      <span className="font-bold text-foreground text-sm">{req.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{req.date}</td>
                  <td className="px-6 py-4 text-sm font-bold text-foreground">{req.duration}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground italic max-w-xs truncate">{req.description}</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Pending' ? 'warning' : 'danger'}>
                      {req.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} title={modalTitle} size="lg">
        <div className="p-6">
        {step === 'select' ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">Select the type of application you want to file.</p>
            {APP_TYPES.map(({ type, label, desc, icon, color }) => (
              <button
                key={type}
                onClick={() => selectType(type)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:border-slate-300 hover:bg-muted transition-all text-left group"
              >
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <p className="font-black text-foreground text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-5">
            <button
              onClick={() => setStep('select')}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight size={13} className="rotate-180" /> Back
            </button>

            {appType === 'COA'      && <COAForm   data={coa}   set={setCoa}   />}
            {appType === 'Overtime' && <OTForm    data={ot}    set={setOt}    />}
            {appType === 'Leave'    && <LeaveForm data={leave} set={setLeave} />}

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button variant="ghost" className="flex-1 rounded-xl font-bold" onClick={closeModal}>Cancel</Button>
              <Button
                className="flex-1 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                onClick={handleSubmit}
                disabled={!canSubmit()}
              >
                Submit Application
              </Button>
            </div>
          </div>
        )}
        </div>
      </Modal>
    </div>
  );
};
