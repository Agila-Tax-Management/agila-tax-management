// src/app/api/v1/announcements/route.ts
//
// GET /api/v1/announcements
//
// Returns active, non-expired announcements for the client portal.
// Authenticated via Bearer API key (Authorization: Bearer <key>).
//
// The client portal passes an optional ?audience= filter to get announcements
// targeted at a specific audience. If omitted, ALL_CLIENTS announcements are
// always included plus any audience that matches the client type.
//
// Query params:
//   audience  — optional: VAT_CLIENTS | NON_VAT_CLIENTS | ACTIVE_ONLY
//               When provided, returns ALL_CLIENTS + matching audience rows.
//               When omitted, returns ALL_CLIENTS only.
//   limit     — max results (default: 50, max: 100)

import { NextRequest, NextResponse } from 'next/server';
import { verifyClientApiToken } from '@/lib/verify-client-api-token';
import prisma from '@/lib/db';
import type { AnnouncementAudience } from '@/generated/prisma/client';

const VALID_AUDIENCES = new Set<string>(['VAT_CLIENTS', 'NON_VAT_CLIENTS', 'ACTIVE_ONLY']);

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = await verifyClientApiToken(request);
  if (!apiKey) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = request.nextUrl;
  const audienceParam = searchParams.get('audience') ?? '';
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));

  const now = new Date();

  // Build audience filter:
  // Always include ALL_CLIENTS. If client passes their type, include that too.
  const audienceFilter: AnnouncementAudience[] = ['ALL_CLIENTS'];
  if (VALID_AUDIENCES.has(audienceParam)) {
    audienceFilter.push(audienceParam as AnnouncementAudience);
  }

  const announcements = await prisma.announcement.findMany({
    where: {
      isActive: true,
      audience: { in: audienceFilter },
      publishedAt: { lte: now },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    },
    orderBy: [{ priority: 'desc' }, { publishedAt: 'desc' }],
    take: limit,
    select: {
      id: true,
      title: true,
      content: true,
      audience: true,
      priority: true,
      authorName: true,
      publishedAt: true,
      expiresAt: true,
    },
  });

  return NextResponse.json({ data: announcements });
}
