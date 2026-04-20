// src/app/api/operation/employees/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/operation/employees
 * Returns all active internal users (ADMIN + EMPLOYEE roles with linked employees)
 * for use in the Account Officer assignment dropdown.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: {
      active: true,
      role: { in: ["ADMIN", "EMPLOYEE", "SUPER_ADMIN"] },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
        },
      },
    },
  });

  const data = users.map((u) => ({
    id: u.id,
    name: u.name ?? `${u.employee?.firstName ?? ""} ${u.employee?.lastName ?? ""}`.trim(),
    email: u.email,
    role: u.role,
    employeeId: u.employee?.id ?? null,
    employeeNo: u.employee?.employeeNo ?? null,
  }));

  return NextResponse.json({ data });
}
