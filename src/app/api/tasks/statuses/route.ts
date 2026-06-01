// src/app/api/tasks/statuses/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/tasks/statuses
 * Returns all DepartmentTaskStatus records.
 * Optional query param: ?departmentId=<number> to filter by department.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const departmentIdParam = searchParams.get("departmentId");

  const statuses = await prisma.departmentTaskStatus.findMany({
    where: departmentIdParam ? { departmentId: Number(departmentIdParam) } : undefined,
    select: {
      id: true,
      name: true,
      color: true,
      statusOrder: true,
      isEntryStep: true,
      isExitStep: true,
      departmentId: true,
    },
    orderBy: [{ departmentId: "asc" }, { statusOrder: "asc" }],
  });

  return NextResponse.json({ data: statuses });
}
