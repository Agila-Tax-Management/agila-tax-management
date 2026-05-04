// src/app/api/admin/settings/api-keys/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";
import { logActivity, getRequestMeta } from "@/lib/activity-log";
import { generateApiKey } from "@/lib/verify-client-api-token";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  expiresAt: z.string().datetime().optional(),
});

/**
 * GET /api/admin/settings/api-keys
 * Returns all ClientApiKey records (never exposes keyHash).
 */
export async function GET(_request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const keys = await prisma.clientApiKey.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      enabled: true,
      expiresAt: true,
      lastUsedAt: true,
      revokedAt: true,
      createdAt: true,
      updatedAt: true,
      clientUser: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  return NextResponse.json({ data: keys as typeof keys });
}

/**
 * POST /api/admin/settings/api-keys
 * Generates a new API key. Returns the plaintext key ONCE — never stored.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { name, expiresAt } = parsed.data;

  const { plaintext, prefix, hash } = generateApiKey();

  const apiKey = await prisma.clientApiKey.create({
    data: {
      name,
      keyHash: hash,
      keyPrefix: prefix,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      enabled: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  void logActivity({
    userId: session.user.id,
    action: "CREATED",
    entity: "ClientApiKey",
    entityId: apiKey.id,
    description: `Generated system API key "${name}"`,
    ...getRequestMeta(request),
  });

  // Return the plaintext key once — it is never stored
  return NextResponse.json({ data: { ...apiKey, plaintext } }, { status: 201 });
}
