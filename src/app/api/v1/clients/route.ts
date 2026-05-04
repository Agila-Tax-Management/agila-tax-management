// src/app/api/v1/clients/route.ts
//
// GET /api/v1/clients
// Returns all clients assigned to the authenticated ClientUser.
// If the key is a system key (no clientUser), returns all active clients.
// Authenticated via Bearer API key (Authorization: Bearer <key>).

import { NextRequest, NextResponse } from "next/server";
import { verifyClientApiToken } from "@/lib/verify-client-api-token";
import prisma from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = await verifyClientApiToken(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // System key — return all active clients
  if (!apiKey.clientUser) {
    const allClients = await prisma.client.findMany({
      where: { active: true },
      select: {
        id: true,
        businessName: true,
        portalName: true,
        companyCode: true,
        clientNo: true,
        businessEntity: true,
        branchType: true,
        active: true,
      },
      orderBy: { businessName: 'asc' },
    });
    return NextResponse.json({ data: allClients });
  }

  const clients = apiKey.clientUser.assignments.map((a) => ({
    id: a.client.id,
    businessName: a.client.businessName,
    portalName: a.client.portalName,
    companyCode: a.client.companyCode,
    clientNo: a.client.clientNo,
    businessEntity: a.client.businessEntity,
    branchType: a.client.branchType,
    active: a.client.active,
    role: a.role,
  }));

  return NextResponse.json({ data: clients });
}
