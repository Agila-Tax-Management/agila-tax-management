// src/app/api/v1/clients/[id]/employees/route.ts
//
// GET /api/v1/clients/{id}/employees
// Returns all active employees for the client (basic info only).
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const employees = await prisma.employee.findMany({
    where: {
      softDelete: false,
      employments: { some: { clientId, employmentStatus: "ACTIVE" } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      nameExtension: true,
      employeeNo: true,
      active: true,
      employments: {
        where: { employmentStatus: "ACTIVE", clientId },
        take: 1,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          employmentType: true,
          employmentStatus: true,
          hireDate: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, title: true } },
        },
      },
    },
  });

  return NextResponse.json({
    data: employees.map((e) => ({
      id: e.id,
      firstName: e.firstName,
      middleName: e.middleName,
      lastName: e.lastName,
      nameExtension: e.nameExtension,
      employeeNo: e.employeeNo,
      active: e.active,
      employment: e.employments[0] ?? null,
    })),
  });
}
