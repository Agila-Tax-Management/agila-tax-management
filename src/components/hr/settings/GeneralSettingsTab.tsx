'use client';
// src/components/hr/settings/GeneralSettingsTab.tsx

import React, { useCallback, useEffect, useState } from 'react';
import { Settings, Clock, UserCheck, AlertCircle, Check, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

interface ExemptEmployee {
  id: number;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
}

interface HrGeneralSetting {
  id: string;
  employeeNumberPrefix: string;
  strictOvertimeApproval: boolean;
  disableLateUndertimeGlobal: boolean;
  enableAutoTimeOut: boolean;
  autoTimeOutTime: string | null;
  autoOvertimeEmployees: ExemptEmployee[];
  exemptLateUndertimeEmployees: ExemptEmployee[];
}

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
}

interface ExemptionModalProps {
  title: string;
  description: string;
  currentList: ExemptEmployee[];
  allEmployees: EmployeeOption[];
  loadingEmployees: boolean;
  adding: boolean;
  removing: number | null;
  onAdd: (employeeId: number) => void;
  onRemove: (employeeId: number) => void;
  onClose: () => void;
}

function ExemptionModal({
  title, description, currentList, allEmployees, loadingEmployees,
  adding, removing, onAdd, onRemove, onClose,
}: ExemptionModalProps) {
  const [search, setSearch] = useState('');
  const currentIds = new Set(currentList.map((e) => e.id));
  const available = allEmployees.filter(
    (e) => !currentIds.has(e.id) &&
      (e.firstName.toLowerCase().includes(search.toLowerCase()) ||
        e.lastName.toLowerCase().includes(search.toLowerCase()) ||
        (e.employeeNo ?? '').toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Current list */}
          {currentList.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Exceptions ({currentList.length})</p>
              <div className="space-y-1">
                {currentList.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border">
                    <div>
                      <span className="text-sm font-medium text-foreground">{emp.firstName} {emp.lastName}</span>
                      {emp.employeeNo && <span className="ml-2 text-xs text-muted-foreground">{emp.employeeNo}</span>}
                    </div>
                    <button
                      onClick={() => onRemove(emp.id)}
                      disabled={removing === emp.id}
                      className="p-1 rounded hover:bg-red-50 text-red-500 disabled:opacity-50"
                    >
                      {removing === emp.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add employee */}
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Add Exception</p>
            <input
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 mb-2"
              placeholder="Search by name or employee number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
              </div>
            ) : available.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                {search ? 'No employees match your search.' : 'All active employees are already listed.'}
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {available.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted/40 border border-transparent hover:border-border transition-colors">
                    <div>
                      <span className="text-sm font-medium text-foreground">{emp.firstName} {emp.lastName}</span>
                      {emp.employeeNo && <span className="ml-2 text-xs text-muted-foreground">{emp.employeeNo}</span>}
                    </div>
                    <button
                      onClick={() => onAdd(emp.id)}
                      disabled={adding}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export function GeneralSettingsTab() {
  const { success, error } = useToast();

  const [setting, setSetting] = useState<HrGeneralSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Prefix edit state
  const [prefix, setPrefix] = useState('');
  const [prefixDirty, setPrefixDirty] = useState(false);

  // Auto timeout edit state
  const [autoTimeOut, setAutoTimeOut] = useState('');
  const [autoTimeOutDirty, setAutoTimeOutDirty] = useState(false);

  // Exemption modals
  const [showOtModal, setShowOtModal] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [allEmployees, setAllEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [addingOt, setAddingOt] = useState(false);
  const [addingLate, setAddingLate] = useState(false);
  const [removingOt, setRemovingOt] = useState<number | null>(null);
  const [removingLate, setRemovingLate] = useState<number | null>(null);

  const fetchSetting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/hr/settings/general');
      const data = (await res.json()) as { data?: HrGeneralSetting; error?: string };
      if (!res.ok || !data.data) { error('Failed to load', 'Could not load HR settings.'); return; }
      setSetting(data.data);
      setPrefix(data.data.employeeNumberPrefix);
      setAutoTimeOut(data.data.autoTimeOutTime ?? '');
    } catch {
      error('Network error', 'Could not connect to the server.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => { void fetchSetting(); }, [fetchSetting]);

  const fetchEmployees = useCallback(async () => {
    if (allEmployees.length > 0) return;
    setLoadingEmployees(true);
    try {
      const res = await fetch('/api/hr/employees');
      const data = (await res.json()) as { data?: EmployeeOption[] };
      setAllEmployees(data.data ?? []);
    } catch { /* ignore */ }
    finally { setLoadingEmployees(false); }
  }, [allEmployees]);

  const openOtModal = () => { setShowOtModal(true); void fetchEmployees(); };
  const openLateModal = () => { setShowLateModal(true); void fetchEmployees(); };

  const patchSetting = async (vals: Partial<HrGeneralSetting>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/hr/settings/general', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vals),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { error('Save failed', data.error ?? 'An error occurred.'); return false; }
      return true;
    } catch {
      error('Network error', 'Could not connect.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (field: 'strictOvertimeApproval' | 'disableLateUndertimeGlobal' | 'enableAutoTimeOut') => {
    if (!setting) return;
    const newVal = !setting[field];
    const ok = await patchSetting({ [field]: newVal });
    if (ok) {
      setSetting((s) => s ? { ...s, [field]: newVal } : s);
      success('Setting saved', `${field === 'strictOvertimeApproval' ? 'Strict overtime approval' : field === 'disableLateUndertimeGlobal' ? 'Late/undertime setting' : 'Auto timeout'} updated.`);
    }
  };

  const handleSavePrefix = async () => {
    if (!prefix.trim()) { error('Validation', 'Prefix cannot be empty.'); return; }
    const ok = await patchSetting({ employeeNumberPrefix: prefix.trim().toUpperCase() });
    if (ok) {
      setSetting((s) => s ? { ...s, employeeNumberPrefix: prefix.trim().toUpperCase() } : s);
      setPrefix(prefix.trim().toUpperCase());
      setPrefixDirty(false);
      success('Prefix saved', `Employee numbers will now use "${prefix.trim().toUpperCase()}" prefix.`);
    }
  };

  const handleSaveAutoTimeout = async () => {
    if (setting?.enableAutoTimeOut && !autoTimeOut) { error('Validation', 'Please enter a time for auto timeout.'); return; }
    const ok = await patchSetting({ autoTimeOutTime: autoTimeOut || null });
    if (ok) {
      setSetting((s) => s ? { ...s, autoTimeOutTime: autoTimeOut || null } : s);
      setAutoTimeOutDirty(false);
      success('Auto timeout saved', 'Auto timeout time updated.');
    }
  };

  // OT exemptions
  const handleAddOt = async (employeeId: number) => {
    setAddingOt(true);
    try {
      const res = await fetch('/api/hr/settings/general/auto-overtime-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      const data = (await res.json()) as { data?: ExemptEmployee[]; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'An error occurred.'); return; }
      setSetting((s) => s ? { ...s, autoOvertimeEmployees: data.data ?? [] } : s);
      success('Added', 'Employee added to auto-overtime list.');
    } catch { error('Network error', 'Could not connect.'); }
    finally { setAddingOt(false); }
  };
  const handleRemoveOt = async (employeeId: number) => {
    setRemovingOt(employeeId);
    try {
      const res = await fetch('/api/hr/settings/general/auto-overtime-employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      const data = (await res.json()) as { data?: ExemptEmployee[]; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'An error occurred.'); return; }
      setSetting((s) => s ? { ...s, autoOvertimeEmployees: data.data ?? [] } : s);
      success('Removed', 'Employee removed from auto-overtime list.');
    } catch { error('Network error', 'Could not connect.'); }
    finally { setRemovingOt(null); }
  };

  // Late exemptions
  const handleAddLate = async (employeeId: number) => {
    setAddingLate(true);
    try {
      const res = await fetch('/api/hr/settings/general/exempt-employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      const data = (await res.json()) as { data?: ExemptEmployee[]; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'An error occurred.'); return; }
      setSetting((s) => s ? { ...s, exemptLateUndertimeEmployees: data.data ?? [] } : s);
      success('Added', 'Employee added to late/undertime exemption list.');
    } catch { error('Network error', 'Could not connect.'); }
    finally { setAddingLate(false); }
  };
  const handleRemoveLate = async (employeeId: number) => {
    setRemovingLate(employeeId);
    try {
      const res = await fetch('/api/hr/settings/general/exempt-employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId }),
      });
      const data = (await res.json()) as { data?: ExemptEmployee[]; error?: string };
      if (!res.ok) { error('Failed', data.error ?? 'An error occurred.'); return; }
      setSetting((s) => s ? { ...s, exemptLateUndertimeEmployees: data.data ?? [] } : s);
      success('Removed', 'Employee removed from late/undertime exemption list.');
    } catch { error('Network error', 'Could not connect.'); }
    finally { setRemovingLate(null); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!setting) return null;

  const inputCls = 'rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500';

  return (
    <div className="space-y-5">
      {/* ── Employee Number Prefix ─────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <Settings size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Employee Number Prefix</h3>
            <p className="text-xs text-muted-foreground">Used when auto-generating new employee numbers (e.g. {prefix || 'EMP'}-00001)</p>
          </div>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Prefix</label>
            <input
              className={inputCls}
              value={prefix}
              maxLength={20}
              onChange={(e) => { setPrefix(e.target.value.toUpperCase()); setPrefixDirty(true); }}
              placeholder="EMP"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preview</label>
            <div className="px-3 py-2 rounded-lg bg-muted text-sm font-mono text-muted-foreground">
              {prefix || 'EMP'}-00001
            </div>
          </div>
          {prefixDirty && (
            <button
              onClick={() => void handleSavePrefix()}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          )}
        </div>
      </div>

      {/* ── Strict Overtime Approval ───────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={15} className="text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Strict Overtime Approval</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When <span className="font-semibold text-foreground">enabled</span>, overtime hours from punches are ignored unless an approved Overtime Request exists for that date.
                <br />
                When <span className="font-semibold text-foreground">disabled</span>, excess hours beyond the shift schedule are automatically counted as paid OT.
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleToggle('strictOvertimeApproval')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              setting.strictOvertimeApproval ? 'bg-violet-600' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                setting.strictOvertimeApproval ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {setting.strictOvertimeApproval && (
          <div className="border border-violet-200 rounded-lg p-4 bg-violet-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-violet-600" />
                <span className="text-xs font-semibold text-violet-700">
                  Auto-Overtime Exceptions — {setting.autoOvertimeEmployees.length} employee{setting.autoOvertimeEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={openOtModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-300 text-violet-700 hover:bg-violet-100 transition-colors"
              >
                <UserCheck size={12} />
                Manage
              </button>
            </div>
            <p className="text-xs text-violet-700/80">
              These employees bypass the strict rule — their excess punch hours are always auto-converted to paid OT.
            </p>
            {setting.autoOvertimeEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {setting.autoOvertimeEmployees.map((e) => (
                  <span key={e.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 border border-violet-200">
                    {e.firstName} {e.lastName}
                    {e.employeeNo && <span className="opacity-60">· {e.employeeNo}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Disable Late/Undertime Globally ───────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={15} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Disable Late &amp; Undertime Deductions</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When <span className="font-semibold text-foreground">enabled</span>, no deductions are applied for lateness or undertime for <em>all</em> employees.
                You can add exceptions for employees who <em>should still be deducted</em>.
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleToggle('disableLateUndertimeGlobal')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              setting.disableLateUndertimeGlobal ? 'bg-amber-500' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                setting.disableLateUndertimeGlobal ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {setting.disableLateUndertimeGlobal && (
          <div className="border border-amber-200 rounded-lg p-4 bg-amber-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600" />
                <span className="text-xs font-semibold text-amber-700">
                  Still Deducted — {setting.exemptLateUndertimeEmployees.length} employee{setting.exemptLateUndertimeEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
              <button
                onClick={openLateModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-300 text-amber-700 hover:bg-amber-100 transition-colors"
              >
                <UserCheck size={12} />
                Manage
              </button>
            </div>
            <p className="text-xs text-amber-700/80">
              These employees are <em>not</em> covered by the global disable — their late and undertime are still deducted normally.
            </p>
            {setting.exemptLateUndertimeEmployees.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {setting.exemptLateUndertimeEmployees.map((e) => (
                  <span key={e.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                    {e.firstName} {e.lastName}
                    {e.employeeNo && <span className="opacity-60">· {e.employeeNo}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Auto Timeout ──────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
              <Clock size={15} className="text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Automatic Time Out</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                When enabled, employees who have not clocked out are automatically timed out at the configured time each day.
              </p>
            </div>
          </div>
          <button
            onClick={() => void handleToggle('enableAutoTimeOut')}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none disabled:opacity-50 ${
              setting.enableAutoTimeOut ? 'bg-emerald-600' : 'bg-muted-foreground/30'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                setting.enableAutoTimeOut ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {setting.enableAutoTimeOut && (
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Auto Time Out</label>
              <input
                type="time"
                className={inputCls}
                value={autoTimeOut}
                onChange={(e) => { setAutoTimeOut(e.target.value); setAutoTimeOutDirty(true); }}
              />
            </div>
            {autoTimeOutDirty && (
              <button
                onClick={() => void handleSaveAutoTimeout()}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                Save
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showOtModal && (
        <ExemptionModal
          title="Auto-Overtime Exceptions"
          description="Employees in this list will always have their excess punch hours auto-converted to paid OT, even when strict approval is enabled."
          currentList={setting.autoOvertimeEmployees}
          allEmployees={allEmployees}
          loadingEmployees={loadingEmployees}
          adding={addingOt}
          removing={removingOt}
          onAdd={handleAddOt}
          onRemove={handleRemoveOt}
          onClose={() => setShowOtModal(false)}
        />
      )}

      {showLateModal && (
        <ExemptionModal
          title="Still Deducted Exceptions"
          description="These employees are NOT covered by the global late/undertime disable — their deductions are calculated normally."
          currentList={setting.exemptLateUndertimeEmployees}
          allEmployees={allEmployees}
          loadingEmployees={loadingEmployees}
          adding={addingLate}
          removing={removingLate}
          onAdd={handleAddLate}
          onRemove={handleRemoveLate}
          onClose={() => setShowLateModal(false)}
        />
      )}
    </div>
  );
}
