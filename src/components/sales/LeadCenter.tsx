// src/components/sales/LeadCenter.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo, JSX } from 'react';
import {
  Plus, Search, Filter, LayoutList, Columns3,
  Phone, Briefcase, User, MoreVertical, GripVertical,
  ArrowRightLeft, ChevronUp, ChevronDown, Loader2, CheckCircle2, Clock,
} from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { useToast } from '@/context/ToastContext';
import { LEAD_SOURCES } from '@/lib/constants';
import { CreateLeadModal } from '@/app/(portal)/portal/sales/lead-center/components/CreateLeadModal';
import { LeadDetailModal, type Lead } from '@/app/(portal)/portal/sales/lead-center/components/LeadDetailModal';

/* -- Types ---------------------------------------------------------- */
interface LeadStatus {
  id: number;
  name: string;
  color: string | null;
  sequence: number;
  isOnboarding: boolean;
  isConverted: boolean;
}
type SortKey = 'name' | 'businessType' | 'leadSource' | 'status' | 'createdAt';
type SortDir = 'asc' | 'desc';
type ViewMode = 'kanban' | 'list';

/* -- Helpers --------------------------------------------------------- */
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }): JSX.Element {
  if (sortKey !== col) return <ChevronUp size={12} className="text-muted-foreground/40" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-blue-600" />
    : <ChevronDown size={12} className="text-blue-600" />;
}

/* -- Component ------------------------------------------------------- */
export function LeadCenter(): React.ReactNode {
  const { error } = useToast();
  const [statuses, setStatuses]   = useState<LeadStatus[]>([]);
  const [leads, setLeads]         = useState<Lead[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewMode, setViewMode]   = useState<ViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('createdAt');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const fetchStatuses = useCallback(async () => {
    const res = await fetch('/api/admin/settings/sales/lead-statuses');
    if (!res.ok) return;
    const json = (await res.json()) as { data: LeadStatus[] };
    setStatuses((json.data ?? []).sort((a, b) => a.sequence - b.sequence));
  }, []);

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/sales/leads');
    if (!res.ok) return;
    const json = (await res.json()) as { data: Lead[] };
    setLeads(json.data ?? []);
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStatuses(), fetchLeads()]);
      setLoading(false);
    };
    void load();
  }, [fetchStatuses, fetchLeads]);

  const filteredLeads = useMemo(() => {
    let result = leads;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (l) => (l.firstName + ' ' + l.lastName).toLowerCase().includes(q) ||
               (l.contactNumber ?? '').includes(q),
      );
    }
    if (filterSource) result = result.filter((l) => l.leadSource === filterSource);
    return result;
  }, [leads, searchQuery, filterSource]);

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let av: string;
      let bv: string;
      switch (sortKey) {
        case 'name':
          av = a.firstName + ' ' + a.lastName;
          bv = b.firstName + ' ' + b.lastName;
          break;
        case 'businessType':
          av = a.businessType;
          bv = b.businessType;
          break;
        case 'leadSource':
          av = a.leadSource;
          bv = b.leadSource;
          break;
        case 'status':
          av = a.status.name;
          bv = b.status.name;
          break;
        default:
          av = a.createdAt;
          bv = b.createdAt;
      }
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }, [filteredLeads, sortKey, sortDir]);

  const moveLead = useCallback(async (leadId: number, newStatusId: number) => {    const existing = leads.find((l) => l.id === leadId);
    if (!existing || existing.statusId === newStatusId) return;
    const newStatus = statuses.find((s) => s.id === newStatusId);
    if (!newStatus) return;
    setLeads((prev) =>
      prev.map((l) => l.id === leadId ? { ...l, statusId: newStatusId, status: newStatus } : l),
    );
    const res = await fetch('/api/sales/leads/' + leadId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statusId: newStatusId }),
    });
    if (!res.ok) {
      setLeads((prev) => prev.map((l) => l.id === leadId ? existing : l));
      error('Move failed', 'Could not update lead status.');
    }
  }, [leads, statuses, error]);

  const onDragStart = (e: React.DragEvent, id: number) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(id));
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
  };
  const onDragEnd = (e: React.DragEvent) => {
    setDraggedId(null);
    setDragOverCol(null);
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
  };
  const onDragOver = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(statusId);
  };
  const onDragLeave = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    const related = e.relatedTarget as HTMLElement | null;
    if (!target.contains(related)) setDragOverCol(null);
  };
  const onDrop = (e: React.DragEvent, statusId: number) => {
    e.preventDefault();
    const rawId = e.dataTransfer.getData('text/plain') || String(draggedId ?? '');
    const id = parseInt(rawId, 10);
    if (!isNaN(id)) void moveLead(id, statusId);
    setDraggedId(null);
    setDragOverCol(null);
  };

  const handleLeadSaved = (lead: Lead) => {
    setLeads((prev) => [lead, ...prev]);
    setIsCreateOpen(false);
  };

  const handleLeadUpdated = (updated: Lead) => {
    setLeads((prev) => prev.map((l) => l.id === updated.id ? updated : l));
    if (selectedLead?.id === updated.id) setSelectedLead(updated);
  };

  const handleLeadDeleted = (leadId: number) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    setIsDetailsOpen(false);
    setSelectedLead(null);
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-muted-foreground">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading leads...</span>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card px-5 py-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="info" className="py-1 px-3 font-black">
            {leads.length} Leads
          </Badge>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-52"
            />
          </div>
          <div className="relative">
            <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="pl-9 pr-8 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none cursor-pointer"
            >
              <option value="">All Sources</option>
              {LEAD_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border overflow-hidden bg-background">
            <button
              onClick={() => setViewMode('kanban')}
              className={viewMode === 'kanban'
                ? 'px-3 py-1.5 text-sm bg-blue-600 text-white font-medium flex items-center gap-1.5'
                : 'px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 transition-all'}
            >
              <Columns3 size={14} /> Kanban
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={viewMode === 'list'
                ? 'px-3 py-1.5 text-sm bg-blue-600 text-white font-medium flex items-center gap-1.5'
                : 'px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent flex items-center gap-1.5 transition-all'}
            >
              <LayoutList size={14} /> List
            </button>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#25238e] rounded-xl shadow-lg shadow-[#25238e]/20 text-white font-bold"
          >
            <Plus size={16} className="mr-2" /> Add Opportunity
          </Button>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto pb-4 -mx-2 px-2">
          <div className="inline-flex gap-4 min-w-full">
            {statuses.map((status) => {
              const colLeads = filteredLeads.filter((l) => l.statusId === status.id);
              const isOver = dragOverCol === status.id;
              return (
                <div
                  key={status.id}
                  className={
                    isOver
                      ? 'shrink-0 w-72 rounded-2xl p-4 flex flex-col border transition-all duration-200 bg-blue-50/80 border-blue-300 shadow-lg ring-2 ring-blue-200'
                      : 'shrink-0 w-72 rounded-2xl p-4 flex flex-col border transition-all duration-200 bg-muted/40 border-border'
                  }
                  onDragOver={(e) => onDragOver(e, status.id)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, status.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: status.color ?? '#64748b' }}
                      />
                      <h3 className="text-xs font-black uppercase tracking-wide text-foreground">
                        {status.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground bg-background border border-border rounded-md px-2 py-0.5">
                      {colLeads.length}
                    </span>
                  </div>

                  {isOver && draggedId !== null && (
                    <div className="mb-3 p-3 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50 flex items-center justify-center">
                      <ArrowRightLeft className="h-4 w-4 text-blue-500 mr-2 animate-bounce" />
                      <span className="text-xs font-bold text-blue-600">Drop to move here</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-320px)] pr-1">
                    {colLeads.length === 0 && !isOver && (
                      <div className="py-8 text-center text-xs text-muted-foreground italic">No leads</div>
                    )}
                    {colLeads.map((lead) => {
                      const isDragging = draggedId === lead.id;
                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => onDragStart(e, lead.id)}
                          onDragEnd={onDragEnd}
                          className={
                            isDragging
                              ? 'group relative p-4 rounded-xl bg-card border transition-all duration-200 cursor-grab active:cursor-grabbing opacity-40 scale-95 border-blue-300 shadow-xl'
                              : 'group relative p-4 rounded-xl bg-card border transition-all duration-200 cursor-grab active:cursor-grabbing border-border hover:border-border/80 hover:shadow-md'
                          }
                        >
                          <div className="absolute top-3 left-1.5 opacity-0 group-hover:opacity-40 transition-opacity">
                            <GripVertical size={12} className="text-muted-foreground" />
                          </div>
                          <div className="flex items-start justify-between mb-2 pl-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate">
                                {lead.firstName} {lead.lastName}
                              </h4>
                              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Briefcase size={10} className="shrink-0" /> {lead.businessType}
                              </p>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLead(lead);
                                setIsDetailsOpen(true);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent rounded-lg"
                            >
                              <MoreVertical size={14} className="text-muted-foreground" />
                            </button>
                          </div>
                          <div className="space-y-1.5 pl-3">
                            {lead.contactNumber && (
                              <span className="flex items-center gap-2 text-xs text-foreground">
                                <Phone size={11} className="text-blue-600 shrink-0" />
                                <span className="font-medium">{lead.contactNumber}</span>
                              </span>
                            )}
                            {lead.assignedAgent && (
                              <span className="flex items-center gap-2 text-xs text-foreground">
                                <User size={11} className="text-emerald-500 shrink-0" />
                                <span className="font-medium truncate">{lead.assignedAgent.name}</span>
                              </span>
                            )}
                            {lead.isAccountCreated && !lead.isCreatedJobOrder && (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                lead.invoices?.[0]?.status === 'PAID'
                                  ? 'bg-blue-100 text-blue-700 dark:text-blue-400'
                                  : 'bg-amber-100 text-amber-700 dark:text-amber-400'
                              }`}>
                                <Clock size={9} className="shrink-0" />
                                {lead.invoices?.[0]?.status === 'PAID' ? 'Ready for Turn Over' : 'Waiting for Payment'}
                              </span>
                            )}
                            {lead.isCreatedJobOrder && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:text-emerald-400 text-[10px] font-semibold">
                                <CheckCircle2 size={9} className="shrink-0" /> Converted
                              </span>
                            )}
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
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {(
                    [
                      { key: 'name',         label: 'Name' },
                      { key: 'businessType', label: 'Business Type' },
                      { key: 'leadSource',   label: 'Source' },
                      { key: 'status',       label: 'Stage' },
                    ] as { key: SortKey; label: string }[]
                  ).map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => toggleSort(key)}
                      className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                    >
                      <span className="flex items-center gap-1">
                        {label} <SortIcon col={key} sortKey={sortKey} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Agent
                  </th>
                  <th
                    onClick={() => toggleSort('createdAt')}
                    className="px-6 py-3.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground select-none"
                  >
                    <span className="flex items-center gap-1">
                      Added <SortIcon col="createdAt" sortKey={sortKey} sortDir={sortDir} />
                    </span>
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedLeads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                      No leads found.
                    </td>
                  </tr>
                )}
                {sortedLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => { setSelectedLead(lead); setIsDetailsOpen(true); }}
                    className="hover:bg-accent transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-semibold text-sm text-foreground">
                        {lead.firstName} {lead.lastName}
                      </p>
                      {lead.contactNumber && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone size={10} /> {lead.contactNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-muted-foreground">{lead.businessType}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-muted-foreground">{lead.leadSource}</span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold text-white"
                        style={{ backgroundColor: lead.status.color ?? '#64748b' }}
                      >
                        {lead.status.name}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {lead.assignedAgent?.name ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="text-sm text-muted-foreground">
                        {new Date(lead.createdAt).toLocaleDateString('en-PH', {
                          month: 'short', day: 'numeric', year: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => { setSelectedLead(lead); setIsDetailsOpen(true); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
                        title="Open"
                      >
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSaved={handleLeadSaved}
      />

      <LeadDetailModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        lead={selectedLead}
        statuses={statuses}
        onUpdated={handleLeadUpdated}
        onDeleted={handleLeadDeleted}
      />
    </div>
  );
}