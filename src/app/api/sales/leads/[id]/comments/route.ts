// src/app/api/sales/leads/[id]/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSessionWithAccess } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

const createCommentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty").max(2000),
});

/**
 * POST /api/sales/leads/[id]/comments
 * Adds a new comment to a lead.
 */
export async function POST(request: NextRequest, { params }: Params): Promise<NextResponse> {
  const session = await getSessionWithAccess();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const leadId = parseInt(id, 10);
  if (isNaN(leadId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const existing = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 },
    );
  }

  const comment = await prisma.leadComment.create({
    data: {
      leadId,
      authorId: session.user.id,
      comment: parsed.data.comment,
    },
    include: {
      author: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json({ data: comment }, { status: 201 });
}
