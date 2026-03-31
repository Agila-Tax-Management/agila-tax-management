// src/app/api/sales/clients/[id]/job-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';
import { logActivity, getRequestMeta } from '@/lib/activity-log';

type Params = { params: Promise<{ id: string }> };

// ─── Validation schema ─────────────────────────────────────────────
const createClientJobOrderSchema = z
  .object({
    changePlanId: z.number().int().positive().optional(),
    oneTimeServiceIds: z.array(z.number().int().positive()).optional(),
    notes: z.string().optional().nullable(),
  })
  .refine(
    data =>
      data.changePlanId !== undefined ||
      (data.oneTimeServiceIds !== undefined && data.oneTimeServiceIds.length > 0),
    { message: 'Specify a plan change or at least one one-time service' },
  );

// ─── POST /api/sales/clients/[id]/job-order ────────────────────────
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = createClientJobOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Validation failed' },
      { status: 400 },
    );
  }

  const { changePlanId, oneTimeServiceIds, notes } = parsed.data;

  // ─── Verify client exists ─────────────────────────────────────
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, businessName: true },
  });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  // ─── Find the lead linked to this client ──────────────────────
  const lead = await prisma.lead.findUnique({
    where: { convertedClientId: clientId },
    select: { id: true },
  });
  if (!lead) {
    return NextResponse.json(
      { error: 'No linked lead found for this client. A lead is required to create a job order.' },
      { status: 422 },
    );
  }

  // ─── Resolve service details ──────────────────────────────────
  type JoItem = {
    itemType: 'SUBSCRIPTION' | 'ONE_TIME';
    serviceName: string;
    rate: number;
    discount: number;
    total: number;
    remarks: string | null;
  };

  const items: JoItem[] = [];

  if (changePlanId !== undefined) {
    const plan = await prisma.servicePlan.findUnique({
      where: { id: changePlanId },
      select: { id: true, name: true, serviceRate: true },
    });
    if (!plan) {
      return NextResponse.json({ error: 'Service plan not found' }, { status: 404 });
    }
    const rate = Number(plan.serviceRate);
    items.push({
      itemType: 'SUBSCRIPTION',
      serviceName: plan.name,
      rate,
      discount: 0,
      total: rate,
      remarks: 'Plan change',
    });
  }

  if (oneTimeServiceIds && oneTimeServiceIds.length > 0) {
    const services = await prisma.serviceOneTime.findMany({
      where: { id: { in: oneTimeServiceIds }, status: { not: 'ARCHIVED' } },
      select: { id: true, name: true, serviceRate: true },
    });

    if (services.length !== oneTimeServiceIds.length) {
      return NextResponse.json(
        { error: 'One or more selected services were not found or are unavailable' },
        { status: 404 },
      );
    }

    for (const svc of services) {
      const rate = Number(svc.serviceRate);
      items.push({
        itemType: 'ONE_TIME',
        serviceName: svc.name,
        rate,
        discount: 0,
        total: rate,
        remarks: null,
      });
    }
  }

  // ─── Create job order in transaction ──────────────────────────
  const jobOrder = await prisma.$transaction(async tx => {
    const year = new Date().getFullYear();
    const prefix = `JO-${year}-`;

    const latest = await tx.jobOrder.findFirst({
      where: { jobOrderNumber: { startsWith: prefix } },
      orderBy: { jobOrderNumber: 'desc' },
      select: { jobOrderNumber: true },
    });

    let nextSeq = 1;
    if (latest) {
      const parts = latest.jobOrderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]!, 10);
      if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
    }
    const jobOrderNumber = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    return tx.jobOrder.create({
      data: {
        jobOrderNumber,
        leadId: lead.id,
        clientId,
        notes: notes ?? null,
        preparedById: session.user.id,
        datePrepared: new Date(),
        items: {
          create: items.map(item => ({
            itemType: item.itemType,
            serviceName: item.serviceName,
            rate: item.rate,
            discount: item.discount,
            total: item.total,
            remarks: item.remarks,
          })),
        },
      },
      include: {
        items: true,
      },
    });
  });

  void logActivity({
    userId: session.user.id,
    action: 'CREATED',
    entity: 'JobOrder',
    entityId: jobOrder.id,
    description: `Created job order ${jobOrder.jobOrderNumber} for client ${client.businessName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: jobOrder }, { status: 201 });
}
