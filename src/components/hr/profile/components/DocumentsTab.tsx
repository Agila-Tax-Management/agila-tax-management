// src/components/hr/profile/components/DocumentsTab.tsx
'use client';

import React, { useRef, useState } from 'react';
import { FileCheck2, FileWarning, Upload } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { DOCUMENT_LABELS, type DocumentLabel, type DocumentState } from '../profile-types';

interface DocumentsTabProps {
  documents: DocumentState;
  onUpload: (label: DocumentLabel, fileName?: string) => void;
}

export function DocumentsTab({ documents, onUpload }: DocumentsTabProps): React.ReactNode {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<DocumentLabel>('Resume');
  const [uploadTarget, setUploadTarget] = useState<DocumentLabel>('Resume');

  const openFilePicker = (label: DocumentLabel) => {
    setUploadTarget(label);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onUpload(uploadTarget, file.name);
    event.target.value = '';
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-foreground">Documents</h2>
          <p className="text-sm text-muted-foreground mt-1">Choose a requirement and upload a file for this employee profile.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-56"
            value={selectedLabel}
            onChange={(event) => setSelectedLabel(event.target.value as DocumentLabel)}
          >
            {DOCUMENT_LABELS.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
          <Button className="gap-2 bg-rose-600 text-white hover:bg-rose-700" onClick={() => openFilePicker(selectedLabel)}>
            <Upload size={16} /> Upload
          </Button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
      />

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {DOCUMENT_LABELS.map((label) => (
          <div key={label} className="flex flex-col gap-3 px-4 py-4 bg-background sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <Badge variant={documents[label] ? 'success' : 'warning'} className="text-[10px] uppercase tracking-wide">
                  {documents[label] ? 'Uploaded' : 'Missing'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{documents[label] ? documents[label] : 'No file uploaded'}</p>
            </div>
            <div className="flex items-center gap-2">
              {documents[label] ? (
                <FileCheck2 size={16} className="text-emerald-600" />
              ) : (
                <FileWarning size={16} className="text-amber-600" />
              )}
              <Button variant="outline" className="gap-2" onClick={() => openFilePicker(label)}>
                <Upload size={14} /> {documents[label] ? 'Replace' : 'Upload'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
