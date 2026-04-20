// src/app/api/operation/clients/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/operation/clients
 * Returns all active clients with OM, owner account status, TSA url, and job order.
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      clientNo: true,
      businessName: true,
      businessEntity: true,
      createdAt: true,
      // Operations Manager (internal User + linked Employee for canonical name)
      operationsManager: {
        select: {
          id: true,
          name: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      },
      // Client Relation Officer = Account Officer (internal User + linked Employee)
      clientRelationOfficer: {
        select: {
          id: true,
          name: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      },
      // Owner ClientUser via assignments
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
              active: true,
            },
          },
        },
      },
      // Lead for signed TSA url
      lead: {
        select: {
          signedTsaUrl: true,
          signedJobOrderUrl: true,
        },
      },
      // Job Orders linked directly to this client
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

  const data = clients.map((c) => {
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

    return {
      id: c.id,
      clientNo: c.clientNo,
      businessName: c.businessName,
      businessEntity: c.businessEntity,
      onboardedDate: c.createdAt.toISOString(),
      // Operations Manager
      assignedOMId: c.operationsManager?.id ?? null,
      assignedOM: empName(c.operationsManager) ?? "—",
      // Account Officer (Client Relation Officer)
      assignedAOId: c.clientRelationOfficer?.id ?? null,
      assignedAO: empName(c.clientRelationOfficer),
      // Owner portal account
      ownerAccountId: ownerAssignment?.clientUser.id ?? null,
      ownerName: ownerAssignment?.clientUser.name ?? null,
      ownerEmail: ownerAssignment?.clientUser.email ?? null,
      ownerStatus: ownerAssignment?.clientUser.status ?? null,
      // Documents
      tsaUrl: c.lead?.signedTsaUrl ?? null,
      jobOrderNumber: latestJobOrder?.jobOrderNumber ?? null,
      jobOrderUrl: c.lead?.signedJobOrderUrl ?? null,
    };
  });

  return NextResponse.json({ data });
}
