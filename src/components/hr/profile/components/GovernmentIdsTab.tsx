// src/components/hr/profile/components/GovernmentIdsTab.tsx
'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import type { GovernmentIdsState } from '../profile-types';

interface GovernmentIdsTabProps {
  governmentIds: GovernmentIdsState;
  inputClass: string;
  onFieldChange: <K extends keyof GovernmentIdsState>(key: K, value: GovernmentIdsState[K]) => void;
  onSave: () => void;
}

export function GovernmentIdsTab({ governmentIds, inputClass, onFieldChange, onSave }: GovernmentIdsTabProps): React.ReactNode {
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">Government IDs</h2>
        <p className="text-sm text-muted-foreground mt-1">Maintain employee statutory registration information.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">SSS</label>
          <input type="text" className={inputClass} value={governmentIds.sss} onChange={(event) => onFieldChange('sss', event.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PagIBIG</label>
          <input type="text" className={inputClass} value={governmentIds.pagibig} onChange={(event) => onFieldChange('pagibig', event.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">PhilHealth</label>
          <input type="text" className={inputClass} value={governmentIds.philhealth} onChange={(event) => onFieldChange('philhealth', event.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">TIN</label>
          <input type="text" className={inputClass} value={governmentIds.tin} onChange={(event) => onFieldChange('tin', event.target.value)} />
        </div>
      </div>

      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={onSave}>
          <Save size={16} /> Save
        </Button>
      </div>
    </Card>
  );
}
