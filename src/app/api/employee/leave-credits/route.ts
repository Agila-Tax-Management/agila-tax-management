// src/app/api/employee/leave-credits/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/employee/leave-credits
 * Returns the logged-in employee's active leave credit balances.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!session.employee) {
    return NextResponse.json({ error: "No employee profile found" }, { status: 403 });
  }

  const now = new Date();

  const credits = await prisma.employeeLeaveCredit.findMany({
    where: {
      employeeId: session.employee.id,
      isExpired: false,
      validFrom: { lte: now },
      expiresAt: { gte: now },
    },
    include: {
      leaveType: { select: { id: true, name: true, isPaid: true } },
    },
    orderBy: { leaveType: { name: "asc" } },
  });

  const data = credits.map((c) => ({
    id: c.id,
    leaveTypeId: c.leaveTypeId,
    leaveTypeName: c.leaveType.name,
    isPaid: c.leaveType.isPaid,
    allocated: parseFloat(c.allocated.toString()),
    used: parseFloat(c.used.toString()),
    balance: parseFloat(c.allocated.toString()) - parseFloat(c.used.toString()),
    validFrom: c.validFrom.toISOString().split("T")[0],
    expiresAt: c.expiresAt.toISOString().split("T")[0],
  }));

  return NextResponse.json({ data });
}
