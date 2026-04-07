'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ComplianceSidebar } from '@/components/compliance/ComplianceSidebar';
import { AppHeader } from '@/components/UI/AppHeader';
import { Button } from '@/components/UI/button';
import { PortalBreadcrumb } from '@/components/UI/PortalBreadcrumb';
import { RoleProvider } from '@/lib/role-context';
import { ArrowLeft } from 'lucide-react';

export default function CompliancePortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const moduleRoot = '/portal/compliance';
  const isRoot = pathname === moduleRoot;

  useEffect(() => {
    document.title = 'Compliance Portal | Agila Tax Management System';
  }, []);

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <ComplianceSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader
            onMenuOpen={() => setIsSidebarOpen(true)}
            leftContent={
              <>
                <Button
                  variant="ghost"
                  onClick={() => isRoot ? router.push('/dashboard') : router.back()}
                  className="hidden sm:inline-flex"
                >
                  <ArrowLeft size={16} className="mr-1" /> {isRoot ? 'Main Hub' : 'Back'}
                </Button>
                <span className="hidden sm:block text-muted-foreground/40 select-none">|</span>
                <div className="hidden sm:flex min-w-0">
                  <PortalBreadcrumb />
                </div>
              </>
            }
          />

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}
