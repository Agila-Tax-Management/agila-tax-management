// src/components/sales/MonthlyServicePlans.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  Plus,
  CalendarClock,
  Pencil,
  Trash2,
  Building2,
  MapPin,
  Package,
  Clock,
  Eye,
  DollarSign,
} from 'lucide-react';

interface ServicePlanItem {
  id: number;
  name: string;
  description: string | null;
  recurring: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  serviceRate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  governmentOffices: { id: number; code: string; name: string }[];
  cities: { id: number; name: string; province: string | null }[];
  inclusions: { id: number; name: string; category: string | null }[];
  taskTemplate: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

const RECURRING_LABEL: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

export function MonthlyServicePlans(): React.ReactNode {
  const router = useRouter();
  const { success, error } = useToast();
  const [plans, setPlans] = useState<ServicePlanItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ServicePlanItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewTarget, setViewTarget] = useState<ServicePlanItem | null>(null);

  useEffect(() => {
    fetch('/api/sales/service-plans')
      .then((res) => res.json())
      .then((data: { data?: ServicePlanItem[] }) => {
        setPlans(data.data ?? []);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const stats = useMemo(() => {
    const active = plans.filter((p) => p.status === 'ACTIVE').length;
    const avgRate =
      plans.length > 0
        ? plans.reduce((sum, p) => sum + parseFloat(p.serviceRate), 0) / plans.length
        : 0;
    return { totalPlans: plans.length, activePlans: active, avgRate: Math.round(avgRate).toLocaleString() };
  }, [plans]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/sales/service-plans/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        error('Failed to delete plan', (data as { error?: string }).error ?? 'An error occurred.');
        return;
      }
      setPlans((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
      success('Plan deleted', `"${deleteTarget.name}" was removed successfully.`);
    } catch {
      error('Failed to delete plan', 'An error occurred.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-[3px] border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading monthly service plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <CalendarClock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Monthly Service Plans
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Pre-configured subscription packages with recurring services
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.totalPlans}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Plans</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">{stats.activePlans}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active</p>
          </div>
          <div className="text-center px-4 py-2 bg-white border border-slate-200 rounded-xl">
            <p className="text-lg font-black text-slate-900">₱{stats.avgRate}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Rate</p>
          </div>
        </div>
      </div>

      {/* Add Plan Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push('/portal/sales/services/monthly/new-service-plan')}
          className="bg-purple-600 text-white rounded-md font-bold text-[11px] px-4 py-2 hover:bg-purple-700 shadow-sm"
        >
          <Plus size={14} className="mr-1" />
          Add Service Plan
        </Button>
      </div>

      {/* Plan Cards */}
      <Card className="border-slate-200 shadow-lg overflow-visible">
        <div className="p-8 border-b border-slate-100 bg-linear-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3 mb-2">
            <CalendarClock className="text-purple-600" size={24} />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Subscription Plans
            </h3>
          </div>
          <p className="text-xs text-slate-600 ml-9">
            Pre-configured monthly packages with comprehensive services
          </p>
        </div>

        <div className="p-8">
          {plans.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CalendarClock size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">No service plans yet</p>
              <p className="text-xs mt-1">Click &quot;Add Service Plan&quot; to create your first plan.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="relative p-6 rounded-2xl border-2 border-slate-200 bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                  onClick={() => setViewTarget(plan)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <Badge
                      variant={plan.status === 'ACTIVE' ? 'success' : plan.status === 'INACTIVE' ? 'warning' : 'neutral'}
                      className="text-[9px] font-black"
                    >
                      {plan.status}
                    </Badge>
                    <Badge variant="info" className="text-[9px] font-bold flex items-center gap-1">
                      <Clock size={10} />
                      {RECURRING_LABEL[plan.recurring]}
                    </Badge>
                  </div>

                  <h4 className="font-black text-slate-900 text-base mb-1 group-hover:text-slate-700 transition-colors">
                    {plan.name}
                  </h4>
                  {plan.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{plan.description}</p>
                  )}

                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="text-sm font-bold text-slate-700">₱</span>
                    <span className="text-2xl font-black text-slate-900">
                      {parseFloat(plan.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-slate-400">/{RECURRING_LABEL[plan.recurring].toLowerCase()}</span>
                  </div>

                  <div className="space-y-1.5 mb-4">
                    {plan.governmentOffices.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 size={12} />
                        <span>{plan.governmentOffices.map((g) => g.code).join(', ')}</span>
                      </div>
                    )}
                    {plan.cities.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin size={12} />
                        <span>{plan.cities.length === 1 ? plan.cities[0].name : `${plan.cities.length} cities`}</span>
                      </div>
                    )}
                    {plan.inclusions.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Package size={12} />
                        <span>{plan.inclusions.length} inclusions</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      className="flex-1 h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white text-[11px] flex items-center justify-center gap-1.5"
                      onClick={(e) => { e.stopPropagation(); setViewTarget(plan); }}
                    >
                      <Eye size={12} />
                      View
                    </Button>
                    <Button
                      className="flex-1 h-8 px-3 bg-slate-800 hover:bg-slate-900 text-white text-[11px] flex items-center justify-center gap-1.5"
                      onClick={(e) => { e.stopPropagation(); router.push(`/portal/sales/services/monthly/update-service-plan/${plan.id}`); }}
                    >
                      <Pencil size={12} />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 px-3 text-rose-600 border-rose-200 hover:bg-rose-50 text-[11px] flex items-center justify-center gap-1.5"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(plan); }}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* View Detail Modal */}
      <Modal isOpen={!!viewTarget} onClose={() => setViewTarget(null)} title="Service Plan Details" size="md">
        {viewTarget && (
          <div className="p-6 space-y-5">
            {/* Status & Recurring */}
            <div className="flex items-center gap-2">
              <Badge
                variant={viewTarget.status === 'ACTIVE' ? 'success' : viewTarget.status === 'INACTIVE' ? 'warning' : 'neutral'}
                className="text-[10px] font-black"
              >
                {viewTarget.status}
              </Badge>
              <Badge variant="info" className="text-[10px] font-bold flex items-center gap-1">
                <Clock size={10} />
                {RECURRING_LABEL[viewTarget.recurring]}
              </Badge>
            </div>

            {/* Name */}
            <div>
              <h3 className="text-xl font-black text-slate-900">{viewTarget.name}</h3>
              {viewTarget.description && (
                <p className="text-sm text-slate-500 mt-1">{viewTarget.description}</p>
              )}
            </div>

            {/* Rate */}
            <div className="flex items-baseline gap-1 p-4 bg-purple-50 rounded-xl">
              <DollarSign size={16} className="text-purple-600 self-center" />
              <span className="text-2xl font-black text-slate-900">
                ₱{parseFloat(viewTarget.serviceRate).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-slate-400">/ {RECURRING_LABEL[viewTarget.recurring].toLowerCase()}</span>
            </div>

            {/* Government Offices */}
            {viewTarget.governmentOffices.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Building2 size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Government Offices</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.governmentOffices.map((g) => (
                    <span key={g.id} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full">
                      {g.code} — {g.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cities */}
            {viewTarget.cities.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <MapPin size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cities</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.cities.map((c) => (
                    <span key={c.id} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full">
                      {c.name}{c.province ? `, ${c.province}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions */}
            {viewTarget.inclusions.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Package size={13} className="text-slate-500" />
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Plan Inclusions</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {viewTarget.inclusions.map((inc) => (
                    <span key={inc.id} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[11px] font-bold rounded-full">
                      {inc.name}{inc.category ? ` · ${inc.category}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setViewTarget(null)}
              >
                Close
              </Button>
              <Button
                className="flex-1 bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center gap-1.5"
                onClick={() => { setViewTarget(null); router.push(`/portal/sales/services/monthly/update-service-plan/${viewTarget.id}`); }}
              >
                <Pencil size={13} />
                Edit
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center justify-center gap-1.5"
                onClick={() => { setDeleteTarget(viewTarget); setViewTarget(null); }}
              >
                <Trash2 size={13} />
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service Plan" size="sm">
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete{' '}
            <span className="font-bold text-slate-900">{deleteTarget?.name}</span>?
            This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={14} className="mr-1" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}


