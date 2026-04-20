// src/app/api/sales/packages/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/sales/packages
 * Returns all active service packages with their line items.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packages = await prisma.servicePackage.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    include: {
      items: {
        include: {
          service: {
            select: {
              id: true,
              name: true,
              billingType: true,
              frequency: true,
              serviceRate: true,
              isVatable: true,
            },
          },
        },
        orderBy: { id: "asc" },
      },
    },
  });

  return NextResponse.json({ data: packages });
}
