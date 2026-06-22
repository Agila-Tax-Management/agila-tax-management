// src/app/api/hr/leave-types/reset-allocations/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess, getClientIdFromSession } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

/**
 * POST /api/hr/leave-types/reset-allocations
 * Resets the `allocated` field of all active (non-expired) EmployeeLeaveCredit
 * records to their leave type's current `defaultDays`.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clientId = await getClientIdFromSession();
  if (!clientId) return NextResponse.json({ error: "No active employment found" }, { status: 403 });

  const leaveTypes = await prisma.leaveType.findMany({
    where: { clientId },
    select: { id: true, defaultDays: true, name: true },
  });

  if (leaveTypes.length === 0) {
    return NextResponse.json({ data: { updated: 0 } });
  }

  let totalUpdated = 0;

  await prisma.$transaction(async (tx) => {
    for (const lt of leaveTypes) {
      const result = await tx.employeeLeaveCredit.updateMany({
        where: {
          leaveTypeId: lt.id,
          isExpired: false,
        },
        data: {
          allocated: lt.defaultDays,
        },
      });
      totalUpdated += result.count;
    }
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeLeaveCredit",
    entityId: "bulk",
    description: `Reset leave allocations to default days for ${totalUpdated} credit record(s)`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: { updated: totalUpdated } });
}
