// src/app/api/v1/auth/sign-out/route.ts
//
// POST /api/v1/auth/sign-out
// Invalidates a ClientUser session from the portal backend (server-to-server).
// Accepts either { sessionToken } or { userId } in the request body.
//   - sessionToken: invalidates the specific session matching that token
//   - userId: invalidates ALL active sessions for that user (full sign-out)
// Authenticated via Bearer API key (Authorization: Bearer <key>).

import { NextRequest, NextResponse } from "next/server";
import { verifyClientApiToken } from "@/lib/verify-client-api-token";
import prisma from "@/lib/db";
import { z } from "zod";

const bodySchema = z.union([
  z.object({ sessionToken: z.string().min(1) }),
  z.object({ userId: z.string().min(1) }),
]);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiKey = await verifyClientApiToken(request);
  if (!apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Provide either sessionToken or userId." },
      { status: 400 }
    );
  }

  if ("sessionToken" in parsed.data) {
    await prisma.clientSession.deleteMany({
      where: { token: parsed.data.sessionToken },
    });
  } else {
    // Invalidate all sessions for the user
    await prisma.clientSession.deleteMany({
      where: { userId: parsed.data.userId },
    });
  }

  return NextResponse.json({ ok: true });
}
