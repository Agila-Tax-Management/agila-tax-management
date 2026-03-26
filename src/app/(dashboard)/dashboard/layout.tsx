'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard, Clock, FileBadge, SendHorizontal,
  Settings, LogOut, ChevronLeft, ChevronRight, X, Menu,
  ChevronDown, Briefcase, BarChart3, ShieldCheck, Building2, UserCheck, Megaphone,
  Sun, Moon
} from 'lucide-react';
import { Button } from '@/components/UI/button';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { RoleProvider } from '@/lib/role-context';
import { AuthProvider } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authClient } from '@/lib/auth-client';


function HeaderAvatar({ onClick }: { onClick: () => void }) {
  const { data: sessionData } = authClient.useSession();
  const name = sessionData?.user?.name ?? '';
  const image = (sessionData?.user as { image?: string | null } | undefined)?.image ?? null;
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  return (
    <button
      onClick={onClick}
      title="Profile"
      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white text-sm font-semibold shrink-0 hover:ring-2 hover:ring-blue-400 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {image ? (
        <Image
          src={image}
          alt={name || 'Profile'}
          width={36}
          height={36}
          className="object-cover w-full h-full"
        />
      ) : (
        initials
      )}
    </button>
  );
}

const NAV_ITEMS = [
  { href: '/dashboard',                   label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/dashboard/timesheet',         label: 'Timesheet',   icon: Clock },
  { href: '/dashboard/payslips',          label: 'Payslip',     icon: FileBadge },
  { href: '/dashboard/hr-apps',            label: 'Application', icon: SendHorizontal },
];

const PORTAL_ITEMS = [
  { href: '/portal/sales',           label: 'Sales',           icon: Megaphone  },
  { href: '/portal/compliance',      label: 'Compliance',      icon: ShieldCheck },
  { href: '/portal/liaison',         label: 'Liaison',         icon: Building2  },
  { href: '/portal/accounting',      label: 'Accounting',      icon: BarChart3  },
  { href: '/portal/account-officer', label: 'Account Officer', icon: Briefcase  },
  { href: '/portal/hr',              label: 'HR',              icon: UserCheck  },
  { href: '/portal/task-management', label: 'Task Management', icon: UserCheck  },
  { href: '/portal/operation',       label: 'Operations',       icon: Building2  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen]       = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  /* eslint-disable react-hooks/set-state-in-effect -- Hydration-safe: sets document.title based on pathname */
  useEffect(() => {
    const titleMap: Record<string, string> = {
      '/dashboard':                                        'Dashboard | Agila Tax Management System',
      '/dashboard/timesheet':                              'Timesheet | Agila Tax Management System',
      '/dashboard/payslips':                               'Payslips | Agila Tax Management System',
      '/dashboard/payslips/compensation':                  'Compensation | Agila Tax Management System',
      '/dashboard/payslips/computation':                   'Payroll Computation | Agila Tax Management System',
      '/dashboard/payslips/schedule':                      'Pay Schedule | Agila Tax Management System',
      '/dashboard/hr-apps':                                'HR Applications | Agila Tax Management System',
      '/dashboard/hr':                                     'HR | Agila Tax Management System',
      '/dashboard/notifications':                          'Notifications | Agila Tax Management System',
      '/dashboard/profile':                                'My Profile | Agila Tax Management System',
      '/dashboard/sop':                                    'SOP | Agila Tax Management System',
      '/dashboard/admin':                                  'Admin | Agila Tax Management System',
      '/dashboard/clients':                                'Clients | Agila Tax Management System',
      '/dashboard/quick-links':                            'Quick Links | Agila Tax Management System',
      '/dashboard/quick-links/book-appointment':           'Book Appointment | Agila Tax Management System',
      '/dashboard/quick-links/salary-computation':         'Salary Computation | Agila Tax Management System',
      '/dashboard/settings':                               'Settings | Agila Tax Management System',
      '/dashboard/settings/user-management':               'User Management | Agila Tax Management System',
      '/dashboard/settings/user-client-management':        'Client User Management | Agila Tax Management System',
      '/dashboard/settings/client-management':             'Client Management | Agila Tax Management System',
    };
    const matched = Object.keys(titleMap)
      .sort((a, b) => b.length - a.length)
      .find(key => pathname === key || pathname.startsWith(key + '/'));
    document.title = matched ? titleMap[matched] : 'Dashboard | Agila Tax Management System';
  }, [pathname]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <RoleProvider>
      <AuthProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          isExpanded={sidebarExpanded}
          onClose={() => setSidebarOpen(false)}
          onToggleExpand={() => setSidebarExpanded(prev => !prev)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="bg-header border-b border-header-border px-6 py-4 flex items-center justify-between shrink-0 z-30 shadow-sm">
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
              <Button
                variant="ghost"
                onClick={toggleTheme}
                className="rounded-xl text-muted-foreground hover:text-foreground"
                title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </Button>
              <NotificationDropdown />
              <HeaderAvatar onClick={() => router.push('/dashboard/profile')} />
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {children}
          </main>
        </div>
      </div>
      </AuthProvider>
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
          bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col h-screen shadow-2xl
        `}
      >
        {/* Header */}
        <div
          className={`p-5 flex items-center ${isExpanded ? 'justify-between' : 'justify-center'} shrink-0 border-b border-sidebar-border`}
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
                className="flex items-center justify-center w-7 h-7 rounded-md border border-sidebar-border text-slate-400 hover:bg-slate-800 hover:text-white transition lg:flex"
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
        <nav className="flex-1 px-3 mt-4 space-y-1 overflow-y-auto pb-6 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
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
          <div>
            <button
              onClick={() => setPortalOpen((open) => !open)}
              className={`w-full flex items-center ${
                isExpanded ? 'gap-3 px-3' : 'justify-center'
              } p-3 rounded-xl transition-all duration-200 ${
                portalOpen
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!isExpanded ? 'Portals' : undefined}
            >
              <span className="shrink-0"><Briefcase size={20} /></span>
              {isExpanded && <span className="font-semibold text-sm whitespace-nowrap">Portals</span>}
              {isExpanded && (
                <span className="ml-auto transition-transform duration-200" style={{ transform: portalOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                  <ChevronDown size={16} />
                </span>
              )}
            </button>

            {portalOpen && isExpanded && (
              <div className="mt-1 mx-1 rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
                {PORTAL_ITEMS.map(({ href, label, icon: Icon }) => (
                  <button
                    key={href}
                    onClick={() => navigate(href)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                      isActive(href)
                        ? 'bg-blue-600/80 text-white'
                        : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
                    }`}
                  >
                    <Icon size={15} className="shrink-0" />
                    <span className="text-[13px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border shrink-0 space-y-1">
          <button
            onClick={() => navigate('/dashboard/settings')}
            className={`flex items-center ${isExpanded ? 'gap-3 px-3' : 'justify-center'} p-3 w-full rounded-xl transition
              ${pathname.startsWith('/dashboard/settings')
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            title={!isExpanded ? 'Settings' : undefined}
          >
            <Settings size={20} className="shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button
            onClick={async () => {
              await authClient.signOut();
              router.push('/sign-in');
            }}
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
