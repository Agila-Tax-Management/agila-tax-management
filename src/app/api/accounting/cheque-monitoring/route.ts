// src/app/api/accounting/cheque-monitoring/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import prisma from '@/lib/db';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

const createChequeSchema = z.object({
  chequeNo: z.string().min(1, 'Cheque number is required'),
  bankName: z.string().min(1, 'Bank name is required'),
  chequeDate: z.string().min(1, 'Cheque date is required'),
  clientId: z.number().int().positive('Client ID is required'),
  amount: z.number().positive('Amount must be positive'),
  invoiceId: z.string().optional().nullable(),
  paymentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/accounting/cheque-monitoring
 * Returns all cheque monitoring records (all clients, newest first).
 * Optionally filter by ?status=FOR_CLEARING|CLEARED|BOUNCED
 * Optionally filter by ?clientId=<id>
 */
export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get('status') as 'FOR_CLEARING' | 'CLEARED' | 'BOUNCED' | null;
  const clientIdParam = searchParams.get('clientId');

  const where: Record<string, unknown> = {};
  if (statusParam) where.status = statusParam;
  if (clientIdParam) {
    const clientId = parseInt(clientIdParam, 10);
    if (!isNaN(clientId)) where.clientId = clientId;
  }

  const cheques = await prisma.chequeMonitoring.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      client: { select: { id: true, businessName: true, clientNo: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
      payment: { select: { id: true, paymentNumber: true } },
      receivedBy: { select: { id: true, name: true } },
      processedBy: { select: { id: true, name: true } },
    },
  });

  const data = cheques.map((c) => ({
    id: c.id,
    chequeNo: c.chequeNo,
    bankName: c.bankName,
    chequeDate: c.chequeDate.toISOString(),
    clientId: c.clientId,
    clientNo: c.client.clientNo,
    businessName: c.client.businessName,
    amount: Number(c.amount),
    invoiceId: c.invoiceId,
    invoice: c.invoice,
    paymentId: c.paymentId,
    payment: c.payment,
    status: c.status,
    clearedAt: c.clearedAt?.toISOString() ?? null,
    bouncedAt: c.bouncedAt?.toISOString() ?? null,
    receivedBy: c.receivedBy,
    processedBy: c.processedBy,
    notes: c.notes,
    createdAt: c.createdAt.toISOString(),
  }));

  return NextResponse.json({ data });
}

/**
 * POST /api/accounting/cheque-monitoring
 * Creates a new cheque monitoring record with status FOR_CLEARING.
 * Does NOT create a ClientFundTransaction — cheque must be CLEARED first.
 */
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = createChequeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues ?? 'Validation error' }, { status: 400 });
  }

  const data = parsed.data;

  // Verify client exists
  const client = await prisma.client.findUnique({
    where: { id: data.clientId },
    select: { id: true, businessName: true },
  });
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const cheque = await prisma.chequeMonitoring.create({
    data: {
      chequeNo: data.chequeNo,
      bankName: data.bankName,
      chequeDate: new Date(data.chequeDate),
      clientId: data.clientId,
      amount: data.amount,
      invoiceId: data.invoiceId ?? null,
      paymentId: data.paymentId ?? null,
      notes: data.notes ?? null,
      receivedById: session.user.id,
      status: 'FOR_CLEARING',
    },
    include: {
      client: { select: { id: true, businessName: true, clientNo: true } },
      invoice: { select: { id: true, invoiceNumber: true } },
      payment: { select: { id: true, paymentNumber: true } },
      receivedBy: { select: { id: true, name: true } },
    },
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'ChequeMonitoring',
    entityId: cheque.id,
    description: `Logged cheque #${cheque.chequeNo} (${client.businessName}) for ₱${Number(cheque.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({
    data: {
      id: cheque.id,
      chequeNo: cheque.chequeNo,
      bankName: cheque.bankName,
      chequeDate: cheque.chequeDate.toISOString(),
      clientId: cheque.clientId,
      clientNo: cheque.client.clientNo,
      businessName: cheque.client.businessName,
      amount: Number(cheque.amount),
      invoiceId: cheque.invoiceId,
      invoice: cheque.invoice,
      paymentId: cheque.paymentId,
      payment: null,
      status: cheque.status,
      clearedAt: null,
      bouncedAt: null,
      receivedBy: cheque.receivedBy,
      processedBy: null,
      notes: cheque.notes,
      createdAt: cheque.createdAt.toISOString(),
    },
  }, { status: 201 });
}
