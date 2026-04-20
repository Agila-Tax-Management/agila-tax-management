// src/app/api/operation/clients/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/operation/clients/[id]
 * Returns full detail for a single active client.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) {
    return NextResponse.json({ error: "Invalid client ID" }, { status: 400 });
  }

  const c = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      clientNo: true,
      businessName: true,
      businessEntity: true,
      active: true,
      createdAt: true,
      operationsManager: {
        select: {
          id: true,
          name: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      },
      clientRelationOfficer: {
        select: {
          id: true,
          name: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      },
      userAssignments: {
        where: { role: "OWNER" },
        take: 1,
        select: {
          clientUser: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
      },
      lead: {
        select: {
          signedTsaUrl: true,
          signedJobOrderUrl: true,
        },
      },
      jobOrders: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          jobOrderNumber: true,
          status: true,
        },
      },
    },
  });

  if (!c) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  const ownerAssignment = c.userAssignments[0] ?? null;
  const latestJobOrder = c.jobOrders[0] ?? null;

  const empName = (
    user: { name: string | null; employee: { firstName: string; lastName: string } | null } | null
  ): string | null => {
    if (!user) return null;
    if (user.employee) {
      const full = `${user.employee.firstName} ${user.employee.lastName}`.trim();
      if (full) return full;
    }
    return user.name;
  };

  return NextResponse.json({
    data: {
      id: c.id,
      clientNo: c.clientNo,
      businessName: c.businessName,
      businessEntity: c.businessEntity,
      active: c.active,
      onboardedDate: c.createdAt.toISOString(),
      assignedOMId: c.operationsManager?.id ?? null,
      assignedOM: empName(c.operationsManager) ?? "—",
      assignedAOId: c.clientRelationOfficer?.id ?? null,
      assignedAO: empName(c.clientRelationOfficer),
      ownerAccountId: ownerAssignment?.clientUser.id ?? null,
      ownerName: ownerAssignment?.clientUser.name ?? null,
      ownerEmail: ownerAssignment?.clientUser.email ?? null,
      ownerStatus: ownerAssignment?.clientUser.status ?? null,
      tsaUrl: c.lead?.signedTsaUrl ?? null,
      jobOrderNumber: latestJobOrder?.jobOrderNumber ?? null,
      jobOrderUrl: c.lead?.signedJobOrderUrl ?? null,
      jobOrderStatus: latestJobOrder?.status ?? null,
    },
  });
}
