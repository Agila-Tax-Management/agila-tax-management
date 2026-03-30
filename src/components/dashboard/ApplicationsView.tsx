'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { useToast } from '@/context/ToastContext';
import {
  CheckCircle2, Clock, FileText, SendHorizontal, Plus,
  ClipboardEdit, Timer, CalendarDays, ChevronRight, Loader2,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};
const fmtTime = (iso: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// ── Types ─────────────────────────────────────────────────────────────
type AppType = 'COA' | 'Overtime' | 'Leave';

interface LeaveCredit {
  id: number;
  leaveTypeId: number;
  leaveTypeName: string;
  isPaid: boolean;
  allocated: number;
  used: number;
  balance: number;
}

interface LeaveType {
  id: number;
  name: string;
  isPaid: boolean;
  defaultDays: number;
}

interface UnifiedRequest {
  id: string;
  category: AppType;
  typeName: string;
  date: string;
  coverage: string;
  reason: string;
  status: string;
  createdAt: string;
}

interface COAData     { dateAffected: string; actionType: string; timeValue: string; reason: string; }
interface OTData      { dateOT: string; otType: string; timeFrom: string; timeTo: string; reason: string; }
interface LeaveData   { leaveTypeId: string; dateFrom: string; dateTo: string; creditUsed: string; reason: string; }

const LABEL    = 'text-[10px] font-black text-muted-foreground uppercase tracking-widest';
const FIELD    = 'w-full h-11 bg-muted border border-border rounded-xl px-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-teal-500 focus:border-transparent';
const TEXTAREA = 'w-full min-h-[90px] bg-muted border border-border rounded-xl p-4 text-sm font-medium text-foreground focus:ring-2 focus:ring-teal-500 focus:border-transparent placeholder:text-muted-foreground resize-none';

const APP_TYPES: { type: AppType; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
  { type: 'COA',      label: 'Correction of Attendance', desc: 'Fix missed or incorrect time entries', icon: <ClipboardEdit size={22} />, color: 'bg-blue-600'   },
  { type: 'Overtime', label: 'Overtime Application',     desc: 'File regular or rest day overtime',    icon: <Timer size={22} />,         color: 'bg-violet-600' },
  { type: 'Leave',    label: 'Leave Application',        desc: 'Vacation, sick, emergency, and more',  icon: <CalendarDays size={22} />,   color: 'bg-teal-600'   },
];

// ── COA Form ─────────────────────────────────────────────────────────
function COAForm({ data, set }: { data: COAData; set: React.Dispatch<React.SetStateAction<COAData>> }): React.ReactNode {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={LABEL}>Date Affected</label>
        <Input type="date" className="bg-muted border-border rounded-xl text-foreground" value={data.dateAffected} onChange={e => set(d => ({ ...d, dateAffected: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Action to Correct</label>
        <select className={FIELD} value={data.actionType} onChange={e => set(d => ({ ...d, actionType: e.target.value }))}>
          <option value="">Select action...</option>
          <option value="TIME_IN">Time In</option>
          <option value="LUNCH_START">Lunch Break Start</option>
          <option value="LUNCH_END">Lunch Break End</option>
          <option value="TIME_OUT">Time Out</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Correct Time</label>
        <Input type="time" className="bg-muted border-border rounded-xl text-foreground" value={data.timeValue} onChange={e => set(d => ({ ...d, timeValue: e.target.value }))} />
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Reason</label>
        <textarea className={TEXTAREA} placeholder="Explain why the correction is needed..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
      </div>
    </div>
  );
}

// ── OT Form ──────────────────────────────────────────────────────────
function OTForm({ data, set }: { data: OTData; set: React.Dispatch<React.SetStateAction<OTData>> }): React.ReactNode {
  // Derive hours display from timeFrom/timeTo (no state needed)
  let derivedHours = '';
  if (data.timeFrom && data.timeTo) {
    const [fh, fm] = data.timeFrom.split(':').map(Number);
    const [th, tm] = data.timeTo.split(':').map(Number);
    const diffMins = ((th ?? 0) * 60 + (tm ?? 0)) - ((fh ?? 0) * 60 + (fm ?? 0));
    if (diffMins > 0) derivedHours = (diffMins / 60).toFixed(2);
  }

  return (
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
      {derivedHours && (
        <p className="text-xs text-muted-foreground">
          Hours: <span className="font-bold text-foreground">{derivedHours} hr(s)</span>
        </p>
      )}
      <div className="space-y-1.5">
        <label className={LABEL}>Reason</label>
        <textarea className={TEXTAREA} placeholder="Describe the nature of work requiring overtime..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
      </div>
    </div>
  );
}

// ── Leave Form ───────────────────────────────────────────────────────
function LeaveForm({
  data, set, leaveTypes, leaveCredits,
}: {
  data: LeaveData;
  set: React.Dispatch<React.SetStateAction<LeaveData>>;
  leaveTypes: LeaveType[];
  leaveCredits: LeaveCredit[];
}): React.ReactNode {
  const selectedCredit = leaveCredits.find(c => String(c.leaveTypeId) === data.leaveTypeId);

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className={LABEL}>Leave Type</label>
        <select
          className={FIELD}
          value={data.leaveTypeId}
          onChange={e => set(d => ({ ...d, leaveTypeId: e.target.value }))}
        >
          <option value="">Select leave type...</option>
          {leaveTypes.map(t => {
            const credit = leaveCredits.find(c => c.leaveTypeId === t.id);
            const balance = credit ? credit.balance : 0;
            return (
              <option key={t.id} value={String(t.id)} disabled={balance <= 0}>
                {t.name}{credit ? ` — ${balance} day(s) available` : ' — No credits'}
              </option>
            );
          })}
        </select>
        {selectedCredit && (
          <p className="text-xs text-muted-foreground pt-1">
            Balance: <span className="font-bold text-foreground">{selectedCredit.balance} day(s)</span>
            {!selectedCredit.isPaid && <span className="ml-1 text-amber-600">(Unpaid)</span>}
          </p>
        )}
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
      <div className="space-y-1.5">
        <label className={LABEL}>Days to Deduct</label>
        <Input
          type="number"
          min="0.5"
          step="0.5"
          className="bg-muted border-border rounded-xl text-foreground"
          placeholder="e.g. 1, 0.5"
          value={data.creditUsed}
          onChange={e => set(d => ({ ...d, creditUsed: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">Use 0.5 for half day, 1 for full day, etc.</p>
      </div>
      <div className="space-y-1.5">
        <label className={LABEL}>Reason</label>
        <textarea className={TEXTAREA} placeholder="Briefly state the reason for your leave..." value={data.reason} onChange={e => set(d => ({ ...d, reason: e.target.value }))} />
      </div>
    </div>
  );
}

// ── Blank states ─────────────────────────────────────────────────────
const BLANK_COA:   COAData   = { dateAffected: '', actionType: '', timeValue: '', reason: '' };
const BLANK_OT:    OTData    = { dateOT: '', otType: '', timeFrom: '', timeTo: '', reason: '' };
const BLANK_LEAVE: LeaveData = { leaveTypeId: '', dateFrom: '', dateTo: '', creditUsed: '', reason: '' };

// ── Main Component ───────────────────────────────────────────────────
export function ApplicationsView(): React.ReactNode {
  const { success, error: toastError } = useToast();

  const [requests,     setRequests]     = useState<UnifiedRequest[]>([]);
  const [leaveTypes,   setLeaveTypes]   = useState<LeaveType[]>([]);
  const [leaveCredits, setLeaveCredits] = useState<LeaveCredit[]>([]);
  const [totalLeave,   setTotalLeave]   = useState(0);

  const [isLoading,    setIsLoading]    = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step,         setStep]         = useState<'select' | 'form'>('select');
  const [isOpen,       setIsOpen]       = useState(false);
  const [appType,      setAppType]      = useState<AppType | null>(null);
  const [coa,          setCoa]          = useState<COAData>(BLANK_COA);
  const [ot,           setOt]           = useState<OTData>(BLANK_OT);
  const [leave,        setLeave]        = useState<LeaveData>(BLANK_LEAVE);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      const [leaveRes, otRes, coaRes, creditsRes, typesRes] = await Promise.all([
        fetch('/api/employee/leave-requests'),
        fetch('/api/employee/overtime-requests'),
        fetch('/api/employee/coa-requests'),
        fetch('/api/employee/leave-credits'),
        fetch('/api/hr/leave-types'),
      ]);

      const [leaveJson, otJson, coaJson, creditsJson, typesJson] = await Promise.all([
        leaveRes.json()   as Promise<{ data?: { id: string; leaveType: string; startDate: string; endDate: string; creditUsed: number; reason: string; status: string; createdAt: string }[] }>,
        otRes.json()      as Promise<{ data?: { id: string; type: string; date: string; timeFrom: string; timeTo: string; hours: number; reason: string; status: string; createdAt: string }[] }>,
        coaRes.json()     as Promise<{ data?: { id: string; actionType: string; dateAffected: string; timeValue: string; reason: string; status: string; createdAt: string }[] }>,
        creditsRes.json() as Promise<{ data?: LeaveCredit[] }>,
        typesRes.json()   as Promise<{ data?: LeaveType[] }>,
      ]);
      const leaveData   = leaveJson;
      const otData      = otJson;
      const coaData     = coaJson;
      const creditsData = creditsJson;
      const typesData   = typesJson;

      const unified: UnifiedRequest[] = [];

      for (const r of leaveData.data ?? []) {
        unified.push({
          id: r.id,
          category: 'Leave',
          typeName: r.leaveType,
          date: fmtDate(r.startDate),
          coverage: `${fmtDate(r.startDate)} – ${fmtDate(r.endDate)} (${r.creditUsed} day(s))`,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
        });
      }
      for (const r of otData.data ?? []) {
        unified.push({
          id: r.id,
          category: 'Overtime',
          typeName: r.type,
          date: fmtDate(r.date),
          coverage: `${fmtTime(r.timeFrom)} – ${fmtTime(r.timeTo)} (${r.hours}h)`,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
        });
      }
      for (const r of coaData.data ?? []) {
        const actionLabel: Record<string, string> = {
          TIME_IN: 'Time In', LUNCH_START: 'Lunch Start', LUNCH_END: 'Lunch End', TIME_OUT: 'Time Out',
        };
        unified.push({
          id: r.id,
          category: 'COA',
          typeName: 'Correction of Attendance',
          date: fmtDate(r.dateAffected),
          coverage: `${actionLabel[r.actionType] ?? r.actionType} @ ${fmtTime(r.timeValue)}`,
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
        });
      }

      unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(unified);

      const credits = creditsData.data ?? [];
      setLeaveCredits(credits);
      setTotalLeave(credits.reduce((sum, c) => sum + c.balance, 0));
      setLeaveTypes(typesData.data ?? []);
    } catch {
      toastError('Failed to load', 'Could not fetch your applications. Please refresh.');
    } finally {
      setIsLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const openModal  = () => {
    setStep('select');
    setAppType(null);
    setCoa(BLANK_COA);
    setOt(BLANK_OT);
    setLeave(BLANK_LEAVE);
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);
  const selectType = (type: AppType) => { setAppType(type); setStep('form'); };

  const canSubmit = () => {
    if (appType === 'COA')      return !!(coa.dateAffected && coa.actionType && coa.timeValue && coa.reason.trim());
    if (appType === 'Overtime') return !!(ot.dateOT && ot.otType && ot.timeFrom && ot.timeTo && ot.reason.trim());
    if (appType === 'Leave')    return !!(leave.leaveTypeId && leave.dateFrom && leave.dateTo && leave.creditUsed && leave.reason.trim());
    return false;
  };

  const handleSubmit = async () => {
    if (!appType || !canSubmit() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (appType === 'COA') {
        const res = await fetch('/api/employee/coa-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dateAffected: coa.dateAffected,
            actionType: coa.actionType,
            timeValue: coa.timeValue,
            reason: coa.reason,
          }),
        });
        const json = await res.json() as { error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to submit COA');
        success('COA Submitted', 'Your correction of attendance request has been filed.');
      } else if (appType === 'Overtime') {
        const [fh, fm] = ot.timeFrom.split(':').map(Number);
        const [th, tm] = ot.timeTo.split(':').map(Number);
        const diffMins = ((th ?? 0) * 60 + (tm ?? 0)) - ((fh ?? 0) * 60 + (fm ?? 0));
        const hours    = diffMins > 0 ? diffMins / 60 : 0;

        const res = await fetch('/api/employee/overtime-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            date: ot.dateOT,
            type: ot.otType,
            timeFrom: ot.timeFrom,
            timeTo: ot.timeTo,
            hours,
            reason: ot.reason,
          }),
        });
        const json = await res.json() as { error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to submit overtime request');
        success('Overtime Submitted', 'Your overtime request has been filed for review.');
      } else {
        const res = await fetch('/api/employee/leave-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            leaveTypeId: parseInt(leave.leaveTypeId, 10),
            startDate: leave.dateFrom,
            endDate: leave.dateTo,
            creditUsed: parseFloat(leave.creditUsed),
            reason: leave.reason,
          }),
        });
        const json = await res.json() as { error?: string };
        if (!res.ok) throw new Error(json.error ?? 'Failed to submit leave request');
        success('Leave Submitted', 'Your leave application has been filed for review.');
      }

      closeModal();
      void fetchAll();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toastError('Submission Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;
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
            <p className="text-2xl font-black text-foreground">
              {isLoading ? '—' : `${totalLeave.toFixed(1)} Days`}
            </p>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-amber-50 text-amber-600 rounded-xl"><Clock size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Pending Review</p>
            <p className="text-2xl font-black text-foreground">{isLoading ? '—' : pendingCount}</p>
          </div>
        </Card>
        <Card className="p-6 border-border shadow-sm flex items-center gap-4">
          <div className="p-4 bg-violet-50 text-violet-600 rounded-xl"><FileText size={22} /></div>
          <div>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Applications</p>
            <p className="text-2xl font-black text-foreground">{isLoading ? '—' : requests.length}</p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-border">
          <h2 className="font-black text-foreground uppercase tracking-tight text-sm">Recent Submissions</h2>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading applications...</span>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
            <FileText size={32} className="opacity-30" />
            <p className="text-sm">No applications yet. Click &quot;New Application&quot; to file one.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Coverage</th>
                  <th className="px-6 py-4">Reason</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map(req => (
                  <tr key={req.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          req.category === 'Leave' ? 'bg-teal-50 text-teal-600' :
                          req.category === 'Overtime' ? 'bg-violet-50 text-violet-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          {req.category === 'Leave' ? <CalendarDays size={15} /> :
                           req.category === 'Overtime' ? <Timer size={15} /> :
                           <ClipboardEdit size={15} />}
                        </div>
                        <span className="font-bold text-foreground text-sm">{req.typeName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{req.date}</td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground">{req.coverage}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground italic max-w-xs truncate">{req.reason}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={
                        req.status === 'APPROVED' ? 'success' :
                        req.status === 'REJECTED' ? 'danger' :
                        req.status === 'CANCELLED' ? 'neutral' : 'warning'
                      }>
                        {req.status.charAt(0) + req.status.slice(1).toLowerCase()}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              {appType === 'Leave'    && (
                <LeaveForm
                  data={leave}
                  set={setLeave}
                  leaveTypes={leaveTypes}
                  leaveCredits={leaveCredits}
                />
              )}

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button variant="ghost" className="flex-1 rounded-xl font-bold" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20"
                  onClick={() => void handleSubmit()}
                  disabled={!canSubmit() || isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader2 size={15} className="animate-spin mr-2" /> Submitting...</>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
