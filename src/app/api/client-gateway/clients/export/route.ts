// src/app/api/client-gateway/clients/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import { getClientGatewayClients } from '@/lib/data/client-gateway/clients';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

/**
 * GET /api/client-gateway/clients/export?format=xlsx|sql
 * Downloads all clients as an XLSX spreadsheet or SQL INSERT script.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const format = request.nextUrl.searchParams.get('format') ?? 'xlsx';
  if (format !== 'xlsx' && format !== 'sql') {
    return NextResponse.json({ error: 'Invalid format. Use xlsx or sql.' }, { status: 400 });
  }

  const clients = await getClientGatewayClients();

  void logActivity({
    userId: session.user.id,
    action: 'EXPORTED',
    entity: 'Client',
    entityId: 'bulk',
    description: `Exported ${clients.length} clients as ${format.toUpperCase()}`,
    ...getRequestMeta(request),
  });

  if (format === 'sql') {
    const rows = clients.map((c) => {
      const esc = (v: string | null) =>
        v === null ? 'NULL' : `'${v.replace(/'/g, "''")}'`;
      return (
        `INSERT INTO "Client" ("companyCode","clientNo","businessName","portalName","businessEntity","branchType","active","createdAt") ` +
        `VALUES (${esc(c.companyCode)},${esc(c.clientNo)},${esc(c.businessName)},${esc(c.portalName)},` +
        `'${c.businessEntity}','${c.branchType}',${c.active},${esc(c.createdAt)});`
      );
    });

    const sql = [
      '-- Client Gateway Export',
      `-- Generated: ${new Date().toISOString()}`,
      `-- Total records: ${clients.length}`,
      '',
      ...rows,
    ].join('\n');

    return new NextResponse(sql, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="clients-export-${Date.now()}.sql"`,
      },
    });
  }

  // XLSX export
  const XLSX = await import('xlsx');

  const data = clients.map((c) => ({
    'Client #': c.clientNo ?? '',
    'Business Name': c.businessName,
    'Company Code': c.companyCode ?? '',
    'Business Entity': c.businessEntity.replace(/_/g, ' '),
    'Branch Type': c.branchType,
    'Portal Name': c.portalName,
    Status: c.active ? 'Active' : 'Inactive',
    'Owner Name': c.ownerName ?? '',
    'Owner Email': c.ownerEmail ?? '',
    'Date Added': new Date(c.createdAt).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  }));

  const ws = XLSX.utils.json_to_sheet(data);

  // Column widths
  ws['!cols'] = [
    { wch: 14 }, // Client #
    { wch: 40 }, // Business Name
    { wch: 16 }, // Company Code
    { wch: 22 }, // Business Entity
    { wch: 14 }, // Branch Type
    { wch: 28 }, // Portal Name
    { wch: 10 }, // Status
    { wch: 30 }, // Owner Name
    { wch: 34 }, // Owner Email
    { wch: 20 }, // Date Added
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clients');

  const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="clients-export-${Date.now()}.xlsx"`,
    },
  });
}
