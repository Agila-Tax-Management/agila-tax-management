// src/components/sales/MonthlyServicePlans.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import ServicePlanModal from '@/components/UI/ServicePlanModal';
import { type ServicePlan, PLAN_DATA, MOCK_SERVICES } from '@/lib/service-data';
import {
  Plus,
  Sparkles,
  Eye,
  FileText,
  CalendarClock,
} from 'lucide-react';
import type { ServiceItem } from '@/lib/types';

export function MonthlyServicePlans(): React.ReactNode {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Service Plan Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | undefined>();

  // Add Plan Modal
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setServices([...MOCK_SERVICES]);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(() => {
    const plans = Object.values(PLAN_DATA);
    const avgPrice = plans.reduce((sum, p) => sum + parseFloat(p.price.replace(/,/g, '')), 0) / plans.length;
    return { totalPlans: plans.length, avgPrice: Math.round(avgPrice).toLocaleString() };
  }, []);

  const handleAddPlan = () => {
    if (!newPlan.name || !newPlan.price) return;
    setIsAddPlanModalOpen(false);
    setNewPlan({ name: '', price: '', description: '' });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
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
            <p className="text-lg font-black text-slate-900">₱{stats.avgPrice}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Avg Price</p>
          </div>
        </div>
      </div>

      {/* Add Plan Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setIsAddPlanModalOpen(true)}
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
            <Sparkles className="text-purple-600" size={24} />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Subscription Plans
            </h3>
          </div>
          <p className="text-xs text-slate-600 ml-9">
            Pre-configured monthly packages with comprehensive services
          </p>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(Object.values(PLAN_DATA) as typeof PLAN_DATA[ServicePlan][]).map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border-2 ${plan.bgColor} ${plan.borderColor} cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}
                onClick={() => {
                  setSelectedPlan(plan.id);
                  setPlanModalOpen(true);
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-white shadow-sm ${plan.color}`}>
                    {plan.icon}
                  </div>
                  {plan.badge && (
                    <Badge className={`text-[8px] font-black ${plan.badgeColor} border-none`}>
                      {plan.badge}
                    </Badge>
                  )}
                </div>
                <h4 className="font-black text-slate-900 text-base mb-1 group-hover:text-slate-700 transition-colors">
                  {plan.displayName}
                </h4>
                <p className="text-xs text-slate-600 mb-3 line-clamp-2">
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-lg font-bold text-slate-900">{plan.currency}</span>
                  <p className="text-3xl font-black text-slate-900">{plan.price}</p>
                  <p className="text-xs text-slate-500">/{plan.period}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <FileText size={12} />
                  <span>{plan.featuresIncluded.length} services included</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {plan.highlights.map((h, i) => (
                    <span key={i} className="text-[9px] font-bold text-slate-500 bg-white/80 px-2 py-0.5 rounded-full border border-slate-100">
                      {h}
                    </span>
                  ))}
                </div>
                <button className="w-full py-2.5 bg-white border-2 border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 group-hover:border-slate-300">
                  <Eye size={14} />
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Add Plan Modal */}
      <Modal isOpen={isAddPlanModalOpen} onClose={() => setIsAddPlanModalOpen(false)} title="Add Monthly Service Plan">
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Plan Name *</label>
            <Input
              value={newPlan.name}
              onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
              placeholder="Enter plan name"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Monthly Price (PHP) *</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={newPlan.price}
              onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
              placeholder="0.00"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Description</label>
            <Input
              value={newPlan.description}
              onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
              placeholder="Brief plan description"
              className="bg-white border-slate-200"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAddPlanModalOpen(false);
                setNewPlan({ name: '', price: '', description: '' });
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAddPlan}
              disabled={!newPlan.name || !newPlan.price}
            >
              <Plus size={14} className="mr-1" />
              Add Plan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Service Plan Detail Modal */}
      <ServicePlanModal
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setSelectedPlan(undefined);
        }}
        selectedPlan={selectedPlan}
        allServices={services}
      />
    </div>
  );
}
