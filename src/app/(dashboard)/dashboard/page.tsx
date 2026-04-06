'use client';

import React, { useState, useEffect } from 'react';
import {
  Users, ChevronRight, ExternalLink, ArrowRight,
  ShieldCheck, Star, Settings, Clock, FileText,
  BarChart3, Briefcase, DollarSign, UserCheck, Building2,
  Globe, BookOpen, Megaphone, Zap, Receipt, Layers, Target, 
  Calculator, CalendarDays
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/* ─── Inline mock data ─────────────────────────────────────────── */

const EMPLOYEE_SERVICES = [
  { id: 'timesheet',   title: 'Timesheet',            description: 'Track daily attendance and clock in/out records.',       href: '/dashboard/timesheet',  icon: <Clock />,      color: 'bg-blue-600'   },
  { id: 'payslips',    title: 'Payslip',               description: 'View and download your salary breakdown.',              href: '/dashboard/payslips',   icon: <DollarSign />, color: 'bg-emerald-600' },
  { id: 'hr-apps',     title: 'HR Applications',       description: 'Submit leave, overtime, and other HR requests.',        href: '/dashboard/hr-apps',    icon: <FileText />,   color: 'bg-purple-600' },
];

const PORTALS = [
  { id: 'sales',      title: 'Sales Portal',         description: 'Manage leads, pipeline, and client engagements.',    href: '/portal/sales',      icon: <Megaphone />,   color: 'bg-rose-600',    stats: { label: 'Active Leads', value: '124' } },
  { id: 'accounting', title: 'ACF Portal',     description: 'Handle bookkeeping, invoices, and financial reports.',href: '/portal/accounting', icon: <BarChart3 />,   color: 'bg-blue-600',    stats: { label: 'Open Invoices', value: '38' } },
  { id: 'compliance', title: 'Compliance Portal',     description: 'Track BIR filings, permits, and regulatory tasks.',  href: '/portal/compliance', icon: <ShieldCheck />, color: 'bg-indigo-600',  stats: { label: 'Pending Filings', value: '7' } },
  { id: 'liaison',    title: 'Liaison Portal',        description: 'Coordinate government agency tasks and schedules.',  href: '/portal/liaison',    icon: <Building2 />,   color: 'bg-amber-600',   stats: { label: 'Active Tasks', value: '15' } },
  { id: 'hr',         title: 'HR Portal',             description: 'Manage employees, onboarding, and company policies.',href: '/portal/hr',         icon: <UserCheck />,   color: 'bg-teal-600',    stats: { label: 'Employees', value: '52' } },
  { id: 'ao',         title: 'Account Officer Portal', description: 'Oversee client accounts and service delivery.',     href: '/portal/account-officer', icon: <Briefcase />, color: 'bg-violet-600', stats: { label: 'Clients Managed', value: '86' } },
  { id: 'task-mgmt',  title: 'Task Management Portal', description: 'Unified view of liaison and compliance tasks.',      href: '/portal/task-management', icon: <Target />,    color: 'bg-teal-600',    stats: { label: 'Active Tasks',   value: '16' } },
  { id: 'crm',        title: 'Client Gateway System', description: 'Client portal and self-service gateway.',            href: '/portal/client-gateway',  icon: <Users />,     color: 'bg-blue-500',    stats: { label: 'Active Clients', value: '0' } },
  { id: 'operation',  title: 'Operations Portal',     description: 'Manage active clients, requirements, and operations tasks.', href: '/portal/operation', icon: <Zap />,       color: 'bg-amber-600',   stats: { label: 'Active Clients', value: '0' } },
];

const APP_SYSTEMS = [
  { id: 'sop',    title: 'Standard Operating Procedures (SOPPs)',   description: 'Company document storage',                href: '/dashboard/sop',      icon: <BookOpen />, color: 'bg-emerald-500' },
  { id: 'reports', title: 'Reports Engine',      description: 'Generate and export business reports',    href: '/dashboard/reports',   icon: <BarChart3 />,color: 'bg-purple-500' },
  { id: 'web',     title: 'Company Website',     description: 'Manage the public website',               href: 'https://agilaworkspace.com', icon: <Globe />, color: 'bg-slate-700', external: true },
];

const QUICK_LINKS = [
  { title: 'Quick Books', icon: <Receipt size={18} />, external: true, url: 'https://quickbooks.intuit.com/' },
  { title: 'Pancake', icon: <Layers size={18} />, external: true, url: 'https://pancake.io/' },
  { title: 'Clickup', icon: <Target size={18} />, external: true, url: 'https://clickup.com/' },
  { title: 'Salary Computation', icon: <Calculator size={18} />, external: false, href: '/dashboard/quick-links/salary-computation' },
  { title: 'Book Appointment', icon: <CalendarDays size={18} />, external: false, href: '/dashboard/quick-links/book-appointment' },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/* ─── Main Dashboard ───────────────────────────────────────────── */

export default function DashboardPage() {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Demo user data
  const displayName = 'User';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d: Date) => `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;

  const handleNav = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };


  return (
    <div className="space-y-10 max-w-360 mx-auto pb-16">
      {/* ── 1. Welcome ─────────────────────────────────── */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{formatDate(currentTime)}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Welcome back, <span className="text-blue-600">{displayName}</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Here&apos;s an overview of your workspace and portals.</p>
        </div>
        <button
          onClick={() => handleNav('/dashboard/timesheet')}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 h-10 text-sm shadow-sm transition-all active:scale-[0.97]"
        >
          Clock In <ArrowRight size={16} />
        </button>
      </section>

      {/* ── 2. Essential Services ─────────────────────────────── */}
      <div className="space-y-5">
        <SectionHeader icon={<Star size={14} className="text-blue-500" />} label="Essential Services" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {EMPLOYEE_SERVICES.map((svc, idx) => (
            <button
              key={svc.id}
              onClick={() => handleNav(svc.href)}
              className={`group relative text-left overflow-hidden rounded-2xl p-7 bg-card border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-56 ${idx === 0 ? 'md:col-span-2' : ''}`}
            >
              {/* Background icon */}
              <div className="absolute top-4 right-4 opacity-[0.04] group-hover:scale-110 transition-transform duration-700">
                {React.cloneElement(svc.icon as React.ReactElement<{ size?: number }>, { size: 130 })}
              </div>
              <div className="relative z-10">
                <div className={`${svc.color} w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-3 transition-transform`}>
                  {React.cloneElement(svc.icon as React.ReactElement<{ size?: number }>, { size: 24 })}
                </div>
                <h3 className="text-xl font-bold text-foreground mt-5 group-hover:text-blue-600 transition-colors">{svc.title}</h3>
                <p className="text-muted-foreground text-sm mt-1.5 max-w-xs">{svc.description}</p>
              </div>
              <div className="relative z-10 flex items-center gap-1.5 text-xs font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all mt-4">
                Open Module <ArrowRight size={14} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. Enterprise Portals ──────────────────────────── */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3">
          <div>
            <SectionHeader icon={<GridIcon size={14} className="text-indigo-500" />} label="Enterprise Portals" />
            <p className="text-foreground text-xl font-bold mt-1.5 tracking-tight">Agila Internal Portals</p>
          </div>
          <button className="text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PORTALS.map(portal => (
            <button
              key={portal.id}
              onClick={() => handleNav(portal.href)}
              className="group text-left bg-card rounded-2xl border border-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
            >
              <div className="p-7 flex flex-col justify-between h-full">
                <div className="flex justify-between items-start mb-8">
                  <div className={`${portal.color} w-14 h-14 rounded-2xl shadow-lg text-white flex items-center justify-center group-hover:rotate-3 group-hover:scale-105 transition-all`}>
                    {React.cloneElement(portal.icon as React.ReactElement<{ size?: number }>, { size: 28 })}
                  </div>
                  <div className="p-2.5 bg-muted rounded-full text-muted-foreground group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ExternalLink size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1.5">{portal.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{portal.description}</p>
                </div>
                <div className="mt-6 pt-5 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">{portal.stats.label}</p>
                    <p className="text-xl font-extrabold text-foreground mt-0.5">{portal.stats.value}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                    <ShieldCheck size={12} className="text-blue-500" /> Verified
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── 4. App Systems + Quick Links ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 border-t border-border">

        {/* Application Systems */}
        <section className="lg:col-span-7 space-y-5">
          <SectionHeader icon={<Settings size={14} />} label="Application Systems" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {APP_SYSTEMS.map(app => (
              <button
                key={app.id}
                onClick={() => handleNav(app.href)}
                className="group flex items-center gap-4 p-5 rounded-xl bg-card border border-border hover:border-blue-300 hover:shadow-lg transition-all text-left"
              >
                <div className={`${app.color} p-3.5 rounded-xl text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                  {React.cloneElement(app.icon as React.ReactElement<{ size?: number }>, { size: 22 })}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground group-hover:text-blue-600 transition-colors truncate">{app.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{app.description}</p>
                </div>
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-blue-600 shrink-0 transition-colors" />
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="lg:col-span-5 space-y-5">
          <SectionHeader icon={<Zap size={14} />} label="Quick Links" />
          <div className="bg-card rounded-2xl border border-border p-3 shadow-sm grid grid-cols-2 gap-1.5">
            {QUICK_LINKS.map(link => (
              <button
                key={link.title}
                onClick={() => handleNav((link.external ? link.url : link.href) ?? '#')}
                className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-muted transition group text-left"
              >
                <div className="w-9 h-9 bg-muted text-muted-foreground group-hover:bg-blue-600 group-hover:text-white rounded-lg flex items-center justify-center transition-all shrink-0">
                  {React.cloneElement(link.icon as React.ReactElement<{ size?: number }>, { size: 16 })}
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-foreground block truncate">{link.title}</span>
                  {link.external && <span className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5 block">External</span>}
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ─── Shared tiny components ───────────────────────────────────── */

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <h2 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 px-1">
      {icon} {label}
    </h2>
  );
}

function GridIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
