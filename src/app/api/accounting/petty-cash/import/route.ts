// src/app/api/accounting/petty-cash/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import * as XLSX from 'xlsx';

// All 24 PettyCashItemCategory enum values — must match prisma schema exactly
const VALID_CATEGORIES = [
  'ADDED_FUNDS', 'ADVANCES_TO_EMPLOYEES', 'ADVANCES_TO_JADE', 'BALANCING_FIGURE',
  'BORROWED_FUNDS', 'CLIENT_FUND', 'DELIVERY_FEE', 'DISCREPANCIES', 'FUEL',
  'LIAISON_COMMISSION', 'MEALS', 'NOTARY_FEES', 'OFFICE_EQUIPMENT', 'OFFICE_SUPPLIES',
  'PARKING_FEE', 'PRINTING_EXPENSES', 'PROFESSIONAL_FEES', 'REPAIRS_AND_MAINTENANCE',
  'SALARIES', 'SALES_COMMISSION', 'TAXES_AND_LICENSES', 'TELECOMMUNICATION',
  'TRANSPORTATION', 'EMPLOYEE_EXPENSE',
] as const;

const rowSchema = z.object({
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((v) => !isNaN(Date.parse(v)), { message: 'Date must be a valid date' })
    .transform((v) => {
      const d = new Date(v);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }),
  pcfTrackingNumber: z.string().optional().nullable(),
  staffName: z.string().min(1, 'Staff Name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return 'UNCATEGORIZED';
      
      // Clean up string: uppercase and replace spaces with underscores (e.g. "Meals" -> "MEALS", "Parking Fee" -> "PARKING_FEE")
      const upper = v.trim().toUpperCase().replace(/\s+/g, '_');
      
      // Normalise legacy / alternate spellings
      if (upper === 'CLIENT_FUNDS') return 'CLIENT_FUND'; // legacy plural
      if (upper === 'UNCATEGORIZED') return 'EMPLOYEE_EXPENSE'; // legacy fallback

      // Check if it matches our 24 valid enums
      if (VALID_CATEGORIES.includes(upper as any)) {
        return upper;
      }
      
      // Fallback if the excel has an unrecognised value
      return 'EMPLOYEE_EXPENSE';
    })
    .pipe(z.enum(VALID_CATEGORIES)),
  received: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return 0;
      const n = parseFloat(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : 0;
    }),
  payment: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === '') return 0;
      const n = parseFloat(String(v).replace(/,/g, ''));
      return Number.isFinite(n) ? n : 0;
    }),
  countedBy: z.string().optional().nullable(),
});

export type PcfImportRowResult = {
  row: number;
  staffName: string;
  status: 'ok' | 'error' | 'skipped';
  pcfNo?: string;
  error?: string;
  warning?: string; 
};

function cleanCell(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).replace(/\u00A0/g, '').trim();
  return str === '' ? null : str;
}

function cell(row: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const raw = row[key];
    const cleaned = cleanCell(raw);
    if (cleaned !== null) return cleaned;
  }
  return null;
}

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
  
  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 25 MB)' }, { status: 400 });
  }

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

  if (rows.length === 0) return NextResponse.json({ error: 'The file has no data rows.' }, { status: 400 });

  const settings = await prisma.accountingSetting.findFirst();
  const custodianId = settings?.defaultCustodianId ?? null;
  const accountingManagerId = settings?.defaultAccountingManagerId ?? null;
  const prefix = settings?.pcfNumberPrefix ?? 'PCF';

  type ParsedRow = z.infer<typeof rowSchema> & { rowNum: number };
  const parsedRows: ParsedRow[] = [];
  const results: PcfImportRowResult[] = [];

  for (let i = 0; i < rows.length; i++) {
    const rawRow = rows[i]!;
    const rowNum = i + 2;

    const rawData = {
      date: cell(rawRow, 'Date', 'date') ?? '',
      pcfTrackingNumber: cell(rawRow, 'PCF Tracking Number', 'pcfTrackingNumber'),
      staffName: cell(rawRow, 'Staff Name', 'staffName') ?? '',
      description: cell(rawRow, 'Description', 'description') ?? '',
      category: cell(rawRow, 'Category', 'category'), // Zod handles the fallback now
      received: cell(rawRow, 'Received', 'received') ?? '0',
      payment: cell(rawRow, 'Payment', 'payment') ?? '0',
      countedBy: cell(rawRow, 'Counted By', 'countedBy'),
    };

    const isRowCompletelyEmpty =
      !rawData.date &&
      !rawData.pcfTrackingNumber &&
      !rawData.staffName &&
      !rawData.description &&
      rawData.received === '0' &&
      rawData.payment === '0' &&
      !rawData.countedBy;

    if (isRowCompletelyEmpty) {
      results.push({
        row: rowNum,
        staffName: 'BLANK_ROW',
        status: 'skipped',
        error: 'Skipped empty row',
      });
      continue;
    }

    if (!rawData.staffName.trim()) {
      results.push({ row: rowNum, staffName: 'UNKNOWN', status: 'error', error: 'Staff Name is empty' });
      continue;
    }

    const parsed = rowSchema.safeParse(rawData);
    if (!parsed.success) {
      results.push({
        row: rowNum,
        staffName: rawData.staffName || `Row ${rowNum}`,
        status: 'error',
        error: parsed.error.issues[0]?.message ?? 'Validation failed',
      });
      continue;
    }
    parsedRows.push({ ...parsed.data, rowNum });
  }

  const groups = new Map<string, ParsedRow[]>();
  for (const row of parsedRows) {
    const key = `${row.staffName.trim().toLowerCase()}|||${row.date}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  const users = await prisma.user.findMany({ select: { id: true, name: true } });
  const staffMap = new Map<string, string>();
  for (const user of users) {
    if (user.name) staffMap.set(user.name.trim().toLowerCase(), user.id);
  }

  let importedCount = 0;
  const currentYear = new Date().getFullYear();
  const pcfPrefix = `${prefix}-${currentYear}-`;

  for (const [, groupRows] of groups) {
    const firstRow = groupRows[0]!;
    
    const dbStaffId = staffMap.get(firstRow.staffName.toLowerCase());
    const isStaffMissing = !dbStaffId;
    const requestedById = dbStaffId ?? session.user.id;
    
    const purpose = firstRow.pcfTrackingNumber
      ? `Import: ${firstRow.pcfTrackingNumber} for ${firstRow.staffName}`
      : `Imported on ${firstRow.date} for ${firstRow.staffName}`;

    const items = groupRows.map((row) => ({
      // 2. Safely type cast to the array of allowed types
      category: row.category as (typeof VALID_CATEGORIES)[number],
      description: row.description,
      amount: row.payment > 0 ? row.payment : row.received > 0 ? row.received : 0.01,
      remarks: row.countedBy ? `Counted by: ${row.countedBy}` : null,
    }));

    const validItems = items.filter((it) => it.amount > 0);
    if (validItems.length === 0) {
      for (const row of groupRows) {
        results.push({ row: row.rowNum, staffName: firstRow.staffName, status: 'error', error: 'No valid payment amounts found' });
      }
      continue;
    }

    let totalEmployeeCents = 0;
    let totalClientCents = 0;
    
    // 3. Tally logic: Only CLIENT_FUND goes to client totals. Everything else is employee/operational expenses.
    for (const item of validItems) {
      const cents = Math.round(item.amount * 100);
      if (item.category === 'CLIENT_FUND') {
        totalClientCents += cents;
      } else {
        totalEmployeeCents += cents;
      }
    }

    const totalEmployee = totalEmployeeCents / 100;
    const totalClient = totalClientCents / 100;
    const totalRequested = (totalEmployeeCents + totalClientCents) / 100;

    try {
      const created = await prisma.$transaction(async (tx) => {
        const existing = await tx.pettyCash.findFirst({
          where: { requestedById, date: new Date(`${firstRow.date}T00:00:00`), purpose },
          select: { id: true },
        });
        if (existing) throw new Error('Duplicate import detected');

        let finalPcfNo: string;

        if (firstRow.pcfTrackingNumber) {
          finalPcfNo = firstRow.pcfTrackingNumber.trim();
          
          const pcfExists = await tx.pettyCash.findFirst({
            where: { pcfNo: finalPcfNo },
            select: { id: true }
          });
          if (pcfExists) throw new Error(`Tracking number ${finalPcfNo} already exists in the system.`);
        } else {
          const latest = await tx.pettyCash.findFirst({
            where: { pcfNo: { startsWith: pcfPrefix } },
            orderBy: { pcfNo: 'desc' },
            select: { pcfNo: true },
          });

          let nextSeq = 1;
          if (latest) {
            const parts = latest.pcfNo.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]!, 10);
            if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
          }
          finalPcfNo = `${pcfPrefix}${String(nextSeq).padStart(4, '0')}`;
        }

        return tx.pettyCash.create({
          data: {
            pcfNo: finalPcfNo,
            purpose,
            requestedById,
            custodianId,
            accountingManagerId,
            status: 'PENDING',
            date: new Date(`${firstRow.date}T00:00:00`),
            totalRequestedAmount: totalRequested,
            totalEmployeeExpenses: totalEmployee,
            totalClientFundUsed: totalClient,
            items: {
              create: validItems.map((it) => ({
                category: it.category,
                description: it.description,
                amount: it.amount,
                remarks: it.remarks,
              })),
            },
          },
          select: { id: true, pcfNo: true },
        });
      });

      importedCount++;
      for (const row of groupRows) {
        results.push({ 
          row: row.rowNum, 
          staffName: firstRow.staffName, 
          status: 'ok', 
          pcfNo: created.pcfNo,
          ...(isStaffMissing && { warning: 'This employee is not part of the company anymore' })
        });
      }

      logActivity({
        userId: session.user.id,
        action: 'CREATED',
        entity: 'PettyCash',
        entityId: created.id,
        description: `Imported petty cash request ${created.pcfNo} via bulk import`,
        ...getRequestMeta(request),
      }).catch((err) => console.error('Activity Log Failure:', err));

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Database insert failed';
      for (const row of groupRows) {
        results.push({ row: row.rowNum, staffName: firstRow.staffName, status: 'error', error: message });
      }
    }
  }

  return NextResponse.json({
    data: {
      total: rows.length,
      imported: importedCount,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    },
  });
}