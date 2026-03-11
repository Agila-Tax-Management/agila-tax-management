'use client';

import { useState, useMemo, JSX } from 'react';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/Input';
import {
  Search, Download, FileText, PieChart,
  BarChart2, Calendar, User,
  ArrowUpRight, FileSpreadsheet, Filter,
} from 'lucide-react';
import { MOCK_COMPLIANCE_CLIENTS } from '@/lib/mock-compliance-data';
import type { ClientPlanDetails } from '@/lib/types';

interface ComplianceStatus {
  bir?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  sec?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  mayorsPermit?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  dti?: 'COMPLIANT' | 'PENDING' | 'OVERDUE';
  birDeadline?: string;
  secDeadline?: string;
  mayorsPermitDeadline?: string;
  dtiDeadline?: string;
  [key: string]: unknown;
}

interface MonthPayment {
  month: string;
  paidDate: string | null;
  amount: number;
}

type ComplianceReportPlanDetails = Omit<ClientPlanDetails, 'basePlan'> & {
  basePlan?: string;
  _compliance?: ComplianceStatus;
  _payments?: MonthPayment[];
};

interface ClientData {
  id: string;
  clientNo: string;
  businessName: string;
  finalAmount?: number;
  createdAt: string;
  planDetails?: Partial<ComplianceReportPlanDetails> | null;
  status: string;
}

interface GeneratedReport {
  id: string;
  name: string;
  type: 'CSV';
  generatedBy: string;
  date: string;
  size: string;
  content: string;
}

// ── CSV Generators ────────────────────────────────────────────────────────────

const AGENCY_DEADLINE_MAP = [
  { key: 'bir',          label: 'BIR',            deadlineKey: 'birDeadline'          },
  { key: 'sec',          label: 'SEC',             deadlineKey: 'secDeadline'          },
  { key: 'mayorsPermit', label: "Mayor's Permit",  deadlineKey: 'mayorsPermitDeadline' },
  { key: 'dti',          label: 'DTI',             deadlineKey: 'dtiDeadline'          },
] as const;

function buildReport(name: string, header: string, rows: string[]): GeneratedReport {
  const content = [header, ...rows].join('\n');
  return {
    id: `R-${Date.now().toString(36).toUpperCase()}`,
    name,
    type: 'CSV',
    generatedBy: 'Compliance Team',
    date: new Date().toISOString().slice(0, 10),
    size: `${(content.length / 1024).toFixed(1)} KB`,
    content,
  };
}

function generateComplianceCSV(clients: ClientData[]): GeneratedReport {
  const label = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const header = 'Client No,Business Name,BIR,SEC,Mayor\'s Permit,DTI,BIR Deadline,SEC Deadline,Mayor\'s Permit Deadline,DTI Deadline';
  const rows = clients.map(c => {
    const cs: ComplianceStatus = c.planDetails?._compliance ?? {};
    return [
      c.clientNo,
      `"${c.businessName}"`,
      cs.bir ?? 'PENDING',
      cs.sec ?? 'PENDING',
      cs.mayorsPermit ?? 'PENDING',
      cs.dti ?? 'PENDING',
      cs.birDeadline ?? '',
      cs.secDeadline ?? '',
      cs.mayorsPermitDeadline ?? '',
      cs.dtiDeadline ?? '',
    ].join(',');
  });
  return buildReport(`Compliance Overview - ${label}`, header, rows);
}

function generateRevenueCSV(clients: ClientData[]): GeneratedReport {
  const label = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const header = 'Client No,Business Name,Monthly Rate (₱),Total Paid (₱),Status';
  const rows = clients.map(c => {
    const payments: MonthPayment[] = c.planDetails?._payments ?? [];
    const totalPaid = payments.filter(p => p.paidDate).reduce((s, p) => s + p.amount, 0);
    return [c.clientNo, `"${c.businessName}"`, c.finalAmount ?? 0, totalPaid, c.status].join(',');
  });
  return buildReport(`Revenue Analysis - ${label}`, header, rows);
}

function generateDeadlinesCSV(clients: ClientData[]): GeneratedReport {
  const label = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const header = 'Client No,Business Name,Agency,Status,Deadline';
  const rows: string[] = [];
  clients.forEach(c => {
    const cs: ComplianceStatus = c.planDetails?._compliance ?? {};
    AGENCY_DEADLINE_MAP.forEach(a => {
      const deadline = cs[a.deadlineKey];
      if (deadline) {
        const status = cs[a.key] ?? 'PENDING';
        rows.push([c.clientNo, `"${c.businessName}"`, a.label, status, deadline].join(','));
      }
    });
  });
  return buildReport(`Statutory Deadlines - ${label}`, header, rows);
}

function downloadCSV(report: GeneratedReport) {
  const blob = new Blob([report.content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.name}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ComplianceReports = (): JSX.Element => {
  const initialClients: ClientData[] = MOCK_COMPLIANCE_CLIENTS.map(c => ({
    id: c.id,
    clientNo: c.clientNo,
    businessName: c.businessName,
    finalAmount: c.finalAmount,
    createdAt: c.createdAt,
    planDetails: { ...c.planDetails, _compliance: c.complianceStatus },
    status: c.status,
  }));
  const [clients] = useState<ClientData[]>(initialClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [archive, setArchive] = useState<GeneratedReport[]>([]);

  const stats = useMemo(() => {
    let compliant = 0, pending = 0, overdue = 0;
    clients.forEach(c => {
      const cs: ComplianceStatus = c.planDetails?._compliance ?? {};
      AGENCY_DEADLINE_MAP.forEach(a => {
        const s = cs[a.key] ?? 'PENDING';
        if (s === 'COMPLIANT') compliant++;
        else if (s === 'OVERDUE') overdue++;
        else pending++;
      });
    });

    const totalRevenue = clients.reduce((sum, c) => {
      const payments: MonthPayment[] = c.planDetails?._payments ?? [];
      return sum + payments.filter(p => p.paidDate).reduce((s, p) => s + p.amount, 0);
    }, 0);

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let upcomingDeadlines = 0;
    clients.forEach(c => {
      const cs: ComplianceStatus = c.planDetails?._compliance ?? {};
      AGENCY_DEADLINE_MAP.forEach(a => {
        const d = cs[a.deadlineKey];
        if (d) {
          const dt = new Date(d);
          if (dt >= now && dt <= in30Days) upcomingDeadlines++;
        }
      });
    });

    return {
      compliant, pending, overdue, totalRevenue,
      upcomingDeadlines,
      activeClients: clients.filter(c => c.status === 'ACTIVE').length,
    };
  }, [clients]);

  const handleGenerate = (type: 'compliance' | 'revenue' | 'deadlines') => {
    const generators = {
      compliance: generateComplianceCSV,
      revenue:    generateRevenueCSV,
      deadlines:  generateDeadlinesCSV,
    };
    const report = generators[type](clients);
    setArchive(prev => [report, ...prev]);
    downloadCSV(report);
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

  const reportCards = [
    {
      type: 'compliance' as const,
      title: 'Compliance Overview',
      desc: 'Summary of all active client filings and health status.',
      icon: <PieChart size={24} className="text-blue-600" />,
      liveStats: [
        { label: 'Compliant', value: stats.compliant, color: 'text-emerald-600' },
        { label: 'Pending',   value: stats.pending,   color: 'text-amber-600'   },
        { label: 'Overdue',   value: stats.overdue,   color: 'text-red-600'     },
      ],
    },
    {
      type: 'revenue' as const,
      title: 'Revenue Analysis',
      desc: 'Detailed breakdown of tracked client revenue and fees.',
      icon: <BarChart2 size={24} className="text-emerald-600" />,
      liveStats: [
        { label: 'Total Collected', value: fmt(stats.totalRevenue),  color: 'text-emerald-600' },
        { label: 'Active Clients',  value: stats.activeClients,      color: 'text-blue-600'    },
      ],
    },
    {
      type: 'deadlines' as const,
      title: 'Statutory Deadlines',
      desc: 'Upcoming BIR, SEC, and LGU deadlines for all clients.',
      icon: <Calendar size={24} className="text-amber-600" />,
      liveStats: [
        { label: 'Due in 30 Days', value: stats.upcomingDeadlines, color: 'text-amber-600'  },
        { label: 'Total Clients',  value: clients.length,          color: 'text-slate-600'  },
      ],
    },
  ];

  const filtered = archive.filter(r =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Reports</h2>
        <p className="text-sm text-slate-500 mt-1">Generate and download compliance, revenue, and deadline reports.</p>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {reportCards.map((report, i) => (
          <Card key={i} className="p-8 border-none shadow-sm hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              {report.icon}
            </div>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">{report.title}</h4>
            <p className="text-sm text-slate-500 leading-relaxed mb-5">{report.desc}</p>
            <div className="flex gap-5 mb-5">
              {report.liveStats.map((s, si) => (
                <div key={si}>
                  <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
                </div>
              ))}
            </div>
            <Button
              variant="ghost"
              className="p-0 text-blue-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2"
              onClick={() => handleGenerate(report.type)}
            >
              Generate &amp; Download <ArrowUpRight size={14} />
            </Button>
          </Card>
        ))}
      </div>

      {/* Archive toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Generated Reports Archive</h3>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              className="pl-10 h-10 bg-white border-slate-200 rounded-xl shadow-sm"
              placeholder="Search archive..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200 bg-white">
            <Filter size={16} />
          </Button>
        </div>
      </div>

      {/* Archive table */}
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <FileText size={40} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-bold">No reports generated yet.</p>
            <p className="text-slate-400 text-xs mt-1">
              {searchTerm
                ? 'Try a different search term.'
                : 'Click "Generate & Download" on any card above.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="p-5">Report Name</th>
                  <th className="p-5">Type</th>
                  <th className="p-5">Generated By</th>
                  <th className="p-5">Date</th>
                  <th className="p-5">Size</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(report => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
                          <FileSpreadsheet size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{report.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{report.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-5">
                      <Badge variant="neutral" className="text-[9px] uppercase font-black">{report.type}</Badge>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={14} />
                        <span className="text-xs font-medium">{report.generatedBy}</span>
                      </div>
                    </td>
                    <td className="p-5">
                      <p className="text-xs font-bold text-slate-600">{report.date}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-xs text-slate-400">{report.size}</p>
                    </td>
                    <td className="p-5 text-right">
                      <Button
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                        title="Re-download"
                        onClick={() => downloadCSV(report)}
                      >
                        <Download size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
