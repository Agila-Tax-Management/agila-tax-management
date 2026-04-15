// src/components/account-officer/AOPaymentMonitoring.tsx
'use client';

import React from 'react';
import { Card } from '@/components/UI/Card';

export function AOPaymentMonitoring(): React.ReactNode {
  return (
    <div className="p-6">
      <Card>
        <div className="p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Payment Monitoring</h2>
          <p className="text-muted-foreground">
            Account Officer payment monitoring feature coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
