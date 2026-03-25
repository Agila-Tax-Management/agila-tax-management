// src/app/api/hr/leave-requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const patchSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().optional(),
});

/**
 * PATCH /api/hr/leave-requests/[id]
 * Approves or rejects a pending leave request.
 * Body: { action: "APPROVE" | "REJECT", rejectionReason?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams,
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const { id } = await params;

  const existing = await prisma.leaveRequest.findFirst({
    where: { id, clientId },
    include: {
      employee: { select: { firstName: true, lastName: true } },
    },
  });
  if (!existing) return NextResponse.json({ error: "Leave request not found" }, { status: 404 });

  if (existing.status !== "PENDING") {
    return NextResponse.json(
      { error: "Only pending requests can be approved or rejected." },
      { status: 409 },
    );
  }

  const body = await request.json() as unknown;
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { action, rejectionReason } = parsed.data;
  const newStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";

  const updated = await prisma.leaveRequest.update({
    where: { id },
    data: {
      status: newStatus,
      approvedById: session.user.id,
      approvedAt: new Date(),
      rejectionReason: action === "REJECT" ? (rejectionReason ?? null) : null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: action === "APPROVE" ? "APPROVED" : "REJECTED",
    entity: "LeaveRequest",
    entityId: id,
    description: `${action === "APPROVE" ? "Approved" : "Rejected"} leave request for ${existing.employee.firstName} ${existing.employee.lastName}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
