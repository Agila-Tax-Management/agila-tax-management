// src/app/api/accounting/gl-accounts/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const rowSchema = z.object({
  accountCode: z.string().min(1, 'Account Code is required').max(20),
  name: z.string().min(1, 'Account Name is required').max(100),
  accountType: z.string().min(1, 'Account Type is required'),
  detailType: z.string().min(1, 'Detail Type is required'),
  description: z.string().optional().nullable(),
  openingBalance: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    }),
  isBankAccount: z
    .union([z.string(), z.boolean(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      return ['true', 'yes', '1', 'y'].includes(String(v).toLowerCase());
    }),
});

export type GlImportRowResult = {
  row: number;
  accountCode: string;
  status: 'ok' | 'error' | 'skipped';
  error?: string;
};

/**
 * POST /api/accounting/gl-accounts/import
 * Accepts multipart/form-data with a `file` field (CSV or XLSX).
 * Looks up AccountType and AccountDetailType by name.
 * Returns a JSON summary.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() });
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
    return NextResponse.json({ error: 'Could not parse the file. Use the provided template.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'The file has no data rows.' }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Max 500 rows per import.' }, { status: 400 });
  }

  // Resolve client context from employment
  const employment = await prisma.employeeEmployment.findFirst({
    where: { employee: { userId: session.user.id }, employmentStatus: 'ACTIVE' },
    select: { clientId: true },
  });
  if (!employment) {
    return NextResponse.json({ error: 'Could not determine your client context.' }, { status: 422 });
  }
  const clientId = employment.clientId;

  // Pre-load all account types with their detail types for lookup
  const allTypes = await prisma.accountType.findMany({
    where: { isActive: true },
    include: { detailTypes: { where: { isActive: true } } },
  });

  function cell(row: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const raw = row[key];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return String(raw).trim();
      }
    }
    return null;
  }

  const results: GlImportRowResult[] = [];
  let imported = 0;

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]!;
    const rowNum = i + 2;

    const rawData = {
      accountCode: cell(rawRow, 'Account Code', 'accountCode') ?? '',
      name: cell(rawRow, 'Account Name', 'name') ?? '',
      accountType: cell(rawRow, 'Account Type', 'accountType') ?? '',
      detailType: cell(rawRow, 'Detail Type', 'detailType') ?? '',
      description: cell(rawRow, 'Description', 'description'),
      openingBalance: cell(rawRow, 'Opening Balance', 'openingBalance'),
      isBankAccount: cell(rawRow, 'Is Bank Account', 'isBankAccount'),
    };

    const parsed = rowSchema.safeParse(rawData);
    if (!parsed.success) {
      results.push({
        row: rowNum,
        accountCode: rawData.accountCode || `Row ${rowNum}`,
        status: 'error',
        error: parsed.error.issues[0]?.message ?? 'Validation failed',
      });
      continue;
    }

    const d = parsed.data;

    // Look up account type by name (case-insensitive)
    const accountType = allTypes.find(
      (t) => t.name.toLowerCase() === d.accountType.toLowerCase(),
    );
    if (!accountType) {
      results.push({
        row: rowNum,
        accountCode: d.accountCode,
        status: 'error',
        error: `Account Type "${d.accountType}" not found`,
      });
      continue;
    }

    // Look up detail type under the account type
    const detailType = accountType.detailTypes.find(
      (dt) => dt.name.toLowerCase() === d.detailType.toLowerCase(),
    );
    if (!detailType) {
      results.push({
        row: rowNum,
        accountCode: d.accountCode,
        status: 'error',
        error: `Detail Type "${d.detailType}" not found under "${accountType.name}"`,
      });
      continue;
    }

    // Check for duplicate code
    const existing = await prisma.glAccount.findUnique({
      where: { clientId_accountCode: { clientId, accountCode: d.accountCode } },
      select: { id: true },
    });
    if (existing) {
      results.push({
        row: rowNum,
        accountCode: d.accountCode,
        status: 'skipped',
        error: `Account code "${d.accountCode}" already exists`,
      });
      continue;
    }

    try {
      const account = await prisma.glAccount.create({
        data: {
          clientId,
          accountCode: d.accountCode,
          name: d.name,
          description: d.description ?? null,
          accountTypeId: accountType.id,
          accountDetailTypeId: detailType.id,
          isActive: true,
          isBankAccount: d.isBankAccount,
          openingBalance: d.openingBalance ?? null,
        },
        select: { id: true, accountCode: true, name: true },
      });

      imported++;
      results.push({ row: rowNum, accountCode: d.accountCode, status: 'ok' });

      void logActivity({
        userId: session.user.id,
        action: 'CREATED',
        entity: 'GlAccount',
        entityId: account.id,
        description: `Imported GL account ${account.accountCode} — ${account.name} via bulk import`,
        ...getRequestMeta(request),
      });
    } catch {
      results.push({
        row: rowNum,
        accountCode: d.accountCode,
        status: 'error',
        error: 'Database insert failed',
      });
    }
  }

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
