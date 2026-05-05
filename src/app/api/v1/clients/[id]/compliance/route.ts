// src/app/api/v1/clients/[id]/compliance/route.ts
//
// GET /api/v1/clients/{id}/compliance
// Returns compliance records for the client (filing status, deadlines, process status).
//
// Query params:
//   - year: number  filter by coverage year (e.g. 2026)
//   - type: ComplianceType  filter by type (EWT, VAT, PERCENTAGE, etc.)
//
// Auth: Bearer <ATMS_API_KEY> + X-Client-User-Id header

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { verifyClientAccess } from "@/lib/verify-client-access";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  const { id } = await params;
  const clientId = parseInt(id, 10);
  if (isNaN(clientId)) return NextResponse.json({ error: "Invalid client ID." }, { status: 400 });

  const access = await verifyClientAccess(request, clientId);
  if (!access) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const yearParam = request.nextUrl.searchParams.get("year");
  const typeParam = request.nextUrl.searchParams.get("type");

  const yearFilter = yearParam ? parseInt(yearParam, 10) : undefined;

  const records = await prisma.complianceRecord.findMany({
    where: {
      clientId,
      ...(yearFilter
        ? {
            coverageDate: {
              gte: new Date(`${yearFilter}-01-01`),
              lte: new Date(`${yearFilter}-12-31`),
            },
          }
        : {}),
      ...(typeParam
        ? {
            clientCompliance: {
              service: { complianceType: typeParam as never },
            },
          }
        : {}),
    },
    orderBy: { coverageDate: "desc" },
    select: {
      id: true,
      coverageDate: true,
      deadline: true,
      filingStatus: true,
      processStatus: true,
      isZeroFiling: true,
      totalTaxWithheld: true,
      filingFrequency: true,
      clientCompliance: {
        select: {
          service: {
            select: { id: true, name: true, complianceType: true },
          },
        },
      },
    },
  });

  return NextResponse.json({
    data: records.map((r) => ({
      ...r,
      totalTaxWithheld: Number(r.totalTaxWithheld),
    })),
  });
}
