// src/components/hr/profile/components/ContractsTab.tsx
'use client';

import React, { useState } from 'react';
import { AlertTriangle, Pencil, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { ContractFormModal } from './ContractFormModal';
import { ContractDetailView } from './ContractDetailView';
import { useToast } from '@/context/ToastContext';
import type { ContractRecord, EmploymentRecord, ScheduleOption } from '../profile-types';

const CONTRACT_STATUS_VARIANT: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'neutral'> = {
  ACTIVE: 'success', DRAFT: 'warning', EXPIRED: 'neutral', TERMINATED: 'danger',
};

interface ContractsTabProps {
  contracts: ContractRecord[];
  employmentRecords: EmploymentRecord[];
  scheduleOptions: ScheduleOption[];
  employeeId: number;
  onContractSaved: () => void;
}

export function ContractsTab({
  contracts, employmentRecords, scheduleOptions, employeeId, onContractSaved,
}: ContractsTabProps): React.ReactNode {
  const { success, error } = useToast();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editContract, setEditContract] = useState<ContractRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContractRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);

  const selectedContract = contracts.find((c) => c.id === selectedContractId) ?? null;
  const hasActiveContract = contracts.some((c) => c.status === 'ACTIVE');

  const handleSaved = () => {
    onContractSaved();
    setAddModalOpen(false);
    setEditContract(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `/api/hr/employees/${employeeId}/contract?contractId=${deleteTarget.id}`,
        { method: 'DELETE' },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        error('Failed to delete', data.error ?? 'Could not delete contract.');
        return;
      }
      success('Contract deleted', 'The contract has been removed.');
      setDeleteTarget(null);
      onContractSaved();
    } catch {
      error('Network error', 'Could not connect to the server. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Detail view mode ──────────────────────────────────────────
  if (selectedContract) {
    return (
      <ContractDetailView
        contract={selectedContract}
        employeeId={employeeId}
        scheduleOptions={scheduleOptions}
        onBack={() => setSelectedContractId(null)}
        onContractSaved={() => {
          onContractSaved();
        }}
      />
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-foreground">Contracts</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Legal agreement records for each employment period. Click a contract to view details
                and compensation.
              </p>
            </div>
            <Button className="gap-2 shrink-0" onClick={() => setAddModalOpen(true)}>
              <Plus size={16} /> Add Contract
            </Button>
          </div>

          {hasActiveContract && (
            <div className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 dark:border-amber-800 px-4 py-3">
              <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-400">
                There is already an <span className="font-semibold">Active</span> contract on record.
                Adding a new active contract may conflict with the existing one.
              </p>
            </div>
          )}
        </Card>

        {/* Contract Records */}
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
            Contract Records
          </h3>

          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No contracts on record. Click &ldquo;Add Contract&rdquo; to create one.
            </p>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  role="button"
                  tabIndex={0}
                  className="rounded-xl border border-border p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
                  onClick={() => setSelectedContractId(contract.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedContractId(contract.id);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {contract.contractType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contract.positionTitle} · {contract.departmentName}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {contract.startDate
                          ? new Date(contract.startDate).toLocaleDateString('en-PH')
                          : '—'}
                        {' '}–{' '}
                        {contract.endDate
                          ? new Date(contract.endDate).toLocaleDateString('en-PH')
                          : 'Open-ended'}
                      </p>
                      <p className="text-xs text-blue-500 mt-1.5">Click to view details &amp; compensation →</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? 'neutral'}>
                        {contract.status}
                      </Badge>
                      <button
                        type="button"
                        title="Edit contract"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditContract(contract);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        type="button"
                        title="Delete contract"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(contract);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Add Contract Modal */}
      <ContractFormModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSaved={handleSaved}
        employeeId={employeeId}
        employmentRecords={employmentRecords}
        scheduleOptions={scheduleOptions}
        contract={null}
      />

      {/* Edit Contract Modal */}
      <ContractFormModal
        isOpen={editContract !== null}
        onClose={() => setEditContract(null)}
        onSaved={handleSaved}
        employeeId={employeeId}
        employmentRecords={employmentRecords}
        scheduleOptions={scheduleOptions}
        contract={editContract}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { if (!deleteLoading) setDeleteTarget(null); }}
        title="Delete Contract"
        size="sm"
      >
        <div className="space-y-4">
          {deleteTarget?.status === 'ACTIVE' && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 dark:border-red-800 dark:text-red-400">
              <AlertTriangle size={15} className="mt-0.5 shrink-0" />
              <p className="text-xs font-medium">
                This is an <strong>Active</strong> contract. Deleting it will immediately remove the
                employee&apos;s current contractual agreement.
              </p>
            </div>
          )}
          <p className="text-sm text-foreground">
            Are you sure you want to delete the{' '}
            <span className="font-semibold">
              {deleteTarget?.contractType.replace(/_/g, ' ')}
            </span>{' '}
            contract? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
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
    </>
  );
}


