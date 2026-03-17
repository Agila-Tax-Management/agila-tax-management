// src/app/api/hr/employees/[id]/gov-ids/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { updateGovernmentIdsSchema } from "@/lib/schemas/hr";
import { logActivity, getRequestMeta } from "@/lib/activity-log";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/hr/employees/[id]/gov-ids
 */
export async function GET(_request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const govIds = await prisma.employeeGovernmentIds.findUnique({ where: { employeeId: empId } });
  if (!govIds) return NextResponse.json({ error: "Government IDs not found" }, { status: 404 });

  return NextResponse.json({ data: govIds });
}

/**
 * PATCH /api/hr/employees/[id]/gov-ids
 */
export async function PATCH(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const empId = parseInt(id, 10);
  if (isNaN(empId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateGovernmentIdsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const updated = await prisma.employeeGovernmentIds.upsert({
    where: { employeeId: empId },
    update: {
      sss: parsed.data.sss,
      pagibig: parsed.data.pagibig,
      philhealth: parsed.data.philhealth,
      tin: parsed.data.tin,
    },
    create: {
      employeeId: empId,
      sss: parsed.data.sss ?? null,
      pagibig: parsed.data.pagibig ?? null,
      philhealth: parsed.data.philhealth ?? null,
      tin: parsed.data.tin ?? null,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "UPDATED",
    entity: "EmployeeGovernmentIds",
    entityId: String(empId),
    description: `Updated government IDs for employee #${empId}`,
    ...getRequestMeta(request),
  });

  return NextResponse.json({ data: updated });
}
