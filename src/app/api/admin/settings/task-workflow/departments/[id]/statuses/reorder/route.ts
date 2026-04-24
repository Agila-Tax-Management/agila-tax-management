// src/app/api/admin/settings/task-workflow/departments/[id]/statuses/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { revalidateTag } from "next/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const reorderSchema = z.object({
  orders: z.array(
    z.object({
      statusId: z.number().int().positive(),
      statusOrder: z.number().int().positive(),
    })
  ).min(1),
});

/**
 * PATCH /api/admin/settings/task-workflow/departments/[id]/statuses/reorder
 * Bulk-updates statusOrder for all statuses in a department.
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const deptId = parseInt(id, 10);
  if (isNaN(deptId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  await prisma.$transaction(
    parsed.data.orders.map(({ statusId, statusOrder }) =>
      prisma.departmentTaskStatus.update({
        where: { id: statusId },
        data: { statusOrder },
      })
    )
  );

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "Department",
    entityId: String(deptId),
    description: `Reordered statuses for department #${deptId}`,
    ...getRequestMeta(request),
  });

  revalidateTag('task-departments', 'max');

  return NextResponse.json({ data: { success: true } });
}
