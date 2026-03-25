// src/components/client-gateway/ClientViewModal.tsx
'use client';

import React, { useState } from 'react';
import {
  X, Phone, Mail, Building2, User, MapPin, FileText,
  Printer, Edit, Download, ExternalLink, Tag,
} from 'lucide-react';
import type { GatewayClient } from '@/lib/mock-client-gateway-data';

type ViewTab = 'contact' | 'business' | 'personas' | 'place' | 'bir';

interface ClientViewModalProps {
  client: GatewayClient | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (client: GatewayClient) => void;
}

const STATUS_STYLES: Record<string, string> = {
  Active:    'bg-emerald-100 text-emerald-700',
  Inactive:  'bg-slate-100 text-slate-600',
  Suspended: 'bg-red-100 text-red-700',
};

const TAB_LIST: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
  { id: 'contact',   label: 'Contact Info',        icon: <Phone size={14} /> },
  { id: 'business',  label: 'Business Details',     icon: <Building2 size={14} /> },
  { id: 'personas',  label: 'Related Personas',     icon: <User size={14} /> },
  { id: 'place',     label: 'Place of Business',    icon: <MapPin size={14} /> },
  { id: 'bir',       label: 'BIR Details',          icon: <FileText size={14} /> },
];

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide sm:w-44 shrink-0">{label}</span>
      <span className="text-sm text-slate-700 font-medium flex-1">{value}</span>
    </div>
  );
}

export function ClientViewModal({ client, isOpen, onClose, onEdit }: ClientViewModalProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('contact');

  if (!isOpen || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between shrink-0 bg-linear-to-r from-[#25238e]/5 to-transparent">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-lg font-black text-slate-900">{client.businessName}</h2>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[client.status]}`}>
                {client.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {client.clientNumber} &nbsp;·&nbsp; {client.companyCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap shrink-0 bg-slate-50">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <Printer size={13} /> Print
          </button>
          <button
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <Download size={13} /> Generate Document
          </button>
          <a
            href={client.portalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-white hover:shadow-sm transition-all"
          >
            <ExternalLink size={13} /> Portal Link
          </a>
          <div className="flex-1" />
          <button
            onClick={() => onEdit(client)}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-[#25238e] text-white rounded-lg hover:bg-[#1e1c7a] transition-colors shadow-sm shadow-[#25238e]/20"
          >
            <Edit size={13} /> Edit / Update
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 border-b border-slate-200 shrink-0">
          <div className="flex gap-0 overflow-x-auto">
            {TAB_LIST.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-[#25238e] text-[#25238e]'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">

          {activeTab === 'contact' && (
            <div>
              <InfoRow label="Primary Contact" value={client.primaryContactName} />
              <InfoRow label="Email" value={
                <a href={`mailto:${client.primaryContactEmail}`} className="text-blue-600 hover:underline flex items-center gap-1">
                  <Mail size={12} /> {client.primaryContactEmail}
                </a>
              } />
              <InfoRow label="Phone" value={
                <span className="flex items-center gap-1">
                  <Phone size={12} className="text-slate-400" /> {client.primaryContactPhone}
                </span>
              } />
              {client.alternatePhone && (
                <InfoRow label="Alternate Phone" value={
                  <span className="flex items-center gap-1">
                    <Phone size={12} className="text-slate-400" /> {client.alternatePhone}
                  </span>
                } />
              )}
            </div>
          )}

          {activeTab === 'business' && (
            <div>
              <InfoRow label="Business Name"   value={client.businessName} />
              <InfoRow label="Business Type"   value={client.businessType} />
              <InfoRow label="Industry"         value={client.industry} />
              <InfoRow label="TIN"              value={
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{client.taxIdentificationNumber}</span>
              } />
              <InfoRow label="Date Registered" value={new Date(client.dateOfRegistration).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <InfoRow label="Service Plan"    value={
                <span className="flex items-center gap-1.5">
                  <Tag size={12} className="text-[#25238e]" /> {client.servicePlan}
                </span>
              } />
              <InfoRow label="Company Code"    value={client.companyCode} />
              <InfoRow label="Client Number"   value={client.clientNumber} />
            </div>
          )}

          {activeTab === 'personas' && (
            <div className="space-y-4">
              {client.personas.map((p) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#25238e]/10 flex items-center justify-center shrink-0">
                      <User size={16} className="text-[#25238e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">{p.role}</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Mail size={11} className="text-slate-400" />
                          <a href={`mailto:${p.email}`} className="text-blue-600 hover:underline">{p.email}</a>
                        </p>
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <Phone size={11} className="text-slate-400" /> {p.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'place' && (
            <div>
              <InfoRow label="Street Address" value={client.streetAddress} />
              <InfoRow label="Barangay"       value={client.barangay} />
              <InfoRow label="City"           value={client.city} />
              <InfoRow label="Province"       value={client.province} />
              <InfoRow label="Zip Code"       value={client.zipCode} />
              <InfoRow label="Full Address"   value={
                <span className="text-slate-600">
                  {client.streetAddress}, {client.barangay}, {client.city}, {client.province} {client.zipCode}
                </span>
              } />
            </div>
          )}

          {activeTab === 'bir' && (
            <div>
              <InfoRow label="BIR Reg. Number"  value={
                <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs">{client.birRegistrationNumber}</span>
              } />
              <InfoRow label="BIR Reg. Date"    value={new Date(client.birRegistrationDate).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })} />
              <InfoRow label="Tax Type"          value={
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${client.taxType === 'VAT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                  {client.taxType}
                </span>
              } />
              <InfoRow label="Revenue District" value={client.rdo} />
              <InfoRow label="BIR Forms Filed"  value={
                <div className="flex flex-wrap gap-1.5 mt-0.5">
                  {client.birFormsSeries.map((form) => (
                    <span key={form} className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
                      {form}
                    </span>
                  ))}
                </div>
              } />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
