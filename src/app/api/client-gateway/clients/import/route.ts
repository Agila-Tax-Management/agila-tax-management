// src/app/api/client-gateway/clients/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import { revalidateTag } from 'next/cache';

const VALID_ENTITIES = [
  'INDIVIDUAL',
  'SOLE_PROPRIETORSHIP',
  'PARTNERSHIP',
  'CORPORATION',
  'COOPERATIVE',
] as const;

const VALID_BRANCH_TYPES = ['MAIN', 'BRANCH'] as const;

/** Schema for a single imported row (after parsing from XLSX) */
const rowSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  businessEntity: z
    .string()
    .transform((v) => v.toUpperCase().replace(/\s+/g, '_'))
    .pipe(z.enum(VALID_ENTITIES)),
  portalName: z.string().min(1, 'Portal name is required'),
  branchType: z
    .string()
    .optional()
    .transform((v) => (v ? v.toUpperCase() : 'MAIN'))
    .pipe(z.enum(VALID_BRANCH_TYPES)),
  clientNo: z.string().optional().nullable(),
  companyCode: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  ownerEmail: z.string().email().optional().nullable().or(z.literal('')),
});

export type ImportRowResult = {
  row: number;
  businessName: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
};

/**
 * POST /api/client-gateway/clients/import
 * Accepts a multipart/form-data body with a single `file` field (XLSX).
 * Returns a JSON summary of each row.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid multipart body' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 });
  }

  const XLSX = await import('xlsx');

  let rows: Record<string, unknown>[];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error('Empty workbook');
    const ws = wb.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws ?? {});
  } catch {
    return NextResponse.json({ error: 'Could not parse the XLSX file.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'The spreadsheet has no data rows.' }, { status: 400 });
  }

  if (rows.length > 500) {
    return NextResponse.json({ error: 'Max 500 rows per import.' }, { status: 400 });
  }

  /** Normalise a cell value — XLSX may give numbers, booleans, etc. */
  function cell(row: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const raw = row[key];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return String(raw).trim();
      }
    }
    return null;
  }

  const results: ImportRowResult[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]!;
    const rowNum = i + 2; // 1-based + header

    const rawData = {
      businessName: cell(rawRow, 'Business Name', 'businessName') ?? '',
      businessEntity: cell(rawRow, 'Business Entity', 'businessEntity') ?? '',
      portalName: cell(rawRow, 'Portal Name', 'portalName') ?? '',
      branchType: cell(rawRow, 'Branch Type', 'branchType') ?? 'MAIN',
      clientNo: cell(rawRow, 'Client #', 'clientNo'),
      companyCode: cell(rawRow, 'Company Code', 'companyCode'),
      ownerName: cell(rawRow, 'Owner Name', 'ownerName'),
      ownerEmail: cell(rawRow, 'Owner Email', 'ownerEmail'),
    };

    const parsed = rowSchema.safeParse(rawData);
    if (!parsed.success) {
      results.push({
        row: rowNum,
        businessName: rawData.businessName || `Row ${rowNum}`,
        status: 'error',
        error: parsed.error.issues[0]?.message ?? 'Validation failed',
      });
      continue;
    }

    const d = parsed.data;

    // Skip duplicate portalName
    const existing = await prisma.client.findFirst({
      where: { portalName: d.portalName },
      select: { id: true },
    });
    if (existing) {
      results.push({
        row: rowNum,
        businessName: d.businessName,
        status: 'skipped',
        error: `Portal name "${d.portalName}" already exists`,
      });
      continue;
    }

    try {
      await prisma.client.create({
        data: {
          businessName: d.businessName,
          businessEntity: d.businessEntity,
          portalName: d.portalName,
          branchType: d.branchType,
          clientNo: d.clientNo ?? undefined,
          companyCode: d.companyCode ?? undefined,
          active: true,
        },
      });
      imported++;
      results.push({ row: rowNum, businessName: d.businessName, status: 'ok' });
    } catch {
      results.push({
        row: rowNum,
        businessName: d.businessName,
        status: 'error',
        error: 'Database insert failed',
      });
    }
  }

  revalidateTag('client-gateway-clients', 'max');

  void logActivity({
    userId: session.user.id,
    action: 'IMPORTED',
    entity: 'Client',
    entityId: 'bulk',
    description: `Imported ${imported} of ${rows.length} clients from XLSX`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      total: rows.length,
      imported,
      errors: results.filter((r) => r.status === 'error').length,
      skipped: results.filter((r) => r.status === 'skipped').length,
      results,
    },
  });
}
