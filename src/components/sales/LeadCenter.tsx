'use client';

import React, { useState, useMemo, useCallback } from 'react';
import type { Lead, TurnoverDocuments } from '@/lib/types';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Modal } from '@/components/UI/Modal';
import {
  LEAD_STATUSES,
  MOCK_AGENTS,
  BUSINESS_TYPES,
  LEAD_SOURCES,
  INITIAL_LEADS,
} from '@/lib/constants';
import {
  Plus,
  MoreVertical,
  ChevronRight,
  Mail,
  Phone,
  Briefcase,
  User,
  ArrowRightLeft,
  Search,
  Filter,
  GripVertical,
  Calendar,
  StickyNote,
  Trash2,
  Eye,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  CreditCard,
  FileText,
  Receipt,
  ShieldCheck,
  Ban,
  Loader2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let nextId = INITIAL_LEADS.length + 1;
const genId = () => `lead-${nextId++}`;

let nextClientNo = 1003;
const genClientNo = () => `2026-${nextClientNo++}`;

const genDocNo = (prefix: string) =>
  `${prefix}-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const LeadCenter: React.FC = () => {
  /* ---- core state ---- */
  const [leads, setLeads] = useState<Lead[]>(INITIAL_LEADS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');

  /* ---- modal visibility ---- */
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isTurnoverDocsOpen, setIsTurnoverDocsOpen] = useState(false);
  const [isBlockedOpen, setIsBlockedOpen] = useState(false);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  /* ---- create-account mock ---- */
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountSuccess, setAccountSuccess] = useState(false);

  /* ---- turnover docs ---- */
  const [turnoverDocs, setTurnoverDocs] = useState<TurnoverDocuments | null>(null);

  /* ---- form state ---- */
  const [form, setForm] = useState<Partial<Lead>>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    email: '',
    businessType: BUSINESS_TYPES[0],
    leadSource: LEAD_SOURCES[0],
    assignedAgentId: MOCK_AGENTS[0]?.id ?? '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /* ---- drag & drop ---- */
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  /* ================================================================ */
  /*  Derived                                                          */
  /* ================================================================ */

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) =>
          `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.contactNumber.includes(q),
      );
    }
    if (filterSource) {
      result = result.filter((l) => l.leadSource === filterSource);
    }
    return result;
  }, [leads, searchQuery, filterSource]);

  /* ================================================================ */
  /*  Validation                                                       */
  /* ================================================================ */

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.firstName?.trim()) errs.firstName = 'First name is required';
    if (!form.lastName?.trim()) errs.lastName = 'Last name is required';
    if (!form.contactNumber?.trim()) {
      errs.contactNumber = 'Contact number is required';
    } else if (!/^[\d\s\-+()]+$/.test(form.contactNumber)) {
      errs.contactNumber = 'Enter a valid phone number';
    } else if (form.contactNumber.replace(/\D/g, '').length !== 11) {
      errs.contactNumber = 'Phone number must be 11 digits';
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = 'Enter a valid email';
    }
    if (!form.assignedAgentId) errs.assignedAgentId = 'Please assign an agent';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInput = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (formErrors[field]) setFormErrors((p) => ({ ...p, [field]: '' }));
  };

  /* ================================================================ */
  /*  CRUD & Pipeline Logic                                            */
  /* ================================================================ */

  const handleCreate = () => {
    if (!validate()) return;
    const now = new Date().toISOString();
    const created: Lead = {
      id: genId(),
      firstName: form.firstName!.trim(),
      lastName: form.lastName!.trim(),
      contactNumber: form.contactNumber!.trim(),
      email: form.email?.trim() ?? '',
      businessType: form.businessType!,
      leadSource: form.leadSource!,
      statusId: '1',
      assignedAgentId: form.assignedAgentId!,
      notes: form.notes ?? '',
      createdAt: now,
      updatedAt: now,
    };
    setLeads((p) => [created, ...p]);
    setSubmitSuccess(true);
    setTimeout(() => {
      setIsCreateOpen(false);
      setSubmitSuccess(false);
      resetForm();
    }, 1200);
  };

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      contactNumber: '',
      email: '',
      businessType: BUSINESS_TYPES[0],
      leadSource: LEAD_SOURCES[0],
      assignedAgentId: MOCK_AGENTS[0]?.id ?? '',
      notes: '',
    });
    setFormErrors({});
  };

  /**
   * Move lead to a new status.
   * 
   * BACKEND HOOK: Replace this with a PATCH /api/leads/:id  { statusId }
   * The backend should enforce:
   *   - Cannot move to '10' (Turnover) unless isPaid === true
   *   - Moving to '10' triggers document generation (Job Order, Invoice, TOS)
   */
  const moveLead = useCallback(
    (leadId: string, newStatusId: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead) return;

      // Guard: block Turnover (10) if not paid
      if (newStatusId === '10' && !lead.isPaid) {
        setSelectedLead(lead);
        setIsBlockedOpen(true);
        setIsActionsOpen(false);
        return;
      }

      // If moving to Turnover & paid → generate documents
      if (newStatusId === '10' && lead.isPaid) {
        const docs: TurnoverDocuments = {
          jobOrderNo: genDocNo('JO'),
          invoiceNo: genDocNo('INV'),
          tosNo: genDocNo('TOS'),
          generatedAt: new Date().toISOString(),
        };
        setTurnoverDocs(docs);
        setSelectedLead(lead);

        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, statusId: newStatusId, updatedAt: new Date().toISOString() }
              : l,
          ),
        );

        setIsActionsOpen(false);
        setIsTurnoverDocsOpen(true);
        return;
      }

      // Normal move
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, statusId: newStatusId, updatedAt: new Date().toISOString() }
            : l,
        ),
      );
      setIsActionsOpen(false);
    },
    [leads],
  );

  /**
   * Create an inactive account for a lead in "Waiting for Payment" stage.
   *
   * BACKEND HOOK: Replace with POST /api/clients  { ...leadData, status: 'Inactive' }
   * Returns { clientNo }. Then PATCH /api/leads/:id { accountCreated: true, clientNo }
   */
  const handleCreateAccount = () => {
    if (!selectedLead) return;
    setCreatingAccount(true);

    // Simulate API delay
    setTimeout(() => {
      const clientNo = genClientNo();
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? { ...l, accountCreated: true, clientNo, updatedAt: new Date().toISOString() }
            : l,
        ),
      );
      setSelectedLead((prev) => (prev ? { ...prev, accountCreated: true, clientNo } : null));
      setCreatingAccount(false);
      setAccountSuccess(true);

      setTimeout(() => {
        setIsCreateAccountOpen(false);
        setAccountSuccess(false);
      }, 1500);
    }, 1200);
  };

  /**
   * Mock: Mark lead as paid.
   * 
   * BACKEND HOOK: This will be triggered by the accounting portal.
   * The accounting portal calls PATCH /api/leads/:id { isPaid: true }
   * For now we expose a mock button so the frontend flow can be tested.
   */
  const handleMarkPaid = (leadId: string) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? { ...l, isPaid: true, updatedAt: new Date().toISOString() }
          : l,
      ),
    );
    setSelectedLead((prev) => (prev ? { ...prev, isPaid: true } : null));
  };

  const deleteLead = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setIsActionsOpen(false);
    setSelectedLead(null);
  };

  /* ================================================================ */
  /*  Drag Handlers                                                    */
  /* ================================================================ */

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
  };
  const onDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverCol(null);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
  };
  const onDragOver = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(statusId);
  };
  const onDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as HTMLElement;
    if (!target.contains(related)) setDragOverCol(null);
  };
  const onDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedId;
    if (id) moveLead(id, statusId);
    setDraggedId(null);
    setDragOverCol(null);
  };

  /* ================================================================ */
  /*  Open modals                                                      */
  /* ================================================================ */

  const openCreate = () => {
    resetForm();
    setSubmitSuccess(false);
    setIsCreateOpen(true);
  };
  const openDetails = (lead: Lead) => {
    // Re-read from state to get latest flags
    const fresh = leads.find((l) => l.id === lead.id) || lead;
    setSelectedLead(fresh);
    setIsDetailsOpen(true);
  };
  const openActions = (lead: Lead) => {
    const fresh = leads.find((l) => l.id === lead.id) || lead;
    setSelectedLead(fresh);
    setIsActionsOpen(true);
  };

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <div className="h-full flex flex-col gap-5">
      {/* ---- Toolbar ---- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="info" className="py-1 px-3 bg-blue-50 text-blue-600 font-black">
            {leads.length} Leads
          </Badge>
          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search leads…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-52"
            />
          </div>

          {/* Source filter */}
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="pl-9 pr-8 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 appearance-none bg-white cursor-pointer"
            >
              <option value="">All Sources</option>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Button
          onClick={openCreate}
          className="bg-[#25238e] rounded-xl shadow-lg shadow-[#25238e]/20 text-white font-bold"
        >
          <Plus size={16} className="mr-2" /> Add Opportunity
        </Button>
      </div>

      {/* ---- Kanban Board ---- */}
      <div className="flex-1 overflow-x-auto pb-4 -mx-2 px-2">
        <div className="inline-flex gap-4 min-w-full">
          {LEAD_STATUSES.map((status) => {
            const colLeads = filteredLeads.filter((l) => l.statusId === status.id);
            const isOver = dragOverCol === status.id;

            return (
              <div
                key={status.id}
                className={`shrink-0 w-80 rounded-2xl p-4 flex flex-col border transition-all duration-200 ${
                  isOver
                    ? 'bg-blue-50/80 border-blue-300 shadow-lg ring-2 ring-blue-200'
                    : 'bg-slate-50/80 border-slate-100'
                }`}
                onDragOver={(e) => onDragOver(e, status.id)}
                onDragLeave={onDragLeave}
                onDrop={(e) => onDrop(e, status.id)}
              >
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
                    <h3 className="text-xs font-black uppercase tracking-wide text-slate-700">
                      {status.name}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-md px-2 py-0.5">
                    {colLeads.length}
                  </span>
                </div>

                {/* Drop indicator */}
                {isOver && draggedId && (
                  <div className="mb-3 p-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 flex items-center justify-center">
                    <ArrowRightLeft className="h-5 w-5 text-blue-500 mr-2 animate-bounce" />
                    <span className="text-xs font-bold text-blue-600">Drop to move here</span>
                  </div>
                )}

                {/* Cards */}
                <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                  {colLeads.length === 0 && !isOver && (
                    <div className="py-8 text-center text-xs text-slate-400 italic">
                      No leads
                    </div>
                  )}

                  {colLeads.map((lead) => {
                    const agent = MOCK_AGENTS.find((a) => a.id === lead.assignedAgentId);
                    const isDragging = draggedId === lead.id;

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, lead.id)}
                        onDragEnd={onDragEnd}
                        className={`group relative p-4 rounded-xl bg-white border transition-all duration-200 cursor-grab active:cursor-grabbing ${
                          isDragging
                            ? 'opacity-40 scale-95 border-blue-300 shadow-xl'
                            : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
                        }`}
                      >
                        {/* Grip hint */}
                        <div className="absolute top-3 left-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                          <GripVertical size={12} className="text-slate-400" />
                        </div>

                        {/* Top row */}
                        <div className="flex items-start justify-between mb-2 pl-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-slate-900 truncate">
                              {lead.firstName} {lead.lastName}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                              <Briefcase size={10} className="shrink-0" /> {lead.businessType}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openActions(lead);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-100 rounded-lg"
                            aria-label="Lead actions"
                          >
                            <MoreVertical size={14} className="text-slate-400" />
                          </button>
                        </div>

                        {/* Contact info */}
                        <div className="space-y-1.5 mb-3 pl-3">
                          <span className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone size={11} className="text-[#25238e] shrink-0" />
                            <span className="font-medium">{lead.contactNumber}</span>
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail size={11} className="text-[#25238e] shrink-0" />
                              <span className="font-medium truncate">{lead.email}</span>
                            </span>
                          )}
                          {agent && (
                            <span className="flex items-center gap-2 text-xs text-slate-600">
                              <User size={11} className="text-emerald-500 shrink-0" />
                              <span className="font-medium truncate">{agent.name}</span>
                            </span>
                          )}
                        </div>

                        {/* Pipeline status badges */}
                        {(lead.statusId === '9' || lead.statusId === '10') && (
                          <div className="flex items-center gap-1.5 mb-3 pl-3 flex-wrap">
                            {lead.accountCreated && (
                              <Badge variant="success" className="text-[9px]">
                                <UserPlus size={9} className="mr-0.5" /> Account
                              </Badge>
                            )}
                            {lead.isPaid ? (
                              <Badge variant="success" className="text-[9px]">
                                <CreditCard size={9} className="mr-0.5" /> Paid
                              </Badge>
                            ) : (
                              <Badge variant="warning" className="text-[9px]">
                                <CreditCard size={9} className="mr-0.5" /> Unpaid
                              </Badge>
                            )}
                            {lead.clientNo && (
                              <Badge variant="info" className="text-[9px]">
                                {lead.clientNo}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 pl-3">
                          <Badge variant="neutral" className="text-[9px] font-bold">
                            {lead.leadSource}
                          </Badge>
                          <button
                            onClick={() => openDetails(lead)}
                            className="flex items-center gap-1 text-[10px] text-blue-600 font-black hover:text-blue-700 group-hover:translate-x-0.5 transition-all"
                          >
                            Details <ChevronRight size={10} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============= MODALS ============= */}

      {/* ---- Create Lead Modal ---- */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="New Opportunity" size="lg">
        {submitSuccess ? (
          <div className="p-10 flex flex-col items-center gap-3">
            <CheckCircle2 size={48} className="text-emerald-500" />
            <p className="text-lg font-bold text-slate-800">Lead created successfully!</p>
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" error={formErrors.firstName} value={form.firstName ?? ''} onChange={(v) => handleInput('firstName', v)} placeholder="Juan" />
              <Field label="Last Name" error={formErrors.lastName} value={form.lastName ?? ''} onChange={(v) => handleInput('lastName', v)} placeholder="Dela Cruz" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Contact Number" error={formErrors.contactNumber} value={form.contactNumber ?? ''} onChange={(v) => handleInput('contactNumber', v)} placeholder="09171234567" />
              <Field label="Email" error={formErrors.email} value={form.email ?? ''} onChange={(v) => handleInput('email', v)} placeholder="email@example.com" required={false} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <SelectField label="Business Type" value={form.businessType ?? BUSINESS_TYPES[0]} options={BUSINESS_TYPES} onChange={(v) => handleInput('businessType', v)} />
              <SelectField label="Lead Source" value={form.leadSource ?? LEAD_SOURCES[0]} options={LEAD_SOURCES} onChange={(v) => handleInput('leadSource', v)} />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Assigned Agent <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.assignedAgentId ?? ''}
                onChange={(e) => handleInput('assignedAgentId', e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${formErrors.assignedAgentId ? 'border-rose-400' : 'border-slate-200'}`}
              >
                <option value="">Select agent…</option>
                {MOCK_AGENTS.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} — {a.role}</option>
                ))}
              </select>
              {formErrors.assignedAgentId && (
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.assignedAgentId}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes</label>
              <textarea value={form.notes ?? ''} onChange={(e) => handleInput('notes', e.target.value)} rows={3} placeholder="Additional details…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} className="bg-[#25238e] text-white font-bold rounded-xl shadow-lg shadow-[#25238e]/20">
                <Plus size={14} className="mr-1" /> Create Lead
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Lead Details Modal ---- */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Lead Details" size="lg">
        {selectedLead && (
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#25238e]/10 flex items-center justify-center text-[#25238e] font-black text-lg">
                {selectedLead.firstName[0]}{selectedLead.lastName[0]}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selectedLead.firstName} {selectedLead.lastName}</h3>
                <p className="text-sm text-slate-500">{selectedLead.businessType}</p>
              </div>
              <div className="ml-auto">
                <Badge variant={selectedLead.statusId === '6' ? 'success' : selectedLead.statusId === '11' ? 'danger' : 'info'}>
                  {LEAD_STATUSES.find((s) => s.id === selectedLead.statusId)?.name}
                </Badge>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoRow icon={<Phone size={14} />} label="Phone" value={selectedLead.contactNumber} />
              <InfoRow icon={<Mail size={14} />} label="Email" value={selectedLead.email || '—'} />
              <InfoRow icon={<Briefcase size={14} />} label="Business Type" value={selectedLead.businessType} />
              <InfoRow icon={<Filter size={14} />} label="Source" value={selectedLead.leadSource} />
              <InfoRow icon={<User size={14} />} label="Agent" value={MOCK_AGENTS.find((a) => a.id === selectedLead.assignedAgentId)?.name ?? '—'} />
              <InfoRow icon={<Calendar size={14} />} label="Created" value={formatDate(selectedLead.createdAt)} />
            </div>

            {/* Account / Payment status (stages 9+) */}
            {['9', '10'].includes(selectedLead.statusId) && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                <p className="text-xs font-black text-slate-600 uppercase tracking-wide">Pipeline Status</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 border ${selectedLead.accountCreated ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus size={14} className={selectedLead.accountCreated ? 'text-emerald-600' : 'text-amber-600'} />
                      <span className="text-xs font-bold text-slate-700">Account</span>
                    </div>
                    <p className={`text-sm font-bold ${selectedLead.accountCreated ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedLead.accountCreated ? `Created (Inactive) — ${selectedLead.clientNo}` : 'Not created'}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 border ${selectedLead.isPaid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <CreditCard size={14} className={selectedLead.isPaid ? 'text-emerald-600' : 'text-amber-600'} />
                      <span className="text-xs font-bold text-slate-700">Payment</span>
                    </div>
                    <p className={`text-sm font-bold ${selectedLead.isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {selectedLead.isPaid ? 'Confirmed' : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedLead.notes && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><StickyNote size={12} /> Notes</p>
                <p className="text-sm text-slate-700">{selectedLead.notes}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-end gap-3 pt-2">
              {/* Create Account button — shows in Waiting for Payment (9) if not yet created */}
              {selectedLead.statusId === '9' && !selectedLead.accountCreated && (
                <Button
                  onClick={() => {
                    setIsDetailsOpen(false);
                    setAccountSuccess(false);
                    setIsCreateAccountOpen(true);
                  }}
                  className="bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20"
                >
                  <UserPlus size={14} className="mr-1" /> Create Account (Inactive)
                </Button>
              )}

              {/* Mock: Mark as Paid — for testing the flow (backend will do this from accounting) */}
              {selectedLead.statusId === '9' && selectedLead.accountCreated && !selectedLead.isPaid && (
                <Button
                  onClick={() => handleMarkPaid(selectedLead.id)}
                  className="bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/20"
                >
                  <CreditCard size={14} className="mr-1" /> Mock: Mark as Paid
                </Button>
              )}

              <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
              <Button
                onClick={() => { setIsDetailsOpen(false); openActions(selectedLead); }}
                className="bg-[#25238e] text-white font-bold rounded-xl"
              >
                Actions <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Lead Actions Modal ---- */}
      <Modal isOpen={isActionsOpen} onClose={() => setIsActionsOpen(false)} title="Lead Actions" size="md">
        {selectedLead && (
          <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh]">
            {/* Current status */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#25238e]/10 flex items-center justify-center text-[#25238e] font-bold text-sm">
                {selectedLead.firstName[0]}{selectedLead.lastName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{selectedLead.firstName} {selectedLead.lastName}</p>
                <p className="text-xs text-slate-500">Current: {LEAD_STATUSES.find((s) => s.id === selectedLead.statusId)?.name}</p>
              </div>
            </div>

            {/* View details */}
            <button
              onClick={() => { setIsActionsOpen(false); openDetails(selectedLead); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left"
            >
              <Eye size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-slate-700">View Details</span>
            </button>

            {/* Move to status */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Move to Stage</p>
              <div className="space-y-1.5">
                {LEAD_STATUSES.filter((s) => s.id !== selectedLead.statusId).map((s) => {
                  // Block Turnover if unpaid
                  const isTurnoverBlocked = s.id === '10' && !selectedLead.isPaid;

                  return (
                    <button
                      key={s.id}
                      onClick={() => moveLead(selectedLead.id, s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border transition text-left group ${
                        isTurnoverBlocked
                          ? 'border-slate-100 opacity-50 cursor-not-allowed'
                          : 'border-slate-100 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
                      <span className="text-sm font-medium text-slate-700 flex-1">{s.name}</span>
                      {isTurnoverBlocked ? (
                        <Ban size={14} className="text-slate-400" />
                      ) : (
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delete */}
            <button
              onClick={() => {
                if (window.confirm('Delete this lead? This cannot be undone.')) deleteLead(selectedLead.id);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 transition text-left"
            >
              <Trash2 size={16} className="text-rose-500" />
              <span className="text-sm font-medium text-rose-600">Delete Lead</span>
            </button>
          </div>
        )}
      </Modal>

      {/* ---- Create Account Modal (Waiting for Payment stage) ---- */}
      <Modal isOpen={isCreateAccountOpen} onClose={() => setIsCreateAccountOpen(false)} title="Create Client Account" size="md">
        {selectedLead && (
          <div className="p-6">
            {accountSuccess ? (
              <div className="py-8 flex flex-col items-center gap-3">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <p className="text-lg font-bold text-slate-800">Account Created!</p>
                <p className="text-sm text-slate-500">
                  Client No: <span className="font-bold text-slate-800">{selectedLead.clientNo}</span>
                </p>
                <Badge variant="warning" className="mt-1">Status: Inactive (pending payment)</Badge>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Lead summary */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-sm">
                      {selectedLead.firstName[0]}{selectedLead.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedLead.firstName} {selectedLead.lastName}</p>
                      <p className="text-xs text-slate-500">{selectedLead.businessType}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Phone:</span> <span className="font-medium text-slate-700">{selectedLead.contactNumber}</span></div>
                    <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-700">{selectedLead.email || '—'}</span></div>
                  </div>
                </div>

                {/* Info notice */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-amber-800">This will create an inactive client account</p>
                    <p className="text-xs text-amber-700 mt-1">
                      The account will remain inactive until payment is confirmed by the accounting portal.
                      {/* BACKEND: POST /api/clients { status: &apos;Inactive&apos; } */}
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsCreateAccountOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleCreateAccount}
                    disabled={creatingAccount}
                    className="bg-violet-600 text-white font-bold rounded-xl shadow-lg shadow-violet-600/20"
                  >
                    {creatingAccount ? (
                      <><Loader2 size={14} className="mr-1 animate-spin" /> Creating…</>
                    ) : (
                      <><UserPlus size={14} className="mr-1" /> Create Account</>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ---- Turnover Blocked Modal ---- */}
      <Modal isOpen={isBlockedOpen} onClose={() => setIsBlockedOpen(false)} title="Cannot Move to Turnover" size="sm">
        {selectedLead && (
          <div className="p-6 space-y-4">
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
                <Ban size={28} className="text-rose-500" />
              </div>
              <p className="text-sm font-bold text-slate-800 text-center">Payment has not been confirmed</p>
              <p className="text-xs text-slate-500 text-center max-w-xs">
                This lead cannot be moved to Turnover until payment is confirmed by the accounting portal.
                {/* BACKEND: Accounting portal calls PATCH /api/leads/:id { isPaid: true } */}
              </p>
            </div>

            {!selectedLead.accountCreated && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  An inactive client account must be created first before payment can be processed.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsBlockedOpen(false)}>Understood</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ---- Turnover Documents Modal ---- */}
      <Modal isOpen={isTurnoverDocsOpen} onClose={() => setIsTurnoverDocsOpen(false)} title="Turnover Complete" size="lg">
        {selectedLead && turnoverDocs && (
          <div className="p-6 space-y-5">
            {/* Success header */}
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center">
                <ShieldCheck size={32} className="text-teal-600" />
              </div>
              <p className="text-lg font-bold text-slate-800">Turnover Successful!</p>
              <p className="text-sm text-slate-500">
                {selectedLead.firstName} {selectedLead.lastName} — {selectedLead.clientNo}
              </p>
            </div>

            {/* Generated documents */}
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-600 uppercase tracking-wide">Generated Documents</p>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Job Order</p>
                  <p className="text-xs text-slate-500">Document for service engagement</p>
                </div>
                <Badge variant="info" className="font-mono text-xs">{turnoverDocs.jobOrderNo}</Badge>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Receipt size={20} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Invoice</p>
                  <p className="text-xs text-slate-500">Billing and payment record</p>
                </div>
                <Badge variant="success" className="font-mono text-xs">{turnoverDocs.invoiceNo}</Badge>
              </div>

              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">Terms of Service Agreement</p>
                  <p className="text-xs text-slate-500">Client service agreement</p>
                </div>
                <Badge variant="info" className="font-mono text-xs">{turnoverDocs.tosNo}</Badge>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Generated on {formatDate(turnoverDocs.generatedAt)}
              {/* BACKEND: These documents are generated server-side and stored in the documents table */}
            </p>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsTurnoverDocsOpen(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

/* ================================================================ */
/*  Sub-components                                                    */
/* ================================================================ */

function Field({
  label,
  error,
  value,
  onChange,
  placeholder,
  required = true,
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
          error ? 'border-rose-400' : 'border-slate-200'
        }`}
      />
      {error && (
        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white cursor-pointer"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-slate-50/80 rounded-xl px-4 py-3 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
        {icon} {label}
      </p>
      <p className="text-sm font-medium text-slate-800 truncate">{value}</p>
    </div>
  );
}

export default LeadCenter;
