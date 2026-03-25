// src/app/api/accounting/invoices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { addInvoiceHistory } from '@/lib/invoice-history';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

// ── Zod Schemas ──────────────────────────────────────────────────
const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  unitPrice: z.number().min(0, 'Unit price must be >= 0'),
  total: z.number().min(0),
  remarks: z.string().optional().default(''),
});

const createSchema = z
  .object({
    clientId: z.number().int().optional(),
    leadId: z.number().int().optional(),
    dueDate: z.string().min(1, 'Due date is required'),
    notes: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(itemSchema).min(1, 'At least one item is required'),
  })
  .refine((d) => d.clientId != null || d.leadId != null, {
    message: 'Either a client or a lead must be selected',
  });

// ── Serializer ───────────────────────────────────────────────────
function serializeInvoice(inv: unknown) {
  const i = inv as Record<string, unknown>;
  return {
    ...i,
    subTotal: Number(i.subTotal),
    taxAmount: Number(i.taxAmount),
    discountAmount: Number(i.discountAmount),
    totalAmount: Number(i.totalAmount),
    balanceDue: Number(i.balanceDue),
    issueDate: (i.issueDate as Date).toISOString(),
    dueDate: (i.dueDate as Date).toISOString(),
    createdAt: (i.createdAt as Date).toISOString(),
    updatedAt: (i.updatedAt as Date).toISOString(),
    items: ((i.items as Record<string, unknown>[]) ?? []).map((it) => ({
      ...it,
      unitPrice: Number(it.unitPrice),
      total: Number(it.total),
    })),
    payments: ((i.payments as Record<string, unknown>[]) ?? []).map((p) => ({
      ...p,
      amount: Number(p.amount),
      paymentDate: (p.paymentDate as Date).toISOString(),
      createdAt: (p.createdAt as Date).toISOString(),
    })),
    historyLogs: ((i.historyLogs as Record<string, unknown>[]) ?? []).map((h) => ({
      ...h,
      createdAt: (h.createdAt as Date).toISOString(),
    })),
  };
}

// ── GET /api/accounting/invoices ─────────────────────────────────
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const search = searchParams.get('search') ?? '';
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 50;
  const skip = (page - 1) * limit;

  type WhereClause = {
    status?: import('@/generated/prisma/client').InvoiceStatus;
    OR?: Array<Record<string, unknown>>;
  };

  const where: WhereClause = {};
  if (status) where.status = status as import('@/generated/prisma/client').InvoiceStatus;
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { client: { businessName: { contains: search, mode: 'insensitive' } } },
      { lead: { firstName: { contains: search, mode: 'insensitive' } } },
      { lead: { lastName: { contains: search, mode: 'insensitive' } } },
      { lead: { businessName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const invoiceSelect = {
    id: true,
    invoiceNumber: true,
    status: true,
    issueDate: true,
    dueDate: true,
    subTotal: true,
    taxAmount: true,
    discountAmount: true,
    totalAmount: true,
    balanceDue: true,
    notes: true,
    terms: true,
    clientId: true,
    client: { select: { id: true, businessName: true, clientNo: true, businessEntity: true } },
    leadId: true,
    lead: {
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        businessName: true,
        businessType: true,
      },
    },
    createdAt: true,
    updatedAt: true,
  } as const;

  const [invoices, total, aggregates] = await Promise.all([
    prisma.invoice.findMany({
      where,
      select: invoiceSelect,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
    Promise.all([
      prisma.invoice.aggregate({ _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({ where: { status: 'PAID' }, _sum: { totalAmount: true } }),
      prisma.invoice.aggregate({
        where: { status: { in: ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'] } },
        _sum: { balanceDue: true },
      }),
      prisma.invoice.count({ where: { status: 'OVERDUE' } }),
    ]),
  ]);

  const [allAgg, paidAgg, outstandingAgg, overdueCount] = aggregates;

  return NextResponse.json({
    data: invoices.map(serializeInvoice),
    meta: { total, page, limit, pages: Math.ceil(total / limit) },
    stats: {
      totalInvoiced: Number(allAgg._sum.totalAmount ?? 0),
      totalCollected: Number(paidAgg._sum.totalAmount ?? 0),
      totalOutstanding: Number(outstandingAgg._sum.balanceDue ?? 0),
      overdueCount,
    },
  });
}

// ── POST /api/accounting/invoices ────────────────────────────────
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const data = parsed.data;
  const subTotal = data.items.reduce((s, it) => s + it.total, 0);

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
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    return tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId ?? null,
        leadId: data.leadId ?? null,
        dueDate: new Date(data.dueDate),
        notes: data.notes ?? null,
        terms: data.terms ?? null,
        subTotal,
        taxAmount: 0,
        discountAmount: 0,
        totalAmount: subTotal,
        balanceDue: subTotal,
        status: 'UNPAID',
        items: {
          create: data.items.map((it) => ({
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            remarks: it.remarks || null,
          })),
        },
      },
      select: { id: true, invoiceNumber: true },
    });
  });

  void addInvoiceHistory({
    invoiceId: invoice.id,
    actorId: session.user.id,
    changeType: 'INVOICE_CREATED',
    newValue: invoice.invoiceNumber,
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'Invoice',
    entityId: invoice.id,
    description: `Created invoice ${invoice.invoiceNumber}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: invoice }, { status: 201 });
}
