// src/components/account-officer/AONotifications.tsx
'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';

export function AONotifications(): React.ReactNode {
  return (
    <div className="p-6">
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
          <p className="text-muted-foreground">
            Account Officer notifications feature coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
