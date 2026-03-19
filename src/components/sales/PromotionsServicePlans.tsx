'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { useToast } from '@/context/ToastContext';
import {
  BadgePercent,
  Gift,
  Megaphone,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Tag,
} from 'lucide-react';

type PromotionTab = 'discounted-services' | 'promo-bundles';

interface PromotionOffering {
  id: string;
  name: string;
  category: 'One-Time Service' | 'Monthly Plan';
  teamLabel: string;
  rate: number;
}

interface DiscountedService {
  id: string;
  serviceId: string;
  serviceName: string;
  category: PromotionOffering['category'];
  teamInCharge: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  validUntil: string;
  notes: string;
  status: 'Draft' | 'Active';
}

interface PromoBundle {
  id: string;
  name: string;
  headline: string;
  servicesIncluded: string[];
  categoriesIncluded: PromotionOffering['category'][];
  originalPrice: number;
  promoPrice: number;
  validUntil: string;
  audience: string;
  status: 'Draft' | 'Active';
}

interface PromoApiItem {
  id: number;
  name: string;
  description: string | null;
  promoFor: 'SERVICE_PLAN' | 'SERVICE_ONE_TIME' | 'BOTH';
  discountType: 'PERCENTAGE' | 'FIXED';
  discountRate: string;
  isActive: boolean;
  validUntil: string | null;
  servicePlans: { id: number; name: string; serviceRate: string; recurring: string }[];
  serviceOneTimePlans: { id: number; name: string; serviceRate: string }[];
}



export function PromotionsServicePlans(): React.ReactNode {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<PromotionTab>('discounted-services');
  const [discountedServices, setDiscountedServices] = useState<DiscountedService[]>([]);
  const [promoBundles, setPromoBundles] = useState<PromoBundle[]>([]);
  const [discountSearchTerm, setDiscountSearchTerm] = useState('');
  const [discountStatusFilter, setDiscountStatusFilter] = useState<'All' | DiscountedService['status']>('All');
  const [discountCategoryFilter, setDiscountCategoryFilter] = useState<'All' | PromotionOffering['category']>('All');
  const [bundleSearchTerm, setBundleSearchTerm] = useState('');
  const [bundleStatusFilter, setBundleStatusFilter] = useState<'All' | PromoBundle['status']>('All');
  const [bundleCategoryFilter, setBundleCategoryFilter] = useState<'All' | PromotionOffering['category']>('All');
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const { success, error } = useToast();

  const [offeringApiPlans, setOfferingApiPlans] = useState<{ id: number; name: string; serviceRate: string }[]>([]);
  const [offeringApiOneTime, setOfferingApiOneTime] = useState<{ id: number; name: string; serviceRate: string }[]>([]);

  const [discountForm, setDiscountForm] = useState({
    serviceId: '',
    discountType: 'percentage' as DiscountedService['discountType'],
    discountValue: '',
    validUntil: '',
    notes: '',
  });

  const [promoForm, setPromoForm] = useState({
    name: '',
    headline: '',
    serviceIds: [] as string[],
    promoPrice: '',
    validUntil: '',
    audience: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/promos').then((r) => r.json()),
      fetch('/api/sales/service-plans').then((r) => r.json()),
      fetch('/api/sales/service-one-time').then((r) => r.json()),
    ])
      .then(([promosData, plansData, oneTimeData]) => {
        const promos: PromoApiItem[] = (promosData as { data?: PromoApiItem[] }).data ?? [];
        const plans = (plansData as { data?: { id: number; name: string; serviceRate: string }[] }).data ?? [];
        const oneTime = (oneTimeData as { data?: { id: number; name: string; serviceRate: string }[] }).data ?? [];

        setOfferingApiPlans(plans);
        setOfferingApiOneTime(oneTime);

        const discounted: DiscountedService[] = [];
        const bundles: PromoBundle[] = [];

        for (const promo of promos) {
          const total = promo.servicePlans.length + promo.serviceOneTimePlans.length;
          if (total <= 1) {
            const allSvcs = [...promo.servicePlans, ...promo.serviceOneTimePlans];
            const firstSvc = allSvcs[0];
            const isPlan = promo.servicePlans.length > 0;
            const origPrice = firstSvc ? parseFloat(firstSvc.serviceRate) : 0;
            const discValue = parseFloat(promo.discountRate);
            const discPrice =
              promo.discountType === 'PERCENTAGE'
                ? Math.max(Math.round(origPrice * (1 - discValue / 100)), 0)
                : Math.max(origPrice - discValue, 0);
            discounted.push({
              id: String(promo.id),
              serviceId: firstSvc ? (isPlan ? `plan-${firstSvc.id}` : `svc-${firstSvc.id}`) : '',
              serviceName: firstSvc?.name ?? promo.name,
              category: isPlan ? 'Monthly Plan' : 'One-Time Service',
              teamInCharge: isPlan ? 'Monthly Plan' : 'One-Time Service',
              discountType: promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              discountValue: discValue,
              originalPrice: origPrice,
              discountedPrice: discPrice,
              validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
              notes: promo.description ?? '',
              status: promo.isActive ? 'Active' : 'Draft',
            });
          } else {
            const allNames = [
              ...promo.servicePlans.map((s) => s.name),
              ...promo.serviceOneTimePlans.map((s) => s.name),
            ];
            const origPrice = [...promo.servicePlans, ...promo.serviceOneTimePlans].reduce(
              (sum, s) => sum + parseFloat(s.serviceRate),
              0,
            );
            const discAmount =
              promo.discountType === 'FIXED'
                ? parseFloat(promo.discountRate)
                : Math.round((origPrice * parseFloat(promo.discountRate)) / 100);
            const promoPrice = Math.max(origPrice - discAmount, 0);
            const cats: PromotionOffering['category'][] = [];
            if (promo.servicePlans.length > 0) cats.push('Monthly Plan');
            if (promo.serviceOneTimePlans.length > 0) cats.push('One-Time Service');
            bundles.push({
              id: String(promo.id),
              name: promo.name,
              headline: promo.description ?? '',
              servicesIncluded: allNames,
              categoriesIncluded: cats,
              originalPrice: origPrice,
              promoPrice,
              validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
              audience: 'General sales campaign',
              status: promo.isActive ? 'Active' : 'Draft',
            });
          }
        }

        setDiscountedServices(discounted);
        setPromoBundles(bundles);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  const offeringOptions = useMemo<PromotionOffering[]>(() => {
    const monthlyPlanOptions = offeringApiPlans.map((p) => ({
      id: `plan-${p.id}`,
      name: p.name,
      category: 'Monthly Plan' as const,
      teamLabel: 'Monthly Plan',
      rate: parseFloat(p.serviceRate),
    }));
    const oneTimeOptions = offeringApiOneTime.map((s) => ({
      id: `svc-${s.id}`,
      name: s.name,
      category: 'One-Time Service' as const,
      teamLabel: 'One-Time Service',
      rate: parseFloat(s.serviceRate),
    }));
    return [...monthlyPlanOptions, ...oneTimeOptions];
  }, [offeringApiPlans, offeringApiOneTime]);

  const stats = useMemo(() => {
    const activeDiscounts = discountedServices.filter((item) => item.status === 'Active').length;
    const activeBundles = promoBundles.filter((item) => item.status === 'Active').length;
    const totalSavings = promoBundles.reduce(
      (sum, item) => sum + Math.max(item.originalPrice - item.promoPrice, 0),
      0,
    );

    return {
      activeDiscounts,
      activeBundles,
      totalCampaigns: discountedServices.length + promoBundles.length,
      totalSavings,
    };
  }, [discountedServices, promoBundles]);

  const selectedDiscountOffering = offeringOptions.find((offering) => offering.id === discountForm.serviceId);

  const discountPreview = useMemo(() => {
    if (!selectedDiscountOffering || !discountForm.discountValue) return null;

    const value = Number(discountForm.discountValue);
    if (Number.isNaN(value) || value <= 0) return null;

    const originalPrice = selectedDiscountOffering.rate;
    const discountedPrice =
      discountForm.discountType === 'percentage'
        ? Math.max(Math.round(originalPrice * (1 - value / 100)), 0)
        : Math.max(originalPrice - value, 0);

    return {
      originalPrice,
      discountedPrice,
    };
  }, [discountForm.discountType, discountForm.discountValue, selectedDiscountOffering]);

  const promoPreview = useMemo(() => {
    if (promoForm.serviceIds.length === 0) return null;

    const includedServices = offeringOptions.filter((service) => promoForm.serviceIds.includes(service.id));
    const originalPrice = includedServices.reduce((sum, service) => sum + service.rate, 0);
    const promoPrice = Number(promoForm.promoPrice);

    return {
      includedServices,
      originalPrice,
      promoPrice: Number.isNaN(promoPrice) ? 0 : promoPrice,
    };
  }, [offeringOptions, promoForm.promoPrice, promoForm.serviceIds]);

  const filteredDiscountedServices = useMemo(() => {
    return discountedServices.filter((promotion) => {
      const matchesSearch =
        promotion.serviceName.toLowerCase().includes(discountSearchTerm.toLowerCase()) ||
        promotion.teamInCharge.toLowerCase().includes(discountSearchTerm.toLowerCase()) ||
        promotion.notes.toLowerCase().includes(discountSearchTerm.toLowerCase());
      const matchesStatus = discountStatusFilter === 'All' || promotion.status === discountStatusFilter;
      const matchesCategory = discountCategoryFilter === 'All' || promotion.category === discountCategoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [discountCategoryFilter, discountSearchTerm, discountStatusFilter, discountedServices]);

  const filteredPromoBundles = useMemo(() => {
    return promoBundles.filter((bundle) => {
      const matchesSearch =
        bundle.name.toLowerCase().includes(bundleSearchTerm.toLowerCase()) ||
        bundle.audience.toLowerCase().includes(bundleSearchTerm.toLowerCase()) ||
        bundle.headline.toLowerCase().includes(bundleSearchTerm.toLowerCase()) ||
        bundle.servicesIncluded.some((service) => service.toLowerCase().includes(bundleSearchTerm.toLowerCase()));
      const matchesStatus = bundleStatusFilter === 'All' || bundle.status === bundleStatusFilter;
      const matchesCategory =
        bundleCategoryFilter === 'All' || bundle.categoriesIncluded.includes(bundleCategoryFilter);

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [bundleCategoryFilter, bundleSearchTerm, bundleStatusFilter, promoBundles]);

  const handleAddDiscountedService = async () => {
    if (!selectedDiscountOffering || !discountPreview || !discountForm.validUntil) {
      error('Missing promotion details', 'Choose a monthly plan or service, enter a discount, and set a validity date.');
      return;
    }

    const isPlan = selectedDiscountOffering.id.startsWith('plan-');
    const numericId = parseInt(selectedDiscountOffering.id.replace(/^(plan|svc)-/, ''), 10);
    const discountLabel =
      discountForm.discountType === 'percentage'
        ? `${discountForm.discountValue}% off`
        : `₱${Number(discountForm.discountValue).toLocaleString()} off`;

    try {
      const res = await fetch('/api/sales/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${selectedDiscountOffering.name} — ${discountLabel}`,
          description: discountForm.notes.trim() || undefined,
          discountType: discountForm.discountType.toUpperCase(),
          discountRate: Number(discountForm.discountValue),
          validUntil: `${discountForm.validUntil}T23:59:59.000Z`,
          servicePlanIds: isPlan ? [numericId] : [],
          serviceOneTimePlanIds: isPlan ? [] : [numericId],
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to add discount', data.error ?? 'An error occurred.');
        return;
      }
      const promo = data.data!;
      const allSvcs = [...promo.servicePlans, ...promo.serviceOneTimePlans];
      const firstSvc = allSvcs[0];
      const origPrice = firstSvc ? parseFloat(firstSvc.serviceRate) : 0;
      const discValue = parseFloat(promo.discountRate);
      const discPrice =
        promo.discountType === 'PERCENTAGE'
          ? Math.max(Math.round(origPrice * (1 - discValue / 100)), 0)
          : Math.max(origPrice - discValue, 0);
      const created: DiscountedService = {
        id: String(promo.id),
        serviceId: selectedDiscountOffering.id,
        serviceName: firstSvc?.name ?? promo.name,
        category: selectedDiscountOffering.category,
        teamInCharge: selectedDiscountOffering.category,
        discountType: promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
        discountValue: discValue,
        originalPrice: origPrice,
        discountedPrice: discPrice,
        validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : discountForm.validUntil,
        notes: promo.description ?? '',
        status: promo.isActive ? 'Active' : 'Draft',
      };
      setDiscountedServices((prev) => [created, ...prev]);
      setIsDiscountModalOpen(false);
      setDiscountForm({ serviceId: '', discountType: 'percentage', discountValue: '', validUntil: '', notes: '' });
      success('Discounted offer added', 'The discounted offer is now listed under active campaigns.');
    } catch {
      error('Failed to add discount', 'An unexpected error occurred.');
    }
  };

  const handleCreatePromoBundle = async () => {
    if (!promoForm.name || promoForm.serviceIds.length === 0 || !promoForm.promoPrice || !promoForm.validUntil) {
      error('Incomplete promo bundle', 'Add a promo name, choose plans or services, set the promo price, and pick an expiry date.');
      return;
    }

    const planIds = promoForm.serviceIds
      .filter((id) => id.startsWith('plan-'))
      .map((id) => parseInt(id.replace('plan-', ''), 10));
    const oneTimeIds = promoForm.serviceIds
      .filter((id) => id.startsWith('svc-'))
      .map((id) => parseInt(id.replace('svc-', ''), 10));

    const includedServices = offeringOptions.filter((s) => promoForm.serviceIds.includes(s.id));
    const originalPrice = includedServices.reduce((sum, s) => sum + s.rate, 0);
    const promoPrice = Number(promoForm.promoPrice);
    const discountAmount = Math.max(originalPrice - promoPrice, 0);

    try {
      const res = await fetch('/api/sales/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promoForm.name,
          description: promoForm.headline.trim() || undefined,
          discountType: 'FIXED',
          discountRate: discountAmount,
          validUntil: `${promoForm.validUntil}T23:59:59.000Z`,
          servicePlanIds: planIds,
          serviceOneTimePlanIds: oneTimeIds,
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to create promo', data.error ?? 'An error occurred.');
        return;
      }
      const promo = data.data!;
      const allNames = [
        ...promo.servicePlans.map((s) => s.name),
        ...promo.serviceOneTimePlans.map((s) => s.name),
      ];
      const cats: PromotionOffering['category'][] = [];
      if (promo.servicePlans.length > 0) cats.push('Monthly Plan');
      if (promo.serviceOneTimePlans.length > 0) cats.push('One-Time Service');
      const created: PromoBundle = {
        id: String(promo.id),
        name: promo.name,
        headline: promo.description ?? promoForm.headline,
        servicesIncluded: allNames,
        categoriesIncluded: cats,
        originalPrice,
        promoPrice,
        validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : promoForm.validUntil,
        audience: promoForm.audience || 'General sales campaign',
        status: promo.isActive ? 'Active' : 'Draft',
      };
      setPromoBundles((prev) => [created, ...prev]);
      setIsPromoModalOpen(false);
      setPromoForm({ name: '', headline: '', serviceIds: [], promoPrice: '', validUntil: '', audience: '' });
      success('Promo bundle created', 'The bundle can now mix monthly plans and one-time services for client pitching.');
    } catch {
      error('Failed to create promo', 'An unexpected error occurred.');
    }
  };

  const handleActivateDiscount = async (promotionId: string) => {
    const res = await fetch(`/api/sales/promos/${promotionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    }).catch(() => null);
    if (res?.ok) {
      setDiscountedServices((prev) =>
        prev.map((p) => (p.id === promotionId ? { ...p, status: 'Active' } : p)),
      );
      success('Discount activated', 'The drafted discount is now active and visible in the campaign list.');
    } else {
      error('Activation failed', 'Could not activate the discount. Please try again.');
    }
  };

  const handleEndDiscount = async (promotionId: string) => {
    const res = await fetch(`/api/sales/promos/${promotionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    }).catch(() => null);
    if (res?.ok) {
      setDiscountedServices((prev) =>
        prev.map((p) => (p.id === promotionId ? { ...p, status: 'Draft' } : p)),
      );
      success('Discount ended', 'The active discount was ended and moved back to draft status.');
    } else {
      error('Action failed', 'Could not end the discount. Please try again.');
    }
  };

  const handleActivateBundle = async (bundleId: string) => {
    const res = await fetch(`/api/sales/promos/${bundleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: true }),
    }).catch(() => null);
    if (res?.ok) {
      setPromoBundles((prev) =>
        prev.map((b) => (b.id === bundleId ? { ...b, status: 'Active' } : b)),
      );
      success('Promo bundle activated', 'The drafted promo bundle is now active and ready for use.');
    } else {
      error('Activation failed', 'Could not activate the bundle. Please try again.');
    }
  };

  const handleEndBundle = async (bundleId: string) => {
    const res = await fetch(`/api/sales/promos/${bundleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    }).catch(() => null);
    if (res?.ok) {
      setPromoBundles((prev) =>
        prev.map((b) => (b.id === bundleId ? { ...b, status: 'Draft' } : b)),
      );
      success('Promo bundle ended', 'The active promo bundle was ended and moved back to draft status.');
    } else {
      error('Action failed', 'Could not end the bundle. Please try again.');
    }
  };

  const togglePromoService = (serviceId: string) => {
    setPromoForm((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 font-medium">Loading promotions workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 shadow-sm">
            <Megaphone size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
              Promotions
            </h2>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl">
              Workspace for Sales and Admin to add discounted one-time services,<br/>monthly plans, and bundled promos.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full xl:w-auto">
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-lg font-black text-slate-900">{stats.activeDiscounts}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active Discounts</p>
          </div>
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-lg font-black text-slate-900">{stats.activeBundles}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Active Bundles</p>
          </div>
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-lg font-black text-slate-900">{stats.totalCampaigns}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Campaigns</p>
          </div>
          <div className="px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="text-lg font-black text-slate-900">₱{stats.totalSavings.toLocaleString()}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Bundle Savings</p>
          </div>
        </div>
      </div>

      <Card className="border-slate-200 shadow-lg overflow-visible">
        <div className="p-6 border-b border-slate-100 bg-linear-to-r from-amber-50 via-white to-rose-50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-amber-600" size={22} />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                Campaign Builder
              </h3>
            </div>
            <p className="text-xs text-slate-600 lg:ml-9">
              Switch between discounted offers and bundled promos, then publish offers that combine <br/> recurring plans with one-time services.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('discounted-services')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'discounted-services'
                    ? 'bg-white text-amber-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Discounted Services
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('promo-bundles')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === 'promo-bundles'
                    ? 'bg-white text-rose-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Promo Bundles
              </button>
            </div>

            {activeTab === 'discounted-services' ? (
              <Button
                onClick={() => setIsDiscountModalOpen(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-4 py-2"
              >
                <Plus size={14} className="mr-1" />
                Add Discounted Offer
              </Button>
            ) : (
              <Button
                onClick={() => setIsPromoModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold px-4 py-2"
              >
                <PackagePlus size={14} className="mr-1" />
                Create Promo
              </Button>
            )}
          </div>
        </div>

        <div className="p-6 lg:p-8">
          {activeTab === 'discounted-services' ? (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    className="pl-10 bg-white border-slate-200"
                    value={discountSearchTerm}
                    onChange={(e) => setDiscountSearchTerm(e.target.value)}
                    placeholder="Search discounts by offer, team, or notes"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    value={discountStatusFilter}
                    onChange={(e) => setDiscountStatusFilter(e.target.value as 'All' | DiscountedService['status'])}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                  <select
                    className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    value={discountCategoryFilter}
                    onChange={(e) => setDiscountCategoryFilter(e.target.value as 'All' | PromotionOffering['category'])}
                  >
                    <option value="All">All Categories</option>
                    <option value="Monthly Plan">Monthly Plan</option>
                    <option value="One-Time Service">One-Time Service</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing {filteredDiscountedServices.length} of {discountedServices.length} discounted offers
                </span>
                <span>Use `Activate` for drafts and `End` for active discounts.</span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {filteredDiscountedServices.map((promotion) => (
                  <div
                    key={promotion.id}
                    className="rounded-2xl border border-amber-200 bg-linear-to-br from-white to-amber-50 p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-amber-700 mb-2">
                          <Tag size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Discounted Offer</span>
                        </div>
                        <h4 className="text-base font-black text-slate-900">{promotion.serviceName}</h4>
                        <p className="text-xs text-slate-500 mt-1">{promotion.category} • {promotion.teamInCharge}</p>
                      </div>
                      <Badge className={`${promotion.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} border-none text-[9px] font-black`}>
                        {promotion.status}
                      </Badge>
                    </div>

                    <div className="rounded-xl bg-white/90 border border-amber-100 p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Original Rate</span>
                        <span className="font-bold text-slate-900">₱{promotion.originalPrice.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Discount</span>
                        <span className="font-bold text-amber-700">
                          {promotion.discountType === 'percentage'
                            ? `${promotion.discountValue}% off`
                            : `₱${promotion.discountValue.toLocaleString()} off`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Client Price</span>
                        <span className="font-black text-lg text-slate-900">₱{promotion.discountedPrice.toLocaleString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 mt-4 leading-relaxed">{promotion.notes}</p>

                    <div className="mt-4 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Valid until {promotion.validUntil}</span>
                      <span className="font-bold text-amber-700">Save ₱{Math.max(promotion.originalPrice - promotion.discountedPrice, 0).toLocaleString()}</span>
                    </div>

                    <div className="mt-4 flex gap-2 pt-4 border-t border-amber-100">
                      {promotion.status === 'Draft' ? (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleActivateDiscount(promotion.id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleEndDiscount(promotion.id)}
                        >
                          End Active Discount
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredDiscountedServices.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No discounted offers match the current search or filter.
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input
                    className="pl-10 bg-white border-slate-200"
                    value={bundleSearchTerm}
                    onChange={(e) => setBundleSearchTerm(e.target.value)}
                    placeholder="Search bundles by name, audience, offer, or included service"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    value={bundleStatusFilter}
                    onChange={(e) => setBundleStatusFilter(e.target.value as 'All' | PromoBundle['status'])}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                  </select>
                  <select
                    className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                    value={bundleCategoryFilter}
                    onChange={(e) => setBundleCategoryFilter(e.target.value as 'All' | PromotionOffering['category'])}
                  >
                    <option value="All">All Categories</option>
                    <option value="Monthly Plan">Monthly Plan</option>
                    <option value="One-Time Service">One-Time Service</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>
                  Showing {filteredPromoBundles.length} of {promoBundles.length} promo bundles
                </span>
                <span>Use `Activate` for drafts and `End` for active bundles.</span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPromoBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="rounded-2xl border border-rose-200 bg-linear-to-br from-white to-rose-50 p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="inline-flex items-center gap-2 text-rose-700 mb-2">
                          <Gift size={14} />
                          <span className="text-[10px] font-black uppercase tracking-widest">Promo Bundle</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-900">{bundle.name}</h4>
                        <p className="text-xs text-slate-500 mt-1">{bundle.audience}</p>
                      </div>
                      <Badge className={`${bundle.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'} border-none text-[9px] font-black`}>
                        {bundle.status}
                      </Badge>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed mb-4">{bundle.headline}</p>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {bundle.categoriesIncluded.map((category) => (
                        <span
                          key={category}
                          className="px-2.5 py-1 rounded-full bg-rose-100 text-[10px] font-bold text-rose-700"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      {bundle.servicesIncluded.map((serviceName) => (
                        <span
                          key={serviceName}
                          className="px-2.5 py-1 rounded-full bg-white border border-rose-100 text-[10px] font-bold text-slate-600"
                        >
                          {serviceName}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-rose-100 bg-white p-3">
                        <p className="text-[10px] uppercase font-black text-slate-400">Original</p>
                        <p className="text-sm font-bold text-slate-900">₱{bundle.originalPrice.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-rose-100 bg-white p-3">
                        <p className="text-[10px] uppercase font-black text-slate-400">Promo</p>
                        <p className="text-sm font-bold text-rose-700">₱{bundle.promoPrice.toLocaleString()}</p>
                      </div>
                      <div className="rounded-xl border border-rose-100 bg-white p-3">
                        <p className="text-[10px] uppercase font-black text-slate-400">Savings</p>
                        <p className="text-sm font-bold text-emerald-700">₱{Math.max(bundle.originalPrice - bundle.promoPrice, 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="mt-4 text-[11px] text-slate-500">
                      Valid until {bundle.validUntil}
                    </div>

                    <div className="mt-4 flex gap-2 pt-4 border-t border-rose-100">
                      {bundle.status === 'Draft' ? (
                        <Button
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={() => handleActivateBundle(bundle.id)}
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                          onClick={() => handleEndBundle(bundle.id)}
                        >
                          End Active Bundle
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredPromoBundles.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                  No promo bundles match the current search or filter.
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Modal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} title="Add Discounted Service">
        <div className="space-y-5 p-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Service or Monthly Plan *</label>
            <select
              className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
              value={discountForm.serviceId}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, serviceId: e.target.value }))}
            >
              <option value="">Select a plan or service</option>
              {offeringOptions.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.category}: {service.name} - ₱{service.rate.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Discount Type *</label>
              <select
                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                value={discountForm.discountType}
                onChange={(e) => setDiscountForm((prev) => ({
                  ...prev,
                  discountType: e.target.value as DiscountedService['discountType'],
                }))}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Discount Value *</label>
              <Input
                type="number"
                min="1"
                step="0.01"
                value={discountForm.discountValue}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                placeholder={discountForm.discountType === 'percentage' ? '15' : '1000'}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Valid Until *</label>
            <Input
              type="date"
              value={discountForm.validUntil}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, validUntil: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Campaign Notes</label>
            <Input
              value={discountForm.notes}
              onChange={(e) => setDiscountForm((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Who should receive this discounted offer?"
            />
          </div>

          {selectedDiscountOffering && discountPreview && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <BadgePercent size={16} />
                <p className="text-xs font-black uppercase tracking-widest">Live Preview</p>
              </div>
              <p className="text-sm font-bold text-slate-900">{selectedDiscountOffering.name}</p>
              <p className="text-xs text-slate-500">{selectedDiscountOffering.category}</p>
              <p className="text-xs text-slate-600">
                ₱{discountPreview.originalPrice.toLocaleString()} to ₱{discountPreview.discountedPrice.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsDiscountModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleAddDiscountedService}
            >
              <Plus size={14} className="mr-1" />
              Save Discount
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isPromoModalOpen} onClose={() => setIsPromoModalOpen(false)} title="Create Promo Bundle">
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Promo Name *</label>
              <Input
                value={promoForm.name}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Startup Launch Pack"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Headline</label>
              <Input
                value={promoForm.headline}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, headline: e.target.value }))}
                placeholder="Short value proposition for the promo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Included Plans and Services *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
              {offeringOptions.map((service) => {
                const isSelected = promoForm.serviceIds.includes(service.id);
                return (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => togglePromoService(service.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                      isSelected
                        ? 'border-rose-300 bg-white text-rose-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold">{service.name}</p>
                    <p className="text-[11px] mt-1">{service.category} • ₱{service.rate.toLocaleString()}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700">Promo Price *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={promoForm.promoPrice}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, promoPrice: e.target.value }))}
                placeholder="14500"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700">Valid Until *</label>
              <Input
                type="date"
                value={promoForm.validUntil}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold text-slate-700">Audience</label>
              <Input
                value={promoForm.audience}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="New business owners"
              />
            </div>
          </div>

          {promoPreview && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-rose-700">
                <Gift size={16} />
                <p className="text-xs font-black uppercase tracking-widest">Bundle Preview</p>
              </div>
              <p className="text-sm text-slate-700">
                Original total: <span className="font-bold">₱{promoPreview.originalPrice.toLocaleString()}</span>
              </p>
              <p className="text-sm text-slate-700">
                Promo price: <span className="font-bold text-rose-700">₱{promoPreview.promoPrice.toLocaleString()}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setIsPromoModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleCreatePromoBundle}
            >
              <PackagePlus size={14} className="mr-1" />
              Save Promo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}