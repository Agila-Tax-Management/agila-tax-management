// src/app/(portal)/portal/task-management/layout.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TaskManagementSidebar } from '@/components/task-management/TaskManagementSidebar';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { Button } from '@/components/UI/button';
import { RoleProvider } from '@/lib/role-context';
import { Menu, User, ArrowLeft } from 'lucide-react';

export default function TaskManagementLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const moduleRoot = '/portal/task-management';
  const isRoot = pathname === moduleRoot;

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <TaskManagementSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={20} />
              </Button>
              <Button
                variant="ghost"
                onClick={() => isRoot ? router.push('/dashboard') : router.back()}
                className="hidden sm:inline-flex"
              >
                <ArrowLeft size={16} className="mr-1" /> {isRoot ? 'Main Hub' : 'Back'}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <NotificationDropdown />
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/profile')}
              >
                <User size={18} />
              </Button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
