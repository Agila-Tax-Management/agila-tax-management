// src/app/api/operation/dashboard/near-deadline-tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getSessionWithAccess } from '@/lib/session';

/**
 * GET /api/operation/dashboard/near-deadline-tasks
 * Returns tasks with due dates within the next 7 days
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      select: {
        id: true,
        name: true,
        dueDate: true,
        priority: true,
        clientId: true,
        client: {
          select: {
            id: true,
            businessName: true,
          },
        },
        assignedToId: true,
        assignedTo: {
          select: {
            id: true,
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        status: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    const data = tasks.map((task) => ({
      id: task.id,
      name: task.name,
      dueDate: task.dueDate?.toISOString() ?? null,
      priority: task.priority,
      status: task.status
        ? { name: task.status.name, color: task.status.color ?? null }
        : null,
      client: task.client
        ? { id: task.client.id, businessName: task.client.businessName }
        : null,
      assignedTo: task.assignedTo?.user
        ? { id: task.assignedTo.id, name: task.assignedTo.user.name ?? 'N/A' }
        : null,
      department: task.department?.name ?? null,
    }));

    return NextResponse.json({ data });
  } catch (err) {
    console.error('[GET /api/operation/dashboard/near-deadline-tasks]', err);
    return NextResponse.json(
      { error: 'Failed to fetch near-deadline tasks' },
      { status: 500 },
    );
  }
}
