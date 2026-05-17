// src/app/api/accounting/journal-entries/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { logActivity, getRequestMeta } from '@/lib/activity-log';
import type { JournalTransactionType, JournalEntryStatus } from '@/generated/prisma/client';

// ─── Enum maps ────────────────────────────────────────────────────────────────

const TX_TYPE_TO_DB: Record<string, JournalTransactionType> = {
  'Journal Entry': 'JOURNAL_ENTRY',
  'Invoice':       'INVOICE',
  'Payment':       'PAYMENT',
  'Expense':       'EXPENSE',
  'Receipt':       'RECEIPT',
  'Petty Cash':    'PETTY_CASH',
  'Client Fund':   'CLIENT_FUND',
};
const TX_TYPE_FROM_DB: Record<JournalTransactionType, string> = {
  JOURNAL_ENTRY: 'Journal Entry',
  INVOICE:       'Invoice',
  PAYMENT:       'Payment',
  EXPENSE:       'Expense',
  RECEIPT:       'Receipt',
  PETTY_CASH:    'Petty Cash',
  CLIENT_FUND:   'Client Fund',
};
const STATUS_FROM_DB: Record<JournalEntryStatus, string> = {
  DRAFT:  'Draft',
  POSTED: 'Posted',
};

const REF_PREFIXES: Record<JournalTransactionType, string> = {
  JOURNAL_ENTRY: 'JE',
  INVOICE:       'INV',
  PAYMENT:       'PMT',
  EXPENSE:       'EXP',
  RECEIPT:       'REC',
  PETTY_CASH:    'PCF',
  CLIENT_FUND:   'CFT',
};

// ─── Serializer ───────────────────────────────────────────────────────────────

function serializeEntry(e: unknown) {
  const entry = e as Record<string, unknown>;
  const lines = (entry.lines as Record<string, unknown>[]) ?? [];
  return {
    id: entry.id,
    referenceNo: entry.referenceNo,
    transactionDate: (entry.transactionDate as Date).toISOString().split('T')[0],
    transactionType: TX_TYPE_FROM_DB[entry.transactionType as JournalTransactionType],
    status: STATUS_FROM_DB[entry.status as JournalEntryStatus],
    notes: entry.notes ?? '',
    attachments: entry.attachments ?? [],
    clientId: entry.clientId ?? null,
    createdById: entry.createdById ?? null,
    lines: lines.map((l) => {
      const gl = l.glAccount as Record<string, unknown> | null;
      return {
        id: l.id,
        glAccountId: l.glAccountId,
        account: gl ? `${gl.accountCode} · ${gl.name}` : String(l.glAccountId),
        debit: l.debit != null ? String(l.debit) : '',
        credit: l.credit != null ? String(l.credit) : '',
        description: l.description ?? '',
        name: l.name ?? '',
        sortOrder: l.sortOrder,
      };
    }),
    createdAt: (entry.createdAt as Date).toISOString(),
    updatedAt: (entry.updatedAt as Date).toISOString(),
  };
}

const LINE_INCLUDE = {
  glAccount: { select: { id: true, accountCode: true, name: true } },
} as const;

// ─── Zod ─────────────────────────────────────────────────────────────────────

const lineSchema = z.object({
  glAccountId: z.string().min(1, 'Account is required'),
  debit:       z.number().nonnegative().optional().nullable(),
  credit:      z.number().nonnegative().optional().nullable(),
  description: z.string().max(500).optional(),
  name:        z.string().max(200).optional(),
  sortOrder:   z.number().int().optional().default(0),
});

const createSchema = z.object({
  transactionDate: z.string().min(1, 'Transaction date is required'),
  transactionType: z.enum(['Journal Entry', 'Invoice', 'Payment', 'Expense', 'Receipt']).default('Journal Entry'),
  status:          z.enum(['Draft', 'Posted']).default('Draft'),
  notes:           z.string().max(2000).optional(),
  attachments:     z.array(z.string()).optional().default([]),
  clientId:        z.number().int().positive().optional().nullable(),
  lines:           z.array(lineSchema).min(2, 'At least 2 lines required'),
});

// ─── GET /api/accounting/journal-entries ─────────────────────────────────────

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const month    = searchParams.get('month');
  const year     = searchParams.get('year');
  const status   = searchParams.get('status');
  const type     = searchParams.get('type');
  const clientId = searchParams.get('clientId');
  const search   = searchParams.get('search') ?? '';

  const where: Record<string, unknown> = {};

  if (year && month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    const start = new Date(y, m - 1, 1);
    const end   = new Date(y, m, 1);
    where.transactionDate = { gte: start, lt: end };
  } else if (year) {
    const y = parseInt(year, 10);
    where.transactionDate = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
  }

  if (status === 'Draft')  where.status = 'DRAFT';
  if (status === 'Posted') where.status = 'POSTED';

  if (type && TX_TYPE_TO_DB[type]) {
    where.transactionType = TX_TYPE_TO_DB[type];
  }

  if (clientId) where.clientId = parseInt(clientId, 10);

  if (search.trim()) {
    where.OR = [
      { referenceNo: { contains: search, mode: 'insensitive' } },
      { notes:       { contains: search, mode: 'insensitive' } },
      { lines: { some: { description: { contains: search, mode: 'insensitive' } } } },
    ];
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
    include: { lines: { include: LINE_INCLUDE, orderBy: { sortOrder: 'asc' } } },
  });

  return NextResponse.json({ data: entries.map(serializeEntry) });
}

// ─── POST /api/accounting/journal-entries ────────────────────────────────────

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const { transactionDate, transactionType, status, notes, attachments, clientId, lines } = parsed.data;
  const dbType   = TX_TYPE_TO_DB[transactionType] as JournalTransactionType;
  const dbStatus = (status === 'Posted' ? 'POSTED' : 'DRAFT') as JournalEntryStatus;

  // Validate balanced entry (total debit must equal total credit)
  const totalDebit  = lines.reduce((s, l) => s + (l.debit  ?? 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
  if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
    return NextResponse.json(
      { error: `Total debits (₱${totalDebit.toFixed(2)}) must equal total credits (₱${totalCredit.toFixed(2)}).` },
      { status: 422 },
    );
  }

  // Validate all glAccountIds exist
  const accountIds = lines.map((l) => l.glAccountId);
  const foundAccounts = await prisma.glAccount.findMany({
    where: { id: { in: accountIds } },
    select: { id: true },
  });
  if (foundAccounts.length !== new Set(accountIds).size) {
    return NextResponse.json({ error: 'One or more GL accounts are invalid.' }, { status: 422 });
  }

  const entry = await prisma.$transaction(async (tx) => {
    // Generate sequential reference number inside transaction
    const year   = new Date(transactionDate).getFullYear();
    const prefix = `${REF_PREFIXES[dbType]}-${year}-`;
    const latest = await tx.journalEntry.findFirst({
      where: { referenceNo: { startsWith: prefix } },
      orderBy: { referenceNo: 'desc' },
      select: { referenceNo: true },
    });
    const nextSeq = latest
      ? parseInt(latest.referenceNo.split('-').at(-1)!, 10) + 1
      : 1;
    const referenceNo = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return tx.journalEntry.create({
      data: {
        referenceNo,
        transactionDate: new Date(transactionDate),
        transactionType: dbType,
        status:          dbStatus,
        notes:           notes ?? null,
        attachments:     attachments ?? [],
        clientId:        clientId ?? null,
        createdById:     session.user.id,
        lines: {
          create: lines.map((l, i) => ({
            glAccountId: l.glAccountId,
            debit:       l.debit != null ? l.debit : null,
            credit:      l.credit != null ? l.credit : null,
            description: l.description ?? null,
            name:        l.name ?? null,
            sortOrder:   l.sortOrder ?? i,
          })),
        },
      },
      include: { lines: { include: LINE_INCLUDE, orderBy: { sortOrder: 'asc' } } },
    });
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'JournalEntry',
    entityId: entry.id,
    description: `Created journal entry ${entry.referenceNo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serializeEntry(entry) }, { status: 201 });
}
