// src/components/hr/contracts/PersonalDocumentsTab.tsx
'use client';

import React, { useState } from 'react';
import { FileText, Upload, Eye, Trash2, Image, File, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Badge } from '@/components/UI/Badge';

interface PersonalDocument {
  id: string;
  name: string;
  category: 'Government ID' | 'Employee Files' | 'Signed Contracts';
  uploadedDate: string;
  size: string;
  status: 'Verified' | 'Pending' | 'Expired';
}

const MOCK_PERSONAL_DOCS: PersonalDocument[] = [
  { id: 'pd-1', name: 'SSS_ID_Front.jpg', category: 'Government ID', uploadedDate: '2025-01-10', size: '1.2 MB', status: 'Verified' },
  { id: 'pd-2', name: 'PhilHealth_ID.jpg', category: 'Government ID', uploadedDate: '2025-01-10', size: '980 KB', status: 'Verified' },
  { id: 'pd-3', name: 'PagIBIG_ID.jpg', category: 'Government ID', uploadedDate: '2025-01-10', size: '1.1 MB', status: 'Pending' },
  { id: 'pd-4', name: 'TIN_Card.jpg', category: 'Government ID', uploadedDate: '2025-01-12', size: '850 KB', status: 'Verified' },
  { id: 'pd-5', name: 'NBI_Clearance.pdf', category: 'Employee Files', uploadedDate: '2025-01-15', size: '2.3 MB', status: 'Verified' },
  { id: 'pd-6', name: 'Medical_Certificate.pdf', category: 'Employee Files', uploadedDate: '2025-02-01', size: '1.5 MB', status: 'Expired' },
  { id: 'pd-7', name: 'Resume_2025.pdf', category: 'Employee Files', uploadedDate: '2025-01-08', size: '340 KB', status: 'Verified' },
  { id: 'pd-8', name: 'Employment_Contract_Signed.pdf', category: 'Signed Contracts', uploadedDate: '2025-01-20', size: '512 KB', status: 'Verified' },
  { id: 'pd-9', name: 'NDA_Agreement_Signed.pdf', category: 'Signed Contracts', uploadedDate: '2025-01-20', size: '280 KB', status: 'Verified' },
];

const STATUS_VARIANT: Record<PersonalDocument['status'], 'success' | 'warning' | 'danger'> = {
  Verified: 'success',
  Pending: 'warning',
  Expired: 'danger',
};

const CATEGORY_ICON: Record<PersonalDocument['category'], typeof FileText> = {
  'Government ID': ShieldCheck,
  'Employee Files': File,
  'Signed Contracts': FileText,
};

const CATEGORIES: PersonalDocument['category'][] = ['Government ID', 'Employee Files', 'Signed Contracts'];

export function PersonalDocumentsTab() {
  const [documents, setDocuments] = useState<PersonalDocument[]>(MOCK_PERSONAL_DOCS);
  const [activeCategory, setActiveCategory] = useState<PersonalDocument['category'] | 'All'>('All');

  const filtered = activeCategory === 'All' ? documents : documents.filter(d => d.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="p-6">
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-rose-300 transition-colors cursor-pointer">
          <Upload size={32} className="mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-semibold text-foreground">Drop files here or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">PDF, JPG, PNG up to 10 MB</p>
        </div>
      </Card>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('All')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            activeCategory === 'All'
              ? 'bg-rose-600 text-white'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({documents.length})
        </button>
        {CATEGORIES.map(cat => {
          const count = documents.filter(d => d.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? 'bg-rose-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Document List */}
      <Card className="overflow-hidden">
        <div className="divide-y divide-border">
          {filtered.map(doc => {
            const Icon = CATEGORY_ICON[doc.category];
            const isImage = /\.(jpg|jpeg|png|gif)$/i.test(doc.name);
            return (
              <div key={doc.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    isImage ? 'bg-blue-100 text-blue-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {isImage ? <Image size={16} /> : <Icon size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground">{doc.category} · {doc.size} · {doc.uploadedDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={STATUS_VARIANT[doc.status]}>{doc.status}</Badge>
                  <div className="flex gap-1">
                    <Button variant="ghost" className="p-1.5 h-auto"><Eye size={14} /></Button>
                    <Button variant="ghost" className="p-1.5 h-auto text-red-500" onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              No documents in this category.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
