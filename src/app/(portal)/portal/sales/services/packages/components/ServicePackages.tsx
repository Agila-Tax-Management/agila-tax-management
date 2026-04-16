// src/app/(portal)/portal/sales/services/packages/components/ServicePackages.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Boxes, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import { ServicePackageFormModal, type PackageRecord } from './ServicePackageFormModal';
import type { PortalRole } from '@/generated/prisma/client';

export function ServicePackages(): React.ReactNode {
  const { success, error } = useToast();
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<PackageRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PackageRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Portal access control
  const [canEdit, setCanEdit] = useState(false);

  // Fetch portal access to determine edit/delete permissions
  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const res = await fetch('/api/auth/portal-access');
        if (res.ok) {
          const data = await res.json() as {
            userRole: string;
            portals: Array<{ portal: string; role: PortalRole }>;
          };
          const salesAccess = data.portals.find((p) => p.portal === 'SALES');
          const hasEditAccess =
            data.userRole === 'SUPER_ADMIN' ||
            data.userRole === 'ADMIN' ||
            salesAccess?.role === 'ADMIN' ||
            salesAccess?.role === 'SETTINGS';
          setCanEdit(hasEditAccess);
        }
      } catch {
        setCanEdit(false);
      }
    };
    void fetchAccess();
  }, []);

  useEffect(() => {
    fetch('/api/sales/services/packages')
      .then((r) => r.json())
      .then((d: { data?: PackageRecord[] }) => {
        setPackages(d.data ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const active = packages.filter((p) => p.status === 'ACTIVE').length;
    const avgRate =
      packages.length > 0
        ? packages.reduce((sum, p) => sum + parseFloat(p.packageRate), 0) / packages.length
        : 0;
    return { total: packages.length, active, avgRate };
  }, [packages]);

  function handleOpenCreate() {
    setEditTarget(null);
    setShowForm(true);
  }

  function handleOpenEdit(pkg: PackageRecord) {
    setEditTarget(pkg);
    setShowForm(true);
  }

  function handleSaved(pkg: PackageRecord) {
    setPackages((prev) => {
      const exists = prev.find((p) => p.id === pkg.id);
      return exists ? prev.map((p) => (p.id === pkg.id ? pkg : p)) : [pkg, ...prev];
    });
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sales/services/packages/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        error('Failed to delete package', d.error ?? 'An error occurred.');
        return;
      }
      setPackages((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      success('Package deleted', `"${deleteTarget.name}" was removed successfully.`);
    } catch {
      error('Failed to delete package', 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-[3px] border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading service packages…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <Boxes size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Service Packages
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Bundled service offerings with custom rates and inclusions
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.total}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Packages</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.active}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">
              ₱{stats.avgRate.toLocaleString('en-PH', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Rate</p>
          </div>
        </div>
      </div>

      {/* Add Button */}
      {canEdit && (
        <div className="flex justify-end">
          <Button
            onClick={handleOpenCreate}
            className="bg-amber-500 text-white rounded-md font-bold text-[11px] px-4 py-2 hover:bg-amber-600 shadow-sm"
          >
            <Plus size={14} className="mr-1" />
            New Package
          </Button>
        </div>
      )}

      {/* Table */}
      <Card className="border-slate-200 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-amber-50 to-orange-50">
          <div className="flex items-center gap-3">
            <Boxes className="text-amber-600" size={20} />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              All Packages
            </h3>
          </div>
        </div>

        {packages.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <Boxes size={36} className="mx-auto mb-4 opacity-30" />
            <p className="text-sm font-semibold">No service packages yet</p>
            <p className="text-xs mt-1">Click &quot;New Package&quot; to create your first bundle.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Code
                  </th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Package Name
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Services
                  </th>
                  <th className="text-right px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Package Rate
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    VAT
                  </th>
                  <th className="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Status
                  </th>
                  <th className="text-right px-6 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packages.map((pkg) => (
                  <React.Fragment key={pkg.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {pkg.code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900">{pkg.name}</p>
                        {pkg.description && (
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{pkg.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => setExpandedRow(expandedRow === pkg.id ? null : pkg.id)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700"
                        >
                          {pkg.items.length}
                          {pkg.items.length > 0 &&
                            (expandedRow === pkg.id ? (
                              <ChevronUp size={12} />
                            ) : (
                              <ChevronDown size={12} />
                            ))}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-black text-slate-900">
                          ₱{parseFloat(pkg.packageRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {pkg.isVatable ? (
                          <Badge variant="info" className="text-[9px] font-bold">VAT</Badge>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge
                          variant={
                            pkg.status === 'ACTIVE'
                              ? 'success'
                              : pkg.status === 'INACTIVE'
                              ? 'warning'
                              : 'neutral'
                          }
                          className="text-[9px] font-black"
                        >
                          {pkg.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        {canEdit && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              className="h-7 px-3 bg-slate-800 hover:bg-slate-900 text-white text-[11px] flex items-center gap-1"
                              onClick={() => handleOpenEdit(pkg)}
                            >
                              <Pencil size={11} />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              className="h-7 px-2 text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => setDeleteTarget(pkg)}
                            >
                              <Trash2 size={11} />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>

                    {/* Expanded service items row */}
                    {expandedRow === pkg.id && pkg.items.length > 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 pb-4 bg-amber-50/40">
                          <div className="rounded-xl border border-amber-100 bg-white overflow-hidden">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-amber-50 border-b border-amber-100">
                                  <th className="text-left px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">
                                    Service
                                  </th>
                                  <th className="text-center px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">
                                    Type
                                  </th>
                                  <th className="text-center px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">
                                    Qty
                                  </th>
                                  <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">
                                    Default Rate
                                  </th>
                                  <th className="text-right px-4 py-2 font-black text-slate-500 uppercase tracking-widest text-[9px]">
                                    Override Rate
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {pkg.items.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50">
                                    <td className="px-4 py-2 font-semibold text-slate-800">
                                      {item.service.name}
                                      {item.service.code && (
                                        <span className="ml-1.5 font-mono text-[9px] text-slate-400">
                                          [{item.service.code}]
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      <Badge
                                        variant={item.service.billingType === 'RECURRING' ? 'info' : 'neutral'}
                                        className="text-[8px] font-bold"
                                      >
                                        {item.service.billingType === 'RECURRING' ? 'Recurring' : 'One-Time'}
                                      </Badge>
                                    </td>
                                    <td className="px-4 py-2 text-center font-bold text-slate-700">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-2 text-right text-slate-500">
                                      ₱{parseFloat(item.service.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-4 py-2 text-right font-bold text-amber-700">
                                      {item.overrideRate
                                        ? `₱${parseFloat(item.overrideRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
                                        : <span className="text-slate-300 font-normal">Default</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <ServicePackageFormModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        editTarget={editTarget}
        onSaved={handleSaved}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Service Package"
        size="sm"
      >
        {deleteTarget && (
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-bold text-slate-900">&quot;{deleteTarget.name}&quot;</span>? This action
              cannot be undone.
            </p>
            {deleteTarget.items.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                This package contains {deleteTarget.items.length} service item
                {deleteTarget.items.length !== 1 ? 's' : ''} which will also be removed.
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
              >
                {isDeleting ? 'Deleting…' : 'Delete Package'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
