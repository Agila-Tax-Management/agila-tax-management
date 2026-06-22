// src/app/api/accounting/invoices/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const VALID_CATEGORIES = [
  'SERVICE_FEE',
  'TAX_REIMBURSEMENT',
  'GOV_FEE_REIMBURSEMENT',
  'OUT_OF_POCKET',
  'CLIENT_FUND_DEPOSIT',
] as const;

const rowSchema = z.object({
  clientBusinessName: z.string().min(1, 'Client Business Name is required'),

  dueDate: z
    .string()
    .min(1, 'Due Date is required')
    .refine((v) => !isNaN(Date.parse(v)), {
      message: 'Due Date must be a valid date (YYYY-MM-DD)',
    }),

  description: z.string().min(1, 'Description is required'),

  quantity: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1, 'Quantity must be at least 1')),

  unitPrice: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().min(0, 'Unit Price must be >= 0')),

  category: z
    .string()
    .optional()
    .transform((v) =>
      v ? v.trim().toUpperCase().replace(/\s+/g, '_') : 'SERVICE_FEE'
    )
    .pipe(z.enum(VALID_CATEGORIES)),

  isVatable: z
    .union([z.string(), z.boolean(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return false;
      if (typeof v === 'boolean') return v;
      if (typeof v === 'number') return v !== 0;
      return ['true', 'yes', '1', 'y'].includes(String(v).toLowerCase());
    }),

  notes: z.string().optional().nullable(),
});

export type InvoiceImportRowResult = {
  row: number;
  clientName: string;
  status: 'ok' | 'error' | 'skipped';
  invoiceNumber?: string;
  error?: string;
};

/**
 * POST /api/accounting/invoices/import
 * Accepts multipart/form-data with a `file` field (CSV or XLSX).
 * Groups rows by clientBusinessName + dueDate into draft invoices.
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
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheetName = wb.SheetNames[0];
    if (!sheetName) throw new Error('Empty workbook');
    const ws = wb.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws ?? {}, { raw: false, dateNF: 'yyyy-mm-dd' });
  } catch {
    return NextResponse.json({ error: 'Could not parse the file. Use the provided template.' }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: 'The file has no data rows.' }, { status: 400 });
  }
  if (rows.length > 500) {
    return NextResponse.json({ error: 'Max 500 rows per import.' }, { status: 400 });
  }

  function cell(row: Record<string, unknown>, ...keys: string[]): string | null {
    for (const key of keys) {
      const raw = row[key];
      if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
        return String(raw).trim();
      }
    }
    return null;
  }

  // Parse and validate rows
  type ParsedRow = z.infer<typeof rowSchema> & { rowNum: number };
  const parsedRows: ParsedRow[] = [];
  const results: InvoiceImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]!;
    const rowNum = i + 2;
    const rawData = {
      clientBusinessName: cell(rawRow, 'Client Business Name', 'clientBusinessName') ?? '',
      dueDate: cell(rawRow, 'Due Date', 'dueDate') ?? '',
      description: cell(rawRow, 'Description', 'description') ?? '',
      quantity: cell(rawRow, 'Quantity', 'quantity') ?? '1',
      unitPrice: cell(rawRow, 'Unit Price', 'unitPrice') ?? '0',
      category: cell(rawRow, 'Category', 'category') ?? 'SERVICE_FEE',
      isVatable: cell(rawRow, 'Is Vatable', 'isVatable'),
      notes: cell(rawRow, 'Notes', 'notes'),
    };

    const parsed = rowSchema.safeParse(rawData);
    if (!parsed.success) {
      results.push({
        row: rowNum,
        clientName: rawData.clientBusinessName || `Row ${rowNum}`,
        status: 'error',
        error: parsed.error.issues[0]?.message ?? 'Validation failed',
      });
      continue;
    }
    parsedRows.push({ ...parsed.data, rowNum });
  }

  // Group rows by clientBusinessName + dueDate (each group = one invoice)
  const groups = new Map<string, ParsedRow[]>();
  for (const row of parsedRows) {
    const key = `${row.clientBusinessName.toLowerCase()}|||${row.dueDate}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  // Resolve clients
  const clientNameSet = new Set(parsedRows.map((r) => r.clientBusinessName));
  const clientMap = new Map<string, number>();
  for (const name of clientNameSet) {
    const client = await prisma.client.findFirst({
      where: { businessName: { equals: name, mode: 'insensitive' } },
      select: { id: true, businessName: true },
    });
    if (client) clientMap.set(name.toLowerCase(), client.id);
  }

  let imported = 0;

  for (const [, groupRows] of groups) {
    const firstRow = groupRows[0]!;
    const clientId = clientMap.get(firstRow.clientBusinessName.toLowerCase());

    if (!clientId) {
      for (const row of groupRows) {
        results.push({
          row: row.rowNum,
          clientName: firstRow.clientBusinessName,
          status: 'error',
          error: `Client "${firstRow.clientBusinessName}" not found`,
        });
      }
      continue;
    }

    try {
      const items = groupRows.map((row) => ({
        description: row.description,
        quantity: row.quantity,
        unitPrice: row.unitPrice,
        total: row.quantity * row.unitPrice,
        category: row.category,
        isVatable: row.isVatable,
        remarks: null,
      }));
      const subTotal = items.reduce((s, it) => s + it.total, 0);
      const notes = groupRows.find((r) => r.notes)?.notes ?? null;

      const invoice = await prisma.$transaction(async (tx) => {
        const year = new Date().getFullYear();
        const prefix = `INV-${year}-`;
        const latest = await tx.invoice.findFirst({
          where: { invoiceNumber: { startsWith: prefix } },
          orderBy: { invoiceNumber: 'desc' },
          select: { invoiceNumber: true },
        });
        let nextSeq = 1;
        if (latest) {
          const parts = latest.invoiceNumber.split('-');
          const lastSeq = parseInt(parts[parts.length - 1]!, 10);
          if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
        }
        const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

        return tx.invoice.create({
          data: {
            invoiceNumber,
            clientId,
            dueDate: new Date(firstRow.dueDate),
            notes: notes ?? null,
            subTotal,
            taxAmount: 0,
            discountAmount: 0,
            totalAmount: subTotal,
            balanceDue: subTotal,
            status: 'DRAFT',
            items: { create: items },
          },
          select: { id: true, invoiceNumber: true },
        });
      });

      imported++;
      for (const row of groupRows) {
        results.push({
          row: row.rowNum,
          clientName: firstRow.clientBusinessName,
          status: 'ok',
          invoiceNumber: invoice.invoiceNumber,
        });
      }

      void logActivity({
        userId: session.user.id,
        action: 'CREATED',
        entity: 'Invoice',
        entityId: invoice.id,
        description: `Imported invoice ${invoice.invoiceNumber} via bulk import`,
        ...getRequestMeta(request),
      });
    } catch {
      for (const row of groupRows) {
        results.push({
          row: row.rowNum,
          clientName: firstRow.clientBusinessName,
          status: 'error',
          error: 'Database insert failed',
        });
      }
    }
  }

  return NextResponse.json({
    data: {
      total: rows.length,
      imported,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    },
  });
}
