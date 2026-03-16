// src/components/hr/profile/components/AppAccessTab.tsx
'use client';

import React from 'react';
import { Landmark } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import type { AppAccessKey, AppAccessState } from '../profile-types';

interface AppAccessItem {
  key: AppAccessKey;
  label: string;
  description: string;
}

interface AppAccessTabProps {
  appAccess: AppAccessState;
  accessItems: AppAccessItem[];
  onToggleAccess: (key: AppAccessKey) => void;
  onSave: () => void;
}

export function AppAccessTab({ appAccess, accessItems, onToggleAccess, onSave }: AppAccessTabProps): React.ReactNode {
  return (
    <Card className="p-6 space-y-5">
      <div>
        <h2 className="text-lg font-black text-foreground">App Access</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage application access for this employee profile.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accessItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onToggleAccess(item.key)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              appAccess[item.key] ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-border bg-background text-foreground hover:bg-muted/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-xs mt-1 opacity-80">{item.description}</p>
              </div>
              <Badge variant={appAccess[item.key] ? 'success' : 'neutral'}>{appAccess[item.key] ? 'Enabled' : 'Disabled'}</Badge>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button className="bg-rose-600 hover:bg-rose-700 text-white gap-2" onClick={onSave}>
          <Landmark size={16} /> Save Access
        </Button>
      </div>
    </Card>
  );
}
