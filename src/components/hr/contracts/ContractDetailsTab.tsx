// src/components/hr/contracts/ContractDetailsTab.tsx
'use client';

import React, { useState } from 'react';
import { FileText, Upload, Eye, Trash2 } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';

interface ContractDocument {
  id: string;
  name: string;
  type: string;
  uploadedDate: string;
  size: string;
}

const MOCK_DOCUMENTS: ContractDocument[] = [
  { id: 'doc-1', name: 'Employment_Contract_Template.pdf', type: 'Contract Template', uploadedDate: '2025-01-15', size: '245 KB' },
  { id: 'doc-2', name: 'New_Hire_Contract_2025.pdf', type: 'New Contract Document', uploadedDate: '2025-03-01', size: '312 KB' },
];

const selectClass = 'w-full rounded-lg border border-border px-3 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30 appearance-none';

export function ContractDetailsTab() {
  const [contractTemplate, setContractTemplate] = useState('Standard Employment Contract');
  const [newContractTemplate, setNewContractTemplate] = useState('New Hire Package');
  const [updateTemplate, setUpdateTemplate] = useState('Contract Amendment Form');
  const [documents, setDocuments] = useState<ContractDocument[]>(MOCK_DOCUMENTS);

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card className="p-6 space-y-5">
        <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contract Templates</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contract Template</label>
            <select className={selectClass} value={contractTemplate} onChange={e => setContractTemplate(e.target.value)}>
              <option>Standard Employment Contract</option>
              <option>Probationary Contract</option>
              <option>Project-Based Contract</option>
              <option>Consultant Agreement</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">New Contract Document Template</label>
            <select className={selectClass} value={newContractTemplate} onChange={e => setNewContractTemplate(e.target.value)}>
              <option>New Hire Package</option>
              <option>Regularization Contract</option>
              <option>Promotion Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Contract Update Document Template</label>
            <select className={selectClass} value={updateTemplate} onChange={e => setUpdateTemplate(e.target.value)}>
              <option>Contract Amendment Form</option>
              <option>Salary Adjustment Form</option>
              <option>Position Change Form</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Uploaded Documents */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Contract Documents</h3>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2 text-xs">
            <Upload size={14} /> Upload Document
          </Button>
        </div>

        {documents.length > 0 ? (
          <div className="divide-y divide-border">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                    <FileText size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                    <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.size} · {doc.uploadedDate}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" className="p-1.5 h-auto"><Eye size={14} /></Button>
                  <Button variant="ghost" className="p-1.5 h-auto text-red-500" onClick={() => setDocuments(prev => prev.filter(d => d.id !== doc.id))}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <FileText size={32} className="mx-auto mb-2 opacity-30" />
            No documents uploaded yet.
          </div>
        )}
      </Card>
    </div>
  );
}
