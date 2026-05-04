// src/app/api/v1/auth/me/route.ts
//
// GET /api/v1/auth/me
// Returns the authenticated ClientUser's profile and their assigned clients.
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

  // System key — no clientUser, return all active clients
  if (!apiKey.clientUser) {
    const allClients = await prisma.client.findMany({
      where: { active: true },
      select: {
        id: true,
        businessName: true,
        portalName: true,
        companyCode: true,
        active: true,
      },
      orderBy: { businessName: 'asc' },
    });
    return NextResponse.json({
      data: {
        id: null,
        name: "System",
        email: null,
        image: null,
        status: null,
        isSystemKey: true,
        clients: allClients,
      },
    });
  }

  const { clientUser } = apiKey;

  return NextResponse.json({
    data: {
      id: clientUser.id,
      name: clientUser.name,
      email: clientUser.email,
      image: clientUser.image,
      status: clientUser.status,
      isSystemKey: false,
      clients: clientUser.assignments.map((a) => ({
        id: a.client.id,
        businessName: a.client.businessName,
        portalName: a.client.portalName,
        companyCode: a.client.companyCode,
        active: a.client.active,
        role: a.role,
      })),
    },
  });
}
