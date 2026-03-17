// src/app/(dashboard)/dashboard/settings/layout.tsx
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, Building2, Settings, UserCheck } from 'lucide-react';

const SETTINGS_TABS = [
  { href: '/dashboard/settings/user-management', label: 'User Management', icon: Users },
  { href: '/dashboard/settings/user-client-management', label: 'User Client Management', icon: UserCheck },
  { href: '/dashboard/settings/client-management', label: 'Client Management', icon: Building2 },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/10 text-blue-600">
            <Settings size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-sm text-muted-foreground">Manage users, clients, and system preferences</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-border">
        <nav className="flex gap-1">
          {SETTINGS_TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}
                `}
              >
                <Icon size={18} />
                {label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {children}
    </div>
  );
}
