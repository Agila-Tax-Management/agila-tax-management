'use client';

import React, { useState, useMemo } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import { PLAN_DATA, type ServicePlan } from '@/lib/service-data';
import type { ServiceItem } from '@/lib/types';
import {
  Check,
  X,
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Gift,
  Users,
  Star,
} from 'lucide-react';

// Re-export for consumers
export type { ServicePlan } from '@/lib/service-data';
export { PLAN_DATA } from '@/lib/service-data';

// ── Steps ────────────────────────────────────────────────────
type ModalStep = 'details' | 'customize';

// ── Props ────────────────────────────────────────────────────
interface ServicePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan?: ServicePlan;
  allServices: ServiceItem[];
}

export default function ServicePlanModal({
  isOpen,
  onClose,
  selectedPlan,
  allServices,
}: ServicePlanModalProps) {
  const [step, setStep] = useState<ModalStep>('details');

  // Customization state
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('All');

  const plan = selectedPlan ? PLAN_DATA[selectedPlan] : undefined;

  // Reset state when modal opens or plan changes
  // (React-approved "adjust state during render" pattern)
  const [prevIsOpen, setPrevIsOpen] = useState(false);
  const [prevPlan, setPrevPlan] = useState(selectedPlan);
  if (isOpen !== prevIsOpen || selectedPlan !== prevPlan) {
    setPrevIsOpen(isOpen);
    setPrevPlan(selectedPlan);
    if (isOpen) {
      setStep('details');
      setSelectedServiceIds(new Set());
      setSearchTerm('');
      setFilterTeam('All');
    }
  }

  // ── Customization Logic ─────────────────────────────────────
  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filteredServices = useMemo(() => {
    return allServices.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = filterTeam === 'All' || s.teamInCharge === filterTeam;
      return matchesSearch && matchesTeam;
    });
  }, [allServices, searchTerm, filterTeam]);

  const selectedServices = allServices.filter((s) => selectedServiceIds.has(s.id));
  const totalRate = selectedServices.reduce((sum, s) => sum + s.rate, 0);
  const hasDiscount = selectedServices.length >= 10;
  const discountedTotal = hasDiscount ? totalRate * 0.9 : totalRate;
  const teams = ['All', ...Array.from(new Set(allServices.map((s) => s.teamInCharge)))];

  const handleConfirm = () => {
    /** BACKEND HOOK: POST /api/subscriptions — create subscription with selectedServiceIds */
    alert(
      `Mock subscription created!\n\nPlan: ${plan?.displayName}\nServices: ${selectedServices.length}\nTotal: ₱${discountedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}${hasDiscount ? ' (10% volume discount applied)' : ''}`
    );
    onClose();
  };

  if (!plan) return null;

  const title = step === 'details' ? plan.name : 'Customize Your Plan';
  const size = step === 'details' ? ('lg' as const) : ('2xl' as const);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size={size}>
      <div className="overflow-y-auto max-h-[75vh]">
        {/* ── Step 1: Plan Details ──────────────────────────────── */}
        {step === 'details' && (
          <>
            {/* Plan Header */}
            <div className={`p-6 ${plan.bgColor} border-b border-slate-100`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl bg-white shadow-sm ${plan.color}`}>
                    {plan.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{plan.name}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">{plan.description}</p>
                  </div>
                </div>
                {plan.badge && (
                  <Badge className={`text-[9px] font-black ${plan.badgeColor} border-none`}>
                    {plan.badge}
                  </Badge>
                )}
              </div>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-slate-900">{plan.currency}</span>
                <span className="text-4xl font-black text-slate-900">{plan.price}</span>
                <span className="text-sm text-slate-500 ml-1">/{plan.period}</span>
              </div>

              {/* Highlights */}
              <div className="mt-3 flex flex-wrap gap-2">
                {plan.highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-white/70 px-2 py-1 rounded-full">
                    <Star size={10} className={plan.color} />
                    {h}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Features Included */}
              <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                  What&apos;s Included
                </h4>
                <ul className="space-y-2.5">
                  {plan.featuresIncluded.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      {feature.startsWith('Everything') ? (
                        <>
                          <ArrowRight size={16} className="text-purple-500 mt-0.5 shrink-0" />
                          <span className="text-sm font-bold text-purple-700">{feature}</span>
                        </>
                      ) : (
                        <>
                          <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-slate-700">{feature}</span>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Additional Services (featuresMore) */}
              {plan.featuresMore && plan.featuresMore.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-purple-500 uppercase tracking-widest mb-3">
                    <Plus size={12} className="inline mr-1" />
                    Also Included
                  </h4>
                  <ul className="space-y-2.5">
                    {plan.featuresMore.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check size={16} className="text-purple-500 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Features Not Included */}
              {plan.featuresNotIncluded.length > 0 && (
                <div>
                  <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest mb-3">
                    Not Included
                  </h4>
                  <ul className="space-y-2.5">
                    {plan.featuresNotIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <X size={16} className="text-slate-300 mt-0.5 shrink-0" />
                        <span className="text-sm text-slate-400">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Designed For */}
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Users size={12} />
                  Designed For
                </h4>
                <ul className="space-y-2">
                  {plan.designedFor.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="text-slate-300 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Freebies */}
              <div className="bg-emerald-50 rounded-xl p-4">
                <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <Gift size={12} />
                  Freebies
                </h4>
                <ul className="space-y-2">
                  {plan.freebies.map((freebie, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Gift size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                      <span className="text-sm text-emerald-800">{freebie}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => setStep('customize')}
              >
                Customize & Subscribe
                <ArrowRight size={16} className="ml-1" />
              </Button>
            </div>
          </>
        )}

        {/* ── Step 2: Customize Plan ───────────────────────────── */}
        {step === 'customize' && (
          <>
            {/* Plan Banner */}
            <div className={`px-6 py-4 ${plan.bgColor} border-b border-slate-100 flex items-center gap-3`}>
              <div className={`p-2 rounded-lg bg-white shadow-sm ${plan.color}`}>
                {plan.icon}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Customizing</p>
                <h3 className="text-base font-black text-slate-900">{plan.displayName}</h3>
              </div>
              {plan.badge && (
                <Badge className={`ml-auto text-[9px] font-black ${plan.badgeColor} border-none`}>
                  {plan.badge}
                </Badge>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    className="pl-10 bg-slate-50 border-slate-200 text-sm"
                    placeholder="Search services..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  className="h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm font-medium text-slate-800"
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t} value={t}>
                      {t === 'All' ? 'All Teams' : t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Services List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => {
                      const isSelected = selectedServiceIds.has(service.id);
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'bg-white hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                              isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}
                          >
                            {isSelected && <Check size={12} className="text-white" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">
                              {service.name}
                            </p>
                            <div className="flex gap-2 mt-0.5">
                              <span className="text-[10px] text-slate-400">{service.teamInCharge}</span>
                              <span className="text-[10px] text-slate-300">&bull;</span>
                              <span className="text-[10px] text-slate-400">{service.government}</span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-800 shrink-0">
                            ₱{service.rate.toLocaleString('en-PH')}
                          </span>
                          {isSelected ? (
                            <Minus size={14} className="text-rose-400 shrink-0" />
                          ) : (
                            <Plus size={14} className="text-slate-300 shrink-0" />
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center text-sm text-slate-400 italic">
                      No services match your search.
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Summary */}
              <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-slate-500" />
                    <span className="text-sm font-bold text-slate-700">
                      {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  {hasDiscount && (
                    <div className="flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-amber-600">10% VOLUME DISCOUNT</span>
                    </div>
                  )}
                </div>

                <div className="flex items-baseline justify-between border-t border-slate-200 pt-3">
                  <span className="text-xs text-slate-500">
                    {hasDiscount ? 'Discounted Monthly Total' : 'Monthly Total'}
                  </span>
                  <div className="text-right">
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through mr-2">
                        ₱{totalRate.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="text-xl font-black text-slate-900">
                      ₱{discountedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')}>
                <ArrowLeft size={16} className="mr-1" />
                Back
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={handleConfirm}
                disabled={selectedServices.length === 0}
              >
                Confirm Subscription
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
