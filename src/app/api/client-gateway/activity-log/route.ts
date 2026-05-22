// src/app/api/client-gateway/activity-log/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSessionWithAccess } from '@/lib/session';
import prisma from '@/lib/db';
import { z } from 'zod';

/** Display categories derived from action + entity */
type LogDisplayCategory = 'Document' | 'Status' | 'Account' | 'Portal' | 'Filing';

function deriveCategory(action: string, entity: string): LogDisplayCategory {
  if (action === 'STATUS_CHANGE') return 'Status';
  if (action === 'IMPORTED' || action === 'EXPORTED') return 'Document';
  if (
    action === 'LOGIN' ||
    action === 'LOGOUT' ||
    entity === 'ClientUser' ||
    entity.toLowerCase().includes('portal') ||
    entity.toLowerCase().includes('session')
  )
    return 'Portal';
  if (
    action === 'SUBMITTED' ||
    entity.toLowerCase().includes('filing') ||
    entity.toLowerCase().includes('bir') ||
    entity.toLowerCase().includes('tax')
  )
    return 'Filing';
  return 'Account';
}

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  search: z.string().optional(),
  category: z
    .enum(['All', 'Document', 'Status', 'Account', 'Portal', 'Filing'])
    .default('All'),
});

/**
 * GET /api/client-gateway/activity-log
 *
 * Returns paginated activity logs for the Client Gateway module.
 * Scoped to entity types: Client, Branch.
 * Supports search (on description) and category filter.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rawParams = Object.fromEntries(request.nextUrl.searchParams.entries());
  const parsed = querySchema.safeParse(rawParams);
  const params = parsed.success ? parsed.data : { page: 1, limit: 25, search: undefined, category: 'All' as const };

  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  // Base filter: only client-gateway relevant entities
  const where: Record<string, unknown> = {
    entity: { in: ['Client', 'Branch'] },
  };

  if (search?.trim()) {
    where.description = { contains: search.trim(), mode: 'insensitive' };
  }

  const [rawLogs, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        action: true,
        entity: true,
        entityId: true,
        description: true,
        createdAt: true,
        // clientId FK is rarely populated by logActivity calls —
        // we resolve the client via entityId below instead.
        client: {
          select: { id: true, businessName: true, clientNo: true, companyCode: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
        clientUser: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  // Resolve client names via entityId for logs where clientId FK was not set.
  // logActivity calls store the numeric client id in entityId (as string),
  // but don't set the clientId relation field.
  const unresolvedIds = rawLogs
    .filter((l) => !l.client && l.entity === 'Client' && l.entityId)
    .map((l) => parseInt(l.entityId!, 10))
    .filter((id) => !isNaN(id));

  const extraClients =
    unresolvedIds.length > 0
      ? await prisma.client.findMany({
          where: { id: { in: unresolvedIds } },
          select: { id: true, businessName: true, clientNo: true, companyCode: true },
        })
      : [];

  const clientById = new Map(extraClients.map((c) => [c.id, c]));

  // Shape and derive category
  const data = rawLogs.map((log) => {
    const category = deriveCategory(log.action, log.entity);
    const performedBy = log.user?.name ?? log.clientUser?.name ?? 'System';

    // Prefer the FK-joined client, fall back to entityId lookup
    const resolvedClient =
      log.client ??
      (log.entity === 'Client' && log.entityId
        ? (clientById.get(parseInt(log.entityId, 10)) ?? null)
        : null);

    const clientName = resolvedClient?.businessName ?? null;
    const clientNo = resolvedClient?.clientNo ?? resolvedClient?.companyCode ?? null;

    return {
      id: log.id,
      clientId: resolvedClient?.id ?? null,
      clientNo,
      clientName,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId ?? null,
      description: log.description,
      performedBy,
      category,
      createdAt: log.createdAt.toISOString(),
    };
  });

  // Post-filter by category (server-side derived, not DB-stored)
  const categoryFilter = params.category;
  const filtered = categoryFilter === 'All' ? data : data.filter((d) => d.category === categoryFilter);

  return NextResponse.json({
    data: filtered,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
