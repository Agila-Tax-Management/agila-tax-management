// src/app/api/tasks/departments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/tasks/departments
 * Returns all departments (used for task filtering / department lookup).
 * Optional query param: ?clientId=<number>
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const clientIdParam = searchParams.get("clientId");

  const departments = await prisma.department.findMany({
    where: clientIdParam ? { clientId: Number(clientIdParam) } : undefined,
    select: { id: true, name: true, description: true, clientId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: departments });
}
