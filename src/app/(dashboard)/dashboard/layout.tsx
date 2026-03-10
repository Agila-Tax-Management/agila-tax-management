'use client';

import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Clock, FileBadge, SendHorizontal,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Menu, User,
  ChevronDown, ChevronUp, Briefcase, BarChart3, ShieldCheck, Building2, UserCheck, Megaphone
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { RoleProvider } from '@/lib/role-context';


const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/timesheet',  label: 'Timesheet',   icon: Clock },
  { href: '/dashboard/payslips',   label: 'Payslip',     icon: FileBadge },
  { href: '/dashboard/hr-apps',    label: 'Application', icon: SendHorizontal },
];

const PORTAL_ITEMS = [
  { href: '/portal/sales', label: 'Agila Sales Portal', icon: Megaphone },
  { href: '/portal/compliance', label: 'Agila Compliance Portal', icon: ShieldCheck },
  { href: '/portal/liaison', label: 'Agila Liaison Portal', icon: Building2 },
  { href: '/portal/accounting', label: 'Agila Accounting Portal', icon: BarChart3 },
  { href: '/portal/account-officer', label: 'Agila Account Officer Portal', icon: Briefcase },
  { href: '/portal/hr', label: 'Agila HR Portal', icon: UserCheck },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const router = useRouter();

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar
          isOpen={sidebarOpen}
          isExpanded={sidebarExpanded}
          onClose={() => setSidebarOpen(false)}
          onToggleExpand={() => setSidebarExpanded(prev => !prev)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={20} />
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

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
            {children}
          </main>
        </div>
      </div>
    </RoleProvider>
  );
}

/* ─── Sidebar ─────────────────────────────────────────────────────── */

interface SidebarProps {
  isOpen: boolean;
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}


function Sidebar({ isOpen, isExpanded, onClose, onToggleExpand }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [logoHovered, setLogoHovered] = useState(false);
  const [portalOpen, setPortalOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  const navigate = (href: string) => {
    router.push(href);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 lg:static
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${isExpanded ? 'w-64' : 'w-20'}
          bg-slate-900 text-white transition-all duration-300 flex flex-col h-screen shadow-2xl
        `}
      >
        {/* Header */}
        <div
          className={`p-5 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} shrink-0 border-b border-slate-800`}
          onMouseEnter={() => !isExpanded && setLogoHovered(true)}
          onMouseLeave={() => !isExpanded && setLogoHovered(false)}
        >
          {isExpanded ? (
            <>
              <div className="flex items-center gap-3">
                <Image src="/images/agila_logo.webp" alt="ATMS" width={36} height={36} className="shrink-0 rounded-sm" />
                <div>
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-tight leading-none">Agila Tax</h2>
                  <p className="text-[9px] text-blue-400 font-semibold uppercase tracking-wider mt-0.5">Management Services</p>
                </div>
              </div>

              {/* Collapse / close buttons */}
              <button
                onClick={isOpen ? onClose : onToggleExpand}
                className="flex items-center justify-center w-7 h-7 rounded-md border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition lg:flex"
                title={isOpen ? 'Close' : 'Collapse sidebar'}
              >
                {isOpen ? <X size={16} /> : <ChevronLeft size={16} />}
              </button>
            </>
          ) : (
            <div className="relative">
              <Image src="/images/agila_logo.webp" alt="ATMS" width={30} height={30} className="rounded-sm" />
              {logoHovered && (
                <button
                  onClick={onToggleExpand}
                  className="hidden lg:flex items-center justify-center w-6 h-6 rounded-md absolute -right-8 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
                  title="Expand sidebar"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto pb-6">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <button
                key={href}
                onClick={() => navigate(href)}
                className={`
                  w-full flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center'} 
                  p-3 rounded-xl transition-all duration-200
                  ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
                `}
                title={!isExpanded ? label : undefined}
              >
                <Icon size={20} className="shrink-0" />
                {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">{label}</span>}
              </button>
            );
          })}

          {/* Portal Dropdown */}
          <div className="relative">
            <button
              onClick={() => setPortalOpen((open) => !open)}
              className={`w-full flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center'} p-3 rounded-xl transition-all duration-200 text-slate-400 hover:bg-slate-800 hover:text-white`}
              title={!isExpanded ? 'Portals' : undefined}
            >
              <span className="shrink-0"><Briefcase size={20} /></span>
              {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">Portals</span>}
              {isExpanded && (
                <span className="ml-auto">
                  {portalOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              )}
            </button>
            {portalOpen && isExpanded && (
              <div className="ml-8 mt-1 space-y-1">
                {PORTAL_ITEMS.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition text-left ${isActive(href) ? 'bg-blue-700 text-white' : ''}`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span className="text-sm">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 shrink-0 space-y-1">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className={`flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center'} p-3 w-full rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition`}
            title={!isExpanded ? 'Settings' : undefined}
          >
            <Settings size={20} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button
            onClick={() => router.push('/')}
            className={`flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center'} p-3 w-full rounded-xl text-red-400 hover:bg-red-900/20 transition`}
            title={!isExpanded ? 'Sign Out' : undefined}
          >
            <LogOut size={20} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
