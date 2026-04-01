// src/components/hr/profile/components/EmploymentTab.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { EmploymentFormModal } from './EmploymentFormModal';
import type { ContractRecord, EmploymentRecord } from '../profile-types';
import { useToast } from '@/context/ToastContext';

interface IdNameOption { id: number; name: string; }
interface ManagerOption { id: number; fullName: string; }

interface EmploymentTabProps {
  employmentRecords: EmploymentRecord[];
  contracts: ContractRecord[];
  employeeId: number;
  employeeNo?: string | null;
  departmentOptions: IdNameOption[];
  levelOptions: IdNameOption[];
  managerOptions: ManagerOption[];
  onEmploymentSaved: () => void;
}

const EMP_TYPE_LABEL: Record<string, string> = {
  REGULAR: 'Regular', PROBATIONARY: 'Probationary', CONTRACTUAL: 'Contractual',
  PROJECT_BASED: 'Project-Based', PART_TIME: 'Part-Time', INTERN: 'Intern',
};

const EMP_STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Active', ON_LEAVE: 'On Leave', RESIGNED: 'Resigned',
  TERMINATED: 'Terminated', SUSPENDED: 'Suspended', RETIRED: 'Retired',
};

const EMP_STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success', ON_LEAVE: 'info', RESIGNED: 'danger',
  TERMINATED: 'danger', SUSPENDED: 'warning', RETIRED: 'neutral',
};

export function EmploymentTab({
  employmentRecords, contracts, employeeId, employeeNo, departmentOptions, levelOptions, managerOptions, onEmploymentSaved,
}: EmploymentTabProps): React.ReactNode {
  const { success, error } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EmploymentRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<EmploymentRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasActiveEmployment = employmentRecords.some((r) => r.status === 'ACTIVE');

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/hr/employees/${employeeId}/employment?employmentId=${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to delete', data.error ?? 'Could not delete employment record.');
        return;
      }
      success('Employment deleted', 'The employment record has been removed.');
      setDeleteTarget(null);
      onEmploymentSaved();
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const deleteTargetHasActiveContract = deleteTarget
    ? contracts.some((c) => c.employmentId === deleteTarget.id && c.status === 'ACTIVE')
    : false;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-foreground">Employment</h2>
            <p className="text-sm text-muted-foreground mt-1">Manage employee job assignments and employment history.</p>
          </div>
          <Button
            className="bg-rose-600 hover:bg-rose-700 text-white gap-2"
            onClick={() => setAddOpen(true)}
          >
            <Plus size={16} /> Add Employment
          </Button>
        </div>
        {hasActiveEmployment && (
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 border px-4 py-3 text-amber-700">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p className="text-xs font-medium text-black">
              This employee has an active employment record. Adding a new one will create a parallel record — ensure this is intentional.
            </p>
          </div>
        )}
      </Card>

      {/* Employment history */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-foreground">Employment History</h3>
        <div className="space-y-3">
          {employmentRecords.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No employment records yet.</p>
          )}
          {employmentRecords.map((record) => {
            const hasActiveContract = contracts.some(
              (c) => c.employmentId === record.id && c.status === 'ACTIVE',
            );
            return (
              <div
                key={record.id}
                className="rounded-xl border border-border p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground">{record.position || '—'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {record.department ? `${record.department} Department` : record.clientName}
                      {record.employmentType && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          · {EMP_TYPE_LABEL[record.employmentType] ?? record.employmentType}
                        </span>
                      )}
                    </p>
                    {record.hireDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(record.hireDate).toLocaleDateString('en-PH')}
                        {record.endDate
                          ? ` – ${new Date(record.endDate).toLocaleDateString('en-PH')}`
                          : ' – Present'}
                      </p>
                    )}
                    {hasActiveContract && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                        ⚠ Has an active contract
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={EMP_STATUS_VARIANT[record.status] ?? 'neutral'}>
                      {EMP_STATUS_LABEL[record.status] ?? record.status}
                    </Badge>
                    <button
                      type="button"
                      title="Edit employment"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      onClick={() => setEditRecord(record)}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      type="button"
                      title="Delete employment"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => setDeleteTarget(record)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Add modal */}
      <EmploymentFormModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={() => { onEmploymentSaved(); }}
        employeeId={employeeId}
        employeeNo={employeeNo}
        departmentOptions={departmentOptions}
        levelOptions={levelOptions}
        managerOptions={managerOptions}
        employment={null}
      />

      {/* Edit modal */}
      <EmploymentFormModal
        isOpen={editRecord !== null}
        onClose={() => setEditRecord(null)}
        onSaved={() => { onEmploymentSaved(); }}
        employeeId={employeeId}
        employeeNo={employeeNo}
        departmentOptions={departmentOptions}
        levelOptions={levelOptions}
        managerOptions={managerOptions}
        employment={editRecord}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        title="Delete Employment Record"
        size="sm"
      >
        <div className="space-y-4 p-4">
          {deleteTarget?.status === 'ACTIVE' && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 dark:border-red-800 dark:text-red-400">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium">This is an <strong>Active</strong> employment record. Deleting it may affect payroll and compliance workflows.</p>
            </div>
          )}
          {deleteTargetHasActiveContract && (
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-700 dark:border-amber-800 dark:text-amber-400">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium">This employment has an <strong>active contract</strong> on record. The contract will also be removed.</p>
            </div>
          )}
          <p className="text-sm text-foreground">
            Are you sure you want to delete the employment record for{' '}
            <span className="font-semibold">{deleteTarget?.position || deleteTarget?.department || 'this position'}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              No, keep it
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => { void handleDelete(); }}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Yes, delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

