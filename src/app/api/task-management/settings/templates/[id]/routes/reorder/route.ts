// src/app/api/task-management/settings/templates/[id]/routes/reorder/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

const reorderSchema = z.object({
  orders: z
    .array(
      z.object({
        routeId: z.number().int().positive(),
        routeOrder: z.number().int().min(1),
      })
    )
    .min(1, "Orders array is required"),
});

type Params = { params: Promise<{ id: string }> };

/**
 * PATCH /api/task-management/settings/templates/[id]/routes/reorder
 * Updates routeOrder for all provided route IDs in a single transaction.
 */
export async function PATCH(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const templateId = Number(id);
  if (isNaN(templateId)) return NextResponse.json({ error: "Invalid template ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = reorderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  await prisma.$transaction(
    parsed.data.orders.map(({ routeId, routeOrder }) =>
      prisma.taskTemplateRoute.update({
        where: { id: routeId },
        data: { routeOrder },
      })
    )
  );

  return NextResponse.json({ data: { success: true } });
}
