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
  Pencil,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
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
  promoName: string;
  promoCode: string | null;
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
  promoCode: string | null;
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
  code: string | null;
  description: string | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountRate: string;
  isActive: boolean;
  validUntil: string | null;
  services: { id: number; name: string; serviceRate: string; billingType: string }[];
}

interface ServiceApiItem {
  id: number;
  name: string;
  serviceRate: string;
  billingType: string;
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

  const [editDiscountTarget, setEditDiscountTarget] = useState<DiscountedService | null>(null);
  const [editDiscountForm, setEditDiscountForm] = useState({
    name: '',
    code: '',
    discountType: 'percentage' as DiscountedService['discountType'],
    discountValue: '',
    validFrom: '',
    validUntil: '',
    maxUsage: '',
    description: '',
  });
  const [isEditDiscountSubmitting, setIsEditDiscountSubmitting] = useState(false);

  const [editBundleTarget, setEditBundleTarget] = useState<PromoBundle | null>(null);
  const [editBundleForm, setEditBundleForm] = useState({
    name: '',
    code: '',
    description: '',
    promoPrice: '',
    validFrom: '',
    validUntil: '',
    maxUsage: '',
    audience: '',
  });
  const [isEditBundleSubmitting, setIsEditBundleSubmitting] = useState(false);

  const [deletePromoTarget, setDeletePromoTarget] = useState<{ id: string; name: string; type: 'discount' | 'bundle' } | null>(null);
  const [isDeletingPromo, setIsDeletingPromo] = useState(false);

  const { success, error } = useToast();

  const [offeringApiServices, setOfferingApiServices] = useState<ServiceApiItem[]>([]);

  const [discountForm, setDiscountForm] = useState({
    name: '',
    code: '',
    serviceId: '',
    discountType: 'percentage' as DiscountedService['discountType'],
    discountValue: '',
    validFrom: '',
    validUntil: '',
    maxUsage: '',
    description: '',
  });

  const [promoForm, setPromoForm] = useState({
    name: '',
    code: '',
    description: '',
    serviceIds: [] as string[],
    promoPrice: '',
    validFrom: '',
    validUntil: '',
    maxUsage: '',
    audience: '',
  });
  const [discountServiceSearch, setDiscountServiceSearch] = useState('');
  const [promoServiceSearch, setPromoServiceSearch] = useState('');

  useEffect(() => {
    Promise.all([
      fetch('/api/sales/promos').then((r) => r.json()),
      fetch('/api/sales/services').then((r) => r.json()),
    ])
      .then(([promosData, servicesData]) => {
        const promos: PromoApiItem[] = (promosData as { data?: PromoApiItem[] }).data ?? [];
        const services = (servicesData as { data?: ServiceApiItem[] }).data ?? [];

        setOfferingApiServices(services);

        const discounted: DiscountedService[] = [];
        const bundles: PromoBundle[] = [];

        for (const promo of promos) {
          const total = promo.services.length;
          if (total <= 1) {
            const firstSvc = promo.services[0];
            const isRecurring = firstSvc?.billingType === 'RECURRING';
            const origPrice = firstSvc ? parseFloat(firstSvc.serviceRate) : 0;
            const discValue = parseFloat(promo.discountRate);
            const discPrice =
              promo.discountType === 'PERCENTAGE'
                ? Math.max(Math.round(origPrice * (1 - discValue / 100)), 0)
                : Math.max(origPrice - discValue, 0);
            discounted.push({
              id: String(promo.id),
              serviceId: firstSvc ? String(firstSvc.id) : '',
              promoName: promo.name,
              promoCode: promo.code ?? null,
              serviceName: firstSvc?.name ?? promo.name,
              category: isRecurring ? 'Monthly Plan' : 'One-Time Service',
              teamInCharge: isRecurring ? 'Monthly Plan' : 'One-Time Service',
              discountType: promo.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
              discountValue: discValue,
              originalPrice: origPrice,
              discountedPrice: discPrice,
              validUntil: promo.validUntil ? promo.validUntil.slice(0, 10) : '',
              notes: promo.description ?? '',
              status: promo.isActive ? 'Active' : 'Draft',
            });
          } else {
            const allNames = promo.services.map((s) => s.name);
            const origPrice = promo.services.reduce((sum, s) => sum + parseFloat(s.serviceRate), 0);
            const discAmount =
              promo.discountType === 'FIXED'
                ? parseFloat(promo.discountRate)
                : Math.round((origPrice * parseFloat(promo.discountRate)) / 100);
            const promoPrice = Math.max(origPrice - discAmount, 0);
            const cats: PromotionOffering['category'][] = [];
            if (promo.services.some((s) => s.billingType === 'RECURRING')) cats.push('Monthly Plan');
            if (promo.services.some((s) => s.billingType === 'ONE_TIME')) cats.push('One-Time Service');
            bundles.push({
              id: String(promo.id),
              name: promo.name,
              promoCode: promo.code ?? null,
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
    return offeringApiServices.map((s) => ({
      id: String(s.id),
      name: s.name,
      category: (s.billingType === 'RECURRING' ? 'Monthly Plan' : 'One-Time Service') as PromotionOffering['category'],
      teamLabel: s.billingType === 'RECURRING' ? 'Monthly Plan' : 'One-Time Service',
      rate: parseFloat(s.serviceRate),
    }));
  }, [offeringApiServices]);

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

  const filteredDiscountOfferings = useMemo(() => {
    if (!discountServiceSearch.trim()) return offeringOptions;
    const q = discountServiceSearch.toLowerCase();
    return offeringOptions.filter((o) => o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q));
  }, [offeringOptions, discountServiceSearch]);

  const filteredPromoOfferings = useMemo(() => {
    if (!promoServiceSearch.trim()) return offeringOptions;
    const q = promoServiceSearch.toLowerCase();
    return offeringOptions.filter((o) => o.name.toLowerCase().includes(q) || o.category.toLowerCase().includes(q));
  }, [offeringOptions, promoServiceSearch]);

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
    if (!discountForm.name.trim() || !selectedDiscountOffering || !discountPreview || !discountForm.validUntil) {
      error('Missing promotion details', 'Enter a promo name, choose a service, add a discount, and set a validity date.');
      return;
    }

    const numericId = parseInt(selectedDiscountOffering.id, 10);

    try {
      const res = await fetch('/api/sales/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: discountForm.name.trim(),
          code: discountForm.code.trim() || null,
          description: discountForm.description.trim() || undefined,
          discountType: discountForm.discountType.toUpperCase(),
          discountRate: Number(discountForm.discountValue),
          validFrom: discountForm.validFrom ? `${discountForm.validFrom}T00:00:00.000Z` : null,
          validUntil: `${discountForm.validUntil}T23:59:59.000Z`,
          maxUsage: discountForm.maxUsage ? parseInt(discountForm.maxUsage, 10) : null,
          serviceIds: [numericId],
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to add discount', data.error ?? 'An error occurred.');
        return;
      }
      const promo = data.data!;
      const firstSvc = promo.services[0];
      const origPrice = firstSvc ? parseFloat(firstSvc.serviceRate) : 0;
      const discValue = parseFloat(promo.discountRate);
      const discPrice =
        promo.discountType === 'PERCENTAGE'
          ? Math.max(Math.round(origPrice * (1 - discValue / 100)), 0)
          : Math.max(origPrice - discValue, 0);
      const created: DiscountedService = {
        id: String(promo.id),
        serviceId: selectedDiscountOffering.id,
        promoName: promo.name,
        promoCode: promo.code ?? null,
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
      setDiscountForm({ name: '', code: '', serviceId: '', discountType: 'percentage', discountValue: '', validFrom: '', validUntil: '', maxUsage: '', description: '' });
      setDiscountServiceSearch('');
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

    const serviceIds = promoForm.serviceIds.map((id) => parseInt(id, 10));

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
          code: promoForm.code.trim() || null,
          description: promoForm.description.trim() || undefined,
          discountType: 'FIXED',
          discountRate: discountAmount,
          validFrom: promoForm.validFrom ? `${promoForm.validFrom}T00:00:00.000Z` : null,
          validUntil: `${promoForm.validUntil}T23:59:59.000Z`,
          maxUsage: promoForm.maxUsage ? parseInt(promoForm.maxUsage, 10) : null,
          serviceIds,
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to create promo', data.error ?? 'An error occurred.');
        return;
      }
      const promo = data.data!;
      const allNames = promo.services.map((s) => s.name);
      const cats: PromotionOffering['category'][] = [];
      if (promo.services.some((s) => s.billingType === 'RECURRING')) cats.push('Monthly Plan');
      if (promo.services.some((s) => s.billingType === 'ONE_TIME')) cats.push('One-Time Service');
      const created: PromoBundle = {
        id: String(promo.id),
        name: promo.name,
        promoCode: promo.code ?? null,
        headline: promo.description ?? promoForm.description,
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
      setPromoForm({ name: '', code: '', description: '', serviceIds: [], promoPrice: '', validFrom: '', validUntil: '', maxUsage: '', audience: '' });
      setPromoServiceSearch('');
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

  const openEditDiscount = (p: DiscountedService) => {
    setEditDiscountTarget(p);
    setEditDiscountForm({
      name: p.promoName,
      code: p.promoCode ?? '',
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      validFrom: '',
      validUntil: p.validUntil,
      maxUsage: '',
      description: p.notes,
    });
  };

  const handleUpdateDiscount = async () => {
    if (!editDiscountTarget || !editDiscountForm.name.trim() || !editDiscountForm.discountValue || !editDiscountForm.validUntil) {
      error('Missing fields', 'Enter a promo name, discount value, and validity date.');
      return;
    }
    setIsEditDiscountSubmitting(true);
    try {
      const res = await fetch(`/api/sales/promos/${editDiscountTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editDiscountForm.name.trim(),
          code: editDiscountForm.code.trim() || null,
          description: editDiscountForm.description.trim() || null,
          discountType: editDiscountForm.discountType.toUpperCase(),
          discountRate: Number(editDiscountForm.discountValue),
          validFrom: editDiscountForm.validFrom ? `${editDiscountForm.validFrom}T00:00:00.000Z` : null,
          validUntil: `${editDiscountForm.validUntil}T23:59:59.000Z`,
          maxUsage: editDiscountForm.maxUsage ? parseInt(editDiscountForm.maxUsage, 10) : null,
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to update', data.error ?? 'An error occurred.');
        return;
      }
      const updated = data.data!;
      const discValue = parseFloat(updated.discountRate);
      const origPrice = editDiscountTarget.originalPrice;
      const discPrice =
        updated.discountType === 'PERCENTAGE'
          ? Math.max(Math.round(origPrice * (1 - discValue / 100)), 0)
          : Math.max(origPrice - discValue, 0);
      setDiscountedServices((prev) =>
        prev.map((p) => {
          if (p.id !== editDiscountTarget.id) return p;
          return {
            ...p,
            promoName: updated.name,
            promoCode: updated.code ?? null,
            discountType: updated.discountType === 'PERCENTAGE' ? 'percentage' : 'fixed',
            discountValue: discValue,
            discountedPrice: discPrice,
            validUntil: updated.validUntil ? updated.validUntil.slice(0, 10) : p.validUntil,
            notes: updated.description ?? '',
          };
        }),
      );
      setEditDiscountTarget(null);
      success('Discount updated', 'The discounted offer has been updated successfully.');
    } catch {
      error('Failed to update', 'An unexpected error occurred.');
    } finally {
      setIsEditDiscountSubmitting(false);
    }
  };

  const openEditBundle = (b: PromoBundle) => {
    setEditBundleTarget(b);
    setEditBundleForm({
      name: b.name,
      code: b.promoCode ?? '',
      description: b.headline,
      promoPrice: String(b.promoPrice),
      validFrom: '',
      validUntil: b.validUntil,
      maxUsage: '',
      audience: b.audience,
    });
  };

  const handleUpdateBundle = async () => {
    if (!editBundleTarget || !editBundleForm.name.trim() || !editBundleForm.promoPrice || !editBundleForm.validUntil) {
      error('Missing fields', 'Enter a bundle name, promo price, and validity date.');
      return;
    }
    setIsEditBundleSubmitting(true);
    try {
      const discountAmount = Math.max(editBundleTarget.originalPrice - Number(editBundleForm.promoPrice), 0);
      const res = await fetch(`/api/sales/promos/${editBundleTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editBundleForm.name.trim(),
          code: editBundleForm.code.trim() || null,
          description: editBundleForm.description.trim() || null,
          discountRate: discountAmount,
          validFrom: editBundleForm.validFrom ? `${editBundleForm.validFrom}T00:00:00.000Z` : null,
          validUntil: `${editBundleForm.validUntil}T23:59:59.000Z`,
          maxUsage: editBundleForm.maxUsage ? parseInt(editBundleForm.maxUsage, 10) : null,
        }),
      });
      const data = await res.json() as { data?: PromoApiItem; error?: string };
      if (!res.ok) {
        error('Failed to update', data.error ?? 'An error occurred.');
        return;
      }
      setPromoBundles((prev) =>
        prev.map((b) => {
          if (b.id !== editBundleTarget.id) return b;
          return {
            ...b,
            name: editBundleForm.name.trim(),
            promoCode: editBundleForm.code.trim() || null,
            headline: editBundleForm.description.trim(),
            promoPrice: Number(editBundleForm.promoPrice),
            validUntil: editBundleForm.validUntil,
            audience: editBundleForm.audience || b.audience,
          };
        }),
      );
      setEditBundleTarget(null);
      success('Bundle updated', 'The promo bundle has been updated successfully.');
    } catch {
      error('Failed to update', 'An unexpected error occurred.');
    } finally {
      setIsEditBundleSubmitting(false);
    }
  };

  const handleDeletePromo = async () => {
    if (!deletePromoTarget) return;
    setIsDeletingPromo(true);
    try {
      const res = await fetch(`/api/sales/promos/${deletePromoTarget.id}`, { method: 'DELETE' });
      if (res.ok || res.status === 204) {
        if (deletePromoTarget.type === 'discount') {
          setDiscountedServices((prev) => prev.filter((p) => p.id !== deletePromoTarget.id));
        } else {
          setPromoBundles((prev) => prev.filter((b) => b.id !== deletePromoTarget.id));
        }
        setDeletePromoTarget(null);
        success('Promotion deleted', `"${deletePromoTarget.name}" has been permanently removed.`);
      } else {
        const data = await res.json() as { error?: string };
        error('Failed to delete', data.error ?? 'An error occurred.');
      }
    } catch {
      error('Failed to delete', 'An unexpected error occurred.');
    } finally {
      setIsDeletingPromo(false);
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

                    {promotion.promoCode && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black tracking-widest uppercase">
                          <Tag size={10} />
                          {promotion.promoCode}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2 pt-4 border-t border-amber-100">
                      <button
                        type="button"
                        onClick={() => openEditDiscount(promotion)}
                        className="p-2 text-slate-500 hover:bg-amber-100 rounded-lg transition-colors"
                        title="Edit discount"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePromoTarget({ id: promotion.id, name: promotion.promoName, type: 'discount' })}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete discount"
                      >
                        <Trash2 size={13} />
                      </button>
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

                    {bundle.promoCode && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black tracking-widest uppercase">
                          <Tag size={10} />
                          {bundle.promoCode}
                        </span>
                      </div>
                    )}

                    <div className="mt-4 flex gap-2 pt-4 border-t border-rose-100">
                      <button
                        type="button"
                        onClick={() => openEditBundle(bundle)}
                        className="p-2 text-slate-500 hover:bg-rose-100 rounded-lg transition-colors"
                        title="Edit bundle"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePromoTarget({ id: bundle.id, name: bundle.name, type: 'bundle' })}
                        className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete bundle"
                      >
                        <Trash2 size={13} />
                      </button>
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

      <Modal isOpen={isDiscountModalOpen} onClose={() => { setIsDiscountModalOpen(false); setDiscountServiceSearch(''); }} title="Add Discounted Service">
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Promo Name *</label>
              <Input
                value={discountForm.name}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. BIR Filing 15% Off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Promo Code</label>
              <Input
                value={discountForm.code}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. BIR15 (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Input
                value={discountForm.description}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Who should receive this offer?"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Service or Monthly Plan *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                className="pl-9"
                value={discountServiceSearch}
                onChange={(e) => setDiscountServiceSearch(e.target.value)}
                placeholder="Search plans or services..."
              />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
              {filteredDiscountOfferings.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">No results found.</p>
              ) : (
                filteredDiscountOfferings.map((offering) => {
                  const isSelected = discountForm.serviceId === offering.id;
                  return (
                    <button
                      key={offering.id}
                      type="button"
                      onClick={() => setDiscountForm((prev) => ({ ...prev, serviceId: offering.id }))}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{offering.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{offering.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-800">₱{offering.rate.toLocaleString()}</p>
                        {isSelected && <span className="text-[10px] font-bold text-amber-600">Selected</span>}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid From</label>
              <Input
                type="date"
                value={discountForm.validFrom}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, validFrom: e.target.value }))}
              />
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
              <label className="text-xs font-bold text-slate-700">Max Usage</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={discountForm.maxUsage}
                onChange={(e) => setDiscountForm((prev) => ({ ...prev, maxUsage: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
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
                ₱{discountPreview.originalPrice.toLocaleString()} → ₱{discountPreview.discountedPrice.toLocaleString()}
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setIsDiscountModalOpen(false); setDiscountServiceSearch(''); }}
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

      <Modal isOpen={isPromoModalOpen} onClose={() => { setIsPromoModalOpen(false); setPromoServiceSearch(''); }} title="Create Promo Bundle">
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Promo Code</label>
              <Input
                value={promoForm.code}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. LAUNCH25 (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Input
                value={promoForm.description}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short value proposition for the promo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Included Plans and Services *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                className="pl-9"
                value={promoServiceSearch}
                onChange={(e) => setPromoServiceSearch(e.target.value)}
                placeholder="Search plans or services to add..."
              />
            </div>
            <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 divide-y divide-slate-100">
              {filteredPromoOfferings.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">No results found.</p>
              ) : (
                filteredPromoOfferings.map((offering) => {
                  const isSelected = promoForm.serviceIds.includes(offering.id);
                  return (
                    <button
                      key={offering.id}
                      type="button"
                      onClick={() => togglePromoService(offering.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                        isSelected
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-rose-600 border-rose-600' : 'border-slate-300'
                        }`}>
                          {isSelected && <span className="text-white text-[8px] font-black">✓</span>}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{offering.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{offering.category}</p>
                        </div>
                      </div>
                      <p className="text-xs font-black text-slate-800">₱{offering.rate.toLocaleString()}</p>
                    </button>
                  );
                })
              )}
            </div>
            {promoForm.serviceIds.length > 0 && (
              <p className="text-[11px] text-rose-600 font-bold px-1">
                {promoForm.serviceIds.length} service{promoForm.serviceIds.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Audience</label>
              <Input
                value={promoForm.audience}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="New business owners"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid From</label>
              <Input
                type="date"
                value={promoForm.validFrom}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, validFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid Until *</label>
              <Input
                type="date"
                value={promoForm.validUntil}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Max Usage</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={promoForm.maxUsage}
                onChange={(e) => setPromoForm((prev) => ({ ...prev, maxUsage: e.target.value }))}
                placeholder="Unlimited"
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
              onClick={() => { setIsPromoModalOpen(false); setPromoServiceSearch(''); }}
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

      {/* Edit Discounted Service Modal */}
      <Modal isOpen={editDiscountTarget !== null} onClose={() => setEditDiscountTarget(null)} title="Edit Discounted Offer">
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Promo Name *</label>
              <Input
                value={editDiscountForm.name}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. BIR Filing 15% Off"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Promo Code</label>
              <Input
                value={editDiscountForm.code}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. BIR15 (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Input
                value={editDiscountForm.description}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Who should receive this offer?"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Discount Type *</label>
              <select
                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"
                value={editDiscountForm.discountType}
                onChange={(e) => setEditDiscountForm((prev) => ({
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
                value={editDiscountForm.discountValue}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, discountValue: e.target.value }))}
                placeholder={editDiscountForm.discountType === 'percentage' ? '15' : '1000'}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid From</label>
              <Input
                type="date"
                value={editDiscountForm.validFrom}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, validFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid Until *</label>
              <Input
                type="date"
                value={editDiscountForm.validUntil}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Max Usage</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={editDiscountForm.maxUsage}
                onChange={(e) => setEditDiscountForm((prev) => ({ ...prev, maxUsage: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
          </div>

          {editDiscountTarget && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-1">
              <div className="flex items-center gap-2 text-amber-700">
                <Tag size={14} />
                <p className="text-xs font-black uppercase tracking-widest">Editing offer for</p>
              </div>
              <p className="text-sm font-bold text-slate-900">{editDiscountTarget.serviceName}</p>
              <p className="text-xs text-slate-500">{editDiscountTarget.category}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" className="flex-1" onClick={() => setEditDiscountTarget(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleUpdateDiscount}
              disabled={isEditDiscountSubmitting}
            >
              {isEditDiscountSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Promo Bundle Modal */}
      <Modal isOpen={editBundleTarget !== null} onClose={() => setEditBundleTarget(null)} title="Edit Promo Bundle">
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Bundle Name *</label>
              <Input
                value={editBundleForm.name}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Startup Launch Pack"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Promo Code</label>
              <Input
                value={editBundleForm.code}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, code: e.target.value }))}
                placeholder="e.g. LAUNCH25 (optional)"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Audience</label>
              <Input
                value={editBundleForm.audience}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, audience: e.target.value }))}
                placeholder="New business owners"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700">Description</label>
              <Input
                value={editBundleForm.description}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Short value proposition for the promo"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Promo Price *</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editBundleForm.promoPrice}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, promoPrice: e.target.value }))}
                placeholder="14500"
              />
            </div>
            {editBundleTarget && editBundleForm.promoPrice && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Bundle Savings</label>
                <div className="h-11 flex items-center px-3 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-emerald-700">
                  ₱{Math.max(editBundleTarget.originalPrice - Number(editBundleForm.promoPrice), 0).toLocaleString()}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid From</label>
              <Input
                type="date"
                value={editBundleForm.validFrom}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, validFrom: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Valid Until *</label>
              <Input
                type="date"
                value={editBundleForm.validUntil}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, validUntil: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Max Usage</label>
              <Input
                type="number"
                min="1"
                step="1"
                value={editBundleForm.maxUsage}
                onChange={(e) => setEditBundleForm((prev) => ({ ...prev, maxUsage: e.target.value }))}
                placeholder="Unlimited"
              />
            </div>
          </div>

          {editBundleTarget && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <div className="flex items-center gap-2 text-rose-700 mb-2">
                <Gift size={14} />
                <p className="text-xs font-black uppercase tracking-widest">Included services</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {editBundleTarget.servicesIncluded.map((svc) => (
                  <span key={svc} className="px-2 py-0.5 rounded-full bg-white border border-rose-100 text-[10px] font-bold text-slate-600">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" className="flex-1" onClick={() => setEditBundleTarget(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
              onClick={handleUpdateBundle}
              disabled={isEditBundleSubmitting}
            >
              {isEditBundleSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={deletePromoTarget !== null} onClose={() => setDeletePromoTarget(null)} title="Delete Promotion" size="sm">
        <div className="space-y-5 p-6">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center space-y-2">
            <Trash2 className="mx-auto text-red-500" size={28} />
            <p className="text-sm font-bold text-slate-900">
              Delete &ldquo;{deletePromoTarget?.name}&rdquo;?
            </p>
            <p className="text-xs text-slate-500">
              This action is permanent and cannot be undone. The promotion will be removed from all campaigns.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeletePromoTarget(null)} disabled={isDeletingPromo}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeletePromo}
              disabled={isDeletingPromo}
            >
              {isDeletingPromo ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}