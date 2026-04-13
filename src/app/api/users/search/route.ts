// src/app/api/users/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

/**
 * GET /api/users/search
 * Search for active users by name or email (for approver selection)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limitStr = searchParams.get("limit") ?? "10";
  const limit = parseInt(limitStr, 10);

  if (isNaN(limit) || limit < 1 || limit > 50) {
    return NextResponse.json({ error: "Invalid limit (must be 1-50)" }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: {
      AND: [
        {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    take: limit,
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ data: users });
}
