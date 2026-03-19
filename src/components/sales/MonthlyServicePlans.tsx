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
  Check,
  X,
} from 'lucide-react';
import type { ServiceItem } from '@/lib/types';

const INITIAL_NEW_PLAN = {
  name: '',
  displayName: '',
  price: '',
  description: '',
  badge: '',
  currency: '₱',
  period: 'month',
  includedServiceIds: [] as string[],
  notIncludedServiceIds: [] as string[],
  customIncludedServices: [] as string[],
  customNotIncludedServices: [] as string[],
  highlights: [] as string[],
  designedFor: [] as string[],
  freebies: [] as string[],
};

const INITIAL_LIST_DRAFTS = {
  highlights: '',
  designedFor: '',
  freebies: '',
  customIncluded: '',
  customNotIncluded: '',
};

type ListFieldKey = keyof typeof INITIAL_LIST_DRAFTS;
type PlanListFieldKey = 'highlights' | 'designedFor' | 'freebies';

export function MonthlyServicePlans(): React.ReactNode {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Service Plan Modal
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ServicePlan | undefined>();

  // Add Plan Modal
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [newPlan, setNewPlan] = useState(INITIAL_NEW_PLAN);
  const [listDrafts, setListDrafts] = useState(INITIAL_LIST_DRAFTS);

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
    if (!newPlan.name || !newPlan.displayName || !newPlan.price || !newPlan.description) return;
    setIsAddPlanModalOpen(false);
    setNewPlan(INITIAL_NEW_PLAN);
    setListDrafts(INITIAL_LIST_DRAFTS);
  };

  const addListItem = (key: PlanListFieldKey) => {
    const value = listDrafts[key].trim();
    if (!value) return;

    setNewPlan((prev) => ({
      ...prev,
      [key]: prev[key].includes(value) ? prev[key] : [...prev[key], value],
    }));

    setListDrafts((prev) => ({ ...prev, [key]: '' }));
  };

  const removeListItem = (key: PlanListFieldKey, value: string) => {
    setNewPlan((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item !== value),
    }));
  };

  const filteredCatalogServices = useMemo(() => {
    return services;
  }, [services]);

  const includeService = (serviceId: string) => {
    setNewPlan((prev) => ({
      ...prev,
      includedServiceIds: prev.includedServiceIds.includes(serviceId)
        ? prev.includedServiceIds
        : [...prev.includedServiceIds, serviceId],
      notIncludedServiceIds: prev.notIncludedServiceIds.filter((id) => id !== serviceId),
    }));
  };

  const excludeService = (serviceId: string) => {
    setNewPlan((prev) => ({
      ...prev,
      notIncludedServiceIds: prev.notIncludedServiceIds.includes(serviceId)
        ? prev.notIncludedServiceIds
        : [...prev.notIncludedServiceIds, serviceId],
      includedServiceIds: prev.includedServiceIds.filter((id) => id !== serviceId),
    }));
  };

  const clearServiceSelection = (serviceId: string) => {
    setNewPlan((prev) => ({
      ...prev,
      includedServiceIds: prev.includedServiceIds.filter((id) => id !== serviceId),
      notIncludedServiceIds: prev.notIncludedServiceIds.filter((id) => id !== serviceId),
    }));
  };

  const includedServices = useMemo(
    () => services.filter((service) => newPlan.includedServiceIds.includes(service.id)),
    [newPlan.includedServiceIds, services],
  );

  const notIncludedServices = useMemo(
    () => services.filter((service) => newPlan.notIncludedServiceIds.includes(service.id)),
    [newPlan.notIncludedServiceIds, services],
  );

  const addCustomService = (type: 'included' | 'not-included') => {
    if (type === 'included') {
      const value = listDrafts.customIncluded.trim();
      if (!value) return;

      setNewPlan((prev) => ({
        ...prev,
        customIncludedServices: prev.customIncludedServices.includes(value)
          ? prev.customIncludedServices
          : [...prev.customIncludedServices, value],
        customNotIncludedServices: prev.customNotIncludedServices.filter((item) => item !== value),
      }));

      setListDrafts((prev) => ({ ...prev, customIncluded: '' }));
      return;
    }

    const value = listDrafts.customNotIncluded.trim();
    if (!value) return;

    setNewPlan((prev) => ({
      ...prev,
      customNotIncludedServices: prev.customNotIncludedServices.includes(value)
        ? prev.customNotIncludedServices
        : [...prev.customNotIncludedServices, value],
      customIncludedServices: prev.customIncludedServices.filter((item) => item !== value),
    }));

    setListDrafts((prev) => ({ ...prev, customNotIncluded: '' }));
  };

  const removeCustomService = (type: 'included' | 'not-included', value: string) => {
    if (type === 'included') {
      setNewPlan((prev) => ({
        ...prev,
        customIncludedServices: prev.customIncludedServices.filter((item) => item !== value),
      }));
      return;
    }

    setNewPlan((prev) => ({
      ...prev,
      customNotIncludedServices: prev.customNotIncludedServices.filter((item) => item !== value),
    }));
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
      <Modal isOpen={isAddPlanModalOpen} onClose={() => setIsAddPlanModalOpen(false)} title="Add Monthly Service Plan" size="2xl">
        <div className="space-y-6 p-6 max-h-[72vh] overflow-y-auto app-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Plan Name *</label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="Agila Starter Plan"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Display Name *</label>
              <Input
                value={newPlan.displayName}
                onChange={(e) => setNewPlan({ ...newPlan, displayName: e.target.value })}
                placeholder="Starter"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Badge</label>
              <Input
                value={newPlan.badge}
                onChange={(e) => setNewPlan({ ...newPlan, badge: e.target.value })}
                placeholder="Best for Micro Businesses"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={newPlan.price}
                onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })}
                placeholder="1500"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Period</label>
              <Input
                value={newPlan.period}
                onChange={(e) => setNewPlan({ ...newPlan, period: e.target.value })}
                placeholder="month"
                className="bg-white border-slate-200"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Description *</label>
              <Input
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                placeholder="Compliance made simple and stress-free for business owners."
                className="bg-white border-slate-200"
              />
            </div>
          </div>

          <div className="space-y-4">
            {(
              [
                { key: 'highlights', label: 'Highlights', placeholder: 'Perfect for startups' },
                { key: 'designedFor', label: 'Designed For', placeholder: 'Micro to Small Businesses' },
                { key: 'freebies', label: 'Freebies', placeholder: 'Free Compliance Checklist' },
              ] as { key: PlanListFieldKey; label: string; placeholder: string }[]
            ).map((section) => (
              <div key={section.key} className="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">{section.label}</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={listDrafts[section.key]}
                    onChange={(e) => setListDrafts((prev) => ({ ...prev, [section.key]: e.target.value }))}
                    placeholder={section.placeholder}
                    className="bg-white border-slate-200"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addListItem(section.key);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    className="bg-slate-800 hover:bg-slate-900 text-white"
                    onClick={() => addListItem(section.key)}
                  >
                    <Plus size={14} />
                  </Button>
                </div>

                {newPlan[section.key].length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {newPlan[section.key].map((item) => (
                      <span key={item} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[11px] font-semibold text-slate-700">
                        {item}
                        <button
                          type="button"
                          className="text-slate-400 hover:text-rose-500"
                          onClick={() => removeListItem(section.key, item)}
                          aria-label={`Remove ${item}`}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 p-4 bg-white space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Service Coverage Setup</p>
              <p className="text-[11px] text-slate-500 mt-1">Choose one-time services to be marked as Included or Not Included for this monthly plan.</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50/70">
                <div className="px-3 py-2 border-b border-slate-200">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Service Catalog ({filteredCatalogServices.length})
                  </p>
                </div>
                <div className="max-h-72 overflow-y-auto app-scrollbar divide-y divide-slate-100">
                  {filteredCatalogServices.map((service) => {
                    const isIncluded = newPlan.includedServiceIds.includes(service.id);
                    const isExcluded = newPlan.notIncludedServiceIds.includes(service.id);

                    return (
                      <div key={service.id} className="px-3 py-2.5 bg-white">
                        <div className={`flex flex-col xl:flex-row xl:items-center xl:justify-between gap-2 rounded-lg p-2 transition-colors ${
                          isIncluded ? 'bg-emerald-50 border border-emerald-200' : isExcluded ? 'bg-rose-50 border border-rose-200' : 'bg-white border border-transparent'
                        }`}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {isIncluded ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-600 text-white">
                                  <Check size={10} />
                                </span>
                              ) : isExcluded ? (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-600 text-white">
                                  <X size={10} />
                                </span>
                              ) : (
                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-slate-300" />
                              )}

                              <p className="text-xs font-bold text-slate-800">{service.name}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">{service.teamInCharge} • {service.government}</p>

                            {(isIncluded || isExcluded) && (
                              <p className={`text-[10px] font-bold mt-1 ${isIncluded ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {isIncluded ? 'Included in plan' : 'Marked as not included'}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              className={`h-7 px-2.5 text-[10px] ${isIncluded ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                              onClick={() => includeService(service.id)}
                            >
                              Include
                            </Button>
                            <Button
                              type="button"
                              className={`h-7 px-2.5 text-[10px] ${isExcluded ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
                              onClick={() => excludeService(service.id)}
                            >
                              Not Included
                            </Button>
                            {(isIncluded || isExcluded) && (
                              <Button
                                type="button"
                                variant="outline"
                                className="h-7 px-2.5 text-[10px]"
                                onClick={() => clearServiceSelection(service.id)}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {filteredCatalogServices.length === 0 && (
                    <div className="p-4 text-xs text-center text-slate-500">No services available.</div>
                  )}
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1 mb-2">
                  Coverage Summary
                </p>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">
                      Included ({includedServices.length})
                    </p>
                    <div className="max-h-28 overflow-y-auto app-scrollbar space-y-1">
                      {includedServices.length > 0 ? includedServices.map((service) => (
                        <p key={service.id} className="text-[11px] text-emerald-900">• {service.name}</p>
                      )) : <p className="text-[11px] text-emerald-700/80">No included services selected yet.</p>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-emerald-200/70">
                      <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Custom Included Service</p>
                      <div className="flex gap-2">
                        <Input
                          value={listDrafts.customIncluded}
                          onChange={(e) => setListDrafts((prev) => ({ ...prev, customIncluded: e.target.value }))}
                          placeholder="Enter custom included service"
                          className="bg-white border-emerald-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService('included');
                            }
                          }}
                        />
                        <Button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => addCustomService('included')}>
                          <Plus size={13} />
                        </Button>
                      </div>

                      {newPlan.customIncludedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newPlan.customIncludedServices.map((service) => (
                            <span key={service} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-emerald-200 text-[10px] font-semibold text-emerald-800">
                              {service}
                              <button type="button" className="text-emerald-500 hover:text-rose-500" onClick={() => removeCustomService('included', service)}>
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-3">
                    <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider mb-2">
                      Not Included ({notIncludedServices.length})
                    </p>
                    <div className="max-h-28 overflow-y-auto app-scrollbar space-y-1">
                      {notIncludedServices.length > 0 ? notIncludedServices.map((service) => (
                        <p key={service.id} className="text-[11px] text-rose-900">• {service.name}</p>
                      )) : <p className="text-[11px] text-rose-700/80">No excluded services selected yet.</p>}
                    </div>

                    <div className="mt-3 pt-3 border-t border-rose-200/70">
                      <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-2">Custom Not Included Service</p>
                      <div className="flex gap-2">
                        <Input
                          value={listDrafts.customNotIncluded}
                          onChange={(e) => setListDrafts((prev) => ({ ...prev, customNotIncluded: e.target.value }))}
                          placeholder="Enter custom not included service"
                          className="bg-white border-rose-200"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService('not-included');
                            }
                          }}
                        />
                        <Button type="button" className="bg-rose-600 hover:bg-rose-700 text-white" onClick={() => addCustomService('not-included')}>
                          <Plus size={13} />
                        </Button>
                      </div>

                      {newPlan.customNotIncludedServices.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newPlan.customNotIncludedServices.map((service) => (
                            <span key={service} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white border border-rose-200 text-[10px] font-semibold text-rose-800">
                              {service}
                              <button type="button" className="text-rose-500 hover:text-slate-500" onClick={() => removeCustomService('not-included', service)}>
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-purple-200 bg-linear-to-r from-purple-50 to-blue-50 p-4">
            <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-2">Preview Summary</p>
            <h4 className="text-lg font-black text-slate-900">{newPlan.name || 'Plan Name'}</h4>
            <p className="text-xs text-slate-500">{newPlan.displayName || 'Display name'} {newPlan.badge ? `• ${newPlan.badge}` : ''}</p>
            <p className="mt-2 text-sm text-slate-700">{newPlan.description || 'Plan description preview appears here.'}</p>
            <div className="mt-3 flex items-center gap-2 text-slate-900">
              <span className="text-sm font-bold">{newPlan.currency}</span>
              <span className="text-2xl font-black">{newPlan.price || '0'}</span>
              <span className="text-xs text-slate-500">/{newPlan.period || 'month'}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
              <p>Highlights: <span className="font-bold text-slate-800">{newPlan.highlights.length}</span></p>
              <p>Included: <span className="font-bold text-slate-800">{includedServices.length + newPlan.customIncludedServices.length}</span></p>
              <p>Not Included: <span className="font-bold text-slate-800">{notIncludedServices.length + newPlan.customNotIncludedServices.length}</span></p>
              <p>Designed For: <span className="font-bold text-slate-800">{newPlan.designedFor.length}</span></p>
              <p>Freebies: <span className="font-bold text-slate-800">{newPlan.freebies.length}</span></p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsAddPlanModalOpen(false);
                setNewPlan(INITIAL_NEW_PLAN);
                setListDrafts(INITIAL_LIST_DRAFTS);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={handleAddPlan}
              disabled={!newPlan.name || !newPlan.displayName || !newPlan.price || !newPlan.description}
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
