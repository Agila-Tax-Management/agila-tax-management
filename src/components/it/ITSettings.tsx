// src/components/it/ITSettings.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { useToast } from '@/context/ToastContext';
import {
  Ticket, HardDrive, ClipboardList, ShieldCheck, Plus, Trash2, Loader2, UserCheck,
} from 'lucide-react';

// ─── Ticketing Settings ────────────────────────────────────────────────
const TICKET_CATEGORIES = [
  'Hardware Issue', 'Software Issue', 'Network Issue', 'Email Support',
  'Access Request', 'Security Concern', 'Bug Report', 'Feature Request', 'Other',
];

const TICKET_PRIORITIES = [
  { level: 'Low', desc: 'Minor issue, no business impact' },
  { level: 'Medium', desc: 'Standard support request' },
  { level: 'High', desc: 'Affects productivity' },
  { level: 'Critical', desc: 'Business operations impacted' },
];

const TICKET_STATUSES = ['Open', 'In Progress', 'Waiting for User', 'Resolved', 'Closed'];

// ─── Asset Settings ─────────────────────────────────────────────────────
const ASSET_CATEGORIES = [
  'Laptop', 'Desktop', 'Monitor', 'Printer', 'Mobile Device',
  'Router', 'Switch', 'Server', 'Software License', 'Other',
];

const ASSET_STATUSES = ['Available', 'Assigned', 'Under Maintenance', 'Lost', 'Retired', 'Disposed'];

const ASSET_FIELDS = [
  { key: 'serialNumber', label: 'Serial Number' },
  { key: 'purchaseDate', label: 'Purchase Date' },
  { key: 'warrantyExpiry', label: 'Warranty Expiry' },
  { key: 'vendor', label: 'Vendor' },
  { key: 'assignedEmployee', label: 'Assigned Employee' },
  { key: 'department', label: 'Department' },
  { key: 'notes', label: 'Notes' },
];

// ─── Audit Log ────────────────────────────────────────────────────────
const AUDIT_TICKET_ACTIONS = ['Created', 'Assigned', 'Updated', 'Resolved', 'Closed'];
const AUDIT_ACCESS_ACTIONS = ['Request Submitted', 'Approved', 'Revoked'];
const AUDIT_ASSET_ACTIONS = ['Asset Created', 'Assigned', 'Updated', 'Returned', 'Retired'];
const AUDIT_SYSTEM_ACTIONS = ['Service Created', 'Status Changed', 'Maintenance Scheduled'];
const AUDIT_PERMISSION_ACTIONS = ['User Role Changed', 'Permission Modified'];

const LOG_RETENTION_OPTIONS = ['30 Days', '90 Days', '180 Days', '1 Year', 'Forever'];

function ToggleRow({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}): React.ReactElement {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 rounded accent-cyan-700 cursor-pointer"
      />
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export function ITSettings(): React.ReactNode {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'ticketing' | 'assets' | 'audit' | 'access'>('ticketing');

  // ─── Access Approvers state ──────────────────────────────────────
  interface Approver {
    id: number;
    createdAt: string;
    user: { id: string; name: string; email: string; image: string | null; role: string };
    addedBy: { id: string; name: string };
  }
  interface TeamMember {
    userId: string | null;
    name: string;
    email: string | null;
    role: string | null;
    accessType: string;
  }
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [approversLoading, setApproversLoading] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingApprover, setAddingApprover] = useState(false);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const fetchApprovers = useCallback(async () => {
    setApproversLoading(true);
    try {
      const res = await fetch('/api/it/settings/approvers', { cache: 'no-store' });
      const json = await res.json();
      setApprovers(json.data ?? []);
    } finally {
      setApproversLoading(false);
    }
  }, []);

  const fetchTeam = useCallback(async () => {
    const res = await fetch('/api/it/settings/team', { cache: 'no-store' });
    const json = await res.json();
    setTeamMembers(json.data ?? []);
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- load on tab switch */
  useEffect(() => {
    if (activeTab === 'access') {
      void fetchApprovers();
      void fetchTeam();
    }
  }, [activeTab, fetchApprovers, fetchTeam]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleAddApprover() {
    if (!selectedUserId) { error('Select a user', 'Please select a user to add as approver.'); return; }
    setAddingApprover(true);
    try {
      const res = await fetch('/api/it/settings/approvers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId }),
      });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success('Approver added', 'User has been added as a default access approver.');
      setSelectedUserId('');
      void fetchApprovers();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setAddingApprover(false); }
  }

  async function handleRemoveApprover(id: number, name: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/it/settings/approvers/${id}`, { method: 'DELETE' });
      if (!res.ok) { const j = await res.json(); error('Failed', j.error ?? 'Error occurred.'); return; }
      success('Approver removed', `${name} has been removed from default approvers.`);
      void fetchApprovers();
    } catch { error('Failed', 'Unexpected error.'); }
    finally { setRemovingId(null); }
  }

  const approverUserIds = new Set(approvers.map((a) => a.user.id));

  // Ticketing settings
  const [enabledCategories, setEnabledCategories] = useState<Record<string, boolean>>(
    () => Object.fromEntries(TICKET_CATEGORIES.map((c) => [c, true])),
  );
  const [assignmentRule, setAssignmentRule] = useState<'default' | 'category' | 'roundrobin' | 'manual'>('manual');
  const [requireResolutionNotes, setRequireResolutionNotes] = useState(true);
  const [allowReopening, setAllowReopening] = useState(true);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [autoCloseDays, setAutoCloseDays] = useState('7');

  // Asset settings
  const [enabledAssetFields, setEnabledAssetFields] = useState<Record<string, boolean>>(
    () => Object.fromEntries(ASSET_FIELDS.map((f) => [f.key, true])),
  );
  const [warrantyNotifyEnabled, setWarrantyNotifyEnabled] = useState(true);
  const [warrantyNotifyDays, setWarrantyNotifyDays] = useState<'30' | '60' | '90'>('30');
  const [requireEmployeeAssignment, setRequireEmployeeAssignment] = useState(false);
  const [allowMultipleAssets, setAllowMultipleAssets] = useState(true);
  const [requireReturnConfirmation, setRequireReturnConfirmation] = useState(false);

  // Audit log settings
  const [enabledTicketActions, setEnabledTicketActions] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AUDIT_TICKET_ACTIONS.map((a) => [a, true])),
  );
  const [enabledAccessActions, setEnabledAccessActions] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AUDIT_ACCESS_ACTIONS.map((a) => [a, true])),
  );
  const [enabledAssetActions, setEnabledAssetActions] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AUDIT_ASSET_ACTIONS.map((a) => [a, true])),
  );
  const [enabledSystemActions, setEnabledSystemActions] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AUDIT_SYSTEM_ACTIONS.map((a) => [a, true])),
  );
  const [enabledPermissionActions, setEnabledPermissionActions] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AUDIT_PERMISSION_ACTIONS.map((a) => [a, true])),
  );
  const [logRetention, setLogRetention] = useState('1 Year');
  const [logVisibility, setLogVisibility] = useState<Record<string, boolean>>({
    'View Own Actions': true,
    'View Department Actions': true,
    'View All Actions': false,
  });
  const [exportOptions, setExportOptions] = useState<Record<string, boolean>>({
    'CSV Export': true,
    'Excel Export': true,
    'PDF Export': true,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">IT Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure IT portal behavior, ticket rules, asset management, and audit logging.</p>
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([
            { key: 'ticketing', label: 'Ticketing', icon: Ticket },
            { key: 'assets', label: 'Assets', icon: HardDrive },
            { key: 'audit', label: 'Audit Log', icon: ClipboardList },
            { key: 'access', label: 'Access Control', icon: ShieldCheck },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition whitespace-nowrap ${
                activeTab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Ticketing Settings Tab ──────────────────────────────── */}
      {activeTab === 'ticketing' && (
        <div className="space-y-6">
          {/* Ticket Categories */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Ticket Categories</h3>
            <Card className="p-4">
              <p className="text-xs text-slate-500 mb-3">Manage available categories for ticket submission.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5">
                {TICKET_CATEGORIES.map((cat) => (
                  <ToggleRow
                    key={cat}
                    label={cat}
                    checked={enabledCategories[cat] ?? true}
                    onChange={(v) => setEnabledCategories((prev) => ({ ...prev, [cat]: v }))}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Priority Levels */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Priority Levels</h3>
            <Card className="p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Priority</th>
                    <th className="px-4 py-2.5 text-left text-xs font-black text-slate-600 uppercase tracking-wider">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {TICKET_PRIORITIES.map((p, i) => (
                    <tr key={p.level} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="px-4 py-2.5 font-semibold text-slate-800">{p.level}</td>
                      <td className="px-4 py-2.5 text-slate-600">{p.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Ticket Statuses */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Ticket Statuses</h3>
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {TICKET_STATUSES.map((s) => (
                  <Badge key={s} variant="neutral" className="text-xs">{s}</Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Assignment Rules */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Assignment Rules</h3>
            <Card className="p-4 space-y-0.5">
              {([
                { key: 'default', label: 'Default assignee' },
                { key: 'category', label: 'Auto-assign by category' },
                { key: 'roundrobin', label: 'Round-robin assignment' },
                { key: 'manual', label: 'Manual assignment only' },
              ] as const).map((opt) => (
                <label key={opt.key} className="flex items-center gap-2.5 cursor-pointer py-1.5">
                  <input
                    type="radio"
                    name="assignmentRule"
                    checked={assignmentRule === opt.key}
                    onChange={() => setAssignmentRule(opt.key)}
                    className="w-4 h-4 accent-cyan-700"
                  />
                  <span className="text-sm text-slate-700">{opt.label}</span>
                </label>
              ))}
            </Card>
          </div>

          {/* Resolution Settings */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Resolution Settings</h3>
            <Card className="p-4 space-y-0.5">
              <ToggleRow label="Require resolution notes" checked={requireResolutionNotes} onChange={setRequireResolutionNotes} />
              <ToggleRow label="Allow ticket reopening" checked={allowReopening} onChange={setAllowReopening} />
              <div className="flex items-center gap-2.5 py-1.5">
                <input
                  type="checkbox"
                  id="autoClose"
                  checked={autoCloseEnabled}
                  onChange={(e) => setAutoCloseEnabled(e.target.checked)}
                  className="w-4 h-4 rounded accent-cyan-700 cursor-pointer"
                />
                <label htmlFor="autoClose" className="text-sm text-slate-700 cursor-pointer">Auto-close after</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  disabled={!autoCloseEnabled}
                  value={autoCloseDays}
                  onChange={(e) => setAutoCloseDays(e.target.value)}
                  className="w-16 px-2 py-1 rounded border border-slate-200 text-sm text-center focus:outline-none focus:ring-1 focus:ring-cyan-600 disabled:opacity-50"
                />
                <span className="text-sm text-slate-500">days</span>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ─── Asset Management Settings Tab ───────────────────────── */}
      {activeTab === 'assets' && (
        <div className="space-y-6">
          {/* Asset Categories */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Asset Categories</h3>
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {ASSET_CATEGORIES.map((cat) => (
                  <Badge key={cat} variant="neutral" className="text-xs">{cat}</Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Asset Statuses */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Asset Statuses</h3>
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {ASSET_STATUSES.map((s) => (
                  <Badge key={s} variant="neutral" className="text-xs">{s}</Badge>
                ))}
              </div>
            </Card>
          </div>

          {/* Asset Fields */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Asset Fields</h3>
            <Card className="p-4">
              <p className="text-xs text-slate-500 mb-3">Enable or disable fields in asset records.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0.5">
                {ASSET_FIELDS.map((f) => (
                  <ToggleRow
                    key={f.key}
                    label={f.label}
                    checked={enabledAssetFields[f.key] ?? true}
                    onChange={(v) => setEnabledAssetFields((prev) => ({ ...prev, [f.key]: v }))}
                  />
                ))}
              </div>
            </Card>
          </div>

          {/* Warranty Notifications */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Warranty Notifications</h3>
            <Card className="p-4 space-y-3">
              <ToggleRow label="Notify before warranty expiration" checked={warrantyNotifyEnabled} onChange={setWarrantyNotifyEnabled} />
              <div className="flex items-center gap-3 pl-7">
                <span className="text-sm text-slate-700">Notification period</span>
                <select
                  disabled={!warrantyNotifyEnabled}
                  value={warrantyNotifyDays}
                  onChange={(e) => setWarrantyNotifyDays(e.target.value as '30' | '60' | '90')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-cyan-600 disabled:opacity-50"
                >
                  <option value="30">30 days</option>
                  <option value="60">60 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>
            </Card>
          </div>

          {/* Inventory Rules */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Inventory Rules</h3>
            <Card className="p-4 space-y-0.5">
              <ToggleRow label="Require employee assignment" checked={requireEmployeeAssignment} onChange={setRequireEmployeeAssignment} />
              <ToggleRow label="Allow multiple assets per employee" checked={allowMultipleAssets} onChange={setAllowMultipleAssets} />
              <ToggleRow label="Require return confirmation" checked={requireReturnConfirmation} onChange={setRequireReturnConfirmation} />
            </Card>
          </div>
        </div>
      )}

      {/* ─── Audit Log Settings Tab ───────────────────────────────── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Logged Activities */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Logged Activities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Ticket Actions</p>
                {AUDIT_TICKET_ACTIONS.map((a) => (
                  <ToggleRow key={a} label={a} checked={enabledTicketActions[a] ?? true}
                    onChange={(v) => setEnabledTicketActions((prev) => ({ ...prev, [a]: v }))} />
                ))}
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Access Actions</p>
                {AUDIT_ACCESS_ACTIONS.map((a) => (
                  <ToggleRow key={a} label={a} checked={enabledAccessActions[a] ?? true}
                    onChange={(v) => setEnabledAccessActions((prev) => ({ ...prev, [a]: v }))} />
                ))}
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Asset Actions</p>
                {AUDIT_ASSET_ACTIONS.map((a) => (
                  <ToggleRow key={a} label={a} checked={enabledAssetActions[a] ?? true}
                    onChange={(v) => setEnabledAssetActions((prev) => ({ ...prev, [a]: v }))} />
                ))}
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">System Status Actions</p>
                {AUDIT_SYSTEM_ACTIONS.map((a) => (
                  <ToggleRow key={a} label={a} checked={enabledSystemActions[a] ?? true}
                    onChange={(v) => setEnabledSystemActions((prev) => ({ ...prev, [a]: v }))} />
                ))}
              </Card>
              <Card className="p-4">
                <p className="text-xs font-bold text-slate-600 mb-2 uppercase tracking-wide">Permission Actions</p>
                {AUDIT_PERMISSION_ACTIONS.map((a) => (
                  <ToggleRow key={a} label={a} checked={enabledPermissionActions[a] ?? true}
                    onChange={(v) => setEnabledPermissionActions((prev) => ({ ...prev, [a]: v }))} />
                ))}
              </Card>
            </div>
          </div>

          {/* Log Retention */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Log Retention</h3>
            <Card className="p-4">
              <div className="flex flex-wrap gap-2">
                {LOG_RETENTION_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setLogRetention(opt)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      logRetention === opt
                        ? 'bg-cyan-700 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Log Visibility */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Log Visibility</h3>
            <Card className="p-4 space-y-0.5">
              {['View Own Actions', 'View Department Actions', 'View All Actions'].map((opt) => (
                <ToggleRow
                  key={opt}
                  label={opt}
                  checked={logVisibility[opt] ?? false}
                  onChange={(v) => setLogVisibility((prev) => ({ ...prev, [opt]: v }))}
                />
              ))}
            </Card>
          </div>

          {/* Export Options */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-3">Export Options</h3>
            <Card className="p-4 space-y-0.5">
              {['CSV Export', 'Excel Export', 'PDF Export'].map((opt) => (
                <ToggleRow
                  key={opt}
                  label={opt}
                  checked={exportOptions[opt] ?? false}
                  onChange={(v) => setExportOptions((prev) => ({ ...prev, [opt]: v }))}
                />
              ))}
            </Card>
          </div>
        </div>
      )}
      {/* ─── Access Control Settings Tab ─────────────────────────── */}
      {activeTab === 'access' && (
        <div className="space-y-6">
          {/* Default Approvers */}
          <div>
            <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Default Access Approvers</h3>
            <p className="text-xs text-slate-500 mb-3">
              These users must be contacted by IT before any portal access request is approved.
              IT is responsible for coordinating with them and granting access manually.
            </p>

            {/* Add approver */}
            <Card className="p-4 mb-4 border-cyan-100">
              <p className="text-xs font-semibold text-slate-600 mb-3">Add Approver</p>
              <div className="flex gap-2 flex-wrap">
                <select
                  className="flex-1 min-w-48 px-3 py-2 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select a team member…</option>
                  {teamMembers
                    .filter((m) => m.userId && !approverUserIds.has(m.userId))
                    .map((m) => (
                      <option key={m.userId ?? m.name} value={m.userId ?? ''}>
                        {m.name}{m.email ? ` — ${m.email}` : ''}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={() => void handleAddApprover()}
                  disabled={addingApprover || !selectedUserId}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-700 text-white text-sm font-semibold hover:bg-cyan-800 transition disabled:opacity-50"
                >
                  {addingApprover ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add
                </button>
              </div>
            </Card>

            {/* Approvers list */}
            {approversLoading ? (
              <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin text-cyan-700" /></div>
            ) : approvers.length === 0 ? (
              <Card className="p-8 text-center">
                <UserCheck size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No default approvers configured</p>
                <p className="text-xs text-slate-400 mt-1">Add at least one approver so IT knows who to contact before granting access.</p>
              </Card>
            ) : (
              <Card className="p-0 overflow-hidden">
                <div className="hidden sm:grid sm:grid-cols-[1fr_12rem_8rem_3rem] gap-3 px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">User</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Email</span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Added</span>
                  <span />
                </div>
                <div className="divide-y divide-slate-100">
                  {approvers.map((approver) => (
                    <div
                      key={approver.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors sm:grid sm:grid-cols-[1fr_12rem_8rem_3rem] sm:gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {approver.user.image ? (
                          <img src={approver.user.image} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-cyan-700">
                              {approver.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{approver.user.name}</p>
                          <Badge variant="neutral" className="text-[9px] mt-0.5">{approver.user.role.replace(/_/g, ' ')}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 truncate hidden sm:block">{approver.user.email}</p>
                      <p className="text-xs text-slate-400 hidden sm:block">
                        {new Date(approver.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      <button
                        type="button"
                        title="Remove approver"
                        disabled={removingId === approver.id}
                        onClick={() => void handleRemoveApprover(approver.id, approver.user.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition disabled:opacity-50"
                      >
                        {removingId === approver.id
                          ? <Loader2 size={14} className="animate-spin" />
                          : <Trash2 size={14} />
                        }
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Process note */}
          <Card className="p-4 bg-amber-50 border-amber-200">
            <div className="flex gap-3">
              <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Manual Access Granting Process</p>
                <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                  When an employee submits a portal access request, IT must:
                </p>
                <ol className="text-xs text-amber-700 mt-1.5 space-y-0.5 list-decimal list-inside leading-relaxed">
                  <li>Contact one of the approvers listed above</li>
                  <li>Get authorization for the requested portal and role</li>
                  <li>Manually grant the access via <strong>Active Access</strong></li>
                  <li>Mark the request as Approved to close the ticket</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
