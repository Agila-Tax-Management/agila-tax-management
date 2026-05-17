// src/app/api/accounting/journal-entries/[id]/route.ts
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
const STATUS_FROM_DB: Record<JournalEntryStatus, string> = { DRAFT: 'Draft', POSTED: 'Posted' };

const LINE_INCLUDE = {
  glAccount: { select: { id: true, accountCode: true, name: true } },
} as const;

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
    lines: lines.map((l) => {
      const gl = l.glAccount as Record<string, unknown> | null;
      return {
        id: l.id,
        glAccountId: l.glAccountId,
        account: gl ? `${gl.accountCode} · ${gl.name}` : String(l.glAccountId),
        debit:  l.debit  != null ? String(l.debit)  : '',
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

// ─── Zod ─────────────────────────────────────────────────────────────────────

const lineSchema = z.object({
  glAccountId: z.string().min(1),
  debit:       z.number().nonnegative().optional().nullable(),
  credit:      z.number().nonnegative().optional().nullable(),
  description: z.string().max(500).optional(),
  name:        z.string().max(200).optional(),
  sortOrder:   z.number().int().optional().default(0),
});

const updateSchema = z.object({
  transactionDate: z.string().optional(),
  transactionType: z.enum(['Journal Entry', 'Invoice', 'Payment', 'Expense', 'Receipt']).optional(),
  status:          z.enum(['Draft', 'Posted']).optional(),
  notes:           z.string().max(2000).optional().nullable(),
  attachments:     z.array(z.string()).optional(),
  clientId:        z.number().int().positive().optional().nullable(),
  lines:           z.array(lineSchema).min(2).optional(),
});

// ─── GET /api/accounting/journal-entries/[id] ────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: { lines: { include: LINE_INCLUDE, orderBy: { sortOrder: 'asc' } } },
  });
  if (!entry) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });

  return NextResponse.json({ data: serializeEntry(entry) });
}

// ─── PUT /api/accounting/journal-entries/[id] ────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.journalEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });

  const body: unknown = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid input' }, { status: 422 });
  }

  const { transactionDate, transactionType, status, notes, attachments, clientId, lines } = parsed.data;

  // Validate balanced entry when lines are provided
  if (lines) {
    const totalDebit  = lines.reduce((s, l) => s + (l.debit  ?? 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (l.credit ?? 0), 0);
    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
      return NextResponse.json(
        { error: `Total debits (₱${totalDebit.toFixed(2)}) must equal total credits (₱${totalCredit.toFixed(2)}).` },
        { status: 422 },
      );
    }
  }

  // Validate all glAccountIds if lines provided
  if (lines) {
    const accountIds = lines.map((l) => l.glAccountId);
    const found = await prisma.glAccount.findMany({
      where: { id: { in: accountIds } },
      select: { id: true },
    });
    if (found.length !== new Set(accountIds).size) {
      return NextResponse.json({ error: 'One or more GL accounts are invalid.' }, { status: 422 });
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    // Delete existing lines and recreate if lines are being updated
    if (lines) {
      await tx.journalLine.deleteMany({ where: { journalEntryId: id } });
    }

    return tx.journalEntry.update({
      where: { id },
      data: {
        ...(transactionDate ? { transactionDate: new Date(transactionDate) } : {}),
        ...(transactionType ? { transactionType: TX_TYPE_TO_DB[transactionType] } : {}),
        ...(status ? { status: status === 'Posted' ? 'POSTED' : 'DRAFT' } : {}),
        ...(notes !== undefined ? { notes: notes ?? null } : {}),
        ...(attachments !== undefined ? { attachments } : {}),
        ...(clientId !== undefined ? { clientId: clientId ?? null } : {}),
        ...(lines ? {
          lines: {
            create: lines.map((l, i) => ({
              glAccountId: l.glAccountId,
              debit:       l.debit  != null ? l.debit  : null,
              credit:      l.credit != null ? l.credit : null,
              description: l.description ?? null,
              name:        l.name ?? null,
              sortOrder:   l.sortOrder ?? i,
            })),
          },
        } : {}),
      },
      include: { lines: { include: LINE_INCLUDE, orderBy: { sortOrder: 'asc' } } },
    });
  });

  void logActivity({
    userId: session.user.id,
    action: 'UPDATED',
    entity: 'JournalEntry',
    entityId: id,
    description: `Updated journal entry ${updated.referenceNo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: serializeEntry(updated) });
}

// ─── DELETE /api/accounting/journal-entries/[id] ─────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.journalEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: 'Journal entry not found' }, { status: 404 });

  if (existing.status === 'POSTED') {
    return NextResponse.json({ error: 'Posted journal entries cannot be deleted.' }, { status: 409 });
  }

  // Lines cascade-delete via onDelete: Cascade in schema
  await prisma.journalEntry.delete({ where: { id } });

  void logActivity({
    userId: session.user.id,
    action: 'DELETED',
    entity: 'JournalEntry',
    entityId: id,
    description: `Deleted journal entry ${existing.referenceNo}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { id } });
}
